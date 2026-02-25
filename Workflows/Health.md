# Health Check & Circuit Breaker Workflow

## 触发条件
- "check health" / "provider status": 检查所有厂商的连通性和健康状况。
- "disable <target>": 手动禁用某个厂商 (provider) 或模型 (model)。
- "enable <target>": 重新启用被禁用的厂商或模型。

## 目标
- 实时探测厂商服务是否可用。
- 在服务出现故障或限额时，手动隔离（熔断）相关节点，防止策略执行失败。

## 执行步骤

### 1. 主动健康检查 (Active Check)
1. 调用 `ActiveValidator.checkAll()`。
2. 遍历支持的厂商（Anthropic, OpenAI, Gemini, 智谱, DeepSeek, SiliconFlow）。
3. 输出健康度报告表格，包含 Status (Healthy/Degraded/Error) 和详细信息。
4. 显示当前手动禁用的列表。

### 2. 手动禁用 (Disable)
1. 接收目标名称（如 `openai` 或 `openai/gpt-4o`）及可选原因。
2. 调用 `HealthManager.disable(target, type, reason)`。
3. 将状态持久化至 `health-status.json`。
4. 提示禁用成功。

### 3. 手动启用 (Enable)
1. 接收目标名称。
2. 调用 `HealthManager.enable(target, type)`。
3. 从禁用列表中移除并提示成功。

## 自动化集成
- **Validate**: 验证流程现在会自动检查 `HealthManager` 状态，如果策略包含已禁用的模型，会发出 Warning。
- **Recommender**: (规划中) 推荐逻辑将自动过滤掉健康度为 Degraded 的节点。

## 相关文件
- `Tools/HealthManager.ts`: 状态管理
- `Tools/ActiveValidator.ts`: 探测逻辑
- `Tools/ManageStrategies.ts`: CLI 入口
