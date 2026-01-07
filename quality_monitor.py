#!/usr/bin/env python3
"""
实时质量监控和验证系统
在 Phase 1 分析过程中实时检查结果质量
"""
import json
from pathlib import Path
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)


class QualityMonitor:
    """Phase 1 分析质量监控器"""

    def __init__(self):
        self.cache_dir = Path("cache/phase1")
        self.report_dir = Path("cache/reports")
        self.report_dir.mkdir(parents=True, exist_ok=True)

    def check_batch_quality(self, batch_id: str) -> dict:
        """检查单个批次的质量"""
        cache_path = self.cache_dir / f"batch_{batch_id}.json"

        if not cache_path.exists():
            return {"status": "pending", "reason": "批次尚未处理"}

        with open(cache_path) as f:
            data = json.load(f)

        output = data['raw_vlm_output']
        output_len = len(output)
        photo_count = data['image_count']

        # 质量标准
        checks = {
            "has_output": output_len > 200,
            "not_failed": "分析失败" not in output and "不支持" not in output,
            "has_protagonist_marker": "【主角】" in output or output_len > 500,
            "meaningful_content": output_len > 1000  # 详细的描述应该有1000+字符
        }

        # 判断总体质量
        if all(checks.values()):
            quality = "excellent"  # 优秀
        elif checks["has_output"] and checks["not_failed"]:
            quality = "acceptable"  # 可接受
        else:
            quality = "failed"  # 失败

        return {
            "batch_id": batch_id,
            "quality": quality,
            "photo_count": photo_count,
            "output_length": output_len,
            "checks": checks,
            "preview": output[:200] if output_len > 0 else ""
        }

    def generate_report(self) -> dict:
        """生成质量报告"""
        batch_files = sorted(self.cache_dir.glob("*.json"))

        results = {
            "timestamp": datetime.now().isoformat(),
            "total_batches": len(batch_files),
            "excellent": 0,
            "acceptable": 0,
            "failed": 0,
            "pending": 0,
            "batches": []
        }

        for batch_file in batch_files:
            batch_id = batch_file.stem.replace("batch_", "")
            quality = self.check_batch_quality(batch_id)

            results["batches"].append(quality)
            results[quality["quality"]] += 1

        return results

    def print_report(self, report: dict):
        """打印质量报告"""
        print("\n" + "="*70)
        print("📊 Phase 1 分析质量报告")
        print("="*70)
        print(f"⏰ 检查时间: {report['timestamp']}")
        print(f"📦 总批次数: {report['total_batches']}")
        print()
        print("质量分布:")
        print(f"  ⭐ 优秀: {report['excellent']} ({report['excellent']*100//report['total_batches'] if report['total_batches'] > 0 else 0}%)")
        print(f"  ✅ 可接受: {report['acceptable']} ({report['acceptable']*100//report['total_batches'] if report['total_batches'] > 0 else 0}%)")
        print(f"  ❌ 失败: {report['failed']} ({report['failed']*100//report['total_batches'] if report['total_batches'] > 0 else 0}%)")
        print(f"  ⏳ 待处理: {report['pending']}")
        print()

        # 显示失败的批次
        failed_batches = [b for b in report['batches'] if b['quality'] == 'failed']
        if failed_batches:
            print("❌ 失败批次列表:")
            for b in failed_batches[:10]:  # 只显示前10个
                print(f"  - {b['batch_id']}: {b['photo_count']}张, {b['output_length']}字符")
                if b['preview']:
                    print(f"    原因: {b['preview']}")
            if len(failed_batches) > 10:
                print(f"  ... 还有 {len(failed_batches)-10} 个失败批次")
            print()

        # 显示优秀批次示例
        excellent_batches = [b for b in report['batches'] if b['quality'] == 'excellent']
        if excellent_batches:
            print("⭐ 优秀批次示例（前3个）:")
            for b in excellent_batches[:3]:
                print(f"  - {b['batch_id']}: {b['photo_count']}张, {b['output_length']}字符")
            print()

        print("="*70)

    def save_report(self, report: dict):
        """保存质量报告到文件"""
        report_path = self.report_dir / f"quality_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        logger.info(f"💾 质量报告已保存: {report_path}")


def main():
    monitor = QualityMonitor()
    report = monitor.generate_report()
    monitor.print_report(report)
    monitor.save_report(report)


if __name__ == "__main__":
    main()
