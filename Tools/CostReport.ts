import type { UsageData } from './UsageSync/interfaces';
import { CostCalculator } from './UsageSync/CostCalculator';

/**
 * 成本报告生成器
 */
export class CostReport {
  private data: UsageData[];
  private period: { start: Date; end: Date };
  
  constructor(data: UsageData[], period: { start: Date; end: Date }) {
    this.data = data;
    this.period = period;
  }
  
  /**
   * 生成简单文本报告
   */
  generateTextReport(): string {
    const costReport = CostCalculator.generateCostReport(this.data);
    
    const lines: string[] = [
      '═'.repeat(60),
      '                    AI USAGE COST REPORT',
      '═'.repeat(60),
      '',
      `Generated: ${new Date().toISOString()}`,
      `Period: ${this.period.start.toLocaleDateString()} - ${this.period.end.toLocaleDateString()}`,
      '',
      `Total Cost: $${costReport.totalCost.toFixed(2)}`,
      `Records: ${this.data.length}`,
      `Avg Cost/Request: $${costReport.averageCostPerRequest.toFixed(6)}`,
      `Avg Cost/Token: $${costReport.averageCostPerToken.toFixed(9)}`,
      '',
      'Cost by Provider:',
      '-'.repeat(60),
    ];
    
    const providers = Object.entries(costReport.costByProvider)
      .sort(([, a], [, b]) => (b as any).cost - (a as any).cost);
    
    for (const [provider, stats] of providers) {
      const s = stats as any;
      lines.push(`  ${provider.padEnd(20)} $${s.cost.toFixed(2).padStart(10)} (${s.percentage.toFixed(1).padStart(5)}%)`);
    }
    
    lines.push('');
    lines.push('═'.repeat(60));
    
    return lines.join('\n');
  }
  
  /**
   * 生成 JSON 报告
   */
  generateJsonReport(): string {
    const costReport = CostCalculator.generateCostReport(this.data);
    
    return JSON.stringify({
      generated: new Date().toISOString(),
      period: {
        start: this.period.start.toISOString(),
        end: this.period.end.toISOString(),
      },
      summary: {
        totalRecords: this.data.length,
        totalCost: costReport.totalCost,
        averageCostPerRequest: costReport.averageCostPerRequest,
        averageCostPerToken: costReport.averageCostPerToken,
      },
      costByProvider: costReport.costByProvider,
      costByModel: costReport.costByModel,
    }, null, 2);
  }
  
  /**
   * 保存报告到文件
   */
  async saveToFile(
    format: 'text' | 'json',
    filepath: string
  ): Promise<void> {
    const fs = require('fs').promises;
    
    const content = format === 'text' 
      ? this.generateTextReport()
      : this.generateJsonReport();
    
    await fs.writeFile(filepath, content, 'utf-8');
  }
}
