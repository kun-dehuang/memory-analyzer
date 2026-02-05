#!/usr/bin/env python3
"""
图片压缩服务

用于压缩图片，包括自动裁剪、智能缩放、格式转换等
"""

import io
import logging
from typing import Dict, Any, List
import numpy as np
from PIL import Image
import PIL.ImageOps

# 尝试导入OpenCV，如果失败则使用后备方案
try:
    import cv2
    # 测试cv2是否能正常工作（检查是否能访问其属性）
    _ = cv2.COLOR_BGR2GRAY
    opencv_available = True
except Exception as e:
    logger = logging.getLogger(__name__)
    logger.warning(f"OpenCV导入失败: {e}，将使用后备方案")
    opencv_available = False

logger = logging.getLogger(__name__)


class ImageCompressor:
    """图片压缩器"""

    def __init__(self):
        """初始化压缩器"""
        pass

    async def compress(self, image_data: bytes, options: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        压缩图片

        Args:
            image_data: 原始图片数据
            options: 压缩选项

        Returns:
            压缩结果
        """
        # 默认选项
        default_options = {
            "max_width": 1920,
            "max_height": 1080,
            "min_width": 320,
            "min_height": 240,
            "quality": 85,
            "format": "webp",
            "auto_crop": True,
            "preserve_aspect_ratio": True
        }

        # 合并选项
        if options is None:
            options = {}
        final_options = {**default_options, **options}

        result = {
            "compressed_data": None,
            "original_size": len(image_data),
            "compressed_size": 0,
            "width": 0,
            "height": 0,
            "format": final_options["format"],
            "error": None
        }

        try:
            # 打开图片
            image = Image.open(io.BytesIO(image_data))
            result["width"] = image.width
            result["height"] = image.height

            # 转换为RGB模式（处理透明通道）
            if image.mode in ("RGBA", "P"):
                image = self._handle_transparency(image)

            # 自动裁剪无意义的边框
            if final_options["auto_crop"]:
                image = await self._auto_crop(image)

            # 智能缩放
            image = await self._intelligent_resize(
                image,
                final_options["max_width"],
                final_options["max_height"],
                final_options["min_width"],
                final_options["min_height"],
                final_options["preserve_aspect_ratio"]
            )

            # 转换格式并压缩
            compressed_data = await self._convert_format(
                image,
                final_options["format"],
                final_options["quality"]
            )

            result["compressed_data"] = compressed_data
            result["compressed_size"] = len(compressed_data)
            result["width"] = image.width
            result["height"] = image.height

        except Exception as e:
            logger.error(f"压缩图片失败: {e}")
            result["error"] = str(e)

        return result

    def _handle_transparency(self, image: Image.Image) -> Image.Image:
        """
        处理透明通道

        Args:
            image: 带有透明通道的图片

        Returns:
            处理后的RGB图片
        """
        try:
            if image.mode == "RGBA":
                # 创建白色背景
                background = Image.new("RGB", image.size, (255, 255, 255))
                # 将透明图片粘贴到背景上
                background.paste(image, mask=image.split()[3])  # 3是alpha通道
                return background
            elif image.mode == "P":
                # 转换为RGB
                return image.convert("RGB")
            return image
        except Exception as e:
            logger.error(f"处理透明通道失败: {e}")
            return image

    async def _auto_crop(self, image: Image.Image) -> Image.Image:
        """
        自动裁剪无意义的边框

        Args:
            image: 原始图片

        Returns:
            裁剪后的图片
        """
        try:
            if not opencv_available:
                # OpenCV不可用，跳过自动裁剪
                return image
                
            # 转换为numpy数组
            img_array = np.array(image)
            
            # 转换为灰度图
            if len(img_array.shape) == 3:
                gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            else:
                gray = img_array

            # 阈值化，找到非边框区域
            _, thresh = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY_INV)

            # 找到轮廓
            contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

            if contours:
                # 找到最大的轮廓
                largest_contour = max(contours, key=cv2.contourArea)
                
                # 计算边界框
                x, y, w, h = cv2.boundingRect(largest_contour)
                
                # 确保裁剪区域合理
                if w > image.width * 0.1 and h > image.height * 0.1:
                    # 裁剪图片
                    image = image.crop((x, y, x + w, y + h))

            return image
        except Exception as e:
            logger.error(f"自动裁剪失败: {e}")
            return image

    async def _intelligent_resize(self, image: Image.Image, max_width: int, max_height: int, 
                                min_width: int, min_height: int, preserve_aspect_ratio: bool) -> Image.Image:
        """
        智能缩放图片

        Args:
            image: 原始图片
            max_width: 最大宽度
            max_height: 最大高度
            min_width: 最小宽度
            min_height: 最小高度
            preserve_aspect_ratio: 是否保持宽高比

        Returns:
            缩放后的图片
        """
        try:
            if preserve_aspect_ratio:
                # 计算缩放比例
                width_ratio = max_width / image.width
                height_ratio = max_height / image.height
                ratio = min(width_ratio, height_ratio)

                # 计算新尺寸
                new_width = int(image.width * ratio)
                new_height = int(image.height * ratio)

                # 确保不小于最小尺寸
                new_width = max(new_width, min_width)
                new_height = max(new_height, min_height)
            else:
                # 直接缩放到最大尺寸
                new_width = max_width
                new_height = max_height

            # 缩放图片
            image = image.resize((new_width, new_height), Image.LANCZOS)
            return image
        except Exception as e:
            logger.error(f"智能缩放失败: {e}")
            return image

    async def _convert_format(self, image: Image.Image, format: str, quality: int) -> bytes:
        """
        转换图片格式并压缩

        Args:
            image: 原始图片
            format: 目标格式
            quality: 压缩质量

        Returns:
            压缩后的图片数据
        """
        try:
            # 确保格式正确
            format = format.lower()
            if format not in ["webp", "jpg", "jpeg", "png"]:
                format = "webp"

            # 创建缓冲区
            buffer = io.BytesIO()

            # 保存图片
            if format == "jpg" or format == "jpeg":
                image.save(buffer, format="JPEG", quality=quality, optimize=True)
            elif format == "png":
                image.save(buffer, format="PNG", optimize=True, compress_level=6)
            else:  # webp
                image.save(buffer, format="WEBP", quality=quality, lossless=False)

            buffer.seek(0)
            return buffer.read()
        except Exception as e:
            logger.error(f"转换格式失败: {e}")
            raise

    async def batch_compress(self, images_data: List[bytes], options: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        批量压缩图片

        Args:
            images_data: 图片数据列表
            options: 压缩选项

        Returns:
            压缩结果列表
        """
        import asyncio
        tasks = [self.compress(image_data, options) for image_data in images_data]
        results = await asyncio.gather(*tasks)
        return results

    def calculate_compression_ratio(self, original_size: int, compressed_size: int) -> float:
        """
        计算压缩率

        Args:
            original_size: 原始大小
            compressed_size: 压缩后大小

        Returns:
            压缩率（0-1）
        """
        if original_size == 0:
            return 0.0
        return (original_size - compressed_size) / original_size
