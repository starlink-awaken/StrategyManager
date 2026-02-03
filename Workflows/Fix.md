# Fix Strategies

When to use
-------------
- 当需要批量修正仓库中策略文件的模型命名（例如为 Google 模型添加 antigravity 前缀）时使用。
- 适用于：修复模型命名不一致、批量更新模型引用、在大规模策略升级前统一命名规范。

Step-by-step
-----------
1. 确认策略目录存在：~/.config/opencode/strategies/。
2. 创建策略备份：功能实现会将当前策略文件完整复制到 ~/.config/opencode/strategies-backup-{timestamp}/。
   - 在 ManageStrategies.createBackup() / fixStrategies() 中实现（参见 ManageStrategies.ts）。
3. 应用命名替换规则：
   - google/gemini-3-pro → google/antigravity-gemini-3-pro
   - google/gemini-3-flash → google/antigravity-gemini-3-flash
   - google/gemini-2.0- → google/antigravity-gemini-2.0-
   - google/gemini-2.5- → google/antigravity-gemini-2.5-
   这些替换由 ManageStrategies.fixStrategies() 中的 replacements 数组驱动。
4. 对每个以 .jsonc 结尾的策略文件读取文件内容，执行全局替换并在发生变更时写回文件（ManageStrategies.fixStrategies 实现）。
5. （可选）对于结构变化较大的策略（例如 Performance 策略需要引入/替换 GitHub Copilot 高级请求），请参考 .config/opencode/fix-strategies.sh 中的注释并手动调整对应策略文件。

Notes on implementation (referencing ManageStrategies.ts and fix-strategies.sh)
-----------------------------------------------------
- 函数签名： fixStrategies(): boolean
- 位置： .config/opencode/skills/StrategyManager/Tools/ManageStrategies.ts
- 关键行为：
  - 会先调用 fs.mkdirSync 创建备份目录 ~/.config/opencode/strategies-backup-{timestamp}，并复制所有 .jsonc 策略文件到该目录。
  - 使用 replacements 列表（数组对）驱动字符串替换逻辑；针对每个文件，逐项检查并替换匹配字符串，若有修改则写回文件并记录已修正计数。
  - 成功时输出修正数量并返回 true，失败时输出错误并返回 false。
- shell 脚本参考： .config/opencode/fix-strategies.sh
  - 脚本包含交互式确认、备份路径格式（YYYYmmdd_HHMMSS）以及 sed -i.tmp 的替换示例。
  - 脚本提示：Performance 策略中涉及 GitHub Copilot 高级模型的修改需手动处理（结构复杂，脚本仅提示）。

Verification
------------
- 成功条件：
  1. 在 ~/.config/opencode/ 下创建了备份目录 strategies-backup-{timestamp}，其中包含原始 .jsonc 策略文件副本。
  2. ManageStrategies.fixStrategies() 执行后，控制台输出包含已修正的文件名和修正完成统计（例如: 修正完成: 3 个策略文件）。
  3. 策略文件中原先出现的 google/gemini-3-pro 等字符串被替换为 google/antigravity-gemini-3-pro（可通过 grep 或手动检查验证）。

- 具体验证步骤：
  1. 运行 ManageStrategies.fixStrategies()（或执行 .config/opencode/fix-strategies.sh 脚本）并确认交互/日志输出。
  2. 检查备份目录存在且包含原始文件：ls ~/.config/opencode/strategies-backup-*/
  3. 在策略目录中对比文件修改：grep -R "antigravity-gemini" ~/.config/opencode/strategies || true
  4. 验证没有意外的文件移动或深层子目录创建（遵循工作流要求，不创建深层次子目录）。

Notes / Caveats
---------------
- fixStrategies 针对字符串替换，基于文本匹配，不会理解 JSON 结构；因此在存在复杂嵌套或非标准字段时应谨慎，建议先在分支或本地备份中运行。
- Performance 类型策略可能需要手工合并脚本建议中的变更（脚本在 echo 中已提示）。
- 自动化替换后建议运行 validateStrategy 或针对典型策略运行单元验证以确保语法与必需字段未被破坏。

Related conventions
-------------------
- 工作流文件命名使用 TitleCase（Fix.md）并放在 Workflows 目录下。
- 不创建深层次子目录，文件路径应为 .config/opencode/skills/StrategyManager/Workflows/Fix.md。

Append findings
---------------
- 发现：ManageStrategies.fixStrategies() 会在处理前创建完整备份并对所有 .jsonc 文件做全局文本替换，匹配规则由 replacements 数组定义。
- 建议：若后续替换规则增多，可将 replacements 抽出为可配置文件以便维护和测试。
