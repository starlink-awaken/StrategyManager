import { describe, it, expect } from "bun:test";
import { adaptStrategyQuotas, normalizeProviderForUsageSync } from "../../Tools/UsageSync";

describe("UsageSync quota adapter", () => {
  it("should normalize provider aliases", () => {
    expect(normalizeProviderForUsageSync("github-copilot")).toBe("github");
    expect(normalizeProviderForUsageSync("google")).toBe("gemini");
    expect(normalizeProviderForUsageSync("zhipuai-coding-plan")).toBe("zhipu");
  });

  it("should merge quotas that map to the same usage provider", () => {
    const quotas = adaptStrategyQuotas({
      "github-copilot": { maxRequestsPerDay: 100, fallbackModels: ["github-copilot/gpt-4o"] },
      "github-models": { maxRequestsPerDay: 50, fallbackModels: ["github-models/openai/gpt-4o"] },
    });

    const githubQuota = quotas.find((q) => q.provider === "github");
    expect(githubQuota).toBeDefined();
    expect(githubQuota?.monthlyLimitTokens).toBe((100 + 50) * 3000 * 30);
    expect(githubQuota?.fallbackPriority?.length).toBe(2);
  });
});
