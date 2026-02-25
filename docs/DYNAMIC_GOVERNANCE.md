# 动态治理演进路线图 (Dynamic Governance Roadmap)

## Phase 1: 增强型可观测性与手动控制 (当前阶段)
- [x] **Circuit Breaker (断路器)**: 实现 `disable`/`enable` 命令，手动隔离故障节点。
- [x] **Active Probe (主动探测)**: 实现 `check-health` 命令，提供连通性审计。
- [x] **Health State Management**: 建立持久化健康状态文件，供验证器读取。

## Phase 2: 自动化故障检测与响应 (短期目标)
- [ ] **Auto-Detection**: 在 `UsageSync` 或 `ManageStrategies` 运行期间，如果检测到特定的 API 错误（如 429 Rate Limit, 503 Overloaded），自动在健康状态中标记该模型。
- [ ] **Smart Fallback**: 修改 `Recommender` 算法，在生成推荐策略时，自动避开健康状态为 "Degraded" 或 "Disabled" 的模型。
- [ ] **Health Notification**: 当模型状态发生变更时，通过系统通知（如 Discord/Slack Webhook）告知管理员。

## Phase 3: 闭环动态优化 (长期愿景)
- [ ] **Performance Benchmarking**: 记录不同模型在实际任务中的响应耗时和成功率。
- [ ] **Autonomous Re-balancing**: 系统根据实时成本和实时性能表现，自动切换生产环境中的 `Strategy`。例如：当 `smart` 策略中的主流模型全线拥堵时，自动热切换至 `balanced` 策略。
- [ ] **Predictive Governance**: 基于历史数据预测用量峰值，提前下发“限流策略”。
