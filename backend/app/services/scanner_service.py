import asyncio
import re
import aiohttp
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

from app.models.contractor import Contractor
from app.models.webpage import WebPage
from app.models.forbidden_word import ForbiddenWord
from app.models.scan_session import ScanSession
from app.models.scan_result import Violation
from app.services.queue_service import queue_service
from app.core.logging import logger


class ScannerService:
    def __init__(self):
        self.session: aiohttp.ClientSession | None = None
        
    async def start_session(self):
        """Создание HTTP сессии"""
        if not self.session:
            connector = aiohttp.TCPConnector(limit=10, limit_per_host=5)
            self.session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=30),
                connector=connector,
                headers={
                    'User-Agent': 'HuginnBot/1.0 (+https://huginn.local)'
                }
            )
    
    async def close_session(self):
        """Закрытие HTTP сессии"""
        if self.session:
            await self.session.close()
            self.session = None
    
    async def scan_contractor(self, contractor_id: int, start_url: str | None = None, session_id: int = None):
        """Сканирование контрагента - обрабатывает одну страницу и добавляет новые ссылки в очередь"""
        await self.start_session()
        
        try:
            contractor = await Contractor.get(id=contractor_id)
            if not contractor.is_active:
                await logger.info(f"⏸️ Contractor {contractor_id} is not active, skipping scan")
                return
            
            # Определяем начальный URL
            if not start_url:
                start_url = f"https://{contractor.domain}"
            
            await logger.info(f"🔍 Scanning contractor {contractor_id} ({contractor.name}) - URL: {start_url}, session_id: {session_id}")
            
            # Получаем сессию сканирования
            scan_session = None
            if session_id:
                scan_session = await ScanSession.get_or_none(id=session_id)
                if not scan_session:
                    await logger.error(f"❌ Scan session {session_id} not found")
                    return
                await logger.info(f"📝 Using existing scan session {scan_session.id}")
                # Проверяем, что scan_session загружен правильно
                await logger.info(f"🔍 Scan session type: {type(scan_session)}, id: {scan_session.id}")
            else:
                await logger.warning(f"⚠️ No session_id provided, scanning without session tracking")
            
            # Получаем глобальные запрещенные слова
            forbidden_words = await ForbiddenWord.filter(is_active=True)
            forbidden_words_data = [
                {
                    'word': word.word,
                    'use_regex': word.use_regex,
                    'case_sensitive': word.case_sensitive,
                    'severity': word.severity
                }
                for word in forbidden_words
            ]
            await logger.info(f"📝 Found {len(forbidden_words_data)} forbidden words for scanning")
            
            # Обычное сканирование - проверяем TTL
            # Если есть session_id, проверяем только в рамках этой сессии
            if scan_session:
                existing_page = await WebPage.filter(
                    contractor=contractor,
                    url=start_url,
                    scan_session=scan_session
                ).first()
                
                if existing_page:
                    await logger.info(f"⏭️ Page {start_url} already scanned in session {scan_session.id}, skipping")
                    return
            else:
                # Если нет session_id, используем старую логику TTL
                existing_page = await WebPage.filter(
                    contractor=contractor,
                    url=start_url,
                    last_scanned__gte=datetime.utcnow() - timedelta(hours=1)
                ).first()
                
                if existing_page:
                    await logger.info(f"⏭️ Page {start_url} was recently scanned, skipping")
                    return
            
            # Сканируем одну страницу
            await self._scan_single_page(
                contractor=contractor,
                url=start_url,
                forbidden_words=forbidden_words_data,
                scan_session=scan_session,
                max_pages=contractor.max_pages or 100
            )
            
            # Завершаем сессию сканирования
            if scan_session:
                # Обновляем статистику сессии
                if scan_session:
                    # Подсчитываем количество страниц в сессии
                    pages_in_session = await WebPage.filter(scan_session=scan_session).count()
                    
                    # Подсчитываем количество нарушений в сессии
                    violations_in_session = await Violation.filter(webpage__scan_session=scan_session).count()
                    
                    # Подсчитываем количество страниц с нарушениями в сессии
                    pages_with_violations = await WebPage.filter(
                        scan_session=scan_session,
                        violations_found=True
                    ).count()
                    
                    scan_session.pages_scanned = pages_in_session
                    scan_session.pages_with_violations = pages_with_violations
                    scan_session.total_violations = violations_in_session
                    scan_session.status = 'completed'
                    scan_session.completed_at = datetime.utcnow()
                    await scan_session.save()
                    
                    await logger.info(f"📊 Session {scan_session.id} completed: {pages_in_session} pages, {violations_in_session} violations")
                
                await logger.info(f"✅ Scan completed for contractor {contractor.name}")
            
            # Обновляем статус контрагента
            contractor.last_check = datetime.utcnow()
            contractor.next_check = datetime.utcnow() + timedelta(hours=contractor.get_scan_interval_hours())
            await contractor.save()
            
            await logger.info(f"✅ Completed scanning page {start_url} for contractor {contractor_id}")
            
        except Exception as e:
            await logger.error(f"❌ Error scanning contractor {contractor_id}: {e}")
            await logger.exception("Full traceback:")
            
            # Обновляем статус сессии на failed
            if scan_session:
                scan_session.status = 'failed'
                scan_session.completed_at = datetime.utcnow()
                scan_session.error_message = str(e)
                await scan_session.save()
                await logger.info(f"❌ Marked scan session {scan_session.id} as failed")
            
            raise
        finally:
            # НЕ закрываем сессию - она должна жить для всех запросов
            pass
    
    async def _scan_single_page(
        self,
        contractor: Contractor,
        url: str,
        forbidden_words: List[Dict[str, Any]],
        max_pages: int,
        scan_session: ScanSession = None
    ):
        """Сканирование одной страницы"""
        try:
            await logger.info(f"📄 Fetching page: {url}")
            
            # Проверяем TTL для этой страницы
            # Если есть session_id, проверяем только в рамках этой сессии
            if scan_session:
                existing_page = await WebPage.filter(
                    contractor=contractor,
                    url=url,
                    scan_session=scan_session
                ).first()
                
                if existing_page:
                    await logger.info(f"⏭️ Page {url} already scanned in session {scan_session.id}, skipping")
                    return
            else:
                # Если нет session_id, используем старую логику TTL
                existing_page = await WebPage.filter(
                    contractor=contractor,
                    url=url,
                    last_scanned__gte=datetime.utcnow() - timedelta(hours=1)
                ).first()
                
                if existing_page:
                    await logger.info(f"⏭️ Page {url} was recently scanned, skipping")
                    return
            
            # Сканируем страницу
            page_data = await self._fetch_page(url)
            if not page_data:
                await logger.warning(f"⚠️ Failed to fetch page: {url}")
                return
            
            await logger.info(f"📊 Page fetched successfully: {url} (HTTP {page_data.get('http_status')}, {page_data.get('response_time', 0):.2f}s)")
            
            # Сохраняем страницу
            webpage = await self._save_webpage(contractor, url, page_data, scan_session)
            await logger.info(f"💾 Page saved to database: {url}")
            
            # Проверяем на нарушения
            violations = await self._check_violations(page_data, forbidden_words)
            if violations:
                await logger.warning(f"🚨 Found {len(violations)} violations on page: {url}")
                await self._save_violations(webpage, violations)
                await queue_service.publish_violation_notification({
                    "contractor_id": contractor.id,
                    "contractor_name": contractor.name,
                    "url": url,
                    "violations": violations
                })
            else:
                await logger.info(f"✅ No violations found on page: {url}")
            
            # Извлекаем ссылки и добавляем их в очередь
            links = await self._extract_links(page_data['html'], contractor.domain)
            await logger.info(f"🔗 Extracted {len(links)} links from page: {url}")
            
            # Проверяем общее количество страниц контрагента
            total_pages = await WebPage.filter(contractor=contractor).count()
            
            added_to_queue = 0
            for link in links:
                if total_pages + added_to_queue >= max_pages:
                    await logger.info(f"⏹️ Reached max pages limit ({max_pages}) for contractor {contractor.id}")
                    break
                
                # Проверяем, существует ли уже страница
                # Если есть session_id, проверяем только в рамках этой сессии
                if scan_session:
                    existing_page = await WebPage.filter(contractor=contractor, url=link, scan_session=scan_session).first()
                else:
                    existing_page = await WebPage.filter(contractor=contractor, url=link).first()
                
                if not existing_page:
                    # Добавляем задачу в очередь
                    await queue_service.publish_scan_task(
                        contractor_id=contractor.id,
                        url=link,
                        depth=0,
                        session_id=scan_session.id if scan_session else None
                    )
                    added_to_queue += 1
                    await logger.debug(f"📤 Added to queue: {link}")
            
            await logger.info(f"📤 Added {added_to_queue} new pages to scan queue for contractor {contractor.id}")
            
        except Exception as e:
            await logger.error(f"❌ Error scanning page {url}: {e}")
            await logger.exception("Full traceback:")
    
    async def _fetch_page(self, url: str) -> Dict[str, Any] | None:
        """Получение страницы"""
        try:
            start_time = datetime.utcnow()
            
            await logger.debug(f"🌐 Making HTTP request to: {url}")
            async with self.session.get(url, allow_redirects=True) as response:
                response_time = (datetime.utcnow() - start_time).total_seconds()
                
                if response.status != 200:
                    await logger.warning(f"⚠️ HTTP {response.status} for {url}")
                    return None
                
                # Проверяем Content-Type
                content_type = response.headers.get('content-type', '').lower()
                
                # Если это не HTML/текст, пропускаем
                if not any(ct in content_type for ct in ['text/html', 'text/plain', 'application/xhtml+xml']):
                    await logger.info(f"⏭️ Skipping non-HTML content: {content_type} for {url}")
                    return None
                
                try:
                    content = await response.text()
                except UnicodeDecodeError as e:
                    await logger.warning(f"⚠️ Unicode decode error for {url}: {e}")
                    return None
                
                content_length = len(content)
                
                await logger.debug(f"📥 Received {content_length} bytes from {url}")
                
                # Парсим HTML
                soup = BeautifulSoup(content, 'html.parser')
                
                # Извлекаем текст
                text_content = soup.get_text(separator=' ', strip=True)
                text_length = len(text_content)
                
                # Извлекаем метаданные
                title = soup.find('title')
                title_text = title.get_text().strip() if title else None
                
                meta_desc = soup.find('meta', attrs={'name': 'description'})
                description = meta_desc.get('content') if meta_desc else None
                
                await logger.debug(f"📝 Extracted {text_length} characters of text from {url}")
                
                return {
                    'html': content,
                    'text': text_content,
                    'title': title_text,
                    'description': description,
                    'http_status': response.status,
                    'response_time': response_time,
                    'url': url
                }
                
        except Exception as e:
            await logger.error(f"❌ Error fetching {url}: {e}")
            return None
    
    async def _save_webpage(self, contractor: Contractor, url: str, page_data: Dict[str, Any], scan_session: Optional['ScanSession'] = None) -> WebPage:
        """Сохранение веб-страницы"""
        from app.models.webpage import WebPage
        
        # Проверяем, существует ли уже такая страница в рамках текущей сессии
        if scan_session:
            webpage = await WebPage.filter(
                contractor=contractor,
                url=url,
                scan_session=scan_session
            ).first()
        else:
            # Если нет сессии, ищем по контрагенту и URL
            webpage = await WebPage.filter(
                contractor=contractor,
                url=url
            ).first()
        
        created = webpage is None
        
        if created:
            # Создаем новую страницу
            webpage = await WebPage.create(
                contractor=contractor,
                url=url,
                title=page_data.get('title'),
                meta_description=page_data.get('description'),
                content=page_data['html'],
                text_content=page_data['text'],
                status='completed',
                http_status=page_data.get('http_status'),
                response_time=page_data.get('response_time'),
                last_scanned=datetime.utcnow(),
                scan_session=scan_session
            )
            await logger.info(f"📝 Created new page: {url} in session {scan_session.id if scan_session else 'None'}")
        else:
            # Обновляем существующую страницу
            await logger.info(f"🔄 Updating existing page: {url}")
            webpage.title = page_data.get('title')
            webpage.meta_description = page_data.get('description')
            webpage.content = page_data['html']
            webpage.text_content = page_data['text']
            webpage.status = 'completed'
            webpage.http_status = page_data.get('http_status')
            webpage.response_time = page_data.get('response_time')
            webpage.last_scanned = datetime.utcnow()
            
            # Если страница не была привязана к сессии, привязываем
            if scan_session and not webpage.scan_session:
                webpage.scan_session = scan_session
                await logger.info(f"🔗 Linked page {url} to session {scan_session.id}")
            
            await webpage.save()
        
        return webpage
    
    async def _check_violations(self, page_data: Dict[str, Any], forbidden_words: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Проверка на нарушения"""
        violations = []
        text = page_data['text']
        text_lower = text.lower()
        
        await logger.info(f"🔍 Checking violations on page {page_data.get('url', 'unknown')}")
        await logger.info(f"📝 Text length: {len(text)} characters")
        await logger.info(f"📋 Found {len(forbidden_words)} forbidden words to check")
        
        for word_data in forbidden_words:
            await logger.info(f"🔍 Checking: '{word_data['word']}' (regex: {word_data.get('use_regex', '?')}, case_sensitive: {word_data.get('case_sensitive', '?')})")
            word = word_data['word']
            use_regex = word_data.get('use_regex', False)
            case_sensitive = word_data.get('case_sensitive', False)
            
            search_text = text if case_sensitive else text_lower
            search_word = word if case_sensitive else word.lower()
            
            await logger.info(f"🔍 Checking: '{word}' (regex: {use_regex}, case_sensitive: {case_sensitive})")
            
            if use_regex:
                try:
                    # Используем регулярное выражение
                    # Если case_sensitive=True, не используем re.IGNORECASE
                    flags = 0 if case_sensitive else re.IGNORECASE
                    pattern = re.compile(search_word, flags)
                    matches = pattern.finditer(search_text)
                    
                    match_count = 0
                    for match in matches:
                        # Извлекаем контекст
                        start = max(0, match.start() - 50)
                        end = min(len(search_text), match.end() + 50)
                        context = search_text[start:end]
                        
                        violations.append({
                            'word': word,
                            'position': match.start(),
                            'context': context,
                            'url': page_data.get('url', ''),
                            'matched_text': match.group()  # Добавляем найденный текст
                        })
                        
                        match_count += 1
                        await logger.info(f"  ✅ Found regex violation: '{match.group()}' for pattern '{word}'")
                    
                    if match_count == 0:
                        await logger.info(f"  ❌ No regex matches found for pattern '{word}'")
                        
                except re.error as e:
                    await logger.warning(f"  ❌ Error in regex '{word}': {e}")
                    continue
            else:
                # Простой поиск подстроки
                if search_word in search_text:
                    # Находим все вхождения
                    matches = re.finditer(re.escape(search_word), search_text)
                    match_count = 0
                    for match in matches:
                        # Извлекаем контекст
                        start = max(0, match.start() - 50)
                        end = min(len(search_text), match.end() + 50)
                        context = search_text[start:end]
                        
                        violations.append({
                            'word': word,
                            'position': match.start(),
                            'context': context,
                            'url': page_data.get('url', ''),
                            'matched_text': match.group()
                        })
                        
                        match_count += 1
                        await logger.info(f"  ✅ Found word violation: '{match.group()}' for word '{word}'")
                    
                    if match_count == 0:
                        await logger.info(f"  ❌ No word matches found for '{word}'")
                else:
                    await logger.info(f"  ❌ Word '{word}' not found in text")
        
        await logger.info(f"🎯 Found {len(violations)} total violations on page {page_data.get('url', 'unknown')}")
        return violations
    
    async def _recalculate_contractor_stats(self, contractor: Contractor):
        """Пересчет статистики контрагента"""
        from app.models.scan_result import Violation
        from app.models.scan_session import ScanSession
        
        # Общее количество нарушений
        total_violations = await Violation.filter(webpage__contractor=contractor).count()
        
        # Количество сканирований (сессий)
        scan_sessions_count = await ScanSession.filter(contractor=contractor).count()
        
        # Количество нарушений в последней сессии
        last_session = await ScanSession.filter(contractor=contractor).order_by('-started_at').first()
        last_session_violations = 0
        if last_session:
            last_session_violations = await Violation.filter(webpage__scan_session=last_session).count()
        
        # Обновляем статистику контрагента
        contractor.total_violations = total_violations
        contractor.scan_sessions_count = scan_sessions_count
        contractor.last_session_violations = last_session_violations
        await contractor.save()
        
        await logger.info(f"📊 Updated contractor stats: {contractor.name} - Total violations: {total_violations}, Sessions: {scan_sessions_count}, Last session violations: {last_session_violations}")

    async def _save_violations(self, webpage: WebPage, violations: List[Dict[str, Any]]):
        """Сохранение нарушений"""
        from app.models.scan_result import Violation
        from app.models.forbidden_word import ForbiddenWord
        
        if not violations:
            return
        
        webpage.violations_found = True
        webpage.violations_count = len(violations)
        await webpage.save()
        
        # Сохраняем каждое нарушение в базу данных
        for violation_data in violations:
            # Находим соответствующее запрещенное слово
            forbidden_word = await ForbiddenWord.get_or_none(word=violation_data['word'])
            if forbidden_word:
                # Проверяем, существует ли уже такое нарушение на этой странице
                # (по позиции и найденному слову)
                existing_violation = await Violation.filter(
                    webpage=webpage,
                    forbidden_word=forbidden_word,
                    position=violation_data['position'],
                    word_found=violation_data.get('matched_text', violation_data['word'])
                ).first()
                
                if not existing_violation:
                    await Violation.create(
                        webpage=webpage,
                        forbidden_word=forbidden_word,
                        word_found=violation_data.get('matched_text', violation_data['word']),
                        context=violation_data['context'],
                        position=violation_data['position'],
                        severity=forbidden_word.severity
                    )
                    await logger.debug(f"💾 Created new violation: '{violation_data.get('matched_text', violation_data['word'])}' at position {violation_data['position']}")
                else:
                    await logger.debug(f"⏭️ Skipped duplicate violation: '{violation_data.get('matched_text', violation_data['word'])}' at position {violation_data['position']}")
        
        # Пересчитываем статистику контрагента
        contractor = webpage.contractor
        await self._recalculate_contractor_stats(contractor)
        
        await logger.info(f"💾 Saved violations for page {webpage.url}")
    
    async def _extract_links(self, html: str, domain: str) -> List[str]:
        """Извлечение ссылок из HTML"""
        soup = BeautifulSoup(html, 'html.parser')
        links = []
        
        for a_tag in soup.find_all('a', href=True):
            href = a_tag['href']
            
            # Обрабатываем относительные и абсолютные ссылки
            if href.startswith('/'):
                full_url = f"https://{domain}{href}"
            elif href.startswith('http'):
                # Проверяем, что ссылка ведет на тот же домен
                parsed = urlparse(href)
                if parsed.netloc == domain:
                    full_url = href
                else:
                    continue
            else:
                continue
            
            # Фильтруем нежелательные ссылки
            if any(skip in full_url.lower() for skip in ['#', 'javascript:', 'mailto:', 'tel:']):
                continue
            
            links.append(full_url)
        
        return list(set(links))  # Убираем дубликаты

# Глобальный экземпляр сервиса
scanner_service = ScannerService() 