import { describe, it, expect, beforeEach } from "vitest";
import {
  SmartRecommender,
  parseRecommendationContext,
  type StrategyMetadata,
  type RecommendationContext,
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
      models: ["anthropic/claude-opus-4-6", "openai/gpt-5.1-codex-max"],
    }),
    createMockStrategy({
      name: "fast",
      models: ["openai/gpt-5.1-codex-max"],
    }),
    createMockStrategy({
      name: "balanced",
      models: ["anthropic/claude-sonnet-4-6"],
    }),
    createMockStrategy({
      name: "cheap",
      models: ["github-copilot/gpt-4o-mini"],
    }),
  ];
}

describe("SmartRecommender v2 Tests", () => {
  let recommender: SmartRecommender;
  let strategies: StrategyMetadata[];

  beforeEach(() => {
    strategies = createStrategyLibrary();
    recommender = new SmartRecommender(strategies);
  });

  it("should return at least one recommendation", async () => {
    const context: RecommendationContext = {
      scenario: { type: "coding", priority: "balanced" },
    };
    const recommendations = await recommender.recommend(context);
    expect(recommendations.length).toBeGreaterThan(0);
  });

  it("should favor cheap strategy when budget is very low", async () => {
    const context: RecommendationContext = {
      scenario: { type: "daily", priority: "cost" },
      budget: { monthly: 100, currentSpent: 50, alertThreshold: 0.8 },

    };
    const recommendations = await recommender.recommend(context);
    expect(recommendations[0].strategyName).toBe("cheap");
  });

  it("should recommend appropriate strategy for research", async () => {
    const context: RecommendationContext = {
      scenario: { type: "research", priority: "quality" },
    };
    const recommendations = await recommender.recommend(context);
    expect(recommendations.some(r => r.strategyName === "smart")).toBe(true);
  });
});
