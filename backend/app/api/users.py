from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Body
from typing import List
from datetime import datetime
from bson import ObjectId

from app.models.user import User
from app.api.auth import get_current_user
from app.config.database import users_collection
from app.services.protagonist_extractor import extract_protagonist_features

router = APIRouter()


@router.get("/", response_model=List[User])
async def get_users(current_user: User = Depends(get_current_user)):
    """获取所有用户（仅管理员）"""
    # 这里可以添加管理员权限检查
    users = []
    async for user in users_collection.find():
        user_dict = {
            "id": str(user["_id"]),
            "icloud_email": user["icloud_email"],
            "nickname": user["nickname"],
            "protagonist_features": user.get("protagonist_features"),
            "created_at": user["created_at"],
            "updated_at": user["updated_at"],
            "last_login": user.get("last_login"),
        }
        users.append(User(**user_dict))
    return users


@router.get("/{user_id}", response_model=User)
async def get_user(user_id: str, current_user: User = Depends(get_current_user)):
    """获取指定用户信息"""
    # 检查权限（只能查看自己的信息）
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="无权访问其他用户信息"
        )

    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户不存在")

    user_dict = {
        "id": str(user["_id"]),
        "icloud_email": user["icloud_email"],
        "nickname": user["nickname"],
        "protagonist_features": user.get("protagonist_features"),
        "created_at": user["created_at"],
        "updated_at": user["updated_at"],
        "last_login": user.get("last_login"),
    }

    return User(**user_dict)


@router.put("/{user_id}", response_model=User)
async def update_user(
    user_id: str, update_data: dict, current_user: User = Depends(get_current_user)
):
    """更新用户信息"""
    # 检查权限
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="无权修改其他用户信息"
        )

    # 准备更新数据
    update_data = {**update_data, "updated_at": datetime.utcnow()}

    # 执行更新
    result = await users_collection.update_one(
        {"_id": ObjectId(user_id)}, {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户不存在")

    # 获取更新后的用户信息
    updated_user = await users_collection.find_one({"_id": ObjectId(user_id)})
    user_dict = {
        "id": str(updated_user["_id"]),
        "icloud_email": updated_user["icloud_email"],
        "nickname": updated_user["nickname"],
        "protagonist_features": updated_user.get("protagonist_features"),
        "created_at": updated_user["created_at"],
        "updated_at": updated_user["updated_at"],
        "last_login": updated_user.get("last_login"),
    }

    return User(**user_dict)


@router.post("/{user_id}/upload-photo")
async def upload_protagonist_photo(
    user_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """上传用户本人照片并提取特征"""
    # 检查权限
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="无权上传其他用户照片"
        )

    # 保存上传的文件
    import os

    # 确保temp目录存在
    os.makedirs("temp", exist_ok=True)
    file_path = f"temp/{user_id}_{datetime.utcnow().timestamp()}.jpg"
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    try:
        # 提取人物特征并存储到数据库
        features = await extract_protagonist_features(file_path, user_id=user_id)
        if not features:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="无法提取人物特征"
            )

        return {"message": "照片上传成功，特征提取完成", "features": features}
    finally:
        # 清理临时文件
        import os

        if os.path.exists(file_path):
            os.remove(file_path)


@router.put("/{user_id}/icloud-password")
async def update_icloud_password(
    user_id: str,
    data: dict = Body(..., description="更新数据"),
    current_user: User = Depends(get_current_user),
):
    """更新用户 iCloud 密码"""
    # 检查权限
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="无权修改其他用户信息"
        )

    # 准备更新数据
    update_data = {
        "icloud_password": data.get("icloud_password"),
        "updated_at": datetime.utcnow(),
    }

    # 执行更新
    result = await users_collection.update_one(
        {"_id": ObjectId(user_id)}, {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户不存在")

    return {"message": "iCloud 密码更新成功"}


@router.delete("/{user_id}")
async def delete_user(user_id: str, current_user: User = Depends(get_current_user)):
    """删除用户"""
    # 检查权限
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="无权删除其他用户"
        )

    # 执行删除
    result = await users_collection.delete_one({"_id": ObjectId(user_id)})

    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户不存在")

    return {"message": "用户删除成功"}
