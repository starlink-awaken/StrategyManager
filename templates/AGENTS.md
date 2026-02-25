# 策略模板 (Templates)

## OVERVIEW

#BT|本目录包含 8+ 个策略模板，涵盖从极致性能到极致性价比的多种场景。采用 JSONC 格式。

## STRUCTURE

### 核心策略（推荐使用）
- `smart.jsonc`: 旗舰配置，集成最强模型，适合关键任务。
- `balanced.jsonc`: 均衡配置，兼顾速度与质量，适合日常开发。
- `fast.jsonc`: 高速配置，追求响应速度，适合简单任务。
- `cheap.jsonc`: 经济配置，极低成本，适合学习实验。

### 扩展策略（按需使用）
-HS|- `strategy-0-super.jsonc`: 极致性能（v2.1.0，¥2000-3000/月）
-YZ|- `strategy-1-performance.jsonc`: 高性能（v2.1.0，¥850-1350/月）
-QB|- `strategy-2-balanced.jsonc`: 标准平衡（v2.2.0，¥220-420/月） ⭐默认
-QB|- `strategy-2-balanced-copilot.jsonc`: GitHub Copilot 专用（v2.1.0-deprecated，已废弃）
-QB|- `strategy-2-balanced-direct.jsonc`: 直连模式（v2.2.0-direct，¥400-700/月）
-QB|- `strategy-3-economical.jsonc`: 经济实用（v1.1.0，¥50-150/月）⚠️结构不完整
-QB|- `strategy-4-creative.jsonc`: 创意写作（v1.1.0，¥500-800/月）
-QB|- `strategy-5-research.jsonc`: 深度研究（v1.1.0，¥1800-2500/月）
-QB|- `strategy-6-agent-focused.jsonc`: Agent 编排（v1.1.0，¥800-1200/月）⚠️需修复BUG
-IT|
- `strategy-6-agent-focused.jsonc`: Agent 编排优化。
- `strategy-7-china-first.jsonc`: 国产大模型优先。
- `strategy-8-general.jsonc`: 通用配置。

## WHERE TO LOOK
|| 场景 | 推荐模板 | 预估月成本 | 状态 |
| :--- | :--- | :--- | :--- |
|| 关键任务/深度研究 | `smart` / `strategy-0-super` | $2000-3000 | ✅ |
|| 日常开发/团队协作 | `balanced` / `strategy-2-balanced` | $220-700 | ⭐默认 |
|| 简单任务/快速迭代 | `fast` / `strategy-1-performance` | $850-1500 | ✅ |
|| 学习实验/成本敏感 | `cheap` / `strategy-3-economical` | $50-150 | ⚠️待完善 |
|| 创意写作/新媒体运营 | `smart` / `strategy-4-creative` | $500-800 | ✅ |
|| 深度研究/金融分析 | `smart` / `strategy-5-research` | $1800-2500 | ✅ |
|| Agent 编排/自动化 | `strategy-6-agent-focused` | $800-1200 | ❌需修复 |
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

