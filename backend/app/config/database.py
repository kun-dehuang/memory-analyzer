from pymongo import MongoClient
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB 连接配置
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "memory_analyzer")

# 同步客户端
sync_client = MongoClient(MONGODB_URI)
sync_db = sync_client[DB_NAME]

# 异步客户端
async_client = AsyncIOMotorClient(MONGODB_URI)
async_db = async_client[DB_NAME]

# 集合引用
users_collection = async_db["users"]
prompt_groups_collection = async_db["prompt_groups"]
prompts_collection = async_db["prompts"]
memory_records_collection = async_db["memory_records"]
photo_metadata_collection = async_db["photo_metadata"]
photos_collection = async_db["photos"]

# 索引创建
async def create_indexes():
    """创建必要的索引"""
    # 用户集合索引
    await users_collection.create_index("icloud_email", unique=True)
    
    # 提示词组集合索引
    await prompt_groups_collection.create_index("name", unique=True)
    
    # 提示词集合索引
    await prompts_collection.create_index("prompt_group_id")
    
    # 记忆记录集合索引
    await memory_records_collection.create_index("user_id")
    await memory_records_collection.create_index("created_at")
    
    # 照片元数据集合索引
    await photo_metadata_collection.create_index("user_id")
    await photo_metadata_collection.create_index("datetime")
    
    # 照片集合索引
    await photos_collection.create_index("user_id")
    await photos_collection.create_index("image_hash", unique=True)
    await photos_collection.create_index("created_at")
