import { LocalStatsSyncBase } from './LocalStatsSync';
import { UsageData } from './interfaces';

/**
 * Gemini 本地统计同步器
 * 
 * 绕过 OAuth token 过期问题
 * 通过本地日志跟踪使用量
 * 精确度: 75%
 */
export class GeminiLocalSync extends LocalStatsSyncBase {
  readonly provider = 'gemini';
  
  protected getDefaultStatsFile(): string {
    return `${process.env.HOME}/.local/share/gemini/stats.json`;
  }
  
  protected getDefaultStats(): any {
    return {
      provider: 'gemini',
      models: {},
      totalInput: 0,
      totalOutput: 0,
      requestCount: 0,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };
  }
  
  protected transformData(stats: any, period?: { start: Date; end: Date }): UsageData[] {
    const now = new Date();
    const startDate = period?.start || new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = period?.end || now;
    
    const usageByModel = new Map<string, UsageData>();
    
    if (stats.models) {
      for (const [modelName, modelStats] of Object.entries(stats.models)) {
        const m = modelStats as any;
        
        const cost = this.calculateCost(modelName, m.totalInput || 0, m.totalOutput || 0);
        
        usageByModel.set(modelName, {
          provider: this.provider,
          model: modelName,
          usage: {
            inputTokens: m.totalInput || 0,
            outputTokens: m.totalOutput || 0,
            totalTokens: (m.totalInput || 0) + (m.totalOutput || 0),
            requests: m.requestCount || 0,
            cachedTokens: undefined,
          },
          cost,
          source: '⚠️ 估算 (本地)',
          accuracy: this.accuracy,
          period: {
            start: startDate,
            end: endDate,
          },
          lastUpdated: new Date(stats.lastUpdated || now),
        });
      }
    }
    
    if (usageByModel.size === 0) {
      const cost = this.calculateCost('gemini-2.0-flash-exp', stats.totalInput || 0, stats.totalOutput || 0);
      
      usageByModel.set('all-models', {
        provider: this.provider,
        model: 'all-models',
        usage: {
          inputTokens: stats.totalInput || 0,
          outputTokens: stats.totalOutput || 0,
          totalTokens: (stats.totalInput || 0) + (stats.totalOutput || 0),
          requests: stats.requestCount || 0,
          cachedTokens: undefined,
        },
        cost,
        source: '⚠️ 估算 (本地)',
        accuracy: this.accuracy,
        period: {
          start: startDate,
          end: endDate,
        },
        lastUpdated: new Date(stats.lastUpdated || now),
      });
    }
    
    return Array.from(usageByModel.values());
  }
  
  private calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const pricing: Record<string, { input: number; output: number }> = {
      'gemini-2.0-flash-exp': { input: 0, output: 0 },
      'gemini-2.0-flash-thinking-exp': { input: 0, output: 0 },
      'gemini-1.5-pro': { input: 1.25, output: 5 },
      'gemini-1.5-flash': { input: 0.075, output: 0.3 },
      'gemini-1.5-flash-8b': { input: 0.0375, output: 0.15 },
      'gemini-1.0-pro': { input: 0.5, output: 1.5 },
    };
    
    let rates = pricing[model];
    
    if (!rates) {
      for (const [key, value] of Object.entries(pricing)) {
        if (model.includes(key) || key.includes(model)) {
          rates = value;
          break;
        }
      }
    }
    
    if (!rates) {
      rates = pricing['gemini-2.0-flash-exp'];
    }
    
    const inputCost = inputTokens * rates.input / 1000000;
    const outputCost = outputTokens * rates.output / 1000000;
    
    return inputCost + outputCost;
  }
  
  /**
   * 从 OpenCode auth 配置创建实例
   */
  static fromOpenCodeAuth(authConfig: any): GeminiLocalSync {
    return new GeminiLocalSync();
  }
}
