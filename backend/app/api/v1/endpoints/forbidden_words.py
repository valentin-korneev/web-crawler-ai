from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from pydantic import BaseModel
from datetime import datetime

from app.models.forbidden_word import ForbiddenWord
from app.models.user import User
from app.core.auth import get_current_user

router = APIRouter()

class ForbiddenWordCreate(BaseModel):
    word: str
    category: str
    description: str | None = None
    severity: str = 'medium'
    case_sensitive: bool = False
    use_regex: bool = False

class ForbiddenWordUpdate(BaseModel):
    word: str | None = None
    category: str | None = None
    description: str | None = None
    severity: str | None = None
    is_active: bool | None = None
    case_sensitive: bool | None = None
    use_regex: bool | None = None

class ForbiddenWordResponse(BaseModel):
    id: int
    word: str
    category: str
    description: str | None
    severity: str
    is_active: bool
    case_sensitive: bool
    use_regex: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

@router.post('/', response_model=ForbiddenWordResponse)
async def create_forbidden_word(
    word_data: ForbiddenWordCreate,
    current_user: User = Depends(get_current_user)
):
    """Создать новое запрещенное слово"""
    existing = await ForbiddenWord.filter(word=word_data.word).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Запрещенное слово уже существует'
        )
    
    forbidden_word = await ForbiddenWord.create(
        **word_data.dict(),
        created_by_id=current_user.id
    )
    return forbidden_word

@router.get('/', response_model=List[ForbiddenWordResponse])
async def get_forbidden_words(
    skip: int = 0,
    limit: int = 100,
    category: str | None = None,
    active_only: bool = False
):
    """Получить список запрещенных слов"""
    query = ForbiddenWord.all()
    
    if category:
        query = query.filter(category=category)
    if active_only:
        query = query.filter(is_active=True)
    
    words = await query.order_by('id').offset(skip).limit(limit)
    return words

@router.get('/{word_id}', response_model=ForbiddenWordResponse)
async def get_forbidden_word(word_id: int):
    """Получить запрещенное слово по ID"""
    word = await ForbiddenWord.get_or_none(id=word_id)
    if not word:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Запрещенное слово не найдено'
        )
    return word

@router.put('/{word_id}', response_model=ForbiddenWordResponse)
async def update_forbidden_word(
    word_id: int,
    word_data: ForbiddenWordUpdate,
    current_user: User = Depends(get_current_user)
):
    """Обновить запрещенное слово"""
    word = await ForbiddenWord.get_or_none(id=word_id)
    if not word:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Запрещенное слово не найдено'
        )
    
    update_data = word_data.dict(exclude_unset=True)
    await word.update_from_dict(update_data)
    await word.save()
    return word

@router.delete('/{word_id}')
async def delete_forbidden_word(
    word_id: int,
    current_user: User = Depends(get_current_user)
):
    """Удалить запрещенное слово"""
    word = await ForbiddenWord.get_or_none(id=word_id)
    if not word:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Запрещенное слово не найдено'
        )
    
    await word.delete()
    return {'message': 'Запрещенное слово удалено'}

@router.get('/categories/list')
async def get_categories():
    """Получить список всех категорий"""
    categories = await ForbiddenWord.all().distinct().values_list('category', flat=True)
    return {'categories': list(categories)} 