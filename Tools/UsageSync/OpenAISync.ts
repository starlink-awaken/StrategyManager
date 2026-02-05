import { UsageSync, UsageData } from "./interfaces";

/**
 * OpenAI API 使用量同步器
 *
 * 使用 OpenAI Usage API 查询使用量
 * 精确度: 99%
 */
export class OpenAISync implements UsageSync {
  readonly provider = "openai";
  readonly accuracy = 99;

  private apiKey: string;
  private baseURL: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || "";
    if (!this.apiKey) {
      throw new Error("OpenAISync: OPENAI_API_KEY is required");
    }
    // 支持三种密钥格式:
    // 1. sk-... (API Key)
    // 2. sk-proj-... (Project API Key)
    // 3. eyJ... (OAuth JWT Token)
    const isApiKey = this.apiKey.startsWith("sk-proj-") || this.apiKey.startsWith("sk-");
    const isOAuthToken = this.apiKey.startsWith("eyJ"); // JWT token 前缀
    
    if (!isApiKey && !isOAuthToken) {
      throw new Error(
        "OpenAISync: Invalid credential format. Expected sk-*, sk-proj-*, or JWT token (eyJ...)",
      );
    }
    this.baseURL = "https://api.openai.com/v1";
  }

  /**
   * 从 opencode auth.json 创建实例
   */
  static fromOpenCodeAuth(authInfo: any): OpenAISync {
    return new OpenAISync(authInfo.access);
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async fetchUsage(period?: { start: Date; end: Date }): Promise<UsageData[]> {
    try {
      const now = new Date();
      const startDate =
        period?.start || new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = period?.end || now;

      // OpenAI Usage API 端点
      // 注意: 此 API 可能需要 Organization Admin 权限
      const response = await fetch(
        `${this.baseURL}/usage?date=${this.formatDate(startDate)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error (${response.status}): ${error}`);
      }

      const data = await response.json();
      return this.transformData(data, { start: startDate, end: endDate });
    } catch (error: any) {
      throw new Error(`OpenAISync failed: ${error.message}`);
    }
  }

  private formatDate(date: Date): string {
    return date.toISOString().split("T")[0]; // YYYY-MM-DD
  }

  private transformData(
    data: any,
    period: { start: Date; end: Date },
  ): UsageData[] {
    const now = new Date();

    // 按模型聚合数据
    const usageByModel: Record<string, UsageData> = {};

    for (const item of data.data || []) {
      const model = item.snapshot_id || item.operation || "gpt-4o";

      if (!usageByModel[model]) {
        usageByModel[model] = {
          provider: "openai",
          model: this.normalizeModelName(model),
          usage: {
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
            requests: 0,
          },
          source: "✅ API (官方)",
          accuracy: 99,
          period: { start: period.start, end: period.end },
          lastUpdated: now,
          metadata: {},
        };
      }

      // 累加使用量
      const contextTokens =
        item.n_context_tokens_total || item.prompt_tokens || 0;
      const generatedTokens =
        item.n_generated_tokens_total || item.completion_tokens || 0;

      usageByModel[model].usage.inputTokens += contextTokens;
      usageByModel[model].usage.outputTokens += generatedTokens;
      usageByModel[model].usage.totalTokens += contextTokens + generatedTokens;
      usageByModel[model].usage.requests! += item.n_requests || 1;
    }

    return Object.values(usageByModel);
  }

  private normalizeModelName(name: string): string {
    // 标准化模型名称
    const mapping: Record<string, string> = {
      "gpt-4-turbo": "gpt-4-turbo",
      "gpt-4o": "gpt-4o",
      "gpt-4": "gpt-4",
      "gpt-3.5-turbo": "gpt-3.5-turbo",
      o1: "o1-preview",
      o3: "o3-mini",
    };

    for (const [key, value] of Object.entries(mapping)) {
      if (name.includes(key)) {
        return value;
      }
    }

    return name;
  }
}
