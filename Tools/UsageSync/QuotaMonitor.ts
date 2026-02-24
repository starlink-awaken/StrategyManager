/**
 * 配额监控器 - 实时监控各厂商使用量并触发降级
 *
 * 功能：
 * - 跟踪各厂商配额使用情况
 * - 检测阈值并触发告警
 * - 提供降级建议
 * - 支持预算硬限制
 */

import {
  UsageData,
  QuotaStatus,
  QuotaConfig,
  BudgetConfig,
  CostOptimizationConfig,
} from "./interfaces";

export class QuotaMonitor {
  private providerQuotas: Map<string, QuotaConfig> = new Map();
  private budgetConfig: BudgetConfig | null = null;
  private currentUsage: Map<string, number> = new Map(); // provider -> tokens
  private quotaStatus: Map<string, QuotaStatus> = new Map();
  private costOptimizationConfig: CostOptimizationConfig | null = null;

  /**
   * 设置配额监控配置
   */
  configure(config: CostOptimizationConfig): void {
    this.costOptimizationConfig = config;
    
    if (config.providerQuotas) {
      for (const [provider, quota] of Object.entries(config.providerQuotas)) {
        this.providerQuotas.set(provider, quota);
      }
    }
    
    this.budgetConfig = config.budget || null;
  }

  /**
   * 更新使用量数据
   * 在每次 UsageSync 同步后调用
   */
  async updateUsage(usageData: UsageData[]): Promise<void> {
    // 按 provider 聚合 tokens
    const providerTokens = new Map<string, number>();
    
    for (const data of usageData) {
      const current = providerTokens.get(data.provider) || 0;
      providerTokens.set(data.provider, current + data.usage.totalTokens);
    }
    
    // 更新当前使用量
    for (const [provider, tokens] of providerTokens) {
      this.currentUsage.set(provider, tokens);
    }
    
    // 重新计算配额状态
    this.recalculateQuotaStatus();
  }

  /**
   * 获取指定厂商的配额状态
   */
  getQuotaStatus(provider: string): QuotaStatus | null {
    return this.quotaStatus.get(provider) || null;
  }

  /**
   * 获取所有厂商的配额状态
   */
  getAllQuotaStatus(): QuotaStatus[] {
    return Array.from(this.quotaStatus.values());
  }

  /**
   * 检查是否需要降级（基于配额使用）
   */
  shouldDowngrade(provider: string): boolean {
    const status = this.quotaStatus.get(provider);
    if (!status) return false;
    
    return status.isOverThreshold || status.isExhausted;
  }

  /**
   * 获取推荐的降级模型列表
   * 返回按优先级排序的模型列表
   */
  getFallbackRecommendations(provider: string): string[] {
    const quotaConfig = this.providerQuotas.get(provider);
    if (!quotaConfig || !quotaConfig.fallbackPriority) {
      return [];
    }
    
    const status = this.quotaStatus.get(provider);
    if (!status) return quotaConfig.fallbackPriority;
    
    // 如果配额耗尽，只返回 fallback 列表
    if (status.isExhausted) {
      return quotaConfig.fallbackPriority;
    }
    
    // 如果超过阈值，也建议降级
    if (status.isOverThreshold) {
      return quotaConfig.fallbackPriority;
    }
    
    return [];
  }

  /**
   * 检查预算限制
   * 返回是否允许使用高成本模型
   */
  canUseHighCostModel(model: string): { allowed: boolean; reason?: string } {
    if (!this.budgetConfig) {
      return { allowed: true };
    }

    // 检查是否在禁用列表中
    if (this.budgetConfig.disableHighCostModels?.includes(model)) {
      return { 
        allowed: false, 
        reason: `Model ${model} is disabled due to budget constraints` 
      };
    }

    // 检查每日/月度预算（需要成本数据，这里简化处理）
    // 实际实现需要结合 CostCalculator 的成本数据
    
    return { allowed: true };
  }

  /**
   * 获取紧急降级模型
   */
  getEmergencyFallback(): string {
    return this.budgetConfig?.emergencyFallback || "github-copilot/gpt-4o";
  }

  /**
   * 根据时间策略获取推荐模型
   */
  getTimeBasedRecommendation(): { model: string; reason: string } | null {
    if (!this.costOptimizationConfig?.timeBasedRouting) {
      return null;
    }

    const now = new Date();
    const hour = now.getHours();
    const isWorkHours = hour >= 9 && hour < 18; // 9:00-18:00
    
    const routing = this.costOptimizationConfig.timeBasedRouting;
    
    if (isWorkHours && routing.workHours) {
      return {
        model: routing.workHours.model,
        reason: routing.workHours.reason || "工作时间效率优先"
      };
    }
    
    if (!isWorkHours && routing.offHours) {
      return {
        model: routing.offHours.model,
        reason: routing.offHours.reason || "非工作时间成本优先"
      };
    }
    
    return null;
  }

  /**
   * 生成配额报告
   */
  generateReport(): string {
    const lines: string[] = [];
    lines.push("=== 配额监控报告 ===");
    lines.push(`生成时间: ${new Date().toISOString()}`);
    lines.push("");
    
    for (const status of this.quotaStatus.values()) {
      const usagePercent = (status.currentUsageTokens / status.monthlyLimitTokens) * 100;
      lines.push(`厂商: ${status.provider}`);
      lines.push(`  使用量: ${status.currentUsageTokens.toLocaleString()} / ${status.monthlyLimitTokens.toLocaleString()} tokens`);
      lines.push(`  剩余: ${status.remainingTokens.toLocaleString()} tokens`);
      lines.push(`  使用率: ${usagePercent.toFixed(1)}%`);
      lines.push(`  阈值: ${status.thresholdPercent}%`);
      lines.push(`  状态: ${status.isExhausted ? '❌ 耗尽' : status.isOverThreshold ? '⚠️ 超阈值' : '✅ 正常'}`);
      lines.push("");
    }
    
    return lines.join("\n");
  }

  /**
   * 重新计算所有厂商的配额状态
   */
  private recalculateQuotaStatus(): void {
    this.quotaStatus.clear();

    for (const [provider, quotaConfig] of this.providerQuotas) {
      const currentUsage = this.currentUsage.get(provider) || 0;
      const monthlyLimit = quotaConfig.monthlyLimitTokens;
      const thresholdPercent = quotaConfig.thresholdPercent || 80;
      const thresholdTokens = (monthlyLimit * thresholdPercent) / 100;

      const status: QuotaStatus = {
        provider,
        monthlyLimitTokens: monthlyLimit,
        currentUsageTokens: currentUsage,
        remainingTokens: monthlyLimit - currentUsage,
        thresholdPercent,
        isOverThreshold: currentUsage >= thresholdTokens,
        isExhausted: currentUsage >= monthlyLimit,
        lastUpdated: new Date(),
        period: {
          start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
        },
      };

      this.quotaStatus.set(provider, status);
    }
  }

  /**
   * 重置使用量统计（新月度时调用）
   */
  reset(): void {
    this.currentUsage.clear();
    this.quotaStatus.clear();
  }
}
