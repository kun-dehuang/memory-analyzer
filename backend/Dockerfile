# 使用 Python 3.9 作为基础镜像
FROM python:3.9-slim-bullseye as python-base

# 设置工作目录
WORKDIR /app

COPY requirements.txt .
RUN pip install --upgrade pip  # 升级pip，避免安装失败

# 安装系统依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
  build-essential \
  libssl-dev \
  libffi-dev \
  python3-dev \
  && rm -rf /var/lib/apt/lists/*

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制项目文件
COPY . .

# 设置环境变量
ENV PORT=8000
ENV HOST=0.0.0.0

# 暴露端口
EXPOSE 8000

# 定义启动命令
CMD uvicorn main:app --host $HOST --port $PORT --reload