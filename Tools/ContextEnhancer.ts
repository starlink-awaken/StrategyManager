/**
 * ContextEnhancer.ts
 * 自然语言到增强上下文的转换器
 *
 * 功能:
 * - 从原始文本生成增强上下文
 * - 计算预算阶段、紧急程度、复杂度等维度
 * - 计算场景熟悉度
 * - 支持条件表达式解析
 */

import KeywordWeightEngine from "./KeywordWeightEngine";
import type {
  RecommendationContext,
  ScenarioConfig,
  HistoryData,
} from "./interfaces";

// ==================== 增强上下文类型 ====================

export interface EnhancedContext extends RecommendationContext {
  // 预算维度
  budgetPhase?: "early" | "mid" | "late";
  budgetUrgency?: number; // 0-1, 越接近上限越高

  // 时间维度
  urgencyLevel?: number; // 0-1, 紧急程度
  isRecurring?: boolean;

  // 复杂度维度
  complexityScore?: number; // 0-1, 基于关键词
  requiresThinking?: boolean; // 是否需要深度思考

  // 场景熟悉度
  scenarioFamiliarity?: number; // 0-1, 用户对该场景的熟悉度

  // 原始输入（用于后续分析）
  rawDescription?: string;
}

export interface ConditionalBranch {
  condition: string;
  thenContext: ScenarioConfig;
  elseContext?: ScenarioConfig;
  confidence: number;
}

// ==================== 上下文增强器类 ====================

export class ContextEnhancer {
  private keywordEngine: KeywordWeightEngine;

  constructor() {
    this.keywordEngine = new KeywordWeightEngine();
  }

  /**
   * 主方法: 从原始文本生成增强上下文
   */
  enhanceContext(
    rawDescription: string,
    baseContext?: RecommendationContext,
  ): EnhancedContext {
    const enhanced: EnhancedContext = {
      ...baseContext,
      rawDescription,
    };

    // 1. 场景识别
    const scenarios = this.keywordEngine.identifyScenarios(rawDescription);
    if (scenarios.primary[1] > 0.5) {
      // 置信度大于 50%
      enhanced.scenario = {
        type: scenarios.primary[0],
        priority: enhanced.scenario?.priority || "balanced",
        complexity: enhanced.scenario?.complexity,
      };
    }

    // 2. 优先级识别
    const priorityId = this.keywordEngine.identifyPriority(rawDescription);
    if (priorityId.priority) {
      if (enhanced.scenario) {
        enhanced.scenario.priority = priorityId.priority;
      } else {
        enhanced.scenario = {
          type: "daily",
          priority: priorityId.priority,
        };
      }
    }

    // 3. 复杂度计算
    enhanced.complexityScore =
      this.keywordEngine.calculateComplexity(rawDescription);
    if (enhanced.complexityScore > 0.6) {
      if (enhanced.scenario) {
        enhanced.scenario.complexity = "complex";
      }
      enhanced.requiresThinking = true;
    } else if (enhanced.complexityScore < 0.3) {
      if (enhanced.scenario) {
        enhanced.scenario.complexity = "simple";
      }
    }

    // 4. 紧急程度
    enhanced.urgencyLevel = this.keywordEngine.calculateUrgency(rawDescription);

    // 5. 预算阶段
    enhanced.budgetPhase = this.identifyBudgetPhase(enhanced.budget);

    // 6. 预算紧急度
    if (enhanced.budget) {
      enhanced.budgetUrgency = this.calculateBudgetUrgency(enhanced.budget);
    }

    // 7. 重复性任务
    enhanced.isRecurring = this.keywordEngine.isRecurringTask(rawDescription);

    // 8. 场景熟悉度
    if (enhanced.history) {
      enhanced.scenarioFamiliarity = this.calculateFamiliarity(
        rawDescription,
        enhanced.history,
      );
    }

    return enhanced;
  }

  /**
   * 识别预算阶段
   */
  private identifyBudgetPhase(
    budget?: any,
  ): "early" | "mid" | "late" | undefined {
    if (!budget) return undefined;

    const spent = budget.currentSpent || 0;
    const total = budget.monthly || 1;
    const ratio = spent / total;

    if (ratio < 0.33) return "early";
    if (ratio < 0.67) return "mid";
    return "late";
  }

  /**
   * 计算预算紧急度 (0-1)
   * 0 = 预算充足, 1 = 预算即将用尽
   */
  private calculateBudgetUrgency(budget: any): number {
    if (!budget) return 0;

    const spent = budget.currentSpent || 0;
    const total = budget.monthly || 1;
    const ratio = spent / total;

    // 线性映射: 使用率 0% → 0, 使用率 100% → 1
    return Math.min(Math.max(ratio, 0), 1);
  }

  /**
   * 计算场景熟悉度 (0-1)
   */
  private calculateFamiliarity(
    description: string,
    history: HistoryData,
  ): number {
    let familiarity = 0;

    // 1. 历史使用频率
    if (history.recentStrategies && history.recentStrategies.length > 5) {
      familiarity += 0.3;
    }

    // 2. 检查是否有常用场景匹配
    if (history.frequentScenarios) {
      const scenarioMatch = history.frequentScenarios.some((s) =>
        description.includes(s),
      );
      if (scenarioMatch) {
        familiarity += 0.4;
      }
    }

    // 3. 基于描述长度的推断
    // 长描述通常表示用户已经思考过，表示熟悉度高
    if (description.length > 100) {
      familiarity += 0.15;
    }

    return Math.min(familiarity, 1.0);
  }

  /**
   * 检测并解析条件表达式
   */
  detectConditionalExpressions(
    description: string,
  ): ConditionalBranch[] | null {
    const isConditional =
      this.keywordEngine.detectConditionalExpression(description);

    if (!isConditional) {
      return null;
    }

    // 模式1: "如果 [条件] 就 [策略A]，否则 [策略B]"
    const pattern1 = /如果(.+?)就(.+?)否则(.+)/.exec(description);
    if (pattern1) {
      return [
        {
          condition: pattern1[1].trim(),
          thenContext: this.parseStrategyDescription(pattern1[2].trim()),
          elseContext: this.parseStrategyDescription(pattern1[3].trim()),
          confidence: 0.85,
        },
      ];
    }

    // 模式2: "当 [条件] 时"
    const pattern2 = /当(.+?)时[，,](.+)/.exec(description);
    if (pattern2) {
      return [
        {
          condition: pattern2[1].trim(),
          thenContext: this.parseStrategyDescription(pattern2[2].trim()),
          confidence: 0.8,
        },
      ];
    }

    return null;
  }

  /**
   * 从策略描述文本解析场景配置
   */
  private parseStrategyDescription(text: string): ScenarioConfig {
    const scenarios = this.keywordEngine.identifyScenarios(text);
    const priority = this.keywordEngine.identifyPriority(text);

    return {
      type: scenarios.primary[0],
      priority: priority.priority || "balanced",
      complexity: this.getComplexityLevel(text),
    };
  }

  /**
   * 根据复杂度分数判断等级
   */
  private getComplexityLevel(
    text: string,
  ): "simple" | "medium" | "complex" | undefined {
    const complexity = this.keywordEngine.calculateComplexity(text);

    if (complexity > 0.6) return "complex";
    if (complexity < 0.3) return "simple";
    return "medium";
  }

  /**
   * 综合分析并生成推荐建议
   */
  generateRecommendationHint(enhanced: EnhancedContext): string {
    const hints: string[] = [];

    // 预算提示
    if (enhanced.budgetUrgency && enhanced.budgetUrgency > 0.8) {
      hints.push("⚠️ 预算即将用尽，建议优先考虑经济策略");
    }

    // 紧急提示
    if (enhanced.urgencyLevel && enhanced.urgencyLevel > 0.7) {
      hints.push("⏰ 任务紧急，建议选择响应快的策略");
    }

    // 复杂性提示
    if (enhanced.complexityScore && enhanced.complexityScore > 0.7) {
      hints.push("🧠  任务复杂，建议选择高质量策略");
    }

    // 熟悉度提示
    if (enhanced.scenarioFamiliarity && enhanced.scenarioFamiliarity > 0.7) {
      hints.push("✅ 该场景您很熟悉，可以参考历史偏好");
    }

    return hints.join(" ");
  }
}

export default ContextEnhancer;
