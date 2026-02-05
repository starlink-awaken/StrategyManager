---
description: AI 策略配置管理工具
argument-hint: [list|switch|recommend|compare|validate|import|export|history|cost-report|usage-sync]
allowed-tools:
  - bash
  - read
  - grep
---

StrategyManager 策略管理命令。

## 用户输入
{{{args}}}

## 执行逻辑

根据 `{{{args}}}` 解析用户意图，执行对应的 StrategyManager CLI 命令。

### 命令映射

| 用户意图 | CLI 命令 |
|---------|----------|
| 列出所有策略 | `bun run Tools/ManageStrategies.ts list` |
| 查看策略列表 | `bun run Tools/ManageStrategies.ts list` |
| 列表 | `bun run Tools/ManageStrategies.ts list` |
| 查看某个策略详情 | `bun run Tools/ManageStrategies.ts show <name>` |
| 切换策略 | `bun run Tools/ManageStrategies.ts switch <name>` |
| 推荐策略 | `bun run Tools/ManageStrategies.ts recommend "<scenario>"` |
| 推荐适合的策略 | `bun run Tools/ManageStrategies.ts recommend "<scenario>"` |
| 比较策略 | `bun run Tools/ManageStrategies.ts compare <a> <b>` |
| 验证策略 | `bun run Tools/ManageStrategies.ts validate <file>` |
| 导入策略 | `bun run Tools/ManageStrategies.ts import <file>` |
| 导出策略 | `bun run Tools/ManageStrategies.ts export <name> <out>` |
| 查看历史 | `bun run Tools/ManageStrategies.ts history` |
| 回滚策略 | `bun run Tools/ManageStrategies.ts rollback <timestamp>` |
| 成本报告 | `bun run Tools/ManageStrategies.ts cost-report` |
| 使用同步 | `bun run Tools/ManageStrategies.ts usage-sync` |

### 智能解析

如果用户输入模糊，根据上下文智能推断：

1. **场景关键词** → recommend 命令
   - "日常开发"、"深度研究"、"创意写作"、"成本敏感" → `bun run Tools/ManageStrategies.ts recommend "<场景>"`

2. **操作关键词** → 对应命令
   - "list"、"列表"、"查看" → `bun run Tools/ManageStrategies.ts list`
   - "switch"、"切换" → `bun run Tools/ManageStrategies.ts switch <name>`
   - "compare"、"对比" → `bun run Tools/ManageStrategies.ts compare <a> <b>`
   - "validate"、"验证" → `bun run Tools/ManageStrategies.ts validate <file>`

3. **策略名称** → show 或 switch
   - 如果用户提到具体策略名（如 "strategy-2-balanced"）
   - 操作是"查看" → `bun run Tools/ManageStrategies.ts show <name>`
   - 操作是"切换" → `bun run Tools/ManageStrategies.ts switch <name>`

## 执行

分析用户输入 `{{{args}}}`，确定最佳命令，然后执行并展示结果。

**工作目录**: StrategyManager 安装目录（`~/.config/opencode/skills/StrategyManager` 或 symlink 指向的实际路径）
