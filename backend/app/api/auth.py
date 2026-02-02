from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File, Form
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional
import os
from dotenv import load_dotenv
import asyncio

from app.models.user import User, UserCreate, UserLogin
from app.config.database import users_collection
from app.services.protagonist_extractor import extract_protagonist_features

load_dotenv()

router = APIRouter()

# 安全配置
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(
    schemes=["pbkdf2_sha256", "bcrypt"], 
    deprecated="auto",
    pbkdf2_sha256__default_rounds=100000
)
# 修改OAuth2PasswordBearer配置，使用正确的token端点
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """获取密码哈希值"""
    # 确保密码是字符串
    if not isinstance(password, str):
        password = str(password)
    
    # 尝试使用不同的加密方案，避免 bcrypt 长度限制问题
    try:
        # 首先尝试使用 argon2 或其他方案
        return pwd_context.hash(password)
    except Exception as e:
        # 如果失败，尝试手动处理 bcrypt 长度限制
        try:
            # 编码为字节并截断
            password_bytes = password.encode('utf-8')[:72]
            # 解码回字符串
            truncated_password = password_bytes.decode('utf-8', errors='ignore')
            # 再次尝试哈希
            return pwd_context.hash(truncated_password)
        except Exception:
            # 如果仍然失败，使用简单的哈希方案作为后备
            import hashlib
            # 创建一个简单的哈希作为后备
            hash_obj = hashlib.sha256(password.encode('utf-8'))
            simple_hash = hash_obj.hexdigest()
            # 使用简单哈希作为密码
            return pwd_context.hash(simple_hash[:72])


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """创建访问令牌"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """获取当前用户"""
    print(f"🔐 Token验证 - 收到的token: {token[:20] if token else 'None'}...")
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无法验证凭据",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        print(f"🔐 Token验证 - SECRET_KEY: {SECRET_KEY[:10]}...")
        print(f"🔐 Token验证 - ALGORITHM: {ALGORITHM}")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        print(f"🔐 Token验证 - 解码成功，user_id: {user_id}")
        if user_id is None:
            print(f"🔐 Token验证 - user_id为空")
            raise credentials_exception
    except JWTError as e:
        print(f"🔐 Token验证 - JWT解码失败: {e}")
        raise credentials_exception
    
    # 将字符串形式的user_id转换为ObjectId类型
    from bson import ObjectId
    try:
        user_id_obj = ObjectId(user_id)
        user = await users_collection.find_one({"_id": user_id_obj})
        if user is None:
            print(f"🔐 Token验证 - 用户不存在: {user_id}")
            raise credentials_exception
    except Exception as e:
        print(f"🔐 Token验证 - ObjectId转换失败: {e}")
        raise credentials_exception
    
    print(f"🔐 Token验证 - 用户验证成功: {user['icloud_email']}")
    
    # 转换为User模型
    user_dict = {
        "id": str(user["_id"]),
        "icloud_email": user["icloud_email"],
        "nickname": user["nickname"],
        "protagonist_features": user.get("protagonist_features"),
        "created_at": user["created_at"],
        "updated_at": user["updated_at"],
        "last_login": user.get("last_login")
    }
    
    return User(**user_dict)


def background_task(user_id: str, file_path: str):
    """后台任务：异步分析人物特征"""
    import asyncio
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(extract_protagonist_features(file_path, user_id=user_id))
    finally:
        loop.close()
        # 清理临时文件
        import os
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                print(f"✅ 临时文件已清理: {file_path}")
            except Exception as e:
                print(f"❌ 清理临时文件失败: {e}")

@router.post("/register", response_model=User)
async def register(
    icloud_email: str = Form(...),
    icloud_password: str = Form(...),
    nickname: str = Form(...),
    photo: UploadFile = File(...)
):
    """用户注册"""
    # 检查用户是否已存在
    existing_user = await users_collection.find_one({"icloud_email": icloud_email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该iCloud邮箱已被注册"
        )
    
    # 创建新用户
    hashed_password = get_password_hash(icloud_password)
    user_data = {
        "icloud_email": icloud_email,
        "icloud_password": icloud_password,  # 存储原始 iCloud 密码，用于记忆分析
        "nickname": nickname,
        "protagonist_features": None,
        "hashed_password": hashed_password,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "last_login": None
    }
    
    # 插入数据库
    result = await users_collection.insert_one(user_data)
    user_id = str(result.inserted_id)
    user_data["_id"] = user_id
    
    # 保存上传的照片
    file_path = f"temp/{user_id}_{datetime.utcnow().timestamp()}.jpg"
    os.makedirs("temp", exist_ok=True)
    with open(file_path, "wb") as buffer:
        content = await photo.read()
        buffer.write(content)
    
    # 异步执行人物分析
    import threading
    thread = threading.Thread(target=background_task, args=(user_id, file_path))
    thread.daemon = True
    thread.start()
    
    # 转换为User模型
    user_dict = {
        "id": str(user_data["_id"]),
        "icloud_email": user_data["icloud_email"],
        "nickname": user_data["nickname"],
        "protagonist_features": user_data.get("protagonist_features"),
        "created_at": user_data["created_at"],
        "updated_at": user_data["updated_at"],
        "last_login": user_data.get("last_login")
    }
    
    return User(**user_dict)


@router.post("/login")
async def login(request: Request):
    """用户登录"""
    # 从 JSON 数据中获取凭据
    try:
        json_data = await request.json()
        username = json_data.get("username")
        password = json_data.get("password")
        
        # 验证必要字段
        if not username or not password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="缺少用户名或密码",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except Exception as e:
        # 处理 JSON 解析错误
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="请求数据格式错误，请使用 JSON 格式",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 查找用户
    user = await users_collection.find_one({"icloud_email": username})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 验证密码
    if not verify_password(password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 更新最后登录时间
    await users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": datetime.utcnow(), "updated_at": datetime.utcnow()}}
    )
    
    # 创建访问令牌
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user["_id"])},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "icloud_email": user["icloud_email"],
            "nickname": user["nickname"]
        }
    }


@router.get("/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """获取当前用户信息"""
    return current_user
