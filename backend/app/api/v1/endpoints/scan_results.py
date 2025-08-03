from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Dict, Any, Optional
from app.models.user import User
from app.models.webpage import WebPage
from app.models.scan_result import Violation
from app.core.auth import get_current_user

router = APIRouter()


@router.get("/")
async def get_scan_results(
    page: int = Query(1, ge=1, description="Номер страницы"),
    page_size: int = Query(20, ge=1, le=100, description="Размер страницы"),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Получение всех результатов сканирования с нарушениями"""
    try:
        # Подсчитываем общее количество страниц с нарушениями
        total_pages = await WebPage.filter(violations_found=True).count()
        
        # Вычисляем смещение для пагинации
        offset = (page - 1) * page_size
        
        # Получаем страницы с нарушениями с пагинацией
        pages_with_violations = await WebPage.filter(
            violations_found=True
        ).prefetch_related('contractor', 'violations__forbidden_word').order_by('-id').offset(offset).limit(page_size)
        
        results = []
        for page_obj in pages_with_violations:
            # Получаем нарушения для страницы
            violations = await Violation.filter(webpage=page_obj).prefetch_related('forbidden_word')
            
            violations_data = []
            for violation in violations:
                violations_data.append({
                    "id": violation.id,
                    "word_found": violation.word_found,
                    "context": violation.context,
                    "position": violation.position,
                    "severity": violation.severity,
                    "forbidden_word_id": violation.forbidden_word.id,
                    "forbidden_word_word": violation.forbidden_word.word,
                    "forbidden_word_category": violation.forbidden_word.category,
                    "forbidden_word_description": violation.forbidden_word.description,
                    "created_at": violation.created_at.isoformat() if violation.created_at else None,
                    "webpage": {
                        "id": page_obj.id,
                        "url": page_obj.url,
                        "title": page_obj.title,
                        "contractor": {
                            "id": page_obj.contractor.id,
                            "name": page_obj.contractor.name,
                            "domain": page_obj.contractor.domain,
                        }
                    }
                })
            
            results.append({
                "id": page_obj.id,
                "url": page_obj.url,
                "title": page_obj.title,
                "contractor_name": page_obj.contractor.name,
                "contractor_domain": page_obj.contractor.domain,
                "violations_count": page_obj.violations_count,
                "last_scanned": page_obj.last_scanned.isoformat() if page_obj.last_scanned else None,
                "violations": violations_data
            })
        
        # Вычисляем общее количество страниц
        total_pages_count = (total_pages + page_size - 1) // page_size
        
        return {
            "items": results,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total_items": total_pages,
                "total_pages": total_pages_count,
                "has_next": page < total_pages_count,
                "has_prev": page > 1
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting scan results: {str(e)}") 