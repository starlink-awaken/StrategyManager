# Workflows 工作流定义

**父级**: `../AGENTS.md`

## 概述

OpenCode 工作流定义目录，包含 13 个 Markdown 格式的工作流文件，通过 `SKILL.md` 路由加载。

## 结构

```
Workflows/
├── List.md          # 列出所有策略
├── Switch.md        # 切换策略
├── Compare.md       # 比较策略差异
├── Recommend.md     # 智能推荐
├── Validate.md      # 验证策略
├── Import.md        # 导入策略
├── Export.md        # 导出策略
├── History.md       # 历史记录
├── Fix.md           # 修复策略
└── ... (更多工作流)
```

## WHERE TO LOOK

| 任务 | 文件 | 说明 |
|------|------|------|
| 列出策略 | `List.md` | 策略列表展示 |
| 切换策略 | `Switch.md` | 策略切换逻辑 |
| 比较策略 | `Compare.md` | 差异可视化 |
| 推荐策略 | `Recommend.md` | 推荐引擎工作流 |
| 验证策略 | `Validate.md` | Schema 验证流程 |
| 导入/导出 | `Import.md` / `Export.md` | 数据转换 |
| 历史管理 | `History.md` | 版本回滚 |
| 自动修复 | `Fix.md` | 错误修复流程 |

## CONVENTIONS

- **格式**: Markdown，遵循 OpenCode 工作流规范
- **路由**: 通过 `SKILL.md` 映射到 CLI 命令
- **命名**: `<Verb>.md` 格式（List, Switch, Compare...）
- **内容**: 包含工作流步骤、工具调用、错误处理
- **依赖**: 可调用 `Tools/` 模块的功能

## ANTI-PATTERNS

- 工作流文件不应包含业务逻辑（逻辑应在 Tools/ 模块）
- 避免在 Markdown 中硬编码路径（使用配置）
- 不要修改工作流文件结构而不更新 SKILL.md

## NOTES

- 工作流文件由 OpenCode 运行时动态加载
- 修改工作流后无需重新编译
- 新增工作流需在 `SKILL.md` 注册路由
