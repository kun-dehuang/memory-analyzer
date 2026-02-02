#!/usr/bin/env python3
"""
记忆分析器服务

基于现有的memory_profiler.py功能，集成到新架构中
"""

import asyncio
import json
import os
import re
import base64
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional
from PIL import Image
import google.generativeai as genai
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor
from pyicloud import PyiCloudService
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
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

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
                     verification_code: Optional[str] = None, 
                     session_data: Optional[str] = None, 
                     protagonist_features: Optional[Dict[str, Any]] = None) -> Tuple[List[Dict[str, Any]], Dict[str, Any], int, Tuple[str, str], Optional[str]]:
        """
        执行完整的记忆分析流程
        
        Args:
            user_id: 用户ID
            prompt_group_id: 提示词组ID
            icloud_email: iCloud邮箱
            icloud_password: iCloud密码
            verification_code: 二次验证码（如果需要）
            session_data: 会话数据（用于保持登录状态）
            protagonist_features: 主角特征
            
        Returns:
            (phase1_results, phase2_result, image_count, time_range, session_data)
        """
        logger.info("开始记忆分析流程")
        
        try:
            # 检查 iCloud 凭据
            if not icloud_email:
                raise Exception("iCloud邮箱不能为空")
            if not icloud_password:
                raise Exception("iCloud密码不能为空")
            
            # 1. 初始化iCloud服务并处理二次验证
            logger.info("初始化iCloud服务")
            api = PyiCloudService(icloud_email, icloud_password)
            
            # 处理二次验证
            if api.requires_2fa:
                logger.info("需要二次验证")
                
                # 如果提供了验证码，验证
                if verification_code:
                    logger.info("验证验证码")
                    result = api.validate_2fa_code(verification_code)
                    if not result:
                        raise Exception("验证码错误，请重新输入")
                    logger.info("验证码验证成功")
                    # 保存会话
                    session_data = api.dump_session()
                else:
                    # 没有提供验证码，需要前端输入
                    raise Exception("需要二次验证，请提供验证码")
            
            # 2. 从iCloud拉取照片
            logger.info("从iCloud拉取照片")
            all_photos = api.photos.all
            photos = []
            photo_map = {}
            
            # 转换为与原来格式兼容的结构
            for i, photo in enumerate(all_photos[:1000]):  # 限制数量
                photo_id = getattr(photo, 'id', f"photo_{i}")
                photo_filename = getattr(photo, 'filename', f"photo_{i}")
                photo_data = {
                    "id": photo_id,
                    "filename": photo_filename,
                    "datetime": getattr(photo, 'created', datetime.now()),
                    "gps_lat": None,  # 需要从照片元数据中提取
                    "gps_lon": None,  # 需要从照片元数据中提取
                    "has_gps": False
                }
                photos.append(photo_data)
                # 保存照片对象到映射中，以便后续使用
                photo_map[photo_id] = photo
                photo_map[photo_filename] = photo
            
            image_count = len(photos)
            logger.info(f"拉取到 {image_count} 张照片")
            
            if image_count == 0:
                raise Exception("未拉取到任何照片")
            
            # 3. 过滤照片
            logger.info("过滤照片")
            filtered_photos = await self.photo_filter.filter(
                photos=photos,
                user_id=user_id
            )
            
            filtered_count = len(filtered_photos)
            logger.info(f"过滤后剩余 {filtered_count} 张照片")
            
            if filtered_count == 0:
                raise Exception("过滤后未剩余任何照片")
            
            # 4. 提取EXIF信息
            logger.info("提取照片EXIF信息")
            photo_metadata = await self._extract_metadata(
                filtered_photos, 
                icloud_email=icloud_email, 
                icloud_password=icloud_password,
                api=api,  # 传递已验证的api实例
                photo_map=photo_map  # 传递照片映射，避免重复API调用
            )
            
            # 5. 按时间分组
            logger.info("按时间分组")
            batches = self._group_by_time(photo_metadata)
            
            # 6. 获取提示词
            logger.info("获取分析提示词")
            prompts = await self._get_prompts(prompt_group_id)
            
            # 7. 执行Phase 1分析
            logger.info("执行Phase 1分析")
            phase1_results = await self._execute_phase1(
                batches=batches,
                prompts=prompts,
                protagonist_features=protagonist_features
            )
            
            # 8. 执行Phase 2分析
            logger.info("执行Phase 2分析")
            phase2_result = await self._execute_phase2(
                phase1_results=phase1_results,
                prompts=prompts
            )
            
            # 9. 计算时间范围
            time_range = self._calculate_time_range(photo_metadata)
            
            logger.info("记忆分析流程完成")
            return phase1_results, phase2_result, filtered_count, time_range, session_data
            
        except Exception as e:
            logger.error(f"分析失败: {e}")
            raise
    
    async def _extract_metadata(self, photos: List[Dict[str, Any]], icloud_email: str, icloud_password: str, api=None, photo_map=None) -> List[Dict[str, Any]]:
        """提取照片元数据"""
        metadata_list = []
        
        def download_photo_sync(photo_id, email, password, api_instance=None, photo_map_instance=None):
            """同步下载照片"""
            try:
                # 先尝试从 photo_map 中获取照片对象
                if photo_map_instance and photo_id in photo_map_instance:
                    photo = photo_map_instance[photo_id]
                    # 下载照片到内存
                    photo_bytes = photo.download().content
                    logger.info(f"从缓存中获取照片 {photo_id} 并下载成功，大小: {len(photo_bytes)} bytes")
                    return photo_bytes
                
                # 如果没有找到，且有api实例，尝试使用api查找
                elif api_instance:
                    api = api_instance
                    logger.info(f"从API中查找照片: {photo_id}")
                    # 获取所有照片
                    all_photos = api.photos.all
                    
                    # 查找目标照片
                    for photo in all_photos:
                        if hasattr(photo, 'id') and photo.id == photo_id:
                            # 下载照片到内存
                            photo_bytes = photo.download().content
                            logger.info(f"照片 {photo_id} 下载成功，大小: {len(photo_bytes)} bytes")
                            return photo_bytes
                        elif hasattr(photo, 'filename') and photo.filename == photo_id:
                            # 也可以通过文件名查找
                            photo_bytes = photo.download().content
                            logger.info(f"照片 {photo_id} 下载成功，大小: {len(photo_bytes)} bytes")
                            return photo_bytes
                
                logger.error(f"未找到照片: {photo_id}")
                return None
            except Exception as e:
                logger.error(f"下载照片失败: {e}")
                return None
        
        async def process_photo(photo):
            """处理单张照片"""
            try:
                # 从 iCloud 照片数据中提取元数据
                metadata = {
                    "path": photo.get("path", ""),
                    "filename": photo.get("filename", ""),
                    "datetime": photo.get("datetime", datetime.now()),
                    "gps_lat": photo.get("gps_lat"),
                    "gps_lon": photo.get("gps_lon"),
                    "has_gps": photo.get("has_gps", False),
                    "icloud_photo_id": photo.get("id"),
                    "base64_image": None
                }
                
                # 下载 iCloud 照片并转换为 Base64
                icloud_photo_id = photo.get("id") or photo.get("filename")
                if icloud_photo_id:
                    logger.info(f"正在下载 iCloud 照片: {icloud_photo_id}")
                    
                    try:
                        # 使用线程池执行同步下载
                        loop = asyncio.get_event_loop()
                        photo_bytes = await loop.run_in_executor(
                            self.executor,
                            download_photo_sync,
                            icloud_photo_id,
                            icloud_email,
                            icloud_password,
                            api,  # 传递已验证的api实例
                            photo_map  # 传递照片映射
                        )
                        
                        if photo_bytes:
                            # 转换为 Base64
                            base64_image = base64.b64encode(photo_bytes).decode('utf-8')
                            metadata["base64_image"] = base64_image
                            logger.info(f"照片 {icloud_photo_id} 编码完成")
                    except Exception as e:
                        logger.error(f"下载 iCloud 照片失败: {e}")
                        # 下载失败时，继续处理，只是没有 base64_image
                
                return metadata
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
            
            # 添加照片信息和图片数据
            photo_info = []
            image_count = 0
            
            for photo in batch["photos"][:10]:  # 限制数量，避免提示词过长
                photo_info.append(f"- {photo['filename']} (拍摄时间: {photo['datetime'].isoformat()})")
                
                # 添加 Base64 编码的图片（只添加有效的图片数据）
                if photo.get("base64_image") and photo["base64_image"] != "c2ltdWxhdGVkIGltYWdlIGRhdGE=":  # 排除模拟数据
                    logger.info(f"添加图片到分析: {photo['filename']}")
                    # 构建图片 Blob
                    # 注意：实际项目中，需要根据图片的实际格式设置正确的 mime_type
                    image_blob = {
                        "mime_type": "image/jpeg",  # 假设是 JPEG 格式
                        "data": photo["base64_image"]
                    }
                    content.append(image_blob)
                    image_count += 1
            
            # 记录处理的图片数量
            logger.info(f"批次 {batch['batch_id']} 包含 {image_count} 张有效图片")
            
            if len(batch["photos"]) > 10:
                photo_info.append(f"... 等 {len(batch['photos']) - 10} 张照片")
            
            # 添加照片信息文本
            content.append(f"\n**批次照片信息**:\n{"\n".join(photo_info)}")
            
            try:
                # 生成分析结果
                model = genai.GenerativeModel('models/gemini-2.5-flash')
                response = model.generate_content(content)
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
            model = genai.GenerativeModel('models/gemini-2.5-flash')
            response = model.generate_content(content)
            
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
        # 尝试从文本中提取JSON
        try:
            # 查找JSON开始和结束的位置
            if '```json' in text:
                json_str = text.split('```json')[1].split('```')[0].strip()
            elif text.strip().startswith('{') and text.strip().endswith('}'):
                json_str = text.strip()
            else:
                # 如果没有找到完整的JSON，尝试提取结构化信息
                raise ValueError("未找到完整的JSON格式")
            
            # 解析JSON
            result = json.loads(json_str)
            # 添加原始输出
            result["raw_output"] = text
            return result
        except Exception as e:
            # 如果解析失败，使用简化的结果
            logger.warning(f"解析Phase 2输出失败: {e}")
            
            result = {
                "meta": {
                    "scan_summary": f"分析结果摘要: {text[:100]}...",
                    "timeline_chapters": ["时间线分析完成"]
                },
                "L1_Spatio_Temporal": {
                    "life_radius": "基于照片GPS信息分析的活动范围",
                    "biological_clock": "基于照片拍摄时间分析的作息规律"
                },
                "L3_Social_Graph": {
                    "core_circle": ["基于照片中人物出现频率分析的核心社交圈"],
                    "relationship_dynamics": []
                },
                "L4_Behavior_Trends": {
                    "social_mask": "基于照片内容分析的社交形象",
                    "consumption_shift": "基于照片中消费场景分析的消费变化"
                },
                "L5_Psychology": {
                    "personality_type": "基于照片内容分析的人格类型",
                    "emotional_curve": "基于照片内容分析的情绪曲线"
                },
                "L6_Hooks": {
                    "story_trigger": "基于照片内容分析的故事触发点"
                },
                "raw_output": text
            }
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
        return "你是一位专业的视觉人类学家。请详细描述这批照片中的所有视觉要素，包括人物、场景、物体、活动等。请特别注意照片中的细节，如服装、表情、环境等。你的描述应该全面、客观，并且能够捕捉到照片的本质特征。"
    
    def _get_default_phase2_prompt(self) -> str:
        """获取默认的Phase 2提示词"""
        return """你是一位数字人类学家和心理学专家。现在需要你基于用户的完整相册记录，进行深度的综合分析。

请按照以下格式输出分析结果：

```json
{
  "meta": {
    "scan_summary": "总体分析摘要",
    "timeline_chapters": ["时间线章节1", "时间线章节2"]
  },
  "L1_Spatio_Temporal": {
    "life_radius": "生活半径分析",
    "biological_clock": "生物钟分析"
  },
  "L3_Social_Graph": {
    "core_circle": ["核心社交圈成员1", "核心社交圈成员2"],
    "relationship_dynamics": ["关系动态描述1"]
  },
  "L4_Behavior_Trends": {
    "social_mask": "社交面具分析",
    "consumption_shift": "消费变化分析"
  },
  "L5_Psychology": {
    "personality_type": "人格类型分析",
    "emotional_curve": "情绪曲线分析"
  },
  "L6_Hooks": {
    "story_trigger": "故事触发点分析"
  }
}
```

请基于Phase 1的分析结果，为每个部分提供详细、具体的分析。你的分析应该基于实际的照片内容，而不是一般性的描述。
"""
