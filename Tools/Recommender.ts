/**
 * Recommender.ts
 * 智能策略推荐系统
 *
 * 基于多因素评分算法，为用户推荐最合适的策略
 */

import type { StrategyMetadata } from "./ManageStrategies";

// ==================== 类型定义 ====================

export type ScenarioType =
  | "education" // 教育场景
  | "health" // 健康管理
  | "finance" // 金融交易
  | "coding" // 编程开发
  | "research" // 深度研究
  | "creative" // 创意写作
  | "daily" // 日常工作
  | "writing" // 写作发布
  | "multimedia" // 多媒体创作
  | "social" // 新媒体运营
  | "tools" // 日常工具
  | "entertainment" // 娱乐
  | "documentation"; // 公文处理

export type Priority = "quality" | "cost" | "speed" | "balanced";
export type Complexity = "simple" | "medium" | "complex";

export interface ScenarioConfig {
  type: ScenarioType;
  priority: Priority;
  complexity?: Complexity;
}

export interface BudgetConfig {
  monthly: number; // 月度预算
  currentSpent: number; // 本月已用
  alertThreshold: number; // 告警阈值 (0-1)
}

export interface HistoryData {
  recentStrategies: string[]; // 最近使用的策略
  frequentScenarios: string[]; // 常用场景
  avgCostPerDay?: number; // 平均每日成本
}

export interface TimeContext {
  isUrgent: boolean; // 是否紧急
  deadline?: Date; // 截止日期
}

export interface RecommendationContext {
  scenario?: ScenarioConfig;
  budget?: BudgetConfig;
  history?: HistoryData;
  timeContext?: TimeContext;
}

export interface EstimatedCost {
  perUse: number; // 单次使用成本
  monthly: number; // 月度预估成本
  breakdown?: string; // 成本细分说明
}

export interface Recommendation {
  strategyName: string;
  score: number; // 总分 (0-100)
  reason: string; // 推荐理由
  estimatedCost: EstimatedCost;
  pros: string[]; // 优势
  cons: string[]; // 劣势
  confidence: number; // 置信度 (0-1)
}

// ==================== 场景映射配置 ====================

/**
 * 场景到策略的映射关系
 * 第一个策略是最佳匹配，第二个是次优选择
 */
const SCENARIO_MAPPING: Record<ScenarioType, string[]> = {
  education: ["strategy-2-balanced", "strategy-creative-content"],
  health: ["strategy-2-balanced", "strategy-research-thinking"],
  finance: ["strategy-research-thinking", "strategy-1-performance"],
  coding: ["strategy-2-balanced", "strategy-1-performance"],
  research: ["strategy-research-thinking", "strategy-1-performance"],
  creative: ["strategy-creative-content", "strategy-2-balanced"],
  daily: ["strategy-2-balanced", "strategy-3-economical"],
  writing: ["strategy-creative-content", "strategy-2-balanced"],
  multimedia: ["strategy-creative-content", "strategy-2-balanced"],
  social: ["strategy-creative-content", "strategy-2-balanced"],
  tools: ["strategy-3-economical", "strategy-2-balanced"],
  entertainment: ["strategy-3-economical", "strategy-2-balanced"],
  documentation: ["strategy-3-economical", "strategy-2-balanced"],
};

/**
 * 策略成本级别映射
 */
const COST_LEVELS: Record<string, number> = {
  "strategy-0-super": 2500,
  "strategy-1-performance": 1250,
  "strategy-2-balanced": 550,
  "strategy-3-economical": 100,
  "strategy-research-thinking": 2150,
  "strategy-creative-content": 650,
};

/**
 * 策略质量评分
 */
const QUALITY_SCORES: Record<string, number> = {
  "strategy-0-super": 1.0,
  "strategy-research-thinking": 0.95,
  "strategy-1-performance": 0.85,
  "strategy-creative-content": 0.8,
  "strategy-2-balanced": 0.7,
  "strategy-3-economical": 0.5,
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
  recommend(context: RecommendationContext): Recommendation[] {
    return this.strategies
      .map((strategy) => this.scoreStrategy(strategy, context))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }

  /**
   * 为单个策略评分
   */
  private scoreStrategy(
    strategy: StrategyMetadata,
    context: RecommendationContext,
  ): Recommendation {
    const scores = {
      scenario: this.calculateScenarioMatch(strategy, context.scenario),
      cost: this.calculateCostEfficiency(strategy, context.budget),
      quality: this.getQualityScore(strategy),
      history: this.getHistoryPreference(strategy, context.history),
    };

    // 根据上下文调整权重
    const weights = this.getWeights(context);

    const totalScore =
      scores.scenario * weights.scenario +
      scores.cost * weights.cost +
      scores.quality * weights.quality +
      scores.history * weights.history;

    // 计算置信度
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

  /**
   * 计算场景匹配度
   */
  private calculateScenarioMatch(
    strategy: StrategyMetadata,
    scenario?: ScenarioConfig,
  ): number {
    if (!scenario) return 0.5; // 默认中等匹配

    const matchingStrategies = SCENARIO_MAPPING[scenario.type] || [];

    // 完美匹配
    if (matchingStrategies[0] === strategy.name) return 1.0;

    // 次优匹配
    if (matchingStrategies[1] === strategy.name) return 0.7;

    // 包含在映射中
    if (matchingStrategies.includes(strategy.name)) return 0.5;

    // 复杂度调整
    if (scenario.complexity === "complex") {
      // 复杂任务倾向高质量策略
      if (
        strategy.name.includes("super") ||
        strategy.name.includes("research")
      ) {
        return 0.6;
      }
    } else if (scenario.complexity === "simple") {
      // 简单任务倾向经济策略
      if (strategy.name.includes("economical")) {
        return 0.6;
      }
    }

    return 0.2; // 弱匹配
  }

  /**
   * 计算成本效率
   */
  private calculateCostEfficiency(
    strategy: StrategyMetadata,
    budget?: BudgetConfig,
  ): number {
    if (!budget) return 0.5; // 默认中等效率

    const strategyCost = COST_LEVELS[strategy.name] || 500;
    const remaining = budget.monthly - budget.currentSpent;

    // 预算不足
    if (strategyCost > remaining) return 0.1;

    // 成本占剩余预算的比例
    const ratio = strategyCost / remaining;

    if (ratio < 0.3) return 1.0; // 成本很低，优秀
    if (ratio < 0.5) return 0.8; // 成本适中，良好
    if (ratio < 0.7) return 0.6; // 成本较高，尚可
    return 0.3; // 成本很高，勉强
  }

  /**
   * 获取质量评分
   */
  private getQualityScore(strategy: StrategyMetadata): number {
    return QUALITY_SCORES[strategy.name] || 0.5;
  }

  /**
   * 获取历史偏好分数
   */
  private getHistoryPreference(
    strategy: StrategyMetadata,
    history?: HistoryData,
  ): number {
    if (!history || !history.recentStrategies.length) {
      return 0.5; // 无历史数据
    }

    const recentUses = history.recentStrategies.filter(
      (s) => s === strategy.name,
    ).length;

    // 最近使用越多，分数越高
    const frequency = recentUses / history.recentStrategies.length;
    return Math.min(0.5 + frequency, 1.0);
  }

  /**
   * 获取权重配置
   */
  private getWeights(context: RecommendationContext): Record<string, number> {
    const priority = context.scenario?.priority || "balanced";

    switch (priority) {
      case "quality":
        return {
          scenario: 0.3,
          cost: 0.1,
          quality: 0.5,
          history: 0.1,
        };
      case "cost":
        return {
          scenario: 0.3,
          cost: 0.5,
          quality: 0.1,
          history: 0.1,
        };
      case "speed":
        return {
          scenario: 0.4,
          cost: 0.2,
          quality: 0.3,
          history: 0.1,
        };
      case "balanced":
      default:
        return {
          scenario: 0.4,
          cost: 0.3,
          quality: 0.2,
          history: 0.1,
        };
    }
  }

  /**
   * 计算置信度
   */
  private calculateConfidence(
    scores: Record<string, number>,
    context: RecommendationContext,
  ): number {
    let confidence = 0.5;

    // 有明确场景：+0.2
    if (context.scenario) confidence += 0.2;

    // 有预算信息：+0.15
    if (context.budget) confidence += 0.15;

    // 有历史数据：+0.1
    if (context.history && context.history.recentStrategies.length > 0) {
      confidence += 0.1;
    }

    // 场景匹配度高：+0.05
    if (scores.scenario > 0.8) confidence += 0.05;

    return Math.min(confidence, 1.0);
  }

  /**
   * 生成推荐理由
   */
  private generateReason(
    strategy: StrategyMetadata,
    scores: Record<string, number>,
    context: RecommendationContext,
  ): string {
    const reasons: string[] = [];

    // 场景匹配
    if (scores.scenario > 0.7 && context.scenario) {
      const scenarioNames: Record<ScenarioType, string> = {
        education: "教育",
        health: "健康管理",
        finance: "金融分析",
        coding: "编程开发",
        research: "深度研究",
        creative: "创意写作",
        daily: "日常工作",
        writing: "写作发布",
        multimedia: "多媒体创作",
        social: "新媒体运营",
        tools: "日常工具",
        entertainment: "娱乐",
        documentation: "公文处理",
      };
      reasons.push(`非常适合${scenarioNames[context.scenario.type]}场景`);
    }

    // 成本效率
    if (scores.cost > 0.8) {
      reasons.push("成本在预算范围内且经济高效");
    } else if (scores.cost < 0.3) {
      reasons.push("⚠️ 成本可能超出预算");
    }

    // 质量
    if (scores.quality > 0.8) {
      reasons.push("提供高质量输出");
    } else if (scores.quality < 0.6) {
      reasons.push("质量适中，适合非关键任务");
    }

    // 历史偏好
    if (scores.history > 0.7) {
      reasons.push("您经常使用此策略");
    }

    // 紧急情况
    if (context.timeContext?.isUrgent) {
      if (
        strategy.name.includes("super") ||
        strategy.name.includes("performance")
      ) {
        reasons.push("适合紧急任务的快速响应");
      }
    }

    return reasons.join("；") || "基本适用于当前场景";
  }

  /**
   * 估算成本
   */
  private estimateCost(
    strategy: StrategyMetadata,
    context: RecommendationContext,
  ): EstimatedCost {
    const monthlyCost = COST_LEVELS[strategy.name] || 500;
    const perUseCost = Math.round(monthlyCost / 30); // 假设每月30天

    let breakdown = `月度 ¥${monthlyCost}，日均 ¥${perUseCost}`;

    if (context.budget) {
      const remaining = context.budget.monthly - context.budget.currentSpent;
      const ratio = monthlyCost / context.budget.monthly;
      breakdown += `，占预算 ${(ratio * 100).toFixed(1)}%`;
    }

    return {
      perUse: perUseCost,
      monthly: monthlyCost,
      breakdown,
    };
  }

  /**
   * 生成优势列表
   */
  private generatePros(
    strategy: StrategyMetadata,
    context: RecommendationContext,
  ): string[] {
    const pros: string[] = [];

    const costLevel = COST_LEVELS[strategy.name] || 500;

    // 根据策略特点生成优势
    if (strategy.name.includes("super")) {
      pros.push("最高质量输出");
      pros.push("最快响应速度");
      pros.push("适合关键任务");
    } else if (strategy.name.includes("research")) {
      pros.push("深度思考能力强");
      pros.push("多模型验证");
      pros.push("适合复杂分析");
    } else if (strategy.name.includes("creative")) {
      pros.push("高创意性");
      pros.push("流畅文笔");
      pros.push("适合内容创作");
    } else if (strategy.name.includes("balanced")) {
      pros.push("成本与质量平衡");
      pros.push("场景覆盖广");
      pros.push("适合日常使用");
    } else if (strategy.name.includes("economical")) {
      pros.push("成本极低");
      pros.push("充分利用免费资源");
      pros.push("适合高频任务");
    }

    // 成本优势
    if (costLevel < 500) {
      pros.push("成本友好");
    }

    return pros;
  }

  /**
   * 生成劣势列表
   */
  private generateCons(
    strategy: StrategyMetadata,
    context: RecommendationContext,
  ): string[] {
    const cons: string[] = [];

    const costLevel = COST_LEVELS[strategy.name] || 500;

    // 根据策略特点生成劣势
    if (strategy.name.includes("super")) {
      cons.push("成本最高");
      cons.push("配额消耗快");
    } else if (strategy.name.includes("research")) {
      cons.push("成本较高");
      cons.push("响应速度较慢（深度思考）");
    } else if (strategy.name.includes("creative")) {
      cons.push("可能不适合技术任务");
    } else if (strategy.name.includes("economical")) {
      cons.push("质量有限");
      cons.push("不适合关键任务");
    }

    // 预算警告
    if (context.budget) {
      const remaining = context.budget.monthly - context.budget.currentSpent;
      if (costLevel > remaining * 0.8) {
        cons.push("⚠️ 接近预算上限");
      }
    }

    // 场景不匹配警告
    if (context.scenario) {
      const matchingStrategies = SCENARIO_MAPPING[context.scenario.type] || [];
      if (!matchingStrategies.includes(strategy.name)) {
        cons.push("非最佳场景匹配");
      }
    }

    return cons;
  }
}

// ==================== 辅助函数 ====================

/**
 * 从自然语言描述中解析推荐上下文
 */
export function parseRecommendationContext(
  description: string,
): RecommendationContext {
  const lowerDesc = description.toLowerCase();
  const context: RecommendationContext = {};

  // 场景识别
  const scenarioKeywords: Record<ScenarioType, string[]> = {
    education: ["教育", "学习", "子女", "学生", "education", "learning"],
    health: ["健康", "医疗", "养生", "health", "medical"],
    finance: ["金融", "股票", "交易", "投资", "finance", "trading"],
    coding: ["开发", "编程", "代码", "coding", "development", "programming"],
    research: ["研究", "分析", "深度", "research", "analysis"],
    creative: ["创作", "创意", "creative", "creation"],
    writing: ["写作", "文章", "writing", "article"],
    multimedia: ["多媒体", "视频", "音频", "multimedia", "video"],
    social: ["新媒体", "社交", "运营", "social media", "operation"],
    tools: ["工具", "辅助", "tool", "utility"],
    entertainment: ["娱乐", "游戏", "entertainment", "game"],
    documentation: ["公文", "文档", "报告", "documentation", "report"],
    daily: ["日常", "常规", "daily", "routine"],
  };

  for (const [type, keywords] of Object.entries(scenarioKeywords)) {
    if (keywords.some((kw) => lowerDesc.includes(kw))) {
      context.scenario = {
        type: type as ScenarioType,
        priority: "balanced",
      };
      break;
    }
  }

  // 优先级识别
  if (
    lowerDesc.includes("预算") ||
    lowerDesc.includes("便宜") ||
    lowerDesc.includes("成本") ||
    lowerDesc.includes("cost")
  ) {
    if (context.scenario) {
      context.scenario.priority = "cost";
    } else {
      context.scenario = { type: "daily", priority: "cost" };
    }
  } else if (
    lowerDesc.includes("质量") ||
    lowerDesc.includes("重要") ||
    lowerDesc.includes("关键") ||
    lowerDesc.includes("quality")
  ) {
    if (context.scenario) {
      context.scenario.priority = "quality";
    } else {
      context.scenario = { type: "daily", priority: "quality" };
    }
  } else if (
    lowerDesc.includes("紧急") ||
    lowerDesc.includes("快速") ||
    lowerDesc.includes("urgent") ||
    lowerDesc.includes("fast")
  ) {
    if (context.scenario) {
      context.scenario.priority = "speed";
    } else {
      context.scenario = { type: "daily", priority: "speed" };
    }
  }

  // 复杂度识别
  if (
    lowerDesc.includes("复杂") ||
    lowerDesc.includes("深度") ||
    lowerDesc.includes("complex")
  ) {
    if (context.scenario) {
      context.scenario.complexity = "complex";
    }
  } else if (
    lowerDesc.includes("简单") ||
    lowerDesc.includes("简易") ||
    lowerDesc.includes("simple")
  ) {
    if (context.scenario) {
      context.scenario.complexity = "simple";
    }
  }

  // 预算识别
  const budgetMatch = lowerDesc.match(/(\d+)\s*元/);
  if (budgetMatch) {
    context.budget = {
      monthly: parseInt(budgetMatch[1]),
      currentSpent: 0,
      alertThreshold: 0.8,
    };
  }

  // 紧急情况
  if (lowerDesc.includes("紧急") || lowerDesc.includes("urgent")) {
    context.timeContext = {
      isUrgent: true,
    };
  }

  return context;
}
