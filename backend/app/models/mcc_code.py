from tortoise import fields, models
from datetime import datetime

class MCCCode(models.Model):
    id = fields.IntField(pk=True)
    code = fields.CharField(max_length=10, unique=True, description="MCC код")
    description = fields.CharField(max_length=255, description="Описание категории")
    category = fields.CharField(max_length=100, description="Категория")
    
    # Ключевые слова для классификации
    keywords = fields.JSONField(default=list, description="Ключевые слова для классификации")
    tags = fields.JSONField(default=list, description="Теги для классификации")
    
    # Веса для классификации
    keyword_weight = fields.FloatField(default=1.0, description="Вес ключевых слов")
    tag_weight = fields.FloatField(default=0.5, description="Вес тегов")
    
    # Настройки
    is_active = fields.BooleanField(default=True, description="Активен ли код")
    min_probability = fields.FloatField(default=0.7, description="Минимальная вероятность для классификации")
    
    # Метаданные
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)
    created_by = fields.ForeignKeyField("models.User", related_name="mcc_codes_created")
    
    class Meta:
        table = "mcc_codes"
        
    def __str__(self):
        return f"{self.code} - {self.description}" 