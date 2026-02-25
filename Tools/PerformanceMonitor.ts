import { readJSONC, writeJSONC, fileExists } from './FileSystemUtils';
import { defaultPathManager } from './PathManager';
import * as path from 'path';

/**
 * 性能指标接口
 */
export interface PerformanceMetrics {
  latency: number[]; // 最近 10 次请求耗时 (ms)
  successRate: number; // 成功率 (0-1)
  errorCount: number;
  totalRequests: number;
  lastUsed: string;
}

/**
 * 性能监控模块 (Phase 3)
 * 记录并分析模型在实际任务中的表现
 */
export class PerformanceMonitor {
  private metricsPath: string;

  constructor() {
    this.metricsPath = path.join(defaultPathManager.getConfigDir(), 'performance-metrics.json');
  }

  private async loadMetrics(): Promise<Record<string, PerformanceMetrics>> {
    if (!await fileExists(this.metricsPath)) return {};
    return await readJSONC(this.metricsPath) as Record<string, PerformanceMetrics>;
  }

  /**
   * 记录一次请求表现
   */
  async record(target: string, latency: number, success: boolean): Promise<void> {
    const metrics = await this.loadMetrics();
    if (!metrics[target]) {
      metrics[target] = {
        latency: [],
        successRate: 1.0,
        errorCount: 0,
        totalRequests: 0,
        lastUsed: new Date().toISOString()
      };
    }

    const m = metrics[target];
    m.totalRequests++;
    if (!success) m.errorCount++;
    
    // 滑动窗口成功率
    m.successRate = (m.totalRequests - m.errorCount) / m.totalRequests;
    
    // 延迟记录
    m.latency.push(latency);
    if (m.latency.length > 10) m.latency.shift();
    
    m.lastUsed = new Date().toISOString();
    await writeJSONC(this.metricsPath, metrics);
  }

  /**
   * 获取平均延迟
   */
  async getAvgLatency(target: string): Promise<number> {
    const metrics = await this.loadMetrics();
    const m = metrics[target];
    if (!m || m.latency.length === 0) return 0;
    return m.latency.reduce((a, b) => a + b, 0) / m.latency.length;
  }

  /**
   * 获取性能摘要
   */
  async getSummary(): Promise<Record<string, PerformanceMetrics>> {
    return await this.loadMetrics();
  }
}

export const defaultPerformanceMonitor = new PerformanceMonitor();
