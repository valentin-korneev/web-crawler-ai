from tortoise import fields, models
from datetime import datetime

class WebPage(models.Model):
    id = fields.IntField(pk=True)
    
    # Связь с контрагентом
    contractor = fields.ForeignKeyField('models.Contractor', related_name='webpages')
    
    # Связь с сессией сканирования
    scan_session = fields.ForeignKeyField('models.ScanSession', related_name='webpages', null=True)
    
    # URL и метаданные
    url = fields.CharField(max_length=2048, description="URL страницы")
    title = fields.CharField(max_length=500, null=True, description="Заголовок страницы")
    meta_description = fields.CharField(max_length=1000, null=True, description="Meta description")
    
    # Контент
    content = fields.TextField(description="HTML контент страницы")
    text_content = fields.TextField(description="Текстовый контент без HTML")
    
    # Статус сканирования
    status = fields.CharField(
        max_length=20, 
        default='pending',
        description="Статус: pending, scanning, completed, failed"
    )
    http_status = fields.IntField(null=True, description="HTTP статус код")
    response_time = fields.FloatField(null=True, description="Время ответа в секундах")
    
    # Нарушения
    violations_found = fields.BooleanField(default=False, description="Найдены нарушения")
    violations_count = fields.IntField(default=0, description="Количество нарушений")
    
    # Временные метки
    last_scanned = fields.DatetimeField(null=True, description="Время последнего сканирования")
    next_scan = fields.DatetimeField(null=True, description="Время следующего сканирования")
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)
    
    class Meta:
        table = "webpages"
        
    def __str__(self):
        return f"{self.url} ({self.contractor.domain})"
    
    @property
    def is_due_for_scan(self) -> bool:
        """Проверяет, нужно ли сканировать страницу"""
        if not self.next_scan:
            return True
        return datetime.utcnow() >= self.next_scan 