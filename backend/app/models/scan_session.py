from tortoise import fields
from tortoise.models import Model
from datetime import datetime
from typing import Optional


class ScanSession(Model):
    id = fields.IntField(pk=True)
    contractor = fields.ForeignKeyField('models.Contractor', related_name='scan_sessions')
    status = fields.CharField(max_length=20, default='running')  # running, completed, failed
    pages_scanned = fields.IntField(default=0)
    pages_with_violations = fields.IntField(default=0)
    total_violations = fields.IntField(default=0)
    started_at = fields.DatetimeField(auto_now_add=True)
    completed_at = fields.DatetimeField(null=True)
    error_message = fields.TextField(null=True)
    
    class Meta:
        table = "scan_sessions"
    
    def __str__(self):
        return f"ScanSession {self.id} - {self.contractor.name} ({self.status})"
    
    @property
    def duration(self) -> Optional[float]:
        """Длительность сканирования в секундах"""
        if self.completed_at and self.started_at:
            return (self.completed_at - self.started_at).total_seconds()
        return None 