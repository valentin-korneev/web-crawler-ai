from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from datetime import datetime
from app.models.user import User
from app.models.contractor import Contractor
from app.models.scan_session import ScanSession
from app.models.webpage import WebPage
from app.models.scan_result import Violation
from app.core.auth import get_current_user
from app.services.queue_service import queue_service

router = APIRouter()


@router.get("/")
async def get_scan_sessions(
    contractor_id: Optional[int] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Получение списка сессий сканирования"""
    try:
        query = ScanSession.all().prefetch_related('contractor')
        
        if contractor_id:
            query = query.filter(contractor_id=contractor_id)
        if status:
            query = query.filter(status=status)
        
        sessions = await query.order_by('-id')
        
        return [
            {
                "id": session.id,
                "contractor_id": session.contractor.id,
                "contractor_name": session.contractor.name,
                "contractor_domain": session.contractor.domain,
                "status": session.status,
                "pages_scanned": session.pages_scanned,
                "pages_with_violations": session.pages_with_violations,
                "total_violations": session.total_violations,
                "started_at": session.started_at.isoformat() if session.started_at else None,
                "completed_at": session.completed_at.isoformat() if session.completed_at else None,
                "duration": session.duration,
                "error_message": session.error_message,
            }
            for session in sessions
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting scan sessions: {str(e)}")


@router.get("/{session_id}")
async def get_scan_session(
    session_id: int,
    current_user: User = Depends(get_current_user)
):
    """Получение деталей сессии сканирования"""
    try:
        session = await ScanSession.get_or_none(id=session_id).prefetch_related('contractor')
        if not session:
            raise HTTPException(status_code=404, detail="Scan session not found")
        
        # Получаем страницы для этой сессии
        pages = await WebPage.filter(scan_session=session).order_by('-id')
        
        pages_data = []
        for page in pages:
            violations = await Violation.filter(webpage=page).prefetch_related('forbidden_word')
            pages_data.append({
                "id": page.id,
                "url": page.url,
                "title": page.title,
                "status": page.status,
                "http_status": page.http_status,
                "response_time": page.response_time,
                "violations_found": page.violations_found,
                "violations_count": page.violations_count,
                "last_scanned": page.last_scanned.isoformat() if page.last_scanned else None,
                "violations": [
                    {
                        "id": v.id,
                        "word_found": v.word_found,
                        "context": v.context,
                        "position": v.position,
                        "severity": v.severity,
                        "forbidden_word_word": v.forbidden_word.word,
                        "forbidden_word_category": v.forbidden_word.category,
                    }
                    for v in violations
                ]
            })
        
        return {
            "id": session.id,
            "contractor_id": session.contractor.id,
            "contractor_name": session.contractor.name,
            "contractor_domain": session.contractor.domain,
            "status": session.status,
            "pages_scanned": session.pages_scanned,
            "pages_with_violations": session.pages_with_violations,
            "total_violations": session.total_violations,
            "started_at": session.started_at.isoformat() if session.started_at else None,
            "completed_at": session.completed_at.isoformat() if session.completed_at else None,
            "duration": session.duration,
            "error_message": session.error_message,
            "pages": pages_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting scan session: {str(e)}")


@router.post("/{contractor_id}/start")
async def start_scan_session(
    contractor_id: int,
    current_user: User = Depends(get_current_user)
):
    """Запуск новой сессии сканирования для контрагента"""
    try:
        contractor = await Contractor.get_or_none(id=contractor_id)
        if not contractor:
            raise HTTPException(status_code=404, detail="Contractor not found")
        
        # Создаем новую сессию сканирования
        session = await ScanSession.create(
            contractor=contractor,
            status='running'
        )
        
        # Добавляем задачу в очередь с session_id
        await queue_service.publish_scan_task(
            contractor_id=contractor_id,
            url=f"https://{contractor.domain}",
            depth=0,
            session_id=session.id
        )
        
        return {
            "message": "Scan session started",
            "session_id": session.id,
            "contractor_id": contractor_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting scan session: {str(e)}")


@router.delete("/{session_id}")
async def delete_scan_session(
    session_id: int,
    current_user: User = Depends(get_current_user)
):
    """Удаление сессии сканирования"""
    try:
        session = await ScanSession.get_or_none(id=session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Scan session not found")
        
        # Удаляем связанные страницы и нарушения
        pages = await WebPage.filter(scan_session=session)
        for page in pages:
            await Violation.filter(webpage=page).delete()
        await pages.delete()
        
        # Удаляем сессию
        await session.delete()
        
        return {"message": "Scan session deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting scan session: {str(e)}") 