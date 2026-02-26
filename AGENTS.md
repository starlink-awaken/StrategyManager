# StrategyManager AI Agent Guidelines

## 概述
AI 策略配置生命周期管理工具 - OpenCode Skill，支持 Claude、Copilot、Gemini、minimax、方舟等多平台配置管理。本项目核心特性包括智能推荐、策略比较、成本分析、历史回滚、使用同步。

**技术栈**: TypeScript 5.9+, Bun 1.0+
**核心原则**: 严格遵守 oh-my-opencode Schema，禁止自定义字段。

## 常用命令

### 开发与质量保证
- `bun install`: 安装依赖
- `bun type-check`: 运行 TypeScript 类型检查（提交前必须运行）
- `bun run dev:watch`: 热重载开发模式
- `bun run Tools/ManageStrategies.ts <command>`: 直接运行 CLI 命令

### 测试执行
- `bun test`: 运行所有测试
- `bun test tests/unit/<file>.test.ts`: **运行单个测试文件（推荐）**
- `bun test:unit`: 运行所有单元测试
- `bun test:coverage`: 生成测试覆盖率报告
- `bun test:pathmanager`: 针对 PathManager 运行测试
- `bun test:validator`: 针对 Validator 运行测试
- `bun test:recommender`: 针对 Recommender 运行测试
- `scripts/auto-govern.sh`: 自动化治理 Cron 脚本 (Phase 3)

## 代码风格指南

### 命名规范 (Naming)
- **文件与类**: PascalCase (如 `PathManager.ts`, `class PathManager`)
- **函数与方法**: camelCase (如 `getConfigDir()`)
- **变量**: camelCase (如 `strategiesDir`)
- **常量**: UPPER_SNAKE_CASE (如 `BACKUP_LIMIT`)
- **接口与类型**: PascalCase (如 `interface StrategyConfig`)

### 导入规则 (Imports)
必须遵循以下顺序，组之间空一行：
1. **Node 内置模块**: `import * as fs from "fs"`
2. **项目相对导入**: `import { PathManager } from "./PathManager"`
3. **类型导入**: `import type { StrategyConfig } from "./interfaces"`
4. **第三方库**: `import { Command } from "commander"`

### 格式化与类型 (Formatting & Types)
- **缩进**: 2 空格（由 .editorconfig 强制）
- **类型**: 优先使用 `interface`；所有函数参数和返回值必须有明确类型定义。
- **禁止**: **严禁使用 `as any` 或 `@ts-ignore`**。
- **行尾**: LF，文件结尾必须有空行。
- **TypeScript 配置**: 继承自 `tsconfig.json`，在 `Tools/` 目录下有独立的配置。

### 错误处理 (Error Handling)
- **文件操作**: 必须包裹在 `try/catch` 中，防止程序因权限或路径问题崩溃。
- **信息反馈**: 使用 `chalk` 输出彩色信息，确保 CLI 用户体验一致。
  - `success`: 绿色 (Green) - 确认操作、成功完成
  - `error`: 红色 (Red) - 致命错误、操作失败
  - `warning`: 黄色 (Yellow) - 潜在风险、建议注意
  - `info`: 蓝色 (Blue) - 普通进度、详细说明

## 项目结构
- `Tools/`: 核心逻辑模块
  - `ManageStrategies.ts`: CLI 入口及核心控制流
  - `PathManager.ts`: 统一路径管理（User/Project/Custom 模式）
  - `Validator.ts`: 符合官方 Schema 的严格校验
  - `Recommender.ts`: 基于成本与质量的智能推荐算法
- `Tools/UsageSync/`: 独立的使用情况同步子模块，处理多平台 API 成本同步。
- `Workflows/`: OpenCode 工作流 Markdown 定义，由 `SKILL.md` 路由。
- `tests/unit/`: 单元测试，Mock 数据位于 `tests/fixtures/mock-data.ts`。
- `templates/`: 官方策略模板 (.jsonc)，由 `scripts/install.sh` 安装到系统。

## 质量指标 (Coverage Targets)
项目追求高质量代码，提交 PR 前应确覆盖率达到以下标准：
- PathManager: 90%+
- Validator: 85%+
- Recommender: 80%+
- ManageStrategies: 75%+
- UsageSync: 70%+

## AI Agent 操作协议

### 1. 策略修改
在修改策略生成逻辑（Generate/Recommender）时，必须同时运行 `bun test:validator` 确保生成的配置符合官方 Schema。

### 2. 大文件策略
`ManageStrategies.ts` 超过 2800 行。**严禁直接全量重写**。AI Agent 应优先使用 `Edit` 工具进行局部修改，或考虑将新功能解耦到 `Tools/` 下的新模块中。

### 3. CLI 输出
所有的 CLI 输出都应通过 `FormatUtils` 或 `colorize` 进行美化。避免使用原生的 `console.log`。

### 4. 工作流路由
所有的自然语言交互逻辑由 `SKILL.md` 定义，通过 `Workflows/` 目录下的 Markdown 进行流程编排。修改业务逻辑时，需检查相应的工作流文档是否需要同步更新。

### 5. 环境感知
项目支持 `User`、`Project` 和 `Custom` 三种策略存储模式。在进行文件操作前，务必调用 `PathManager` 获取正确的绝对路径。

## 领域规则 (Domain Rules)
- **唯一约束**：所有功能必须符合 oh-my-opencode 官方 schema。
- **安全第一**：切换策略前自动执行备份，备份文件存储于 `$CONFIG_DIR/backups/`。
- **成本透明**：成本计算逻辑需参考最新模型价格（详见 `docs/model-selection-guide-2026.md`）。
