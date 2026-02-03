# List Strategies

When to use
-------------
- 当需要列出仓库中所有可用策略并查看当前激活状态时使用。
- 适用于：审查可用策略、确认当前激活策略、快速浏览策略元信息（成本、版本、用途）。

Step-by-step
-----------
1. 调用 listStrategies() 以获取所有可用策略的元信息。
   - 函数签名： listStrategies(): StrategyMetadata[]
   - 位置： skills/StrategyManager/Tools/ManageStrategies.ts
2. 若返回数组为空，报告错误（没有找到可用的策略）并退出。
3. 否则，准备表格显示字段：名称、成本级别、描述（截断为 30 字符）、状态（高亮当前策略）。
4. 使用 displayStrategies() 输出格式化表格到控制台。
   - 函数签名： displayStrategies(): void
   - displayStrategies 内部会调用 listStrategies() 并使用 formatTable() 打印表格。
5. 在终端输出中，高亮当前激活策略（displayStrategies 使用 colorize('[当前]', 'green') 实现）。

Notes on implementation (referencing ManageStrategies.ts)
-----------------------------------------------------
- listStrategies():
  - 从 ~/.config/opencode/strategies/ 读取文件列表，仅包含以 "strategy-" 开头并以 ".jsonc" 结尾的文件。
  - 对每个策略文件：读取 JSONC 配置，构造 StrategyMetadata 包括 name、filePath、description、costLevel、version、isCurrent、useCase。
  - 返回按 name 排序的策略数组。

- displayStrategies():
  - 调用 listStrategies() 获取策略数组。
  - 若空则输出错误信息（"没有找到可用的策略"）。
  - 构建表头 ['名称','成本级别','描述','状态']，并为每条策略生成一行数据。
  - 描述字段会被截断为 30 字符，当前策略状态通过 colorize 标记为绿色。
  - 最终通过 formatTable(headers, rows) 打印到控制台。

Verification
------------
- 成功条件：
  - displayStrategies() 在控制台打印一个包含所有策略的表格，表格列应包含：名称、成本级别、描述（最多 30 字）、状态。
  - 当前激活策略的状态列显示为绿色且标注为 [当前]（isCurrent 为 true 的策略）。

- 具体验证步骤：
  1. 在 ~/.config/opencode/strategies/ 下准备至少两个策略文件：strategy-foo.jsonc、strategy-bar.jsonc，确保其中一个通过 CONFIG_FILE 指向为当前激活（软链）。
  2. 运行 displayStrategies() 或相关 CLI 命令，观察输出：
     - 表格包含两行（或更多），名称列显示完整文件基名（例如 strategy-foo）。
     - 描述列为不超过 30 个字符且在超出时以 ... 截断。
     - 当前激活的策略在状态列显示为绿色 [当前]。
  3. 在没有策略目录或目录为空时，displayStrategies() 应返回并输出错误信息 "没有找到可用的策略"。

Related conventions
-------------------
- 工作流文件使用 TitleCase 命名（List.md）。
- 保持与 Switch.md 相同的结构：When to use / Step-by-step / Notes on implementation / Verification / Related conventions / Append findings。
- 不要复制技能级别的 README 或 SKILL.md 全文；仅引用实现点和验证方法。

Append findings
---------------
- 发现：listStrategies 只识别以 "strategy-" 开头的文件名，并期望后缀为 .jsonc。这意味着自定义命名时需遵循该约定，否则不会被列出。
- 建议：如果需要列出非标准命名的策略，需在 listStrategies 中扩展过滤规则或提供额外的 CLI 选项。
