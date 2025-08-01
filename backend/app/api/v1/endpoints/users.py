from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.models.user import User
from app.core.auth import get_current_user

router = APIRouter()

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role: str
    is_active: bool
    is_admin: bool
    email_notifications: bool
    webhook_notifications: bool
    notification_email: Optional[str]
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime]

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email_notifications: Optional[bool] = None
    webhook_notifications: Optional[bool] = None
    notification_email: Optional[str] = None

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Получить информацию о текущем пользователе"""
    user = await User.get_or_none(id=current_user["user_id"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    return user

@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_data: UserUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Обновить информацию о текущем пользователе"""
    user = await User.get_or_none(id=current_user["user_id"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    update_data = user_data.dict(exclude_unset=True)
    await user.update_from_dict(update_data)
    await user.save()
    return user

@router.get("/", response_model=List[UserResponse])
async def get_users(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = False,
    current_user: dict = Depends(get_current_user)
):
    """Получить список пользователей (только для админов)"""
    # Проверяем права администратора
    user = await User.get_or_none(id=current_user["user_id"])
    if not user or not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав"
        )
    
    query = User.all()
    if active_only:
        query = query.filter(is_active=True)
    
    users = await query.order_by('id').offset(skip).limit(limit)
    return users

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Получить пользователя по ID (только для админов)"""
    # Проверяем права администратора
    user = await User.get_or_none(id=current_user["user_id"])
    if not user or not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав"
        )
    
    target_user = await User.get_or_none(id=user_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    return target_user 