#!/bin/bash

##############################################################################
# StrategyManager Slash Command 安装脚本
#
# 功能：将 /strategies slash command 安装到 ~/.config/opencode/commands/
#
# 使用：bash scripts/install-slash-command.sh
##############################################################################

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 获取脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# 配置目录
OPENCODE_CONFIG_DIR="$HOME/.config/opencode"
COMMANDS_DIR="$OPENCODE_CONFIG_DIR/commands"
STRATEGY_COMMAND_TEMPLATE="$PROJECT_ROOT/command/strategies.md"
STRATEGY_COMMAND_DEST="$COMMANDS_DIR/strategies.md"

##############################################################################
# 辅助函数
##############################################################################

print_header() {
  echo -e "\n${BLUE}================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}================================${NC}\n"
}

print_success() {
  echo -e "${GREEN}✓${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

##############################################################################
# 主函数
##############################################################################

main() {
  print_header "StrategyManager Slash Command 安装"

  # 检查模板文件
  if [ ! -f "$STRATEGY_COMMAND_TEMPLATE" ]; then
    print_error "Slash command 模板不存在: $STRATEGY_COMMAND_TEMPLATE"
    exit 1
  fi

  # 创建 commands 目录
  print_info "创建 commands 目录: $COMMANDS_DIR"
  mkdir -p "$COMMANDS_DIR"

  # 检查是否已存在
  if [ -f "$STRATEGY_COMMAND_DEST" ]; then
    print_warning "strategies.md 已存在，将覆盖"
    mv "$STRATEGY_COMMAND_DEST" "$STRATEGY_COMMAND_DEST.bak"
    print_success "已备份原文件: $STRATEGY_COMMAND_DEST.bak"
  fi

  # 复制文件
  print_info "安装 strategies.md..."
  cp "$STRATEGY_COMMAND_TEMPLATE" "$STRATEGY_COMMAND_DEST"
  print_success "strategies.md 已安装"

  # 完成
  print_header "安装完成 ✓"

  echo ""
  echo -e "${GREEN}Slash command 已成功安装！${NC}"
  echo ""
  echo "下一步："
  echo "  1. 在 OpenCode 中输入: /strategies list"
  echo ""
  echo "示例命令："
  echo "  /strategies list                         # 列出所有策略"
  echo "  /strategies switch strategy-2-balanced   # 切换策略"
  echo "  /strategies recommend \"日常开发\"        # 获取推荐"
  echo "  /strategies generate \"深度研究\"        # 动态生成策略"
  echo ""
  echo "路径说明："
  echo "  - 命令文档: ~/.config/opencode/commands/strategies.md"
  echo "  - Skill 路径: ~/.config/opencode/skills/StrategyManager"
  echo "  - 自动解析软链接，无需担心路径问题"
  echo ""
  echo "故障排查："
  echo "  如果遇到路径错误，请确保："
  echo "  1. StrategyManager 已正确安装到 skills 目录"
  echo "  2. 软链接指向有效的项目路径"
  echo "  3. 运行: ls -la ~/.config/opencode/skills/StrategyManager"
  echo ""
}

# 执行主函数
main "$@"
