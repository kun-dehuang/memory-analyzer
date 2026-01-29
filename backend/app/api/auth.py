from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional
import os
from dotenv import load_dotenv

from app.models.user import User, UserCreate, UserLogin
from app.config.database import users_collection

load_dotenv()

router = APIRouter()

# 安全配置
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """获取密码哈希值"""
    return pwd_context.hash(password)


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
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无法验证凭据",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await users_collection.find_one({"_id": user_id})
    if user is None:
        raise credentials_exception
    
    # 转换为User模型
    user_dict = {
        "id": user["_id"],
        "icloud_email": user["icloud_email"],
        "nickname": user["nickname"],
        "protagonist_features": user.get("protagonist_features"),
        "created_at": user["created_at"],
        "updated_at": user["updated_at"],
        "last_login": user.get("last_login")
    }
    
    return User(**user_dict)


@router.post("/register", response_model=User)
async def register(user_create: UserCreate):
    """用户注册"""
    # 检查用户是否已存在
    existing_user = await users_collection.find_one({"icloud_email": user_create.icloud_email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该iCloud邮箱已被注册"
        )
    
    # 创建新用户
    hashed_password = get_password_hash(user_create.icloud_password)
    user_data = {
        "icloud_email": user_create.icloud_email,
        "nickname": user_create.nickname,
        "protagonist_features": user_create.protagonist_features,
        "hashed_password": hashed_password,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "last_login": None
    }
    
    # 插入数据库
    result = await users_collection.insert_one(user_data)
    user_data["_id"] = str(result.inserted_id)
    
    # 转换为User模型
    user_dict = {
        "id": user_data["_id"],
        "icloud_email": user_data["icloud_email"],
        "nickname": user_data["nickname"],
        "protagonist_features": user_data.get("protagonist_features"),
        "created_at": user_data["created_at"],
        "updated_at": user_data["updated_at"],
        "last_login": user_data.get("last_login")
    }
    
    return User(**user_dict)


@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """用户登录"""
    # 查找用户
    user = await users_collection.find_one({"icloud_email": form_data.username})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 验证密码
    if not verify_password(form_data.password, user["hashed_password"]):
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
