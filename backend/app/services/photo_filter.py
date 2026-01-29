#!/usr/bin/env python3
"""
照片过滤器服务

用于过滤重复照片和截图
"""

import asyncio
from typing import List, Dict, Any
import logging
import imagehash
from PIL import Image
import io

logger = logging.getLogger(__name__)

class PhotoFilter:
    """照片过滤器"""
    
    async def filter(self, photos: List[Dict[str, Any]], user_id: str) -> List[Dict[str, Any]]:
        """
        过滤照片
        
        Args:
            photos: 原始照片列表
            user_id: 用户ID
            
        Returns:
            过滤后的照片列表
        """
        logger.info(f"开始过滤照片，原始数量: {len(photos)}")
        
        try:
            # 1. 过滤截图
            logger.info("过滤截图")
            non_screenshots = await self._filter_screenshots(photos)
            logger.info(f"过滤截图后剩余: {len(non_screenshots)}张")
            
            # 2. 过滤重复照片
            logger.info("过滤重复照片")
            unique_photos = await self._filter_duplicates(non_screenshots)
            logger.info(f"过滤重复后剩余: {len(unique_photos)}张")
            
            # 3. 按时间排序（最新的在前）
            unique_photos.sort(key=lambda x: x["datetime"], reverse=True)
            
            logger.info(f"过滤完成，最终剩余: {len(unique_photos)}张")
            return unique_photos
            
        except Exception as e:
            logger.error(f"过滤照片失败: {e}")
            # 失败时返回原始照片
            return photos
    
    async def _filter_screenshots(self, photos: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        过滤截图
        
        Args:
            photos: 照片列表
            
        Returns:
            非截图照片列表
        """
        non_screenshots = []
        
        for photo in photos:
            try:
                # 这里需要根据照片内容判断是否为截图
                # 暂时基于文件名和路径判断
                filename = photo.get("filename", "").lower()
                path = photo.get("path", "").lower()
                
                # 常见截图特征
                is_screenshot = any([
                    "screenshot" in filename,
                    "screen" in filename,
                    "截图" in filename,
                    "screenshot" in path,
                    "screen" in path,
                    "截图" in path
                ])
                
                if not is_screenshot:
                    photo["is_screenshot"] = False
                    non_screenshots.append(photo)
                else:
                    photo["is_screenshot"] = True
                    logger.debug(f"过滤掉截图: {filename}")
                    
            except Exception as e:
                logger.warning(f"判断截图失败: {e}")
                # 失败时保留照片
                photo["is_screenshot"] = False
                non_screenshots.append(photo)
        
        return non_screenshots
    
    async def _filter_duplicates(self, photos: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        过滤重复照片
        
        Args:
            photos: 照片列表
            
        Returns:
            唯一照片列表
        """
        unique_photos = []
        seen_hashes = set()
        
        for photo in photos:
            try:
                # 这里需要计算照片的哈希值来判断重复
                # 暂时基于文件名和时间判断
                # 实际实现时，需要：
                # 1. 下载照片内容
                # 2. 计算感知哈希
                # 3. 比较哈希值
                
                # 模拟哈希计算
                # 实际实现时，需要使用imagehash库计算真实的感知哈希
                # 例如：
                # with Image.open(photo_path) as img:
                #     img_hash = str(imagehash.phash(img))
                
                # 基于文件名和时间生成模拟哈希
                filename = photo.get("filename", "")
                datetime_str = str(photo.get("datetime", ""))
                mock_hash = f"{filename}_{datetime_str}"
                
                if mock_hash not in seen_hashes:
                    seen_hashes.add(mock_hash)
                    photo["is_duplicate"] = False
                    unique_photos.append(photo)
                else:
                    photo["is_duplicate"] = True
                    logger.debug(f"过滤掉重复照片: {filename}")
                    
            except Exception as e:
                logger.warning(f"判断重复失败: {e}")
                # 失败时保留照片
                photo["is_duplicate"] = False
                unique_photos.append(photo)
        
        return unique_photos
    
    def _calculate_hash(self, image_data: bytes) -> str:
        """
        计算图片的感知哈希
        
        Args:
            image_data: 图片数据
            
        Returns:
            哈希字符串
        """
        try:
            img = Image.open(io.BytesIO(image_data))
            img_hash = imagehash.phash(img)
            return str(img_hash)
        except Exception as e:
            logger.warning(f"计算哈希失败: {e}")
            return ""
