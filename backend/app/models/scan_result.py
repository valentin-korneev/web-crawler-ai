from tortoise import fields, models
from datetime import datetime

class ScanResult(models.Model):
    id = fields.IntField(pk=True)
    contractor = fields.ForeignKeyField("models.Contractor", related_name="scan_results")
    
    # Результаты сканирования
    status = fields.CharField(max_length=20, default="pending", description="Статус сканирования")
    pages_scanned = fields.IntField(default=0, description="Количество просканированных страниц")
    pages_with_violations = fields.IntField(default=0, description="Страниц с нарушениями")
    
    # Найденные нарушения
    violations_data = fields.JSONField(default=list, description="Найденные нарушения")
    mcc_classification = fields.JSONField(default=dict, description="Результаты MCC классификации")
    
    # Временные метки
    started_at = fields.DatetimeField(auto_now_add=True, description="Время начала сканирования")
    completed_at = fields.DatetimeField(null=True, description="Время завершения")
    
    # Ошибки
    error_message = fields.TextField(null=True, description="Сообщение об ошибке")
    
    # Метаданные
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)
    
    class Meta:
        table = "scan_results"
        
    def __str__(self):
        return f"Scan {self.id} for {self.contractor.domain}"

class Violation(models.Model):
    id = fields.IntField(pk=True)
    webpage = fields.ForeignKeyField("models.WebPage", related_name="violations")
    forbidden_word = fields.ForeignKeyField("models.ForbiddenWord", related_name="violations")
    
    # Детали нарушения
    word_found = fields.CharField(max_length=255, description="Найденное слово")
    context = fields.TextField(description="Контекст нарушения (окружающий текст)")
    position = fields.IntField(description="Позиция в тексте")
    severity = fields.CharField(max_length=20, default="medium", description="Уровень критичности")
    
    # Метаданные
    created_at = fields.DatetimeField(auto_now_add=True)
    
    class Meta:
        table = "violations"
        
    def __str__(self):
        return f"Violation: {self.word_found} on {self.webpage.url}" 