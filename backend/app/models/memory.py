from typing import List, Dict, Any, Optional, Tuple
from pydantic import BaseModel
from datetime import datetime

class MemoryRecordBase(BaseModel):
    """记忆记录基础模型"""
    user_id: str
    prompt_group_id: str
    phase1_results: Optional[List[Dict[str, Any]]] = None
    phase2_result: Optional[Dict[str, Any]] = None
    phase2_results: Optional[List[Dict[str, Any]]] = None  # 存储多个版本的Phase 2结果
    status: str  # pending, processing, completed, failed, needs_password
    error_message: Optional[str] = None

class MemoryRecordCreate(MemoryRecordBase):
    """记忆记录创建模型"""
    status: Optional[str] = None
    phase1_results: Optional[List[Dict[str, Any]]] = None
    phase2_result: Optional[Dict[str, Any]] = None
    phase2_results: Optional[List[Dict[str, Any]]] = None
    error_message: Optional[str] = None
    icloud_password: Optional[str] = None

class MemoryRecord(MemoryRecordBase):
    """记忆记录完整模型"""
    id: str
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    image_count: int = 0
    time_range: Optional[Tuple[str, str]] = None
    stats: Optional[Dict[str, Any]] = None
    used_photos: Optional[List[str]] = None  # 存储使用的图片ID列表
    
    class Config:
        from_attributes = True
