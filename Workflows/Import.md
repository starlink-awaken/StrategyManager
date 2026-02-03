# 策略导入工作流

## 目的
描述如何将外部策略文件导入到本地策略库（~/.config/opencode/strategies），并在导入过程中进行必要的验证与历史记录。

## 触发条件
- 用户调用 CLI 或脚本执行导入，例如: importStrategy("my-strategy", "/path/to/file.jsonc")
- 或者通过 UI/工具链上传一个策略文件并选择“导入”。

## 先决条件
- 系统必须存在 ~/.config/opencode/strategies 目录（ManageStrategies.ts 中常量 STRATEGIES_DIR）。
- 导入文件为 JSONC（允许注释）的策略配置文件。

## 执行步骤
1. 检查输入文件存在
   - 操作: 调用 fileExists(inputPath)
   - 失败: 如果文件不存在，记录错误并返回失败。示例错误: "文件不存在: /path/to/file.jsonc"

2. 读取并解析输入文件
   - 操作: 使用 readJSONC(inputPath) 读取并移除注释后解析 JSON
   - 失败: 解析失败时返回导入失败并打印解析错误

3. 验证策略内容
   - 操作: 调用 validateStrategy(config)
   - 验证点:
     - 必须包含 description 字段
     - agents 与 categories 中每一项必须包含 model 字段
   - 失败: 验证失败时返回失败并打印具体验证错误信息

4. 写入目标策略目录
   - 目标路径: ~/.config/opencode/strategies/<strategyName>.jsonc
   - 操作: writeJSONC(outputPath, config)
   - 备注: 不创建深层子目录；仅写入到 strategies 目录下（MUST NOT DO 中的约束）

5. 添加历史记录
   - 操作: addHistoryEntry({ timestamp: ISOString, strategyName, strategyPath: outputPath, action: 'import' })

6. 返回成功
   - 在控制台打印成功信息: 已导入策略: <strategyName> ← <inputPath>

## 可选行为 / CLI 选项
- --validate (默认启用): 在写入前运行 validateStrategy。若验证失败，拒绝导入。

## 验证方法（如何确认导入成功）
1. 文件存在性
   - 检查: ~/.config/opencode/strategies/<strategyName>.jsonc 存在且可读取
   - 命令示例: cat ~/.config/opencode/strategies/<strategyName>.jsonc

2. 内容验证
   - 检查: 使用 ManageStrategies.validateStrategyFile(strategyName) 返回 true

3. 历史记录
   - 检查: 在 ~/.config/opencode/strategy-history.json 中应包含最近一条 action 为 "import" 且 strategyName 匹配的记录

4. CLI 输出
   - 成功导入时应看到控制台输出: 已导入策略: <strategyName> ← <inputPath>

## 错误处理与回滚
- 如果写入目标路径失败（磁盘权限、空间等），函数应捕获异常并返回错误信息。
- 导入过程中若任一步失败，不应影响已存在的其他策略文件。

## 与 ManageStrategies.ts 的对应实现点
- readJSONC(inputPath) — 解析 JSONC
- validateStrategy(config) — 验证策略字段
- writeJSONC(outputPath, config) — 写入策略文件
- addHistoryEntry(...) — 记录导入操作历史
- fileExists(inputPath) — 检查输入文件存在性

## 注意事项
- 导入后的文件命名规范: <strategyName>.jsonc，ManageStrategies.listStrategies 会筛选以 "strategy-" 开头并以 .jsonc 结尾的文件作为可用策略。
- 不要创建深层次子目录；只写入到 STRATEGIES_DIR 中。

---
工作流最后更新: 2026-02-02
