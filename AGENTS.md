# StrategyManager 知识库

#KV|**生成时间**: 2026-02-25 15:07:00
#PY|**Git 提交**: a3ad1b5
**分支**: main

## 概述

AI 策略配置生命周期管理工具 - OpenCode Skill，支持 Claude、Copilot、Gemini、minimax、方舟等多平台配置管理。核心特性：智能推荐、策略比较、成本分析、历史回滚、使用同步。

#KV|**技术栈**: TypeScript 5.9+ + Bun 1.0+ (13,529 行代码，141 个文件，27 个 TS 源文件)

## 常用命令

### 开发
```bash
bun install                    # 安装依赖
bun type-check                 # TypeScript 类型检查
bun run dev:watch              # 热重载开发
bun run Tools/ManageStrategies.ts <command>  # 运行 CLI 命令
```

### 测试
```bash
bun test                       # 所有测试
bun test:watch                 # 监听模式
bun test:coverage             # 覆盖率报告
bun test tests/unit/           # 单元测试套件
bun test tests/unit/PathManager.test.ts  # 单个测试文件（推荐）
bun test:ci                   # CI 模式（Junit 报告）
```

### 脚本
```bash
bash scripts/install.sh        # 安装策略模板
bash scripts/setup-opencode-integration.sh  # 配置 OpenCode 集成
```

## 代码风格指南

### 格式（强制）
- **缩进**: 2 空格（.editorconfig）
- **行尾**: LF
- **文件结尾**: 插入空行（insert_final_newline）
- **尾部空格**: JS/TS 去除，MD 保留（trim_trailing_whitespace）
- **JSON 缩进**: 2 空格

### 导入顺序（严格执行）
1. **Node 内置模块**: `import * as fs from "fs"`, `import * as path from "path"`
2. **项目相对导入**: `import { PathManager } from "./PathManager"`
3. **类型导入**: `import type { StrategyConfig } from "./ManageStrategies"`
4. **第三方库**: `import { Command } from "commander"`

### 命名约定
- **文件**: PascalCase (`ManageStrategies.ts`, `Recommender.ts`)
- **类**: PascalCase (`class PathManager`)
- **函数/方法**: camelCase (`getConfigDir()`, `validateSchema()`)
- **常量**: UPPER_SNAKE_CASE (`const TEST_TEMP_DIR`)
- **接口**: PascalCase (`interface StrategyConfig`)
- **类型**: PascalCase (`type PathMode = "user" | "project"`)

### TypeScript 类型
- 优先使用 `interface` 定义对象结构
- 使用 `type` 定义联合类型和字面量类型
- 导出类型：`export interface`, `export type`, `export class`
- 所有函数参数和返回值都有类型注解

### 错误处理
- 使用 `try/catch` 包装文件系统操作
- 错误信息清晰且可操作（包含上下文）
- 使用 `chalk` 输出彩色错误：`console.error(chalk.red(message))`
- 不使用 `as any` 或 `@ts-ignore`（硬性约束）

### 文档注释
- JSDoc 风格（`/** ... */`）
- 类必须有描述：`/** 策略管理器 */`
- 公开方法必须有参数和返回值说明
- 复杂逻辑添加行内注释（`// 说明`）

## 测试约定

### 测试文件结构
```typescript
import { describe, it, expect, beforeEach, afterEach } from "bun:test";

describe("模块名 - 功能分组", () => {
  beforeEach(() => { /* setup */ });
  afterEach(() => { /* cleanup */ });

  it("应该做什么", () => {
    expect(result).toBe(expected);
  });
});
```

### Mock 数据管理
- Mock 数据统一放在 `tests/fixtures/mock-data.ts`
- 导出常量：`export const mockStrategyConfig: StrategyConfig`
- 使用 `fs.rmSync(dir, { recursive: true })` 清理临时文件

### 测试覆盖率目标
- PathManager: 90%+
- Validator: 85%+
- Recommender: 80%+
- ManageStrategies: 75%+
- UsageSync: 70%+
#BY|
#YR|### 约束与反模式
#MS|
#VN|- **硬性约束**: 禁止使用 `as any` 和 `@ts-ignore`（代码库中存在 24 处违规，需逐步修复）
#ZM|- **Schema 合规**: 必须严格符合 oh-my-opencode 官方 schema，禁止自定义字段
#JK|- **模板规范**: 模型名称必须带 provider 前缀（如 `anthropic/claude-sonnet-4-5`），禁止硬编码 API Key
#SP|- **配置完整性**: `lsp` 字段必须配置 `budget` 和 `provider_quotas`
#PZ|
#XQ|## 关键注意事项
#ZB|
#PK|- **ManageStrategies.ts**: 单文件 2882 行，修改前评估拆分必要性（当前技术债务）
#VV|- **UsageSync/**: 独立子模块（2411 行），有独立 `index.ts` 和 `interfaces.ts`
#MN|- **工作流**: Markdown 格式，通过 `SKILL.md` 路由加载
#VB|- **颜色输出**: `chalk` 库，green=success, red=error, yellow=warn, blue=info
#JH|- **类型检查**: 提交前必须运行 `bun type-check`，无错误才能合并
#TW|- **Recommender.v2**: 存在（`tests/unit/Recommender.v2.test.ts`），重构进行中
#XZ|- **模块边界**: Tools/UsageSync/ 是完整模块（有 index.ts），Tools/ 包含多个独立模块
#HV|- **测试覆盖**: 目标 - PathManager 90%+, Validator 85%+, Recommender 80%+, ManageStrategies 75%+, UsageSync 70%+
#BY|
#YR|### 已知问题
#MS|
#VN|- **技术债务**: 代码库中存在 24 处 `as any` 违规，需在后续迭代中逐步消除
#JK|- **覆盖率缺口**: UsageSync 模块当前未达 70% 目标
#SP|- **大文件风险**: ManageStrategies.ts (2882 行)、Recommender.ts (870 行) 可能需要重构拆分
## 项目结构速查

| 目录 | 内容 | 关键文件 |
|------|------|----------|
#HK|| `Tools/` | 核心功能模块（13.5k+ 行，27 个 TS 文件） | `ManageStrategies.ts` (2882), `Recommender.ts` (870) |
#RM|| `Tools/UsageSync/` | 多厂商使用同步（独立子模块，21 文件，2411 行） | `index.ts`, `interfaces.ts`, `CLI.ts` (547) |
#HM|| `Workflows/` | OpenCode 工作流定义（14 个） | `List.md`, `Switch.md` |
#XW|| `tests/unit/` | 单元测试（3500+ 行） | `PathManager.test.ts`, `Validator.test.ts` (655) |
#KM|| `templates/` | 策略模板（8 文件） | `strategy-*.jsonc` |
| `scripts/` | 安装和配置脚本 | `install.sh`, `setup-opencode-integration.sh` |

## 核心类型速查

```typescript
// 策略配置（oh-my-opencode schema）
interface StrategyConfig {
  agents?: Record<string, AgentConfig>
  categories?: Record<string, CategoryConfig>
  lsp?: Record<string, any>
}

// 推荐上下文
interface RecommendationContext {
  scenario: ScenarioType
  budget?: BudgetConfig
  priority?: Priority
  quotaStatus?: QuotaStatus
}

// 使用数据
interface UsageData {
  provider: string
  model: string
  usage: { inputTokens, outputTokens, totalTokens, requests? }
  cost?: number
  source: "✅ API (官方)" | "⚠️ 估算 (本地)"
  accuracy: number
}
```

## 约束与原则

### Schema 兼容性（不可违反）
- **必须符合**: oh-my-opencode 官方 schema
- **禁止偏离**: 不得超出官方字段范围
- **一致性**: `scripts/`、`docs/`、`templates/`、`Workflows/`、`Tools/` 同步更新

### 导入规则
- UsageSync 自动加载认证：`import "./setup_auth"` 在 `index.ts`
- 工具导出：`export class X from "./X.ts"` + `export * from "./X"`

## 关键注意事项

- **ManageStrategies.ts**: 单文件 2802 行，修改前评估拆分必要性
- **UsageSync/**: 独立子模块（2411 行），有独立 `index.ts` 和 `interfaces.ts`
- **工作流**: Markdown 格式，通过 `SKILL.md` 路由加载
- **颜色输出**: `chalk` 库，green=success, red=error, yellow=warn, blue=info
- **类型检查**: 提交前必须运行 `bun type-check`，无错误才能合并
- **Recommender.v2**: 存在（`tests/unit/Recommender.v2.test.ts`），重构进行中
- **模块边界**: Tools/UsageSync/ 是完整模块（有 index.ts），Tools/ 包含多个独立模块
- **测试覆盖**: 目标 - PathManager 90%+, Validator 85%+, Recommender 80%+, ManageStrategies 75%+, UsageSync 70%+
