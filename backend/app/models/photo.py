from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class PhotoMetadataBase(BaseModel):
    """照片元数据基础模型"""
    user_id: str
    filename: str
    datetime: datetime
    gps_lat: Optional[float] = None
    gps_lon: Optional[float] = None
    has_gps: bool = False
    icloud_photo_id: Optional[str] = None
    is_duplicate: bool = False
    is_screenshot: bool = False

class PhotoMetadataCreate(PhotoMetadataBase):
    """照片元数据创建模型"""
    pass

class PhotoMetadata(PhotoMetadataBase):
    """照片元数据完整模型"""
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
