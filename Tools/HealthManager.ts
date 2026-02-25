import { readJSONC, writeJSONC, fileExists } from './FileSystemUtils';
import { defaultPathManager } from './PathManager';
import * as path from 'path';

/**
 * 健康级别
 */
export type HealthLevel = "Healthy" | "Degraded" | "Disabled";

/**
 * 健康问题详情
 */
export interface HealthIssue {
  level: HealthLevel;
  reason: string;
  timestamp: string;
  autoRecoverAt?: string; // 可选的自动恢复时间
}

/**
 * 健康状态接口
 */
export interface HealthStatus {
  disabledProviders: string[];
  disabledModels: string[];
  degradedItems: Record<string, HealthIssue>; // target -> issue
  lastChecked: Record<string, string>; // provider/model -> timestamp
  issues: Record<string, string>; // ID -> error message (兼容旧版)
}

/**
 * 健康管理模块
 * 负责管理 Provider 和模型的禁用状态及健康检查结果
 */
export class HealthManager {
  private healthFilePath: string;

  constructor() {
    this.healthFilePath = path.join(defaultPathManager.getConfigDir(), 'health-status.json');
  }

  /**
   * 初始化健康状态文件
   */
  private async ensureInitialized(): Promise<HealthStatus> {
    if (!await fileExists(this.healthFilePath)) {
      const initial: HealthStatus = {
        disabledProviders: [],
        disabledModels: [],
        degradedItems: {},
        lastChecked: {},
        issues: {}
      };
      await writeJSONC(this.healthFilePath, initial);
      return initial;
    }
    const data = await readJSONC(this.healthFilePath) as HealthStatus;
    // 确保所有字段存在
    if (!data.degradedItems) data.degradedItems = {};
    if (!data.disabledProviders) data.disabledProviders = [];
    if (!data.disabledModels) data.disabledModels = [];
    return data;
  }

  /**
   * 禁用 Provider 或模型
   */
  async disable(target: string, type: 'provider' | 'model', reason: string): Promise<void> {
    const status = await this.ensureInitialized();
    if (type === 'provider') {
      if (!status.disabledProviders.includes(target)) {
        status.disabledProviders.push(target);
      }
    } else {
      if (!status.disabledModels.includes(target)) {
        status.disabledModels.push(target);
      }
    }
    status.issues[target] = reason;
    status.lastChecked[target] = new Date().toISOString();
    await writeJSONC(this.healthFilePath, status);
  }

  /**
   * 标记为降级状态 (自动化感知调用)
   */
  async markDegraded(target: string, reason: string, ttlSeconds: number = 300): Promise<void> {
    const status = await this.ensureInitialized();
    const now = new Date();
    const recoverAt = new Date(now.getTime() + ttlSeconds * 1000);
    
    status.degradedItems[target] = {
      level: "Degraded",
      reason,
      timestamp: now.toISOString(),
      autoRecoverAt: recoverAt.toISOString()
    };
    status.lastChecked[target] = now.toISOString();
    await writeJSONC(this.healthFilePath, status);
  }

  /**
   * 自动恢复过期的降级项
   */
  private async autoRecover(status: HealthStatus): Promise<boolean> {
    const now = new Date();
    let changed = false;
    
    for (const [target, issue] of Object.entries(status.degradedItems)) {
      if (issue.autoRecoverAt && new Date(issue.autoRecoverAt) <= now) {
        delete status.degradedItems[target];
        changed = true;
      }
    }
    
    return changed;
  }

  /**
   * 启用 Provider 或模型
   */
  async enable(target: string, type: 'provider' | 'model'): Promise<void> {
    const status = await this.ensureInitialized();
    if (type === 'provider') {
      status.disabledProviders = status.disabledProviders.filter(p => p !== target);
    } else {
      status.disabledModels = status.disabledModels.filter(m => m !== target);
    }
    delete status.issues[target];
    delete status.degradedItems[target];
    await writeJSONC(this.healthFilePath, status);
  }

  /**
   * 获取所有禁用的项
   */
  async getDisabledItems(): Promise<{ providers: string[], models: string[], degraded: string[] }> {
    const status = await this.ensureInitialized();
    await this.autoRecover(status);
    return {
      providers: status.disabledProviders,
      models: status.disabledModels,
      degraded: Object.keys(status.degradedItems)
    };
  }

  /**
   * 检查项是否有效禁用 (包含降级)
   */
  async isDisabled(target: string): Promise<boolean> {
    const status = await this.ensureInitialized();
    await this.autoRecover(status);
    
    const isExplicitlyDisabled = status.disabledProviders.includes(target) || status.disabledModels.includes(target);
    const isDegraded = !!status.degradedItems[target];
    
    if (isExplicitlyDisabled || isDegraded) return true;
    
    // 检查所属厂商
    if (target.includes('/')) {
      const provider = target.split('/')[0];
      if (status.disabledProviders.includes(provider) || !!status.degradedItems[provider]) return true;
    }
    
    return false;
  }

  /**
   * 获取各项的有效健康分数 (1.0 = 健康, 0.5 = 降级, 0.0 = 禁用)
   */
  async getHealthScore(target: string): Promise<number> {
    const status = await this.ensureInitialized();
    await this.autoRecover(status);
    
    if (status.disabledProviders.includes(target) || status.disabledModels.includes(target)) return 0.0;
    if (status.degradedItems[target]) return 0.5;
    
    // 检查所属厂商是否禁用
    if (target.includes('/')) {
      const provider = target.split('/')[0];
      if (status.disabledProviders.includes(provider)) return 0.0;
      if (status.degradedItems[provider]) return 0.5;
    }
    
    return 1.0;
  }

  /**
   * 获取健康状态摘要
   */
  async getStatusSummary(): Promise<HealthStatus> {
    const status = await this.ensureInitialized();
    await this.autoRecover(status);
    return status;
  }
}

export const defaultHealthManager = new HealthManager();
