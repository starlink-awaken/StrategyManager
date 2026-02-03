# StrategyManager

<div align="center">

**智能策略管理系统 - 管理和执行各种 AI 策略**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Bun](https://img.shields.io/badge/Bun-1.0+-black?logo=bun&logoColor=white)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![GitHub Stars](https://img.shields.io/github/stars/starlink-awaken/StrategyManager?style=social)](https://github.com/starlink-awaken/StrategyManager/stargazers)
[![GitHub Issues](https://img.shields.io/github/issues/starlink-awaken/StrategyManager)](https://github.com/starlink-awaken/StrategyManager/issues)

</div>

---

## 📖 项目简介

StrategyManager 是一个功能强大的策略管理系统，专为管理和执行各种 AI 策略而设计。它提供了完整的策略生命周期管理功能，包括策略比较、导入/导出、版本控制、历史记录追踪和智能推荐等核心特性。

### ✨ 核心特性

- 🔍 **策略比较** - 可视化对比两个策略的差异，支持字段级别的变更追踪
- 📥 **导入/导出** - 支持从文件导入策略或将策略导出为 JSON/JSONC 格式
- 📜 **历史管理** - 完整的操作历史记录，支持时间点回滚
- 🔄 **策略切换** - 安全地在不同策略之间切换，自动创建备份
- ✅ **策略验证** - 验证策略配置的完整性和架构符合性
- 🔧 **自动修复** - 智能检测并修复策略中的常见问题
- 💡 **智能推荐** - 基于上下文和场景推荐最合适的策略
- 📊 **彩色终端输出** - 直观的可视化输出，支持 ANSI 颜色编码

---

## 🚀 快速开始

### 安装

```bash
# 克隆仓库
git clone https://github.com/starlink-awaken/StrategyManager.git

# 进入项目目录
cd StrategyManager

# 安装依赖（如果需要）
npm install  # 或 bun install
```

### 基本使用

```bash
# 列出所有可用策略
/strategies list

# 查看策略详细信息
/strategies list --json

# 切换到指定策略
/strategies switch blue-ocean

# 比较两个策略
/strategies compare blue-ocean green-field

# 导出策略
/strategies export my-strategy ./output.json

# 导入策略
/strategies import ./strategy.jsonc --validate

# 验证策略
/strategies validate my-strategy --strict

# 查看历史记录
/strategies history 50

# 回滚到历史版本
/strategies rollback 2024-02-01T12:00:00Z

# 获取策略推荐
/strategies recommend --context "生产环境高并发场景"
```

---

## 📚 详细使用指南

### 策略管理命令

#### 列出策略

```bash
# 基础列表（表格格式）
/strategies list

# 过滤特定策略
/strategies list --filter "env:prod"

# JSON 格式输出
/strategies list --json
```

#### 策略切换

```bash
# 交互式切换（推荐）
/strategies switch blue-ocean
# 会显示差异预览并要求确认

# 非交互式切换
/strategies switch blue-ocean -y
```

#### 策略比较

```bash
# 完整比较
/strategies compare strategy-a strategy-b

# 仅比较关键字段
/strategies compare strategy-a strategy-b --keys-only
```

#### 导入和导出

```bash
# 导出策略
/strategies export my-strategy ./my-strategy.json

# 导入策略（默认验证）
/strategies import ./new-strategy.jsonc

# 导入策略（跳过验证）
/strategies import ./new-strategy.jsonc --no-validate

# 强制覆盖导入
/strategies import ./new-strategy.jsonc -y
```

#### 策略验证

```bash
# 标准验证
/strategies validate my-strategy

# 严格验证（包含兼容性检查）
/strategies validate my-strategy --strict
```

#### 历史管理

```bash
# 查看最近 50 条历史
/strategies history

# 查看指定数量的历史
/strategies history 100

# 回滚到特定时间点
/strategies rollback 2024-02-01T12:00:00Z
```

#### 策略修复

```bash
# 查看建议的修复（不实际修改）
/strategies fix --dry-run

# 执行自动修复
/strategies fix -y
```

---

## 🏗️ 项目结构

```
StrategyManager/
├── Workflows/           # 工作流定义
│   ├── Compare.md      # 策略比较工作流
│   ├── Export.md       # 策略导出工作流
│   ├── Import.md       # 策略导入工作流
│   ├── List.md         # 策略列表工作流
│   ├── Recommend.md    # 策略推荐工作流
│   ├── Switch.md       # 策略切换工作流
│   ├── Fix.md          # 策略修复工作流
│   ├── Validate.md     # 策略验证工作流
│   └── History.md      # 历史管理工作流
├── Tools/              # 工具和脚本
│   ├── ManageStrategies.ts
│   └── tsconfig.json
├── SKILL.md            # Skill 配置文件
├── strategies.md       # 策略命令文档
├── QuickStart.md       # 快速开始指南
├── strategy-history.example.json  # 历史记录示例
├── README.md           # 项目说明文档
├── LICENSE             # 许可证
├── CONTRIBUTING.md     # 贡献指南
└── .gitignore          # Git 忽略规则
```

---

## 🎨 颜色输出约定

策略管理器使用颜色编码来增强可读性：

- 🟢 **绿色** (`success`) - 成功消息和确认的操作
- 🔴 **红色** (`error`) - 错误和失败信息
- 🟡 **黄色** (`warn`) - 警告、潜在风险或注意事项
- 🔵 **蓝色** (`info`) - 普通信息输出和步骤说明

在策略比较中：
- `+` 绿色 = 新增字段
- `-` 红色 = 删除字段
- `~` 黄色 = 修改的字段

---

## 🤝 贡献指南

我们欢迎所有形式的贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解如何：

- 报告问题和 Bug
- 提出新功能建议
- 提交代码 Pull Request
- 遵循代码规范

---

## 📝 开发说明

### 工作流集成

所有命令都会调用对应的 StrategyManager skill 工作流：

| 命令 | 工作流文件 |
|------|-----------|
| `list` | `Workflows/List.md` |
| `switch` | `Workflows/Switch.md` |
| `fix` | `Workflows/Fix.md` |
| `validate` | `Workflows/Validate.md` |
| `compare` | `Workflows/Compare.md` |
| `history/rollback` | `Workflows/History.md` |
| `recommend` | `Workflows/Recommend.md` |
| `export` | `Workflows/Export.md` |
| `import` | `Workflows/Import.md` |

### 文件存储位置

- **策略文件**: `$STRATEGIES_DIR/<name>.jsonc`
- **历史存储**: `$CONFIG_DIR/strategy-history.json`
- **备份文件**: `$CONFIG_DIR/backups/<name>-<timestamp>.jsonc`

---

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源。

---

## 🔗 相关资源

- [快速开始指南](QuickStart.md)
- [策略命令文档](strategies.md)
- [问题反馈](https://github.com/starlink-awaken/StrategyManager/issues)
- [功能建议](https://github.com/starlink-awaken/StrategyManager/issues)

---

## 👥 作者

**starlink-awaken** - [GitHub](https://github.com/starlink-awaken)

---

<div align="center">

**如果这个项目对你有帮助，请给个 ⭐ Star 支持一下！**

Made with ❤️ by StrategyManager Team

</div>
