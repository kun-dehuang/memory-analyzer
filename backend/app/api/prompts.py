from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime

from app.models.prompt import PromptGroup, PromptGroupCreate, Prompt, PromptCreate
from app.models.user import User
from app.api.auth import get_current_user
from app.config.database import prompt_groups_collection, prompts_collection

router = APIRouter()


@router.get("/groups", response_model=List[PromptGroup])
async def get_prompt_groups(current_user: User = Depends(get_current_user)):
    """获取所有提示词组"""
    groups = []
    async for group in prompt_groups_collection.find():
        # 获取该组的所有提示词
        group_prompts = []
        async for prompt in prompts_collection.find({"prompt_group_id": str(group["_id"])}):
            prompt_dict = {
                "id": str(prompt["_id"]),
                "name": prompt["name"],
                "content": prompt["content"],
                "type": prompt["type"],
                "description": prompt.get("description"),
                "variables": prompt.get("variables"),
                "prompt_group_id": prompt["prompt_group_id"],
                "created_at": prompt["created_at"],
                "updated_at": prompt["updated_at"]
            }
            group_prompts.append(Prompt(**prompt_dict))
        
        # 构建提示词组
        group_dict = {
            "id": str(group["_id"]),
            "name": group["name"],
            "description": group.get("description"),
            "prompts": group_prompts,
            "created_at": group["created_at"],
            "updated_at": group["updated_at"]
        }
        groups.append(PromptGroup(**group_dict))
    return groups


@router.post("/groups", response_model=PromptGroup)
async def create_prompt_group(
    group_create: PromptGroupCreate,
    current_user: User = Depends(get_current_user)
):
    """创建提示词组"""
    # 检查是否已存在同名组
    existing_group = await prompt_groups_collection.find_one({"name": group_create.name})
    if existing_group:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="提示词组名称已存在"
        )
    
    # 创建提示词组
    group_data = {
        "name": group_create.name,
        "description": group_create.description,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    # 插入数据库
    group_result = await prompt_groups_collection.insert_one(group_data)
    group_data["_id"] = str(group_result.inserted_id)
    
    # 创建提示词
    group_prompts = []
    if group_create.prompts:
        for prompt_create in group_create.prompts:
            prompt_data = {
                "name": prompt_create.name,
                "content": prompt_create.content,
                "type": prompt_create.type,
                "description": prompt_create.description,
                "variables": prompt_create.variables,
                "prompt_group_id": group_data["_id"],
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            prompt_result = await prompts_collection.insert_one(prompt_data)
            prompt_data["_id"] = str(prompt_result.inserted_id)
            group_prompts.append(Prompt(**prompt_data))
    
    # 构建返回结果
    group_dict = {
        "id": group_data["_id"],
        "name": group_data["name"],
        "description": group_data.get("description"),
        "prompts": group_prompts,
        "created_at": group_data["created_at"],
        "updated_at": group_data["updated_at"]
    }
    
    return PromptGroup(**group_dict)


@router.get("/groups/{group_id}", response_model=PromptGroup)
async def get_prompt_group(
    group_id: str,
    current_user: User = Depends(get_current_user)
):
    """获取指定提示词组"""
    group = await prompt_groups_collection.find_one({"_id": group_id})
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="提示词组不存在"
        )
    
    # 获取该组的所有提示词
    group_prompts = []
    async for prompt in prompts_collection.find({"prompt_group_id": group_id}):
        prompt_dict = {
            "id": str(prompt["_id"]),
            "name": prompt["name"],
            "content": prompt["content"],
            "type": prompt["type"],
            "description": prompt.get("description"),
            "variables": prompt.get("variables"),
            "prompt_group_id": prompt["prompt_group_id"],
            "created_at": prompt["created_at"],
            "updated_at": prompt["updated_at"]
        }
        group_prompts.append(Prompt(**prompt_dict))
    
    # 构建提示词组
    group_dict = {
        "id": str(group["_id"]),
        "name": group["name"],
        "description": group.get("description"),
        "prompts": group_prompts,
        "created_at": group["created_at"],
        "updated_at": group["updated_at"]
    }
    
    return PromptGroup(**group_dict)


@router.put("/groups/{group_id}", response_model=PromptGroup)
async def update_prompt_group(
    group_id: str,
    name: Optional[str] = None,
    description: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """更新提示词组"""
    # 检查提示词组是否存在
    existing_group = await prompt_groups_collection.find_one({"_id": group_id})
    if not existing_group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="提示词组不存在"
        )
    
    # 检查名称是否已被其他组使用
    if name and name != existing_group["name"]:
        duplicate_group = await prompt_groups_collection.find_one({"name": name, "_id": {"$ne": group_id}})
        if duplicate_group:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="提示词组名称已存在"
            )
    
    # 准备更新数据
    update_data = {"updated_at": datetime.utcnow()}
    if name:
        update_data["name"] = name
    if description is not None:
        update_data["description"] = description
    
    # 执行更新
    await prompt_groups_collection.update_one(
        {"_id": group_id},
        {"$set": update_data}
    )
    
    # 获取更新后的提示词组
    updated_group = await prompt_groups_collection.find_one({"_id": group_id})
    
    # 获取该组的所有提示词
    group_prompts = []
    async for prompt in prompts_collection.find({"prompt_group_id": group_id}):
        prompt_dict = {
            "id": str(prompt["_id"]),
            "name": prompt["name"],
            "content": prompt["content"],
            "type": prompt["type"],
            "description": prompt.get("description"),
            "variables": prompt.get("variables"),
            "prompt_group_id": prompt["prompt_group_id"],
            "created_at": prompt["created_at"],
            "updated_at": prompt["updated_at"]
        }
        group_prompts.append(Prompt(**prompt_dict))
    
    # 构建返回结果
    group_dict = {
        "id": str(updated_group["_id"]),
        "name": updated_group["name"],
        "description": updated_group.get("description"),
        "prompts": group_prompts,
        "created_at": updated_group["created_at"],
        "updated_at": updated_group["updated_at"]
    }
    
    return PromptGroup(**group_dict)


@router.delete("/groups/{group_id}")
async def delete_prompt_group(
    group_id: str,
    current_user: User = Depends(get_current_user)
):
    """删除提示词组"""
    # 检查提示词组是否存在
    existing_group = await prompt_groups_collection.find_one({"_id": group_id})
    if not existing_group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="提示词组不存在"
        )
    
    # 删除该组的所有提示词
    await prompts_collection.delete_many({"prompt_group_id": group_id})
    
    # 删除提示词组
    await prompt_groups_collection.delete_one({"_id": group_id})
    
    return {"message": "提示词组删除成功"}


@router.post("/", response_model=Prompt)
async def create_prompt(
    prompt_create: PromptCreate,
    current_user: User = Depends(get_current_user)
):
    """创建提示词"""
    # 检查提示词组是否存在
    existing_group = await prompt_groups_collection.find_one({"_id": prompt_create.prompt_group_id})
    if not existing_group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="提示词组不存在"
        )
    
    # 创建提示词
    prompt_data = {
        "name": prompt_create.name,
        "content": prompt_create.content,
        "type": prompt_create.type,
        "description": prompt_create.description,
        "variables": prompt_create.variables,
        "prompt_group_id": prompt_create.prompt_group_id,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    # 插入数据库
    result = await prompts_collection.insert_one(prompt_data)
    prompt_data["_id"] = str(result.inserted_id)
    
    return Prompt(**prompt_data)


@router.put("/{prompt_id}", response_model=Prompt)
async def update_prompt(
    prompt_id: str,
    name: Optional[str] = None,
    content: Optional[str] = None,
    description: Optional[str] = None,
    variables: Optional[List[str]] = None,
    current_user: User = Depends(get_current_user)
):
    """更新提示词"""
    # 检查提示词是否存在
    existing_prompt = await prompts_collection.find_one({"_id": prompt_id})
    if not existing_prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="提示词不存在"
        )
    
    # 准备更新数据
    update_data = {"updated_at": datetime.utcnow()}
    if name:
        update_data["name"] = name
    if content:
        update_data["content"] = content
    if description is not None:
        update_data["description"] = description
    if variables is not None:
        update_data["variables"] = variables
    
    # 执行更新
    await prompts_collection.update_one(
        {"_id": prompt_id},
        {"$set": update_data}
    )
    
    # 获取更新后的提示词
    updated_prompt = await prompts_collection.find_one({"_id": prompt_id})
    prompt_dict = {
        "id": str(updated_prompt["_id"]),
        "name": updated_prompt["name"],
        "content": updated_prompt["content"],
        "type": updated_prompt["type"],
        "description": updated_prompt.get("description"),
        "variables": updated_prompt.get("variables"),
        "prompt_group_id": updated_prompt["prompt_group_id"],
        "created_at": updated_prompt["created_at"],
        "updated_at": updated_prompt["updated_at"]
    }
    
    return Prompt(**prompt_dict)


@router.delete("/{prompt_id}")
async def delete_prompt(
    prompt_id: str,
    current_user: User = Depends(get_current_user)
):
    """删除提示词"""
    # 检查提示词是否存在
    existing_prompt = await prompts_collection.find_one({"_id": prompt_id})
    if not existing_prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="提示词不存在"
        )
    
    # 删除提示词
    await prompts_collection.delete_one({"_id": prompt_id})
    
    return {"message": "提示词删除成功"}
