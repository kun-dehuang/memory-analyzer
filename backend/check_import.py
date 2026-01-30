try:
    import main
    print("✅ main模块导入成功")
except Exception as e:
    print(f"❌ main模块导入失败: {e}")
    import traceback
    traceback.print_exc()