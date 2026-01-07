#!/usr/bin/env python3
"""
MPO 转 JPEG 转换工具
MPO (Multi-Picture Object) 格式无法被 Gemini API 处理，需要转换为标准 JPEG
"""
from pathlib import Path
from PIL import Image
import shutil
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)


def convert_mpo_to_jpeg(photo_dir: str, backup: bool = True):
    """
    将 MPO 格式图片转换为标准 JPEG

    Args:
        photo_dir: 照片目录路径
        backup: 是否备份原文件
    """
    photo_dir = Path(photo_dir)

    # 创建备份目录
    if backup:
        backup_dir = photo_dir.parent / f"{photo_dir.name}_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        logger.info(f"📦 备份目录: {backup_dir}")

    # 扫描所有 .jpg 和 .jpeg 文件
    image_files = list(photo_dir.glob("**/*.jpg")) + list(photo_dir.glob("**/*.jpeg"))

    mpo_count = 0
    converted_count = 0
    skipped_count = 0

    logger.info(f"🔍 扫描 {len(image_files)} 个图片文件...")

    for img_path in image_files:
        try:
            with Image.open(img_path) as img:
                # 检查是否是 MPO 格式
                if img.format != 'MPO':
                    skipped_count += 1
                    continue

                mpo_count += 1

                # 如果需要备份
                if backup and not backup_dir.exists():
                    backup_dir.mkdir(parents=True)

                if backup:
                    # 保持相对路径结构
                    rel_path = img_path.relative_to(photo_dir)
                    backup_path = backup_dir / rel_path
                    backup_path.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(img_path, backup_path)

                # MPO 文件可能包含多张图片，我们取第一张
                # PIL 会将 MPO 的第一张图片作为主要图像
                # 我们需要将其保存为标准 JPEG，并保留 EXIF 信息

                # 创建临时文件
                temp_path = img_path.with_suffix('.temp.jpg')

                # ⚠️ 重要：保留 EXIF 信息
                # EXIF 包含拍摄时间（DateTimeOriginal）和 GPS 坐标
                # 这些是系统分析的核心数据
                exif_data = None
                try:
                    # 尝试获取 EXIF 数据
                    exif_data = img.info.get('exif')
                    if exif_data is None:
                        # 如果没有 exif 键，尝试 _getexif() 方法
                        if hasattr(img, '_getexif'):
                            raw_exif = img._getexif()
                            if raw_exif:
                                # 将 EXIF 字典转为 bytes
                                from PIL.Image import Exif
                                exif_data = Exif()
                                for tag, value in raw_exif.items():
                                    try:
                                        exif_data[tag] = value
                                    except:
                                        pass
                except Exception as exif_err:
                    logger.warning(f"⚠️  无法提取 EXIF: {img_path.name}: {exif_err}")

                # 保存为标准 JPEG，包含 EXIF 数据
                save_kwargs = {'quality': 95, 'optimize': True}
                if exif_data:
                    save_kwargs['exif'] = exif_data
                    logger.debug(f"💾 保留 EXIF: {img_path.name}")

                img.save(temp_path, 'JPEG', **save_kwargs)

                # 替换原文件
                img_path.unlink()
                temp_path.rename(img_path)

                converted_count += 1

                if converted_count % 50 == 0:
                    logger.info(f"  进度: 已转换 {converted_count} 个 MPO 文件...")

        except Exception as e:
            logger.error(f"❌ 转换失败 {img_path}: {e}")

    logger.info("\n" + "="*70)
    logger.info("✅ 转换完成！")
    logger.info("="*70)
    logger.info(f"📊 扫描文件: {len(image_files)}")
    logger.info(f"🔍 发现 MPO: {mpo_count}")
    logger.info(f"✅ 成功转换: {converted_count}")
    logger.info(f"⏭️  跳过(JPEG): {skipped_count}")

    if backup:
        logger.info(f"\n💾 原文件已备份到: {backup_dir}")

    return converted_count


def main():
    import argparse

    parser = argparse.ArgumentParser(description='MPO 转 JPEG 转换工具')
    parser.add_argument('photo_dir', help='照片目录路径')
    parser.add_argument('--no-backup', action='store_true',
                       help='不备份原文件（谨慎使用）')

    args = parser.parse_args()

    print("\n" + "="*70)
    print("🔄 MPO 转 JPEG 转换工具")
    print("="*70)
    print()
    print(f"📁 照片目录: {args.photo_dir}")
    print(f"💾 备份: {'否' if args.no_backup else '是'}")
    print()

    if not args.no_backup:
        confirm = input("⚠️  将会备份所有 MPO 文件，是否继续？(y/N): ")
        if confirm.lower() != 'y':
            print("❌ 已取消")
            return

    convert_mpo_to_jpeg(args.photo_dir, backup=not args.no_backup)


if __name__ == "__main__":
    main()
