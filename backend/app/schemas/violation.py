from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ViolationResponse(BaseModel):
    id: int
    word_found: str
    context: str
    position: int
    severity: str
    forbidden_word_id: int
    forbidden_word_word: str
    forbidden_word_category: str
    forbidden_word_description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class WebPageDetailResponse(BaseModel):
    id: int
    url: str
    title: Optional[str]
    meta_description: Optional[str]
    status: str
    http_status: Optional[int]
    response_time: Optional[float]
    violations_found: bool
    violations_count: int
    last_scanned: Optional[datetime]
    created_at: datetime
    violations: list[ViolationResponse] = []

    class Config:
        from_attributes = True 