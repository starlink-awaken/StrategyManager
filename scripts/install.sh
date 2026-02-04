#!/bin/bash

# StrategyManager Installation Script
# 安装策略模板到用户配置目录

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TEMPLATE_DIR="$PROJECT_ROOT/templates"
TARGET_DIR="$HOME/.config/opencode/strategies"
BACKUP_DIR="$HOME/.config/opencode/backups"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  StrategyManager Installation Script  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# 检查模板目录是否存在
if [ ! -d "$TEMPLATE_DIR" ]; then
    echo -e "${RED}✗ Error: Templates directory not found at $TEMPLATE_DIR${NC}"
    exit 1
fi

# 检查是否有模板文件
TEMPLATE_COUNT=$(ls -1 "$TEMPLATE_DIR"/*.jsonc 2>/dev/null | wc -l)
if [ "$TEMPLATE_COUNT" -eq 0 ]; then
    echo -e "${RED}✗ Error: No template files found in $TEMPLATE_DIR${NC}"
    exit 1
fi

echo -e "${BLUE}📦 Found $TEMPLATE_COUNT strategy templates${NC}"
echo ""

# 创建目标目录
echo -e "${YELLOW}📂 Creating directories...${NC}"
mkdir -p "$TARGET_DIR"
mkdir -p "$BACKUP_DIR"
echo -e "${GREEN}✓ Directories created${NC}"
echo ""

# 询问是否覆盖已存在的文件
OVERWRITE="ask"
if [ "$1" == "--force" ] || [ "$1" == "-f" ]; then
    OVERWRITE="yes"
    echo -e "${YELLOW}⚠ Force mode: Will overwrite existing files${NC}"
    echo ""
fi

# 复制策略模板
echo -e "${YELLOW}📋 Installing strategy templates...${NC}"
INSTALLED_COUNT=0
SKIPPED_COUNT=0
OVERWRITTEN_COUNT=0

for template in "$TEMPLATE_DIR"/*.jsonc; do
    filename=$(basename "$template")
    target_file="$TARGET_DIR/$filename"
    
    if [ -f "$target_file" ]; then
        if [ "$OVERWRITE" == "yes" ]; then
            # 创建备份
            backup_file="$BACKUP_DIR/${filename%.jsonc}-$(date +%Y%m%d-%H%M%S).jsonc"
            cp "$target_file" "$backup_file"
            echo -e "  ${YELLOW}⚠ Backing up existing: $filename → $(basename "$backup_file")${NC}"
            
            # 覆盖文件
            cp "$template" "$target_file"
            echo -e "  ${GREEN}✓ Overwritten: $filename${NC}"
            OVERWRITTEN_COUNT=$((OVERWRITTEN_COUNT + 1))
        elif [ "$OVERWRITE" == "ask" ]; then
            echo -e "  ${YELLOW}⚠ File exists: $filename${NC}"
            read -p "    Overwrite? [y/N] " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                backup_file="$BACKUP_DIR/${filename%.jsonc}-$(date +%Y%m%d-%H%M%S).jsonc"
                cp "$target_file" "$backup_file"
                cp "$template" "$target_file"
                echo -e "  ${GREEN}✓ Overwritten: $filename (backup: $(basename "$backup_file"))${NC}"
                OVERWRITTEN_COUNT=$((OVERWRITTEN_COUNT + 1))
            else
                echo -e "  ${BLUE}○ Skipped: $filename${NC}"
                SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
            fi
        else
            echo -e "  ${BLUE}○ Skipped (exists): $filename${NC}"
            SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
        fi
    else
        cp "$template" "$target_file"
        echo -e "  ${GREEN}✓ Installed: $filename${NC}"
        INSTALLED_COUNT=$((INSTALLED_COUNT + 1))
    fi
done

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     Installation Complete! ✓          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""

# 显示统计
echo -e "${BLUE}📊 Installation Summary:${NC}"
echo -e "  ${GREEN}✓ New installations: $INSTALLED_COUNT${NC}"
if [ $OVERWRITTEN_COUNT -gt 0 ]; then
    echo -e "  ${YELLOW}⚠ Overwritten: $OVERWRITTEN_COUNT${NC}"
fi
if [ $SKIPPED_COUNT -gt 0 ]; then
    echo -e "  ${BLUE}○ Skipped: $SKIPPED_COUNT${NC}"
fi
echo ""

# 显示安装位置
echo -e "${BLUE}📍 Templates installed to:${NC}"
echo -e "   $TARGET_DIR"
echo ""

# 显示备份位置（如果有备份）
if [ $OVERWRITTEN_COUNT -gt 0 ]; then
    echo -e "${BLUE}💾 Backups saved to:${NC}"
    echo -e "   $BACKUP_DIR"
    echo ""
fi

# 下一步提示
echo -e "${BLUE}📖 Next Steps:${NC}"
echo -e "  1. List strategies:"
echo -e "     ${YELLOW}bun run Tools/ManageStrategies.ts list${NC}"
echo ""
echo -e "  2. Switch to a strategy:"
echo -e "     ${YELLOW}bun run Tools/ManageStrategies.ts switch <strategy-name>${NC}"
echo ""
echo -e "  3. Get recommendations:"
echo -e "     ${YELLOW}bun run Tools/ManageStrategies.ts recommend \"your task description\"${NC}"
echo ""

# 检查是否需要创建符号链接
if [ ! -f "$HOME/.config/opencode/oh-my-opencode.json" ] && [ ! -L "$HOME/.config/opencode/oh-my-opencode.json" ]; then
    echo -e "${YELLOW}💡 Tip: No active strategy detected. You may want to activate one:${NC}"
    echo -e "     ${YELLOW}bun run Tools/ManageStrategies.ts switch strategy-2-balanced${NC}"
    echo ""
fi

echo -e "${GREEN}✨ Happy strategizing!${NC}"
