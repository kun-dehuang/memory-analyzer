#!/usr/bin/env python3
"""
EXIF提取器服务

基于现有的EXIFExtractor类功能，集成到新架构中
"""

from datetime import datetime
from typing import Tuple, Optional
from PIL import Image
import logging

logger = logging.getLogger(__name__)

class EXIFExtractor:
    """从照片中提取EXIF元数据"""
    
    @staticmethod
    def get_decimal_from_dms(dms, ref) -> float:
        """将 GPS DMS 格式转为 Decimal"""
        try:
            degrees = dms[0]
            minutes = dms[1]
            seconds = dms[2]

            decimal = degrees + (minutes / 60.0) + (seconds / 3600.0)
            if ref in ['S', 'W']:
                decimal = -decimal
            return decimal
        except Exception as e:
            logger.warning(f"GPS格式转换失败: {e}")
            return None
    
    @staticmethod
    def extract_datetime(image_path: str) -> datetime:
        """提取拍摄时间"""
        try:
            with Image.open(image_path) as img:
                exif = img._getexif()
                if exif:
                    # DateTimeOriginal (36867)
                    date_str = exif.get(36867) or exif.get(306)  # DateTime (306)
                    if date_str:
                        # 格式: "2023:12:25 14:30:00"
                        return datetime.strptime(date_str, "%Y:%m:%d %H:%M:%S")
        except Exception as e:
            logger.warning(f"无法提取时间戳 {image_path}: {e}")

        # 备用：使用文件修改时间
        try:
            import os
            return datetime.fromtimestamp(os.path.getmtime(image_path))
        except Exception as e:
            logger.warning(f"无法获取文件修改时间: {e}")
            return datetime.now()
    
    @staticmethod
    def extract_gps(image_path: str) -> Tuple[Optional[float], Optional[float]]:
        """提取 GPS 坐标"""
        try:
            with Image.open(image_path) as img:
                exif = img._getexif()
                if exif and 34853 in exif:  # GPSInfo
                    gps_info = exif[34853]

                    lat = None
                    lon = None

                    # 纬度
                    if 2 in gps_info and 1 in gps_info:  # GPSLatitude, GPSLatitudeRef
                        lat = EXIFExtractor.get_decimal_from_dms(
                            gps_info[2], gps_info[1]
                        )

                    # 经度
                    if 4 in gps_info and 3 in gps_info:  # GPSLongitude, GPSLongitudeRef
                        lon = EXIFExtractor.get_decimal_from_dms(
                            gps_info[4], gps_info[3]
                        )

                    return lat, lon
        except Exception as e:
            logger.warning(f"无法提取GPS {image_path}: {e}")

        return None, None
    
    @classmethod
    def process_photo(cls, photo_path: str) -> dict:
        """处理单张照片，提取所有元数据"""
        try:
            filename = photo_path.split('/')[-1]
            dt = cls.extract_datetime(photo_path)
            lat, lon = cls.extract_gps(photo_path)

            return {
                "path": photo_path,
                "filename": filename,
                "datetime": dt,
                "gps_lat": lat,
                "gps_lon": lon,
                "has_gps": lat is not None and lon is not None
            }
        except Exception as e:
            logger.warning(f"处理照片失败 {photo_path}: {e}")
            return {
                "path": photo_path,
                "filename": photo_path.split('/')[-1],
                "datetime": datetime.now(),
                "gps_lat": None,
                "gps_lon": None,
                "has_gps": False
            }
