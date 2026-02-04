#!/usr/bin/env python3
"""
照片过滤器服务

用于过滤重复照片和截图
"""

import time
from typing import List, Dict, Any, Tuple
import logging
import imagehash
from PIL import Image
import io
import os
import hashlib

logger = logging.getLogger(__name__)


class PhotoFilter:
    """照片过滤器"""

    async def filter(
        self, photos: List[Dict[str, Any]], user_id: str, photo_map: dict = None
    ) -> Tuple[List[Dict[str, Any]], float]:
        """
        过滤照片

        Args:
            photos: 原始照片列表
            user_id: 用户ID
            photo_map: 照片ID到原始iCloud照片对象的映射

        Returns:
            (过滤后的照片列表, 过滤耗时)
        """
        logger.info(f"开始过滤照片，原始数量: {len(photos)}")

        # 记录开始时间
        start_time = time.time()

        try:
            # 1. 过滤视频类型
            logger.info("过滤视频类型")
            non_videos = await self._filter_videos(photos)
            logger.info(f"过滤视频后剩余: {len(non_videos)}张")

            # 2. 过滤截图
            logger.info("过滤截图")
            non_screenshots = await self._filter_screenshots(non_videos)
            logger.info(f"过滤截图后剩余: {len(non_screenshots)}张")

            # 3. 过滤Gemini无法处理的图片
            logger.info("过滤Gemini无法处理的图片")
            gemini_compatible = await self._filter_gemini_incompatible(non_screenshots)
            logger.info(f"过滤后剩余: {len(gemini_compatible)}张")

            # 4. 过滤重复照片
            logger.info("过滤重复照片")
            unique_photos = await self._filter_duplicates(gemini_compatible, photo_map)
            logger.info(f"过滤重复后剩余: {len(unique_photos)}张")

            # 5. 按时间排序（最新的在前）
            unique_photos.sort(key=lambda x: x["datetime"], reverse=True)

            # 计算耗时
            filter_time = time.time() - start_time
            logger.info(
                f"过滤完成，最终剩余: {len(unique_photos)}张, 耗时: {filter_time:.2f} 秒"
            )

            return unique_photos, filter_time

        except Exception as e:
            logger.error(f"过滤照片失败: {e}")
            # 计算耗时
            filter_time = time.time() - start_time
            # 失败时返回原始照片和耗时
            return photos, filter_time

    async def _filter_videos(
        self, photos: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        过滤视频类型

        Args:
            photos: 照片列表

        Returns:
            非视频照片列表
        """
        non_videos = []

        # 常见视频扩展名
        video_extensions = {
            ".mp4",
            ".mov",
            ".avi",
            ".wmv",
            ".flv",
            ".mkv",
            ".webm",
            ".m4v",
            ".3gp",
            ".mpeg",
            ".mpg",
        }

        for photo in photos:
            try:
                filename = photo.get("filename", "").lower()

                # 检查文件扩展名
                ext = os.path.splitext(filename)[1].lower()
                is_video = ext in video_extensions

                if not is_video:
                    photo["is_video"] = False
                    non_videos.append(photo)
                else:
                    photo["is_video"] = True
                    logger.debug(f"过滤掉视频: {filename}")

            except Exception as e:
                logger.warning(f"判断视频失败: {e}")
                # 失败时保留照片
                photo["is_video"] = False
                non_videos.append(photo)

        return non_videos

    async def _filter_screenshots(
        self, photos: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
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
                is_screenshot = any(
                    [
                        "screenshot" in filename,
                        "screen" in filename,
                        "截图" in filename,
                        "screenshot" in path,
                        "screen" in path,
                        "截图" in path,
                    ]
                )

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

    async def _filter_gemini_incompatible(
        self, photos: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        过滤Gemini无法处理的图片

        Args:
            photos: 照片列表

        Returns:
            Gemini兼容的照片列表
        """
        compatible_photos = []

        # Gemini支持的图片格式
        supported_formats = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"}

        for photo in photos:
            try:
                filename = photo.get("filename", "").lower()

                # 检查文件扩展名
                ext = os.path.splitext(filename)[1].lower()
                is_compatible = ext in supported_formats

                if is_compatible:
                    photo["gemini_compatible"] = True
                    compatible_photos.append(photo)
                else:
                    photo["gemini_compatible"] = False
                    logger.debug(f"过滤掉Gemini不兼容的格式: {filename}")

            except Exception as e:
                logger.warning(f"判断Gemini兼容性失败: {e}")
                # 失败时保留照片
                photo["gemini_compatible"] = True
                compatible_photos.append(photo)

        return compatible_photos

    async def _filter_duplicates(
        self, photos: List[Dict[str, Any]], photo_map: dict = None
    ) -> List[Dict[str, Any]]:
        """
        过滤重复照片

        Args:
            photos: 照片列表
            photo_map: 照片ID到原始iCloud照片对象的映射

        Returns:
            唯一照片列表
        """
        unique_photos = []
        seen_hashes = set()
        duplicate_groups = {}

        for photo in photos:
            try:
                # 尝试使用iCloud本身的重复标签
                is_duplicate = False
                use_icloud_duplicate = False

                if photo_map:
                    photo_id = photo.get("id", "")
                    # 从photo_map中获取原始iCloud照片对象
                    if photo_id in photo_map:
                        original_photo = photo_map[photo_id]
                        # 检查原始照片对象是否有重复相关的属性
                        # 注意：这里需要根据实际的iCloud照片对象结构调整
                        # 常见的重复相关属性可能包括：duplicate_info, is_duplicate, duplicate_group等
                        try:
                            # 检查是否有重复组信息
                            if hasattr(original_photo, "duplicate_group"):
                                duplicate_group = original_photo.duplicate_group
                                use_icloud_duplicate = True
                                if duplicate_group in duplicate_groups:
                                    # 已经有同组的照片，标记为重复
                                    is_duplicate = True
                                    photo["is_duplicate"] = True
                                    logger.debug(
                                        f"根据iCloud重复组过滤掉照片: {photo.get('filename', '')}"
                                    )
                                else:
                                    # 新的重复组，保留第一张
                                    duplicate_groups[duplicate_group] = photo
                                    photo["is_duplicate"] = False
                                    unique_photos.append(photo)
                            elif hasattr(original_photo, "is_duplicate"):
                                is_duplicate = original_photo.is_duplicate
                                use_icloud_duplicate = True
                                if not is_duplicate:
                                    photo["is_duplicate"] = False
                                    unique_photos.append(photo)
                                else:
                                    photo["is_duplicate"] = True
                                    logger.debug(
                                        f"根据iCloud重复标记过滤掉照片: {photo.get('filename', '')}"
                                    )
                        except Exception as e:
                            logger.debug(f"获取iCloud重复信息失败: {e}")
                            # 失败时回退到哈希方法
                            use_icloud_duplicate = False

                # 如果没有使用iCloud重复标签，回退到哈希方法
                if not use_icloud_duplicate:
                    photo_id = photo.get("id", "")
                    filename = photo.get("filename", "")
                    datetime_str = str(photo.get("datetime", ""))

                    # 生成综合哈希
                    hash_input = f"{photo_id}_{filename}_{datetime_str}"
                    photo_hash = hashlib.md5(hash_input.encode()).hexdigest()

                    if photo_hash not in seen_hashes:
                        seen_hashes.add(photo_hash)
                        photo["is_duplicate"] = False
                        unique_photos.append(photo)
                    else:
                        photo["is_duplicate"] = True
                        logger.debug(f"根据哈希过滤掉重复照片: {filename}")

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
