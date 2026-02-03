# 导出策略 (Export Strategy)

## 目的
描述如何将已存在的策略导出为 JSON 文件，便于分享、备份或迁移。

## 触发条件
- 用户希望把某个策略导出为独立 JSON 文件（例如用于分享或备份）。
- 通过 CLI 或程序调用 ManageStrategies.exportStrategy(strategyName, outputPath)。

## 前提
- 源策略必须存在于配置目录：~/.config/opencode/strategies，文件名格式为 `strategy-*.jsonc`。
- 调用者对目标文件路径有写权限。

## 执行步骤
1. 验证源策略存在
   - 调用 readStrategy(strategyName)；若返回 null 则中止并报错："策略文件不存在或无法读取"。

2. 读取策略配置
   - readStrategy 会通过 readJSONC 加载并解析策略（支持注释）。

3. 写出 JSON 文件
   - 使用 writeJSONC(outputPath, config) 将解析后的策略对象序列化为 JSON（2 空格缩进）并写入 outputPath。
   - ManageStrategies.exportStrategy 在实现中调用 writeJSONC，并在成功后打印成功信息。

4. 完成与记录
   - 成功时返回 true 并通过 success 打印：`已导出策略: <strategyName> → <outputPath>`。
   - 失败时捕获异常，打印错误并返回 false。

## 错误处理
- 若源文件不存在或解析失败，函数应返回 false 并调用 error 打印原因。
- 若写入失败（无权限、路径不存在等），捕获异常并返回 false。

## 验证方法
1. 单元级验证
   - 调用 exportStrategy('strategy-example', '/tmp/strategy-example.json') 并断言返回 true。
   - 检查 /tmp/strategy-example.json 内容为有效 JSON 且包含与源策略相同的字段（例如 description、agents）。

2. 文件级验证
   - 使用 jq 或 JSON 解析器加载输出文件：jq . /tmp/strategy-example.json，确保无语法错误。

3. 权限与异常验证
   - 试图导出到只读目录，断言 exportStrategy 返回 false 且打印错误信息。

## 示例
- 程序调用：
  - ManageStrategies.exportStrategy('strategy-foo', '/home/user/strategy-foo.json')
  - 成功输出：`已导出策略: strategy-foo → /home/user/strategy-foo.json`

## 参考实现要点 (来源: ManageStrategies.ts)
- 函数签名：exportStrategy(strategyName: string, outputPath: string): boolean
- 主要步骤：readStrategy -> writeJSONC -> success/error
- writeJSONC 使用 JSON.stringify(data, null, 2) 来格式化输出

## 附注
- 导出的文件为标准 JSON（不保留注释），便于在其它系统中导入。
- 不在此工作流中执行导入或验证目标系统兼容性。
