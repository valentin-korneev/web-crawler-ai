from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.models.mcc_code import MCCCode
from app.models.user import User
from app.core.auth import get_current_user

router = APIRouter()

class MCCCodeCreate(BaseModel):
    code: str
    description: str
    category: str
    keywords: List[str] = []
    tags: List[str] = []
    keyword_weight: float = 1.0
    tag_weight: float = 0.5
    min_probability: float = 0.7

class MCCCodeUpdate(BaseModel):
    description: Optional[str] = None
    category: Optional[str] = None
    keywords: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    keyword_weight: Optional[float] = None
    tag_weight: Optional[float] = None
    is_active: Optional[bool] = None
    min_probability: Optional[float] = None

class MCCCodeResponse(BaseModel):
    id: int
    code: str
    description: str
    category: str
    keywords: List[str]
    tags: List[str]
    keyword_weight: float
    tag_weight: float
    is_active: bool
    min_probability: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

@router.post("/", response_model=MCCCodeResponse)
async def create_mcc_code(
    mcc_data: MCCCodeCreate,
    current_user: User = Depends(get_current_user)
):
    """Создать новый MCC код"""
    existing = await MCCCode.filter(code=mcc_data.code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MCC код уже существует"
        )
    
    mcc_code = await MCCCode.create(
        **mcc_data.dict(),
        created_by_id=current_user.id
    )
    return mcc_code

@router.get("/", response_model=List[MCCCodeResponse])
async def get_mcc_codes(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    active_only: bool = False
):
    """Получить список MCC кодов"""
    query = MCCCode.all()
    
    if category:
        query = query.filter(category=category)
    if active_only:
        query = query.filter(is_active=True)
    
    codes = await query.order_by('id').offset(skip).limit(limit)
    return codes

@router.get("/{code_id}", response_model=MCCCodeResponse)
async def get_mcc_code(code_id: int):
    """Получить MCC код по ID"""
    code = await MCCCode.get_or_none(id=code_id)
    if not code:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="MCC код не найден"
        )
    return code

@router.put("/{code_id}", response_model=MCCCodeResponse)
async def update_mcc_code(
    code_id: int,
    code_data: MCCCodeUpdate,
    current_user: User = Depends(get_current_user)
):
    """Обновить MCC код"""
    code = await MCCCode.get_or_none(id=code_id)
    if not code:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="MCC код не найден"
        )
    
    update_data = code_data.dict(exclude_unset=True)
    await code.update_from_dict(update_data)
    await code.save()
    return code

@router.delete("/{code_id}")
async def delete_mcc_code(
    code_id: int,
    current_user: User = Depends(get_current_user)
):
    """Удалить MCC код"""
    code = await MCCCode.get_or_none(id=code_id)
    if not code:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="MCC код не найден"
        )
    
    await code.delete()
    return {"message": "MCC код удален"}

@router.get("/categories/list")
async def get_categories():
    """Получить список всех категорий"""
    categories = await MCCCode.all().distinct().values_list("category", flat=True)
    return {"categories": list(categories)} 