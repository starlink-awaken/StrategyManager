# StrategyManager

<div align="center">

**智能策略管理系统 - AI 模型配置的生命周期管理**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Bun](https://img.shields.io/badge/Bun-1.0+-black?logo=bun&logoColor=white)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Version](https://img.shields.io/badge/version-3.0.0-green)](./CHANGELOG.md)
[![GitHub Stars](https://img.shields.io/github/stars/starlink-awaken/StrategyManager?style=social)](https://github.com/starlink-awaken/StrategyManager/stargazers)

</div>

---

## 📖 项目简介

StrategyManager 是一个功能强大的策略管理系统，专为管理 AI 模型配置而设计。它提供了完整的策略生命周期管理功能，包括模板管理、智能推荐、成本优化、历史追踪等核心特性。

### ✅ 基础原则（后续迭代约束）

- **唯一约束**：所有功能与配置的迭代，必须符合 oh-my-opencode 的功能与配置约束（以官方 schema 为准）。
- **禁止偏离**：任何新增字段、行为或校验，不得超出 oh-my-opencode schema 定义范围。
- **兼容优先**：在不破坏兼容性的前提下扩展能力，优先做对齐而非自定义。
- **一致性保证**：任何修改和改动，必须保证前后逻辑一致性，确保 `scripts/`、`docs/`、`templates/`、`Workflows/`、`Tools/` 等目录内容同步更新。

### ✨ 核心特性

- 🎯 **智能推荐系统** - 基于场景、预算、质量需求的多因素智能推荐，支持配额感知
- 📦 **模板管理** - 策略模板与用户配置分离，安全可靠
- 🔍 **策略比较** - 可视化对比两个策略的差异
- 💰 **成本优化** - GitHub Copilot 使用分析和优化建议
- 📋 **历史管理** - 完整的操作历史记录，支持一键回滚
- 🔄 **安全切换** - 自动备份，软链接机制，零风险切换
- ✅ **增强验证** - 多层次验证（错误/警告/信息），自动修复建议
- 📊 **使用同步** - 多平台 AI 服务使用情况同步和成本跟踪
- 🎭 **动态生成** - 基于场景和配额状态动态生成优化策略
- 📝 **反馈报告** - 推荐采纳率分析和时间趋势统计
- 📊 **友好界面** - 彩色终端输出，清晰的表格展示

### 🎯 策略概览

| 策略                       | 成本/月    | 适用场景             | 质量       |
| -------------------------- | ---------- | -------------------- | ---------- |
| **strategy-0-super**       | ¥2000-3000 | 关键项目、必须成功   | ⭐⭐⭐⭐⭐ |
| **strategy-1-performance** | ¥1000-1500 | 重要任务、生产环境   | ⭐⭐⭐⭐   |
| **strategy-2-balanced** ⭐ | ¥400-700   | 日常工作（默认推荐） | ⭐⭐⭐     |
| **strategy-3-economical**  | ¥50-150    | 成本敏感、学习探索   | ⭐⭐       |
| **strategy-5-research**    | ¥1800-2500 | 深度研究、金融分析   | ⭐⭐⭐⭐⭐ |
| **strategy-4-creative**    | ¥500-800   | 创意写作、新媒体运营 | ⭐⭐⭐⭐   |

### 📋 功能验证状态

**最新验证**: 2024-02-04 | **验证方式**: 代码审查 + 实际功能测试

| 项目     | 状态        | 说明                    |
| -------- | ----------- | ----------------------- |
| 代码质量 | ✅ 95.9%    | 47/49 测试通过          |
| API 集成 | ⚠️ 部分可用 | 4 个配置问题待修复      |
| 核心功能 | ✅ 完全可用 | 策略管理、成本计算 100% |
| 生产就绪 | 🟡 条件性   | 修复配置后 100% 就绪    |

**详细验证报告**: [docs/archive/phase1/VERIFICATION.md](docs/archive/phase1/VERIFICATION.md)

参考：https://github.com/code-yeongyu/oh-my-opencode/blob/dev/docs/configurations.md

---

## 🚀 快速开始

### 1. 安装

```bash
# 克隆仓库
git clone https://github.com/starlink-awaken/StrategyManager.git
cd StrategyManager

# 安装依赖
bun install

# 安装策略模板到用户配置目录
bash scripts/install.sh
```

### 2. 基本使用

#### 方式 1：在终端中使用

```bash
# 列出所有可用策略
bun run Tools/ManageStrategies.ts list

# 切换到指定策略
bun run Tools/ManageStrategies.ts switch strategy-2-balanced

# 获取推荐
bun run Tools/ManageStrategies.ts recommend "日常开发"

# 比较两个策略
bun run Tools/ManageStrategies.ts compare strategy-1-performance strategy-2-balanced

# 成本报告
bun run Tools/ManageStrategies.ts cost-report
```

#### 方式 2：在 Claude Code 中使用（推荐）

**第1步：配置 OpenCode 集成**

```bash
bash scripts/setup-opencode-integration.sh
```

**第2步：在 Claude Code 中使用**

- 自然语言触发：`@StrategyManager 推荐适合日常开发的策略`
- 命令触发（配置后）：`/strategies list`、`/strategies recommend "日常开发"`

详细指南：[📖 docs/guides/opencode-integration.md](docs/guides/opencode-integration.md)

---

## 🔗 OpenCode 集成

将 StrategyManager 配置为 oh-my-opencode 的 skill，在 Claude Code 中使用 `/strategies` 命令和工作流：

```bash
# 自动配置（推荐）
bash scripts/setup-opencode-integration.sh
```

配置后可用的命令和工作流请参考：[📚 完整使用指南](docs/guides/overview.md)

---

## 📚 文档目录

| 文档                                                     | 说明                            |
| -------------------------------------------------------- | ------------------------------- |
| [快速概览](docs/guides/overview.md)                      | 1分钟快速入门                   |
| **[OpenCode 集成](docs/guides/opencode-integration.md)** | **如何配置 `/strategies` 命令** |
| [配置指南](docs/guides/configuration.md)                 | 环境变量和配置                  |
| [API 参考](docs/guides/api-reference.md)                 | 编程接口                        |
| [工作流指南](Workflows/)                                 | 详细的操作工作流                |

---

## 高级用法

在 Claude Code 中的高级命令示例：

```bash
# 查看策略详细信息
/strategies list --json

# 导出策略
/strategies export my-strategy ./output.json

# 导入策略
/strategies import ./strategy.jsonc

# 验证策略
/strategies validate ./strategy.jsonc

# 查看历史记录
/strategies history

# 回滚到历史版本
/strategies rollback <timestamp>

# 成本分析（支持多个平台）
/strategies cost-report --start 2026-01-01 --end 2026-02-05

# 使用同步（从多个 AI 服务同步成本数据）
/strategies sync-usage


# 生成动态策略（含配额感知）
/strategies generate "日常开发" --priority balanced --with-usage-sync

# 列出策略（含动态）
/strategies list --include-dynamic

# 推荐反馈报告
/strategies feedback-report --json

# 推荐反馈报告（写入文件）
/strategies feedback-report --format text --output ./feedback-report.txt

# 推荐反馈报告（按周分桶）
/strategies feedback-report --bucket week --format json

# 生成动态策略
/strategies generate "日常开发" --priority balanced

# 生成动态策略（含配额感知）
/strategies generate "深度研究" --priority quality --with-usage-sync

# 列出策略（含动态）
/strategies list --include-dynamic

# 固化动态策略
/strategies save-dynamic strategy-generated-coding-202602051430 my-custom-strategy

# 同步使用数据
/strategies usage-sync

# 同步特定提供商
/strategies usage-sync --providers anthropic,openai

# 查看使用报告
/strategies usage-report

# 生成成本报告
/strategies cost-report

# 成本报告（指定时间范围）
/strategies cost-report --start 2026-02-01 --end 2026-02-05

# 成本报告（包含 Copilot 分析）
/strategies cost-report --copilot --format json
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

#### 成本分析

```bash
# 生成成本报告
/strategies cost-report

# 保存为文件
/strategies cost-report --output ./cost-report.txt
```

#### 使用数据同步

```bash
# 同步所有平台使用数据
/strategies sync-usage

# 保存为文件
/strategies sync-usage --output ./usage-data.txt
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
│   ├── CostReport.md   # 成本报告工作流
│   ├── Export.md       # 策略导出工作流
│   ├── FeedbackReport.md # 反馈报告工作流
│   ├── Fix.md          # 策略修复工作流
│   ├── Generate.md     # 动态生成工作流
│   ├── History.md      # 历史管理工作流
│   ├── Import.md       # 策略导入工作流
│   ├── List.md         # 策略列表工作流
│   ├── Recommend.md    # 策略推荐工作流
│   ├── Switch.md       # 策略切换工作流
│   ├── UsageSync.md    # 使用同步工作流
│   └── Validate.md     # 策略验证工作流
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

| 命令               | 工作流文件                |
| ------------------ | ------------------------- |
| `list`             | `Workflows/List.md`       |
| `switch`           | `Workflows/Switch.md`     |
| `fix`              | `Workflows/Fix.md`        |
| `validate`         | `Workflows/Validate.md`   |
| `compare`          | `Workflows/Compare.md`    |
| `history/rollback` | `Workflows/History.md`    |
| `recommend`        | `Workflows/Recommend.md`  |
| `export`           | `Workflows/Export.md`     |
| `import`           | `Workflows/Import.md`     |
| `cost-report`      | `Workflows/CostReport.md` |
| `sync-usage`       | `Workflows/UsageSync.md`  |

### 文件存储位置

- **策略文件**: `$STRATEGIES_DIR/<name>.jsonc`
- **历史存储**: `$CONFIG_DIR/strategy-history.json`
- **备份文件**: `$CONFIG_DIR/backups/<name>-<timestamp>.jsonc`

---

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源。

---

## 🔗 相关资源

- [文档导航](docs/README.md) - 完整文档索引
- [使用指南](docs/guides/USAGE_GUIDE.md) - 详细使用说明
- [配置指南](docs/guides/CONFIGURATION.md) - 配置说明
- [API 参考](docs/guides/API_REFERENCE.md) - API 文档
- [故障排除](docs/guides/TROUBLESHOOTING.md) - 常见问题解决
- [架构文档](docs/architecture/ARCHITECTURE.md) - 系统架构
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
