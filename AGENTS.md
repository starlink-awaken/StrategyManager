# StrategyManager 知识库

**生成时间**: 2026-02-05
**Git 提交**: 56020e5
**分支**: master

## 概述

AI 策略配置生命周期管理工具 - OpenCode Skill，支持 Claude、Copilot、Gemini 等多平台配置管理。核心特性：智能推荐、策略比较、成本分析、历史回滚、使用同步。

**技术栈**: TypeScript 5.3 + Bun 1.0+

## 目录结构

```
./
├── Tools/              # 核心功能模块（11k+ 行代码）
│   ├── ManageStrategies.ts  # 主入口（2648 行）
│   ├── UsageSync/      # 多厂商使用同步（独立子模块）
│   ├── Recommender.ts  # 智能推荐引擎
│   ├── Validator.ts    # 策略验证器
│   ├── PathManager.ts  # 路径管理
│   └── ...
├── Workflows/          # OpenCode 工作流定义（12 个）
├── tests/              # 测试套件（3500+ 行）
├── docs/               # 文档
├── templates/          # 策略模板
├── scripts/            # 安装和配置脚本
└── SKILL.md            # Skill 入口
```

## 快速定位

| 任务 | 位置 | 备注 |
|------|------|------|
| 添加新策略 | `Tools/ManageStrategies.ts` | 核心命令路由 |
| 修改推荐逻辑 | `Tools/Recommender.ts` | 多因素评分引擎 |
| 集成新 AI 厂商 | `Tools/UsageSync/` | 实现 UsageSync 接口 |
| 修改 CLI 命令 | `Tools/ManageStrategies.ts` | Commander 配置 |
| 添加单元测试 | `tests/unit/` | 遵循现有命名 |
| 工作流定义 | `Workflows/*.md` | Markdown 格式 |

## 代码约定

### 格式
- **缩进**: 2 空格（.editorconfig 强制）
- **行尾**: LF
- **尾部空格**: JS/TS 去除，MD 保留
- **JSON 缩进**: 2 空格

### 导入顺序
1. Node 内置模块 (`import * as fs from "fs"`)
2. 项目相对导入 (`import { X } from "./X"`)
3. 类型导入 (`import type { X } from "./X"`)

### 命名
- **文件**: PascalCase (`ManageStrategies.ts`, `Recommender.ts`)
- **类**: PascalCase
- **函数**: camelCase
- **常量**: UPPER_SNAKE_CASE

### 工作流命名
- TitleCase (`Compare.md`, `List.md`, `Switch.md`)
- 路由表：`SKILL.md` → `Workflows/*.md`

## 常用命令

```bash
# 开发
bun install                    # 安装依赖
bun run Tools/ManageStrategies.ts list    # 运行 CLI
bun run dev:watch              # 热重载开发

# 测试
bun test                       # 所有测试
bun test tests/unit/           # 单元测试
bun test:coverage             # 覆盖率
bun type-check                # 类型检查

# 脚本
bash scripts/install.sh        # 安装策略模板
bash scripts/setup-opencode-integration.sh  # 配置 OpenCode 集成
```

## 关键类型

```typescript
// 核心：策略配置
interface StrategyConfig {
  agents?: Record<string, AgentConfig>
  categories?: Record<string, CategoryConfig>
  lsp?: Record<string, any>
}

// 推荐：场景与预算
interface RecommendationContext {
  scenario: ScenarioType
  budget?: BudgetConfig
  priority?: Priority
  quotaStatus?: QuotaStatus
}

// 同步：使用数据
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

### Schema 兼容性
- **必须符合**: oh-my-opencode 官方 schema
- **禁止偏离**: 不得超出官方字段范围
- **一致性**: `scripts/`、`docs/`、`templates/`、`Workflows/`、`Tools/` 同步更新

### 导入规则
- UsageSync 自动加载认证：`import "./setup_auth"` 在 `index.ts`
- 工具导出：`export class X from "./X.ts"` + `export * from "./X"`

## 注意事项

- **ManageStrategies.ts**: 单文件 2648 行，拆分前需评估
- **UsageSync/**: 独立子模块，有独立 index.ts 和 interfaces.ts
- **工作流**: Markdown 格式，通过 SKILL.md 路由加载
- **颜色输出**: green=success, red=error, yellow=warn, blue=info
