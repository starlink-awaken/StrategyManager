import type { UsageData } from './interfaces';

/**
 * 成本计算器
 * 
 * 职责:
 * - 基于 token 数计算成本
 * - 支持不同厂商的定价模型
 * - 生成成本报告
 */
export class CostCalculator {
  /**
   * 厂商定价 (单位: USD)
   * 
   * 定价来源:
   * - Anthropic: https://www.anthropic.com/pricing
   * - OpenAI: https://openai.com/pricing
   * - ZhiPu: https://open.bigmodel.cn/pricing
   * - GitHub Copilot: $10-20/用户/月
   * - Google Gemini: 部分免费，部分收费
   * - DeepSeek: https://www.deepseek.com/pricing
   * - Silicon Flow: 根据厂商定价
   */
  private static readonly PRICING: Record<string, Record<string, { input: number; output: number }>> = {
    anthropic: {
      'claude-3-5-sonnet': { input: 3 / 1000000, output: 15 / 1000000 },
      'claude-3-opus': { input: 15 / 1000000, output: 75 / 1000000 },
      'claude-3-haiku': { input: 0.25 / 1000000, output: 1.25 / 1000000 },
      'claude-2': { input: 8 / 1000000, output: 24 / 1000000 },
      'default': { input: 3 / 1000000, output: 15 / 1000000 },
    },
    openai: {
      'gpt-4-turbo': { input: 0.01 / 1000, output: 0.03 / 1000 },
      'gpt-4': { input: 0.03 / 1000, output: 0.06 / 1000 },
      'gpt-3.5-turbo': { input: 0.0005 / 1000, output: 0.0015 / 1000 },
      'gpt-4o': { input: 0.005 / 1000, output: 0.015 / 1000 },
      'default': { input: 0.01 / 1000, output: 0.03 / 1000 },
    },
    zhipu: {
      'glm-4': { input: 0.0001, output: 0.0001 }, // 按万元单位
      'glm-3.5-turbo': { input: 0.00005, output: 0.00005 },
      'default': { input: 0.0001, output: 0.0001 },
    },
    gemini: {
      'gemini-pro': { input: 0, output: 0 }, // 部分免费
      'default': { input: 0, output: 0 },
    },
    github: {
      'copilot': { input: 10 / 30, output: 0 }, // $10/月，按天平均
      'default': { input: 10 / 30, output: 0 },
    },
    deepseek: {
      'deepseek-chat': { input: 0.14 / 1000000, output: 0.28 / 1000000 },
      'deepseek-code': { input: 0.14 / 1000000, output: 0.28 / 1000000 },
      'default': { input: 0.14 / 1000000, output: 0.28 / 1000000 },
    },
    dashscope: {
      'qwen-max': { input: 2 / 1000000, output: 6 / 1000000 },
      'qwen-3.5-plus': { input: 0.1 / 1000000, output: 0.3 / 1000000 },
      'default': { input: 1 / 1000000, output: 3 / 1000000 },
    },
    step: {
      'step-3.5-flash': { input: 0.15 / 1000000, output: 0.45 / 1000000 },
      'step-2-16k': { input: 1 / 1000000, output: 3 / 1000000 },
      'default': { input: 1 / 1000000, output: 3 / 1000000 },
    },
    siliconflow: {
      'deepseek-chat': { input: 0.14 / 1000000, output: 0.28 / 1000000 },
      'deepseek-code': { input: 0.14 / 1000000, output: 0.28 / 1000000 },
      'default': { input: 0.14 / 1000000, output: 0.28 / 1000000 },
    },
    siliconflow: {
      'default': { input: 0.01 / 1000000, output: 0.03 / 1000000 },
    },
  };
  
  /**
   * 计算单条记录的成本
   */
  static calculateCost(data: UsageData): number {
    const provider = data.provider.toLowerCase();
    const model = data.model.toLowerCase();
    
    // 获取定价信息
    const providerPricing = this.PRICING[provider];
    if (!providerPricing) {
      console.warn(`Unknown provider: ${provider}, using default pricing`);
      return data.cost || 0;
    }
    
    const pricing = providerPricing[model] || providerPricing['default'];
    
    // 计算成本
    const inputCost = (data.usage.inputTokens || 0) * pricing.input;
    const outputCost = (data.usage.outputTokens || 0) * pricing.output;
    
    return inputCost + outputCost;
  }
  
  /**
   * 批量计算成本并更新数据
   */
  static calculateBatchCost(dataList: UsageData[]): UsageData[] {
    return dataList.map(data => ({
      ...data,
      cost: this.calculateCost(data),
    }));
  }
  
  /**
   * 生成成本报告
   */
  static generateCostReport(dataList: UsageData[]): {
    totalCost: number;
    costByProvider: Record<string, { cost: number; percentage: number; count: number }>;
    costByModel: Record<string, { cost: number; percentage: number }>;
    averageCostPerRequest: number;
    averageCostPerToken: number;
    period: { start: Date; end: Date };
  } {
    const costByProvider: Record<string, { cost: number; count: number; percentage?: number }> = {};
    const costByModel: Record<string, { cost: number; percentage: number }> = {};
    
    let totalCost = 0;
    let totalTokens = 0;
    let totalRequests = 0;
    
    const periods = {
      start: new Date(),
      end: new Date(0),
    };
    
    for (const data of dataList) {
      const cost = this.calculateCost(data);
      totalCost += cost;
      
      // 按厂商统计
      if (!costByProvider[data.provider]) {
        costByProvider[data.provider] = { cost: 0, count: 0 };
      }
      costByProvider[data.provider].cost += cost;
      costByProvider[data.provider].count += 1;
      
      // 按模型统计
      const modelKey = `${data.provider}:${data.model}`;
      if (!costByModel[modelKey]) {
        costByModel[modelKey] = { cost: 0, percentage: 0 };
      }
      costByModel[modelKey].cost += cost;
      
      // 统计总量
      totalTokens += data.usage.totalTokens || 0;
      totalRequests += data.usage.requests || 1;
      
      // 更新时间范围
      if (data.period.start < periods.start) periods.start = data.period.start;
      if (data.period.end > periods.end) periods.end = data.period.end;
    }
    
    // 计算百分比
    const finalCostByProvider: Record<string, { cost: number; percentage: number; count: number }> = {};
    for (const provider in costByProvider) {
      const cost = costByProvider[provider].cost;
      const count = costByProvider[provider].count;
      finalCostByProvider[provider] = {
        cost,
        percentage: totalCost > 0 ? (cost / totalCost) * 100 : 0,
        count,
      };
    }
    
    for (const model in costByModel) {
      costByModel[model].percentage = totalCost > 0 ? (costByModel[model].cost / totalCost) * 100 : 0;
    }
    
    return {
      totalCost,
      costByProvider: finalCostByProvider,
      costByModel,
      averageCostPerRequest: totalRequests > 0 ? totalCost / totalRequests : 0,
      averageCostPerToken: totalTokens > 0 ? totalCost / totalTokens : 0,
      period: periods,
    };
  }
  
  /**
   * 获取模型的定价信息
   */
  static getPricing(provider: string, model?: string): { input: number; output: number } | null {
    const providerPricing = this.PRICING[provider.toLowerCase()];
    if (!providerPricing) return null;
    
    if (model) {
      return providerPricing[model.toLowerCase()] || providerPricing['default'];
    }
    
    return providerPricing['default'];
  }
  
  /**
   * 更新定价（用于动态调整）
   */
  static updatePricing(
    provider: string,
    model: string,
    pricing: { input: number; output: number }
  ): void {
    const p = provider.toLowerCase();
    const m = model.toLowerCase();
    
    if (!this.PRICING[p]) {
      this.PRICING[p] = {};
    }
    
    this.PRICING[p][m] = pricing;
  }
}
