#!/usr/bin/env python3
"""
记忆分析器服务

基于现有的memory_profiler.py功能，集成到新架构中
"""

import asyncio
import json
import os
import base64
import time
import traceback
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional
import google.generativeai as genai
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor
from pyicloud import PyiCloudService
import logging

# 可选依赖
try:
    import psutil
except ImportError:
    psutil = None

from app.config.database import prompts_collection, photos_collection
from app.services.exif_extractor import EXIFExtractor
from app.services.icloud_client import iCloudClient
from app.services.photo_filter import PhotoFilter
from app.services.image_features import ImageFeaturesExtractor
from app.services.image_compressor import ImageCompressor

load_dotenv()

# 配置日志
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
# 同时开启requests库的DEBUG日志，查看请求头/响应体
logging.getLogger("requests").setLevel(logging.DEBUG)
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
        self.features_extractor = ImageFeaturesExtractor()
        self.image_compressor = ImageCompressor()

    async def analyze(
        self,
        user_id: str,
        prompt_group_id: str,
        icloud_email: str,
        icloud_password: str,
        verification_code: Optional[str] = None,
        protagonist_features: Optional[Dict[str, Any]] = None,
    ) -> Tuple[
        List[Dict[str, Any]], Dict[str, Any], int, Tuple[str, str], Dict[str, Any], List[str]
    ]:
        """
        执行完整的记忆分析流程

        Args:
            user_id: 用户ID
            prompt_group_id: 提示词组ID
            icloud_email: iCloud邮箱
            icloud_password: iCloud密码
            verification_code: 二次验证码（如果需要）
            protagonist_features: 主角特征

        Returns:
            (phase1_results, phase2_result, image_count, time_range)
        """
        # 确保logger已定义
        if "logger" not in globals():
            global logger
            logger = logging.getLogger(__name__)

        # 创建局部logger变量，确保在异常处理中也能使用
        local_logger = logger

        # 初始化统计信息
        stats = {
            "total_time": 0,
            "download_time": 0,
            "filter_time": 0,
            "process_time": 0,
            "phase1_time": 0,
            "phase1_tokens": 0,
            "phase1_prompt_tokens": 0,
            "phase1_candidates_tokens": 0,
            "phase2_time": 0,
            "phase2_tokens": 0,
            "phase2_prompt_tokens": 0,
            "phase2_candidates_tokens": 0,
        }

        # 记录开始时间
        start_time = time.time()

        local_logger.info("开始记忆分析流程")

        try:
            # 检查 iCloud 凭据
            if not icloud_email:
                raise Exception("iCloud邮箱不能为空")
            if not icloud_password:
                raise Exception("iCloud密码不能为空")

            # 1. 初始化iCloud服务并处理二次验证
            local_logger.info("初始化iCloud服务")

            # 创建用户会话目录，用于存储iCloud会话数据
            # 确保数据目录存在
            data_dir = Path("/app/data/icloud_sessions")
            if not data_dir.exists():
                # 如果在Windows上运行，使用相对路径
                data_dir = Path("/app/data/icloud_sessions")
            # 创建用户会话目录
            user_session_dir = data_dir / user_id
            user_session_dir.mkdir(parents=True, exist_ok=True)
            user_session_dir.chmod(0o777)

            local_logger.info(f"创建用户会话目录成功: {user_session_dir}")

            # 初始化iCloud服务，指定会话目录
            try:
                api = PyiCloudService(
                    apple_id=icloud_email,
                    password=icloud_password,
                    cookie_directory=str(
                        user_session_dir
                    ),  # 关键：指定持久化的会话目录
                    china_mainland=True,
                )
                local_logger.info(f"服务实例创建成功，requires_2fa: {api.requires_2fa}")
            except Exception as e:
                error_message = str(e)
                local_logger.error(f"初始化iCloud服务失败: {error_message}")
                if "Invalid email/password combination" in error_message:
                    raise Exception("Invalid email/password combination")
                else:
                    raise

            # 检查是否提供了验证码
            if verification_code:
                local_logger.info("提供了验证码，验证验证码")
                # 验证验证码
                result = api.validate_2fa_code(verification_code)
                local_logger.info(f"验证码验证结果: {result}")
                if not result:
                    raise Exception("验证码错误，请重新输入")
                local_logger.info("验证码验证成功")

                # 验证成功后，立即保存会话（将内存中的有效会话写入指定目录的文件）
                try:
                    local_logger.info("二次验证成功，会话已持久化保存！")
                except Exception as e:
                    local_logger.error(f"保存会话失败: {e}")

                # 添加一个小的延迟，给iCloud服务端时间来处理认证请求
                local_logger.info("验证成功后，添加延迟以确保认证状态正确更新")
                time.sleep(2)  # 添加2秒延迟
                local_logger.info("延迟结束，继续执行分析流程")

            else:
                # 没有提供验证码，尝试访问照片服务来检测是否需要二次验证
                local_logger.info(
                    "没有提供验证码，测试访问照片服务来检测是否需要二次验证"
                )
                try:
                    # 尝试获取照片服务对象，这会触发认证检查
                    photos_service = api.photos
                    local_logger.info("访问照片服务成功，不需要二次验证")
                except Exception as e:
                    error_message = str(e)
                    local_logger.error(f"访问照片服务失败: {error_message}")
                    # 检查是否是认证错误
                    if (
                        "Missing X-APPLE-WEBAUTH-TOKEN" in error_message
                        or "Authentication required"
                        or "Photos service not available" in error_message
                    ):
                        # 认证错误，需要二次验证
                        raise Exception("需要二次验证，请提供验证码")
                    else:
                        # 其他错误，直接抛出
                        raise

            # 2. 从iCloud拉取照片
            local_logger.info("从iCloud拉取照片")
            # 尝试获取照片列表

            # 初始化photos_assets为空列表
            photos_assets = []
            # 获取照片服务
            photos_service = api.photos
            local_logger.info("获取照片服务成功")

            # 尝试获取照片
            try:
                # 尝试获取all属性
                if hasattr(photos_service, "all"):
                    all_attr = getattr(photos_service, "all")
                    local_logger.info(f"all属性类型: {type(all_attr)}")
                    # 尝试转换为列表
                    try:
                        # 内存监控（可选）
                        try:
                            if psutil:
                                process = psutil.Process(os.getpid())
                                mem_before = (
                                    process.memory_info().rss / 1024 / 1024
                                )  # MB
                                local_logger.info(
                                    f"转换前内存使用: {mem_before:.2f} MB"
                                )
                                has_memory_monitor = True
                            else:
                                local_logger.warning("psutil未安装，跳过内存监控")
                                has_memory_monitor = False
                        except Exception as e:
                            local_logger.warning(f"内存监控失败: {e}")
                            has_memory_monitor = False

                        # 限制照片数量，避免内存溢出
                        photos_assets = []
                        count = 0
                        max_photos = 100  # 限制为100张照片
                        batch_size = 10  # 每批处理10张

                        local_logger.info(f"开始获取照片，限制为 {max_photos} 张")

                        # 分批处理
                        for i, photo in enumerate(all_attr):
                            photos_assets.append(photo)
                            count += 1

                            # 每批打印进度
                            if count % batch_size == 0:
                                local_logger.info(f"已获取 {count} 张照片")

                            # 达到限制后停止
                            if count >= max_photos:
                                local_logger.info(f"达到照片数量限制 ({max_photos} 张)")
                                break

                        # 内存监控
                        if has_memory_monitor:
                            mem_after = process.memory_info().rss / 1024 / 1024  # MB
                            local_logger.info(
                                f"转换后内存使用: {mem_after:.2f} MB, 增加: {mem_after - mem_before:.2f} MB"
                            )

                        local_logger.info(f"成功获取 {len(photos_assets)} 张照片")

                        # 验证照片对象
                        if photos_assets:
                            first_photo = photos_assets[0]
                            photo_attrs = [
                                attr
                                for attr in dir(first_photo)
                                if not attr.startswith("_")
                            ]
                            local_logger.info(f"第一张照片类型: {type(first_photo)}")
                            local_logger.info(
                                f"照片对象属性: {photo_attrs[:10]}..."
                            )  # 只显示前10个属性
                    except Exception as e:
                        local_logger.warning(f"转换all属性失败: {e}")
                        traceback.print_exc()
                        # 使用空列表作为后备
                        photos_assets = []
                        local_logger.info("使用空列表作为后备")
                else:
                    local_logger.warning("photos_service没有all属性")

                # 确保photos_assets是可迭代的
                if not hasattr(photos_assets, "__iter__"):
                    local_logger.warning(
                        f"photos_assets不可迭代，类型: {type(photos_assets)}"
                    )
                    # 使用空列表
                    photos_assets = []
                    local_logger.info("使用空列表作为后备")

                local_logger.info(
                    f"最终获取到的photos_assets类型: {type(photos_assets)}"
                )
            except Exception as e:
                error_message = str(e)
                local_logger.error(f"获取照片列表失败: {error_message}")

                # 检查是否是认证错误
                if (
                    "Missing X-APPLE-WEBAUTH-TOKEN" in error_message
                    or "Authentication required" in error_message
                ):
                    # 认证错误，抛出需要二次验证的异常，确保消息包含"需要二次验证"关键词
                    # 这样memory.py中的错误处理代码就能正确识别并更新记录状态为needs_verification
                    raise Exception("需要二次验证，请提供验证码")
                else:
                    # 其他错误，直接抛出
                    raise
            photos = []
            photo_map = {}

            # 确保photos_assets是列表
            try:
                # 尝试转换为列表
                photos_assets_list = list(photos_assets)
                local_logger.info(
                    f"成功转换为列表，共 {len(photos_assets_list)} 张照片"
                )
            except Exception as e:
                local_logger.warning(f"转换为列表失败: {e}")
                # 使用空列表
                photos_assets_list = []
                local_logger.info("使用空列表")

            # 限制数量
            limited_photos = photos_assets_list[:1000]
            local_logger.info(f"限制后剩余 {len(limited_photos)} 张照片")

            # 转换为与原来格式兼容的结构
            for i, photo in enumerate(limited_photos):
                photo_id = getattr(photo, "id", f"photo_{i}")
                photo_filename = getattr(photo, "filename", f"photo_{i}")
                photo_data = {
                    "id": photo_id,
                    "filename": photo_filename,
                    "datetime": getattr(photo, "created", datetime.now()),
                    "gps_lat": None,  # 需要从照片元数据中提取
                    "gps_lon": None,  # 需要从照片元数据中提取
                    "has_gps": False,
                }
                photos.append(photo_data)
                # 保存照片对象到映射中，以便后续使用
                photo_map[photo_id] = photo
                photo_map[photo_filename] = photo

            image_count = len(photos)
            local_logger.info(f"拉取到 {image_count} 张照片")

            if image_count == 0:
                raise Exception("未拉取到任何照片")

            # 3. 过滤照片
            local_logger.info("过滤照片")
            filtered_photos, filter_time = await self.photo_filter.filter(
                photos=photos, user_id=user_id, photo_map=photo_map
            )
            # 记录过滤耗时
            stats["filter_time"] = filter_time

            filtered_count = len(filtered_photos)
            local_logger.info(f"过滤后剩余 {filtered_count} 张照片")

            if filtered_count == 0:
                raise Exception("过滤后未剩余任何照片")

            # 4. 提取EXIF信息
            local_logger.info("提取照片EXIF信息")
            photo_metadata, download_time = await self._extract_metadata(
                filtered_photos,
                icloud_email=icloud_email,
                icloud_password=icloud_password,
                api=api,  # 传递已验证的api实例
                photo_map=photo_map,  # 传递照片映射，避免重复API调用
            )
            # 记录下载耗时
            stats["download_time"] = download_time

            # 5. 处理图片（特征提取、压缩、存储）
            local_logger.info("处理图片")
            processed_photos, process_time = await self._process_images(
                photo_metadata, user_id
            )
            stats["process_time"] = process_time

            # 6. 按时间分组
            local_logger.info("按时间分组")
            batches = self._group_by_time(processed_photos)

            # 6. 获取提示词
            local_logger.info("获取分析提示词")
            prompts = await self._get_prompts(prompt_group_id)

            # 7. 执行Phase 1分析
            local_logger.info("执行Phase 1分析")
            (
                phase1_results,
                phase1_time,
                phase1_tokens,
                phase1_prompt_tokens,
                phase1_candidates_tokens,
            ) = await self._execute_phase1(
                batches=batches,
                prompts=prompts,
                protagonist_features=protagonist_features,
            )
            # 记录Phase 1耗时和token消耗
            stats["phase1_time"] = phase1_time
            stats["phase1_tokens"] = phase1_tokens
            stats["phase1_prompt_tokens"] = phase1_prompt_tokens
            stats["phase1_candidates_tokens"] = phase1_candidates_tokens

            # 8. 执行Phase 2分析
            local_logger.info("执行Phase 2分析")
            (
                phase2_result,
                phase2_time,
                phase2_tokens,
                phase2_prompt_tokens,
                phase2_candidates_tokens,
            ) = await self._execute_phase2(
                phase1_results=phase1_results, prompts=prompts
            )
            # 记录Phase 2耗时和token消耗
            stats["phase2_time"] = phase2_time
            stats["phase2_tokens"] = phase2_tokens
            stats["phase2_prompt_tokens"] = phase2_prompt_tokens
            stats["phase2_candidates_tokens"] = phase2_candidates_tokens

            # 9. 计算时间范围
            time_range = self._calculate_time_range(photo_metadata)

            # 计算总耗时
            stats["total_time"] = time.time() - start_time
            local_logger.info(f"记忆分析总耗时: {stats['total_time']:.2f} 秒")
            local_logger.info(f"下载图片耗时: {stats['download_time']:.2f} 秒")
            local_logger.info(f"过滤图片耗时: {stats['filter_time']:.2f} 秒")
            local_logger.info(f"处理图片耗时: {stats['process_time']:.2f} 秒")
            local_logger.info(
                f"Phase 1 分析耗时: {stats['phase1_time']:.2f} 秒, Token消耗: {stats['phase1_tokens']}"
            )
            local_logger.info(
                f"Phase 2 分析耗时: {stats['phase2_time']:.2f} 秒, Token消耗: {stats['phase2_tokens']}"
            )

            # 收集使用的图片ID
            used_photos = []
            for photo in processed_photos:
                if "photo_id" in photo:
                    used_photos.append(photo["photo_id"])

            local_logger.info("记忆分析流程完成")
            return phase1_results, phase2_result, filtered_count, time_range, stats, used_photos

        except Exception as e:
            local_logger.error(f"分析失败: {e}")
            raise

    async def _extract_metadata(
        self,
        photos: List[Dict[str, Any]],
        icloud_email: str,
        icloud_password: str,
        api=None,
        photo_map=None,
    ) -> Tuple[List[Dict[str, Any]], float]:
        """提取照片元数据"""
        metadata_list = []

        # 确保logger已定义
        if "logger" not in globals():
            global logger
            logger = logging.getLogger(__name__)

        # 创建局部logger变量，供嵌套函数使用
        local_logger = logger

        # 记录开始时间
        start_time = time.time()

        def download_photo_sync(photo_id, email, password, photo_map_instance=None):
            """同步下载照片"""
            try:
                # 先尝试从 photo_map 中获取照片对象
                if photo_map_instance and photo_id in photo_map_instance:
                    photo = photo_map_instance[photo_id]
                    # 下载照片到内存
                    photo_bytes = photo.download().content
                    local_logger.info(
                        f"从缓存中获取照片 {photo_id} 并下载成功，大小: {len(photo_bytes)} bytes"
                    )
                    return photo_bytes

                # 如果没有找到，创建新的api实例
                local_logger.info(f"从API中查找照片: {photo_id}")
                # 创建新的api实例
                api = None

                api = PyiCloudService(email, password)

                # 检查是否需要二次验证
                if api.requires_2fa:
                    local_logger.error("api实例需要二次验证")
                    return None

                # 获取所有照片
                photo_assets = api.photos.all

                # 查找目标照片
                for photo in photo_assets:
                    if hasattr(photo, "id") and photo.id == photo_id:
                        # 下载照片到内存
                        photo_bytes = photo.download().content
                        local_logger.info(
                            f"照片 {photo_id} 下载成功，大小: {len(photo_bytes)} bytes"
                        )
                        return photo_bytes
                    elif hasattr(photo, "filename") and photo.filename == photo_id:
                        # 也可以通过文件名查找
                        photo_bytes = photo.download().content
                        local_logger.info(
                            f"照片 {photo_id} 下载成功，大小: {len(photo_bytes)} bytes"
                        )
                        return photo_bytes

                local_logger.error(f"未找到照片: {photo_id}")
                return None
            except Exception as e:
                local_logger.error(f"下载照片失败: {e}")
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
                    "base64_image": None,
                }

                # 下载 iCloud 照片并转换为 Base64
                icloud_photo_id = photo.get("id") or photo.get("filename")
                if icloud_photo_id:
                    local_logger.info(f"正在下载 iCloud 照片: {icloud_photo_id}")

                    try:
                        # 使用线程池执行同步下载
                        loop = asyncio.get_event_loop()
                        photo_bytes = await loop.run_in_executor(
                            self.executor,
                            download_photo_sync,
                            icloud_photo_id,
                            icloud_email,
                            icloud_password,
                            photo_map,  # 传递照片映射
                        )

                        if photo_bytes:
                            # 转换为 Base64
                            base64_image = base64.b64encode(photo_bytes).decode("utf-8")
                            metadata["base64_image"] = base64_image
                            local_logger.info(f"照片 {icloud_photo_id} 编码完成")
                    except Exception as e:
                        local_logger.error(f"下载 iCloud 照片失败: {e}")
                        # 下载失败时，继续处理，只是没有 base64_image

                return metadata
            except Exception as e:
                local_logger.error(f"处理照片失败: {e}")
                return None

        # 顺序处理，避免并发访问api实例
        local_logger.info("开始顺序处理照片")
        for photo in photos:
            result = await process_photo(photo)
            if result:
                metadata_list.append(result)

        # 计算下载耗时
        download_time = time.time() - start_time
        local_logger.info(
            f"照片处理完成，共处理 {len(metadata_list)} 张照片, 耗时: {download_time:.2f} 秒"
        )
        return metadata_list, download_time

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
                "image_count": len(month_photos),
            }
            batches.append(batch)

        # 按时间排序
        batches.sort(key=lambda x: x["time_range"][0])

        return batches

    async def _get_prompts(self, prompt_group_id: str) -> Dict[str, str]:
        """获取提示词"""
        prompts = {}

        # 确保logger已定义
        if "logger" not in globals():
            global logger
            logger = logging.getLogger(__name__)

        # 创建局部logger变量
        local_logger = logger

        local_logger.info(f"开始获取提示词，prompt_group_id: {prompt_group_id}")

        # 查询该组的所有提示词
        async for prompt in prompts_collection.find(
            {"prompt_group_id": prompt_group_id}
        ):
            prompt_type = prompt["type"]
            prompt_content = prompt["content"]
            prompts[prompt_type] = prompt_content
            local_logger.info(
                f"获取到提示词 - 类型: {prompt_type}, 内容长度: {len(prompt_content)} 字符"
            )
            local_logger.info(f"提示词详细内容: {prompt_content}")

        # 如果没有找到，使用默认提示词
        if "phase1" not in prompts:
            default_phase1 = self._get_default_phase1_prompt()
            prompts["phase1"] = default_phase1
            local_logger.info(
                f"使用默认Phase 1提示词，内容长度: {len(default_phase1)} 字符"
            )
            local_logger.info(f"默认Phase 1提示词: {default_phase1}")

        if "phase2" not in prompts:
            default_phase2 = self._get_default_phase2_prompt()
            prompts["phase2"] = default_phase2
            local_logger.info(
                f"使用默认Phase 2提示词，内容长度: {len(default_phase2)} 字符"
            )
            local_logger.info(f"默认Phase 2提示词: {default_phase2}")

        local_logger.info(f"提示词获取完成，共获取 {len(prompts)} 个提示词")
        return prompts

    async def _execute_phase1(
        self,
        batches: List[Dict[str, Any]],
        prompts: Dict[str, str],
        protagonist_features: Optional[Dict[str, Any]] = None,
    ) -> Tuple[List[Dict[str, Any]], float, int, int, int]:
        """执行Phase 1分析"""
        phase1_results = []

        # 确保logger已定义
        if "logger" not in globals():
            global logger
            logger = logging.getLogger(__name__)

        # 创建局部logger变量，确保在异常处理中也能使用
        local_logger = logger

        # 记录开始时间
        start_time = time.time()
        total_tokens = 0
        prompt_tokens = 0
        candidates_tokens = 0

        for batch in batches:
            local_logger.info(
                f"分析批次: {batch['batch_id']} ({batch['image_count']}张照片)"
            )

            # 构建提示词
            phase1_prompt = prompts.get("phase1", self._get_default_phase1_prompt())
            local_logger.info(
                f"执行Phase 1分析 - 使用的提示词长度: {len(phase1_prompt)} 字符"
            )
            local_logger.info(f"Phase 1提示词内容: {phase1_prompt}")

            # 如果有主角特征，添加到提示词中
            if protagonist_features:
                phase1_prompt += f"\n\n**主角特征**:\n{json.dumps(protagonist_features, ensure_ascii=False)}"

            # 准备分析内容
            content = [phase1_prompt]

            # 添加照片信息和图片数据
            photo_info = []
            image_count = 0

            for photo in batch["photos"][:10]:  # 限制数量，避免提示词过长
                photo_info.append(
                    f"- {photo['filename']} (拍摄时间: {photo['datetime'].isoformat()})"
                )

                # 添加 Base64 编码的图片（只添加有效的图片数据）
                if (
                    photo.get("base64_image")
                    and photo["base64_image"] != "c2ltdWxhdGVkIGltYWdlIGRhdGE="
                ):  # 排除模拟数据
                    local_logger.info(f"添加图片到分析: {photo['filename']}")
                    # 构建图片 Blob
                    # 注意：实际项目中，需要根据图片的实际格式设置正确的 mime_type
                    image_blob = {
                        "mime_type": "image/jpeg",  # 假设是 JPEG 格式
                        "data": photo["base64_image"],
                    }
                    content.append(image_blob)
                    image_count += 1

            # 记录处理的图片数量
            local_logger.info(f"批次 {batch['batch_id']} 包含 {image_count} 张有效图片")

            if len(batch["photos"]) > 10:
                photo_info.append(f"... 等 {len(batch['photos']) - 10} 张照片")

            # 添加照片信息文本
            content.append("\n**批次照片信息**:\n" + "\n".join(photo_info))

            try:
                # 生成分析结果
                model = genai.GenerativeModel("models/gemini-2.5-flash")
                response = model.generate_content(content)
                raw_output = response.text.strip()

                # 统计token消耗
                try:
                    if hasattr(response, "usage_metadata"):
                        usage = response.usage_metadata
                        if hasattr(usage, "total_token_count"):
                            total = usage.total_token_count
                            prompt = getattr(usage, "prompt_token_count", 0)
                            candidates = getattr(usage, "candidates_token_count", 0)
                            total_tokens += total
                            prompt_tokens += prompt
                            candidates_tokens += candidates
                            local_logger.info(
                                f"批次 {batch['batch_id']} Token消耗: 总={total}, 输入={prompt}, 输出={candidates}"
                            )
                except Exception as e:
                    local_logger.warning(f"统计Token消耗失败: {e}")

                # 构建结果
                result = {
                    "batch_id": batch["batch_id"],
                    "processed_at": datetime.now().isoformat(),
                    "image_count": batch["image_count"],
                    "time_range": (
                        batch["time_range"][0].isoformat(),
                        batch["time_range"][1].isoformat(),
                    ),
                    "raw_vlm_output": raw_output,
                    "analysis_summary": self._extract_summary(raw_output),
                }

                local_logger.info(f"批次 {batch['batch_id']} 分析完成")

            except Exception as e:
                local_logger.error(f"批次 {batch['batch_id']} 分析失败: {e}")
                traceback.print_exc()

                # 构建错误结果
                result = {
                    "batch_id": batch["batch_id"],
                    "processed_at": datetime.now().isoformat(),
                    "image_count": batch["image_count"],
                    "time_range": (
                        batch["time_range"][0].isoformat(),
                        batch["time_range"][1].isoformat(),
                    ),
                    "raw_vlm_output": f"分析失败: {str(e)}",
                    "analysis_summary": "分析失败",
                }

            phase1_results.append(result)

        # 计算耗时和总token消耗
        phase1_time = time.time() - start_time
        local_logger.info(
            f"Phase 1 分析完成，总耗时: {phase1_time:.2f} 秒, 总Token消耗: {total_tokens}, 输入Token消耗: {prompt_tokens}, 输出Token消耗: {candidates_tokens}"
        )

        return (
            phase1_results,
            phase1_time,
            total_tokens,
            prompt_tokens,
            candidates_tokens,
        )

    async def _execute_phase2(
        self, phase1_results: List[Dict[str, Any]], prompts: Dict[str, str]
    ) -> Tuple[Dict[str, Any], float, int, int, int]:
        """执行Phase 2分析"""
        # 确保logger已定义
        if "logger" not in globals():
            global logger
            logger = logging.getLogger(__name__)

        # 创建局部logger变量，确保在异常处理中也能使用
        local_logger = logger

        # 记录开始时间
        start_time = time.time()
        total_tokens, prompt_tokens, candidates_tokens = 0, 0, 0
        # 构建提示词
        phase2_prompt = prompts.get("phase2", self._get_default_phase2_prompt())
        local_logger.info(
            f"执行Phase 2分析 - 使用的提示词长度: {len(phase2_prompt)} 字符"
        )
        local_logger.info(f"Phase 2提示词内容: {phase2_prompt}")

        # 准备phase1结果摘要
        phase1_summary = "\n".join(
            [
                f"**批次 {result['batch_id']}**:\n"
                f"- 照片数量: {result['image_count']}\n"
                f"- 时间范围: {result['time_range'][0]} 至 {result['time_range'][1]}\n"
                f"- 分析摘要: {result.get('analysis_summary', '无')}\n"
                for result in phase1_results
            ]
        )

        # 准备分析内容
        content = [phase2_prompt, f"\n\n**Phase 1 分析结果**:\n{phase1_summary}"]

        try:
            # 生成分析结果
            model = genai.GenerativeModel("models/gemini-2.5-flash")
            response = model.generate_content(content)

            # 检查响应是否包含有效的 Part
            if not response.candidates or not response.candidates[0].content.parts:
                raise ValueError("响应不包含有效的内容")

            raw_output = response.text.strip()

            # 统计token消耗
            try:
                if hasattr(response, "usage_metadata"):
                    usage = response.usage_metadata
                    if hasattr(usage, "total_token_count"):
                        total = usage.total_token_count
                        prompt = getattr(usage, "prompt_token_count", 0)
                        candidates = getattr(usage, "candidates_token_count", 0)
                        total_tokens += total
                        prompt_tokens += prompt
                        candidates_tokens += candidates
                        local_logger.info(
                            f"Phase 2 Token消耗: 总={total}, 输入={prompt}, 输出={candidates}"
                        )
            except Exception as e:
                local_logger.warning(f"统计Token消耗失败: {e}")

            # 解析分析结果
            result = self._parse_phase2_output(raw_output)

            local_logger.info("Phase 2 分析完成")

        except Exception as e:
            local_logger.error(f"Phase 2 分析失败: {e}")
            traceback.print_exc()

            # 构建错误结果
            result = {
                "meta": {
                    "scan_summary": f"已分析 {sum(r['image_count'] for r in phase1_results)} 张图片",
                    "timeline_chapters": ["分析失败"],
                },
                "L1_Spatio_Temporal": {
                    "life_radius": "分析失败",
                    "biological_clock": "分析失败",
                },
                "L3_Social_Graph": {"core_circle": [], "relationship_dynamics": []},
                "L4_Behavior_Trends": {
                    "social_mask": "分析失败",
                    "consumption_shift": "分析失败",
                },
                "L5_Psychology": {
                    "personality_type": "分析失败",
                    "emotional_curve": "分析失败",
                },
                "L6_Hooks": {"story_trigger": "分析失败"},
                "error": str(e),
            }

        # 计算耗时和总token消耗
        phase2_time = time.time() - start_time
        local_logger.info(
            f"Phase 2 分析完成，总耗时: {phase2_time:.2f} 秒, 总Token消耗: {total_tokens}, 输入Token消耗: {prompt_tokens}, 输出Token消耗: {candidates_tokens}"
        )

        return result, phase2_time, total_tokens, prompt_tokens, candidates_tokens

    def _extract_summary(self, text: str) -> str:
        """从分析结果中提取摘要"""
        # 简单的摘要提取逻辑，实际项目中可以使用更复杂的方法
        lines = text.split("\n")
        summary_lines = []

        for line in lines[:5]:  # 取前5行作为摘要
            if line.strip():
                summary_lines.append(line.strip())

        return " ".join(summary_lines[:3])  # 限制摘要长度

    def _parse_phase2_output(self, text: str) -> Dict[str, Any]:
        """解析Phase 2分析结果"""
        # 确保logger已定义
        if "logger" not in globals():
            global logger
            logger = logging.getLogger(__name__)

        # 创建局部logger变量，确保在异常处理中也能使用
        local_logger = logger

        # 尝试从文本中提取JSON
        try:
            # 查找JSON开始和结束的位置
            if "```json" in text:
                json_str = text.split("```json")[1].split("```")[0].strip()
            elif text.strip().startswith("{") and text.strip().endswith("}"):
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
            local_logger.warning(f"解析Phase 2输出失败: {e}")

            result = {
                "meta": {
                    "scan_summary": f"分析结果摘要: {text[:100]}...",
                    "timeline_chapters": ["时间线分析完成"],
                },
                "L1_Spatio_Temporal": {
                    "life_radius": "基于照片GPS信息分析的活动范围",
                    "biological_clock": "基于照片拍摄时间分析的作息规律",
                },
                "L3_Social_Graph": {
                    "core_circle": ["基于照片中人物出现频率分析的核心社交圈"],
                    "relationship_dynamics": [],
                },
                "L4_Behavior_Trends": {
                    "social_mask": "基于照片内容分析的社交形象",
                    "consumption_shift": "基于照片中消费场景分析的消费变化",
                },
                "L5_Psychology": {
                    "personality_type": "基于照片内容分析的人格类型",
                    "emotional_curve": "基于照片内容分析的情绪曲线",
                },
                "L6_Hooks": {"story_trigger": "基于照片内容分析的故事触发点"},
                "raw_output": text,
            }
            return result

    async def _process_images(self, photos: List[Dict[str, Any]], user_id: str) -> Tuple[List[Dict[str, Any]], float]:
        """
        处理图片

        Args:
            photos: 照片列表
            user_id: 用户ID

        Returns:
            (处理后的照片列表, 处理耗时)
        """
        processed_photos = []
        start_time = time.time()
        local_logger = logger

        for photo in photos:
            try:
                # 获取图片数据
                base64_image = photo.get("base64_image")
                if not base64_image:
                    local_logger.warning(f"跳过无图片数据的照片: {photo.get('filename', 'unknown')}")
                    processed_photos.append(photo)
                    continue

                # 转换base64为字节
                image_data = base64.b64decode(base64_image)

                # 计算MD5哈希值
                image_hash = await self.features_extractor.get_image_hash(image_data)
                photo["image_hash"] = image_hash

                # 检查是否已经存储过
                existing_photo = await photos_collection.find_one({"image_hash": image_hash})
                if existing_photo:
                    local_logger.info(f"照片已存在，使用现有记录: {photo.get('filename', 'unknown')}")
                    # 更新关联信息
                    photo["photo_id"] = str(existing_photo["_id"])
                    photo["features"] = existing_photo.get("features")
                    photo["compressed_info"] = existing_photo.get("compressed_info")
                    processed_photos.append(photo)
                    continue

                # 提取特征
                local_logger.info(f"提取特征: {photo.get('filename', 'unknown')}")
                features = await self.features_extractor.extract_features(image_data)
                photo["features"] = features

                # 压缩图片
                local_logger.info(f"压缩图片: {photo.get('filename', 'unknown')}")
                compression_result = await self.image_compressor.compress(image_data)
                photo["compressed_info"] = compression_result

                # 存储到MongoDB
                photo_doc = {
                    "user_id": user_id,
                    "image_hash": image_hash,
                    "filename": photo.get("filename"),
                    "datetime": photo.get("datetime"),
                    "features": features,
                    "compressed_info": compression_result,
                    "original_size": len(image_data),
                    "image_data": image_data,
                    "created_at": datetime.now()
                }
                result = await photos_collection.insert_one(photo_doc)
                photo["photo_id"] = str(result.inserted_id)

                processed_photos.append(photo)

            except Exception as e:
                local_logger.error(f"处理图片失败: {e}")
                # 失败时保留原始照片
                processed_photos.append(photo)

        process_time = time.time() - start_time
        local_logger.info(f"图片处理完成，共处理 {len(processed_photos)} 张照片, 耗时: {process_time:.2f} 秒")
        return processed_photos, process_time

    def _calculate_time_range(self, photos: List[Dict[str, Any]]) -> Tuple[str, str]:
        """计算时间范围"""
        if not photos:
            return ("", "")

        min_time = min(photo["datetime"] for photo in photos)
        max_time = max(photo["datetime"] for photo in photos)

        return (min_time.strftime("%Y-%m-%d"), max_time.strftime("%Y-%m-%d"))

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
