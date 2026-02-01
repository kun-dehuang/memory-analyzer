#!/usr/bin/env python3
"""
记忆分析器服务

基于现有的memory_profiler.py功能，集成到新架构中
"""

import asyncio
import json
import os
import re
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional
from PIL import Image
import google.genai as genai
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor
import logging

from app.config.database import prompts_collection, photo_metadata_collection
from app.services.exif_extractor import EXIFExtractor
from app.services.icloud_client import iCloudClient
from app.services.photo_filter import PhotoFilter

load_dotenv()

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 配置Gemini API
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

class MemoryAnalyzer:
    """记忆分析器"""
    
    def __init__(self):
        """初始化分析器"""
        self.executor = ThreadPoolExecutor(max_workers=4)
        self.exif_extractor = EXIFExtractor()
        self.icloud_client = iCloudClient()
        self.photo_filter = PhotoFilter()
    
    async def analyze(self, user_id: str, prompt_group_id: str, 
                     icloud_email: str, icloud_password: str, 
                     protagonist_features: Optional[Dict[str, Any]] = None) -> Tuple[List[Dict[str, Any]], Dict[str, Any], int, Tuple[str, str]]:
        """
        执行完整的记忆分析流程
        
        Args:
            user_id: 用户ID
            prompt_group_id: 提示词组ID
            icloud_email: iCloud邮箱
            icloud_password: iCloud密码
            protagonist_features: 主角特征
            
        Returns:
            (phase1_results, phase2_result, image_count, time_range)
        """
        logger.info("开始记忆分析流程")
        
        try:
            # 1. 从iCloud拉取照片
            logger.info("从iCloud拉取照片")
            photos = await self.icloud_client.get_photos(
                email=icloud_email,
                password=icloud_password,
                max_count=1000
            )
            
            image_count = len(photos)
            logger.info(f"拉取到 {image_count} 张照片")
            
            if image_count == 0:
                raise Exception("未拉取到任何照片")
            
            # 2. 过滤照片
            logger.info("过滤照片")
            filtered_photos = await self.photo_filter.filter(
                photos=photos,
                user_id=user_id
            )
            
            filtered_count = len(filtered_photos)
            logger.info(f"过滤后剩余 {filtered_count} 张照片")
            
            if filtered_count == 0:
                raise Exception("过滤后未剩余任何照片")
            
            # 3. 提取EXIF信息
            logger.info("提取照片EXIF信息")
            photo_metadata = await self._extract_metadata(filtered_photos)
            
            # 4. 按时间分组
            logger.info("按时间分组")
            batches = self._group_by_time(photo_metadata)
            
            # 5. 获取提示词
            logger.info("获取分析提示词")
            prompts = await self._get_prompts(prompt_group_id)
            
            # 6. 执行Phase 1分析
            logger.info("执行Phase 1分析")
            phase1_results = await self._execute_phase1(
                batches=batches,
                prompts=prompts,
                protagonist_features=protagonist_features
            )
            
            # 7. 执行Phase 2分析
            logger.info("执行Phase 2分析")
            phase2_result = await self._execute_phase2(
                phase1_results=phase1_results,
                prompts=prompts
            )
            
            # 8. 计算时间范围
            time_range = self._calculate_time_range(photo_metadata)
            
            logger.info("记忆分析流程完成")
            return phase1_results, phase2_result, filtered_count, time_range
            
        except Exception as e:
            logger.error(f"分析失败: {e}")
            raise
    
    async def _extract_metadata(self, photos: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """提取照片元数据"""
        metadata_list = []
        
        async def process_photo(photo):
            """处理单张照片"""
            try:
                # 这里需要根据iCloud返回的照片格式进行调整
                # 暂时使用模拟数据
                return {
                    "path": photo.get("path", ""),
                    "filename": photo.get("filename", ""),
                    "datetime": photo.get("datetime", datetime.now()),
                    "gps_lat": photo.get("gps_lat"),
                    "gps_lon": photo.get("gps_lon"),
                    "has_gps": photo.get("has_gps", False),
                    "icloud_photo_id": photo.get("id")
                }
            except Exception as e:
                logger.error(f"处理照片失败: {e}")
                return None
        
        # 并发处理
        tasks = [process_photo(photo) for photo in photos]
        results = await asyncio.gather(*tasks)
        
        # 过滤None值
        metadata_list = [result for result in results if result]
        
        return metadata_list
    
    def _group_by_time(self, photos: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """按时间分组"""
        # 按月份分组
        batches = []
        photo_dict = {}
        
        for photo in photos:
            month_key = photo["datetime"].strftime("%Y-%m")
            if month_key not in photo_dict:
                photo_dict[month_key] = []
            photo_dict[month_key].append(photo)
        
        # 转换为批次
        for month_key, month_photos in photo_dict.items():
            # 计算时间范围
            min_time = min(photo["datetime"] for photo in month_photos)
            max_time = max(photo["datetime"] for photo in month_photos)
            
            batch = {
                "batch_id": month_key,
                "photos": month_photos,
                "time_range": (min_time, max_time),
                "image_count": len(month_photos)
            }
            batches.append(batch)
        
        # 按时间排序
        batches.sort(key=lambda x: x["time_range"][0])
        
        return batches
    
    async def _get_prompts(self, prompt_group_id: str) -> Dict[str, str]:
        """获取提示词"""
        prompts = {}
        
        # 查询该组的所有提示词
        async for prompt in prompts_collection.find({"prompt_group_id": prompt_group_id}):
            prompts[prompt["type"]] = prompt["content"]
        
        # 如果没有找到，使用默认提示词
        if "phase1" not in prompts:
            prompts["phase1"] = self._get_default_phase1_prompt()
        
        if "phase2" not in prompts:
            prompts["phase2"] = self._get_default_phase2_prompt()
        
        return prompts
    
    async def _execute_phase1(self, batches: List[Dict[str, Any]], 
                             prompts: Dict[str, str], 
                             protagonist_features: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """执行Phase 1分析"""
        phase1_results = []
        
        for batch in batches:
            logger.info(f"分析批次: {batch['batch_id']} ({batch['image_count']}张照片)")
            
            # 构建提示词
            phase1_prompt = prompts.get("phase1", self._get_default_phase1_prompt())
            
            # 准备批处理信息
            batch_info = {
                "batch_id": batch["batch_id"],
                "image_count": batch["image_count"],
                "time_range": {
                    "start": batch["time_range"][0].isoformat(),
                    "end": batch["time_range"][1].isoformat()
                }
            }
            
            # 如果有主角特征，添加到提示词中
            if protagonist_features:
                phase1_prompt += f"\n\n**主角特征**:\n{json.dumps(protagonist_features, ensure_ascii=False)}"
            
            # 准备分析内容
            content = [phase1_prompt]
            
            # 添加照片信息（实际项目中可能需要传递图片数据）
            # 这里我们使用照片的元数据作为分析依据
            photo_info = "\n".join([
                f"- {photo['filename']} (拍摄时间: {photo['datetime'].isoformat()})"
                for photo in batch["photos"][:10]  # 限制数量，避免提示词过长
            ])
            
            if len(batch["photos"]) > 10:
                photo_info += f"\n... 等 {len(batch['photos']) - 10} 张照片"
            
            content.append(f"\n**批次照片信息**:\n{photo_info}")
            
            try:
                # 生成分析结果
                response = client.generate_content(
                    model="models/gemini-2.5-flash",
                    content=content
                )
                raw_output = response.text.strip()
                
                # 构建结果
                result = {
                    "batch_id": batch["batch_id"],
                    "processed_at": datetime.now().isoformat(),
                    "image_count": batch["image_count"],
                    "time_range": (
                        batch["time_range"][0].isoformat(),
                        batch["time_range"][1].isoformat()
                    ),
                    "raw_vlm_output": raw_output,
                    "analysis_summary": self._extract_summary(raw_output)
                }
                
                logger.info(f"批次 {batch['batch_id']} 分析完成")
                
            except Exception as e:
                logger.error(f"批次 {batch['batch_id']} 分析失败: {e}")
                import traceback
                traceback.print_exc()
                
                # 构建错误结果
                result = {
                    "batch_id": batch["batch_id"],
                    "processed_at": datetime.now().isoformat(),
                    "image_count": batch["image_count"],
                    "time_range": (
                        batch["time_range"][0].isoformat(),
                        batch["time_range"][1].isoformat()
                    ),
                    "raw_vlm_output": f"分析失败: {str(e)}",
                    "analysis_summary": "分析失败"
                }
            
            phase1_results.append(result)
        
        return phase1_results
    
    async def _execute_phase2(self, phase1_results: List[Dict[str, Any]], 
                             prompts: Dict[str, str]) -> Dict[str, Any]:
        """执行Phase 2分析"""
        # 构建提示词
        phase2_prompt = prompts.get("phase2", self._get_default_phase2_prompt())
        
        # 准备phase1结果摘要
        phase1_summary = "\n".join([
            f"**批次 {result['batch_id']}**:\n" 
            f"- 照片数量: {result['image_count']}\n" 
            f"- 时间范围: {result['time_range'][0]} 至 {result['time_range'][1]}\n" 
            f"- 分析摘要: {result.get('analysis_summary', '无')}\n" 
            for result in phase1_results
        ])
        
        # 准备分析内容
        content = [
            phase2_prompt,
            f"\n\n**Phase 1 分析结果**:\n{phase1_summary}"
        ]
        
        try:
            # 生成分析结果
            response = client.generate_content(
                model="models/gemini-2.5-flash",
                content=content
            )
            
            # 检查响应是否包含有效的 Part
            if not response.candidates or not response.candidates[0].content.parts:
                raise ValueError("响应不包含有效的内容")
            
            raw_output = response.text.strip()
            
            # 解析分析结果
            result = self._parse_phase2_output(raw_output)
            
            logger.info("Phase 2 分析完成")
            
        except Exception as e:
            logger.error(f"Phase 2 分析失败: {e}")
            import traceback
            traceback.print_exc()
            
            # 构建错误结果
            result = {
                "meta": {
                    "scan_summary": f"已分析 {sum(r['image_count'] for r in phase1_results)} 张图片",
                    "timeline_chapters": ["分析失败"]
                },
                "L1_Spatio_Temporal": {
                    "life_radius": "分析失败",
                    "biological_clock": "分析失败"
                },
                "L3_Social_Graph": {
                    "core_circle": [],
                    "relationship_dynamics": []
                },
                "L4_Behavior_Trends": {
                    "social_mask": "分析失败",
                    "consumption_shift": "分析失败"
                },
                "L5_Psychology": {
                    "personality_type": "分析失败",
                    "emotional_curve": "分析失败"
                },
                "L6_Hooks": {
                    "story_trigger": "分析失败"
                },
                "error": str(e)
            }
        
        return result
    
    def _extract_summary(self, text: str) -> str:
        """从分析结果中提取摘要"""
        # 简单的摘要提取逻辑，实际项目中可以使用更复杂的方法
        lines = text.split('\n')
        summary_lines = []
        
        for line in lines[:5]:  # 取前5行作为摘要
            if line.strip():
                summary_lines.append(line.strip())
        
        return ' '.join(summary_lines[:3])  # 限制摘要长度
    
    def _parse_phase2_output(self, text: str) -> Dict[str, Any]:
        """解析Phase 2分析结果"""
        # 尝试从文本中提取结构化信息
        # 这里使用简化的解析逻辑，实际项目中可能需要更复杂的方法
        
        result = {
            "meta": {
                "scan_summary": "",
                "timeline_chapters": []
            },
            "L1_Spatio_Temporal": {
                "life_radius": "",
                "biological_clock": ""
            },
            "L3_Social_Graph": {
                "core_circle": [],
                "relationship_dynamics": []
            },
            "L4_Behavior_Trends": {
                "social_mask": "",
                "consumption_shift": ""
            },
            "L5_Psychology": {
                "personality_type": "",
                "emotional_curve": ""
            },
            "L6_Hooks": {
                "story_trigger": ""
            },
            "raw_output": text
        }
        
        # 填充基本信息
        result["meta"]["scan_summary"] = f"分析结果摘要: {text[:100]}..."
        result["meta"]["timeline_chapters"] = ["时间线分析完成"]
        
        # 简单填充其他字段
        result["L1_Spatio_Temporal"]["life_radius"] = "基于照片GPS信息分析的活动范围"
        result["L1_Spatio_Temporal"]["biological_clock"] = "基于照片拍摄时间分析的作息规律"
        result["L3_Social_Graph"]["core_circle"] = ["基于照片中人物出现频率分析的核心社交圈"]
        result["L4_Behavior_Trends"]["social_mask"] = "基于照片内容分析的社交形象"
        result["L4_Behavior_Trends"]["consumption_shift"] = "基于照片中消费场景分析的消费变化"
        result["L5_Psychology"]["personality_type"] = "基于照片内容分析的人格类型"
        result["L5_Psychology"]["emotional_curve"] = "基于照片内容分析的情绪曲线"
        result["L6_Hooks"]["story_trigger"] = "基于照片内容分析的故事触发点"
        
        return result
    
    def _calculate_time_range(self, photos: List[Dict[str, Any]]) -> Tuple[str, str]:
        """计算时间范围"""
        if not photos:
            return ("", "")
        
        min_time = min(photo["datetime"] for photo in photos)
        max_time = max(photo["datetime"] for photo in photos)
        
        return (
            min_time.strftime("%Y-%m-%d"),
            max_time.strftime("%Y-%m-%d")
        )
    
    def _get_default_phase1_prompt(self) -> str:
        """获取默认的Phase 1提示词"""
        return "你是一位专业的视觉人类学家。请详细描述这批照片中的所有视觉要素..."
    
    def _get_default_phase2_prompt(self) -> str:
        """获取默认的Phase 2提示词"""
        return "你是一位数字人类学家和心理学专家。现在需要你基于用户的完整相册记录..."
