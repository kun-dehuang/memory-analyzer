# 🧠 AI 记忆分析器

从照片中生成**六维人格画像** - 基于一年的生活记录，深度分析你的社交关系、消费升级、行为模式与心理特质。

---

## ✨ 核心特性

- 📸 **大规模处理**: 支持 1500+ 照片批量分析
- 🧩 **Map-Reduce 架构**: 避免上下文溢出，确保分析质量
- 💾 **智能缓存**: Phase 1 结果持久化，支持无限次 Phase 2 重跑
- 🎯 **主角识别**: 自动或手动识别照片中的主角
- 🌍 **多维度分析**: 六维人格画像（时空、社交、行为、心理等）
- 🔍 **深度洞察**: MBTI 人格类型、情绪曲线、灵魂提问

---

## 📊 输出内容

### 六维人格画像

1. **L1 - 时空维度**
   - 生活半径（城市/全球活动范围）
   - 生物钟（作息规律）

2. **L3 - 社交图谱**
   - 核心社交圈
   - 关系动态变化

3. **L4 - 行为趋势**
   - 社交面具（真实/精修）
   - 消费升级轨迹

4. **L5 - 心理画像**
   - 人格类型（MBTI）
   - 情绪变化曲线

5. **L6 - 灵魂提问**
   - 直击心灵的问题

---

## 🚀 快速开始

### 1. 安装依赖

```bash
# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

### 2. 配置 API 密钥

```bash
# 方式 1: 环境变量
export GEMINI_API_KEY=your_api_key_here

# 方式 2: .env 文件
echo 'GEMINI_API_KEY=your_api_key_here' > .env
```

### 3. 运行分析

```bash
# 基础用法（AI 自动识别主角）
memory-analyzer ~/Photos/2025

# 提供主角参考照片（更准确）
memory-analyzer ~/Photos --protagonist-photo=selfie.jpg

# 仅运行 Phase 2（从缓存重新分析）
memory-analyzer ~/Photos --phase2-only
```

---

## 📖 使用示例

### 示例 1: 完整分析

```bash
memory-analyzer ~/Pictures/2025-photos
```

**输出**:
```
╔════════════════════════════════════════════════════════════╗
║         🧠 AI 记忆分析器 - 六维人格画像生成器           ║
╚════════════════════════════════════════════════════════════╝

📁 照片目录: ~/Pictures/2025-photos
📸 照片数量: 1530 张

🚀 模式: 完整分析 (Phase 1 + Phase 2)
⏱️  预计时间: 15-25 分钟

开始分析...

✅ 分析完成！

📊 结果文件: memory_profile_20260107_032327.json
```

### 示例 2: 提供主角参考照片

```bash
# 先提供主角照片
memory-analyzer ~/Photos --protagonist-photo=/path/to/selfie.jpg
```

**优势**:
- ✅ 识别准确度从 70% 提升到 95%
- ✅ 适用于照片混杂、多人同框的场景
- ✅ 主角不常入镜时也能准确识别

### 示例 3: 调整分析逻辑后重新运行

```bash
# 仅运行 Phase 2（使用已有缓存）
memory-analyzer ~/Photos --phase2-only
```

**优势**:
- ⚡ 耗时仅 1-2 分钟
- 💰 成本约 $0.07（vs 完整分析的 $0.27）
- 🔄 可无限次调整 Phase 2 的 prompt

---

## 📂 项目结构

```
album-to-persona/
├── memory_profiler.py        # 主程序
├── extract_protagonist.py    # 主角特征提取工具
├── convert_mpo_to_jpeg.py    # MPO 格式转换工具
├── quality_monitor.py         # 质量监控工具
├── requirements.txt           # Python 依赖
├── .env                       # API 密钥配置
├── cache/                     # 缓存目录
│   ├── phase1/               # Phase 1 结果缓存
│   └── protagonist_features.json  # 主角特征
└── skills/
    └── memory-analyzer/      # Skill 定义
        ├── skill.json        # Skill 元数据
        ├── run.sh            # 可执行脚本
        └── README.md         # Skill 文档
```

---

## 🔧 高级功能

### MPO 格式自动处理

系统会自动检测并转换 MPO 格式（3D 照片），保留 EXIF 信息：

```bash
# 自动转换，无需手动操作
memory-analyzer ~/Photos
```

### 质量监控

分析完成后查看质量报告：

```bash
python3 quality_monitor.py
```

**输出示例**:
```
======================================================================
📊 Phase 1 分析质量报告
======================================================================

⭐ 优秀: 46 (95%)
❌ 失败: 2 (5%)

✅ 成功分析: 1450/1530 张照片 (95%)
```

---

## 💡 最佳实践

### 1. 选择合适的照片

**推荐**:
- ✅ 时间跨度：至少 6 个月到 1 年
- ✅ 照片数量：500-2000 张
- ✅ 包含多种场景：工作、社交、旅行、日常

**不推荐**:
- ❌ 短期集中拍摄（如一周的旅行）
- ❌ 照片过少（<100 张）
- ❌ 场景单一（如只有风景照）

### 2. 提供主角参考照片

**何时需要**:
- ✅ 照片有很多朋友/同事混杂
- ✅ 你不常出现在照片中
- ✅ 有多个相似年龄段的朋友
- ✅ 追求最高准确度

**参考照片要求**:
- 📸 清晰的人像照（自拍或他人拍摄）
- 👤 面部清晰可见
- 💡 光线良好
- 🖼️ 正面或半侧面

### 3. 利用缓存机制

**工作流**:
```bash
# 第一次：完整分析（15-25分钟）
memory-analyzer ~/Photos

# 调整 Phase 2 prompt 后重新运行（1-2分钟）
# 编辑 memory_profiler.py 中的 Phase 2 prompt
memory-analyzer ~/Photos --phase2-only
```

---

## 📈 性能与成本

### 单次完整运行

| 配置 | 时间 | 成本 |
|------|------|------|
| Flash 模型 | 15-25 分钟 | $0.27 |
| Phase 2 重跑 | 1-2 分钟 | $0.07 |

### 照片数量影响

| 照片数 | 批次数 | 时间 | 成本 |
|--------|--------|------|------|
| 500 | 15-20 | 8-12 分钟 | ~$0.15 |
| 1000 | 25-30 | 12-18 分钟 | ~$0.22 |
| 1500 | 35-45 | 15-25 分钟 | ~$0.27 |
| 2000+ | 50+ | 20-30 分钟 | ~$0.35 |

---

## 🐛 常见问题

### Q: 如何提高主角识别准确度？

**A**: 提供主角参考照片：
```bash
memory-analyzer ~/Photos --protagonist-photo=selfie.jpg
```

### Q: 分析失败怎么办？

**A**: 查看日志文件：
```bash
cat memory_profiler.log | grep ERROR
```

常见原因：
- ❌ 照片格式不支持（系统会自动跳过 MPO）
- ❌ API 密钥无效
- ❌ 网络连接问题

### Q: Phase 2 结果不满意怎么办？

**A**: 调整 prompt 后重新运行 Phase 2：
```bash
# 1. 编辑 memory_profiler.py 中的 Phase 2 prompt
# 2. 重新运行
memory-analyzer ~/Photos --phase2-only
```

### Q: 支持哪些图片格式？

**A**:
- ✅ JPG / JPEG
- ✅ PNG
- ✅ HEIC
- ✅ WebP
- ✅ MPO（自动转换）

---

## 📚 技术架构

### Map-Reduce 架构

**Phase 1 (Map)**:
- 🧩 智能批次分组（按月/周，每批最多 50 张）
- ⚡ Gemini Flash 快速提取客观事实
- 💾 结果持久化到 `cache/phase1/`

**Phase 2 (Reduce)**:
- 🧠 Gemini Pro 深度分析
- 📊 汇总所有批次的观察记录
- 🎯 生成六维人格画像

### 感知-推理解耦

**Phase 1 - 仅感知，不推理**:
- ✅ 场景描述
- ✅ 人物识别
- ✅ 物品记录
- ❌ 不进行人格判断

**Phase 2 - 仅推理，不感知**:
- ✅ 基于证据推断人格
- ✅ 分析时间线变化
- ✅ 提炼行为模式
- ❌ 不重新分析图片

**优势**: 可以无限次调整 Phase 2 分析逻辑，无需重新处理图片。

---

## 🎓 示例输出

### 完整报告示例

```json
{
  "meta": {
    "scan_summary": "已分析 1530 张图片，跨度 2025.01-2026.01",
    "timeline_chapters": [
      "2025年 Q1: '构造期' - 稳定生活基石与社交圈确立",
      "2025年 Q2-Q3: '项目期' - 个人工程的专注与职业雄心的萌发",
      "2025年 Q4 - 2026年 Q1: '探索期' - 视野拓展与生活品质的深化"
    ]
  },
  "L1_Spatio_Temporal": {
    "life_radius": "城市探索者，兼具全球视野...",
    "biological_clock": "日间专业人士，夜间社交家..."
  },
  "L3_Social_Graph": {
    "core_circle": [...],
    "relationship_dynamics": [...]
  },
  "L4_Behavior_Trends": {
    "social_mask": "真实记录型...",
    "consumption_shift": "品质升级趋势..."
  },
  "L5_Psychology": {
    "personality_type": "ISFP - 内省的体验家",
    "emotional_curve": "稳定上升 + 阶段性专注..."
  },
  "L6_Hooks": {
    "story_trigger": "2025年，你一边在亲手打造一个实体意义上的家，一边又在积极地推开通往世界的大门。是什么让你决定同时向内扎根，又向外探索？"
  }
}
```

---

## 📄 许可证

MIT License

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**生成你的《六维人格画像》，探索数字记忆背后的深度洞察！** ✨
