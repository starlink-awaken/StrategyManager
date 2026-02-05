#!/bin/bash

##############################################################################
# StrategyManager 命令路径测试脚本
#
# 功能：验证 /strategies 命令的路径解析是否正确
#
# 使用：bash scripts/test-command-path.sh
##############################################################################

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

print_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

##############################################################################
# 测试函数
##############################################################################

test_path_resolution() {
  print_header "测试路径解析"

  SKILL_PATH="${HOME}/.config/opencode/skills/StrategyManager"
  
  # 检查路径是否存在
  if [ ! -e "$SKILL_PATH" ]; then
    print_error "Skill 路径不存在: $SKILL_PATH"
    echo "请先运行: bash scripts/install.sh"
    return 1
  fi

  print_info "Skill 路径: $SKILL_PATH"

  # 检查是否是软链接
  if [ -L "$SKILL_PATH" ]; then
    print_info "检测到软链接"
    
    # 尝试解析软链接 (macOS/BSD)
    REAL_PATH="$(readlink "$SKILL_PATH" 2>/dev/null)"
    if [ -z "$REAL_PATH" ]; then
      # 尝试 Linux 风格
      REAL_PATH="$(readlink -f "$SKILL_PATH" 2>/dev/null)"
    fi
    
    if [ -n "$REAL_PATH" ]; then
      print_success "软链接目标: $REAL_PATH"
      SKILL_PATH="$REAL_PATH"
    else
      print_error "无法解析软链接"
      return 1
    fi
  else
    print_info "这是一个普通目录（非软链接）"
  fi

  # 验证目录结构
  print_header "验证目录结构"
  
  if [ -d "$SKILL_PATH/Tools" ]; then
    print_success "Tools/ 目录存在"
  else
    print_error "Tools/ 目录不存在"
    return 1
  fi

  if [ -f "$SKILL_PATH/Tools/ManageStrategies.ts" ]; then
    print_success "ManageStrategies.ts 存在"
  else
    print_error "ManageStrategies.ts 不存在"
    return 1
  fi

  if [ -d "$SKILL_PATH/Workflows" ]; then
    print_success "Workflows/ 目录存在"
  else
    print_error "Workflows/ 目录不存在"
    return 1
  fi

  # 测试 cd 命令
  print_header "测试目录切换"
  
  if cd "$SKILL_PATH" 2>/dev/null; then
    print_success "成功切换到: $(pwd)"
    
    # 测试执行命令
    if [ -x "$(command -v bun)" ]; then
      print_info "测试执行 ManageStrategies.ts..."
      if bun run Tools/ManageStrategies.ts --help >/dev/null 2>&1; then
        print_success "命令执行成功"
      else
        print_error "命令执行失败"
        return 1
      fi
    else
      print_info "Bun 未安装，跳过命令执行测试"
    fi
  else
    print_error "无法切换到目录: $SKILL_PATH"
    return 1
  fi

  return 0
}

test_command_file() {
  print_header "测试命令文件"

  COMMAND_FILE="${HOME}/.config/opencode/commands/strategies.md"
  
  if [ -f "$COMMAND_FILE" ]; then
    print_success "命令文件存在: $COMMAND_FILE"
    
    # 检查是否包含路径解析逻辑
    if grep -q "readlink" "$COMMAND_FILE"; then
      print_success "包含路径解析逻辑"
    else
      print_error "缺少路径解析逻辑"
      return 1
    fi
  else
    print_error "命令文件不存在: $COMMAND_FILE"
    echo "运行安装脚本: bash scripts/install-slash-command.sh"
    return 1
  fi

  return 0
}

##############################################################################
# 主函数
##############################################################################

main() {
  print_header "StrategyManager 路径解析测试"

  local failed=0

  test_path_resolution || failed=$((failed + 1))
  test_command_file || failed=$((failed + 1))

  print_header "测试结果"

  if [ $failed -eq 0 ]; then
    echo -e "${GREEN}✓ 所有测试通过！${NC}"
    echo ""
    echo "路径解析配置正确，/strategies 命令应该可以正常工作。"
    echo ""
    return 0
  else
    echo -e "${RED}✗ $failed 个测试失败${NC}"
    echo ""
    echo "请检查上述错误并修复后重试。"
    echo ""
    return 1
  fi
}

# 执行主函数
main "$@"
