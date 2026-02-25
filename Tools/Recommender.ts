import { defaultHealthManager } from "./HealthManager";
import { readJSONC } from "./FileSystemUtils";
import type {
  StrategyMetadata,
  ScenarioType,
  Priority,
  Complexity,
  ScenarioConfig,
  BudgetConfig,
  QuotaStatus,
  HistoryData,
  RecommendationInput,
  Recommendation,
  EstimatedCost
} from "./interfaces";

/**
 * Recommender.ts
 * 智能策略推荐系统
 *
 * 基于多因素评分算法，为用户推荐最合适的策略
 */

// ==================== 接口定义 (仅保留 Recommender 特有接口) ====================

export interface RecommendationContext {
  scenario?: ScenarioConfig;
  budget?: BudgetConfig;
  history?: HistoryData;
  quotaStatus?: QuotaStatus[];
  timeContext?: {
    isUrgent: boolean;
    deadline?: Date;
  };
}

// ==================== 场景映射配置 ====================

/**
 * 场景到策略的映射关系
 */
const SCENARIO_MAPPING: Record<ScenarioType, string[]> = {
  "agent-heavy": ["fast", "balanced"],
  education: ["balanced", "smart"],
  health: ["balanced", "smart"],
  finance: ["smart", "fast"],
  coding: ["balanced", "fast"],
  research: ["smart", "fast"],
  creative: ["smart", "balanced"],
  daily: ["balanced", "fast"],
  writing: ["smart", "balanced"],
  multimedia: ["smart", "balanced"],
  social: ["smart", "balanced"],
  tools: ["balanced", "fast"],
  entertainment: ["balanced", "fast"],
  documentation: ["balanced", "fast"],
};

/**
 * 策略成本级别映射
 */
const COST_LEVELS: Record<string, number> = {
  "smart": 2500,
  "fast": 1250,
  "balanced": 550,
  "cheap": 150,
  "strategy-6-agent-focused": 750,
  "strategy-7-china-first": 180,
  "strategy-8-general": 180,
};

/**
 * 策略质量评分
 */
const QUALITY_SCORES: Record<string, number> = {
  "smart": 1.0,
  "balanced": 0.7,
  "fast": 0.85,
  "cheap": 0.5,
  "strategy-6-agent": 0.85,
};

/**
 * 模型特性画像（0-1）
 */
const MODEL_PROFILES: Record<
  string,
  { quality: number; cost: number; speed: number }
> = {
  anthropic: { quality: 0.95, cost: 0.35, speed: 0.6 },
  openai: { quality: 0.9, cost: 0.45, speed: 0.7 },
  google: { quality: 0.75, cost: 0.7, speed: 0.85 },
  zhipu: { quality: 0.7, cost: 0.85, speed: 0.75 },
  github: { quality: 0.8, cost: 0.9, speed: 0.9 },
  "ark-cn": { quality: 0.7, cost: 0.9, speed: 0.8 },
  dashscope: { quality: 0.75, cost: 0.85, speed: 0.8 },
  kimi: { quality: 0.7, cost: 0.85, speed: 0.75 },
  step: { quality: 0.7, cost: 0.85, speed: 0.75 },
  minimax: { quality: 0.7, cost: 0.85, speed: 0.75 },
  siliconflow: { quality: 0.75, cost: 0.95, speed: 0.9 },
  unknown: { quality: 0.6, cost: 0.6, speed: 0.6 },
};

// ==================== 智能推荐器类 ====================

export class SmartRecommender {
  private strategies: StrategyMetadata[];

  constructor(strategies: StrategyMetadata[]) {
    this.strategies = strategies;
  }

  /**
   * 推荐策略（返回前 3 个）
   */
  async recommend(context: RecommendationContext): Promise<Recommendation[]> {
    let candidates = this.strategies;

    // 过滤超预算5倍以上的策略
    if (context.budget) {
      const remaining = context.budget.monthly - context.budget.currentSpent;
      candidates = candidates.filter((strategy) => {
        const cost = COST_LEVELS[strategy.name] || 500;
        return cost <= remaining * 5; // 最多允许5倍超支
      });
    }

    const scored = await Promise.all(
      candidates.map((strategy) => this.scoreStrategy(strategy, context))
    );

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }

  /**
   * 为单个策略评分
   */
  private async scoreStrategy(
    strategy: StrategyMetadata,
    context: RecommendationContext,
  ): Promise<Recommendation> {
    const healthScore = await this.calculateHealthScore(strategy);
    
    const scores = {
      scenario: this.calculateScenarioMatch(strategy, context.scenario),
      cost: this.calculateCostEfficiency(strategy, context.budget),
      quality: this.getQualityScore(strategy),
      history: this.getHistoryPreference(strategy, context.history),
      model: this.calculateModelProfileScore(strategy, context.scenario),
      quota: this.calculateQuotaScore(strategy, context.quotaStatus),
      health: healthScore,
    };

    const weights = this.getWeights(context);

    const totalScore =
      scores.scenario * weights.scenario +
      scores.cost * weights.cost +
      scores.quality * weights.quality +
      scores.history * weights.history +
      scores.model * weights.model +
      scores.quota * weights.quota +
      scores.health * weights.health;

    const confidence = this.calculateConfidence(scores, context);

    return {
      strategyName: strategy.name,
      score: Math.round(totalScore * 100),
      reason: this.generateReason(strategy, scores, context),
      estimatedCost: this.estimateCost(strategy, context),
      pros: this.generatePros(strategy, context),
      cons: this.generateCons(strategy, context),
      confidence,
    };
  }

  private calculateScenarioMatch(
    strategy: StrategyMetadata,
    scenario?: ScenarioConfig,
  ): number {
    if (!scenario) return 0.5;

    const sceneType = scenario.type as ScenarioType;
    const name = strategy.name;

    if (name === "smart") return 0.9;
    if (name === "fast") {
      return sceneType === "coding" || sceneType === "finance" || sceneType === "research" ? 0.9 : 0.3;
    }
    if (name === "balanced") {
      return sceneType === "daily" || sceneType === "tools" ? 0.9 : 0.4;
    }
    if (name === "cheap") {
      return sceneType === "daily" || sceneType === "tools" || sceneType === "education" ? 0.9 : 0.4;
    }
    if (name === "strategy-6-agent-focused") {
      return sceneType === "agent-heavy" || sceneType === "coding" ? 0.9 : 0.3;
    }

    return 0.5;
  }

  private calculateCostEfficiency(
    strategy: StrategyMetadata,
    budget?: BudgetConfig,
  ): number {
    if (!budget) return 0.5;

    const strategyCost = COST_LEVELS[strategy.name] || 500;
    const remaining = budget.monthly - budget.currentSpent;

    if (strategyCost > remaining) return 0.1;

    const ratio = strategyCost / remaining;
    if (ratio < 0.3) return 1.0;
    if (ratio < 0.5) return 0.8;
    if (ratio < 0.7) return 0.6;
    return 0.3;
  }

  private getQualityScore(strategy: StrategyMetadata): number {
    return QUALITY_SCORES[strategy.name] || 0.5;
  }

  private getHistoryPreference(
    strategy: StrategyMetadata,
    history?: HistoryData,
  ): number {
    if (!history || !history.recentStrategies.length) return 0.5;

    const recentUses = history.recentStrategies.filter(
      (s) => s === strategy.name,
    ).length;

    const frequency = recentUses / history.recentStrategies.length;
    return Math.min(0.5 + frequency, 1.0);
  }

  private getWeights(context: RecommendationContext): Record<string, number> {
    const priority = context.scenario?.priority || "balanced";
    const hasQuota = !!context.quotaStatus?.length;

    const baseWeights = {
      scenario: 0.3,
      cost: 0.2,
      quality: 0.2,
      history: 0.1,
      model: 0.05,
      quota: hasQuota ? 0.05 : 0,
      health: 0.1,
    };

    switch (priority) {
      case "quality":
        return this.normalizeWeights({ ...baseWeights, quality: 0.4, health: 0.15 });
      case "cost":
        return this.normalizeWeights({ ...baseWeights, cost: 0.4 });
      case "speed":
        return this.normalizeWeights({ ...baseWeights, health: 0.2 });
      case "balanced":
      default:
        return this.normalizeWeights(baseWeights);
    }
  }

  private normalizeWeights(
    weights: Record<string, number>,
  ): Record<string, number> {
    const total = Object.values(weights).reduce((sum, v) => sum + v, 0);
    if (total === 0) return weights;

    const normalized: Record<string, number> = {};
    for (const [key, value] of Object.entries(weights)) {
      normalized[key] = value / total;
    }
    return normalized;
  }

  private calculateModelProfileScore(
    strategy: StrategyMetadata,
    scenario?: ScenarioConfig,
  ): number {
    if (!strategy.models || strategy.models.length === 0) return 0.5;

    const profiles = strategy.models.map((model) => {
      const provider = this.getProviderFromModel(model);
      return MODEL_PROFILES[provider] || MODEL_PROFILES.unknown;
    });

    const avg = profiles.reduce(
      (acc, p) => ({
        quality: acc.quality + p.quality,
        cost: acc.cost + p.cost,
        speed: acc.speed + p.speed,
      }),
      { quality: 0, cost: 0, speed: 0 },
    );

    const count = profiles.length || 1;
    const avgProfile = {
      quality: avg.quality / count,
      cost: avg.cost / count,
      speed: avg.speed / count,
    };

    const priority = scenario?.priority || "balanced";
    switch (priority) {
      case "quality": return avgProfile.quality;
      case "cost": return avgProfile.cost;
      case "speed": return avgProfile.speed;
      default: return (avgProfile.quality + avgProfile.cost + avgProfile.speed) / 3;
    }
  }

  private calculateQuotaScore(
    strategy: StrategyMetadata,
    quotaStatus?: QuotaStatus[],
  ): number {
    if (!quotaStatus || quotaStatus.length === 0) return 0.5;
    if (!strategy.models || strategy.models.length === 0) return 0.5;

    const providerRatios: number[] = [];

    for (const model of strategy.models) {
      const provider = this.getProviderFromModel(model);
      const quota = quotaStatus.find((q) => q.provider === provider);
      if (!quota) continue;

      providerRatios.push(1 - quota.usagePercent);
    }

    if (providerRatios.length === 0) return 0.5;
    const avgRemaining = providerRatios.reduce((sum, v) => sum + v, 0) / providerRatios.length;
    return Math.max(0.1, Math.min(avgRemaining, 1));
  }

  private async calculateHealthScore(strategy: StrategyMetadata): Promise<number> {
    if (!strategy.models || strategy.models.length === 0) return 1.0;
    
    let totalHealth = 0;
    for (const model of strategy.models) {
      totalHealth += await defaultHealthManager.getHealthScore(model);
    }
    
    return totalHealth / strategy.models.length;
  }

  public getProviderFromModel(model: string): string {
    const lower = model.toLowerCase();
    if (lower.startsWith("anthropic/")) return "anthropic";
    if (lower.startsWith("openai/")) return "openai";
    if (lower.startsWith("google/")) return "google";
    if (lower.startsWith("zai-") || lower.includes("zhipu")) return "zhipu";
    if (lower.startsWith("github/")) return "github";
    if (lower.startsWith("ark-cn/")) return "ark-cn";
    if (lower.startsWith("dashscope/")) return "dashscope";
    if (lower.startsWith("kimi/")) return "kimi";
    if (lower.startsWith("step/")) return "step";
    if (lower.startsWith("minimax/")) return "minimax";
    if (lower.startsWith("siliconflow/")) return "siliconflow";
    return "unknown";
  }

  private calculateConfidence(
    scores: Record<string, number>,
    context: RecommendationContext,
  ): number {
    let confidence = 0.5;
    if (context.scenario) confidence += 0.2;
    if (context.budget) confidence += 0.15;
    if (context.history && context.history.recentStrategies.length > 0) confidence += 0.1;
    if (scores.scenario > 0.8) confidence += 0.05;
    return Math.min(confidence, 1.0);
  }

  private generateReason(
    strategy: StrategyMetadata,
    scores: Record<string, number>,
    context: RecommendationContext,
  ): string {
    const reasons: string[] = [];
    if (scores.scenario > 0.7 && context.scenario) reasons.push(`契合当前场景`);
    if (scores.cost > 0.8) reasons.push("经济高效");
    if (scores.quality > 0.8) reasons.push("高质量输出");
    if (scores.health < 0.7) reasons.push("⚠️ 部分模型存在健康波动");
    return reasons.join("；") || "综合性能平衡";
  }

  private estimateCost(
    strategy: StrategyMetadata,
    context: RecommendationContext,
  ): EstimatedCost {
    const monthlyCost = COST_LEVELS[strategy.name] || 500;
    const perUseCost = Math.round(monthlyCost / 30);
    return { perUse: perUseCost, monthly: monthlyCost };
  }

  private generatePros(strategy: StrategyMetadata, context: RecommendationContext): string[] {
    const pros = [];
    if (strategy.name === "smart") pros.push("极致智能");
    if (strategy.name === "cheap") pros.push("极低成本");
    return pros;
  }

  private generateCons(strategy: StrategyMetadata, context: RecommendationContext): string[] {
    const cons = [];
    if (strategy.name === "cheap") cons.push("质量上限较低");
    return cons;
  }
}

// ==================== 辅助函数 ====================

export function parseRecommendationContext(description: string): RecommendationContext {
  const lowerDesc = description.toLowerCase();
  const context: RecommendationContext = {};

  const scenarioKeywords: Record<ScenarioType, string[]> = {
    "agent-heavy": ["智能体", "协作", "agent"],
    education: ["教育", "学习"],
    health: ["健康", "医疗"],
    finance: ["金融", "投资"],
    coding: ["开发", "编程", "代码"],
    research: ["研究", "分析"],
    creative: ["创作", "创意"],
    daily: ["日常", "常规"],
    writing: ["写作", "文章"],
    multimedia: ["多媒体", "视频"],
    social: ["社交", "运营"],
    tools: ["工具", "辅助"],
    entertainment: ["娱乐", "游戏"],
    documentation: ["公文", "文档"],
  };

  for (const [type, keywords] of Object.entries(scenarioKeywords)) {
    if (keywords.some((kw) => lowerDesc.includes(kw))) {
      context.scenario = { type: type as ScenarioType, priority: "balanced" };
      break;
    }
  }

  if (lowerDesc.includes("质量") || lowerDesc.includes("重要")) {
    if (context.scenario) context.scenario.priority = "quality";
  } else if (lowerDesc.includes("便宜") || lowerDesc.includes("预算")) {
    if (context.scenario) context.scenario.priority = "cost";
  }

  return context;
}

/**
 * 智能推荐（基础实现，ManageStrategies 中有更完整的包装）
 */
export async function recommendStrategySmart(input: RecommendationInput): Promise<Recommendation | null> {
  // 注意：这个实现在 ManageStrategies.ts 中有更完整的逻辑（包含策略库加载）。
  // 这里仅保留函数签名以满足依赖。
  return null;
}

export function recordRecommendationFeedback(feedback: any): void {}

/**
 * 助手函数：从模型 ID 提取厂商名称
 */
export function getProviderFromModel(model: string): string {
  const recommender = new SmartRecommender([]);
  return recommender.getProviderFromModel(model);
}
