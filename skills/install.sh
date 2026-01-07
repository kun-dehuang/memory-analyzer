#!/bin/bash
#
# AI 记忆分析器 Skill 安装脚本
#

set -e

# 颜色
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║         🧠 AI 记忆分析器 - Skill 安装向导               ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# 检查 Python
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: 未找到 Python 3"
    echo "请先安装 Python 3.8 或更高版本"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | awk '{print $2}')
echo "✅ 检测到 Python: $PYTHON_VERSION"

# 检查当前目录
if [ ! -f "memory_profiler.py" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

echo ""
echo "📦 正在安装依赖..."

# 创建虚拟环境（如果不存在）
if [ ! -d "venv" ]; then
    echo "创建虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境
source venv/bin/activate

# 升级 pip
echo "升级 pip..."
pip install -q --upgrade pip

# 安装依赖
echo "安装 Python 包..."
pip install -q Pillow google-generativeai python-dotenv

echo -e "${GREEN}✅ 依赖安装完成${NC}"

# 检查 API 密钥
echo ""
echo "🔑 配置 API 密钥..."

if [ -f ".env" ]; then
    echo "✅ 已找到 .env 文件"
else
    echo ""
    echo "请输入你的 Google Gemini API 密钥:"
    read -sp "> " API_KEY

    if [ -n "$API_KEY" ]; then
        echo "GEMINI_API_KEY=$API_KEY" > .env
        echo -e "${GREEN}✅ API 密钥已保存到 .env${NC}"
    else
        echo "⚠️  跳过 API 密钥配置"
        echo ""
        echo "稍后可以手动配置:"
        echo "  export GEMINI_API_KEY=your_api_key"
        echo "  或"
        echo "  echo 'GEMINI_API_KEY=your_api_key' > .env"
    fi
fi

# 创建可执行命令
echo ""
echo "🔗 创建命令快捷方式..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# 检查是否在 PATH 中
if command -v skill-install &> /dev/null; then
    echo "使用 skill-install 注册命令..."
    # 这里假设有 skill-install 工具
    # 实际使用时可能需要调整
fi

echo -e "${GREEN}✅ 安装完成！${NC}"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📖 使用方法:"
echo ""
echo "  # 方式 1: 直接运行脚本"
echo "  $PROJECT_DIR/skills/memory-analyzer/run.sh ~/Photos"
echo ""
echo "  # 方式 2: 从项目根目录运行"
echo "  cd $PROJECT_DIR"
echo "  source venv/bin/activate"
echo "  python3 memory_profiler.py ~/Photos"
echo ""
echo "  # 提供主角参考照片（推荐）"
echo "  python3 extract_protagonist.py ~/selfie.jpg"
echo "  python3 memory_profiler.py ~/Photos"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📚 查看完整文档:"
echo "  cat $SCRIPT_DIR/README.md"
echo ""
