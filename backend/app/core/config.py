import os
from pydantic_settings import BaseSettings


_development_env = 'development'
_production_env = 'production'


class Settings(BaseSettings):
    # Environment
    environment: str = os.getenv('ENVIRONMENT', _production_env)
    debug: bool = environment.lower() == _development_env
    log_level: str = 'DEBUG' if debug else 'INFO'
    log_format: str = os.getenv('LOG_FORMAT', '%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    
    # Database
    database_url: str = 'postgres://{user}:{password}@{host}:{port}/{name}'.format(
        user=os.getenv('DATABASE_USER'),
        password=os.getenv('DATABASE_PASS'),
        host=os.getenv('DATABASE_HOST'),
        port=os.getenv('DATABASE_PORT'),
        name=os.getenv('DATABASE_NAME'),
    )
    
    # MQ
    mq_url: str = 'amqp://{user}:{password}@{host}:{port}/'.format(
        user=os.getenv('MQ_USER'),
        password=os.getenv('MQ_PASS'),
        host=os.getenv('MQ_HOST'),
        port=os.getenv('MQ_PORT'),
    )
    
    # JWT
    jwt_secret: str = os.getenv('JWT_SECRET', 'your-secret-key-here-change-in-production')
    jwt_algorithm: str = os.getenv('JWT_ALGORITHM', 'HS256')
    jwt_expire_minutes: int = int(os.getenv('JWT_EXPIRE_MINUTES', '30'))
    
    # Notification settings
    notification_email_enabled: bool = os.getenv('NOTIFICATION_EMAIL_ENABLED', 'true').lower() == 'true'
    notification_webhook_enabled: bool = os.getenv('NOTIFICATION_WEBHOOK_ENABLED', 'false').lower() == 'true'

settings = Settings() 