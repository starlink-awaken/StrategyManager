#!/bin/bash

# Strategy Helper - 智能策略推荐助手
# Version: 1.0
# Author: Strategy Planning System

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 策略配置路径
STRATEGY_DIR="$HOME/.config/opencode/strategies"

# 打印标题
print_header() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}   🎯 OpenCode 策略选择助手 v1.0${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# 显示场景选择
show_scenarios() {
    echo -e "${BLUE}请选择您当前的任务类型：${NC}"
    echo ""
    echo "  ${GREEN}1${NC})  个人项目开发"
    echo "  ${GREEN}2${NC})  子女家庭教育"
    echo "  ${GREEN}3${NC})  公文处理"
    echo "  ${GREEN}4${NC})  家庭健康管理"
    echo "  ${GREEN}5${NC})  AI 项目探索"
    echo "  ${GREEN}6${NC})  深度研究报告"
    echo "  ${GREEN}7${NC})  金融股票交易探索"
    echo "  ${GREEN}8${NC})  日常工具使用"
    echo "  ${GREEN}9${NC})  笔记及知识管理"
    echo "  ${GREEN}10${NC}) 个人体系搭建"
    echo "  ${GREEN}11${NC}) 个人娱乐"
    echo "  ${GREEN}12${NC}) 多媒体创作"
    echo "  ${GREEN}13${NC}) 个人写作与发布"
    echo "  ${GREEN}14${NC}) 新媒体运营"
    echo ""
    echo -e "${YELLOW}0${NC})  显示所有策略对比"
    echo -e "${RED}q${NC})  退出"
    echo ""
}

# 推荐策略
recommend_strategy() {
    local choice=$1
    local strategy=""
    local alternative=""
    local reason=""
    local cost=""
    local frequency=""
    
    case $choice in
        1)
            strategy="balanced"
            alternative="performance"
            reason="GPT-5.2-Codex 代码专精，适合日常开发"
            cost="¥15-25/次"
            frequency="每天多次"
            ;;
        2)
            strategy="balanced"
            alternative="4-creative"
            reason="Claude Sonnet 温和耐心，已针对教育场景优化"
            cost="¥15-20/次"
            frequency="每周10-15次"
            ;;
        3)
            strategy="economical"
            alternative="balanced"
            reason="免费模型（GPT-5-mini）快速规范，完全足够"
            cost="¥2-5/次"
            frequency="每天多次"
            ;;
        4)
            strategy="balanced"
            alternative="performance"
            reason="专业提示 + Opus 验证，保证准确性"
            cost="¥20-30/次"
            frequency="每周5-10次"
            ;;
        5)
            strategy="performance"
            alternative="balanced"
            reason="实验迭代需要质量保证，强推理能力"
            cost="¥50-80/次"
            frequency="项目期间每天"
            ;;
        6)
            strategy="5-research"
            alternative="performance"
            reason="Opus + 300k thinking tokens，最强推理能力"
            cost="¥150-250/次"
            frequency="每周1-2次"
            ;;
        7)
            strategy="5-research"
            alternative="performance"
            reason="多模型交叉验证，风险意识，审慎分析"
            cost="¥150-250/次"
            frequency="每周2-3次"
            ;;
        8)
            strategy="economical"
            alternative="balanced"
            reason="轻量级任务，免费快速模型完全满足"
            cost="¥2-5/次"
            frequency="每天多次"
            ;;
        9)
            strategy="balanced"
            alternative="economical"
            reason="GLM 高并发整理，结构化输出"
            cost="¥8-15/次"
            frequency="每周20-30次"
            ;;
        10)
            strategy="5-research"
            alternative="performance"
            reason="系统性深度思考，长期规划需要最强推理"
            cost="¥200-300/次"
            frequency="每月1-2次"
            ;;
        11)
            strategy="economical"
            alternative="balanced"
            reason="娱乐场景，轻量有趣，零成本"
            cost="¥2-5/次"
            frequency="每周10-20次"
            ;;
        12)
            strategy="4-creative"
            alternative="balanced"
            reason="Sonnet + Gemini 创意组合，高温度配置"
            cost="¥40-60/次"
            frequency="每周5-10次"
            ;;
        13)
            strategy="4-creative"
            alternative="balanced"
            reason="高质量文笔，专业写作优化"
            cost="¥45-65/次"
            frequency="每周8-12次"
            ;;
        14)
            strategy="4-creative"
            alternative="balanced"
            reason="创意 + 传播性，吸引力优化"
            cost="¥40-55/次"
            frequency="每周10-15次"
            ;;
        *)
            echo -e "${RED}无效选择${NC}"
            return
            ;;
    esac
    
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}📌 推荐策略：${YELLOW}$strategy${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "  ${BLUE}原因：${NC}$reason"
    echo -e "  ${BLUE}成本：${NC}$cost"
    echo -e "  ${BLUE}频率：${NC}$frequency"
    echo -e "  ${BLUE}备选：${NC}$alternative"
    echo ""
    
    # 生成启动命令
    local strategy_file="${STRATEGY_DIR}/strategy-${strategy/-/_}.jsonc"
    
    # 特殊处理策略文件名
    case $strategy in
        "balanced")
            strategy_file="${STRATEGY_DIR}/strategy-2-balanced.jsonc"
            ;;
        "performance")
            strategy_file="${STRATEGY_DIR}/strategy-1-performance.jsonc"
            ;;
        "economical")
            strategy_file="${STRATEGY_DIR}/strategy-3-economical.jsonc"
            ;;
        "5-research")
            strategy_file="${STRATEGY_DIR}/strategy-5-research.jsonc"
            ;;
        "4-creative")
            strategy_file="${STRATEGY_DIR}/strategy-4-creative.jsonc"
            ;;
    esac
    
    echo -e "${YELLOW}💡 启动命令：${NC}"
    echo ""
    echo -e "  opencode --config $strategy_file"
    echo ""
    
    # 如果设置了别名
    if command -v $strategy &> /dev/null || alias $strategy 2>/dev/null; then
        echo -e "${GREEN}✅ 或使用别名：${NC}"
        echo ""
        echo -e "  $strategy"
        echo ""
    fi
}

# 显示所有策略对比
show_all_strategies() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}   📊 策略对比表${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    printf "${BLUE}%-25s %-15s %-15s %-30s${NC}\n" "策略" "月度成本" "适用频率" "最佳场景"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    printf "%-25s %-15s %-15s %-30s\n" \
        "balanced ⭐" \
        "¥400-700" \
        "每天多次" \
        "默认日常（80%场景）"
    
    printf "%-25s %-15s %-15s %-30s\n" \
        "5-research 🧠" \
        "¥600-1000" \
        "每周1-3次" \
        "深度研究/金融/体系"
    
    printf "%-25s %-15s %-15s %-30s\n" \
        "4-creative 🎨" \
        "¥400-600" \
        "每周10-15次" \
        "创作/写作/新媒体"
    
    printf "%-25s %-15s %-15s %-30s\n" \
        "performance ⚡" \
        "¥100-200" \
        "按需升级" \
        "重要任务质量保证"
    
    printf "%-25s %-15s %-15s %-30s\n" \
        "economical 💰" \
        "¥50-150" \
        "轻量任务" \
        "快速查询/娱乐"
    
    printf "%-25s %-15s %-15s %-30s\n" \
        "super 🚀" \
        "¥2000+" \
        "极少用" \
        "紧急关键（不推荐）"
    
    echo ""
    echo -e "${YELLOW}💡 建议：${NC}"
    echo "  • 80% 时间使用 balanced"
    echo "  • 深度研究时用 5-research"
    echo "  • 创意写作时用 4-creative"
    echo "  • 成本压力时用 economical"
    echo ""
}

# 显示成本状态（简化版，实际需要解析日志）
show_cost_status() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}   💰 成本状态（预估）${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}注意：这是简化版本，实际成本需要通过 cost-monitor.sh 查看${NC}"
    echo ""
    echo "  可用资源总价值：  ¥3,500 - 4,500 / 月"
    echo "  推荐使用范围：    ¥500 - 900 / 月"
    echo ""
    echo "  GitHub Copilot:   1500 premium requests/月"
    echo "  Anthropic Pro:    5小时重置 + 周限制"
    echo "  OpenAI Plus:      5小时重置 + 周限制"
    echo "  ZhiPu Max:        60x Anthropic 额度"
    echo ""
}

# 主函数
main() {
    print_header
    
    while true; do
        show_scenarios
        read -p "请输入选项 (1-14, 0=对比, q=退出): " choice
        
        case $choice in
            [1-9]|1[0-4])
                recommend_strategy $choice
                show_cost_status
                ;;
            0)
                show_all_strategies
                show_cost_status
                ;;
            q|Q)
                echo ""
                echo -e "${GREEN}👋 再见！祝您使用愉快！${NC}"
                echo ""
                exit 0
                ;;
            *)
                echo ""
                echo -e "${RED}❌ 无效输入，请重新选择${NC}"
                echo ""
                ;;
        esac
        
        echo ""
        read -p "按 Enter 继续..." dummy
        clear
        print_header
    done
}

# 运行主函数
main
