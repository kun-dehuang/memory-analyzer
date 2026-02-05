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
import numpy as np
from app.services.image_features import ImageFeaturesExtractor

logger = logging.getLogger(__name__)


class PhotoFilter:
    """照片过滤器"""

    def __init__(self):
        """初始化过滤器"""
        self.features_extractor = ImageFeaturesExtractor()

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

            # 3. 过滤网络下载图片
            logger.info("过滤网络下载图片")
            non_downloads = await self._filter_downloads(non_screenshots)
            logger.info(f"过滤网络下载图片后剩余: {len(non_downloads)}张")

            # 4. 过滤Gemini无法处理的图片
            logger.info("过滤Gemini无法处理的图片")
            gemini_compatible = await self._filter_gemini_incompatible(non_downloads)
            logger.info(f"过滤后剩余: {len(gemini_compatible)}张")

            # 5. 过滤重复照片
            logger.info("过滤重复照片")
            unique_photos = await self._filter_duplicates(gemini_compatible, photo_map)
            logger.info(f"过滤重复后剩余: {len(unique_photos)}张")

            # 6. 按时间排序（最新的在前）
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
                # 基于文件名和路径判断
                filename = photo.get("filename", "").lower()
                path = photo.get("path", "").lower()

                # 常见截图特征
                screenshot_keywords = [
                    "screenshot",
                    "screen",
                    "截图",
                    "screen_shot",
                    "capture",
                    "截取",
                    "屏幕截图",
                    "screengrab"
                ]

                # 检查文件名和路径
                is_screenshot = any(keyword in filename for keyword in screenshot_keywords) or \
                               any(keyword in path for keyword in screenshot_keywords)

                # 检查文件路径中的常见截图目录
                screenshot_dirs = ["screenshots", "截图", "screen captures"]
                is_screenshot_dir = any(dir_name in path for dir_name in screenshot_dirs)
                is_screenshot = is_screenshot or is_screenshot_dir

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

    async def _filter_downloads(
        self, photos: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        过滤网络下载图片

        Args:
            photos: 照片列表

        Returns:
            非网络下载照片列表
        """
        non_downloads = []

        for photo in photos:
            try:
                filename = photo.get("filename", "").lower()
                path = photo.get("path", "").lower()

                # 常见下载图片特征
                download_keywords = [
                    "download",
                    "dl_",
                    "saved",
                    "copy",
                    "downloaded",
                    "下载",
                    "保存的图片",
                    "internet",
                    "web_"
                ]

                # 检查文件名和路径
                is_download = any(keyword in filename for keyword in download_keywords) or \
                             any(keyword in path for keyword in download_keywords)

                # 检查文件路径中的常见下载目录
                download_dirs = ["downloads", "下载", "desktop", "桌面"]
                is_download_dir = any(dir_name in path for dir_name in download_dirs)
                is_download = is_download or is_download_dir

                if not is_download:
                    photo["is_download"] = False
                    non_downloads.append(photo)
                else:
                    photo["is_download"] = True
                    logger.debug(f"过滤掉网络下载图片: {filename}")

            except Exception as e:
                logger.warning(f"判断网络下载图片失败: {e}")
                # 失败时保留照片
                photo["is_download"] = False
                non_downloads.append(photo)

        return non_downloads

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
        duplicate_groups = []  # 存储重复组，每个组包含多张照片

        # 为每张照片提取特征
        photos_with_features = []
        for photo in photos:
            try:
                # 尝试获取图片数据
                photo_data = None
                if photo_map:
                    photo_id = photo.get("id", "")
                    if photo_id in photo_map:
                        try:
                            original_photo = photo_map[photo_id]
                            photo_data = original_photo.download().content
                        except Exception as e:
                            logger.debug(f"下载照片失败: {e}")
                            continue
                
                if photo_data:
                    # 提取特征
                    features = await self.features_extractor.extract_features(photo_data)
                    photo["features"] = features
                    photo["image_data"] = photo_data  # 临时存储图片数据
                    photos_with_features.append(photo)
                else:
                    # 没有图片数据，直接添加
                    photos_with_features.append(photo)
            except Exception as e:
                logger.warning(f"处理照片失败: {e}")
                photos_with_features.append(photo)

        # 基于特征相似度分组
        for photo in photos_with_features:
            if "features" not in photo or not photo["features"].get("visual_features"):
                # 没有特征，单独一组
                duplicate_groups.append([photo])
                continue

            # 查找相似的照片组
            matched = False
            for group in duplicate_groups:
                # 计算与组内第一张照片的相似度
                group_photo = group[0]
                if "features" in group_photo and group_photo["features"].get("visual_features"):
                    similarity = self._calculate_similarity(
                        photo["features"]["visual_features"],
                        group_photo["features"]["visual_features"]
                    )
                    # 相似度阈值
                    if similarity > 0.8:
                        group.append(photo)
                        matched = True
                        break
            if not matched:
                duplicate_groups.append([photo])

        # 为每个重复组选择最优照片
        for group in duplicate_groups:
            if len(group) == 1:
                # 只有一张照片，直接添加
                photo = group[0]
                photo["is_duplicate"] = False
                unique_photos.append(photo)
            else:
                # 有多张照片，选择评分最高的
                best_photo = await self._select_best_photo(group)
                best_photo["is_duplicate"] = False
                unique_photos.append(best_photo)
                # 标记其他照片为重复
                for photo in group:
                    if photo != best_photo:
                        photo["is_duplicate"] = True
                        logger.debug(f"过滤掉重复照片: {photo.get('filename', '')}")

        # 清理临时数据
        for photo in unique_photos:
            if "image_data" in photo:
                del photo["image_data"]

        return unique_photos

    def _calculate_similarity(self, features1: List[float], features2: List[float]) -> float:
        """
        计算特征向量的相似度

        Args:
            features1: 第一个特征向量
            features2: 第二个特征向量

        Returns:
            相似度（0-1）
        """
        try:
            # 转换为numpy数组
            vec1 = np.array(features1)
            vec2 = np.array(features2)
            
            # 计算余弦相似度
            dot_product = np.dot(vec1, vec2)
            norm1 = np.linalg.norm(vec1)
            norm2 = np.linalg.norm(vec2)
            
            if norm1 == 0 or norm2 == 0:
                return 0.0
            
            similarity = dot_product / (norm1 * norm2)
            return float(max(0.0, min(1.0, similarity)))
        except Exception as e:
            logger.error(f"计算相似度失败: {e}")
            return 0.0

    async def _select_best_photo(self, photos: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        选择评分最高的照片

        Args:
            photos: 照片列表

        Returns:
            评分最高的照片
        """
        best_photo = photos[0]
        best_score = -1

        for photo in photos:
            # 计算综合评分
            score = await self._calculate_photo_score(photo)
            if score > best_score:
                best_score = score
                best_photo = photo

        return best_photo

    async def _calculate_photo_score(self, photo: Dict[str, Any]) -> float:
        """
        计算照片的综合评分

        Args:
            photo: 照片字典

        Returns:
            综合评分（0-1）
        """
        try:
            if "features" in photo:
                aesthetic_score = photo["features"].get("aesthetic_score", 0.0)
                information_score = photo["features"].get("information_score", 0.0)
                # 权重：美学评分40%，信息量评分60%
                return aesthetic_score * 0.4 + information_score * 0.6
            return 0.0
        except Exception as e:
            logger.error(f"计算照片评分失败: {e}")
            return 0.0

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

    async def _get_image_data(self, photo_id: str, photo_map: dict) -> bytes:
        """
        获取图片数据

        Args:
            photo_id: 照片ID
            photo_map: 照片映射

        Returns:
            图片数据
        """
        try:
            if photo_id in photo_map:
                photo = photo_map[photo_id]
                return photo.download().content
            return None
        except Exception as e:
            logger.error(f"获取图片数据失败: {e}")
            return None
