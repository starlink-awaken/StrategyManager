# templates 策略模板

**父级**: `../AGENTS.md`

## 概述

策略模板目录，包含 12 个 JSONC 格式的模板文件，定义不同场景下的 AI 模型配置策略。

## 结构

```
templates/
├── strategy-0-super.jsonc           # 超级策略（最高配置）
├── strategy-1-performance.jsonc     # 性能优先
├── strategy-2-balanced.jsonc        # 平衡策略（默认推荐）
├── strategy-2-balanced-copilot.jsonc # 平衡策略（Copilot 专用，已废弃）
├── strategy-2-balanced-direct.jsonc  # 平衡策略（直连模式）
├── strategy-3-economical.jsonc      # 经济策略
├── strategy-4-creative.jsonc        # 创意策略
├── strategy-5-research.jsonc        # 研究策略
└── strategy-6-agent-focused.jsonc   # Agent 聚焦策略
```

## WHERE TO LOOK

| 场景 | 模板文件 | 月成本估算 | 适用情况 |
|------|----------|-----------|----------|
| 最高性能 | `strategy-0-super.jsonc` | ¥2000-3000 | 无预算限制，追求最佳质量 |
| 性能优先 | `strategy-1-performance.jsonc` | ¥850-1350 | 重要项目，需要高质量输出 |
| 日常开发 | `strategy-2-balanced.jsonc` | ¥220-420 | **默认推荐**，性价比最优 |
| 经济实惠 | `strategy-3-economical.jsonc` | ¥50-150 | 预算敏感，基础任务 |
| 创意写作 | `strategy-4-creative.jsonc` | ¥500-800 | 创意内容生成 |
| 深度研究 | `strategy-5-research.jsonc` | ¥1800-2500 | 学术研究，复杂分析 |
| Agent 任务 | `strategy-6-agent-focused.jsonc` | ¥800-1200 | 多 Agent 协作场景 |

## CONVENTIONS

- **格式**: JSONC（支持注释的 JSON）
- **Schema**: 必须符合 oh-my-opencode 官方 schema
- **版本**: `metadata.version` 遵循语义化版本
- **模型名称**: 使用完整 provider 前缀（如 `anthropic/claude-3-opus`）
- **成本标注**: `metadata.monthly_cost_estimate` 提供人民币月成本范围
- **资源标注**: `metadata.resources_used` 列出所需订阅资源

## 模板结构

```jsonc
{
  "metadata": {
    "name": "策略名称",
    "version": "2.2.0",
    "description": "策略描述",
    "monthly_cost_estimate": "¥220-420",
    "resources_used": ["claude-pro", "gpt-4"]
  },
  "agents": {
    "default": { "model": "anthropic/claude-3.7-sonnet" }
  },
  "categories": { ... },
  "lsp": { ... }
}
```

## ANTI-PATTERNS

- 不要使用已废弃模板（如 `strategy-2-balanced-copilot.jsonc`）
- 避免模型名称缺少 provider 前缀
- 不要超出 oh-my-opencode schema 字段范围
- 避免未测试的模型配置（需验证可用性）

## NOTES

- 模板选择后可通过 `switch` 命令激活
- 修改模板后需运行 `validate` 确保 schema 兼容
- 新增模板需在 README 中更新模板列表
- minimax 和 方舟 模型待补充（当前未充分利用）
