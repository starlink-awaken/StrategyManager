#!/bin/bash

##############################################################################
# StrategyManager OpenCode 集成配置脚本
#
# 功能：自动配置 oh-my-opencode，使 /strategies 命令生效
# 
# 使用：bash scripts/setup-opencode-integration.sh
#
# 脚本会：
# 1. 验证 StrategyManager 已安装到 ~/.config/opencode/skills/
# 2. 创建或更新 ~/.config/opencode/oh-my-opencode.json
# 3. 配置 StrategyManager 的工作流路由和命令处理
#
##############################################################################

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 获取脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# 配置目录
OPENCODE_CONFIG_DIR="$HOME/.config/opencode"
SKILLS_DIR="$OPENCODE_CONFIG_DIR/skills"
CONFIG_FILE="$OPENCODE_CONFIG_DIR/oh-my-opencode.jsonc"
STRATEGY_MANAGER_SKILL="$SKILLS_DIR/StrategyManager"

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
# 验证函数
##############################################################################

check_opencode_installed() {
  print_info "检查 oh-my-opencode 是否已安装..."
  
  if ! command -v opencode &> /dev/null; then
    print_error "未找到 opencode 命令"
    echo "请先安装 oh-my-opencode："
    echo "  bunx oh-my-opencode install"
    exit 1
  fi
  
  print_success "oh-my-opencode 已安装"
}

check_strategy_manager_installed() {
  print_info "检查 StrategyManager 是否已安装到 $SKILLS_DIR..."
  
  if [ ! -d "$STRATEGY_MANAGER_SKILL" ]; then
    print_error "StrategyManager 未安装到 $SKILLS_DIR"
    echo ""
    echo "请先运行以下命令安装 StrategyManager："
    echo "  bash $PROJECT_ROOT/scripts/install.sh"
    exit 1
  fi
  
  if [ ! -f "$STRATEGY_MANAGER_SKILL/SKILL.md" ]; then
    print_error "StrategyManager SKILL.md 不存在"
    exit 1
  fi
  
  print_success "StrategyManager 已安装 ($STRATEGY_MANAGER_SKILL)"
}

##############################################################################
# 配置函数
##############################################################################

create_opencode_config_dir() {
  print_info "检查 opencode 配置目录..."
  
  if [ ! -d "$OPENCODE_CONFIG_DIR" ]; then
    print_info "创建配置目录: $OPENCODE_CONFIG_DIR"
    mkdir -p "$OPENCODE_CONFIG_DIR"
  fi
  
  if [ ! -d "$SKILLS_DIR" ]; then
    print_info "创建 skills 目录: $SKILLS_DIR"
    mkdir -p "$SKILLS_DIR"
  fi
  
  print_success "配置目录已准备"
}

check_symlink() {
  print_info "检查 StrategyManager symlink..."
  
  if [ ! -L "$STRATEGY_MANAGER_SKILL" ]; then
    print_warning "StrategyManager 不是 symlink，创建 symlink..."
    rm -rf "$STRATEGY_MANAGER_SKILL"
    ln -sfn "$PROJECT_ROOT" "$STRATEGY_MANAGER_SKILL"
    print_success "Symlink 已创建"
  else
    print_success "Symlink 已存在"
  fi
}

update_oh_my_opencode_config() {
  print_info "更新 oh-my-opencode 配置..."
  
  # 如果配置文件不存在，创建基础配置
  if [ ! -f "$CONFIG_FILE" ]; then
    print_info "创建新的配置文件: $CONFIG_FILE"
    cat > "$CONFIG_FILE" << 'EOF'
{
  "$schema": "https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/master/assets/oh-my-opencode.schema.json",

  "skills": {
    "sources": [
      { "path": "~/.config/opencode/skills", "recursive": true }
    ],
    "enable": ["StrategyManager"],
    
    "StrategyManager": {
      "description": "管理和操作 AI 模型策略集：列表、切换、对比、推荐、成本分析、历史管理、导入导出、动态生成、使用同步。",
      "template": "你是 StrategyManager 策略管理专家。用户请求了一个策略相关的操作。\n\n根据用户的请求类型，调用相应的工作流：\n- 用户想要列表/查看 → Workflows/List.md\n- 用户想要切换策略 → Workflows/Switch.md\n- 用户想要对比两个策略 → Workflows/Compare.md\n- 用户想要获取推荐 → Workflows/Recommend.md\n- 用户想要生成动态策略 → Workflows/Generate.md\n- 用户想要导入策略 → Workflows/Import.md\n- 用户想要导出策略 → Workflows/Export.md\n- 用户想要查看历史或回滚 → Workflows/History.md\n- 用户想要验证策略 → Workflows/Validate.md\n- 用户想要修复问题 → Workflows/Fix.md\n- 用户想要查看成本报告 → Workflows/CostReport.md\n- 用户想要同步使用数据 → Workflows/UsageSync.md\n- 用户想要反馈报告 → Workflows/FeedbackReport.md",
      "allowed-tools": ["bash", "read", "edit", "grep", "lsp_diagnostics"]
    }
  }
}
EOF
    print_success "配置文件已创建"
  else
    print_info "配置文件已存在，检查是否需要更新..."
    
    # 检查是否已包含 StrategyManager 配置
    if grep -q '"StrategyManager"' "$CONFIG_FILE"; then
      print_success "StrategyManager 配置已存在"
    else
      print_warning "StrategyManager 配置缺失，请手动添加或重新运行此脚本"
      print_info "可以复制 templates/oh-my-opencode-config.jsonc 中的配置"
    fi
  fi
}

verify_json_syntax() {
  print_info "验证 JSON 语法..."
  
  if command -v jq &> /dev/null; then
    if jq . "$CONFIG_FILE" > /dev/null 2>&1; then
      print_success "JSON 语法有效"
    else
      print_error "JSON 语法错误，请检查 $CONFIG_FILE"
      echo "使用 jq 验证："
      echo "  jq . $CONFIG_FILE"
      exit 1
    fi
  else
    print_warning "jq 未安装，跳过 JSON 验证"
  fi
}

##############################################################################
# 测试函数
##############################################################################

test_opencode_integration() {
  print_header "测试 OpenCode 集成"
  
  print_info "运行 opencode doctor..."
  if opencode doctor 2>&1 | head -20; then
    print_success "opencode doctor 执行成功"
  fi
  
  print_info ""
  print_info "检查 StrategyManager skill 是否加载..."
  
  # 尝试列出 skills（如果 opencode 支持该命令）
  if opencode --help 2>&1 | grep -q "skills"; then
    print_info "运行: opencode skills list"
    opencode skills list 2>&1 | grep -i strategy || print_warning "未找到 StrategyManager 的直接输出"
  fi
}

##############################################################################
# 主函数
##############################################################################

main() {
  print_header "StrategyManager OpenCode 集成配置"
  
  # 第1步：验证前置条件
  echo ""
  print_info "第 1/5 步：验证前置条件"
  check_opencode_installed
  check_strategy_manager_installed
  
  # 第2步：创建配置目录
  echo ""
  print_info "第 2/5 步：创建配置目录"
  create_opencode_config_dir
  check_symlink
  
  # 第3步：更新配置
  echo ""
  print_info "第 3/5 步：更新 OpenCode 配置"
  update_oh_my_opencode_config
  
  # 第4步：验证语法
  echo ""
  print_info "第 4/5 步：验证配置"
  verify_json_syntax
  
  # 第5步：测试集成
  echo ""
  print_info "第 5/5 步：测试集成"
  test_opencode_integration
  
  # 完成
  print_header "配置完成 ✓"
  
  echo ""
  echo -e "${GREEN}StrategyManager 已成功配置！${NC}"
  echo ""
  echo "下一步："
  echo "  1. 重启 OpenCode：opencode --version"
  echo "  2. 在 Claude Code 中使用 StrategyManager："
  echo "     @StrategyManager 推荐适合日常开发的策略"
  echo ""
  echo "或直接在项目中运行工具："
  echo "  bun run Tools/ManageStrategies.ts list"
  echo "  bun run Tools/ManageStrategies.ts recommend \"日常开发\""
  echo ""
  echo "配置文件位置："
  echo "  $CONFIG_FILE"
  echo ""
  echo "配置模板："
  echo "  $PROJECT_ROOT/templates/oh-my-opencode-config.jsonc"
  echo ""
  echo "文档："
  echo "  $PROJECT_ROOT/docs/guides/opencode-integration.md"
  echo ""
}

# 执行主函数
main "$@"
