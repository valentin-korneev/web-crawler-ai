from tortoise import fields, models
from datetime import datetime

class ForbiddenWord(models.Model):
    id = fields.IntField(pk=True)
    word = fields.CharField(max_length=255, unique=True, description="Запрещенное слово")
    category = fields.CharField(max_length=100, description="Категория слова")
    description = fields.TextField(null=True, description="Описание")
    severity = fields.CharField(max_length=20, default="medium", description="Уровень критичности")
    
    # Настройки поиска
    is_active = fields.BooleanField(default=True, description="Активно ли слово")
    case_sensitive = fields.BooleanField(default=False, description="Учитывать регистр")
    use_regex = fields.BooleanField(default=False, description="Использовать регулярные выражения")
    
    # Метаданные
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)
    created_by = fields.ForeignKeyField("models.User", related_name="forbidden_words_created")
    
    class Meta:
        table = "forbidden_words"
        
    def __str__(self):
        return f"{self.word} ({self.category})" 