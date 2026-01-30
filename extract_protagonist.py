#!/usr/bin/env python3
"""
主角特征提取工具 - Phase 0.5

用户上传一张自己的照片，系统提取特征用于后续识别
"""

import os
import json
from pathlib import Path
from PIL import Image
import google.genai as genai
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def extract_protagonist_features(reference_photo_path: str) -> dict:
    """
    从参考照片中提取主角特征

    Args:
        reference_photo_path: 主角参考照片路径

    Returns:
        主角特征字典
    """
    print("="*70)
    print("🎯 Phase 0.5: 提取主角特征")
    print("="*70)
    print()

    if not Path(reference_photo_path).exists():
        print(f"❌ 照片不存在: {reference_photo_path}")
        return None

    # 加载图片
    image = Image.open(reference_photo_path)

    # 使用 Flash 提取特征
    model = genai.GenerativeModel('models/gemini-2.5-flash')

    prompt = """你是一位专业的人像摄影师。请详细描述这张照片中的人物特征。

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

    print(f"📸 分析参考照片: {reference_photo_path}")
    print()

    try:
        response = model.generate_content([prompt, image])
        raw_json = response.text.strip()

        # 提取 JSON
        import re
        json_match = re.search(r'```json\s*(.*?)\s*```', raw_json, re.DOTALL)
        if json_match:
            raw_json = json_match.group(1)
        else:
            json_match = re.search(r'\{.*\}', raw_json, re.DOTALL)
            if json_match:
                raw_json = json_match.group(0)

        features = json.loads(raw_json)

        # 保存特征
        output_path = Path("cache/protagonist_features.json")
        output_path.parent.mkdir(exist_ok=True)

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump({
                "reference_photo": reference_photo_path,
                "extracted_at": datetime.now().isoformat(),
                "features": features
            }, f, ensure_ascii=False, indent=2)

        print("✅ 主角特征提取完成！")
        print()
        print("📋 提取的特征:")
        print(f"  性别: {features['gender']}")
        print(f"  年龄段: {features['age_group']}")
        print(f"  发型: {features['facial_features']['hair']}")
        print(f"  关键识别特征:")
        for i, identifier in enumerate(features['key_identifiers'], 1):
            print(f"    {i}. {identifier}")
        print()
        print(f"💾 特征已保存到: {output_path}")
        print()
        print("="*70)
        print("✅ 现在可以运行完整分析了:")
        print("   python3 memory_profiler.py 去重后保留_20260107_020927")
        print("="*70)

        return features

    except Exception as e:
        print(f"❌ 特征提取失败: {e}")
        return None


def main():
    import argparse

    parser = argparse.ArgumentParser(description='主角特征提取工具')
    parser.add_argument('reference_photo', help='主角参考照片路径')

    args = parser.parse_args()

    extract_protagonist_features(args.reference_photo)


if __name__ == "__main__":
    main()
