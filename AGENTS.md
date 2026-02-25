# StrategyManager AI Agent Guidelines

## 概述
AI 策略配置生命周期管理工具 - OpenCode Skill，支持 Claude、Copilot、Gemini、minimax、方舟等多平台配置管理。核心特性：智能推荐、策略比较、成本分析、历史回滚、使用同步。

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
- `bun test:pathmanager / :validator / :recommender`: 针对特定模块运行测试
- `scripts/auto-govern.sh`: 自动化治理 Cron 脚本 (Phase 3)


## 代码风格指南

### 命名规范 (Naming)
- **文件与类**: PascalCase (如 `PathManager.ts`, `class PathManager`)
- **函数与方法**: camelCase (如 `getConfigDir()`)
- **变量**: camelCase (如 `strategiesDir`)
- **常量**: UPPER_SNAKE_CASE (如 `BACKUP_LIMIT`)
- **接口与类型**: PascalCase (如 `interface StrategyConfig`)

### 导入规则 (Imports)
必须遵循以下顺序：
1. **Node 内置模块**: `import * as fs from "fs"`
2. **项目相对导入**: `import { PathManager } from "./PathManager"`
3. **类型导入**: `import type { StrategyConfig } from "./interfaces"`
4. **第三方库**: `import { Command } from "commander"`

### 格式化与类型 (Formatting & Types)
- **缩进**: 2 空格（由 .editorconfig 强制）
- **类型**: 优先使用 `interface`；所有函数参数和返回值必须有明确类型定义。
- **禁止**: **严禁使用 `as any` 或 `@ts-ignore`**。如遇类型不匹配，应通过正确的类型转换或接口修正解决。
- **行尾**: LF，文件结尾必须有空行。

### 错误处理 (Error Handling)
- 文件系统操作必须包裹在 `try/catch` 中。
- 错误信息应清晰且包含上下文（如文件名、操作类型）。
- 使用 `chalk` 输出彩色信息：
  - `success`: 绿色 (Green)
  - `error`: 红色 (Red)
  - `warning`: 黄色 (Yellow)
  - `info`: 蓝色 (Blue)

## 项目结构
- `Tools/`: 核心逻辑模块（ManageStrategies, Recommender, Validator 等）
- `Tools/UsageSync/`: 独立的使用情况同步子模块
- `Workflows/`: OpenCode 工作流 Markdown 定义
- `tests/unit/`: 单元测试，Mock 数据位于 `tests/fixtures/mock-data.ts`
- `templates/`: 官方策略模板 (.jsonc)

## 质量指标 (Coverage Targets)
- PathManager: 90%+
- Validator: 85%+
- Recommender: 80%+
- ManageStrategies: 75%+
- UsageSync: 70%+

## 特殊注意事项
1. **Schema 兼容性**: 修改策略生成逻辑时，必须参考 `Tools/Validator.ts` 确保符合官方 Schema。
2. **大文件处理**: `ManageStrategies.ts` 超过 2800 行，修改时优先考虑职责分离而非继续堆砌代码。
3. **CLI 交互**: 所有的输出都应通过 `FormatUtils` 或 `colorize` 进行美化，确保 CLI 用户体验一致。
4. **工作流入口**: 所有的自然语言交互都由 `SKILL.md` 路由到 `Workflows/` 下的对应脚本。
