# Validate Strategy Workflow

## 触发条件
- 手动触发：在导入、切换或编辑策略配置后由用户或脚本调用验证流程。
- 自动触发：导入策略（importStrategy）或切换策略（switchStrategy）流程中会自动调用验证。

## 目标
确保策略配置符合格式和字段约束，避免在切换/导入时出现运行时错误或不可用的 agent 配置。

## 执行步骤
1. 接收策略配置对象（JSON/JSONC）或策略名称（strategyName）。
2. 如果输入为文件名，读取对应策略文件（readStrategy）。
3. 执行 JSON 格式解析（支持 JSONC：允许注释），若解析失败则返回错误并终止。
4. 验证必需字段：
   - description: 必需，类型为字符串。
5. 验证 agents 字段（可选）：
   - 对于每个 agent，必须存在 model 字段（非空字符串）。
6. 验证 categories 字段（可选）：
   - 对于每个 category，必须存在 model 字段（非空字符串）。
7. 收集所有验证错误并输出详细错误列表。
8. 若无错误，返回验证通过（true）；否则返回验证失败（false）。

## 验证方法（参考实现细节）
- 解析：使用支持注释的 JSON 解析（JSONC）。示例中使用 readJSONC(filePath) 实现。
- 必需字段检查：检查 config.description 是否存在且非空。
- agents 字段校验：遍历 Object.entries(config.agents)，对每个 agentConfig 检查 agentConfig.model 是否存在。
- categories 字段校验：遍历 Object.entries(config.categories)，对每个 categoryConfig 检查 categoryConfig.model 是否存在。
- 错误报告：将所有错误收集到数组中，一次性输出（便于用户一次修复多处问题）。

## 验证失败处理
- 在导入（importStrategy）或切换（switchStrategy）流程中，若验证失败应终止后续操作并打印错误信息。
- 建议返回清晰的错误提示，示例格式：
  - 缺少 description 字段
  - agent <name> 缺少 model 字段
  - category <name> 缺少 model 字段

## 验证通过标准
- 无任何验证错误。
- 返回 true 并允许上层流程继续（导入、切换等）。

## 示例
- 验证函数签名（参考）：
  - validateStrategy(config: StrategyConfig): boolean
- 验证策略文件：
  - validateStrategyFile(strategyName: string): boolean // 读取文件后调用 validateStrategy

## 相关文件
- tools/ManageStrategies.ts — 包含 validateStrategy 与 validateStrategyFile 的实现（参考本工作流）。

## 注意事项
- 验证流程包含静态 Schema 检查与 **健康状态 (Health Status)** 校验。
- 如果模型或其所属厂商在 `HealthManager` 中被标记为禁用，验证将抛出 Warning。
- 在未来可扩展：

- 在未来可扩展：
  - 增加 schema 验证（例如使用 JSON Schema）
  - 对 model 名称进行白名单或在线可用性检测
