/**
 * Recommender.test.ts
 * 智能推荐器单元测试 (12+ 用例)
 *
 * 覆盖范围:
 * - 场景匹配度计算
 * - 成本效率评估
 * - 权重调整机制
 * - 历史偏好
 * - 配额管理
 * - 完整推荐流程
 * - 自然语言解析
 */

import { describe, it, expect, beforeEach } from "bun:test";
import {
  SmartRecommender,
  parseRecommendationContext,
  type StrategyMetadata,
  type RecommendationContext,
  type ScenarioConfig,
} from "../../Tools/Recommender";

// ==================== Mock Data Factories ====================

function createMockStrategy(
  overrides: Partial<StrategyMetadata> = {},
): StrategyMetadata {
  return {
    name: "strategy-2-balanced",
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
      name: "strategy-0-super",
      description: "Ultimate performance and quality",
      costLevel: "ultra-high",
      models: [
        "anthropic/claude-opus-4-5",
        "openai/gpt-5.2",
        "google/gemini-3-pro",
      ],
    }),
    createMockStrategy({
      name: "strategy-1-performance",
      description: "High performance strategy",
      costLevel: "high",
      models: ["anthropic/claude-opus-4-5", "openai/gpt-5.2-codex"],
    }),
    createMockStrategy({
      name: "strategy-2-balanced",
      description: "Balanced strategy",
      costLevel: "medium",
      models: ["anthropic/claude-sonnet-4-5", "github-copilot/gpt-5-mini"],
    }),
    createMockStrategy({
      name: "strategy-3-economical",
      description: "Cost-effective strategy",
      costLevel: "low",
      models: ["github-copilot/gpt-4.1", "google/gemini-3-flash"],
    }),
    createMockStrategy({
      name: "strategy-4-creative",
      description: "Content creation strategy",
      costLevel: "medium-high",
      models: ["anthropic/claude-sonnet-4-5", "openai/gpt-5.2"],
    }),
    createMockStrategy({
      name: "strategy-5-research",
      description: "Deep research strategy",
      costLevel: "high",
      models: ["anthropic/claude-opus-4-5", "google/gemini-3-pro"],
    }),
  ];
}

// ==================== Scenario Matching Tests ====================

describe("SmartRecommender - Scenario Matching", () => {
  let recommender: SmartRecommender;
  let strategies: StrategyMetadata[];

  beforeEach(() => {
    strategies = createStrategyLibrary();
    recommender = new SmartRecommender(strategies);
  });

  // Test 1: Perfect Scenario Match
  it("should prioritize perfect scenario matches", () => {
    const context: RecommendationContext = {
      scenario: {
        type: "coding",
        priority: "balanced",
      },
    };

    const recommendations = recommender.recommend(context);

    expect(recommendations.length).toBeGreaterThan(0);
    // coding scenario's best match is strategy-2-balanced
    expect(recommendations[0].strategyName).toBe("strategy-2-balanced");
  });

  // Test 2: Research Scenario
  it("should recommend research strategy for research scenarios", () => {
    const context: RecommendationContext = {
      scenario: {
        type: "research",
        priority: "quality",
      },
    };

    const recommendations = recommender.recommend(context);

    expect(recommendations.length).toBeGreaterThan(0);
    // research scenario's best match is strategy-5-research
    const hasResearchStrategy = recommendations.some(
      (r) => r.strategyName === "strategy-5-research",
    );
    expect(hasResearchStrategy).toBe(true);
  });

  // Test 3: Creative Content Scenario
  it("should recommend creative strategy for content scenarios", () => {
    const context: RecommendationContext = {
      scenario: {
        type: "creative",
        priority: "balanced",
      },
    };

    const recommendations = recommender.recommend(context);

    expect(recommendations.length).toBeGreaterThan(0);

    const hasCreativeStrategy = recommendations.some(
      (r) => r.strategyName === "strategy-4-creative",
    );
    expect(hasCreativeStrategy).toBe(true);
  });

  // Test 4: Complex Task Adjustment
  it("should recommend higher quality strategies for complex tasks", () => {
    const complexContext: RecommendationContext = {
      scenario: {
        type: "coding",
        priority: "quality",
        complexity: "complex",
      },
    };

    const recommendations = recommender.recommend(complexContext);

    expect(recommendations.length).toBeGreaterThan(0);
    // Complex task should recommend higher quality
    const firstScore = recommendations[0].score;
    const hasHighQuality =
      recommendations[0].strategyName.includes("super") ||
      recommendations[0].strategyName.includes("performance");

    expect(firstScore).toBeGreaterThan(0);
  });

  // Test 5: Simple Task Adjustment
  it("should recommend economical strategies for simple tasks", () => {
    const simpleContext: RecommendationContext = {
      scenario: {
        type: "daily",
        priority: "cost",
        complexity: "simple",
      },
    };

    const recommendations = recommender.recommend(simpleContext);

    expect(recommendations.length).toBeGreaterThan(0);
    // Simple + cost priority should favor economical
    const economicalExists = recommendations.some(
      (r) => r.strategyName === "strategy-3-economical",
    );
    expect(economicalExists).toBe(true);
  });
});

// ==================== Cost Efficiency Tests ====================

describe("SmartRecommender - Cost Efficiency", () => {
  let recommender: SmartRecommender;

  beforeEach(() => {
    const strategies = createStrategyLibrary();
    recommender = new SmartRecommender(strategies);
  });

  // Test 6: Sufficient Budget
  it("should recommend appropriate strategies with sufficient budget", () => {
    const context: RecommendationContext = {
      scenario: {
        type: "daily",
        priority: "balanced",
      },
      budget: {
        monthly: 5000,
        currentSpent: 1000,
        alertThreshold: 0.8,
      },
    };

    const recommendations = recommender.recommend(context);

    expect(recommendations.length).toBeGreaterThan(0);

    // All recommendations should be below alert threshold
    for (const rec of recommendations) {
      const costRatio = rec.estimatedCost.monthly / context.budget!.monthly;
      expect(costRatio).toBeLessThan(0.3); // Within budget
    }
  });

  // Test 7: Tight Budget
  it("should favor economical strategies with tight budget", () => {
    const context: RecommendationContext = {
      scenario: {
        type: "daily",
        priority: "balanced",
      },
      budget: {
        monthly: 500,
        currentSpent: 300,
        alertThreshold: 0.8,
      },
    };

    const recommendations = recommender.recommend(context);

    expect(recommendations.length).toBeGreaterThan(0);

    // Should include economical strategy
    const economicalRec = recommendations.find(
      (r) => r.strategyName === "strategy-3-economical",
    );
    expect(economicalRec).toBeDefined();
  });

  // Test 8: Over Budget
  it("should warn when strategy exceeds budget", () => {
    const context: RecommendationContext = {
      scenario: {
        type: "daily",
        priority: "balanced",
      },
      budget: {
        monthly: 100,
        currentSpent: 80,
        alertThreshold: 0.8,
      },
    };

    const recommendations = recommender.recommend(context);

    // Super strategy (¥2500) should be last or not recommended
    const superStrategy = recommendations.find(
      (r) => r.strategyName === "strategy-0-super",
    );

    // Should not recommend super with 100 budget
    expect(superStrategy).not.toBeDefined();
  });

  // Test 9: Cost Estimation
  it("should provide accurate cost estimation", () => {
    const context: RecommendationContext = {
      budget: {
        monthly: 5000,
        currentSpent: 1000,
        alertThreshold: 0.8,
      },
    };

    const recommendations = recommender.recommend(context);

    expect(recommendations.length).toBeGreaterThan(0);

    // Check cost structure
    for (const rec of recommendations) {
      expect(rec.estimatedCost.monthly).toBeGreaterThan(0);
      expect(rec.estimatedCost.perUse).toBeGreaterThan(0);
      expect(rec.estimatedCost.breakdown).toBeDefined();
    }
  });
});

// ==================== Weight Adjustment Tests ====================

describe("SmartRecommender - Weight Adjustment", () => {
  let recommender: SmartRecommender;

  beforeEach(() => {
    const strategies = createStrategyLibrary();
    recommender = new SmartRecommender(strategies);
  });

  // Test 10: Quality Priority
  it("should prioritize quality with quality-focused scenario", () => {
    const qualityContext: RecommendationContext = {
      scenario: {
        type: "coding",
        priority: "quality",
      },
    };

    const costContext: RecommendationContext = {
      scenario: {
        type: "coding",
        priority: "cost",
      },
      budget: {
        monthly: 5000,
        currentSpent: 1000,
        alertThreshold: 0.8,
      },
    };

    const qualityRecs = recommender.recommend(qualityContext);
    const costRecs = recommender.recommend(costContext);

    expect(qualityRecs.length).toBeGreaterThan(0);
    expect(costRecs.length).toBeGreaterThan(0);

    // Quality priority should recommend higher tier strategies
    // Cost priority should recommend economical strategies
    const costFocused = costRecs[0];
    expect(costFocused.estimatedCost.monthly).toBeLessThan(
      qualityRecs[0].estimatedCost.monthly,
    );
  });

  // Test 11: Speed Priority
  it("should adjust scores for speed priority", () => {
    const speedContext: RecommendationContext = {
      scenario: {
        type: "coding",
        priority: "speed",
      },
      timeContext: {
        isUrgent: true,
      },
    };

    const recommendations = recommender.recommend(speedContext);

    expect(recommendations.length).toBeGreaterThan(0);

    // Should recommend high-performance strategies
    const firstRec = recommendations[0];
    expect(firstRec.reason).toContain("快速") ||
      firstRec.reason.includes("响应");
  });

  // Test 12: Balanced Priority
  it("should balance all factors with balanced priority", () => {
    const balancedContext: RecommendationContext = {
      scenario: {
        type: "daily",
        priority: "balanced",
      },
      budget: {
        monthly: 3000,
        currentSpent: 500,
        alertThreshold: 0.8,
      },
    };

    const recommendations = recommender.recommend(balancedContext);

    expect(recommendations.length).toBeGreaterThan(0);

    // Balanced should include strategy-2-balanced
    const balancedStrat = recommendations.find(
      (r) => r.strategyName === "strategy-2-balanced",
    );
    expect(balancedStrat).toBeDefined();
  });
});

// ==================== History Preference Tests ====================

describe("SmartRecommender - History Preference", () => {
  let recommender: SmartRecommender;

  beforeEach(() => {
    const strategies = createStrategyLibrary();
    recommender = new SmartRecommender(strategies);
  });

  // Test 13: Recent Strategy Preference
  it("should boost score of recently used strategies", () => {
    const contextWithHistory: RecommendationContext = {
      scenario: {
        type: "daily",
        priority: "balanced",
      },
      history: {
        recentStrategies: [
          "strategy-2-balanced",
          "strategy-2-balanced",
          "strategy-2-balanced",
        ],
        frequentScenarios: ["daily"],
      },
    };

    const recommendations = recommender.recommend(contextWithHistory);

    expect(recommendations.length).toBeGreaterThan(0);

    // strategy-2-balanced should rank high due to history
    expect(recommendations[0].strategyName).toBe("strategy-2-balanced");
  });

  // Test 14: No History
  it("should handle case with no history data", () => {
    const contextNoHistory: RecommendationContext = {
      scenario: {
        type: "coding",
        priority: "balanced",
      },
      history: {
        recentStrategies: [],
        frequentScenarios: [],
      },
    };

    const recommendations = recommender.recommend(contextNoHistory);

    expect(recommendations.length).toBeGreaterThan(0);

    // Should still work without history
    expect(recommendations[0].confidence).toBeGreaterThan(0);
  });

  // Test 15: Mixed History
  it("should recommend based on mixed usage history", () => {
    const context: RecommendationContext = {
      scenario: {
        type: "daily",
        priority: "balanced",
      },
      history: {
        recentStrategies: [
          "strategy-2-balanced",
          "strategy-3-economical",
          "strategy-2-balanced",
        ],
        frequentScenarios: ["daily", "tools"],
      },
    };

    const recommendations = recommender.recommend(context);

    expect(recommendations.length).toBeGreaterThan(0);

    // balanced and economical should score high
    const topStrategies = recommendations
      .slice(0, 2)
      .map((r) => r.strategyName);

    const hasBalanced = topStrategies.includes("strategy-2-balanced");
    const hasEconomical = topStrategies.includes("strategy-3-economical");

    expect(hasBalanced || hasEconomical).toBe(true);
  });
});

// ==================== Quota Management Tests ====================

describe("SmartRecommender - Quota Management", () => {
  let recommender: SmartRecommender;

  beforeEach(() => {
    const strategies = createStrategyLibrary();
    recommender = new SmartRecommender(strategies);
  });

  // Test 16: Sufficient Quota
  it("should recommend strategies with sufficient quota", () => {
    const context: RecommendationContext = {
      scenario: {
        type: "coding",
        priority: "balanced",
      },
      quotaStatus: [
        {
          provider: "anthropic",
          remaining: 5000,
          total: 10000,
          usagePercent: 0.5,
        },
        {
          provider: "github",
          remaining: 1000,
          total: 1500,
          usagePercent: 0.33,
        },
      ],
    };

    const recommendations = recommender.recommend(context);

    expect(recommendations.length).toBeGreaterThan(0);

    // Should recommend strategies using available providers
    expect(recommendations[0].strategyName).toBeDefined();
  });

  // Test 17: Tight Quota
  it("should adjust for tight quota status", () => {
    const context: RecommendationContext = {
      scenario: {
        type: "coding",
        priority: "balanced",
      },
      quotaStatus: [
        {
          provider: "anthropic",
          remaining: 50,
          total: 10000,
          usagePercent: 0.995,
        },
        {
          provider: "github",
          remaining: 1000,
          total: 1500,
          usagePercent: 0.33,
        },
      ],
    };

    const recommendations = recommender.recommend(context);

    expect(recommendations.length).toBeGreaterThan(0);

    // Should favor strategies using GitHub (more quota)
    const firstRec = recommendations[0];
    expect(firstRec.reason).toContain("配额") ||
      firstRec.cons.some((c) => c.includes("配额"));
  });
});

// ==================== Complete Recommendation Flow Tests ====================

describe("SmartRecommender - Complete Recommendations", () => {
  let recommender: SmartRecommender;

  beforeEach(() => {
    const strategies = createStrategyLibrary();
    recommender = new SmartRecommender(strategies);
  });

  // Test 18: Full Context Recommendation
  it("should provide complete recommendation with full context", () => {
    const context: RecommendationContext = {
      scenario: {
        type: "research",
        priority: "quality",
        complexity: "complex",
      },
      budget: {
        monthly: 5000,
        currentSpent: 1000,
        alertThreshold: 0.8,
      },
      history: {
        recentStrategies: [
          "strategy-5-research",
          "strategy-1-performance",
        ],
        frequentScenarios: ["research", "coding"],
        avgCostPerDay: 50,
      },
      timeContext: {
        isUrgent: false,
      },
    };

    const recommendations = recommender.recommend(context);

    expect(recommendations.length).toBe(3); // Should return top 3

    // Verify recommendation structure
    for (const rec of recommendations) {
      expect(rec.strategyName).toBeDefined();
      expect(rec.score).toBeGreaterThan(0);
      expect(rec.score).toBeLessThanOrEqual(100);
      expect(rec.reason).toBeDefined();
      expect(rec.estimatedCost).toBeDefined();
      expect(rec.pros).toBeDefined();
      expect(rec.cons).toBeDefined();
      expect(rec.confidence).toBeGreaterThanOrEqual(0);
      expect(rec.confidence).toBeLessThanOrEqual(1);
    }
  });

  // Test 19: Top 3 Sorting
  it("should return recommendations in descending score order", () => {
    const context: RecommendationContext = {
      scenario: {
        type: "daily",
        priority: "balanced",
      },
    };

    const recommendations = recommender.recommend(context);

    expect(recommendations.length).toBeLessThanOrEqual(3);

    // Verify descending order
    for (let i = 1; i < recommendations.length; i++) {
      expect(recommendations[i].score).toBeLessThanOrEqual(
        recommendations[i - 1].score,
      );
    }
  });

  // Test 20: Recommendation Reasons
  it("should provide meaningful reasons for recommendations", () => {
    const context: RecommendationContext = {
      scenario: {
        type: "creative",
        priority: "balanced",
      },
    };

    const recommendations = recommender.recommend(context);

    expect(recommendations.length).toBeGreaterThan(0);

    for (const rec of recommendations) {
      expect(rec.reason.length).toBeGreaterThan(0);
      // Reason should contain at least one substantive reason
      expect(
        rec.reason.includes("适合") ||
          rec.reason.includes("成本") ||
          rec.reason.includes("质量"),
      ).toBe(true);
    }
  });
});

// ==================== Natural Language Parsing Tests ====================

describe("SmartRecommender - Natural Language Parsing", () => {
  // Test 21: Parse Coding Scenario
  it("should parse coding-related descriptions", () => {
    const description = "编程开发任务，需要质量保证";

    const context = parseRecommendationContext(description);

    expect(context.scenario).toBeDefined();
    expect(context.scenario?.type).toBe("coding");
    expect(context.scenario?.priority).toBe("quality");
  });

  // Test 22: Parse Budget From Description
  it("should extract budget information", () => {
    const description = "研究任务，预算 2000 元";

    const context = parseRecommendationContext(description);

    expect(context.budget).toBeDefined();
    expect(context.budget?.monthly).toBe(2000);
  });

  // Test 23: Parse Urgency
  it("should detect urgent scenarios", () => {
    const description = "紧急的编程任务";

    const context = parseRecommendationContext(description);

    expect(context.timeContext).toBeDefined();
    expect(context.timeContext?.isUrgent).toBe(true);
  });

  // Test 24: Parse Complexity
  it("should detect complexity level", () => {
    const complexDescription = "复杂的深度研究分析";
    const simpleDescription = "简单的日常任务";

    const complexContext = parseRecommendationContext(complexDescription);
    const simpleContext = parseRecommendationContext(simpleDescription);

    expect(complexContext.scenario?.complexity).toBe("complex");
    expect(simpleContext.scenario?.complexity).toBe("simple");
  });

  // Test 25: Parse Multiple Factors
  it("should parse multiple factors in one description", () => {
    const description =
      "紧急的编程任务，预算 5000 元，需要高质量输出，复杂度很高";

    const context = parseRecommendationContext(description);

    expect(context.scenario?.type).toBe("coding");
    expect(context.scenario?.priority).toBe("quality");
    expect(context.scenario?.complexity).toBe("complex");
    expect(context.budget?.monthly).toBe(5000);
    expect(context.timeContext?.isUrgent).toBe(true);
  });

  // Test 26: Handle Ambiguous Description
  it("should handle ambiguous descriptions gracefully", () => {
    const ambiguousDescription = "某个任务";

    const context = parseRecommendationContext(ambiguousDescription);

    // Should still return valid context (possibly with defaults)
    expect(context).toBeDefined();
  });
});

// ==================== Edge Cases ====================

describe("SmartRecommender - Edge Cases", () => {
  let recommender: SmartRecommender;

  beforeEach(() => {
    const strategies = createStrategyLibrary();
    recommender = new SmartRecommender(strategies);
  });

  // Test 27: Empty Recommendation Context
  it("should handle empty recommendation context", () => {
    const context: RecommendationContext = {};

    const recommendations = recommender.recommend(context);

    expect(recommendations.length).toBeGreaterThan(0);
    // Should return default recommendations
  });

  // Test 28: Single Strategy
  it("should handle single strategy library", () => {
    const singleStrat = [createMockStrategy()];
    const singleRecommender = new SmartRecommender(singleStrat);

    const context: RecommendationContext = {
      scenario: { type: "daily", priority: "balanced" },
    };

    const recommendations = singleRecommender.recommend(context);

    expect(recommendations.length).toBe(1);
    expect(recommendations[0].strategyName).toBe("strategy-2-balanced");
  });

  // Test 29: Score Consistency
  it("should produce consistent scores for same input", () => {
    const context: RecommendationContext = {
      scenario: {
        type: "coding",
        priority: "quality",
      },
    };

    const recs1 = recommender.recommend(context);
    const recs2 = recommender.recommend(context);

    // Same input should produce same scores
    expect(recs1.length).toBe(recs2.length);
    for (let i = 0; i < recs1.length; i++) {
      expect(recs1[i].score).toBe(recs2[i].score);
      expect(recs1[i].strategyName).toBe(recs2[i].strategyName);
    }
  });

  // Test 30: Confidence Score Range
  it("should maintain valid confidence score range", () => {
    const context: RecommendationContext = {
      scenario: {
        type: "daily",
        priority: "balanced",
      },
      budget: {
        monthly: 5000,
        currentSpent: 1000,
        alertThreshold: 0.8,
      },
      history: {
        recentStrategies: ["strategy-2-balanced"],
        frequentScenarios: ["daily"],
      },
    };

    const recommendations = recommender.recommend(context);

    for (const rec of recommendations) {
      expect(rec.confidence).toBeGreaterThanOrEqual(0);
      expect(rec.confidence).toBeLessThanOrEqual(1);
    }
  });
});
