/**
 * UsageSync - 多厂商使用量统计系统
 *
 * 支持的厂商:
 * - Anthropic (CLI, 99%)
 * - OpenAI (API, 99%)
 * - ZhiPu GLM (插件, 95%) - Day 3
 * - GitHub Copilot (Billing API, 99%) - Day 4
 * - Google Gemini (Quota API, 90%) - Day 4-5
 * - DeepSeek (本地统计, 75%) - Day 6
 * - Silicon Flow (本地统计, 75%) - Day 6
 */

// 自动加载认证信息
import "./setup_auth";

export * from "./interfaces";
export { AnthropicSync } from "./AnthropicSync";
export { AnthropicLocalSync } from "./AnthropicLocalSync";
export { OpenAISync } from "./OpenAISync";
export { OpenAILocalSync } from "./OpenAILocalSync";
export { ZhiPuSync } from "./ZhiPuSync";
export { ZhiPuLocalSync } from "./ZhiPuLocalSync";
export { GitHubSync } from "./GitHubSync";
export { GeminiSync } from "./GeminiSync";
export { GeminiLocalSync } from "./GeminiLocalSync";
export { DeepSeekSync, SiliconFlowSync } from "./LocalStatsSync";
export { Validator } from "./Validator";
export { CostCalculator } from "./CostCalculator";
export { SourceTagger } from "./SourceTagger";
export { ConfigLoader } from "./ConfigLoader";

import {
  UsageSync,
  UsageData,
  SyncResult,
  BatchSyncResult,
} from "./interfaces";

/**
 * 使用量同步协调器
 *
 * 负责协调多个厂商的使用量同步
 */
export class UsageSyncCoordinator {
  private syncs: Map<string, UsageSync> = new Map();

  /**
   * 注册一个同步器
   */
  register(sync: UsageSync): void {
    this.syncs.set(sync.provider, sync);
  }

  /**
   * 移除一个同步器
   */
  unregister(provider: string): void {
    this.syncs.delete(provider);
  }

  /**
   * 获取所有已注册的厂商
   */
  getProviders(): string[] {
    return Array.from(this.syncs.keys());
  }

  /**
   * 获取同步器实例（用于 CLI）
   */
  getSyncInstance(provider: string): UsageSync | null {
    return this.syncs.get(provider) || null;
  }

  /**
   * 同步单个厂商
   */
  async syncOne(
    provider: string,
    period?: { start: Date; end: Date },
  ): Promise<SyncResult> {
    const startTime = Date.now();
    const sync = this.syncs.get(provider);

    if (!sync) {
      return {
        success: false,
        provider,
        error: `Provider ${provider} not registered`,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }

    try {
      const data = await sync.fetchUsage(period);
      return {
        success: true,
        provider,
        data,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error: any) {
      return {
        success: false,
        provider,
        error: error.message,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  /**
   * 同步所有厂商
   */
  async syncAll(period?: { start: Date; end: Date }): Promise<BatchSyncResult> {
    const startTime = Date.now();
    const providers = this.getProviders();

    // 并行执行所有同步
    const results = await Promise.all(
      providers.map((provider) => this.syncOne(provider, period)),
    );

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return {
      total: results.length,
      successful,
      failed,
      results,
      totalDuration: Date.now() - startTime,
    };
  }

  /**
   * 健康检查所有同步器
   */
  async healthCheckAll(): Promise<Record<string, boolean>> {
    const providers = this.getProviders();
    const results: Record<string, boolean> = {};

    await Promise.all(
      providers.map(async (provider) => {
        const sync = this.syncs.get(provider)!;
        results[provider] = await sync.healthCheck();
      }),
    );

    return results;
  }

  /**
   * 聚合使用量数据
   */
  aggregateUsage(results: SyncResult[]): UsageData[] {
    const allData: UsageData[] = [];

    for (const result of results) {
      if (result.success && result.data) {
        allData.push(...result.data);
      }
    }

    return allData;
  }
}

/**
 * 便捷函数：创建协调器并注册所有可用的同步器
 */
export function createUsageSyncCoordinator(): UsageSyncCoordinator {
  const coordinator = new UsageSyncCoordinator();

  // 尝试注册 Anthropic
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const { AnthropicSync } = require("./AnthropicSync");
      coordinator.register(new AnthropicSync());
    } catch (error) {
      console.warn("Failed to register AnthropicSync:", error);
    }
  }

  // 尝试注册 OpenAI
  if (process.env.OPENAI_API_KEY) {
    try {
      const { OpenAISync } = require("./OpenAISync");
      coordinator.register(new OpenAISync());
    } catch (error) {
      console.warn("Failed to register OpenAISync:", error);
    }
  }

  // 尝试注册 ZhiPu
  if (process.env.ZHIPU_API_KEY) {
    try {
      const { ZhiPuSync } = require("./ZhiPuSync");
      coordinator.register(new ZhiPuSync());
    } catch (error) {
      console.warn("Failed to register ZhiPuSync:", error);
    }
  }

  // 尝试注册 GitHub
  if (process.env.GITHUB_TOKEN) {
    try {
      const { GitHubSync } = require("./GitHubSync");
      coordinator.register(new GitHubSync());
    } catch (error) {
      console.warn("Failed to register GitHubSync:", error);
    }
  }

  // 尝试注册 Gemini
  if (process.env.GEMINI_ACCESS_TOKEN) {
    try {
      const { GeminiSync } = require("./GeminiSync");
      coordinator.register(new GeminiSync());
    } catch (error) {
      console.warn("Failed to register GeminiSync:", error);
    }
  }

  // 尝试注册 DeepSeek
  try {
    const { DeepSeekSync } = require("./LocalStatsSync");
    coordinator.register(new DeepSeekSync());
  } catch (error) {
    console.warn("Failed to register DeepSeekSync:", error);
  }

  // 尝试注册 Silicon Flow
  try {
    const { SiliconFlowSync } = require("./LocalStatsSync");
    coordinator.register(new SiliconFlowSync());
  } catch (error) {
    console.warn("Failed to register SiliconFlowSync:", error);
  }

  return coordinator;
}
