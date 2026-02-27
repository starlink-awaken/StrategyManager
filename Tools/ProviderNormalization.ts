/**
 * ProviderNormalization.ts
 * 统一管理策略层与 UsageSync 的 provider 名称映射
 */

export const PROVIDER_ALIAS_MAP: Record<string, string> = {
  "github-copilot": "github",
  "github-models": "github",
  "google": "gemini",
  "google-vertex": "gemini",
  "zhipuai-coding-plan": "zhipu",
  "bailian-coding-plan": "dashscope",
  "minimax-coding-plan": "minimax",
  "minimax-cn-coding-plan": "minimax",
  "kimi-coding-plan": "kimi",
  "volcegine-coding-plan": "ark",
  "siliconflow-cn": "siliconflow",
};

export const MONITORED_USAGE_PROVIDERS = new Set([
  "anthropic",
  "openai",
  "zhipu",
  "github",
  "gemini",
  "deepseek",
  "siliconflow",
  "dashscope",
  "minimax",
  "kimi",
  "ark",
]);

export function normalizeProvider(provider: string): string {
  return PROVIDER_ALIAS_MAP[provider] || provider;
}

export function isMonitoredUsageProvider(provider: string): boolean {
  return MONITORED_USAGE_PROVIDERS.has(normalizeProvider(provider));
}
