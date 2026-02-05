# 智能策略推荐工作流 (Recommend)

## 目的

描述 StrategyManager 中的智能推荐（recommendStrategy）流程，定义触发条件、执行步骤与验证方法，供运营与开发参考和调试。

## 触发条件

- 用户请求：显式调用推荐接口 / 命令（例如：用户选择“推荐策略”）
- 定时任务：周期性评估（例如：每日/每小时）
- 配置变更：策略集合、权重或使用场景发生变更时
- 运行时信号：检测到使用模式突变（高频使用、低延迟需求增加、冷启动等）
- 动态生成：作为动态策略生成的基础

## 输入数据

### RecommendationInput 接口

```typescript
interface RecommendationInput {
  description: string; // 场景描述
  priority?: Priority; // 优先级 (quality|cost|speed|balanced)
  budget?: BudgetConfig; // 预算配置
  history?: HistoryData; // 历史使用数据
  quotaStatus?: QuotaStatus[]; // 配额状态
  includeDynamic?: boolean; // 是否包含动态策略
}
```

### RecommendationContext 接口

```typescript
interface RecommendationContext {
  scenario?: {
    // 场景信息
    type: ScenarioType; // 场景类型
    priority?: Priority; // 优先级
  };
  budget?: BudgetConfig; // 预算配置
  history?: HistoryData; // 历史数据
  quotaStatus?: QuotaStatus[]; // 配额状态
}
```

## 输出

### Recommendation 接口

```typescript
interface Recommendation {
  strategyName: string; // 推荐的策略名称
  reason: string; // 推荐理由
  score: number; // 匹配分数 (0-100)
  alternatives?: Array<{
    // 备选策略
    strategyName: string;
    reason: string;
    score: number;
  }>;
}
```

- 输出 top-N 策略与每项的评分构成（为什么被选中）
- 记录推荐反馈（推荐 → 实际选择）
- 若启用，生成迁移/回滚建议与风险说明

5. 应用与监控（可选）
   - 将推荐应用到在线流量（灰度/全量）或导出为配置变更
   - 创建监控看板与警报，以观测推荐效果

## 验证方法

- 静态验证：检查输出格式、包含必要字段（strategyId, score, reason）
- 回放测试：使用历史数据回放推荐算法，校验与已知最佳策略的匹配度
- A/B 测试：将推荐策略在一部分流量上试验，比较关键指标（延迟、错误率、转化率）
- 转化漏斗：推荐 → 选择的采纳率
- 时间分桶：按日/周/月观察采纳率趋势
- 指标回归检测：应用后 24/72 小时内检测是否出现性能/稳定性回退

## 错误处理与降级

- 若数据不足：使用默认策略或基线策略并记录原因
- 若评分结果不可信（高方差/低置信度）：返回候选集并建议人工复核
- 应用失败回滚到最近的稳定策略，并触发告警

## 日志与可观测性

- 每次推荐记录请求上下文、输入特征、候选策略得分与最终输出
- 为关键步骤添加指标：recommendationLatency、candidatesEvaluated、recommendationConfidence

## 参考实现提示（基于 ManageStrategies.ts 的 recommendStrategy）

- recommendStrategy 大致行为：
  - 接收 scene 与 usage 信息
  - 过滤不满足条件的策略集合
  - 基于多因子（匹配度、性能、成本）计算分数
  - 返回排序后的推荐结果以及解释信息

备注：请参考 skills/StrategyManager/Tools/ManageStrategies.ts 中 recommendStrategy 的实际实现以获取字段名与评分细节（特征权重、阈值）。

## 变更记录

- 2026-02-02: 创建 Recommend.md，描述推荐流程与验证方法。
