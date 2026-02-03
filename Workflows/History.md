# 历史记录管理工作流

版本: 1.0

描述:
本工作流说明策略历史记录的查询与回滚流程。历史以 JSON 数组形式保存在
.config/opencode/strategy-history.json 中（每条记录包含时间、策略名、策略路径、操作类型、备份路径等）。

触发条件:
- 用户需要查看最近策略切换操作（查询历史）
- 用户需要将当前策略恢复到某个历史点（回滚）

文件位置（参考）:
- 管理工具: skills/StrategyManager/Tools/ManageStrategies.ts
- 历史记录文件: ~/.config/opencode/strategy-history.json

执行步骤:

1. 查询历史 (getHistory / displayHistory)
  - 调用: ManageStrategies.getHistory() 或 ManageStrategies.displayHistory(limit)
  - 行为:
    1) 检查 ~/.config/opencode/strategy-history.json 是否存在；不存在则返回空列表并提示“没有历史记录”。
    2) 读取文件并解析为 HistoryEntry[]。单条 HistoryEntry 结构:
       - timestamp: ISO 时间字符串
       - strategyName: 策略名称（文件名不含后缀）
       - strategyPath: 策略文件绝对路径
       - action: 'switch' | 'rollback' | 'import'
       - backupPath?: 可选，备份文件路径
    3) displayHistory(limit) 会将最近 limit 条记录格式化为表格，列: 时间、策略、操作、备份。

2. 记录历史 (addHistoryEntry)
  - 调用: ManageStrategies.addHistoryEntry(entry)
  - 行为:
    1) 调用 getHistory() 取得现有历史数组
    2) 使用 unshift 将新条目放到数组最前
    3) 保留最近 100 条记录（slice(0,100)）
    4) 将修剪后的数组写回 ~/.config/opencode/strategy-history.json

3. 回滚 (rollbackToHistory)
  - 调用: ManageStrategies.rollbackToHistory(index)
  - 输入: history 数组索引（0 表示最近的一条）
  - 行为:
    1) 校验索引范围；超出范围返回错误。
    2) 读取对应条目 entry
    3) 如果 entry.action === 'switch' 且 entry.backupPath 存在且可访问：
       - 从 backupPath 复制到配置文件位置 (~/.config/opencode/oh-my-opencode.json)
       - 添加一条 action='rollback' 的历史记录（记录时间、策略名、路径）
    4) 否则如果 entry.strategyPath 存在：
       - 直接调用 switchStrategy(path.basename(entry.strategyPath, '.jsonc')) 切换到该策略（会记录新的历史条目）
    5) 否则返回错误：无法回滚（策略文件或备份不存在）。

验证方法:
- 单元级验证:
  - 调用 ManageStrategies.getHistory()：在不存在历史文件时应返回空数组；存在文件时返回已解析的数组，各字段类型正确。
  - 调用 ManageStrategies.displayHistory(5)：应在控制台输出包含最近 5 条的表格（人工核验格式）。
  - 调用 ManageStrategies.addHistoryEntry({ ... })：应在文件开头新增条目，且文件长度不超过 100 条。
  - 调用 ManageStrategies.rollbackToHistory(i)：在备份存在时应将备份文件复制为 ~/.config/opencode/oh-my-opencode.json 并新增 rollback 历史条目；在策略文件存在但无备份时应调用 switchStrategy 并产生 switch 条目。

- 集成级验证（手动步骤）:
 1) 创建一个测试策略文件: ~/.config/opencode/strategies/strategy-test.jsonc
 2) 调用 ManageStrategies.switchStrategy('strategy-test')，确认:
   - ~/.config/opencode/oh-my-opencode.json 为指向 strategy-test.jsonc 的软链
   - strategy-history.json 中新增 switch 条目
 3) 将当前配置文件（非软链）备份为 oh-my-opencode.json.backup.TEST，然后手动添加一条历史记录指向该备份（或通过实际切换产生）
 4) 调用 ManageStrategies.rollbackToHistory(0) 或对应索引，验证恢复行为（备份复制或直接切换）并在 history 中新增 rollback 条目

注意与约束:
- 历史记录使用 JSON 存储，最多保留 100 条（ManageStrategies.addHistoryEntry 已实现）。
- rollbackToHistory 优先使用备份恢复；若无备份但策略文件存在则直接切换。
- 所有路径均为绝对路径，时间使用 ISO 字符串。
- 不要创建深层次子目录：本工作流文件必须存放在
  /Users/xiamingxing/.config/opencode/skills/StrategyManager/Workflows/History.md

附录: 参考代码片段（摘自 ManageStrategies.ts）

getHistory() 的核心实现要点:
- 如果历史文件不存在返回 []
- 读取并 JSON.parse 文件内容

rollbackToHistory(index) 的核心实现要点:
- 校验索引范围
- 如果 entry.action === 'switch' && entry.backupPath && fileExists(backupPath)
  -> fs.copyFileSync(backupPath, CONFIG_FILE)
  -> addHistoryEntry({ timestamp: now, strategyName: entry.strategyName, strategyPath: entry.strategyPath, action: 'rollback' })
- 否则如果 fileExists(entry.strategyPath)
  -> switchStrategy(basename(entry.strategyPath, '.jsonc'))
- 否则报错
