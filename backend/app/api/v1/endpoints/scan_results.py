from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from app.models.user import User
from app.models.webpage import WebPage
from app.models.scan_result import Violation
from app.core.auth import get_current_user

router = APIRouter()


@router.get("/")
async def get_scan_results(current_user: User = Depends(get_current_user)) -> List[Dict[str, Any]]:
    """Получение всех результатов сканирования с нарушениями"""
    try:
        # Получаем все страницы с нарушениями
        pages_with_violations = await WebPage.filter(
            violations_found=True
        ).prefetch_related('contractor', 'violations__forbidden_word').order_by('-id')
        
        results = []
        for page in pages_with_violations:
            # Получаем нарушения для страницы
            violations = await Violation.filter(webpage=page).prefetch_related('forbidden_word')
            
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
                        "id": page.id,
                        "url": page.url,
                        "title": page.title,
                        "contractor": {
                            "id": page.contractor.id,
                            "name": page.contractor.name,
                            "domain": page.contractor.domain,
                        }
                    }
                })
            
            results.append({
                "id": page.id,
                "url": page.url,
                "title": page.title,
                "contractor_name": page.contractor.name,
                "contractor_domain": page.contractor.domain,
                "violations_count": page.violations_count,
                "last_scanned": page.last_scanned.isoformat() if page.last_scanned else None,
                "violations": violations_data
            })
        
        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting scan results: {str(e)}") 