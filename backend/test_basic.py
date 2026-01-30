print("✅ Python 脚本执行成功")
print(f"Python 版本: {__import__('sys').version}")
print(f"当前工作目录: {__import__('os').getcwd()}")

# 测试基本导入
try:
    import fastapi
    print("✅ fastapi 导入成功")
except Exception as e:
    print(f"❌ fastapi 导入失败: {e}")

try:
    import uvicorn
    print("✅ uvicorn 导入成功")
except Exception as e:
    print(f"❌ uvicorn 导入失败: {e}")

try:
    import motor
    print("✅ motor 导入成功")
except Exception as e:
    print(f"❌ motor 导入失败: {e}")