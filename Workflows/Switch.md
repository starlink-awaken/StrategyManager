# Switch Strategy

When to use
-------------
- 当需要将当前运行的策略替换为仓库中另一个策略文件时使用。
- 适用于：切换性能/成本/场景优先的策略、在不同开发/生产环境间切换、快速回退到预定义配置。

Step-by-step
-----------
1. 确认目标策略存在于配置目录：~/.config/opencode/strategies/strategy-<name>.jsonc。
2. 运行策略验证（validateStrategy）以确保目标策略包含必需字段（至少包含 description 和 agents/categories 中的 model 字段）。
3. 如果当前配置为普通文件（非软链），将在 ~/.config/opencode/ 下创建一个时间戳备份：oh-my-opencode.json.backup.<timestamp>。
4. 记录当前策略到历史（history），包括时间戳、策略名、策略路径和备份信息。
5. 使用软链接机制将 ~/.config/opencode/oh-my-opencode.json 指向目标策略文件：
   ln -sf "<策略文件路径>" "~/.config/opencode/oh-my-opencode.json"
6. 在切换成功后，输出成功信息（已切换到策略: <name>）并把本次切换写入历史记录。

Notes on implementation (referencing ManageStrategies.ts)
-----------------------------------------------------
- 函数签名： switchStrategy(strategyName: string): boolean
- 位置： skills/StrategyManager/Tools/ManageStrategies.ts
- 关键行为：
  - 检查目标策略文件存在（STRATEGIES_DIR + `${strategyName}.jsonc`）。
  - 调用 readStrategy 和 validateStrategy 做验证。
  - 如果现有配置不是软链且存在，会将其拷贝到带时间戳的备份文件（CONFIG_FILE.backup.<timestamp>）。
  - 通过 execSync 执行 ln -sf 创建/更新软链到目标策略文件。
  - 调用 addHistoryEntry 记录历史条目。

Verification
------------
- 切换后：
  - ~/.config/opencode/oh-my-opencode.json 是一个软链（isSymlink 返回 true），且指向目标策略文件。
  - getCurrentStrategy() 返回的 name 与切换目标一致，且 isCurrent 为 true。
  - 如果原配置为普通文件，应存在备份文件名以 .backup.<timestamp> 结尾。
  - 历史记录文件 ~/.config/opencode/strategy-history.json 包含最近的切换条目（action: "switch"，包含 strategyName 和 strategyPath）。

- 失败场景验证：
  - 如果目标策略不存在，switchStrategy 返回 false 并输出错误信息。
  - 如果 validateStrategy 失败，返回 false 并输出具体校验错误。

Related conventions
-------------------
- 文件命名：工作流文件使用 TitleCase（Switch.md）。
- 不在工作流中重复技能级的 README 或 SKILL.md 内容；仅描述流程与验证点。
- 不创建深层子目录，文件放在 Workflows 目录下。

Append findings
---------------
- 发现：ManageStrategies.ts 中 switchStrategy 会在添加历史条目时重复记录（在切换前记录 current，再在成功后再次 addHistoryEntry），这是预期用于保留切换前后快照的信息。
- 建议：备份清理由 cleanOldBackups 管理，保留最近 5 个备份（MAX_BACKUPS=5）。
