from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr
from datetime import datetime

class UserBase(BaseModel):
    """用户基础模型"""
    icloud_email: EmailStr
    nickname: str
    protagonist_features: Optional[Dict[str, Any]] = None

class UserCreate(UserBase):
    """用户创建模型"""
    icloud_password: str

class UserLogin(BaseModel):
    """用户登录模型"""
    icloud_email: EmailStr
    icloud_password: str

class User(UserBase):
    """用户完整模型"""
    id: str
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class UserInDB(User):
    """数据库中的用户模型"""
    hashed_password: str
