#!/usr/bin/env python3
"""
工业级 AI 记忆分析器 (Industrial-Scale AI Memory Profiler)

基于 Map-Reduce 架构，从 1500+ 张照片中重构用户的《六维人格画像》

Phase 1 (Map): Gemini Flash 快速提取每批照片的客观事实
Phase 2 (Reduce): Gemini Pro 深度分析生成完整人格画像

缓存机制：Phase 1 结果持久化，支持无限次调整 Phase 2 分析逻辑
"""

import asyncio
import json
import os
import re
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Tuple
from dataclasses import dataclass, asdict
from PIL import Image
import google.genai as genai
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor
import logging

# ==================== 配置 ====================
load_dotenv()

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('memory_profiler.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Gemini API 配置
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# ==================== 数据模型 ====================

@dataclass
class PhotoMetadata:
    """照片元数据"""
    path: str
    filename: str
    datetime: datetime
    gps_lat: float = None
    gps_lon: float = None
    has_gps: bool = False

@dataclass
class Batch:
    """批次信息"""
    batch_id: str  # 格式: YYYY-MM_Wxx
    photos: List[PhotoMetadata]
    time_range: Tuple[datetime, datetime]
    image_count: int

@dataclass
class Phase1Result:
    """Phase 1 分析结果（客观事实）"""
    batch_id: str
    processed_at: str
    image_count: int
    time_range: Tuple[str, str]
    raw_vlm_output: str  # Gemini Flash 的全量客观描述

# ==================== Phase 0: EXIF 提取器 ====================

class EXIFExtractor:
    """从照片中提取 EXIF 元数据"""

    @staticmethod
    def get_decimal_from_dms(dms, ref):
        """将 GPS DMS 格式转为 Decimal"""
        degrees = dms[0]
        minutes = dms[1]
        seconds = dms[2]

        decimal = degrees + (minutes / 60.0) + (seconds / 3600.0)
        if ref in ['S', 'W']:
            decimal = -decimal
        return decimal

    @staticmethod
    def extract_datetime(image_path: str) -> datetime:
        """提取拍摄时间"""
        try:
            with Image.open(image_path) as img:
                exif = img._getexif()
                if exif:
                    # DateTimeOriginal (36867)
                    date_str = exif.get(36867) or exif.get(306)  # DateTime (306)
                    if date_str:
                        # 格式: "2023:12:25 14:30:00"
                        return datetime.strptime(date_str, "%Y:%m:%d %H:%M:%S")
        except Exception as e:
            logger.warning(f"无法提取时间戳 {image_path}: {e}")

        # 备用：使用文件修改时间
        return datetime.fromtimestamp(os.path.getmtime(image_path))

    @staticmethod
    def extract_gps(image_path: str) -> Tuple[float, float]:
        """提取 GPS 坐标"""
        try:
            with Image.open(image_path) as img:
                exif = img._getexif()
                if exif and 34853 in exif:  # GPSInfo
                    gps_info = exif[34853]

                    lat = None
                    lon = None

                    # 纬度
                    if 2 in gps_info and 1 in gps_info:  # GPSLatitude, GPSLatitudeRef
                        lat = EXIFExtractor.get_decimal_from_dms(
                            gps_info[2], gps_info[1]
                        )

                    # 经度
                    if 4 in gps_info and 3 in gps_info:  # GPSLongitude, GPSLongitudeRef
                        lon = EXIFExtractor.get_decimal_from_dms(
                            gps_info[4], gps_info[3]
                        )

                    return lat, lon
        except Exception as e:
            logger.warning(f"无法提取GPS {image_path}: {e}")

        return None, None

    @classmethod
    def process_photo(cls, photo_path: str) -> PhotoMetadata:
        """处理单张照片，提取所有元数据"""
        filename = os.path.basename(photo_path)
        dt = cls.extract_datetime(photo_path)
        lat, lon = cls.extract_gps(photo_path)

        return PhotoMetadata(
            path=photo_path,
            filename=filename,
            datetime=dt,
            gps_lat=lat,
            gps_lon=lon,
            has_gps=(lat is not None and lon is not None)
        )

# ==================== Phase 0: 智能批次分组器 ====================

class BatchProcessor:
    """按时间智能分组照片"""

    @staticmethod
    def create_batches(photos: List[PhotoMetadata], max_batch_size: int = 50) -> List[Batch]:
        """
        智能分组策略：
        1. 优先按月分组
        2. 如果某月 > max_batch_size，按周拆分
        """
        # 按月分组
        monthly_groups = {}
        for photo in photos:
            month_key = photo.datetime.strftime("%Y-%m")
            if month_key not in monthly_groups:
                monthly_groups[month_key] = []
            monthly_groups[month_key].append(photo)

        batches = []
        for month_key, month_photos in sorted(monthly_groups.items()):
            if len(month_photos) <= max_batch_size:
                # 整月作为一个批次
                batch_id = month_key
                time_range = (
                    min(p.datetime for p in month_photos),
                    max(p.datetime for p in month_photos)
                )
                batches.append(Batch(
                    batch_id=batch_id,
                    photos=sorted(month_photos, key=lambda x: x.datetime),
                    time_range=time_range,
                    image_count=len(month_photos)
                ))
            else:
                # 按周拆分
                week_groups = {}
                for photo in month_photos:
                    # 计算周数（一年中的第几周）
                    week_num = photo.datetime.isocalendar()[1]
                    week_key = f"{month_key}_W{week_num:02d}"
                    if week_key not in week_groups:
                        week_groups[week_key] = []
                    week_groups[week_key].append(photo)

                for week_key, week_photos in sorted(week_groups.items()):
                    time_range = (
                        min(p.datetime for p in week_photos),
                        max(p.datetime for p in week_photos)
                    )
                    batches.append(Batch(
                        batch_id=week_key,
                        photos=sorted(week_photos, key=lambda x: x.datetime),
                        time_range=time_range,
                        image_count=len(week_photos)
                    ))

        return batches

# ==================== Phase 1: Map - 客观事实提取 ====================

class Phase1Analyzer:
    """使用 Gemini Flash 快速提取客观事实"""

    def __init__(self):
        # 使用 Gemini 2.5 Flash 确保更准确的视觉识别
        self.model = genai.GenerativeModel('models/gemini-2.5-flash')
        self.cache_dir = Path("cache/phase1")
        self.cache_dir.mkdir(parents=True, exist_ok=True)

        # 尝试加载主角特征
        self.protagonist_features = self._load_protagonist_features()

    def _load_protagonist_features(self) -> dict:
        """加载主角特征（如果存在）"""
        protagonist_path = Path("cache/protagonist_features.json")
        if protagonist_path.exists():
            try:
                with open(protagonist_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    logger.info(f"✅ 已加载主角参考特征: {data['features']['key_identifiers']}")
                    return data['features']
            except Exception as e:
                logger.warning(f"⚠️ 无法加载主角特征: {e}")
        return None

    def _get_cache_path(self, batch_id: str) -> Path:
        """获取缓存文件路径"""
        return self.cache_dir / f"batch_{batch_id}.json"

    def _load_from_cache(self, batch_id: str) -> Phase1Result:
        """从缓存加载结果"""
        cache_path = self._get_cache_path(batch_id)
        if cache_path.exists():
            logger.info(f"✅ 从缓存加载批次 {batch_id}")
            with open(cache_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return Phase1Result(**data)
        return None

    def _save_to_cache(self, result: Phase1Result):
        """保存结果到缓存"""
        cache_path = self._get_cache_path(result.batch_id)
        with open(cache_path, 'w', encoding='utf-8') as f:
            json.dump(asdict(result), f, ensure_ascii=False, indent=2)
        logger.info(f"💾 已缓存批次 {result.batch_id}")

    def _create_prompt(self, batch: Batch) -> str:
        """生成 Phase 1 提示词（客观事实提取）"""
        # 提取时间范围和 GPS 信息
        time_str = f"{batch.time_range[0].strftime('%Y年%m月')} - {batch.time_range[1].strftime('%Y年%m月')}"

        # 统计有 GPS 的照片数量
        gps_count = sum(1 for p in batch.photos if p.has_gps)
        location_info = f"其中 {gps_count} 张包含GPS定位信息" if gps_count > 0 else "无GPS信息"

        # 构建主角特征提示
        protagonist_info = ""
        if self.protagonist_features:
            features = self.protagonist_features
            protagonist_info = f"""

**🎯 主角参考特征**（基于用户提供的参考照片）:
- 性别: {features['gender']}
- 年龄段: {features['age_group']}
- 发型: {features['facial_features']['hair']}
- 脸型: {features['facial_features']['face_shape']}
- 关键识别特征:
"""
            for identifier in features['key_identifiers']:
                protagonist_info += f"  * {identifier}\n"

        prompt = f"""你是一位专业的视觉人类学家。请详细描述这批照片中的所有视觉要素。

**批次信息**:
- 时间范围: {time_str}
- 照片数量: {batch.image_count} 张
- {location_info}
{protagonist_info}
**⚠️ 最重要任务: 识别照片主人（主角）**

0. **主角识别** (优先级最高):{"【优先】请根据上面的【主角参考特征】准确识别照片中的主角。" if self.protagonist_features else ""}
   - **谁是主人**: 通过以下线索综合判断：
     * 出现频率最高的人物
     * 照片视角（自拍 = 主人，被拍 = 主人不在画面中）
     * 镜头距离（通常是主体人物，位于画面中心或前景）
     * 互动模式（通常是被拍摄的对象，或在合影中位于中心）
   - **主角特征**: 详细描述主角的外貌特征（性别、年龄段、发型、体型、常见服装风格）
   - **标记方式**: 在后续描述中，主角用"【主角】"标记，其他人用"女性A"、"男性B"等标记
   - **特殊场景**:
     * 如果是自拍，直接标记"【主角】自拍"
     * 如果是多人大合影，主人通常在中心位置或最显眼的位置
     * 如果主人不在照片中（如主人拍的风景照），说明"【主人】拍摄，未入镜"

**任务**: 请以详尽、客观的方式描述这批照片，包含以下维度：

1. **场景与环境** (完整识别):
   - 室内/室外场景（如：咖啡厅、办公室、公园、家中、餐厅）
   - 城市/地点线索（如：上海外滩、东京街头、居家环境、商场）
   - 装修风格、空间氛围（如：现代简约、复古工业、温馨居家）

2. **人物与互动** (完整识别，重点标注主角):
   - **主角**: 【主角】的性别、年龄段、外貌特征（发型、身材、常见服装风格）
   - **其他人物**: 数量、性别、年龄段，用"女性A"、"男性B"标记
   - **人物关系**: 【主角】与其他人的关系（朋友、情侣、家人、同事）
   - **互动动作**: 【主角】与其他人的具体互动（如：【主角】与女性A举杯庆祝）
   - **表情细节**: 【主角】及其他人物的情绪状态（微笑、严肃、惊讶）

3. **物品与消费** (完整识别):
   - **主角的物品**: 【主角】的服装品牌、风格、配饰、电子设备等
   - **消费场景**: 具体餐厅类型、商场名称、景点特色
   - **物品细节**: 书籍名称、宠物品种、食物种类、品牌Logo

4. **动作与活动** (完整识别，聚焦主角):
   - **主角的活动**: 【主角】在做什么（聚餐、旅行、工作、运动、购物、休闲）
   - **具体动作**: 【主角】的动作细节（行走、坐着、站立、跑步、拍照）
   - **互动细节**: 【主角】与其他人物的互动方式

5. **视觉风格**:
   - 光线（自然光、室内灯光、夜景、逆光）
   - 构图（自拍、抓拍、摆拍、全身照、特写）
   - 修图程度（精修、原图、滤镜风格）

**重要提醒**:
- ⭐ **首要任务**: 准确识别谁是照片主人（主角）
- ⭐ **标记清晰**: 在所有描述中，用"【主角】"标记主人
- ⭐ **一致性**: 确保同一批次的描述中，【主角】指代同一个人
- 请确保识别每一张照片的主体、环境和动作
- 不要遗漏任何可见的重要细节
- 你的描述将成为后续人格分析的基础素材，主角识别准确性至关重要"""

        return prompt

    async def analyze_batch(self, batch: Batch) -> Phase1Result:
        """分析单个批次"""
        # 检查缓存
        cached = self._load_from_cache(batch.batch_id)
        if cached:
            return cached

        logger.info(f"🔍 正在分析批次 {batch.batch_id} ({batch.image_count} 张照片)")

        # 准备图片（跳过不支持的格式）
        images = []
        skipped = 0
        for photo in batch.photos[:50]:  # Flash 最多处理50张
            try:
                img = Image.open(photo.path)
                # 检测并跳过 MPO 格式（Gemini API 不支持）
                if img.format == 'MPO':
                    logger.warning(f"⚠️ 跳过 MPO 格式: {photo.path}")
                    img.close()
                    skipped += 1
                    continue
                images.append(img)
            except Exception as e:
                logger.warning(f"无法读取图片 {photo.path}: {e}")

        if skipped > 0:
            logger.info(f"ℹ️  批次 {batch.batch_id} 跳过 {skipped} 个不支持的文件")

        if len(images) == 0:
            logger.warning(f"⚠️  批次 {batch.batch_id} 没有有效图片")
            raw_output = "该批次没有有效的图片可供分析"
        else:
            # 生成提示词
            prompt = self._create_prompt(batch)

            # 调用 Gemini Flash
            try:
                response = await asyncio.to_thread(
                    self.model.generate_content,
                    [prompt] + images
                )
                raw_output = response.text
            except Exception as e:
                logger.error(f"批次 {batch.batch_id} 分析失败: {e}")
                raw_output = f"分析失败: {str(e)}"

        # 构建结果
        result = Phase1Result(
            batch_id=batch.batch_id,
            processed_at=datetime.now().isoformat(),
            image_count=batch.image_count,
            time_range=(
                batch.time_range[0].isoformat(),
                batch.time_range[1].isoformat()
            ),
            raw_vlm_output=raw_output
        )

        # 保存到缓存
        self._save_to_cache(result)

        return result

    async def analyze_all_batches(
        self,
        batches: List[Batch],
        max_concurrency: int = 3
    ) -> List[Phase1Result]:
        """并发分析所有批次"""
        logger.info(f"🚀 开始 Phase 1 分析，共 {len(batches)} 个批次")

        # 使用信号量控制并发数
        semaphore = asyncio.Semaphore(max_concurrency)

        async def process_with_semaphore(batch):
            async with semaphore:
                return await self.analyze_batch(batch)

        # 并发处理
        results = await asyncio.gather(
            *[process_with_semaphore(batch) for batch in batches]
        )

        logger.info(f"✅ Phase 1 完成，分析 {len(results)} 个批次")
        return results

# ==================== Phase 2: Reduce - 深度人格画像 ====================

class Phase2Analyzer:
    """使用 Gemini Pro 深度分析生成六维人格画像"""

    def __init__(self):
        self.model = genai.GenerativeModel('models/gemini-2.5-pro')

    def _create_prompt(self, phase1_results: List[Phase1Result]) -> str:
        """生成 Phase 2 提示词（深度人格分析）"""

        # 汇总所有批次的时间线
        timeline = "\n".join([
            f"- {r.batch_id}: {r.time_range[0][:7]} ~ {r.time_range[1][:7]} ({r.image_count}张)"
            for r in sorted(phase1_results, key=lambda x: x.batch_id)
        ])

        # 汇总所有客观描述
        all_observations = "\n\n".join([
            f"## {r.batch_id}\n{r.raw_vlm_output}"
            for r in sorted(phase1_results, key=lambda x: x.batch_id)
        ])

        total_images = sum(r.image_count for r in phase1_results)

        prompt = f"""你是一位数字人类学家和心理学专家。现在需要你基于用户的完整相册记录（跨度{phase1_results[0].time_range[0][:7]}至{phase1_results[-1].time_range[1][:7]}），执行深度的《六维人格分析》。

**数据规模**: 共分析 {total_images} 张照片，{len(phase1_results)} 个时间段

**⚠️ 核心前提**: 所有观察记录中的"【主角】"标记指代照片主人（用户本人）

**分析对象说明**:
- 你的分析对象是"【主角】"（照片主人），不是其他人物
- 所有人格推断、心理分析、行为模式都应基于"【主角】"的表现
- 其他人物（女性A、男性B等）仅作为"【主角】"社交关系的参考

**时间线**:
{timeline}

**完整观察记录**（按时间顺序）:
{all_observations}

---

**任务**: 请严格按照以下 JSON Schema 输出分析结果：

```json
{{
  "meta": {{
    "scan_summary": "已分析 X 张图片，跨度 YYYY.MM-YYYY.MM",
    "timeline_chapters": ["AI 划分的人生阶段，如：'2023上半年: 迷茫探索期', '2023下半年: 情感稳定期'"]
  }},
  "L1_Spatio_Temporal": {{
    "life_radius": "基于GPS分析【主角】的活动范围，如：两点一线(家-公司) vs 城市漫游者 vs 全球游牧",
    "biological_clock": "基于拍摄时间戳分析【主角】的作息，如：早起型(7-9点活跃) vs 深夜活跃型(22-2点) vs 周末狂欢者"
  }},
  "L3_Social_Graph": {{
    "core_circle": [
      {{"name_id": "女性A", "relation": "推测为【主角】的伴侣", "frequency": "高频出现", "status": "稳定"}},
      {{"name_id": "男性B", "relation": "【主角】的工作伙伴", "frequency": "仅在工作场景", "status": "Q4后消失"}}
    ],
    "relationship_dynamics": ["【主角】社交关系的关键变化，如：'女性A在Q2首次出现 - 疑似【主角】开始恋情'", '男性B在Q4消失 - 可能离职或与【主角】关系疏远'"]
  }},
  "L4_Behavior_Trends": {{
    "social_mask": "分析【主角】精修图与随手拍的比例，判断偶像包袱，如：高精致度(朋友圈人设) vs 真实记录型",
    "consumption_shift": "分析【主角】的物品/场景变化，如：'从快时尚转向露营装备', '从咖啡厅转向健身房'"
  }},
  "L5_Psychology": {{
    "personality_type": "基于【主角】的行为模式推测MBTI或大五人格，如：外向表达型(ENFP) vs 内省观察者(INFP)",
    "emotional_curve": "描述【主角】的情绪波动周期，如：'Q1情绪低落(独处照片多) → Q2开始社交活跃 → Q3情绪高涨'"
  }},
  "L6_Hooks": {{
    "story_trigger": "生成一句直击【主角】心灵的提问，如：'为什么你在2023年5月突然开始频繁去健身房？'"
  }}
}}
```

**分析原则**:
1. **基于证据**: 每个关于【主角】的推断都要有照片观察作为支撑
2. **关注变化**: 重点分析【主角】在时间线上的转折点
3. **深度洞察**: 不要停留在表面描述，要挖掘【主角】行为背后的心理动机
4. **主角聚焦**: 所有人格分析都围绕【主角】展开，其他人物仅作为【主角】社交关系的背景
5. **人文关怀**: 用温暖而专业的语调，展现对【主角】这个"数字生命"的理解

请直接输出 JSON，不要添加任何其他文字。"""

        return prompt

    def analyze(self, phase1_results: List[Phase1Result]) -> Dict[str, Any]:
        """执行 Phase 2 深度分析"""
        logger.info("🧠 开始 Phase 2 深度人格分析...")

        prompt = self._create_prompt(phase1_results)

        try:
            response = self.model.generate_content(prompt)
            raw_json = response.text.strip()

            # 提取 JSON（去除可能的 markdown 代码块标记）
            json_match = re.search(r'```json\s*(.*?)\s*```', raw_json, re.DOTALL)
            if json_match:
                raw_json = json_match.group(1)
            else:
                # 尝试提取第一个 { } 包裹的内容
                json_match = re.search(r'\{.*\}', raw_json, re.DOTALL)
                if json_match:
                    raw_json = json_match.group(0)

            result = json.loads(raw_json)

            logger.info("✅ Phase 2 分析完成")
            return result

        except Exception as e:
            logger.error(f"Phase 2 分析失败: {e}")
            return {
                "error": str(e),
                "raw_output": response.text if 'response' in locals() else None
            }

# ==================== 主控制器 ====================

class MemoryProfiler:
    """AI 记忆分析器主控制器"""

    def __init__(self, photo_dir: str):
        self.photo_dir = Path(photo_dir)
        self.cache_dir = Path("cache")
        self.cache_dir.mkdir(exist_ok=True)

    def scan_photos(self) -> List[PhotoMetadata]:
        """扫描所有照片"""
        logger.info(f"📁 扫描照片目录: {self.photo_dir}")

        # 支持的图片格式（排除 .mpo 等 Gemini 不支持的格式）
        extensions = {'.jpg', '.jpeg', '.png', '.heic', '.webp'}

        # 排除的格式（Gemini API 不支持）
        excluded_extensions = {'.mpo'}

        photos = []
        for ext in extensions:
            for photo_path in self.photo_dir.glob(f"**/*{ext}"):
                photos.append(str(photo_path))

        # 排除不支持的格式
        filtered_photos = []
        for photo in photos:
            ext = Path(photo).suffix.lower()
            if ext not in excluded_extensions:
                filtered_photos.append(photo)
            else:
                logger.warning(f"⚠️ 跳过不支持的格式: {photo}")

        logger.info(f"📸 发现 {len(filtered_photos)} 张照片（已过滤不支持的格式）")

        # 并发提取 EXIF
        with ThreadPoolExecutor(max_workers=10) as executor:
            photos_metadata = list(executor.map(EXIFExtractor.process_photo, filtered_photos))

        # 按时间排序
        photos_metadata.sort(key=lambda x: x.datetime)

        logger.info(f"✅ EXIF 提取完成，时间跨度: "
                   f"{photos_metadata[0].datetime.strftime('%Y-%m-%d')} ~ "
                   f"{photos_metadata[-1].datetime.strftime('%Y-%m-%d')}")

        return photos_metadata

    def run(self, phase2_only: bool = False) -> Dict[str, Any]:
        """
        运行完整分析流程

        Args:
            phase2_only: 如果为 True，跳过 Phase 1，直接从缓存加载并运行 Phase 2
        """
        # Phase 0: 扫描照片
        photos = self.scan_photos()

        # Phase 0: 创建批次
        batch_processor = BatchProcessor()
        batches = batch_processor.create_batches(photos)
        logger.info(f"📦 生成 {len(batches)} 个批次")

        # Phase 1: Map - 客观事实提取
        if not phase2_only:
            phase1_analyzer = Phase1Analyzer()
            phase1_results = asyncio.run(phase1_analyzer.analyze_all_batches(batches))

            # 保存 Phase 1 结果汇总
            summary_path = self.cache_dir / "phase1_summary.json"
            with open(summary_path, 'w', encoding='utf-8') as f:
                json.dump([asdict(r) for r in phase1_results], f, ensure_ascii=False, indent=2)
            logger.info(f"💾 Phase 1 汇总已保存: {summary_path}")
        else:
            # 从缓存加载
            logger.info("🔄 Phase 2 模式：从缓存加载 Phase 1 结果...")
            summary_path = self.cache_dir / "phase1_summary.json"
            if not summary_path.exists():
                raise FileNotFoundError("未找到 Phase 1 缓存文件，请先运行完整流程")

            with open(summary_path, 'r', encoding='utf-8') as f:
                phase1_data = json.load(f)
                phase1_results = [Phase1Result(**d) for d in phase1_data]
            logger.info(f"✅ 加载 {len(phase1_results)} 个批次的缓存数据")

        # Phase 2: Reduce - 深度人格画像
        phase2_analyzer = Phase2Analyzer()
        final_profile = phase2_analyzer.analyze(phase1_results)

        # 保存最终结果
        output_path = f"memory_profile_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(final_profile, f, ensure_ascii=False, indent=2)

        logger.info(f"🎉 分析完成！结果已保存: {output_path}")

        return final_profile

# ==================== CLI 入口 ====================

def main():
    import argparse

    parser = argparse.ArgumentParser(description='AI 记忆分析器')
    parser.add_argument('photo_dir', help='照片目录路径')
    parser.add_argument('--phase2-only', action='store_true',
                       help='仅运行 Phase 2（从缓存加载 Phase 1 结果）')

    args = parser.parse_args()

    profiler = MemoryProfiler(args.photo_dir)
    result = profiler.run(phase2_only=args.phase2_only)

    # 打印摘要
    print("\n" + "="*70)
    print("📊 分析摘要")
    print("="*70)
    if "error" not in result:
        print(f"🎯 {result['meta']['scan_summary']}")
        print(f"\n📖 人生阶段:")
        for chapter in result['meta']['timeline_chapters']:
            print(f"  - {chapter}")
        print(f"\n🎭 人格类型: {result['L5_Psychology']['personality_type']}")
        print(f"💬 灵魂提问: {result['L6_Hooks']['story_trigger']}")
    else:
        print(f"❌ 分析失败: {result['error']}")
    print("="*70)

if __name__ == "__main__":
    main()
