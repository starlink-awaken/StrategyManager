import { LocalStatsSyncBase } from './LocalStatsSync';
import { UsageData } from './interfaces';

/**
 * OpenAI 本地统计同步器
 * 
 * 用于 OAuth token 场景下无法访问 Usage API 的情况
 * 通过本地日志跟踪使用量
 * 精确度: 75%
 */
export class OpenAILocalSync extends LocalStatsSyncBase {
  readonly provider = 'openai';
  
  protected getDefaultStatsFile(): string {
    return `${process.env.HOME}/.local/share/openai/stats.json`;
  }
  
  protected getDefaultStats(): any {
    return {
      provider: 'openai',
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
      const cost = this.calculateCost('gpt-4', stats.totalInput || 0, stats.totalOutput || 0);
      
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
      'gpt-4o': { input: 2.5, output: 10 },
      'gpt-4o-mini': { input: 0.15, output: 0.6 },
      'gpt-4-turbo': { input: 10, output: 30 },
      'gpt-4': { input: 30, output: 60 },
      'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
      'o1': { input: 15, output: 60 },
      'o1-mini': { input: 3, output: 12 },
    };
    
    let rates = pricing[model];
    
    if (!rates) {
      for (const [key, value] of Object.entries(pricing)) {
        if (model.includes(key)) {
          rates = value;
          break;
        }
      }
    }
    
    if (!rates) {
      rates = pricing['gpt-4'];
    }
    
    const inputCost = inputTokens * rates.input / 1000000;
    const outputCost = outputTokens * rates.output / 1000000;
    
    return inputCost + outputCost;
  }
  
  /**
   * 从 OpenCode auth 配置创建实例
   */
  static fromOpenCodeAuth(authConfig: any): OpenAILocalSync {
    return new OpenAILocalSync();
  }
}
