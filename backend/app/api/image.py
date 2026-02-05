from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import Response
from typing import List, Optional
from bson import ObjectId

from app.models.photo import PhotoMetadata
from app.models.user import User
from app.api.auth import get_current_user
from app.config.database import photos_collection

router = APIRouter()


@router.get("/", response_model=List[PhotoMetadata])
async def get_images(
    page: int = Query(1, ge=1, description="页码"),
    limit: int = Query(10, ge=1, le=100, description="每页数量"),
    user_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """
    获取图片列表
    
    Args:
        page: 页码
        limit: 每页数量
        user_id: 用户ID（可选，默认获取当前用户的图片）
        current_user: 当前用户
    
    Returns:
        图片列表
    """
    # 检查权限
    if user_id and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权访问其他用户的图片"
        )
    
    # 构建查询条件
    query = {"user_id": current_user.id}
    if user_id:
        query["user_id"] = user_id
    
    # 计算跳过的记录数
    skip = (page - 1) * limit
    
    # 查询记录
    images = []
    async for image in photos_collection.find(query).sort("created_at", -1).skip(skip).limit(limit):
        # 构建图片字典
        image_dict = {
            "id": str(image["_id"]),
            "user_id": image["user_id"],
            "filename": image["filename"],
            "datetime": image["datetime"],
            "gps_lat": image.get("gps_lat"),
            "gps_lon": image.get("gps_lon"),
            "has_gps": image.get("has_gps", False),
            "icloud_photo_id": image.get("icloud_photo_id"),
            "is_duplicate": image.get("is_duplicate", False),
            "is_screenshot": image.get("is_screenshot", False),
            "is_download": image.get("is_download", False),
            "image_hash": image.get("image_hash"),
            "features": image.get("features"),
            "compressed_info": image.get("compressed_info"),
            "original_size": image.get("original_size", 0),
            "created_at": image.get("created_at"),
            "updated_at": image.get("updated_at", image.get("created_at"))
        }
        images.append(PhotoMetadata(**image_dict))
    
    return images


@router.get("/{image_id}", response_model=PhotoMetadata)
async def get_image(
    image_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    获取图片详情
    
    Args:
        image_id: 图片ID
        current_user: 当前用户
    
    Returns:
        图片详情
    """
    # 查询图片
    image = await photos_collection.find_one({"_id": ObjectId(image_id)})
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="图片不存在"
        )
    
    # 检查权限
    if image["user_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权访问其他用户的图片"
        )
    
    # 构建图片字典
    image_dict = {
        "id": str(image["_id"]),
        "user_id": image["user_id"],
        "filename": image["filename"],
        "datetime": image["datetime"],
        "gps_lat": image.get("gps_lat"),
        "gps_lon": image.get("gps_lon"),
        "has_gps": image.get("has_gps", False),
        "icloud_photo_id": image.get("icloud_photo_id"),
        "is_duplicate": image.get("is_duplicate", False),
        "is_screenshot": image.get("is_screenshot", False),
        "is_download": image.get("is_download", False),
        "image_hash": image.get("image_hash"),
        "features": image.get("features"),
        "compressed_info": image.get("compressed_info"),
        "original_size": image.get("original_size", 0),
        "created_at": image.get("created_at"),
        "updated_at": image.get("updated_at", image.get("created_at"))
    }
    
    return PhotoMetadata(**image_dict)


@router.get("/batch/{batch_ids}", response_model=List[PhotoMetadata])
async def get_images_batch(
    batch_ids: str,
    current_user: User = Depends(get_current_user)
):
    """
    批量获取图片详情
    
    Args:
        batch_ids: 图片ID列表，用逗号分隔
        current_user: 当前用户
    
    Returns:
        图片详情列表
    """
    # 解析图片ID列表
    image_ids = batch_ids.split(",")
    object_ids = []
    
    for image_id in image_ids:
        try:
            object_ids.append(ObjectId(image_id))
        except Exception:
            continue
    
    if not object_ids:
        return []
    
    # 查询图片
    images = []
    async for image in photos_collection.find({"_id": {"$in": object_ids}}):
        # 检查权限
        if image["user_id"] != current_user.id:
            continue
        
        # 构建图片字典
        image_dict = {
            "id": str(image["_id"]),
            "user_id": image["user_id"],
            "filename": image["filename"],
            "datetime": image["datetime"],
            "gps_lat": image.get("gps_lat"),
            "gps_lon": image.get("gps_lon"),
            "has_gps": image.get("has_gps", False),
            "icloud_photo_id": image.get("icloud_photo_id"),
            "is_duplicate": image.get("is_duplicate", False),
            "is_screenshot": image.get("is_screenshot", False),
            "is_download": image.get("is_download", False),
            "image_hash": image.get("image_hash"),
            "features": image.get("features"),
            "compressed_info": image.get("compressed_info"),
            "original_size": image.get("original_size", 0),
            "created_at": image.get("created_at"),
            "updated_at": image.get("updated_at", image.get("created_at"))
        }
        images.append(PhotoMetadata(**image_dict))
    
    return images


@router.delete("/{image_id}")
async def delete_image(
    image_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    删除图片
    
    Args:
        image_id: 图片ID
        current_user: 当前用户
    
    Returns:
        删除结果
    """
    # 查询图片
    image = await photos_collection.find_one({"_id": ObjectId(image_id)})
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="图片不存在"
        )
    
    # 检查权限
    if image["user_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权删除其他用户的图片"
        )
    
    # 执行删除
    await photos_collection.delete_one({"_id": ObjectId(image_id)})
    
    return {"message": "图片删除成功"}


@router.get("/data/{image_id}")
async def get_image_data(
    image_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    获取图片数据
    
    Args:
        image_id: 图片ID
        current_user: 当前用户
    
    Returns:
        图片二进制数据
    """
    # 查询图片
    image = await photos_collection.find_one({"_id": ObjectId(image_id)})
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="图片不存在"
        )
    
    # 检查权限
    if image["user_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权访问其他用户的图片"
        )
    
    # 获取图片数据
    image_data = image.get("image_data")
    if not image_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="图片数据不存在"
        )
    
    # 确定MIME类型
    filename = image.get("filename", "image.jpg")
    if filename.lower().endswith(".jpg") or filename.lower().endswith(".jpeg"):
        media_type = "image/jpeg"
    elif filename.lower().endswith(".png"):
        media_type = "image/png"
    elif filename.lower().endswith(".gif"):
        media_type = "image/gif"
    elif filename.lower().endswith(".webp"):
        media_type = "image/webp"
    else:
        media_type = "image/jpeg"
    
    # 返回图片数据
    return Response(content=image_data, media_type=media_type)
