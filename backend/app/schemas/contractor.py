from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ContractorCreate(BaseModel):
    name: str
    domain: str
    description: Optional[str] = None
    check_schedule: str = 'daily'
    max_pages: Optional[int] = None
    max_depth: Optional[int] = None

class ContractorUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    check_schedule: Optional[str] = None
    max_pages: Optional[int] = None
    max_depth: Optional[int] = None

class ContractorResponse(BaseModel):
    id: int
    name: str
    domain: str
    description: Optional[str]
    is_active: bool
    check_schedule: str
    last_check: Optional[datetime]
    next_check: Optional[datetime]
    max_pages: Optional[int]
    max_depth: Optional[int]
    mcc_code: Optional[str]
    mcc_probability: float
    total_pages: int
    scanned_pages: int
    violations_found: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 