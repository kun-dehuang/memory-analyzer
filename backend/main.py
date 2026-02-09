import subprocess
import sys
import os
# 打印详细的 Python 环境信息
print(f"Python 解释器路径: {sys.executable}")
print(f"Python 版本: {sys.version}")
print(f"当前工作目录: {os.getcwd()}")
print(f"Python 路径: {sys.path}")

# 检查 pip 版本和位置
print("\n检查 pip 信息...")
subprocess.run([sys.executable, "-m", "pip", "--version"])
print("pip 安装位置:")
subprocess.run([sys.executable, "-m", "pip", "show", "pip"])

# 检查 site-packages 目录
print("\n检查 site-packages 目录...")
try:
    import site
    print(f"site-packages 目录: {site.getsitepackages()}")
except Exception as e:
    print(f"获取 site-packages 目录失败: {e}")

# 尝试使用 --target 选项安装到当前目录
print("\n正在安装依赖项到当前目录...")
try:
    # 创建 lib 目录用于安装依赖
    if not os.path.exists("lib"):
        os.makedirs("lib")

    # 安装所有必要的依赖项
    required_deps = [
        "fastapi",
        "uvicorn[standard]",
        "motor",
        "pymongo",
        "python-jose[cryptography]",
        "passlib[bcrypt]",
        "python-multipart",
        "python-dotenv",
        "Pillow",
        "imagehash",
        "google-generativeai",
        "tqdm",
        "requests",
        "python-dateutil",
        "email-validator",
        "pyicloud",
        "opencv-python",
        "transformers",
        "torch",
        "torchvision",
        "numpy",
        "scikit-learn",
        "scikit-image",
    ]

    for dep in required_deps:
        print(f"正在安装 {dep}...")
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "-v", "--target=lib", dep],
            capture_output=True,
            text=True
        )

    # 添加 lib 目录到 Python 路径
    sys.path.insert(0, os.path.abspath("lib"))
    print(f"更新后的 Python 路径: {sys.path}")

    # 检查 lib 目录中的文件
    print("\n检查 lib 目录中的文件...")
    if os.path.exists("lib"):
        print("lib 目录内容:")
        for item in os.listdir("lib")[:20]:  # 只显示前 20 个项目
            print(f"  - {item}")
except Exception as e:
    print(f"安装依赖时出错: {e}")

# 检查已安装的包
print("\n检查已安装的包...")
subprocess.run([sys.executable, "-m", "pip", "list"])

# 尝试导入所有模块
print("\n正在尝试导入模块...")
try:
    import fastapi
    print("fastapi 导入成功!")
except ImportError as e:
    print(f"fastapi 导入失败: {e}")

try:
    import uvicorn
    print("uvicorn 导入成功!")
except ImportError as e:
    print(f"uvicorn 导入失败: {e}")

# 现在尝试导入所有需要的模块
print("\n正在导入所有需要的模块...")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from app.config.database import create_indexes
from app.api import users, prompts, memory, auth, image


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时执行
    print("正在初始化数据库...")
    await create_indexes()
    print("数据库初始化完成")
    yield
    # 关闭时执行
    print("应用正在关闭...")


# 创建FastAPI应用
app = FastAPI(
    title="Memory Analyzer API",
    description="AI记忆分析器后端API",
    version="1.0.0",
    lifespan=lifespan
)

# 配置CORS
# 允许的源列表 - 包括 GitHub Pages 和本地开发环境
allowed_origins = [
    "https://kun-dehuang.github.io",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
]

# 如果环境变量中有配置的额外源，也添加进去
import os
extra_origins = os.getenv("ALLOWED_ORIGINS", "")
if extra_origins:
    allowed_origins.extend([origin.strip() for origin in extra_origins.split(",")])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth.router, prefix="/api/auth", tags=["认证"])
app.include_router(users.router, prefix="/api/users", tags=["用户"])
app.include_router(prompts.router, prefix="/api/prompts", tags=["提示词"])
app.include_router(memory.router, prefix="/api/memory", tags=["记忆分析"])
app.include_router(image.router, prefix="/api/images", tags=["图片"])


@app.get("/")
async def root():
    """根路径"""
    return {"message": "Welcome to Memory Analyzer API"}


@app.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "healthy"}


if __name__ == "__main__":
    PORT = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
