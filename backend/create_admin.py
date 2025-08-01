#!/usr/bin/env python3
import asyncio
from app.core.database import init_db
from app.models.user import User
from app.core.logging import logger


async def create_admin():
    """Создание администратора"""
    _username = 'huginn'

    try:
        await logger.info("Starting admin user creation...")
        
        # Инициализируем подключение к базе данных
        await init_db()
        
        # Проверяем, существует ли уже администратор
        existing_admin = await User.filter(username=_username).first()
        
        if existing_admin:
            await logger.info("Администратор уже существует!")
            return
        
        # Создаем администратора
        admin_user = await User.create(
            username=_username,
            email=f'{_username}@huginn.by',
            full_name='Администратор системы',
            hashed_password=User.get_password_hash('muninn'),
            is_active=True,
            is_admin=True
        )
        
        await logger.info("Администратор создан успешно!")
        await logger.info(f"Username: {admin_user.username}")
        await logger.info(f"Email: {admin_user.email}")
    except Exception as e:
        await logger.error(f"Ошибка создания администратора: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(create_admin())
