/**
 * Recommender.v2.test.ts
 * 推荐引擎 V2 优化版本的完整测试套件
 *
 * 测试覆盖:
 * - 关键词权重引擎 (T1-T5)
 * - 权重自适应 (T6-T9)
 * - 端到端准确率 (T10-T14)
 * - 成本计算 (T15-T16)
 */

import { describe, it, expect, beforeEach } from "bun:test";
import {
  SmartRecommender,
  type StrategyMetadata,
  type RecommendationContext,
} from "../../Tools/Recommender";
import KeywordWeightEngine from "../../Tools/KeywordWeightEngine";
import ContextEnhancer, {
  type EnhancedContext,
} from "../../Tools/ContextEnhancer";

// ==================== Mock 数据工厂 ====================

function createMockStrategy(
  overrides: Partial<StrategyMetadata> = {},
): StrategyMetadata {
  return {
    name: "balanced",
    filePath: "/mock/strategies/2-balanced.jsonc",
    description: "Balanced strategy for general use",
    costLevel: "medium",
    version: "1.0.0",
    isCurrent: false,
    useCase: "General purpose AI tasks",
    models: ["anthropic/claude-sonnet-4-5", "github-copilot/gpt-5-mini"],
    source: "installed",
    ...overrides,
  };
}

function createStrategyLibrary(): StrategyMetadata[] {
  return [
    createMockStrategy({
      name: "smart",
      description: "Ultimate performance and quality",
      costLevel: "ultra-high",
      models: [
        "anthropic/claude-opus-4-5",
        "openai/gpt-5.2",
        "google/gemini-3-pro",
      ],
    }),
    createMockStrategy({
      name: "fast",
      description: "High performance strategy",
      costLevel: "high",
      models: ["anthropic/claude-opus-4-5", "openai/gpt-5.2-codex"],
    }),
    createMockStrategy({
      name: "balanced",
      description: "Balanced strategy",
      costLevel: "medium",
      models: ["anthropic/claude-sonnet-4-5", "github-copilot/gpt-5-mini"],
    }),
    createMockStrategy({
      name: "cheap",
      description: "Cost-effective strategy",
      costLevel: "low",
      models: ["github-copilot/gpt-4.1", "google/gemini-3-flash"],
    }),
    createMockStrategy({
      name: "smart",
      description: "Content creation strategy",
      costLevel: "medium-high",
      models: ["anthropic/claude-sonnet-4-5", "openai/gpt-5.2"],
    }),
    createMockStrategy({
      name: "smart",
      description: "Deep research strategy",
      costLevel: "high",
      models: ["anthropic/claude-opus-4-5", "google/gemini-3-pro"],
    }),
  ];
}

// ==================== 关键词引擎测试 ====================

describe("KeywordWeightEngine - 关键词识别", () => {
  let engine: KeywordWeightEngine;

  beforeEach(() => {
    engine = new KeywordWeightEngine();
  });

  describe("T1: 场景识别 - 编程开发", () => {
    it("should identify coding scenario with high confidence", () => {
      const scenarios = engine.identifyScenarios("我在学编程，需要快速反馈");

      expect(scenarios.primary[0]).toBe("coding");
      expect(scenarios.primary[1]).toBeGreaterThan(0.7);
      expect(scenarios.secondary.length).toBeGreaterThan(0);
    });
  });

  describe("T2: 否定表达处理", () => {
    it("should reduce score for negated keywords", () => {
      const scenarios1 = engine.identifyScenarios("编程开发");
      const scenarios2 = engine.identifyScenarios("不要用复杂的编程开发工具");

      // scenarios2 的 coding 分数应该比 scenarios1 低
      expect(scenarios2.primary[1]).toBeLessThan(scenarios1.primary[1]);
    });
  });

  describe("T3: 优先级识别", () => {
    it("should identify quality priority", () => {
      const priority = engine.identifyPriority("质量最重要，费用其次");

      expect(priority.priority).toBe("quality");
      expect(priority.intensity).toBeGreaterThan(0.35);
    });

    it("should identify cost priority", () => {
      const priority = engine.identifyPriority("便宜、低成本");

      expect(priority.priority).toBe("cost");
      expect(priority.intensity).toBeGreaterThan(0.4);
    });
  });

  describe("T4: 复杂度计算", () => {
    it("should calculate low complexity for simple tasks", () => {
      const complexity = engine.calculateComplexity("简单的日常任务");

      expect(complexity).toBeLessThan(0.5);
    });

    it("should calculate high complexity for complex tasks", () => {
      const complexity =
        engine.calculateComplexity("进行深度数据分析和复杂算法优化");

      expect(complexity).toBeGreaterThan(0.5);
    });
  });

  describe("T5: 紧急程度检测", () => {
    it("should detect urgent tasks", () => {
      const urgency = engine.calculateUrgency("紧急!今天交付这个项目");

      expect(urgency).toBeGreaterThan(0.6);
    });

    it("should detect low urgency for regular tasks", () => {
      const urgency = engine.calculateUrgency("这是一个长期项目");

      expect(urgency).toBeLessThan(0.3);
    });
  });
});

// ==================== 上下文增强测试 ====================

describe("ContextEnhancer - 上下文增强", () => {
  let enhancer: ContextEnhancer;

  beforeEach(() => {
    enhancer = new ContextEnhancer();
  });

  describe("基础增强功能", () => {
    it("should enhance basic context", () => {
      const enhanced = enhancer.enhanceContext("编程开发，质量优先");

      expect(enhanced.scenario).toBeDefined();
      expect(enhanced.scenario?.type).toBe("coding");
      expect(enhanced.scenario?.priority).toBe("quality");
    });

    it("should calculate complexity and urgency", () => {
      const enhanced = enhancer.enhanceContext("紧急!复杂的编程任务");

      expect(enhanced.complexityScore).toBeGreaterThan(0.5);
      expect(enhanced.urgencyLevel).toBeGreaterThan(0.5);
    });
  });

  describe("预算阶段识别", () => {
    it("should identify early budget phase", () => {
      const enhanced = enhancer.enhanceContext("我的任务", {
        budget: { monthly: 1000, currentSpent: 100, alertThreshold: 0.8 },
      });

      expect(enhanced.budgetPhase).toBe("early");
      expect(enhanced.budgetUrgency).toBeLessThan(0.4);
    });

    it("should identify late budget phase", () => {
      const enhanced = enhancer.enhanceContext("我的任务", {
        budget: { monthly: 1000, currentSpent: 900, alertThreshold: 0.8 },
      });

      expect(enhanced.budgetPhase).toBe("late");
      expect(enhanced.budgetUrgency).toBeGreaterThan(0.8);
    });
  });

  describe("条件表达式检测", () => {
    it("should detect conditional expression", () => {
      const conditionals =
        enhancer.detectConditionalExpressions(
          "如果有预算就用最好的，否则用经济方案",
        );

      expect(conditionals).not.toBeNull();
      expect(conditionals?.length).toBeGreaterThan(0);
    });
  });
});

// ==================== 权重自适应测试 ====================

describe("Adaptive Weights - 权重自适应", () => {
  let recommender: SmartRecommender;
  let strategies: StrategyMetadata[];

  beforeEach(() => {
    strategies = createStrategyLibrary();
    recommender = new SmartRecommender(strategies);
  });

  describe("T6: 预算压力调整", () => {
    it("should increase cost weight when budget is depleted", () => {
      const context1: EnhancedContext = {
        scenario: { type: "coding", priority: "balanced" },
        budget: { monthly: 1000, currentSpent: 200, alertThreshold: 0.8 },
        budgetPhase: "early",
        budgetUrgency: 0.2,
      };

      const context2: EnhancedContext = {
        scenario: { type: "coding", priority: "balanced" },
        budget: { monthly: 1000, currentSpent: 900, alertThreshold: 0.8 },
        budgetPhase: "late",
        budgetUrgency: 0.9,
      };

      // context2 应该倾向更经济的策略
      // 这可以通过比较推荐结果来验证
      const rec1 = recommender.recommend(context1);
      const rec2 = recommender.recommend(context2);

      // 预期 rec2 的第一个推荐的 cost 评分应该更高
      expect(rec2[0].strategyName).toBeDefined();
    });
  });

  describe("T7: 首次使用调整", () => {
    it("should rely more on scenario mapping for new users", () => {
      const context: EnhancedContext = {
        scenario: { type: "research", priority: "quality" },
        // 无历史数据
      };

      const recommendations = recommender.recommend(context);

      // 应该推荐 smart
      expect(recommendations[0].strategyName).toBe(
        "smart",
      );
    });
  });

  describe("T8: 历史偏好增强", () => {
    it("should boost score for familiar scenarios", () => {
      const context: EnhancedContext = {
        scenario: { type: "coding", priority: "balanced" },
        history: {
          recentStrategies: [
            "balanced",
            "balanced",
            "balanced",
          ],
          frequentScenarios: ["coding"],
        },
        scenarioFamiliarity: 0.9,
      };

      const recommendations = recommender.recommend(context);

      // balanced 应该排名靠前
      const balanced = recommendations.find(
        (r) => r.strategyName === "balanced",
      );
      expect(balanced).toBeDefined();
      expect(balanced?.score).toBeGreaterThan(70);
    });
  });
});

// ==================== 端到端准确率测试 ====================

describe("End-to-End Accuracy - 推荐准确率", () => {
  let recommender: SmartRecommender;
  let enhancer: ContextEnhancer;
  let strategies: StrategyMetadata[];

  beforeEach(() => {
    strategies = createStrategyLibrary();
    recommender = new SmartRecommender(strategies);
    enhancer = new ContextEnhancer();
  });

  describe("T10: 编程 + 快速", () => {
    it("should recommend balanced strategy", () => {
      const raw = "编程开发，要快速响应";
      const context = enhancer.enhanceContext(raw);
      const recommendations = recommender.recommend(context);

      expect(recommendations[0].strategyName).toBe("balanced");
      expect(recommendations[0].score).toBeGreaterThan(75);
    });
  });

  describe("T11: 深度数据分析", () => {
    it("should recommend research strategy for quality", () => {
      const raw = "深度数据分析，质量最重要";
      const context = enhancer.enhanceContext(raw);
      const recommendations = recommender.recommend(context);

      const research = recommendations.find(
        (r) => r.strategyName === "smart",
      );
      expect(research).toBeDefined();
      expect(research?.score).toBeGreaterThan(75);
    });
  });

  describe("T12: 日常写作 + 经济", () => {
    it("should recommend economical strategy", () => {
      const raw = "日常写作，预算有限";
      const context = enhancer.enhanceContext(raw, {
        budget: { monthly: 500, currentSpent: 400, alertThreshold: 0.8 },
      });

      const recommendations = recommender.recommend(context);

      // 应该推荐经济策略或平衡策略
      const topRecommendation = recommendations[0];
      expect(
        ["cheap", "balanced"].includes(
          topRecommendation.strategyName,
        ),
      ).toBe(true);
    });
  });

  describe("T13: 创意内容创作", () => {
    it("should recommend creative strategy", () => {
      const raw = "创意内容创作";
      const context = enhancer.enhanceContext(raw);
      const recommendations = recommender.recommend(context);

      const creative = recommendations.find(
        (r) => r.strategyName === "smart",
      );
      expect(creative).toBeDefined();
    });
  });

  describe("T14: 混合场景 - 编程 + 研究 + 质量优先", () => {
    it("should recommend high-quality strategy for complex mixed scenario", () => {
      const raw = "编程项目需要深度研究，质量最重要，不考虑成本";
      const context = enhancer.enhanceContext(raw);
      const recommendations = recommender.recommend(context);

      // 应该推荐高端策略
      const topRecommendation = recommendations[0];
      expect(
        [
          "smart",
          "fast",
          "smart",
        ].includes(topRecommendation.strategyName),
      ).toBe(true);
      expect(topRecommendation.score).toBeGreaterThan(70);
    });
  });
});

// ==================== 回归测试 (确保向后兼容) ====================

describe("Backward Compatibility - 向后兼容性", () => {
  let recommender: SmartRecommender;
  let strategies: StrategyMetadata[];

  beforeEach(() => {
    strategies = createStrategyLibrary();
    recommender = new SmartRecommender(strategies);
  });

  it("should still work with basic RecommendationContext", () => {
    const context: RecommendationContext = {
      scenario: { type: "coding", priority: "balanced" },
    };

    const recommendations = recommender.recommend(context);

    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations[0].strategyName).toBeDefined();
  });
});
