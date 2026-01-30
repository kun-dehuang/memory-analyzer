import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

# 测试数据库连接
async def test_db_connection():
    try:
        MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
        DB_NAME = os.getenv("DB_NAME", "memory_analyzer")
        
        print(f"尝试连接到 MongoDB: {MONGODB_URI}")
        client = AsyncIOMotorClient(MONGODB_URI)
        
        # 测试连接
        db = client[DB_NAME]
        await db.command('ping')
        print("✅ MongoDB 连接成功")
        
        # 测试集合
        users_collection = db["users"]
        count = await users_collection.count_documents({})
        print(f"✅ 用户集合中有 {count} 个文档")
        
        client.close()
        return True
    except Exception as e:
        print(f"❌ MongoDB 连接失败: {e}")
        return False

# 运行测试
if __name__ == "__main__":
    import asyncio
    asyncio.run(test_db_connection())