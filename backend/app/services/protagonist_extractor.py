#!/usr/bin/env python3
"""
主角特征提取服务

基于现有的extract_protagonist.py功能，集成到新架构中
"""

import os
import json
from pathlib import Path
from PIL import Image
import google.genai as genai
from dotenv import load_dotenv

from ..config.database import prompts_collection

load_dotenv()

# 配置Gemini API
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

async def get_protagonist_prompt(prompt_group_id: str = None) -> str:
    """
    从数据库获取主角特征提取的提示词

    Args:
        prompt_group_id: 提示词组ID，可选

    Returns:
        提示词字符串
    """
    try:
        query = {"type": "protagonist"}
        if prompt_group_id:
            query["prompt_group_id"] = prompt_group_id
        
        # 按创建时间倒序，获取最新的提示词
        prompt_doc = await prompts_collection.find_one(query, sort=[("created_at", -1)])
        
        if prompt_doc:
            return prompt_doc["content"]
            
    except Exception as e:
        print(f"❌ 从数据库获取提示词失败: {e}")
    
    # Fallback to default prompt
    return """你是一位专业的人像摄影师。请详细描述这张照片中的人物特征。

**任务**: 请提取以下信息，用于在其他照片中识别这个人：

1. **基本信息**:
   - 性别（男/女）
   - 年龄段（20-25岁、26-30岁、31-35岁、36-40岁、40岁以上）
   - 体型（瘦/匀称/丰满）

2. **面部特征**:
   - 发型（长发/短发/中发、直发/卷发、发色）
   - 脸型（圆脸/方脸/瓜子脸/鹅蛋脸）
   - 是否戴眼镜（是/否，眼镜类型）
   - 其他特征（胡须、雀斑、痣等明显特征）

3. **外貌特征**:
   - 身高（大概估计，如：165cm左右、175cm左右）
   - 皮肤（白皙/小麦色/黝黑）

4. **服装风格**:
   - 风格偏好（休闲/商务/运动/时尚）
   - 常见颜色

5. **识别建议**:
   - 给出3个最明显的识别特征，用于在人群中快速识别这个人

请以 JSON 格式输出：
```json
{
  "gender": "女",
  "age_group": "26-30岁",
  "body_type": "匀称",
  "facial_features": {
    "hair": "黑色齐肩短发",
    "face_shape": "瓜子脸",
    "glasses": "无",
    "distinctive_features": "左脸颊有一颗小痣"
  },
  "appearance": {
    "height_estimate": "165cm左右",
    "skin_tone": "白皙"
  },
  "style": "休闲简约风",
  "key_identifiers": [
    "黑色齐肩短发",
    "瓜子脸白皙皮肤",
    "左脸颊小痣"
  ]
}
```

请直接输出 JSON，不要添加任何其他文字。"""

async def extract_protagonist_features(reference_photo_path: str, prompt_group_id: str = None, user_id: str = None) -> dict:
    """
    从参考照片中提取主角特征

    Args:
        reference_photo_path: 主角参考照片路径
        prompt_group_id: 提示词组ID，可选
        user_id: 用户ID，可选，用于存储特征到数据库

    Returns:
        主角特征字典
    """
    print("="*70)
    print("🎯 提取主角特征")
    print("="*70)
    print()

    if not Path(reference_photo_path).exists():
        print(f"❌ 照片不存在: {reference_photo_path}")
        return None

    # 加载图片
    image = Image.open(reference_photo_path)

    # 从数据库获取提示词
    prompt = await get_protagonist_prompt(prompt_group_id)

    print(f"📸 分析参考照片: {reference_photo_path}")
    print()

    try:
        # 生成内容
        response = client.generate_content(
            model="models/gemini-2.5-flash",
            content=[prompt, image]
        )
        raw_output = response.text.strip()

        # 提取 JSON
        if '```json' in raw_output:
            json_str = raw_output.split('```json')[1].split('```')[0].strip()
        else:
            json_str = raw_output

        # 解析 JSON
        features = json.loads(json_str)
        print("✅ 特征提取成功")
        print(f"👤 性别: {features['gender']}")
        print(f"📅 年龄段: {features['age_group']}")
        print(f"📏 身高估计: {features['appearance']['height_estimate']}")
        print(f"🔍 关键识别特征:")
        for i, feature in enumerate(features['key_identifiers'], 1):
            print(f"   {i}. {feature}")
        print()

        # 如果提供了user_id，将特征存储到数据库
        if user_id:
            try:
                from datetime import datetime
                from ..config.database import users_collection
                
                # 更新用户的主角特征
                await users_collection.update_one(
                    {"_id": user_id},
                    {"$set": {
                        "protagonist_features": features,
                        "updated_at": datetime.utcnow()
                    }}
                )
                print(f"✅ 主角特征已存储到用户 {user_id} 的数据库记录中")
                print()
                
            except Exception as db_error:
                print(f"❌ 存储主角特征到数据库失败: {db_error}")
                import traceback
                traceback.print_exc()

        return features

    except Exception as e:
        print(f"❌ 特征提取失败: {e}")
        import traceback
        traceback.print_exc()
        return None