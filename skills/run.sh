#!/bin/bash
#
# AI 记忆分析器 Skill
# 从照片生成六维人格画像
#
# 使用方法:
#   memory-analyzer <photo_dir> [--protagonist-photo=<path>] [--phase2-only]
#
# 示例:
#   memory-analyzer ~/Photos/2025
#   memory-analyzer ~/Photos --protagonist-photo=selfie.jpg
#   memory-analyzer ~/Photos --phase2-only
#

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║         🧠 AI 记忆分析器 - 六维人格画像生成器           ║"
echo "║                                                              ║"
echo "║  从照片中分析人生轨迹、社交关系、消费升级与人格特质     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# 检查参数
if [ $# -lt 1 ]; then
    echo -e "${RED}❌ 错误: 缺少必需参数${NC}"
    echo ""
    echo "使用方法:"
    echo "  $0 <照片目录> [选项]"
    echo ""
    echo "参数:"
    echo "  照片目录      包含照片的目录路径（必需）"
    echo ""
    echo "选项:"
    echo "  --protagonist-photo <路径>   主角参考照片（可选）"
    echo "  --phase2-only                仅运行 Phase 2（从缓存重新分析）"
    echo ""
    echo "示例:"
    echo "  $0 ~/Photos/2025"
    echo "  $0 ~/Photos --protagonist-photo=selfie.jpg"
    echo "  $0 ~/Photos --phase2-only"
    exit 1
fi

PHOTO_DIR="$1"
shift

# 解析选项
PROTAGONIST_PHOTO=""
PHASE2_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --protagonist-photo=*)
            PROTAGONIST_PHOTO="${1#*=}"
            shift
            ;;
        --phase2-only)
            PHASE2_ONLY=true
            shift
            ;;
        *)
            echo -e "${RED}❌ 未知选项: $1${NC}"
            exit 1
            ;;
    esac
done

# 检查虚拟环境
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}⚠️  未找到虚拟环境${NC}"
    echo ""
    echo "正在创建虚拟环境..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -q --upgrade pip
    pip install -q Pillow google-generativeai python-dotenv
    echo -e "${GREEN}✅ 虚拟环境创建完成${NC}"
else
    source venv/bin/activate
fi

# 检查 API 密钥
if [ ! -f ".env" ] && [ -z "$GEMINI_API_KEY" ]; then
    echo -e "${RED}❌ 错误: 未找到 GEMINI_API_KEY${NC}"
    echo ""
    echo "请设置环境变量或创建 .env 文件:"
    echo "  export GEMINI_API_KEY=your_api_key"
    echo "  或"
    echo "  echo 'GEMINI_API_KEY=your_api_key' > .env"
    exit 1
fi

# 如果提供了主角参考照片
if [ -n "$PROTAGONIST_PHOTO" ]; then
    echo -e "${BLUE}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📸 第一步：主角识别"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${NC}"

    if [ ! -f "$PROTAGONIST_PHOTO" ]; then
        echo -e "${RED}❌ 照片文件不存在: $PROTAGONIST_PHOTO${NC}"
        exit 1
    fi

    echo "正在提取主角特征..."
    python3 extract_protagonist.py "$PROTAGONIST_PHOTO"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 主角特征已保存${NC}"
    else
        echo -e "${YELLOW}⚠️  特征提取失败，将使用 AI 自动判断${NC}"
    fi

    echo ""
fi

# 检查照片目录
if [ ! -d "$PHOTO_DIR" ]; then
    echo -e "${RED}❌ 照片目录不存在: $PHOTO_DIR${NC}"
    exit 1
fi

# 统计照片数量
PHOTO_COUNT=$(find "$PHOTO_DIR" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.heic" -o -iname "*.webp" \) 2>/dev/null | wc -l | tr -d ' ')

echo -e "${BLUE}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📸 第二步：照片分析"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${NC}"
echo "📁 照片目录: $PHOTO_DIR"
echo "📸 照片数量: $PHOTO_COUNT 张"
echo ""

# 运行模式
if [ "$PHASE2_ONLY" = true ]; then
    echo -e "${YELLOW}🔄 模式: Phase 2 Only（从缓存加载）${NC}"
    echo ""
    echo "⏱️  预计时间: 1-2 分钟"
else
    echo -e "${GREEN}🚀 模式: 完整分析 (Phase 1 + Phase 2)${NC}"
    echo ""
    echo "⏱️  预计时间: 15-25 分钟"
fi

echo ""
echo -e "${BLUE}开始分析...${NC}"
echo ""

# 构建命令
ARGS="$PHOTO_DIR"
if [ "$PHASE2_ONLY" = true ]; then
    ARGS="$ARGS --phase2-only"
fi

# 运行分析
python3 memory_profiler.py $ARGS

# 检查结果
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ 分析完成！"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${NC}"
    echo ""
    echo "📊 结果文件:"
    ls -lt memory_profile_*.json 2>/dev/null | head -1
    echo ""
    echo "💡 查看完整日志:"
    echo "   cat memory_profiler.log"
    echo ""
    echo "📖 查看质量报告:"
    echo "   python3 quality_monitor.py"
else
    echo ""
    echo -e "${RED}❌ 分析失败，请查看日志${NC}"
    echo "   cat memory_profiler.log"
    exit 1
fi
