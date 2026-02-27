/**
 * Validator.ts
 * 增强的策略验证系统
 *
 * 提供多层次验证（错误/警告/信息）和自动修复建议
 */

import type {
  StrategyConfig,
  AgentConfig,
  CategoryConfig,
  ValidationSeverity,
  LspProviderQuotaConfig,
} from "./interfaces";
import {
  normalizeProvider,
  MONITORED_USAGE_PROVIDERS,
} from "./ProviderNormalization";

// ==================== 类型定义 ====================

export interface ValidationError {
  field: string;
  message: string;
  severity: ValidationSeverity;
  fix?: {
    description: string;
    autoFix?: () => void;
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  info: ValidationError[];
  suggestions: string[];
}

const KNOWN_MODELS = new Set([
  // Anthropic / OpenAI / Google
  "anthropic/claude-opus-4-6",
  "anthropic/claude-sonnet-4-6",
  "anthropic/claude-haiku-4-5",
  "openai/gpt-5.3-codex",
  "openai/gpt-5.2-codex",
  "openai/gpt-5-mini",
  "openai/gpt-4.1",
  "openai/gpt-4o",
  "google/antigravity-gemini-3.1-pro",
  "google/antigravity-gemini-3-flash",
  "google/antigravity-claude-sonnet-4-6",
  "google/antigravity-claude-sonnet-4-6-thinking",
  "google/gemini-3.1-pro-preview",
  "google/gemini-3-pro",
  "google/gemini-3-pro-preview",
  "google/gemini-3-flash-preview",
  "google/gemini-flash-latest",
  // GitHub Copilot
  "github-copilot/claude-opus-4.6",
  "github-copilot/claude-sonnet-4.6",
  "github-copilot/claude-haiku-4.5",
  "github-copilot/grok-code-fast-1",
  "github-copilot/gpt-5.3-codex",
  "github-copilot/gpt-5.2-codex",
  "github-copilot/gpt-5-mini",
  "github-copilot/gpt-4.1",
  "github-copilot/gpt-4o",
  // 国内/聚合 Provider
  "deepseek/deepseek-chat",
  "deepseek/deepseek-reasoner",
  "zhipuai-coding-plan/glm-4.5-air",
  "zhipuai-coding-plan/glm-4.7",
  "zhipuai-coding-plan/glm-4.7-flash",
  "zhipuai-coding-plan/glm-5",
  "minimax-coding-plan/MiniMax-M2.5",
  "minimax-cn-coding-plan/MiniMax-M2.5",
  "kimi-coding-plan/kimi-for-coding",
  "bailian-coding-plan/qwen3.5-plus",
  "bailian-coding-plan/qwen3-coder-plus",
  "bailian-coding-plan/qwen3-coder-next",
  "bailian-coding-plan/qwen3-max-2026-01-23",
  "bailian-coding-plan/glm-4.7",
  "bailian-coding-plan/glm-5",
  "bailian-coding-plan/kimi-k2.5",
  "volcegine-coding-plan/doubao-seed-2-0-code-preview-latest",
  "meituan/LongCat-Flash-Chat",
  // 兼容历史模板
  "siliconflow/deepseek-ai/DeepSeek-R1",
  "siliconflow/deepseek-ai/DeepSeek-V3",
  "dashscope/qwen-3.5-plus",
  "dashscope/qwen3.5-plus",
  "step/step-3.5-flash",
  "step/step-2-16k",
]);

function getModelProvider(model: string): string | null {
  const slashIndex = model.indexOf("/");
  if (slashIndex <= 0) {
    return null;
  }
  return model.slice(0, slashIndex);
}

function collectModelEntries(config: StrategyConfig): Array<{ field: string; model: string }> {
  const entries: Array<{ field: string; model: string }> = [];

  if (config.agents) {
    for (const [agentName, agentConfig] of Object.entries(config.agents) as [string, AgentConfig][]) {
      if (agentConfig.model) {
        entries.push({ field: `agents.${agentName}.model`, model: agentConfig.model });
      }
    }
  }

  if (config.categories) {
    for (const [categoryName, categoryConfig] of Object.entries(config.categories) as [string, CategoryConfig][]) {
      if (categoryConfig.model) {
        entries.push({ field: `categories.${categoryName}.model`, model: categoryConfig.model });
      }
    }
  }

  return entries;
}

// ==================== 验证器类 ====================

export class StrategyValidator {
  /**
   * 验证策略配置
   */
  validate(config: StrategyConfig, strategyName?: string): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      info: [],
      suggestions: [],
    };

    // 1. Schema 验证
    this.validateSchema(config, result);

    // 2. 模型可用性检查
    this.validateModelAvailability(config, result);

    // 3. 成本合理性检查
    this.validateCostReasonableness(config, result);

    // 4. 并发配置检查
    this.validateConcurrency(config, result);

    // 5. GitHub Copilot 利用率检查
    this.validateGitHubCopilotUsage(config, result);

    // 6. Provider 配额配置与耦合检查
    this.validateProviderQuotas(config, result, strategyName);

    // 7. 上下文压缩配置检查（重点关注 Copilot Claude 200K 窗口）
    this.validateCompaction(config, result);

    // 根据错误数量判断是否有效
    result.valid = result.errors.length === 0;

    // 根据验证结果生成建议
    this.generateSuggestions(result);

    return result;
  }

  /**
   * Schema 验证
   */
  private validateSchema(
    config: StrategyConfig,
    result: ValidationResult,
  ): void {
    // 检查必需字段
    if (!config.description) {
      result.errors.push({
        field: "description",
        message: "缺少必需字段：description",
        severity: "error",
        fix: {
          description: "添加策略描述",
        },
      });
    }

    // 验证 agents 或 categories 至少有一个
    if (!config.agents && !config.categories) {
      result.errors.push({
        field: "agents/categories",
        message: "必须至少定义 agents 或 categories",
        severity: "error",
      });
    }

    // 验证 agents 配置
    if (config.agents) {
      for (const [agentName, agentConfig] of Object.entries(config.agents) as [string, AgentConfig][]) {
        if (!agentConfig || typeof agentConfig !== "object") {
          result.errors.push({
            field: `agents.${agentName}`,
            message: `agent ${agentName} 配置无效`,
            severity: "error",
          });
        } else if (!agentConfig.model) {
          result.errors.push({
            field: `agents.${agentName}.model`,
            message: `agent ${agentName} 缺少 model 字段`,
            severity: "error",
          });
        }
      }
    }

    // 验证 categories 配置
    if (config.categories) {
      for (const [categoryName, categoryConfig] of Object.entries(config.categories) as [string, CategoryConfig][]) {
        if (!categoryConfig || typeof categoryConfig !== "object") {
          result.errors.push({
            field: `categories.${categoryName}`,
            message: `category ${categoryName} 配置无效`,
            severity: "error",
          });
        } else if (!categoryConfig.model) {
          result.errors.push({
            field: `categories.${categoryName}.model`,
            message: `category ${categoryName} 缺少 model 字段`,
            severity: "error",
          });
        }
      }
    }
  }

  /**
   * 模型可用性检查
   */
  private validateModelAvailability(
    config: StrategyConfig,
    result: ValidationResult,
  ): void {
    for (const { field, model } of collectModelEntries(config)) {
      const provider = getModelProvider(model);
      if (!provider) {
        result.errors.push({
          field,
          message: `模型 ${model} 缺少 provider 前缀（应为 provider/model）`,
          severity: "error",
          fix: {
            description: "将模型改为带 provider 前缀格式，例如 github-copilot/gpt-5-mini",
          },
        });
        continue;
      }

      if (KNOWN_MODELS.has(model)) {
        continue;
      }

      const normalizedProvider = normalizeProvider(provider);
      if (!MONITORED_USAGE_PROVIDERS.has(normalizedProvider) && !provider.includes("-")) {
        result.warnings.push({
          field,
          message: `模型 ${model} 可能不可用或已过时（provider ${provider} 可能无效）`,
          severity: "warning",
          fix: {
            description: "检查 provider 是否拼写正确，或先运行 opencode models --refresh 再更新模型",
          },
        });
        continue;
      }

      result.warnings.push({
        field,
        message: `模型 ${model} 可能不可用或已过时`,
        severity: "warning",
        fix: {
          description: "检查模型名称是否正确，或更新为当前可用模型",
        },
      });
    }
  }

  /**
   * 成本合理性检查
   */
  private validateCostReasonableness(
    config: StrategyConfig,
    result: ValidationResult,
  ): void {
    const expensiveModels = [
      "anthropic/claude-opus-4-6",
      "github-copilot/claude-opus-4.6",
    ];

    let expensiveModelCount = 0;

    const checkExpensive = (model: string, field: string) => {
      if (expensiveModels.includes(model)) {
        expensiveModelCount++;
        result.info.push({
          field,
          message: `${field} 使用高成本模型 ${model}`,
          severity: "info",
        });
      }
    };

    for (const { field, model } of collectModelEntries(config)) {
      checkExpensive(model, field);
    }

    if (expensiveModelCount > 3) {
      result.warnings.push({
        field: "cost",
        message: `配置中使用了 ${expensiveModelCount} 个高成本模型，月度成本可能较高`,
        severity: "warning",
        fix: {
          description: "考虑部分场景使用中低成本模型替代",
        },
      });
    }
  }

  /**
   * 并发配置检查
   */
  private validateConcurrency(
    config: StrategyConfig,
    result: ValidationResult,
  ): void {
    const concurrency = config.background_task?.modelConcurrency;

    if (!concurrency) {
      result.info.push({
        field: "background_task.modelConcurrency",
        message: "未配置并发限制，可能导致 API 速率限制",
        severity: "info",
        fix: {
          description: "建议添加 modelConcurrency 配置以控制并发请求",
        },
      });
      return;
    }

    for (const [model, limit] of Object.entries(concurrency)) {
      if (model.includes("opus") && (limit as number) > 3) {
        result.warnings.push({
          field: `background_task.modelConcurrency.${model}`,
          message: `高成本模型 ${model} 并发限制为 ${limit}，可能导致成本激增`,
          severity: "warning",
          fix: {
            description: "建议将并发限制降低到 2-3",
          },
        });
      }

      if (model.includes("github-copilot") && (limit as number) > 50) {
        result.warnings.push({
          field: `background_task.modelConcurrency.${model}`,
          message: `GitHub Copilot 模型 ${model} 并发限制为 ${limit}，可能超出配额`,
          severity: "warning",
        });
      }
    }
  }

  /**
   * GitHub Copilot 利用率检查
   */
  private validateGitHubCopilotUsage(
    config: StrategyConfig,
    result: ValidationResult,
  ): void {
    let totalModels = 0;
    let copilotModels = 0;
    let freeModels = 0;

    const checkCopilot = (model: string) => {
      totalModels++;
      if (model.startsWith("github-copilot/")) {
        copilotModels++;
        if (model.includes("gpt-5-mini") || model.includes("gpt-4.1") || model.includes("gpt-4o")) {
          freeModels++;
        }
      }
    };

    for (const { model } of collectModelEntries(config)) {
      checkCopilot(model);
    }

    const utilizationRate = totalModels > 0 ? copilotModels / totalModels : 0;

    if (totalModels >= 5 && utilizationRate < 0.25) {
      result.warnings.push({
        field: "github-copilot",
        message: `GitHub Copilot 利用率仅 ${(utilizationRate * 100).toFixed(1)}%，建议增加使用`,
        severity: "warning",
        fix: {
          description:
            "将部分 agent/category 切换到 github-copilot/* 模型以充分利用 1500 premium requests",
        },
      });
    }

    if (freeModels === 0 && copilotModels > 0) {
      result.info.push({
        field: "github-copilot",
        message: "未使用 GitHub Copilot 免费模型（gpt-5-mini, gpt-4.1, gpt-4o）",
        severity: "info",
        fix: {
          description: "在 quick 或 unspecified-low 场景使用低成本模型以降低成本",
        },
      });
    }
  }

  /**
   * provider_quotas 与模型路由耦合检查
   */
  private validateProviderQuotas(
    config: StrategyConfig,
    result: ValidationResult,
    strategyName?: string,
  ): void {
    const quotas = config.lsp?.provider_quotas;
    if (!quotas) {
      result.info.push({
        field: "lsp.provider_quotas",
        message: "未配置 provider_quotas，无法进行精细化配额治理",
        severity: "info",
        fix: {
          description: "建议在 lsp.provider_quotas 中为主要 provider 设置 daily 与 concurrency 限制",
        },
      });
      return;
    }

    const usedProviders = new Set(
      collectModelEntries(config)
        .map((entry) => getModelProvider(entry.model))
        .filter((p): p is string => Boolean(p))
        .map((p) => normalizeProvider(p)),
    );

    const quotaProviders = new Set<string>();

    for (const [provider, quotaConfig] of Object.entries(quotas)) {
      const normalizedProvider = normalizeProvider(provider);
      quotaProviders.add(normalizedProvider);
      this.validateSingleProviderQuota(provider, quotaConfig, result);

      if (!MONITORED_USAGE_PROVIDERS.has(normalizedProvider)) {
        result.info.push({
          field: `lsp.provider_quotas.${provider}`,
          message: `provider ${provider} 当前不在 UsageSync 监控列表中，配额仅作为路由约束不参与统计`,
          severity: "info",
        });
      }
    }

    for (const provider of usedProviders) {
      if (!quotaProviders.has(provider)) {
        result.info.push({
          field: "lsp.provider_quotas",
          message: `模型使用了 provider ${provider}，但未设置对应配额`,
          severity: "info",
          fix: {
            description: `建议为 ${provider} 增加 provider_quotas 项`,
          },
        });
      }
    }

    for (const provider of quotaProviders) {
      if (!usedProviders.has(provider)) {
        result.info.push({
          field: "lsp.provider_quotas",
          message: `provider_quotas 中的 ${provider} 当前未被任何模型使用，可考虑移除`,
          severity: "info",
        });
      }
    }

    const emergencySwitchTo = config.lsp?.budget?.emergencySwitchTo;
    if (emergencySwitchTo && strategyName && emergencySwitchTo === strategyName) {
      result.warnings.push({
        field: "lsp.budget.emergencySwitchTo",
        message: "emergencySwitchTo 与当前策略同名，无法在紧急情况切换",
        severity: "warning",
        fix: {
          description: "建议设置为其他策略，例如 cheap 或 balanced",
        },
      });
    }
  }

  private validateSingleProviderQuota(
    provider: string,
    quotaConfig: LspProviderQuotaConfig,
    result: ValidationResult,
  ): void {
    if (!quotaConfig || typeof quotaConfig !== "object") {
      result.errors.push({
        field: `lsp.provider_quotas.${provider}`,
        message: `provider_quotas.${provider} 配置无效`,
        severity: "error",
      });
      return;
    }

    if (
      quotaConfig.maxRequestsPerDay !== undefined
      && (!Number.isFinite(quotaConfig.maxRequestsPerDay) || quotaConfig.maxRequestsPerDay <= 0)
    ) {
      result.errors.push({
        field: `lsp.provider_quotas.${provider}.maxRequestsPerDay`,
        message: "maxRequestsPerDay 必须是正数",
        severity: "error",
      });
    }

    if (
      quotaConfig.maxConcurrentRequests !== undefined
      && (!Number.isFinite(quotaConfig.maxConcurrentRequests) || quotaConfig.maxConcurrentRequests <= 0)
    ) {
      result.errors.push({
        field: `lsp.provider_quotas.${provider}.maxConcurrentRequests`,
        message: "maxConcurrentRequests 必须是正数",
        severity: "error",
      });
    }

    if (
      quotaConfig.maxRequestsPerDay !== undefined
      && quotaConfig.maxConcurrentRequests !== undefined
      && quotaConfig.maxConcurrentRequests > quotaConfig.maxRequestsPerDay
    ) {
      result.warnings.push({
        field: `lsp.provider_quotas.${provider}`,
        message: "maxConcurrentRequests 大于 maxRequestsPerDay，配置可能不合理",
        severity: "warning",
      });
    }
  }

  /**
   * compaction 配置检查
   *
   * 背景：
   * - GitHub Copilot 渠道 Claude Sonnet/Opus 4.6 常按 200K 上下文处理。
   * - reserved 过大将导致更早触发压缩，影响长上下文连续性。
   */
  private validateCompaction(
    config: StrategyConfig,
    result: ValidationResult,
  ): void {
    const models = collectModelEntries(config).map((entry) => entry.model);
    const usesCopilotClaudeLongContext = models.some((model) =>
      model === "github-copilot/claude-sonnet-4.6" || model === "github-copilot/claude-opus-4.6"
    );

    const compaction = config.compaction;
    if (!compaction) {
      if (usesCopilotClaudeLongContext) {
        result.info.push({
          field: "compaction",
          message: "检测到 Copilot Claude 4.6（常见 200K 上下文），建议显式配置 compaction 以避免提前压缩",
          severity: "info",
          fix: {
            description: "建议配置 compaction: { auto: true, prune: true, reserved: 2000 }",
          },
        });
      }
      return;
    }

    const reserved = compaction.reserved;
    if (reserved !== undefined && (!Number.isFinite(reserved) || reserved < 0)) {
      result.errors.push({
        field: "compaction.reserved",
        message: "compaction.reserved 必须是非负数",
        severity: "error",
      });
      return;
    }

    if (usesCopilotClaudeLongContext && reserved === undefined) {
      result.info.push({
        field: "compaction.reserved",
        message: "使用 Copilot Claude 4.6 时建议显式设置 reserved（推荐 2000）",
        severity: "info",
        fix: {
          description: "设置 compaction.reserved: 2000，平衡尾部空间与压缩触发时机",
        },
      });
    }

    if (usesCopilotClaudeLongContext && typeof reserved === "number" && reserved > 5000) {
      result.warnings.push({
        field: "compaction.reserved",
        message: `reserved=${reserved} 可能导致 Copilot Claude 4.6 在远低于 200K 时提前压缩`,
        severity: "warning",
        fix: {
          description: "建议将 reserved 调整至 1000-3000（推荐 2000）",
        },
      });
    }

    if (typeof reserved === "number" && reserved > 20000) {
      result.warnings.push({
        field: "compaction.reserved",
        message: `reserved=${reserved} 过高，可能显著缩短可用上下文窗口`,
        severity: "warning",
      });
    }

    if (usesCopilotClaudeLongContext && compaction.auto === false) {
      result.info.push({
        field: "compaction.auto",
        message: "在长上下文场景下关闭自动压缩可能导致请求失败或上下文突增失败",
        severity: "info",
      });
    }
  }

  /**
   * 生成优化建议
   */
  private generateSuggestions(result: ValidationResult): void {
    if (result.errors.length === 0 && result.warnings.length === 0) {
      result.suggestions.push("配置完整且合理，无明显问题");
      return;
    }

    if (result.errors.length > 0) {
      result.suggestions.push(
        `发现 ${result.errors.length} 个错误，需要修复后才能使用此策略`,
      );

      const hasModelError = result.errors.some((e) =>
        e.field.includes("model"),
      );
      if (hasModelError) {
        result.suggestions.push(
          "确保所有 agent 和 category 都配置了 model 字段",
        );
      }
    }

    if (result.warnings.length > 0) {
      result.suggestions.push(
        `发现 ${result.warnings.length} 个警告，建议优化以提升性价比`,
      );

      const hasCostWarning = result.warnings.some((w) =>
        w.field.includes("cost"),
      );
      if (hasCostWarning) {
        result.suggestions.push("考虑使用更经济的模型组合以降低成本");
      }

      const hasCopilotWarning = result.warnings.some(
        (w) => w.field === "github-copilot",
      );
      if (hasCopilotWarning) {
        result.suggestions.push(
          "增加 GitHub Copilot 模型使用以充分利用免费额度",
        );
      }
    }

    if (result.info.length > 0 && result.warnings.length === 0) {
      result.suggestions.push("配置基本合理，有一些可选的优化建议");
    }
  }
}

/**
 * 验证策略配置 (Standalone)
 */
export function validateStrategy(config: StrategyConfig, strategyName?: string): boolean {
  const validator = new StrategyValidator();
  const result = validator.validate(config, strategyName);
  return result.valid;
}

/**
 * 格式化验证结果
 */
export function formatValidationResult(result: ValidationResult): string {
  const lines: string[] = [];

  if (result.valid) {
    lines.push("✓ 验证通过");
  } else {
    lines.push("✗ 验证失败");
  }

  lines.push("");

  if (result.errors.length > 0) {
    lines.push("错误:");
    for (const error of result.errors) {
      lines.push(`  [${error.field}] ${error.message}`);
      if (error.fix) {
        lines.push(`    修复建议: ${error.fix.description}`);
      }
    }
    lines.push("");
  }

  if (result.warnings.length > 0) {
    lines.push("警告:");
    for (const warning of result.warnings) {
      lines.push(`  [${warning.field}] ${warning.message}`);
      if (warning.fix) {
        lines.push(`    优化建议: ${warning.fix.description}`);
      }
    }
    lines.push("");
  }

  if (result.info.length > 0) {
    lines.push("信息:");
    for (const info of result.info) {
      lines.push(`  [${info.field}] ${info.message}`);
      if (info.fix) {
        lines.push(`    提示: ${info.fix.description}`);
      }
    }
    lines.push("");
  }

  if (result.suggestions.length > 0) {
    lines.push("建议:");
    for (const suggestion of result.suggestions) {
      lines.push(`  - ${suggestion}`);
    }
  }

  return lines.join("\n");
}
