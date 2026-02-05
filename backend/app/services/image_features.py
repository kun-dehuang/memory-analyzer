#!/usr/bin/env python3
"""
图片特征提取服务

用于提取图片的视觉和语义特征，进行美学评分和信息量评分
"""

import asyncio
import io
import logging
from typing import Dict, Any, List
import numpy as np
from PIL import Image
import torch
from transformers import CLIPProcessor, CLIPModel
from sklearn.cluster import KMeans

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


class ImageFeaturesExtractor:
    """图片特征提取器"""

    def __init__(self):
        """初始化特征提取器"""
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"使用设备: {self.device}")

        # 加载CLIP模型
        try:
            self.clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(self.device)
            self.clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
            logger.info("CLIP模型加载成功")
        except Exception as e:
            logger.error(f"CLIP模型加载失败: {e}")
            self.clip_model = None

    async def extract_features(self, image_data: bytes) -> Dict[str, Any]:
        """
        提取图片特征

        Args:
            image_data: 图片数据

        Returns:
            特征字典
        """
        features = {
            "visual_features": None,
            "semantic_features": None,
            "aesthetic_score": 0.0,
            "information_score": 0.0,
            "error": None
        }

        try:
            # 转换图片数据
            image = Image.open(io.BytesIO(image_data))
            cv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)

            # 提取视觉特征
            if self.clip_model:
                visual_features = await self._extract_visual_features(image)
                features["visual_features"] = visual_features.tolist() if visual_features is not None else None

            # 提取语义特征（使用CLIP的文本编码器作为后备）
            semantic_features = await self._extract_semantic_features(image)
            features["semantic_features"] = semantic_features.tolist() if semantic_features is not None else None

            # 计算美学评分
            aesthetic_score = await self._calculate_aesthetic_score(cv_image)
            features["aesthetic_score"] = aesthetic_score

            # 计算信息量评分
            information_score = await self._calculate_information_score(cv_image)
            features["information_score"] = information_score

        except Exception as e:
            logger.error(f"提取特征失败: {e}")
            features["error"] = str(e)

        return features

    async def _extract_visual_features(self, image: Image.Image) -> torch.Tensor:
        """
        使用CLIP提取视觉特征

        Args:
            image: PIL图片对象

        Returns:
            视觉特征张量
        """
        try:
            # 预处理图片
            inputs = self.clip_processor(images=image, return_tensors="pt").to(self.device)
            
            # 提取特征
            with torch.no_grad():
                features = self.clip_model.get_image_features(**inputs)
                # 归一化
                features = features / features.norm(dim=-1, keepdim=True)
            
            return features.cpu().squeeze()
        except Exception as e:
            logger.error(f"提取视觉特征失败: {e}")
            return None

    async def _extract_semantic_features(self, image: Image.Image) -> torch.Tensor:
        """
        提取语义特征

        Args:
            image: PIL图片对象

        Returns:
            语义特征张量
        """
        try:
            # 对于语义特征，我们可以使用CLIP的文本编码器作为后备
            # 或者使用预定义的描述符来提取语义信息
            if self.clip_model:
                # 使用一些通用的描述符
                descriptions = ["a photo", "a person", "a place", "an object", "a scene"]
                
                # 预处理图片和文本
                image_inputs = self.clip_processor(images=image, return_tensors="pt").to(self.device)
                text_inputs = self.clip_processor(text=descriptions, padding=True, return_tensors="pt").to(self.device)
                
                with torch.no_grad():
                    # 提取文本特征
                    text_features = self.clip_model.get_text_features(**text_inputs)
                    # 提取图片特征
                    image_features = self.clip_model.get_image_features(**image_inputs)
                    
                    # 计算相似度
                    similarity = (100.0 * image_features @ text_features.T).softmax(dim=-1)
                
                return similarity.cpu().squeeze()
            return None
        except Exception as e:
            logger.error(f"提取语义特征失败: {e}")
            return None

    async def _calculate_aesthetic_score(self, image: np.ndarray) -> float:
        """
        计算美学评分

        Args:
            image: OpenCV图片

        Returns:
            美学评分（0-1）
        """
        try:
            if not opencv_available:
                # OpenCV不可用，返回默认值
                return 0.5
                
            # 简化的美学评分算法
            # 基于对比度、清晰度、色彩丰富度等因素
            
            # 计算对比度
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            contrast = gray.std() / 255.0 if gray.std() > 0 else 0
            
            # 计算清晰度（使用Laplacian方差）
            laplacian = cv2.Laplacian(gray, cv2.CV_64F).var()
            sharpness = min(laplacian / 1000.0, 1.0)
            
            # 计算色彩丰富度
            hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
            saturation = hsv[:, :, 1].mean() / 255.0
            
            # 综合评分
            score = (contrast * 0.3 + sharpness * 0.4 + saturation * 0.3)
            return float(max(0, min(1, score)))
        except Exception as e:
            logger.error(f"计算美学评分失败: {e}")
            return 0.5

    async def _calculate_information_score(self, image: np.ndarray) -> float:
        """
        计算信息量评分

        Args:
            image: OpenCV图片

        Returns:
            信息量评分（0-1）
        """
        try:
            if not opencv_available:
                # OpenCV不可用，返回默认值
                return 0.5
                
            # 简化的信息量评分算法
            # 基于边缘密度、纹理复杂度等因素
            
            # 计算边缘密度
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            edges = cv2.Canny(gray, 100, 200)
            edge_density = edges.sum() / (image.shape[0] * image.shape[1]) / 255.0
            
            # 计算纹理复杂度（使用GLCM）
            if image.shape[0] > 100 and image.shape[1] > 100:
                # 缩小图片以提高计算速度
                small_gray = cv2.resize(gray, (100, 100))
                # 计算灰度共生矩阵
                try:
                    from skimage.feature import graycomatrix, graycoprops
                    glcm = graycomatrix(small_gray, distances=[1], angles=[0], levels=256, symmetric=True, normed=True)
                    contrast = graycoprops(glcm, 'contrast')[0, 0]
                    homogeneity = graycoprops(glcm, 'homogeneity')[0, 0]
                    texture_score = min(contrast / 1000.0, 1.0) * 0.5 + homogeneity * 0.5
                except ImportError:
                    # skimage不可用，使用默认值
                    texture_score = 0.5
            else:
                texture_score = 0.5
            
            # 综合评分
            score = (edge_density * 0.5 + texture_score * 0.5)
            return float(max(0, min(1, score)))
        except Exception as e:
            logger.error(f"计算信息量评分失败: {e}")
            return 0.5

    async def cluster_images(self, features_list: List[List[float]], n_clusters: int = 5) -> List[int]:
        """
        对图片特征进行聚类

        Args:
            features_list: 特征列表
            n_clusters: 聚类数量

        Returns:
            聚类标签
        """
        try:
            if not features_list or len(features_list) < 2:
                return [0] * len(features_list)

            # 使用KMeans聚类
            kmeans = KMeans(n_clusters=min(n_clusters, len(features_list)), random_state=42)
            labels = kmeans.fit_predict(features_list)
            
            return labels.tolist()
        except Exception as e:
            logger.error(f"聚类失败: {e}")
            return [0] * len(features_list)

    async def get_image_hash(self, image_data: bytes) -> str:
        """
        计算图片的MD5哈希值

        Args:
            image_data: 图片数据

        Returns:
            MD5哈希值
        """
        import hashlib
        return hashlib.md5(image_data).hexdigest()

    async def process_images_batch(self, images_data: List[bytes]) -> List[Dict[str, Any]]:
        """
        批量处理图片

        Args:
            images_data: 图片数据列表

        Returns:
            特征列表
        """
        tasks = [self.extract_features(image_data) for image_data in images_data]
        results = await asyncio.gather(*tasks)
        return results
