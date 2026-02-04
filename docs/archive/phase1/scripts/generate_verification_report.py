#!/usr/bin/env python3
"""
P1 功能验证报告生成器
分析单元测试结果并生成详细的可用性报告
"""

import json
import os
import sys
from datetime import datetime

# 测试结果数据（从测试输出手动提取）
test_results = {
    "总测试数": 49,
    "通过数": 47,
    "失败数": 2,
    "错误数": 1,
    "运行时间": "2.92s",
    "tests": {
        "DataProcessing.test.ts": {
            "总数": 13,
            "通过": 13,
            "失败": 0,
            "测试项": [
                "Validator: 数据验证 ✅",
                "CostCalculator: 成本计算 ✅",
                "SourceTagger: 数据来源标记 ✅"
            ]
        },
        "ManageStrategies.test.ts": {
            "总数": 9,
            "通过": 9,
            "失败": 0,
            "测试项": [
                "validateStrategy: 策略验证 ✅",
                "formatTable: 表格格式化 ✅",
                "constructor: 构造器 ✅"
            ]
        },
        "CLI.test.ts": {
            "总数": "未知",
            "通过": 0,
            "失败": 0,
            "测试项": [
                "❌ 错误：无法找到模块 './CLI'"
            ],
            "错误": "Cannot find module './CLI'"
        },
        "UsageSync.test.ts": {
            "总数": 27,
            "通过": 25,
            "失败": 2,
            "测试项": [
                "AnthropicSync: 部分可用 ⚠️",
                "OpenAISync: API 密钥无效 ❌",
                "ZhiPuSync: 未配置 ⚠️",
                "GitHubSync: 未配置 ⚠️",
                "GeminiSync: 未配置 ⚠️",
                "LocalStatsSync: 可用 ✅"
            ]
        }
    },
    "厂商状态": {
        "Anthropic": {
            "状态": "⚠️ 部分可用",
            "凭证": "✓ 已配置 (OAuth)",
            "问题": "anthropic_api_usage CLI 工具未安装",
            "影响": "无法获取使用统计数据"
        },
        "OpenAI": {
            "状态": "❌ 不可用",
            "凭证": "✓ 已配置 (OAuth JWT)",
            "问题": "API 返回 401 错误 - 无效的 API 密钥",
            "影响": "健康检查失败，无法访问 API"
        },
        "ZhiPu (智谱 AI)": {
            "状态": "⚠️ 部分可用",
            "凭证": "✓ 已配置 (API Key)",
            "问题": "测试跳过 - 环境变量未正确设置",
            "影响": "需要验证环境变量配置"
        },
        "GitHub": {
            "状态": "⚠️ 部分可用",
            "凭证": "✓ 已配置 (GitHub PAT)",
            "问题": "测试跳过 - 环境变量未正确设置",
            "影响": "需要验证环境变量配置"
        },
        "Google/Gemini": {
            "状态": "⚠️ 部分可用",
            "凭证": "✓ 已配置 (OAuth)",
            "问题": "测试跳过 - GEMINI_ACCESS_TOKEN 环境变量未设置",
            "影响": "需要正确的环境变量映射"
        },
        "DeepSeek": {
            "状态": "✅ 可用",
            "凭证": "✓ 已配置 (API Key)",
            "问题": "无",
            "影响": "正常运行"
        },
        "OpenRouter": {
            "状态": "✅ 可用",
            "凭证": "✓ 已配置 (API Key)",
            "问题": "无",
            "影响": "正常运行"
        }
    }
}

def generate_report():
    """生成详细的功能验证报告"""
    
    report = []
    report.append("=" * 70)
    report.append("P1 项目功能验证报告")
    report.append("=" * 70)
    report.append("")
    report.append(f"生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    report.append(f"项目: StrategyManager")
    report.append(f"测试框架: Bun Test")
    report.append("")
    
    # 测试汇总
    report.append("-" * 70)
    report.append("测试汇总")
    report.append("-" * 70)
    report.append("")
    
    total = test_results["总测试数"]
    passed = test_results["通过数"]
    failed = test_results["失败数"]
    errors = test_results["错误数"]
    
    pass_rate = (passed / total * 100) if total > 0 else 0
    
    report.append(f"总测试数:   {total}")
    report.append(f"通过数:     {passed} ✅")
    report.append(f"失败数:     {failed} ❌")
    report.append(f"错误数:     {errors} ⚠️")
    report.append(f"通过率:     {pass_rate:.1f}%")
    report.append(f"运行时间:   {test_results['运行时间']}")
    report.append("")
    
    # 按文件分类
    report.append("-" * 70)
    report.append("文件分类统计")
    report.append("-" * 70)
    report.append("")
    
    for filename, data in test_results["tests"].items():
        total_tests = data["总数"]
        passed_tests = data["通过"]
        failed_tests = data["失败"]
        
        if isinstance(total_tests, int):
            pass_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
            status = "✅" if failed_tests == 0 else "❌"
            report.append(f"{status} {filename}")
            report.append(f"   总数: {total_tests} | 通过: {passed_tests} | 失败: {failed_tests} ({pass_rate:.0f}%)")
        else:
            report.append(f"⚠️  {filename}")
            report.append(f"   状态: {data.get('错误', '模块丢失')}")
        
        if "测试项" in data:
            for item in data["测试项"]:
                report.append(f"   - {item}")
        report.append("")
    
    # 厂商可用性分析
    report.append("-" * 70)
    report.append("厂商 API 可用性分析")
    report.append("-" * 70)
    report.append("")
    
    available_count = 0
    partial_count = 0
    unavailable_count = 0
    
    for vendor, info in test_results["厂商状态"].items():
        status = info["状态"]
        creds = info["凭证"]
        problem = info["问题"]
        impact = info["影响"]
        
        if status.startswith("✅"):
            available_count += 1
        elif status.startswith("⚠️"):
            partial_count += 1
        else:
            unavailable_count += 1
        
        report.append(f"{status} {vendor}")
        report.append(f"   凭证: {creds}")
        report.append(f"   问题: {problem}")
        report.append(f"   影响: {impact}")
        report.append("")
    
    # 可用性总结
    report.append("-" * 70)
    report.append("可用性总结")
    report.append("-" * 70)
    report.append("")
    
    total_vendors = len(test_results["厂商状态"])
    report.append(f"✅ 完全可用: {available_count}/{total_vendors} ({available_count/total_vendors*100:.0f}%)")
    report.append(f"⚠️  部分可用: {partial_count}/{total_vendors} ({partial_count/total_vendors*100:.0f}%)")
    report.append(f"❌ 不可用: {unavailable_count}/{total_vendors} ({unavailable_count/total_vendors*100:.0f}%)")
    report.append("")
    
    # 功能可用性百分比
    total_features = passed + failed + errors
    availability_rate = (passed / total_features * 100) if total_features > 0 else 0
    report.append(f"总体功能可用率: {availability_rate:.1f}%")
    report.append("")
    
    # 建议
    report.append("-" * 70)
    report.append("建议和修复方案")
    report.append("-" * 70)
    report.append("")
    
    recommendations = [
        "1. OpenAI API 密钥问题",
        "   • 问题: OAuth JWT 令牌与 OpenAI API 不兼容",
        "   • 建议: 使用独立的 OpenAI API 密钥而不是 JWT 令牌",
        "   • 优先级: 🔴 高 - 影响 OpenAI 集成",
        "",
        "2. CLI 工具缺失 (anthropic_api_usage)",
        "   • 问题: Anthropic 使用统计 CLI 工具未安装",
        "   • 建议: 安装 Anthropic 官方 CLI 工具: pip install anthropic-cli",
        "   • 优先级: 🟡 中 - 影响使用统计收集",
        "",
        "3. 环境变量映射不完整",
        "   • 问题: ZhiPu, GitHub, Gemini 的环境变量名称不匹配",
        "   • 建议: 更新 auth.json 到环境变量的映射逻辑",
        "   • 优先级: 🟡 中 - 影响多个厂商集成",
        "",
        "4. CLI 模块缺失",
        "   • 问题: tests/CLI.test.ts 无法找到 './CLI' 模块",
        "   • 建议: 检查 Tools/ 目录中是否存在 CLI.ts 文件",
        "   • 优先级: 🟡 中 - 影响 CLI 功能测试",
        "",
        "5. 核心功能验证",
        "   • 优点: DataProcessing, ManageStrategies 测试通过率 100%",
        "   • 建议: 这些模块可以用于生产环境",
        "   • 优先级: 🟢 低 - 已验证",
    ]
    
    for rec in recommendations:
        report.append(rec)
    
    report.append("")
    report.append("-" * 70)
    report.append("测试覆盖范围")
    report.append("-" * 70)
    report.append("")
    report.append("已测试的功能模块:")
    report.append("  ✅ 数据处理和验证 (DataProcessing)")
    report.append("  ✅ 策略管理 (ManageStrategies)")
    report.append("  ⚠️  使用统计同步 (UsageSync) - 部分可用")
    report.append("  ❌ 命令行界面 (CLI) - 测试失败")
    report.append("")
    
    report.append("已验证的 API 集成:")
    report.append("  ✅ DeepSeek - 完全可用")
    report.append("  ✅ OpenRouter - 完全可用")
    report.append("  ⚠️  Anthropic - 部分可用 (缺少 CLI 工具)")
    report.append("  ❌ OpenAI - 不可用 (API 密钥问题)")
    report.append("  ⚠️  ZhiPu - 部分可用 (环境变量问题)")
    report.append("  ⚠️  GitHub - 部分可用 (环境变量问题)")
    report.append("  ⚠️  Google/Gemini - 部分可用 (环境变量问题)")
    report.append("")
    
    report.append("=" * 70)
    report.append("报告结束")
    report.append("=" * 70)
    
    return "\n".join(report)

# 生成并打印报告
if __name__ == "__main__":
    report = generate_report()
    print(report)
    
    # 也保存到文件
    report_file = "P1_TEST_VERIFICATION_REPORT.md"
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write(report)
    
    print(f"\n✅ 报告已保存到: {report_file}")
