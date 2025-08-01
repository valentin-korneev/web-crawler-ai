from tortoise import fields, models
from datetime import datetime
from typing import Optional

class Contractor(models.Model):
    id = fields.IntField(pk=True)
    name = fields.CharField(max_length=255, description="Название контрагента")
    domain = fields.CharField(max_length=255, unique=True, description="Домен сайта")
    description = fields.TextField(null=True, description="Описание")
    
    # Настройки проверки
    is_active = fields.BooleanField(default=True, description="Активен ли контрагент")
    check_schedule = fields.CharField(max_length=50, default="daily", description="Расписание проверок")
    last_check = fields.DatetimeField(null=True, description="Последняя проверка")
    next_check = fields.DatetimeField(null=True, description="Следующая проверка")
    
    # Настройки парсинга (опциональные)
    max_pages = fields.IntField(null=True, description="Максимальное количество страниц для проверки")
    max_depth = fields.IntField(null=True, description="Максимальная глубина обхода")
    
    # Классификация
    mcc_code = fields.CharField(max_length=10, null=True, description="MCC код")
    mcc_probability = fields.FloatField(default=0.0, description="Вероятность MCC классификации")
    
    # Статистика
    total_pages = fields.IntField(default=0, description="Общее количество найденных страниц")
    scanned_pages = fields.IntField(default=0, description="Количество отсканированных страниц")
    violations_found = fields.IntField(default=0, description="Общее количество найденных нарушений")
    total_violations = fields.IntField(default=0, description="Общее количество нарушений")
    scan_sessions_count = fields.IntField(default=0, description="Количество проведенных сканирований")
    last_session_violations = fields.IntField(default=0, description="Количество нарушений в последней сессии")
    
    # Метаданные
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)
    created_by = fields.ForeignKeyField("models.User", related_name="contractors_created")
    
    class Meta:
        table = "contractors"
        
    def __str__(self):
        return f"{self.name} ({self.domain})"
    
    @property
    def is_due_for_scan(self) -> bool:
        """Проверяет, нужно ли сканировать контрагента"""
        if not self.next_check:
            return True
        return datetime.utcnow() >= self.next_check
    
    def get_scan_interval_hours(self) -> int:
        """Возвращает интервал сканирования в часах"""
        schedule_map = {
            'hourly': 1,
            'daily': 24,
            'weekly': 168,
            'monthly': 720
        }
        return schedule_map.get(self.check_schedule, 24) 