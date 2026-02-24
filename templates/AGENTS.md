# 策略模板 (Templates)

## OVERVIEW

本目录包含 7 个策略模板（4 个核心 + 3 个扩展），采用 JSONC 格式。这些模板覆盖了从极致性能到极致性价比的多种使用场景。用户可以通过 `switch` 命令快速激活选定的策略。

## STRUCTURE

### 核心策略（推荐使用）
- `smart.jsonc`: 旗舰配置，集成最强模型，适合关键任务。
- `balanced.jsonc`: 均衡配置，兼顾速度与质量，适合日常开发。
- `fast.jsonc`: 高速配置，追求响应速度，适合简单任务。
- `cheap.jsonc`: 经济配置，极低成本，适合学习实验。

### 扩展策略（保留）
- `strategy-6-agent-focused.jsonc`: Agent 编排优化。
- `strategy-7-china-first.jsonc`: 国产大模型优先。
- `strategy-8-general.jsonc`: 通用配置。

## WHERE TO LOOK

| 场景 | 推荐模板 | 预估月成本 (USD) |
| :--- | :--- | :--- |
| 关键任务 / 深度研究 | `smart` | $2000-3000 |
| 日常开发 / 团队协作 | `balanced` | $400-700 |
| 简单任务 / 快速迭代 | `fast` | $1000-1500 |
| 学习实验 / 成本敏感 | `cheap` | $50-150 |
| Agent 编排 / 自动化 | `strategy-6-agent-focused` | $1200 |
| 国产优先 / 中文场景 | `strategy-7-china-first` | $600 |

## CONVENTIONS

- **格式**: 必须使用 JSONC (带注释的 JSON)，方便说明配置意图。
- **Schema**: 严格遵守 oh-my-opencode 官方 schema。
- **版本控制**: 模板修改需同步更新版本号，确保回滚可用。
- **激活方式**: 使用 `bun run Tools/ManageStrategies.ts switch <name>`。

## ANTI-PATTERNS

- **废弃模板**: 以下模板已删除，请迁移到推荐模板：
  - `strategy-0-super.jsonc` → `smart`
  - `strategy-1-performance.jsonc` → `fast`
  - `strategy-2-balanced.jsonc` → `balanced`
  - `strategy-3-economical.jsonc` → `cheap`
  - `strategy-4-creative.jsonc` → `smart`
  - `strategy-5-research.jsonc` → `smart`
- **命名缺失**: 配置文件中 model 字段必须带 provider 前缀（如 `anthropic/claude-3-5-son`）。
- **硬编码**: 禁止在模板中硬编码个人 API Key 或敏感信息。
- **冗余配置**: 避免在模板中定义 schema 默认值。
- **配额管理**: 必须在 `lsp` 字段中配置 `budget` 和 `provider_quotas`。

