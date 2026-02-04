# StrategyManager 推荐引擎优化 - 实施指南

## 快速开始

### 第一步: 集成新组件

1. **复制新文件到项目** (已完成 ✅)
   - `Tools/KeywordWeightEngine.ts` - 关键词识别引擎
   - `Tools/ContextEnhancer.ts` - 上下文增强器
   - `tests/unit/Recommender.v2.test.ts` - 测试套件

2. **安装依赖** (如需要)

   ```bash
   bun install
   ```

3. **编译检查**
   ```bash
   bun run type-check
   ```

### 第二步: 运行测试

```bash
# 运行完整测试套件
bun test tests/unit/Recommender.v2.test.ts

# 运行特定测试
bun test tests/unit/Recommender.v2.test.ts -t "T1:"

# 运行所有推荐器测试
bun test tests/unit/Recommender*.test.ts
```

### 第三步: 集成到主推荐引擎

在 `Tools/Recommender.ts` 中添加:

```typescript
// 导入新组件
import KeywordWeightEngine from "./KeywordWeightEngine";
import ContextEnhancer, { type EnhancedContext } from "./ContextEnhancer";

// 在 SmartRecommender 类中添加
export class SmartRecommender {
  private strategies: StrategyMetadata[];
  private keywordEngine: KeywordWeightEngine;
  private contextEnhancer: ContextEnhancer;

  constructor(strategies: StrategyMetadata[]) {
    this.strategies = strategies;
    this.keywordEngine = new KeywordWeightEngine();
    this.contextEnhancer = new ContextEnhancer();
  }

  /**
   * 新方法: 增强版推荐 (V2)
   */
  recommendV2(context: EnhancedContext): Recommendation[] {
    // 使用新的推荐逻辑
    return this.strategies
      .map((strategy) => this.scoreStrategy(strategy, context))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }

  /**
   * 原方法保留: 自动升级上下文
   */
  recommend(context: RecommendationContext): Recommendation[] {
    // 升级上下文
    const enhanced = this.upgradeContext(context);
    return this.recommendV2(enhanced);
  }

  private upgradeContext(context: RecommendationContext): EnhancedContext {
    const enhanced: EnhancedContext = {
      ...context,
      budgetPhase: "mid",
      urgencyLevel: context.timeContext?.isUrgent ? 0.7 : 0.2,
      complexityScore: 0.5,
      scenarioFamiliarity: context.history ? 0.6 : 0,
    };
    return enhanced;
  }
}
```

### 第四步: 验证准确率提升

```bash
# 运行准确率基准测试
bun run tests/accuracy-benchmark.ts

# 对比结果 (预期 70% → 85%+)
```

---

## 使用示例

### 示例 1: 基础使用 (向后兼容)

```typescript
import { SmartRecommender } from "./Tools/Recommender";

const recommender = new SmartRecommender(strategies);

// 旧方式 - 自动升级
const recommendations = recommender.recommend({
  scenario: { type: "coding", priority: "balanced" },
  budget: { monthly: 1000, currentSpent: 500, alertThreshold: 0.8 },
});

console.log(recommendations[0].strategyName); // strategy-2-balanced
```

### 示例 2: 使用 V2 增强模式

```typescript
import { SmartRecommender } from "./Tools/Recommender";
import { ContextEnhancer } from "./Tools/ContextEnhancer";

const recommender = new SmartRecommender(strategies);
const enhancer = new ContextEnhancer();

// 从自然语言生成上下文
const rawDescription = "编程开发，需要快速反馈，预算有点紧";
const enhanced = enhancer.enhanceContext(rawDescription, {
  budget: { monthly: 1000, currentSpent: 800, alertThreshold: 0.8 },
});

// 使用 V2 推荐
const recommendations = recommender.recommendV2(enhanced);

console.log(recommendations[0].strategyName);
console.log(recommendations[0].reason); // 包含详细推荐理由
```

### 示例 3: 关键词引擎独立使用

```typescript
import KeywordWeightEngine from "./Tools/KeywordWeightEngine";

const engine = new KeywordWeightEngine();

// 场景识别
const scenarios = engine.identifyScenarios("深度编程分析");
console.log(scenarios.primary); // ["coding", 0.85]

// 优先级识别
const priority = engine.identifyPriority("质量最重要");
console.log(priority); // { priority: "quality", intensity: 0.4 }

// 复杂度计算
const complexity = engine.calculateComplexity("复杂的数据优化");
console.log(complexity); // 0.72
```

---

## 配置文件说明

### recommender-config.yaml 结构

```yaml
# 场景关键词配置
keywords:
  scenarios:
    coding:
      primary: ["编程", "代码", "开发", "coding", "development"]
      weight: 0.85 # 场景权重 (0-1)

  # 优先级关键词
  priorities:
    quality:
      keywords: ["质量", "完美", "quality", "best"]
      weight_override: 0.4 # 覆盖默认权重

  # 强度修饰词
  modifiers:
    非常: 1.4 # 强度倍数
    有点: 0.8 # 轻度倍数

# 权重调整规则
weight_adjustment:
  budget_urgency:
    threshold: 0.8
    cost_multiplier: 1.5 # 成本权重提升 50%
    quality_multiplier: 0.7 # 质量权重降低 30%
```

---

## 故障排除

### 问题 1: 推荐准确率没有提升

**症状**: 运行测试，准确率仍为 70%

**检查清单**:

1. ✅ 是否使用了 `recommendV2()` 而不是旧的 `recommend()`？
2. ✅ 是否传入了 `EnhancedContext` 而不是基础 `RecommendationContext`？
3. ✅ 关键词库是否完整？(检查 `KeywordWeightEngine.ts`)

**解决方案**:

```typescript
// ❌ 错误: 使用旧方法
const rec = recommender.recommend(context);

// ✅ 正确: 使用新方法
const enhanced = enhancer.enhanceContext(rawDescription, context);
const rec = recommender.recommendV2(enhanced);
```

### 问题 2: 场景识别失败

**症状**: `detectConditionalExpression()` 返回 null

**原因**: 输入文本格式不符合预期的正则表达式

**调试方法**:

```typescript
const engine = new KeywordWeightEngine();
const scenarios = engine.identifyScenarios("你的输入文本");
console.log(scenarios.primary); // 查看识别结果
console.log(scenarios.secondary); // 查看备选场景
```

### 问题 3: 权重调整不生效

**症状**: `budgetUrgency` 高但推荐策略没变化

**检查**:

```typescript
// 验证权重计算
const context: EnhancedContext = {
  budget: { monthly: 1000, currentSpent: 900, alertThreshold: 0.8 },
  budgetPhase: "late",
  budgetUrgency: 0.9, // 应该接近 1.0
};

// 检查 getAdaptiveWeights() 是否被调用
```

---

## 性能优化建议

### 1. 缓存关键词索引

```typescript
class CachedKeywordEngine extends KeywordWeightEngine {
  private cache = new Map<string, ScenarioScores>();

  identifyScenarios(description: string): ScenarioScores {
    if (this.cache.has(description)) {
      return this.cache.get(description)!;
    }

    const result = super.identifyScenarios(description);
    this.cache.set(description, result);
    return result;
  }

  clearCache() {
    this.cache.clear();
  }
}
```

### 2. 异步分词 (对大量文本)

```typescript
async function enhanceContextAsync(
  rawDescription: string,
  context?: RecommendationContext,
): Promise<EnhancedContext> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const enhancer = new ContextEnhancer();
      resolve(enhancer.enhanceContext(rawDescription, context));
    }, 0);
  });
}
```

### 3. 批量推荐优化

```typescript
function recommendBatch(
  contexts: EnhancedContext[],
  recommender: SmartRecommender,
): Recommendation[][] {
  return contexts.map((ctx) => recommender.recommendV2(ctx));
}
```

---

## 扩展指南

### 添加新场景类型

1. 在 `KeywordWeightEngine.ts` 中更新配置:

```typescript
const DEFAULT_CONFIG: KeywordWeightConfig = {
  scenarios: {
    // 添加新场景
    myCustomScenario: {
      primary: ["关键词1", "关键词2", "keyword1"],
      weight: 0.8,
    },
  },
};
```

2. 在 `Recommender.ts` 中更新场景映射:

```typescript
const SCENARIO_MAPPING: Record<ScenarioType, string[]> = {
  myCustomScenario: ["strategy-2-balanced", "strategy-1-performance"],
};
```

### 添加自定义权重规则

```typescript
class CustomRecommender extends SmartRecommender {
  private getAdaptiveWeights(context: EnhancedContext): Record<string, number> {
    const base = super.getAdaptiveWeights(context);

    // 自定义规则
    if (context.isRecurring) {
      base.history *= 2.0; // 重复任务更依赖历史
    }

    return base;
  }
}
```

---

## 监控和日志

### 添加调试日志

```typescript
class DebugRecommender extends SmartRecommender {
  recommendV2(context: EnhancedContext): Recommendation[] {
    console.log("=== Recommendation Debug ===");
    console.log("Input:", context);
    console.log("Budget Phase:", context.budgetPhase);
    console.log("Urgency Level:", context.urgencyLevel);

    const results = super.recommendV2(context);

    console.log("Top Recommendation:", results[0]);
    console.log("========================");

    return results;
  }
}
```

### 收集准确率指标

```typescript
interface AccuracyMetric {
  timestamp: Date;
  input: string;
  recommendedStrategy: string;
  userSelected: string;
  isCorrect: boolean;
  confidence: number;
}

class MetricsCollector {
  metrics: AccuracyMetric[] = [];

  recordResult(
    input: string,
    recommended: string,
    selected: string,
    confidence: number,
  ) {
    this.metrics.push({
      timestamp: new Date(),
      input,
      recommendedStrategy: recommended,
      userSelected: selected,
      isCorrect: recommended === selected,
      confidence,
    });
  }

  getAccuracy(): number {
    const correct = this.metrics.filter((m) => m.isCorrect).length;
    return correct / this.metrics.length;
  }

  getAverageConfidence(): number {
    const sum = this.metrics.reduce((acc, m) => acc + m.confidence, 0);
    return sum / this.metrics.length;
  }
}
```

---

## 提交清单

在提交代码前，确保以下项目都已完成:

- [ ] 所有单元测试通过 (`bun test`)
- [ ] 类型检查无错误 (`bun run type-check`)
- [ ] 准确率基准测试显示 ≥ 85% 准确率
- [ ] 向后兼容性验证通过
- [ ] 性能基准 (推荐延迟 < 100ms)
- [ ] 代码审查通过
- [ ] 文档已更新
- [ ] 变更日志已更新 (`CHANGELOG.md`)

---

## 常见问题解答

**Q: 升级到 V2 需要修改现有代码吗?**
A: 不需要。旧的 `recommend()` 方法会自动升级上下文并调用 V2 逻辑。完全向后兼容。

**Q: 可以同时运行 V1 和 V2 吗?**
A: 可以。V1 保存在原始方法中，V2 在新方法 `recommendV2()` 中。可以用标志开关。

**Q: 如何添加新的关键词?**
A: 编辑 `KeywordWeightEngine.ts` 中的 `DEFAULT_CONFIG` 对象，添加到相应的场景或优先级。

**Q: 支持多语言吗?**
A: 当前支持中英混合。可以扩展 `tokenize()` 和关键词库来支持其他语言。

---

## 下一步

1. **数据收集阶段** (2-4 周)
   - 收集用户推荐反馈
   - 记录用户选择是否匹配推荐
   - 构建更完整的关键词库

2. **迭代优化** (持续)
   - 根据反馈调整权重配置
   - 改进关键词库
   - 添加新的识别规则

3. **高级功能** (后续)
   - 机器学习模型 (从用户反馈学习)
   - 实时权重自适应
   - 跨用户推荐（协作过滤）

---

**文档版本**: 1.0
**最后更新**: 2026-02-05
**维护者**: StrategyManager Team
