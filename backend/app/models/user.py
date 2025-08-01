from tortoise import fields, models
from datetime import datetime
import bcrypt


class User(models.Model):
    id = fields.IntField(pk=True)
    username = fields.CharField(max_length=255, unique=True, description="Имя пользователя")
    email = fields.CharField(max_length=255, unique=True, description="Email")
    full_name = fields.CharField(max_length=255, description="Полное имя")
    
    # Пароль (хешированный)
    hashed_password = fields.CharField(max_length=255, description="Хешированный пароль")
    
    # Роли и права
    role = fields.CharField(max_length=50, default="user", description="Роль пользователя")
    is_active = fields.BooleanField(default=True, description="Активен ли пользователь")
    is_admin = fields.BooleanField(default=False, description="Администратор")
    
    # Настройки уведомлений
    email_notifications = fields.BooleanField(default=True, description="Email уведомления")
    webhook_notifications = fields.BooleanField(default=False, description="Webhook уведомления")
    notification_email = fields.CharField(max_length=255, null=True, description="Email для уведомлений")
    
    # Метаданные
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)
    last_login = fields.DatetimeField(null=True, description="Последний вход")
    
    class Meta:
        table = "users"
        
    def __str__(self):
        return f"{self.full_name} ({self.username})"
    
    @classmethod
    def verify_password(cls, plain_password: str, hashed_password: str) -> bool:
        """Проверка пароля"""
        password_byte_enc = plain_password.encode('utf-8')
        hashed_password_byte_enc = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password=password_byte_enc, hashed_password=hashed_password_byte_enc)
    
    @classmethod
    def get_password_hash(cls, password: str) -> str:
        """Хеширование пароля"""
        pwd_bytes = password.encode('utf-8')
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(password=pwd_bytes, salt=salt)
        return hashed_password.decode('utf-8')