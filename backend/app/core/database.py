from tortoise import Tortoise
from app.core.config import settings

TORTOISE_ORM = {
    'connections': {
        'default': settings.database_url
    },
    'apps': {
        'models': {
            'models': ['aerich.models', 'app.models.user', 'app.models.contractor', 'app.models.forbidden_word', 'app.models.mcc_code', 'app.models.scan_result', 'app.models.webpage', 'app.models.scan_session'],
            'default_connection': 'default',
        }
    },
    'use_tz': False,
    'timezone': 'UTC'
}

async def init_db():
    """Инициализация базы данных"""
    await Tortoise.init(config=TORTOISE_ORM)
    await Tortoise.generate_schemas()

async def close_db():
    """Закрытие соединений с базой данных"""
    await Tortoise.close_connections() 