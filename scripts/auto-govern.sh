#!/bin/bash

# StrategyManager 自动化治理脚本
# 建议配置为 Cron 任务，例如每小时执行一次:
# 0 * * * * /Volumes/Model/Workspace/Skills/local/StrategyManager/scripts/auto-govern.sh >> /Volumes/Model/Workspace/Skills/local/StrategyManager/logs/auto-govern.log 2>&1

set -e

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( dirname "$SCRIPT_DIR" )"

cd "$PROJECT_ROOT"

# 1. 创建日志目录
mkdir -p logs

echo "------------------------------------------------------------"
echo "开始自动化治理任务: $(date)"
echo "------------------------------------------------------------"

# 2. 刷新用量并感知异常 (Phase 2: 自动化感知)
echo "Step 1: 同步多平台使用数据并检测 API 状态..."
bun run Tools/ManageStrategies.ts sync-usage || echo "Warning: 部分厂商同步失败，已记录异常状态。"

echo ""

# 3. 执行自主治理决策 (Phase 3: 闭环重平衡)
echo "Step 2: 评估当前策略健康度并执行重平衡..."
bun run Tools/ManageStrategies.ts govern

echo ""
echo "Step 3: 当前系统健康摘要..."
bun run Tools/ManageStrategies.ts check-health

echo "------------------------------------------------------------"
echo "任务完成: $(date)"
echo "------------------------------------------------------------"
