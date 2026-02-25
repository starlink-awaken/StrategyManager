# StrategyManager 知识库

**生成时间**: 2026-02-24 更新中
**模式**: 增量更新 + 子目录覆盖
**Git 提交**: e94eaec
**分支**: main

## 概述

AI 策略配置生命周期管理工具 - OpenCode Skill，支持 Claude、Copilot、Gemini、minimax、方舟等多平台配置管理。核心特性：智能推荐、策略比较、成本分析、历史回滚、使用同步。




```
./
├── Tools/              # 核心 (11k+ 行)
│   ├── ManageStrategies.ts   (2802 行)
│   ├── Recommender.ts        (841 行)
│   ├── Validator.ts          (489 行)
│   └── UsageSync/            (独立子模块)
├── Workflows/          # 13 个工作流 (Markdown)
├── tests/              # 单元测试 + fixtures
├── templates/          # 12 个策略模板
├── scripts/            # 安装/配置脚本
└── docs/               # 文档
```

## WHERE TO LOOK

| 任务 | 位置 | 提示 |
|------|------|------|
| 策略 CRUD | `Tools/ManageStrategies.ts` | 2802 行，考虑拆分 |
| 推荐引擎 | `Tools/Recommender.ts` | v2 重构中 |
| 使用同步 | `Tools/UsageSync/` | 独立模块，见子AGENTS.md |
| 工作流 | `Workflows/*.md` | 通过 SKILL.md 路由 |
| 模板 | `templates/strategy-*.jsonc` | JSONC 格式 |
| 脚本 | `scripts/*.sh` | + `.ts` 辅助脚本 |

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

## 项目结构速查

| 目录 | 内容 | 关键文件 |
|------|------|----------|
| `Tools/` | 核心功能模块（11k+ 行） | `ManageStrategies.ts` (2802), `Recommender.ts` (841) |
| `Tools/UsageSync/` | 多厂商使用同步（独立子模块，21 文件，2411 行） | `index.ts`, `interfaces.ts` |
| `Workflows/` | OpenCode 工作流定义（13 个） | `List.md`, `Switch.md` |
| `tests/unit/` | 单元测试（3500+ 行） | `PathManager.test.ts`, `Validator.test.ts` |
| `templates/` | 策略模板（12 文件） | `strategy-*.jsonc` |
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

## CONVENTIONS

- **运行时**: Bun 1.0+
- **入口**: `bun run Tools/ManageStrategies.ts <command>`
- **测试**: `bun test` (原生 Bun 测试)
- **配置文件**: `.editorconfig` + `tsconfig.json` (根 + Tools) + `.prettierrc.json`
- **无 ESLint**: 仅依赖 type-check + 测试
- **CI**: GitHub Actions (矩阵: ubuntu/macos) + Codecov
- ** fixtures**: `tests/fixtures/mock-data.ts`

## ANTI-PATTERNS

- ❌ `as any` 类型断言 (18 处，主要在 UsageSync)
- ❌ 单文件超 2500 行 (ManageStrategies.ts 2802 行)
- ❌ 硬编码绝对路径
- ❌ 忽略 type-check 直接提交

## UNIQUE STYLES

- **颜色输出**: `chalk` — green=success, red=error, yellow=warn, blue=info
- **工作流文件**: Markdown 格式，无业务逻辑
- **模板格式**: JSONC (带注释的 JSON)
- **导入顺序**: Node 内置 → 项目相对 → 类型导入 → 第三方

## 质量守则

- ✅ 提交前: `bun type-check` (零错误)
- ✅ 新代码: 配套测试 (覆盖率目标 80%+)
- ✅ 反模式: 避免 `as any` / `@ts-ignore`
- ✅ 文档: 公开方法必须 JSDoc

## 子模块导航

| 目录 | AGENTS.md | 说明 |
|------|-----------|------|
| `Tools/` | ✅ `Tools/AGENTS.md` | 核心模块总览 |
| `Tools/UsageSync/` | ✅ `Tools/UsageSync/AGENTS.md` | 多厂商同步 (2411 行) |
| `tests/` | ✅ `tests/AGENTS.md` | 测试策略 |
| `Workflows/` | ✅ `Workflows/AGENTS.md` | 工作流定义 |
| `scripts/` | ✅ `scripts/AGENTS.md` | 脚本约定 |
| `templates/` | ✅ `templates/AGENTS.md` | 策略模板 |

---

**维护**: 遵循 oh-my-opencode schema 兼容性 | 禁止偏离官方字段范围
