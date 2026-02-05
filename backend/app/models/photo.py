from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

class PhotoFeatures(BaseModel):
    """照片特征模型"""
    visual_features: Optional[List[float]] = None
    semantic_features: Optional[List[float]] = None
    aesthetic_score: float = 0.0
    information_score: float = 0.0
    error: Optional[str] = None

class CompressedInfo(BaseModel):
    """压缩信息模型"""
    compressed_size: int = 0
    width: int = 0
    height: int = 0
    format: str = "webp"
    error: Optional[str] = None

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
    is_download: bool = False
    image_hash: Optional[str] = None
    features: Optional[PhotoFeatures] = None
    compressed_info: Optional[CompressedInfo] = None

class PhotoMetadataCreate(PhotoMetadataBase):
    """照片元数据创建模型"""
    pass

class PhotoMetadata(PhotoMetadataBase):
    """照片元数据完整模型"""
    id: str
    created_at: datetime
    updated_at: datetime
    original_size: int = 0
    
    class Config:
        from_attributes = True
