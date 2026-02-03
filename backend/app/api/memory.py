from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Body
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
    page: int = 1,
    limit: int = 10,
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
    
    # 计算跳过的记录数
    skip = (page - 1) * limit
    
    # 查询记录
    records = []
    async for record in memory_records_collection.find(query).sort("created_at", -1).skip(skip).limit(limit):
        # 构建记录字典，包含所有字段
        record_dict = {
            "id": str(record["_id"]),
            "user_id": record["user_id"],
            "prompt_group_id": record["prompt_group_id"],
            "phase1_results": record.get("phase1_results"),  # 返回 phase1_results
            "phase2_result": record.get("phase2_result"),   # 返回 phase2_result
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
    record_data["id"] = str(result.inserted_id)
    
    # 触发后台分析任务
    background_tasks.add_task(
        execute_memory_analysis,
        record_data["id"],
        record_data["user_id"],
        record_data["prompt_group_id"],
        record_create.icloud_password or ""  # 传递 iCloud 密码，确保不为 None
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
    icloud_password: str,
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
        record["prompt_group_id"],
        icloud_password  # 传递 iCloud 密码
    )
    
    return {"message": "重新分析任务已开始"}


@router.put("/records/{record_id}/provide-password")
async def provide_icloud_password(
    record_id: str,
    icloud_password: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    """提供 iCloud 密码并继续执行分析任务"""
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
    
    # 检查状态
    if record.get("status") != "needs_password":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该记录不需要提供密码"
        )
    
    # 触发后台分析任务
    background_tasks.add_task(
        execute_memory_analysis,
        record_id,
        record["user_id"],
        record["prompt_group_id"],
        icloud_password
    )
    
    return {"message": "密码已提供，分析任务已继续执行"}


@router.put("/records/{record_id}/provide-verification")
async def provide_verification_code(
    record_id: str,
    background_tasks: BackgroundTasks,
    verification_code: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user)
):
    """提供 iCloud 二次验证码并继续执行分析任务"""
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
    
    # 检查状态
    if record.get("status") != "needs_verification":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该记录不需要提供验证码"
        )
    
    # 获取用户信息
    user = await users_collection.find_one({"_id": ObjectId(record["user_id"])})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    # 触发后台分析任务，传递验证码
    background_tasks.add_task(
        execute_memory_analysis,
        record_id,
        record["user_id"],
        record["prompt_group_id"],
        user.get("icloud_password"),
        verification_code
    )
    
    return {"message": "验证码已提供，分析任务已继续执行"}


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


async def execute_memory_analysis(record_id: str, user_id: str, prompt_group_id: str, icloud_password: str, verification_code: str = None):
    """执行记忆分析任务"""
    # 确保logger已定义
    if 'logger' not in globals():
        import logging
        global logger
        logger = logging.getLogger(__name__)
    
    try:
        # 将字符串转换为 ObjectId
        from bson import ObjectId
        record_object_id = ObjectId(record_id)
        
        # 更新状态为处理中
        await memory_records_collection.update_one(
            {"_id": record_object_id},
            {"$set": {
                "status": "processing",
                "updated_at": datetime.utcnow()
            }}
        )
        
        # 获取用户信息
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise Exception("用户不存在")
        
        # 检查 iCloud 凭据
        icloud_email = user.get("icloud_email")
        stored_icloud_password = user.get("icloud_password")
        stored_session_data = user.get("icloud_session_data")
        
        # 优先使用传递过来的密码，如果没有则使用存储的密码
        final_icloud_password = icloud_password or stored_icloud_password
        
        if not icloud_email:
            raise Exception("用户未设置 iCloud 邮箱")
        if not final_icloud_password:
            # 如果没有提供密码且存储中也没有，将状态更新为需要密码
            await memory_records_collection.update_one(
                {"_id": record_object_id},
                {"$set": {
                    "status": "needs_password",
                    "error_message": "需要提供 iCloud 密码才能执行分析",
                    "updated_at": datetime.utcnow()
                }}
            )
            return
        
        # 执行分析
        analyzer = MemoryAnalyzer()
        try:
            phase1_results, phase2_result, image_count, time_range, session_data = await analyzer.analyze(
                user_id=user_id,
                prompt_group_id=prompt_group_id,
                icloud_email=icloud_email,
                icloud_password=final_icloud_password,
                verification_code=verification_code,
                session_data=stored_session_data,
                protagonist_features=user.get("protagonist_features")
            )
            
            # 如果获取到新的会话数据，保存到用户信息中
            if session_data:
                await users_collection.update_one(
                    {"_id": ObjectId(user_id)},
                    {"$set": {
                        "icloud_session_data": session_data,
                        "updated_at": datetime.utcnow()
                    }}
                )
        except Exception as e:
            error_message = str(e)
            logger.error(f"分析异常: {error_message}")
            
            # 检查是否需要二次验证或认证错误
            if "需要二次验证" in error_message or "Authentication required" in error_message or "Missing X-APPLE-WEBAUTH-TOKEN" in error_message or "验证码错误" in error_message:
                # 如果需要二次验证或认证错误，将状态更新为需要验证
                await memory_records_collection.update_one(
                    {"_id": record_object_id},
                    {"$set": {
                        "status": "needs_verification",
                        "error_message": "需要 iCloud 二次验证",
                        "updated_at": datetime.utcnow()
                    }}
                )
                return
            # 检查是否是验证成功后仍然无法访问照片的错误
            elif "验证成功后，无法访问照片" in error_message:
                # 这种情况也需要二次验证
                await memory_records_collection.update_one(
                    {"_id": record_object_id},
                    {"$set": {
                        "status": "needs_verification",
                        "error_message": "需要 iCloud 二次验证",
                        "updated_at": datetime.utcnow()
                    }}
                )
                return
            elif "Invalid email/password combination" in error_message:
                # 如果是邮箱/密码组合错误，将状态更新为需要密码
                await memory_records_collection.update_one(
                    {"_id": record_object_id},
                    {"$set": {
                        "status": "needs_password",
                        "error_message": "iCloud 邮箱或密码不正确，请重新输入",
                        "updated_at": datetime.utcnow()
                    }}
                )
                return
            else:
                # 其他错误，继续抛出
                raise
        
        # 打印调试信息
        print(f"分析完成 - phase1_results: {type(phase1_results)}, length: {len(phase1_results) if phase1_results else 0}")
        print(f"分析完成 - phase2_result: {type(phase2_result)}")
        print(f"分析完成 - image_count: {image_count}")
        print(f"分析完成 - time_range: {time_range}")
        
        # 更新分析结果
        update_result = await memory_records_collection.update_one(
            {"_id": record_object_id},
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
        print(f"更新结果 - matched_count: {update_result.matched_count}, modified_count: {update_result.modified_count}")
        
    except Exception as e:
        # 更新错误状态
        from bson import ObjectId
        record_object_id = ObjectId(record_id)
        await memory_records_collection.update_one(
            {"_id": record_object_id},
            {"$set": {
                "status": "failed",
                "error_message": str(e),
                "updated_at": datetime.utcnow()
            }}
        )
        print(f"分析失败: {e}")
