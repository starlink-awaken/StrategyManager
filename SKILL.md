---
name: StrategyManager
description: 管理和操作策略集（比较、导入/导出、历史、推荐）。USE WHEN 管理策略、导入策略、比较策略。
triggers:
  - "manage strategies"
  - "compare strategies"
  - "import strategy"
  - "export strategy"
---

# StrategyManager

简洁路由器：将自然语言意图映射到具体工作流。采用动态加载：SKILL.md 保持最小，工作流按需加载。

## Workflow Routing

| Trigger example | Workflow |
|-----------------|----------|
| "compare strategies" | `Workflows/Compare.md` |
| "export strategy" | `Workflows/Export.md` |
| "import strategy" | `Workflows/Import.md` |
| "list strategies" | `Workflows/List.md` |
| "recommend strategy" | `Workflows/Recommend.md` |
| "feedback report" | `Workflows/FeedbackReport.md` |
| "switch strategy" | `Workflows/Switch.md` |
| "fix strategies" | `Workflows/Fix.md` |
| "validate strategy" | `Workflows/Validate.md` |
| "strategy history" / "rollback strategy" | `Workflows/History.md` |

## Quick Reference

- TitleCase 命名
- Flat folder: 工作流放在 Workflows/，上下文文件放在 skill 根目录
- 动态加载：SKILL.md 仅做路由与快速说明，SOP 放到单独 .md（按需加载）

## Quick Commands

- Skill 匹配："Compare strategies" → Compare.md
- 导入："Import strategy from <path>" → Import.md
