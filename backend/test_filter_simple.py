#!/usr/bin/env python3
"""
简单测试照片过滤器功能
"""

import asyncio
import sys
import os

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.abspath('.'))

from app.services.photo_filter import PhotoFilter
from datetime import datetime

async def test_photo_filter():
    """
    测试照片过滤器功能
    """
    print("开始测试照片过滤器...")
    
    # 创建照片过滤器实例
    try:
        photo_filter = PhotoFilter()
        print("✅ 成功创建 PhotoFilter 实例")
    except Exception as e:
        print(f"❌ 失败创建 PhotoFilter 实例: {e}")
        return
    
    # 模拟测试数据
    test_photos = [
        # 正常图片
        {
            "id": "1",
            "filename": "photo1.jpg",
            "datetime": datetime.now(),
            "gps_lat": 39.9042,
            "gps_lon": 116.4074,
            "has_gps": True
        },
        # 视频文件
        {
            "id": "2",
            "filename": "video1.mp4",
            "datetime": datetime.now(),
            "gps_lat": 39.9042,
            "gps_lon": 116.4074,
            "has_gps": True
        },
        # Gemini 不支持的格式
        {
            "id": "3",
            "filename": "image1.tiff",
            "datetime": datetime.now(),
            "gps_lat": 39.9042,
            "gps_lon": 116.4074,
            "has_gps": True
        },
        # 重复图片
        {
            "id": "1",  # 与第一张图片相同的ID
            "filename": "photo1.jpg",
            "datetime": datetime.now(),
            "gps_lat": 39.9042,
            "gps_lon": 116.4074,
            "has_gps": True
        },
        # 截图
        {
            "id": "4",
            "filename": "Screenshot_20240101_120000.jpg",
            "datetime": datetime.now(),
            "gps_lat": 39.9042,
            "gps_lon": 116.4074,
            "has_gps": True
        },
        # 另一个正常图片
        {
            "id": "5",
            "filename": "photo2.png",
            "datetime": datetime.now(),
            "gps_lat": 39.9042,
            "gps_lon": 116.4074,
            "has_gps": True
        }
    ]
    
    print(f"测试前照片数量: {len(test_photos)}")
    
    # 执行过滤
    try:
        filtered_photos = await photo_filter.filter(test_photos, "test_user_id")
        print(f"✅ 成功执行过滤，过滤后照片数量: {len(filtered_photos)}")
    except Exception as e:
        print(f"❌ 失败执行过滤: {e}")
        return
    
    # 打印过滤后的照片
    print("\n过滤后的照片:")
    for photo in filtered_photos:
        print(f"- {photo['filename']} (ID: {photo['id']})")
        print(f"  是视频: {photo.get('is_video', False)}")
        print(f"  是截图: {photo.get('is_screenshot', False)}")
        print(f"  Gemini兼容: {photo.get('gemini_compatible', True)}")
        print(f"  是重复: {photo.get('is_duplicate', False)}")
    
    print("\n测试完成！")

if __name__ == "__main__":
    asyncio.run(test_photo_filter())
