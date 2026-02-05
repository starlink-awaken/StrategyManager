# 命令路径问题解决方案

## 问题描述

当 `command/strategies.md` 通过软链接安装到 `~/.config/opencode/commands/` 目录后，文档中的相对路径（如 `bun run Tools/ManageStrategies.ts`）会基于命令文档所在目录解析，而不是基于 StrategyManager skill 的实际路径。

**场景**：
- StrategyManager 项目软链接到 `~/.config/opencode/skills/StrategyManager`
- 命令文档软链接到 `~/.config/opencode/commands/strategies.md`
- 执行 `/strategies list` 时，路径无法正确解析

## 解决方案

### 1. 自动路径解析

在 `command/strategies.md` 中添加了路径解析逻辑：

```bash
# 解析 Skill 路径（支持软链接）
SKILL_PATH="${HOME}/.config/opencode/skills/StrategyManager"
if [ -L "$SKILL_PATH" ]; then
  # macOS/BSD 风格
  REAL_PATH="$(readlink "$SKILL_PATH" 2>/dev/null)"
  if [ -z "$REAL_PATH" ]; then
    # Linux 风格
    REAL_PATH="$(readlink -f "$SKILL_PATH" 2>/dev/null)"
  fi
  [ -n "$REAL_PATH" ] && SKILL_PATH="$REAL_PATH"
fi

# 切换到 skill 目录
cd "$SKILL_PATH" || exit 1
```

### 2. 跨平台兼容

- **macOS/BSD**: 使用 `readlink "$PATH"`
- **Linux**: 使用 `readlink -f "$PATH"`
- 自动降级处理，确保兼容性

### 3. 命令路由更新

所有命令示例都添加了路径切换前缀：

```bash
cd "${HOME}/.config/opencode/skills/StrategyManager" || \
  cd "$(readlink -f "${HOME}/.config/opencode/skills/StrategyManager")"
bun run Tools/ManageStrategies.ts list
```

## 验证测试

### 运行测试脚本

```bash
bash scripts/test-command-path.sh
```

测试脚本会验证：
1. ✅ Skill 路径是否存在
2. ✅ 软链接解析是否正确
3. ✅ 目录结构是否完整
4. ✅ 命令文件是否包含路径解析逻辑
5. ✅ 能否成功切换到正确的目录

### 手动验证

```bash
# 1. 检查 skill 软链接
ls -la ~/.config/opencode/skills/StrategyManager

# 2. 解析软链接目标
readlink ~/.config/opencode/skills/StrategyManager

# 3. 检查命令文件
cat ~/.config/opencode/commands/strategies.md | grep -A 5 "SKILL_PATH"

# 4. 测试路径切换
cd ~/.config/opencode/skills/StrategyManager && pwd
```

## 安装步骤

### 方式 1: 使用安装脚本（推荐）

```bash
# 1. 安装 skill（如果还没有）
bash scripts/install.sh

# 2. 安装 slash command
bash scripts/install-slash-command.sh

# 3. 验证安装
bash scripts/test-command-path.sh
```

### 方式 2: 手动安装

```bash
# 1. 创建 skill 软链接
ln -sf "$(pwd)" ~/.config/opencode/skills/StrategyManager

# 2. 创建命令软链接
mkdir -p ~/.config/opencode/commands
ln -sf "$(pwd)/command/strategies.md" ~/.config/opencode/commands/strategies.md

# 3. 验证
bash scripts/test-command-path.sh
```

## 使用示例

安装完成后，在 OpenCode 中使用：

```bash
# 列出所有策略
/strategies list

# 切换策略
/strategies switch strategy-2-balanced

# 智能推荐
/strategies recommend "日常开发"

# 动态生成
/strategies generate "深度研究" --priority quality
```

## 故障排查

### 问题 1: 路径无法解析

**症状**: 提示 "无法找到 StrategyManager skill 路径"

**解决方案**:
```bash
# 检查软链接是否有效
ls -la ~/.config/opencode/skills/StrategyManager

# 重新创建软链接
rm ~/.config/opencode/skills/StrategyManager
ln -sf "/path/to/StrategyManager" ~/.config/opencode/skills/StrategyManager
```

### 问题 2: readlink 命令不存在

**症状**: 在某些系统上 readlink 不可用

**解决方案**: 
- macOS: 已预装
- Linux: 通常已预装
- 如果缺失，使用绝对路径替代软链接

### 问题 3: 命令执行失败

**症状**: 命令找不到或执行失败

**解决方案**:
```bash
# 1. 验证 Bun 已安装
bun --version

# 2. 手动测试命令
cd ~/.config/opencode/skills/StrategyManager
bun run Tools/ManageStrategies.ts list

# 3. 检查文件权限
ls -la Tools/ManageStrategies.ts
```

## 技术细节

### 路径解析流程

1. **定位 Skill**: `~/.config/opencode/skills/StrategyManager`
2. **检测软链接**: 使用 `[ -L "$PATH" ]`
3. **解析目标**: 尝试 macOS 和 Linux 两种方式
4. **切换目录**: `cd "$REAL_PATH"`
5. **执行命令**: 相对路径基于 skill 根目录

### frontmatter 配置

```yaml
---
description: 命令描述
argument-hint: [子命令列表]
allowed-tools:
  - bash
  - read_file
  - grep_search
---
```

这些配置让 OpenCode 知道如何处理命令参数和允许的工具。

## 相关文件

- `command/strategies.md` - 命令文档（包含路径解析逻辑）
- `scripts/install-slash-command.sh` - 命令安装脚本
- `scripts/test-command-path.sh` - 路径测试脚本
- `docs/guides/opencode-integration.md` - 完整集成指南

## 更新日志

- **2026-02-05**: 添加自动路径解析支持
- **2026-02-05**: 添加跨平台兼容性
- **2026-02-05**: 创建测试脚本
