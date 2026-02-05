import { LocalStatsSyncBase } from './LocalStatsSync';
import { UsageData } from './interfaces';

/**
 * ZhiPu 本地统计同步器
 * 
 * 作为 API 同步失败时的备选方案
 * 精确度: 75%
 */
export class ZhiPuLocalSync extends LocalStatsSyncBase {
  readonly provider = 'zhipu';
  readonly accuracy = 75;
  
  protected getDefaultStatsFile(): string {
    return `${process.env.HOME}/.local/share/zhipu/stats.json`;
  }
  
  protected getDefaultStats(): any {
    return {
      provider: 'zhipu',
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
      const cost = this.calculateCost('glm-4', stats.totalInput || 0, stats.totalOutput || 0);
      
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
      'glm-4-plus': { input: 50, output: 50 },
      'glm-4-0520': { input: 100, output: 100 },
      'glm-4': { input: 100, output: 100 },
      'glm-4-air': { input: 1, output: 1 },
      'glm-4-airx': { input: 10, output: 10 },
      'glm-4-flash': { input: 0.1, output: 0.1 },
      'glm-3-turbo': { input: 5, output: 5 },
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
      rates = pricing['glm-4'];
    }
    
    const inputCost = inputTokens * rates.input / 1000000;
    const outputCost = outputTokens * rates.output / 1000000;
    
    return inputCost + outputCost;
  }
  
  /**
   * 从 OpenCode auth 配置创建实例
   */
  static fromOpenCodeAuth(authConfig: any): ZhiPuLocalSync {
    return new ZhiPuLocalSync();
  }
}
