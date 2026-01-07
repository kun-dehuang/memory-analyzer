# 🧠 AI Memory Analyzer

从照片中生成**六维人格画像** - 基于一年的生活记录，深度分析你的社交关系、消费升级、行为模式与心理特质。

## ✨ 特性

- 📸 **大规模处理**: 支持 1500+ 照片批量分析
- 🧩 **Map-Reduce 架构**: 避免上下文溢出，确保分析质量
- 💾 **智能缓存**: Phase 1 结果持久化，支持无限次 Phase 2 重跑
- 🎯 **主角识别**: 自动或手动识别照片中的主角
- 🌍 **多维度分析**: 六维人格画像（时空、社交、行为、心理等）
- 🔍 **深度洞察**: MBTI 人格类型、情绪曲线、灵魂提问

## 🚀 快速开始

### 安装

```bash
# 克隆仓库
git clone https://github.com/yourusername/memory-analyzer.git
cd memory-analyzer

# 运行安装脚本
./skills/memory-analyzer/install.sh
```

### 使用

```bash
# 基础分析（AI 自动识别主角）
./skills/memory-analyzer/run.sh ~/Photos/2025

# 提供主角参考照片（更准确）
python3 extract_protagonist.py ~/selfie.jpg
./skills/memory-analyzer/run.sh ~/Photos/2025

# 仅运行 Phase 2（从缓存重新分析）
./skills/memory-analyzer/run.sh ~/Photos/2025 --phase2-only
```

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

## 📖 完整文档

查看 [skills/memory-analyzer/README.md](skills/memory-analyzer/README.md) 获取详细使用说明。

## 📄 许可证

MIT License

---

**生成你的《六维人格画像》，探索数字记忆背后的深度洞察！** ✨
