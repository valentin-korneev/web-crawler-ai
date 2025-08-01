#!/usr/bin/env python3
import asyncio
from app.core.config import settings
from app.core.database import init_db
from app.core.logging import logger


async def init_database():
    """Инициализация базы данных"""
    try:
        await logger.info("Starting database initialization...")
        
        # Инициализируем подключение к базе данных
        await init_db()
        
        # Импортируем aerich после инициализации базы данных
        from aerich import Command
        
        # Создаем команду aerich
        command = Command(
            tortoise_config={
                'connections': {
                    'default': settings.database_url
                },
                'apps': {
                    'models': {
                        'models': [
                            'aerich.models',
                            'app.models.user',
                            'app.models.contractor',
                            'app.models.forbidden_word',
                            'app.models.mcc_code',
                            'app.models.scan_result',
                            'app.models.webpage',
                            'app.models.scan_session',
                        ],
                        'default_connection': 'default',
                    }
                },
                'use_tz': False,
                'timezone': 'UTC'
            },
            app='models'
        )
        
        # Проверяем, нужно ли инициализировать aerich
        try:
            await command.init()
            await logger.info("Aerich initialized successfully")
        except Exception as e:
            if "already initialized" in str(e):
                await logger.info("Aerich already initialized")
            else:
                await logger.warning(f"Aerich init warning: {e}")
        
        # Применяем миграции
        try:
            await command.upgrade()
            await logger.info("Database migrations applied successfully")
        except Exception as e:
            await logger.warning(f"Migration warning: {e}")
        
        await logger.info("Database initialization completed")
        
    except Exception as e:
        await logger.error(f"Database initialization failed: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(init_database())
