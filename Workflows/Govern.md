# Autonomous Governance Workflow

## 触发条件
- "govern strategy" / "auto rebalance": 启动自主治理引擎，自动分析当前策略健康度并决定是否重平衡。

## 目标
- 实现无人值守的策略优化。
- 当当前使用的模型出现大面积降级（如 429/503）时，自动热切换到最优替代策略。

## 执行步骤

### 1. 现状评估
1. 获取当前激活的策略名称。
2. 调用 `handleGovernance()` 进入治理流程。
3. 提取策略中涉及的所有模型，并从 `HealthManager` 获取其实时健康分。
4. 计算整体健康度。如果平均分 > 0.7，流程结束（提示正常）。

### 2. 智能重平衡 (Re-balancing)
1. 如果健康度低于阈值，调用 `recommendStrategySmart` 生成替代方案。
2. 推荐算法会自动考虑：
    - 当前模型的健康分（排除 Degraded/Disabled）。
    - 历史成功率与延迟（由 `PerformanceMonitor` 提供）。
    - 剩余配额（由 `UsageSync` 提供）。

### 3. 自动切换
1. 如果发现得分更高的策略且不等于当前策略。
2. 系统自动执行 `switchStrategy` 进行热切换。
3. 输出治理报告，记录切换原因及预期收益。

## 自动化闭环
- **Error Capture**: `UsageSync` 在运行时会自动上报故障，实时更新治理引擎的输入数据。
- **Auto-Recovery**: 被禁用的节点在 TTL 到期后自动恢复，治理引擎会在下一次扫描时重新评估其可用性。

## 相关文件
- `Tools/ManageStrategies.ts`: 治理引擎主逻辑
- `Tools/HealthManager.ts`: 健康分计算
- `Tools/Recommender.ts`: 权重决策
- `Tools/PerformanceMonitor.ts`: 性能基准数据
