from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from app.api import auth

@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    print("应用启动")
    yield
    print("应用关闭")

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
    allow_origins=["https://kun-dehuang.github.io"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth.router, prefix="/api/auth", tags=["认证"])

@app.get("/")
async def root():
    """根路径"""
    return {"message": "Welcome to Memory Analyzer API"}

@app.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("simplified_main:app", host="0.0.0.0", port=8000, reload=True)