import type { UsageData } from './interfaces';

/**
 * 使用量数据验证器
 * 
 * 职责:
 * - 验证 UsageData 格式和字段完整性
 * - 检测异常值和不一致
 * - 提供验证报告
 */
export class Validator {
  /**
   * 验证单条使用量记录
   */
  static validateUsageData(data: UsageData): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // 必填字段检查
    if (!data.provider) {
      errors.push('Missing required field: provider');
    }
    
    if (!data.model) {
      errors.push('Missing required field: model');
    }
    
    if (!data.usage) {
      errors.push('Missing required field: usage');
    }
    
    if (!data.source) {
      errors.push('Missing required field: source');
    }
    
    // 值范围检查
    if (data.accuracy !== undefined) {
      if (data.accuracy < 0 || data.accuracy > 100) {
        errors.push(`Invalid accuracy: ${data.accuracy} (must be 0-100)`);
      }
    }
    
    // 使用量字段检查
    if (data.usage) {
      const { inputTokens, outputTokens, totalTokens } = data.usage;
      
      if (inputTokens === undefined) {
        errors.push('Missing field: usage.inputTokens');
      } else if (inputTokens < 0) {
        errors.push(`Invalid inputTokens: ${inputTokens} (must be >= 0)`);
      }
      
      if (outputTokens === undefined) {
        errors.push('Missing field: usage.outputTokens');
      } else if (outputTokens < 0) {
        errors.push(`Invalid outputTokens: ${outputTokens} (must be >= 0)`);
      }
      
      if (totalTokens === undefined) {
        errors.push('Missing field: usage.totalTokens');
      } else if (totalTokens < 0) {
        errors.push(`Invalid totalTokens: ${totalTokens} (must be >= 0)`);
      }
      
      // 一致性检查
      if (
        inputTokens !== undefined &&
        outputTokens !== undefined &&
        totalTokens !== undefined
      ) {
        const calculatedTotal = inputTokens + outputTokens;
        if (totalTokens !== calculatedTotal && totalTokens > 0) {
          // 允许小的舍入误差
          if (Math.abs(totalTokens - calculatedTotal) > 1) {
            warnings.push(
              `Inconsistent totalTokens: ${totalTokens} != ${inputTokens} + ${outputTokens}`
            );
          }
        }
      }
    }
    
    // 时间检查
    if (!data.period || !data.period.start || !data.period.end) {
      errors.push('Missing or incomplete field: period');
    } else {
      if (data.period.start > data.period.end) {
        errors.push('Invalid period: start > end');
      }
      
      // 检查时间戳是否合理
      const now = new Date();
      if (data.period.end > now) {
        warnings.push(`Period end is in the future: ${data.period.end}`);
      }
    }
    
    // 成本检查
    if (data.cost !== undefined && data.cost < 0) {
      warnings.push(`Negative cost: ${data.cost}`);
    }
    
    // 源标记检查
    const validSources = ['✅ API (官方)', '⚠️ 估算 (本地)'];
    if (!validSources.includes(data.source)) {
      warnings.push(`Unknown source type: ${data.source}`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
  
  /**
   * 批量验证使用量记录
   */
  static validateBatch(dataList: UsageData[]): {
    valid: boolean;
    validCount: number;
    invalidCount: number;
    errors: Map<number, string[]>;
    warnings: Map<number, string[]>;
  } {
    const errors = new Map<number, string[]>();
    const warnings = new Map<number, string[]>();
    let validCount = 0;
    let invalidCount = 0;
    
    for (let i = 0; i < dataList.length; i++) {
      const result = this.validateUsageData(dataList[i]);
      
      if (result.valid) {
        validCount++;
      } else {
        invalidCount++;
        errors.set(i, result.errors);
      }
      
      if (result.warnings.length > 0) {
        warnings.set(i, result.warnings);
      }
    }
    
    return {
      valid: invalidCount === 0,
      validCount,
      invalidCount,
      errors,
      warnings,
    };
  }
  
  /**
   * 检测重复数据
   */
  static detectDuplicates(dataList: UsageData[]): {
    hasDuplicates: boolean;
    duplicates: Array<{
      indices: number[];
      key: string;
      count: number;
    }>;
  } {
    const duplicates: Array<{
      indices: number[];
      key: string;
      count: number;
    }> = [];
    
    const keyMap = new Map<string, number[]>();
    
    for (let i = 0; i < dataList.length; i++) {
      const data = dataList[i];
      const key = `${data.provider}:${data.model}:${data.period.start.getTime()}-${data.period.end.getTime()}`;
      
      if (!keyMap.has(key)) {
        keyMap.set(key, []);
      }
      keyMap.get(key)!.push(i);
    }
    
    for (const [key, indices] of keyMap.entries()) {
      if (indices.length > 1) {
        duplicates.push({
          key,
          indices,
          count: indices.length,
        });
      }
    }
    
    return {
      hasDuplicates: duplicates.length > 0,
      duplicates,
    };
  }
  
  /**
   * 检测异常值
   */
  static detectAnomalies(dataList: UsageData[]): {
    anomalies: Array<{
      index: number;
      type: string;
      message: string;
      value: any;
    }>;
  } {
    const anomalies: Array<{
      index: number;
      type: string;
      message: string;
      value: any;
    }> = [];
    
    // 计算统计数据
    const tokenCounts = dataList
      .map(d => d.usage.totalTokens || 0)
      .filter(t => t > 0)
      .sort((a, b) => a - b);
    
    if (tokenCounts.length > 0) {
      const mean = tokenCounts.reduce((a, b) => a + b) / tokenCounts.length;
      const stdDev = Math.sqrt(
        tokenCounts.reduce((a, b) => a + Math.pow(b - mean, 2)) / tokenCounts.length
      );
      
      const threshold = mean + 3 * stdDev; // 3-sigma 规则
      
      for (let i = 0; i < dataList.length; i++) {
        const tokens = dataList[i].usage.totalTokens || 0;
        if (tokens > threshold) {
          anomalies.push({
            index: i,
            type: 'outlier',
            message: `Unusually high token count: ${tokens} (3σ threshold: ${threshold.toFixed(2)})`,
            value: tokens,
          });
        }
      }
    }
    
    // 成本异常检查
    const costs = dataList
      .map(d => d.cost || 0)
      .filter(c => c > 0)
      .sort((a, b) => a - b);
    
    if (costs.length > 0) {
      const meanCost = costs.reduce((a, b) => a + b) / costs.length;
      const stdDevCost = Math.sqrt(
        costs.reduce((a, b) => a + Math.pow(b - meanCost, 2)) / costs.length
      );
      
      const costThreshold = meanCost + 3 * stdDevCost;
      
      for (let i = 0; i < dataList.length; i++) {
        const cost = dataList[i].cost || 0;
        if (cost > costThreshold) {
          anomalies.push({
            index: i,
            type: 'cost_outlier',
            message: `Unusually high cost: $${cost.toFixed(4)} (3σ threshold: $${costThreshold.toFixed(4)})`,
            value: cost,
          });
        }
      }
    }
    
    return { anomalies };
  }
}
