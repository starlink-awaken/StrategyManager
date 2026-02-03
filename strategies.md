---
description: Manage and operate strategies (list, switch, fix, validate, compare, history, recommend, export, import, help)
---

Usage: /strategies <subcommand> [options]

Subcommands:

- list
  - 描述: 列出所有策略，按名称、版本、最后修改时间和状态显示表格。
  - 用法: /strategies list [--json] [--filter <expr>]
  - 输出: ASCII 表格或 JSON。表格包含: name | version | active? | modifiedAt

- switch <name>
  - 描述: 切换到指定策略（创建备份并记录历史）。
  - 用法: /strategies switch <name> [-y]
  - 交互: 在执行前提示确认（显示当前策略 -> 目标策略的简要差异）。
  - -y: 跳过确认（谨慎使用）。

- fix
  - 描述: 根据 StrategyManager 的修复工具自动修正发现的策略问题（格式/字段/依赖）。
  - 用法: /strategies fix [--dry-run] [-y]
  - 交互: 默认提示确认修复操作（显示将被修改的文件列表）。
  - --dry-run: 仅报告建议更改，不写文件。

- validate
  - 描述: 验证策略配置的完整性与架构符合性。
  - 用法: /strategies validate [<name>] [--strict]
  - 输出: 列表形式显示验证结果；非零返回码表示失败。
  - --strict: 启用更严格的规则（额外检查兼容性）。

- compare <strategy1> <strategy2>
  - 描述: 对比两个策略文件的差异，按字段列出变更、新增、移除和值变化。
  - 用法: /strategies compare <strategy1> <strategy2> [--keys-only]
  - 输出: 彩色差异（绿色=新增, 红色=删除, 黄色=修改）和结构化摘要。

- history [limit]
  - 描述: 查看策略操作历史（切换/导入/导出/修复），默认显示 50 条最近记录。
  - 用法: /strategies history [limit]
  - 输出: 时间戳 | action | user | details 表格。

- rollback <timestamp>
  - 描述: 回滚到指定时间戳的策略快照（从历史中恢复）。
  - 用法: /strategies rollback <timestamp> [-y]
  - 交互: 强制确认（显示将恢复的文件及差异）。

- recommend
  - 描述: 调用 StrategyManager 的推荐工作流，基于上下文与场景关键词返回评分与推荐理由。
  - 用法: /strategies recommend [--context "<text>"]
  - 输出: 列表化推荐，按评分降序。

- export <name> [output-file]
  - 描述: 导出指定策略为 JSON 文件（默认导出到当前工作目录，文件名 <name>.json）。
  - 用法: /strategies export <name> [output-file]
  - 选项: 当成功导出时打印成功消息并显示目标路径。

- import <input-file> [--validate]
  - 描述: 导入策略文件（支持 JSON/JSONC）。默认启用验证。
  - 用法: /strategies import <input-file> [--validate] [-y]
  - 交互: 若导入将覆盖现有同名策略，提示确认。
  - --validate: 启用/禁用导入时的验证（默认启用）。

- help
  - 描述: 显示帮助信息与示例用法。

Color output conventions:

- 使用颜色常量：
  - success (绿色): 用于成功消息与确认成功的操作。
  - error (红色): 用于错误与失败信息。
  - warn (黄色): 用于警告、潜在风险或注意事项。
  - info (蓝色): 用于普通信息输出和步骤说明。

- 在终端上使用 ANSI 颜色转义序列（保证兼容 --no-color 选项）。

Interactive confirmations:

- 默认在执行破坏性操作前提示确认：switch, fix, rollback, import(覆盖)
- 确认格式：显示要变更的摘要（差异/将写入的文件/备份位置），提示 (y/N)
- 可通过 -y/--yes 跳过确认以实现非交互自动化。

Integration with StrategyManager skill:

- 所有子命令将调用 StrategyManager skill 的对应工作流：
  - list -> Workflows/List.md
  - switch -> Workflows/Switch.md
  - fix -> Workflows/Fix.md
  - validate -> Workflows/Validate.md
  - compare -> Workflows/Compare.md
  - history/rollback -> Workflows/History.md
  - recommend -> Workflows/Recommend.md
  - export -> Workflows/Export.md
  - import -> Workflows/Import.md

- 调用模式：命令层负责参数解析与交互（颜色输出/确认）；Skill 层负责执行业务逻辑（读写策略、对比、校验、推荐算法）。
- 错误处理：当 Skill 返回错误/异常时，命令打印红色错误并返回非零退出码；若 Skill 提供可修复建议，命令提示用户运行 /strategies fix。

UX notes and examples:

- 列出策略（带过滤）：
  /strategies list --filter "env:prod" --json

- 切换策略（交互）：
  /strategies switch blue-ocean
  Info: 当前策略: green-field -> 目标: blue-ocean
  Diff: - agent.alpha.model: gpt-3 -> gpt-4 (yellow)
  Proceed? (y/N)

- 对比策略（彩色）：
  /strategies compare blue-ocean green-field
  输出中: + 新增字段 (green), - 删除字段 (red), ~ 修改 (yellow)

Implementation details (for implementers):

- 输出颜色应封装为 COLORS 常量（支持 names: reset, green, red, yellow, blue）
- 表格格式化使用固定列宽计算（兼容窄屏）。
- 验证返回非零时应打印简明失败原因与修复建议。

Files created/updated by workflows:

- Strategy files: $STRATEGIES_DIR/<name>.jsonc
- History store: $CONFIG_DIR/strategy-history.json
- Backups: $CONFIG_DIR/backups/<name>-<timestamp>.jsonc

Notes:

- 请勿在此文件中实现业务逻辑；该文档仅为命令层说明，实际逻辑放在 skills/StrategyManager Workflows。
- 保留与 .config/opencode/command/review.md 相同的 frontmatter 风格与简洁描述。
