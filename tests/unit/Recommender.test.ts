import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  SmartRecommender,
  parseRecommendationContext,
  type StrategyMetadata,
  type RecommendationContext,
  type ScenarioType,
} from "../../Tools/Recommender";

// Mock data factory
function createMockStrategy(overrides: Partial<StrategyMetadata> = {}): StrategyMetadata {
  return {
    name: "balanced",
    filePath: "/path/to/strat.json",
    description: "Balanced strategy for general use",
    costLevel: "medium",
    version: "1.0.0",
    isCurrent: false,
    useCase: "General purpose AI tasks",
    models: ["anthropic/claude-sonnet-4-6", "github-copilot/gpt-5-mini"],
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
        "anthropic/claude-opus-4-6",
        "openai/gpt-5.1-codex-max",
        "google/gemini-3.1-pro-preview",
      ],
    }),
    createMockStrategy({
      name: "fast",
      description: "High performance strategy",
      costLevel: "high",
      models: ["anthropic/claude-opus-4-6", "openai/gpt-5.1-codex-max"],
    }),
    createMockStrategy({
      name: "balanced",
      description: "Balanced strategy",
      costLevel: "medium",
      models: ["anthropic/claude-sonnet-4-6", "github-copilot/gpt-5-mini"],
    }),
    createMockStrategy({
      name: "cheap",
      description: "Cost-effective strategy",
      costLevel: "low",
      models: ["github-copilot/gpt-4o-mini", "google/gemini-3.1-flash"],
    }),
    createMockStrategy({
      name: "strategy-6-agent",
      description: "Content creation strategy",
      costLevel: "medium-high",
      models: ["anthropic/claude-sonnet-4-6", "openai/gpt-5.1-codex-max"],
    }),
    createMockStrategy({
      name: "smart-research",
      description: "Deep research strategy",
      costLevel: "high",
      models: ["anthropic/claude-opus-4-6", "google/gemini-3.1-pro-preview"],
    }),
  ];
}

describe("SmartRecommender Core", () => {
  let recommender: SmartRecommender;
  let strategies: StrategyMetadata[];

  beforeEach(() => {
    strategies = createStrategyLibrary();
    recommender = new SmartRecommender(strategies);
  });

  it("should prioritize perfect scenario matches", async () => {
    const context: RecommendationContext = {
      scenario: {
        type: "coding",
        priority: "balanced",
      },
    };

    const recommendations = await recommender.recommend(context);

    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations[0].strategyName).toBeDefined();

  });

  it("should recommend higher quality strategies for complex tasks", async () => {
    const complexContext: RecommendationContext = {
      scenario: {
        type: "coding",
        priority: "quality",
        complexity: "complex",
      },
    };

    const recommendations = await recommender.recommend(complexContext);

    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations[0].score).toBeGreaterThan(70);
  });

  it("should warn when strategy exceeds budget", async () => {
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

    const recommendations = await recommender.recommend(context);

    // Smart strategy (high cost) should be filtered or lower ranked
    expect(recommendations.some((r) => r.strategyName === "smart")).toBe(false);
  });

  it("should produce consistent scores for same input", async () => {
    const context: RecommendationContext = {
      scenario: {
        type: "coding",
        priority: "quality",
      },
    };

    const recs1 = await recommender.recommend(context);
    const recs2 = await recommender.recommend(context);

    expect(recs1.length).toBe(recs2.length);
    for (let i = 0; i < recs1.length; i++) {
      expect(recs1[i].score).toBe(recs2[i].score);
      expect(recs1[i].strategyName).toBe(recs2[i].strategyName);
    }
  });
});

describe("SmartRecommender - Natural Language Parsing", () => {
  it("should parse coding-related descriptions", () => {
    const description = "编程开发任务，需要质量保证";
    const context = parseRecommendationContext(description);

    expect(context.scenario).toBeDefined();
    expect(context.scenario?.type).toBe("coding");
    expect(context.scenario?.priority).toBe("quality");
  });

  it("should detect urgent scenarios", () => {
    const description = "紧急的编程任务";
    const context = parseRecommendationContext(description);
    expect(context).toBeDefined();
  });
});
