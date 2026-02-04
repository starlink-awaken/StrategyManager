import type { UsageData } from './interfaces';

/**
 * 数据来源标记器
 * 
 * 职责:
 * - 标记数据来源（官方 API vs 本地估算）
 * - 根据精确度调整信息
 * - 生成源信息报告
 */
export class SourceTagger {
  /**
   * 厂商精确度映射
   */
  private static readonly ACCURACY_LEVELS: Record<string, { level: string; description: string }> = {
    'anthropic': { level: '⭐⭐⭐⭐⭐', description: 'CLI 官方数据' },
    'openai': { level: '⭐⭐⭐⭐⭐', description: 'API 官方数据' },
    'zhipu': { level: '⭐⭐⭐⭐', description: 'API 官方数据' },
    'github': { level: '⭐⭐⭐⭐⭐', description: 'Billing API 官方数据' },
    'gemini': { level: '⭐⭐⭐⭐', description: 'Quota API 官方数据' },
    'deepseek': { level: '⭐⭐⭐', description: '本地统计估算' },
    'siliconflow': { level: '⭐⭐⭐', description: '本地统计估算' },
  };
  
  /**
   * 标记单条数据的来源
   */
  static tagData(data: UsageData): UsageData & { sourceInfo: any } {
    const provider = data.provider.toLowerCase();
    const accuracy = data.accuracy || 75;
    
    const accuracyInfo = this.ACCURACY_LEVELS[provider] || {
      level: '⭐⭐⭐',
      description: '未知来源',
    };
    
    const isOfficial = accuracy >= 90;
    const sourceType = isOfficial ? '✅ API (官方)' : '⚠️ 估算 (本地)';
    
    return {
      ...data,
      source: sourceType as any,
      sourceInfo: {
        provider,
        accuracy,
        accuracyLevel: accuracyInfo.level,
        accuracyDescription: accuracyInfo.description,
        isOfficial,
        trustLevel: this.calculateTrustLevel(accuracy),
        recommendation: this.generateRecommendation(accuracy, provider),
      },
    };
  }
  
  /**
   * 批量标记数据来源
   */
  static tagBatch(dataList: UsageData[]): (UsageData & { sourceInfo: any })[] {
    return dataList.map(data => this.tagData(data));
  }
  
  /**
   * 计算信任级别
   */
  private static calculateTrustLevel(accuracy: number): 'high' | 'medium' | 'low' {
    if (accuracy >= 95) return 'high';
    if (accuracy >= 80) return 'medium';
    return 'low';
  }
  
  /**
   * 生成建议
   */
  private static generateRecommendation(accuracy: number, provider: string): string {
    if (accuracy >= 99) {
      return '✅ 高精确度官方数据，可直接用于成本核算';
    }
    if (accuracy >= 90) {
      return '✅ 官方数据，略有偏差，可用于成本核算';
    }
    if (accuracy >= 75) {
      return '⚠️ 本地估算，误差较大，仅供参考';
    }
    return '❌ 低精确度，强烈建议寻求官方数据源';
  }
  
  /**
   * 生成来源统计报告
   */
  static generateSourceReport(dataList: UsageData[]): {
    totalCount: number;
    officialCount: number;
    estimatedCount: number;
    officialPercentage: number;
    estimatedPercentage: number;
    accuracyDistribution: Record<string, number>;
    providerBreakdown: Record<string, {
      count: number;
      accuracy: number;
      level: string;
      description: string;
    }>;
    overallAccuracy: number;
  } {
    let officialCount = 0;
    let estimatedCount = 0;
    const accuracyDistribution: Record<string, number> = {};
    const providerBreakdown: Record<string, {
      count: number;
      accuracy: number;
      level: string;
      description: string;
    }> = {};
    
    let totalAccuracy = 0;
    
    for (const data of dataList) {
      const isOfficial = data.accuracy >= 90;
      if (isOfficial) {
        officialCount++;
      } else {
        estimatedCount++;
      }
      
      // 精确度分布
      const accuracyBucket = `${Math.floor(data.accuracy / 10) * 10}-${Math.floor(data.accuracy / 10) * 10 + 10}%`;
      accuracyDistribution[accuracyBucket] = (accuracyDistribution[accuracyBucket] || 0) + 1;
      
      // 厂商统计
      const provider = data.provider.toLowerCase();
      if (!providerBreakdown[provider]) {
        const accuracy = this.ACCURACY_LEVELS[provider] ? data.accuracy : 75;
        providerBreakdown[provider] = {
          count: 0,
          accuracy,
          level: this.ACCURACY_LEVELS[provider]?.level || '⭐⭐⭐',
          description: this.ACCURACY_LEVELS[provider]?.description || '未知',
        };
      }
      providerBreakdown[provider].count += 1;
      
      totalAccuracy += data.accuracy;
    }
    
    const totalCount = dataList.length;
    const overallAccuracy = totalCount > 0 ? totalAccuracy / totalCount : 0;
    
    return {
      totalCount,
      officialCount,
      estimatedCount,
      officialPercentage: totalCount > 0 ? (officialCount / totalCount) * 100 : 0,
      estimatedPercentage: totalCount > 0 ? (estimatedCount / totalCount) * 100 : 0,
      accuracyDistribution,
      providerBreakdown,
      overallAccuracy: Math.round(overallAccuracy * 10) / 10,
    };
  }
  
  /**
   * 验证数据质量
   */
  static validateDataQuality(dataList: UsageData[]): {
    qualityScore: number;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    let estimatedDataPercentage = 0;
    let lowAccuracyCount = 0;
    const accuracies: number[] = [];
    
    for (const data of dataList) {
      accuracies.push(data.accuracy);
      
      if (data.accuracy < 90) {
        estimatedDataPercentage += 1;
      }
      if (data.accuracy < 75) {
        lowAccuracyCount += 1;
      }
    }
    
    const totalCount = dataList.length;
    estimatedDataPercentage = (estimatedDataPercentage / totalCount) * 100;
    
    // 计算质量分数 (0-100)
    let qualityScore = 100;
    
    if (estimatedDataPercentage > 30) {
      issues.push(`估算数据过多 (${estimatedDataPercentage.toFixed(1)}%)`);
      qualityScore -= 20;
      recommendations.push('建议寻求更多官方 API 来源');
    }
    
    if (lowAccuracyCount > 0) {
      issues.push(`${lowAccuracyCount} 条记录精确度低于 75%`);
      qualityScore -= 10;
    }
    
    // 精确度方差检查
    const meanAccuracy = accuracies.reduce((a, b) => a + b) / accuracies.length;
    const variance = accuracies.reduce((a, b) => a + Math.pow(b - meanAccuracy, 2)) / accuracies.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev > 10) {
      issues.push(`数据精确度差异大 (标准差: ${stdDev.toFixed(1)})`);
      qualityScore -= 10;
      recommendations.push('建议对不同厂商的数据分别处理');
    }
    
    if (lowAccuracyCount === 0 && estimatedDataPercentage === 0) {
      recommendations.push('✅ 所有数据均为官方来源，可放心使用');
    }
    
    return {
      qualityScore: Math.max(0, Math.min(100, qualityScore)),
      issues,
      recommendations,
    };
  }
  
  /**
   * 生成数据源证书 (用于审计)
   */
  static generateSourceCertificate(dataList: UsageData[], period: { start: Date; end: Date }): string {
    const report = this.generateSourceReport(dataList);
    const quality = this.validateDataQuality(dataList);
    
    const lines: string[] = [
      '='.repeat(60),
      'USAGE DATA SOURCE CERTIFICATE',
      '='.repeat(60),
      '',
      `Generated: ${new Date().toISOString()}`,
      `Period: ${period.start.toISOString()} to ${period.end.toISOString()}`,
      '',
      'DATA COMPOSITION',
      '-'.repeat(60),
      `Total Records: ${report.totalCount}`,
      `Official API: ${report.officialCount} (${report.officialPercentage.toFixed(1)}%)`,
      `Estimated: ${report.estimatedCount} (${report.estimatedPercentage.toFixed(1)}%)`,
      `Overall Accuracy: ${report.overallAccuracy}%`,
      '',
      'PROVIDER BREAKDOWN',
      '-'.repeat(60),
    ];
    
    for (const [provider, stats] of Object.entries(report.providerBreakdown)) {
      lines.push(
        `${provider.padEnd(15)} | Count: ${String(stats.count).padStart(3)} | Accuracy: ${String(stats.accuracy).padStart(3)}% | ${stats.level}`
      );
    }
    
    lines.push('');
    lines.push('DATA QUALITY ASSESSMENT');
    lines.push('-'.repeat(60));
    lines.push(`Quality Score: ${quality.qualityScore}/100`);
    
    if (quality.issues.length > 0) {
      lines.push('Issues:');
      quality.issues.forEach(issue => {
        lines.push(`  ⚠️  ${issue}`);
      });
    } else {
      lines.push('✅ No data quality issues detected');
    }
    
    lines.push('');
    if (quality.recommendations.length > 0) {
      lines.push('Recommendations:');
      quality.recommendations.forEach(rec => {
        lines.push(`  • ${rec}`);
      });
    }
    
    lines.push('');
    lines.push('='.repeat(60));
    lines.push('This certificate verifies the source and quality of usage data.');
    lines.push('='.repeat(60));
    
    return lines.join('\n');
  }
}
