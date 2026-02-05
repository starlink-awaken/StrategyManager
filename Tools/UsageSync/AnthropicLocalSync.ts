import { LocalStatsSyncBase } from './LocalStatsSync';
import { UsageData } from './interfaces';

/**
 * Anthropic 本地统计同步器
 * 
 * 绕过 Claude CLI 调用（耗时 >120s）
 * 通过本地日志跟踪使用量
 * 精确度: 75%
 */
export class AnthropicLocalSync extends LocalStatsSyncBase {
  readonly provider = 'anthropic';
  
  protected getDefaultStatsFile(): string {
    return `${process.env.HOME}/.local/share/anthropic/stats.json`;
  }
  
  protected getDefaultStats(): any {
    return {
      provider: 'anthropic',
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
            cachedTokens: m.cachedTokens,
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
      const cost = this.calculateCost('claude-3-5-sonnet-20241022', stats.totalInput || 0, stats.totalOutput || 0);
      
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
      'claude-opus-4-20250514': { input: 15, output: 75 },
      'claude-3-7-sonnet-20250219': { input: 3, output: 15 },
      'claude-3-5-sonnet-20241022': { input: 3, output: 15 },
      'claude-3-5-sonnet-20240620': { input: 3, output: 15 },
      'claude-3-5-haiku-20241022': { input: 1, output: 5 },
      'claude-3-opus-20240229': { input: 15, output: 75 },
      'claude-3-sonnet-20240229': { input: 3, output: 15 },
      'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
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
      rates = pricing['claude-3-5-sonnet-20241022'];
    }
    
    const inputCost = inputTokens * rates.input / 1000000;
    const outputCost = outputTokens * rates.output / 1000000;
    
    return inputCost + outputCost;
  }
  
  /**
   * 从 OpenCode auth 配置创建实例
   */
  static fromOpenCodeAuth(authConfig: any): AnthropicLocalSync {
    return new AnthropicLocalSync();
  }
}
