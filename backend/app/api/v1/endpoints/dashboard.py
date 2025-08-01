from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from app.core.auth import get_current_user
from app.models.user import User
from app.models.contractor import Contractor
from app.models.forbidden_word import ForbiddenWord
from app.models.webpage import WebPage
from app.models.scan_result import Violation

router = APIRouter()

@router.get("/stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_user)) -> Dict[str, Any]:
    """Получение статистики для dashboard"""
    try:
        # Подсчитываем количество контрагентов
        contractors_count = await Contractor.filter(is_active=True).count()
        
        # Подсчитываем количество запрещенных слов
        forbidden_words_count = await ForbiddenWord.filter(is_active=True).count()
        
        # Подсчитываем количество отсканированных страниц
        scanned_pages_count = await WebPage.filter(last_scanned__isnull=False).count()
        
        # Подсчитываем общее количество нарушений
        violations_count = await Violation.all().count()
        
        # Подсчитываем статистику по контрагентам
        contractors_stats = await Contractor.filter(is_active=True).all()
        total_violations = sum(contractor.violations_found for contractor in contractors_stats)
        total_scanned_pages = sum(contractor.scanned_pages for contractor in contractors_stats)
        
        return {
            "contractors": contractors_count,
            "forbidden_words": forbidden_words_count,
            "scanned_pages": scanned_pages_count,
            "violations": violations_count,
            "total_violations_by_contractors": total_violations,
            "total_scanned_pages_by_contractors": total_scanned_pages
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting dashboard stats: {str(e)}") 