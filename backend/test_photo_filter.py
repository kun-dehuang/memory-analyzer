#!/usr/bin/env python3
"""
测试照片过滤器功能
"""

import asyncio
from app.services.photo_filter import PhotoFilter
from datetime import datetime

async def test_photo_filter():
    """
    测试照片过滤器功能
    """
    # 创建照片过滤器实例
    photo_filter = PhotoFilter()
    
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
    
    print("测试前照片数量:", len(test_photos))
    print("测试照片列表:")
    for photo in test_photos:
        print(f"  - {photo['filename']} (ID: {photo['id']})")
    
    # 执行过滤
    filtered_photos = await photo_filter.filter(test_photos, "test_user_id")
    
    print("\n测试后照片数量:", len(filtered_photos))
    print("过滤后的照片列表:")
    for photo in filtered_photos:
        print(f"  - {photo['filename']} (ID: {photo['id']})")
        print(f"    是视频: {photo.get('is_video', False)}")
        print(f"    是截图: {photo.get('is_screenshot', False)}")
        print(f"    Gemini兼容: {photo.get('gemini_compatible', True)}")
        print(f"    是重复: {photo.get('is_duplicate', False)}")
    
    # 验证结果
    print("\n验证结果:")
    
    # 检查视频是否被过滤
    video_filenames = ["video1.mp4"]
    for photo in filtered_photos:
        if photo['filename'] in video_filenames:
            print(f"❌ 错误: 视频 {photo['filename']} 没有被过滤")
        else:
            print(f"✅ 正确: 非视频 {photo['filename']} 被保留")
    
    # 检查 Gemini 不兼容格式是否被过滤
    incompatible_filenames = ["image1.tiff"]
    for photo in filtered_photos:
        if photo['filename'] in incompatible_filenames:
            print(f"❌ 错误: Gemini不兼容格式 {photo['filename']} 没有被过滤")
        else:
            print(f"✅ 正确: Gemini兼容格式 {photo['filename']} 被保留")
    
    # 检查重复图片是否被过滤
    duplicate_count = sum(1 for photo in filtered_photos if photo['id'] == "1")
    if duplicate_count == 1:
        print("✅ 正确: 重复图片被过滤，只保留了一张")
    else:
        print(f"❌ 错误: 重复图片没有被正确过滤，保留了 {duplicate_count} 张")
    
    # 检查截图是否被过滤
    screenshot_filenames = ["Screenshot_20240101_120000.jpg"]
    for photo in filtered_photos:
        if photo['filename'] in screenshot_filenames:
            print(f"❌ 错误: 截图 {photo['filename']} 没有被过滤")
        else:
            print(f"✅ 正确: 非截图 {photo['filename']} 被保留")

if __name__ == "__main__":
    asyncio.run(test_photo_filter())
