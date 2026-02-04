import { UsageSync, UsageData } from './interfaces';

/**
 * 本地统计同步器基类
 * 
 * 用于 DeepSeek 和 Silicon Flow 等本地模型
 * 通过本地日志或配置文件统计使用量
 * 精确度: 75%
 * 
 * 数据来源:
 * - 本地 token 计数器
 * - 配置文件中记录的请求数
 * - 估算成本
 */
export abstract class LocalStatsSyncBase implements UsageSync {
  abstract readonly provider: string;
  readonly accuracy = 75;
  
  protected statsFile: string;
  
  constructor(statsFile?: string) {
    this.statsFile = statsFile || this.getDefaultStatsFile();
  }
  
  protected abstract getDefaultStatsFile(): string;
  
  async healthCheck(): Promise<boolean> {
    try {
      const fs = require('fs').promises;
      await fs.stat(this.statsFile);
      return true;
    } catch {
      // 如果文件不存在，还是返回 true (可以创建新文件)
      return true;
    }
  }
  
  async fetchUsage(period?: { start: Date; end: Date }): Promise<UsageData[]> {
    try {
      const stats = await this.readStats();
      return this.transformData(stats, period);
    } catch (error: any) {
      throw new Error(`${this.provider} stats sync failed: ${error.message}`);
    }
  }
  
  protected async readStats(): Promise<any> {
    const fs = require('fs').promises;
    
    try {
      const content = await fs.readFile(this.statsFile, 'utf-8');
      return JSON.parse(content);
    } catch (error: any) {
      // 如果文件不存在或格式错误，返回空统计
      return this.getDefaultStats();
    }
  }
  
  protected abstract getDefaultStats(): any;
  
  protected abstract transformData(stats: any, period?: { start: Date; end: Date }): UsageData[];
  
  /**
   * 记录使用量
   */
  async recordUsage(tokens: { input: number; output: number }, model: string): Promise<void> {
    const fs = require('fs').promises;
    
    let stats = await this.readStats();
    
    if (!stats.models) stats.models = {};
    if (!stats.models[model]) {
      stats.models[model] = {
        totalInput: 0,
        totalOutput: 0,
        requestCount: 0,
      };
    }
    
    stats.models[model].totalInput += tokens.input;
    stats.models[model].totalOutput += tokens.output;
    stats.models[model].requestCount += 1;
    stats.lastUpdated = new Date().toISOString();
    
    await fs.writeFile(this.statsFile, JSON.stringify(stats, null, 2));
  }
}

/**
 * DeepSeek 本地统计同步器
 * 
 * 通过本地日志跟踪使用量
 * 精确度: 75%
 */
export class DeepSeekSync extends LocalStatsSyncBase {
  readonly provider = 'deepseek';
  
  protected getDefaultStatsFile(): string {
    return `${process.env.HOME}/.local/share/deepseek/stats.json`;
  }
  
  protected getDefaultStats(): any {
    return {
      provider: 'deepseek',
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
        
        // DeepSeek 成本: $0.14/M input, $0.28/M output
        const inputCost = (m.totalInput || 0) * 0.14 / 1000000;
        const outputCost = (m.totalOutput || 0) * 0.28 / 1000000;
        
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
          cost: inputCost + outputCost,
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
    
    // 如果没有模型数据，返回总计
    if (usageByModel.size === 0) {
      const inputCost = (stats.totalInput || 0) * 0.14 / 1000000;
      const outputCost = (stats.totalOutput || 0) * 0.28 / 1000000;
      
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
        cost: inputCost + outputCost,
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
}

/**
 * Silicon Flow 本地统计同步器
 * 
 * 通过本地配置跟踪使用量
 * 精确度: 75%
 */
export class SiliconFlowSync extends LocalStatsSyncBase {
  readonly provider = 'siliconflow';
  
  protected getDefaultStatsFile(): string {
    return `${process.env.HOME}/.local/share/siliconflow/stats.json`;
  }
  
  protected getDefaultStats(): any {
    return {
      provider: 'siliconflow',
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
        
        // Silicon Flow 成本: 根据具体模型而定，这里使用通用价格
        const inputCost = (m.totalInput || 0) * 0.01 / 1000000;
        const outputCost = (m.totalOutput || 0) * 0.03 / 1000000;
        
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
          cost: inputCost + outputCost,
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
    
    // 如果没有模型数据，返回总计
    if (usageByModel.size === 0) {
      const inputCost = (stats.totalInput || 0) * 0.01 / 1000000;
      const outputCost = (stats.totalOutput || 0) * 0.03 / 1000000;
      
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
        cost: inputCost + outputCost,
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
}
