/**
 * Validator.ts
 * 增强的策略验证系统
 *
 * 提供多层次验证（错误/警告/信息）和自动修复建议
 */

import type { StrategyConfig } from "./ManageStrategies";

// ==================== 类型定义 ====================

export type ValidationSeverity = "error" | "warning" | "info";

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
      for (const [agentName, agentConfig] of Object.entries(config.agents)) {
        // 检查 agentConfig 是否存在以及 model 字段
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
      for (const [categoryName, categoryConfig] of Object.entries(
        config.categories,
      )) {
        // 检查 categoryConfig 是否存在以及 model 字段
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
    const knownModels = [
      // Anthropic
      "anthropic/claude-opus-4-5",
      "anthropic/claude-sonnet-4-5",
      "anthropic/claude-haiku-4-5",
      // OpenAI
      "openai/gpt-5.2",
      "openai/gpt-5.2-codex",
      "openai/gpt-5-mini",
      "openai/gpt-4.1",
      // Google
      "google/gemini-3-pro",
      "google/gemini-3-flash",
      "google/antigravity-gemini-3-pro",
      // GitHub Copilot
      "github-copilot/claude-opus-4-5",
      "github-copilot/claude-sonnet-4-5",
      "github-copilot/gpt-5.2-codex",
      "github-copilot/gpt-5-mini",
      "github-copilot/gpt-4.1",
      // ZhiPu
      "zai-coding-plan/glm-4.7",
      // DeepSeek
      "deepseek/deepseek-v3-2",
    ];

    const checkModel = (model: string, field: string) => {
      if (!knownModels.includes(model)) {
        result.warnings.push({
          field,
          message: `模型 ${model} 可能不可用或已过时`,
          severity: "warning",
          fix: {
            description: "检查模型名称是否正确，或更新为最新可用模型",
          },
        });
      }
    };

    if (config.agents) {
      for (const [agentName, agentConfig] of Object.entries(config.agents)) {
        if (agentConfig.model) {
          checkModel(agentConfig.model, `agents.${agentName}.model`);
        }
      }
    }

    if (config.categories) {
      for (const [categoryName, categoryConfig] of Object.entries(
        config.categories,
      )) {
        if (categoryConfig.model) {
          checkModel(categoryConfig.model, `categories.${categoryName}.model`);
        }
      }
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
      "anthropic/claude-opus-4-5",
      "github-copilot/claude-opus-4-5",
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

    if (config.agents) {
      for (const [agentName, agentConfig] of Object.entries(config.agents)) {
        if (agentConfig.model) {
          checkExpensive(agentConfig.model, `agents.${agentName}.model`);
        }
      }
    }

    if (config.categories) {
      for (const [categoryName, categoryConfig] of Object.entries(
        config.categories,
      )) {
        if (categoryConfig.model) {
          checkExpensive(
            categoryConfig.model,
            `categories.${categoryName}.model`,
          );
        }
      }
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

    // 检查高成本模型的并发是否过高
    for (const [model, limit] of Object.entries(concurrency)) {
      if (model.includes("opus") && limit > 3) {
        result.warnings.push({
          field: `background_task.modelConcurrency.${model}`,
          message: `高成本模型 ${model} 并发限制为 ${limit}，可能导致成本激增`,
          severity: "warning",
          fix: {
            description: "建议将并发限制降低到 2-3",
          },
        });
      }

      if (model.includes("github-copilot") && limit > 50) {
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
        if (model.includes("gpt-5-mini") || model.includes("gpt-4.1")) {
          freeModels++;
        }
      }
    };

    if (config.agents) {
      for (const agentConfig of Object.values(config.agents)) {
        if (agentConfig.model) {
          checkCopilot(agentConfig.model);
        }
      }
    }

    if (config.categories) {
      for (const categoryConfig of Object.values(config.categories)) {
        if (categoryConfig.model) {
          checkCopilot(categoryConfig.model);
        }
      }
    }

    const utilizationRate = totalModels > 0 ? copilotModels / totalModels : 0;

    // 只有在配置了足够多的模型时才检查利用率（至少5个）
    // 阈值设为25%，即至少1/4的模型应使用GitHub Copilot
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
        message: "未使用 GitHub Copilot 免费模型（gpt-5-mini, gpt-4.1）",
        severity: "info",
        fix: {
          description: "在 quick 或 unspecified-low 场景使用免费模型以降低成本",
        },
      });
    }
  }

  /**
   * 生成优化建议
   */
  private generateSuggestions(result: ValidationResult): void {
    // 配置完整时的建议
    if (result.errors.length === 0 && result.warnings.length === 0) {
      result.suggestions.push("配置完整且合理，无明显问题");
      return;
    }

    // 有错误时的建议
    if (result.errors.length > 0) {
      result.suggestions.push(
        `发现 ${result.errors.length} 个错误，需要修复后才能使用此策略`,
      );

      // 针对特定错误类型的建议
      const hasModelError = result.errors.some((e) =>
        e.field.includes("model"),
      );
      if (hasModelError) {
        result.suggestions.push(
          "确保所有 agent 和 category 都配置了 model 字段",
        );
      }
    }

    // 有警告时的建议
    if (result.warnings.length > 0) {
      result.suggestions.push(
        `发现 ${result.warnings.length} 个警告，建议优化以提升性价比`,
      );

      // 针对特定警告类型的建议
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

    // 有信息提示时的建议
    if (result.info.length > 0 && result.warnings.length === 0) {
      result.suggestions.push("配置基本合理，有一些可选的优化建议");
    }
  }
}

// ==================== 辅助函数 ====================

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
