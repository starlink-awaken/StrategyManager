/**
 * 使用量数据统一接口
 * 
 * 所有厂商的使用量数据都会转换为此格式
 */
export interface UsageData {
  provider: string;               // "anthropic" | "openai" | "zhipu" | "github" | "gemini" | "deepseek" | "silicon"
  model: string;                  // "claude-3.5-sonnet" | "gpt-4o" | "gemini-3-pro-high" | ...
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    requests?: number;            // 可选：请求次数
    cachedTokens?: number;        // 可选：缓存 tokens (Gemini/Claude)
  };
  cost?: number;                  // 可选：成本（USD，如果 API 提供）
  source: '✅ API (官方)' | '⚠️ 估算 (本地)';
  accuracy: number;               // 0-100，数据精确度
  period: {
    start: Date;
    end: Date;
  };
  lastUpdated: Date;
  metadata?: Record<string, any>; // 额外元数据
}

/**
 * 使用量同步器接口
 * 
 * 所有厂商的同步器都需要实现此接口
 */
export interface UsageSync {
  readonly provider: string;
  readonly accuracy: number;
  
  /**
   * 获取使用量数据
   * @param period 查询周期（可选，默认本月）
   */
  fetchUsage(period?: { start: Date; end: Date }): Promise<UsageData[]>;
  
  /**
   * 健康检查 - 验证 API/CLI 是否可用
   */
  healthCheck(): Promise<boolean>;
}

/**
 * 同步结果
 */
export interface SyncResult {
  success: boolean;
  provider: string;
  data?: UsageData[];
  error?: string;
  duration: number; // ms
  timestamp: Date;
}

/**
 * 批量同步结果
 */
export interface BatchSyncResult {
  total: number;
  successful: number;
  failed: number;
  results: SyncResult[];
  totalDuration: number; // ms
}

/**
 * 配置接口
 */
export interface UsageSyncConfig {
  anthropic?: {
    apiKey: string;
  };
  openai?: {
    apiKey: string;
  };
  zhipu?: {
    enabled: boolean; // 使用插件，无需 API Key
  };
  github?: {
    pat: string;      // Fine-grained Personal Access Token
    username?: string;
  };
  gemini?: {
    oauthToken: string;
  };
  deepseek?: {
    enabled: boolean; // 本地统计
  };
  silicon?: {
    enabled: boolean; // 本地统计
  };
}

/**
 * 使用量汇总
 */
export interface UsageSummary {
  totalTokens: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalRequests: number;
  totalCost: number;
  byProvider: Record<string, {
    tokens: number;
    cost: number;
    accuracy: number;
  }>;
  byModel: Record<string, {
    tokens: number;
    cost: number;
  }>;
  period: {
    start: Date;
    end: Date;
  };
  lastUpdated: Date;
}
