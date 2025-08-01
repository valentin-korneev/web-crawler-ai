from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.models.contractor import Contractor
from app.models.user import User
from app.models.webpage import WebPage
from app.models.scan_result import Violation
from app.core.auth import get_current_user
from app.schemas.contractor import ContractorCreate, ContractorUpdate, ContractorResponse
from app.schemas.violation import WebPageDetailResponse
from app.services.queue_service import queue_service


router = APIRouter()


@router.get("/", response_model=List[ContractorResponse])
async def get_contractors(current_user: User = Depends(get_current_user)):
    """Получение списка контрагентов"""
    contractors = await Contractor.all().order_by('id')
    return [ContractorResponse.from_orm(contractor) for contractor in contractors]

@router.post("/", response_model=ContractorResponse)
async def create_contractor(
    contractor_data: ContractorCreate,
    current_user: User = Depends(get_current_user)
):
    """Создание нового контрагента"""
    contractor = await Contractor.create(
        **contractor_data.dict(),
        created_by_id=current_user.id
    )
    return ContractorResponse.from_orm(contractor)

@router.get("/{contractor_id}", response_model=ContractorResponse)
async def get_contractor(contractor_id: int, current_user: User = Depends(get_current_user)):
    """Получение контрагента по ID"""
    contractor = await Contractor.get_or_none(id=contractor_id)
    if not contractor:
        raise HTTPException(status_code=404, detail="Contractor not found")
    return ContractorResponse.from_orm(contractor)

@router.put("/{contractor_id}", response_model=ContractorResponse)
async def update_contractor(
    contractor_id: int,
    contractor_data: ContractorUpdate,
    current_user: User = Depends(get_current_user)
):
    """Обновление контрагента"""
    contractor = await Contractor.get_or_none(id=contractor_id)
    if not contractor:
        raise HTTPException(status_code=404, detail="Contractor not found")
    
    for field, value in contractor_data.dict(exclude_unset=True).items():
        setattr(contractor, field, value)
    
    await contractor.save()
    return ContractorResponse.from_orm(contractor)

@router.delete("/{contractor_id}")
async def delete_contractor(contractor_id: int, current_user: User = Depends(get_current_user)):
    """Удаление контрагента"""
    contractor = await Contractor.get_or_none(id=contractor_id)
    if not contractor:
        raise HTTPException(status_code=404, detail="Contractor not found")
    
    await contractor.delete()
    return {"message": "Contractor deleted successfully"}

@router.post("/{contractor_id}/scan")
async def start_scan(contractor_id: int, current_user: User = Depends(get_current_user)):
    """Запуск сканирования контрагента"""
    contractor = await Contractor.get_or_none(id=contractor_id)
    if not contractor:
        raise HTTPException(status_code=404, detail="Contractor not found")
    
    # Создаем новую сессию сканирования
    from app.models.scan_session import ScanSession
    session = await ScanSession.create(
        contractor=contractor,
        status='running'
    )
    
    # Добавляем задачу в очередь с session_id
    await queue_service.publish_scan_task(
        contractor_id=contractor_id,
        url=contractor.domain if contractor.domain.startswith('http') else f"https://{contractor.domain}",
        depth=0,
        session_id=session.id
    )
    
    return {
        "message": "Scan task added to queue",
        "session_id": session.id
    }

@router.get("/{contractor_id}/pages")
async def get_contractor_pages(contractor_id: int, current_user: User = Depends(get_current_user)):
    """Получение страниц контрагента"""
    contractor = await Contractor.get_or_none(id=contractor_id)
    if not contractor:
        raise HTTPException(status_code=404, detail="Contractor not found")
    
    pages = await WebPage.filter(contractor=contractor).order_by('-id')
    
    return [
        {
            "id": page.id,
            "url": page.url,
            "title": page.title,
            "meta_description": page.meta_description,
            "status": page.status,
            "http_status": page.http_status,
            "response_time": page.response_time,
            "violations_found": page.violations_found,
            "violations_count": page.violations_count,
            "last_scanned": page.last_scanned.isoformat() if page.last_scanned else None,
            "created_at": page.created_at.isoformat() if page.created_at else None
        }
        for page in pages
    ]

@router.get("/{contractor_id}/pages/{page_id}", response_model=WebPageDetailResponse)
async def get_page_details(
    contractor_id: int, 
    page_id: int, 
    current_user: User = Depends(get_current_user)
):
    """Получение деталей страницы с нарушениями"""
    contractor = await Contractor.get_or_none(id=contractor_id)
    if not contractor:
        raise HTTPException(status_code=404, detail="Contractor not found")
    
    page = await WebPage.get_or_none(id=page_id, contractor=contractor)
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    # Получаем нарушения для страницы
    violations = await Violation.filter(webpage=page).prefetch_related('forbidden_word')
    
    # Формируем ответ с нарушениями
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
            "created_at": violation.created_at
        })
    
    return {
        "id": page.id,
        "url": page.url,
        "title": page.title,
        "meta_description": page.meta_description,
        "status": page.status,
        "http_status": page.http_status,
        "response_time": page.response_time,
        "violations_found": page.violations_found,
        "violations_count": page.violations_count,
        "last_scanned": page.last_scanned,
        "created_at": page.created_at,
        "violations": violations_data
    } 