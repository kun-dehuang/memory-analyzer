from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime

class PromptBase(BaseModel):
    """提示词基础模型"""
    name: str
    content: str
    type: str  # phase1, phase2, protagonist
    description: Optional[str] = None
    variables: Optional[List[str]] = None

class PromptCreate(PromptBase):
    """提示词创建模型"""
    prompt_group_id: str

class Prompt(PromptBase):
    """提示词完整模型"""
    id: str
    prompt_group_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class PromptGroupBase(BaseModel):
    """提示词组基础模型"""
    name: str
    description: Optional[str] = None

class PromptGroupCreate(PromptGroupBase):
    """提示词组创建模型"""
    prompts: Optional[List[PromptCreate]] = None

class PromptGroup(PromptGroupBase):
    """提示词组完整模型"""
    id: str
    prompts: List[Prompt]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
