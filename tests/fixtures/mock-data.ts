/**
 * tests/fixtures/mock-data.ts
 * 测试 Mock 数据和工厂函数
 */

import type {
  StrategyMetadata,
  RecommendationContext,
  BudgetConfig,
  HistoryData,
  QuotaStatus,
} from "../../Tools/Recommender";
import type { StrategyConfig } from "../../Tools/ManageStrategies";

// ==================== Strategy Mock Data ====================

export const mockStrategies: StrategyMetadata[] = [
  {
    name: "strategy-0-super",
    filePath: "/mock/strategies/0-super.jsonc",
    description: "超级策略 - 最高质量和性能，适合关键任务",
    costLevel: "ultra-high",
    version: "1.0.0",
    isCurrent: false,
    useCase: "Critical tasks requiring ultimate quality",
    models: [
      "anthropic/claude-opus-4-5",
      "openai/gpt-5.2",
      "google/gemini-3-pro",
    ],
    source: "installed",
  },
  {
    name: "strategy-1-performance",
    filePath: "/mock/strategies/1-performance.jsonc",
    description: "性能策略 - 高质量和快速响应",
    costLevel: "high",
    version: "1.0.0",
    isCurrent: false,
    useCase: "High-performance tasks",
    models: ["anthropic/claude-opus-4-5", "openai/gpt-5.2-codex"],
    source: "installed",
  },
  {
    name: "strategy-2-balanced",
    filePath: "/mock/strategies/2-balanced.jsonc",
    description: "平衡策略 - 质量和成本的最佳平衡",
    costLevel: "medium",
    version: "1.0.0",
    isCurrent: true,
    useCase: "General purpose AI tasks",
    models: ["anthropic/claude-sonnet-4-5", "github-copilot/gpt-5-mini"],
    source: "installed",
  },
  {
    name: "strategy-3-economical",
    filePath: "/mock/strategies/3-economical.jsonc",
    description: "经济策略 - 成本优先",
    costLevel: "low",
    version: "1.0.0",
    isCurrent: false,
    useCase: "Cost-sensitive tasks",
    models: ["github-copilot/gpt-4.1", "google/gemini-3-flash"],
    source: "installed",
  },
  {
    name: "strategy-creative-content",
    filePath: "/mock/strategies/creative-content.jsonc",
    description: "创意内容策略 - 优化创意输出",
    costLevel: "medium-high",
    version: "1.0.0",
    isCurrent: false,
    useCase: "Content creation and writing",
    models: ["anthropic/claude-sonnet-4-5", "openai/gpt-5.2"],
    source: "installed",
  },
  {
    name: "strategy-research-thinking",
    filePath: "/mock/strategies/research-thinking.jsonc",
    description: "研究思维策略 - 深度分析和推理",
    costLevel: "high",
    version: "1.0.0",
    isCurrent: false,
    useCase: "Deep research and analysis",
    models: ["anthropic/claude-opus-4-5", "google/gemini-3-pro"],
    source: "installed",
  },
];

// ==================== Strategy Config Mock Data ====================

export const validStrategyConfig: StrategyConfig = {
  description: "Test balanced strategy",
  agents: {
    default: { model: "anthropic/claude-sonnet-4-5" },
    coding: { model: "github-copilot/gpt-5-mini" },
    research: { model: "anthropic/claude-opus-4-5" },
  },
  background_task: {
    modelConcurrency: {
      "anthropic/claude-sonnet-4-5": 3,
      "github-copilot/gpt-5-mini": 20,
      "anthropic/claude-opus-4-5": 2,
    },
  },
};

export const expensiveStrategyConfig: StrategyConfig = {
  description: "Test expensive strategy",
  agents: {
    a: { model: "anthropic/claude-opus-4-5" },
    b: { model: "github-copilot/claude-opus-4-5" },
    c: { model: "anthropic/claude-opus-4-5" },
    d: { model: "openai/gpt-5.2" },
  },
  background_task: {
    modelConcurrency: {
      "anthropic/claude-opus-4-5": 5, // Too high
    },
  },
};

export const invalidStrategyConfig: any = {
  agents: {
    incomplete: {}, // Missing model
  },
  // Missing description
};

// ==================== Recommendation Context Factories ====================

export function createBudgetContext(
  overrides: Partial<BudgetConfig> = {},
): BudgetConfig {
  return {
    monthly: 5000,
    currentSpent: 1000,
    alertThreshold: 0.8,
    ...overrides,
  };
}

export function createHistoryData(
  overrides: Partial<HistoryData> = {},
): HistoryData {
  return {
    recentStrategies: [
      "strategy-2-balanced",
      "strategy-2-balanced",
      "strategy-1-performance",
    ],
    frequentScenarios: ["coding", "daily"],
    avgCostPerDay: 30,
    ...overrides,
  };
}

export function createQuotaStatus(
  overrides: Partial<QuotaStatus> = {},
): QuotaStatus {
  return {
    provider: "anthropic",
    remaining: 5000,
    total: 10000,
    usagePercent: 0.5,
    ...overrides,
  };
}

export function createRecommendationContext(
  overrides: Partial<RecommendationContext> = {},
): RecommendationContext {
  return {
    scenario: {
      type: "coding",
      priority: "balanced",
    },
    budget: createBudgetContext(),
    history: createHistoryData(),
    ...overrides,
  };
}

// ==================== Recommendation Test Cases ====================

export const recommendationTestCases = [
  {
    name: "Quality Priority Coding",
    context: {
      scenario: {
        type: "coding" as const,
        priority: "quality" as const,
      },
    },
    expectedTopStrategy: "strategy-1-performance",
  },
  {
    name: "Cost Priority Daily",
    context: {
      scenario: {
        type: "daily" as const,
        priority: "cost" as const,
      },
      budget: createBudgetContext({ monthly: 500, currentSpent: 300 }),
    },
    expectedTopStrategy: "strategy-3-economical",
  },
  {
    name: "Research with Deep Thinking",
    context: {
      scenario: {
        type: "research" as const,
        priority: "quality" as const,
      },
    },
    expectedTopStrategy: "strategy-research-thinking",
  },
  {
    name: "Creative Content",
    context: {
      scenario: {
        type: "creative" as const,
        priority: "balanced" as const,
      },
    },
    expectedTopStrategy: "strategy-creative-content",
  },
  {
    name: "Urgent Task",
    context: {
      scenario: {
        type: "coding" as const,
        priority: "speed" as const,
      },
      timeContext: {
        isUrgent: true,
      },
    },
    expectedTopStrategy: "strategy-0-super",
  },
];

// ==================== Validation Test Cases ====================

export const validationTestCases = [
  {
    name: "Missing Description",
    config: { agents: { main: { model: "claude" } } },
    shouldFail: true,
    expectedErrorField: "description",
  },
  {
    name: "Missing Model in Agent",
    config: {
      description: "Test",
      agents: { main: {} },
    },
    shouldFail: true,
    expectedErrorField: "model",
  },
  {
    name: "Valid with Categories",
    config: {
      description: "Test",
      categories: { main: { model: "claude" } },
    },
    shouldFail: false,
  },
  {
    name: "High Cost Warning",
    config: {
      description: "Expensive",
      agents: {
        a: { model: "anthropic/claude-opus-4-5" },
        b: { model: "anthropic/claude-opus-4-5" },
        c: { model: "anthropic/claude-opus-4-5" },
        d: { model: "anthropic/claude-opus-4-5" },
      },
    },
    shouldFail: false,
    expectedWarningField: "cost",
  },
  {
    name: "Unknown Model Warning",
    config: {
      description: "Test",
      agents: {
        main: { model: "unknown/future-model" },
      },
    },
    shouldFail: false,
    expectedWarningField: "model",
  },
];

// ==================== Path Manager Test Cases ====================

export const pathManagerTestCases = [
  {
    name: "User Mode",
    config: { mode: "user" as const },
    shouldContain: ".config/opencode",
  },
  {
    name: "Project Mode",
    config: { mode: "project" as const },
    shouldContain: ".config",
  },
  {
    name: "Custom Mode",
    config: {
      mode: "custom" as const,
      customConfigDir: "/custom/path",
    },
    expectedPath: "/custom/path",
  },
];

// ==================== Edge Case Test Data ====================

export const edgeCaseTestData = {
  emptyStrategies: [] as StrategyMetadata[],
  singleStrategy: [mockStrategies[2]], // balanced
  largeStrategyLibrary: Array.from({ length: 100 }, (_, i) => ({
    ...mockStrategies[2],
    name: `strategy-mock-${i}`,
  })),
  specialCharacterNames: [
    "strategy-with-dashes",
    "strategy_with_underscores",
    "strategy-123-numbers",
  ],
  zeroBudget: createBudgetContext({ monthly: 0, currentSpent: 0 }),
  maxBudget: createBudgetContext({ monthly: 1000000, currentSpent: 0 }),
  fullQuota: createQuotaStatus({ remaining: 0, usagePercent: 1 }),
  emptyQuota: createQuotaStatus({ remaining: 1000000, usagePercent: 0 }),
};

// ==================== Natural Language Test Cases ====================

export const nlpTestCases = [
  {
    input: "编程开发任务，需要质量保证",
    expectedScenarioType: "coding",
    expectedPriority: "quality",
  },
  {
    input: "研究任务，预算 2000 元",
    expectedScenarioType: "research",
    expectedBudget: 2000,
  },
  {
    input: "紧急的编程任务",
    expectedScenarioType: "coding",
    expectedUrgent: true,
  },
  {
    input: "复杂的深度研究分析",
    expectedScenarioType: "research",
    expectedComplexity: "complex",
  },
  {
    input: "简单的日常任务",
    expectedScenarioType: "daily",
    expectedComplexity: "simple",
  },
  {
    input: "创意内容创作，预算 3000 元，需要高质量",
    expectedScenarioType: "creative",
    expectedBudget: 3000,
    expectedPriority: "quality",
  },
];
