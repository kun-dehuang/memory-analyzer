from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from app.config.database import create_indexes
from app.api import users, prompts, memory, auth


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
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://kun-dehuang.github.io"],  # 替换为你的GitHub Pages域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth.router, prefix="/api/auth", tags=["认证"])
app.include_router(users.router, prefix="/api/users", tags=["用户"])
app.include_router(prompts.router, prefix="/api/prompts", tags=["提示词"])
app.include_router(memory.router, prefix="/api/memory", tags=["记忆分析"])


@app.get("/")
async def root():
    """根路径"""
    return {"message": "Welcome to Memory Analyzer API"}


@app.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
