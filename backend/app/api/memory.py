from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

from app.models.memory import MemoryRecord, MemoryRecordCreate
from app.models.user import User
from app.api.auth import get_current_user
from app.config.database import memory_records_collection, users_collection
from app.services.memory_analyzer import MemoryAnalyzer

router = APIRouter()


@router.get("/records", response_model=List[MemoryRecord])
async def get_memory_records(
    user_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """获取记忆分析记录"""
    # 检查权限（只能查看自己的记录）
    if user_id and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权访问其他用户的记忆记录"
        )
    
    # 构建查询条件
    query = {"user_id": current_user.id}
    if user_id:
        query["user_id"] = user_id
    
    # 查询记录
    records = []
    async for record in memory_records_collection.find(query).sort("created_at", -1):
        record_dict = {
            "id": str(record["_id"]),
            "user_id": record["user_id"],
            "prompt_group_id": record["prompt_group_id"],
            "phase1_results": record.get("phase1_results"),
            "phase2_result": record.get("phase2_result"),
            "status": record["status"],
            "error_message": record.get("error_message"),
            "created_at": record["created_at"],
            "updated_at": record["updated_at"],
            "completed_at": record.get("completed_at"),
            "image_count": record.get("image_count", 0),
            "time_range": record.get("time_range")
        }
        records.append(MemoryRecord(**record_dict))
    return records


@router.post("/records", response_model=MemoryRecord)
async def create_memory_record(
    record_create: MemoryRecordCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    """创建记忆分析记录并触发分析"""
    # 检查权限
    if current_user.id != record_create.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权为其他用户创建记忆记录"
        )
    
    # 创建记录
    record_data = {
        "user_id": record_create.user_id,
        "prompt_group_id": record_create.prompt_group_id,
        "phase1_results": record_create.phase1_results,
        "phase2_result": record_create.phase2_result,
        "status": "pending",
        "error_message": record_create.error_message,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "completed_at": None,
        "image_count": 0,
        "time_range": None
    }
    
    # 插入数据库
    result = await memory_records_collection.insert_one(record_data)
    record_data["_id"] = str(result.inserted_id)
    
    # 触发后台分析任务
    background_tasks.add_task(
        execute_memory_analysis,
        record_data["_id"],
        record_data["user_id"],
        record_data["prompt_group_id"]
    )
    
    return MemoryRecord(**record_data)


@router.get("/records/{record_id}", response_model=MemoryRecord)
async def get_memory_record(
    record_id: str,
    current_user: User = Depends(get_current_user)
):
    """获取指定记忆分析记录"""
    record = await memory_records_collection.find_one({"_id": ObjectId(record_id)})
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="记忆记录不存在"
        )
    
    # 检查权限
    if record["user_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权访问其他用户的记忆记录"
        )
    
    record_dict = {
        "id": str(record["_id"]),
        "user_id": record["user_id"],
        "prompt_group_id": record["prompt_group_id"],
        "phase1_results": record.get("phase1_results"),
        "phase2_result": record.get("phase2_result"),
        "status": record["status"],
        "error_message": record.get("error_message"),
        "created_at": record["created_at"],
        "updated_at": record["updated_at"],
        "completed_at": record.get("completed_at"),
        "image_count": record.get("image_count", 0),
        "time_range": record.get("time_range")
    }
    
    return MemoryRecord(**record_dict)


@router.put("/records/{record_id}/reanalyze")
async def reanalyze_memory_record(
    record_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    """重新分析记忆记录"""
    record = await memory_records_collection.find_one({"_id": ObjectId(record_id)})
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="记忆记录不存在"
        )
    
    # 检查权限
    if record["user_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权操作其他用户的记忆记录"
        )
    
    # 更新状态为重新处理
    await memory_records_collection.update_one(
        {"_id": ObjectId(record_id)},
        {"$set": {
            "status": "pending",
            "error_message": None,
            "updated_at": datetime.utcnow(),
            "completed_at": None
        }
    }
    )
    
    # 触发后台分析任务
    background_tasks.add_task(
        execute_memory_analysis,
        record_id,
        record["user_id"],
        record["prompt_group_id"]
    )
    
    return {"message": "重新分析任务已开始"}


@router.delete("/records/{record_id}")
async def delete_memory_record(
    record_id: str,
    current_user: User = Depends(get_current_user)
):
    """删除记忆分析记录"""
    record = await memory_records_collection.find_one({"_id": ObjectId(record_id)})
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="记忆记录不存在"
        )
    
    # 检查权限
    if record["user_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权删除其他用户的记忆记录"
        )
    
    # 执行删除
    await memory_records_collection.delete_one({"_id": ObjectId(record_id)})
    
    return {"message": "记忆记录删除成功"}


async def execute_memory_analysis(record_id: str, user_id: str, prompt_group_id: str):
    """执行记忆分析任务"""
    try:
        # 更新状态为处理中
        await memory_records_collection.update_one(
            {"_id": record_id},
            {"$set": {
                "status": "processing",
                "updated_at": datetime.utcnow()
            }}
        )
        
        # 获取用户信息
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise Exception("用户不存在")
        
        # 执行分析
        analyzer = MemoryAnalyzer()
        phase1_results, phase2_result, image_count, time_range = await analyzer.analyze(
            user_id=user_id,
            prompt_group_id=prompt_group_id,
            icloud_email=user["icloud_email"],
            icloud_password=user.get("icloud_password"),  # 注意：这里需要安全处理
            protagonist_features=user.get("protagonist_features")
        )
        
        # 更新分析结果
        await memory_records_collection.update_one(
            {"_id": record_id},
            {"$set": {
                "status": "completed",
                "phase1_results": phase1_results,
                "phase2_result": phase2_result,
                "image_count": image_count,
                "time_range": time_range,
                "completed_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }}
        )
        
    except Exception as e:
        # 更新错误状态
        await memory_records_collection.update_one(
            {"_id": record_id},
            {"$set": {
                "status": "failed",
                "error_message": str(e),
                "updated_at": datetime.utcnow()
            }}
        )
        print(f"分析失败: {e}")
