# QuickStart - StrategyManager

常见场景：比较策略、导入外部策略、导出策略、列出和推荐。

示例命令：

- 比较：
  - 用户："Compare strategies A and B"
  - 触发：`Workflows/Compare.md`

- 导出：
  - 用户："Export strategy my-strategy to /tmp/out.json"
  - 触发：`Workflows/Export.md`

- 导入：
  - 用户："Import strategy /path/to/strategy.jsonc"
  - 触发：`Workflows/Import.md`

最佳实践：
- 使用 TitleCase 文件名与工作流名
- 不要在 SKILL.md 写实现细节；将流程放入 Workflows/*.md
- 保持根目录扁平，避免创建 Context/ 或 Docs/ 子目录

更多信息：查看 Workflows/ 目录中的各个 .md 文件获取具体 SOP。
