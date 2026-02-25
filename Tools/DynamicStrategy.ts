/**
 * DynamicStrategy.ts
 * 动态策略生成与清理逻辑
 */

import * as fs from "fs";
import * as path from "path";
import { defaultPathManager } from "./PathManager";
import { readJSONC, writeJSONC, fileExists } from './FileSystemUtils';
import { error, success } from './FormatUtils';
import { parseRecommendationContext } from "./Recommender";
import { validateStrategy } from "./Validator";
import { getProviderFromModel } from "./Recommender";
import { applyToolConstraints } from "./StrategyCore";
import type { 
  StrategyConfig, 
  DynamicStrategyOptions, 
  DynamicStrategyResult,
  ScenarioType,
  Priority,
  QuotaStatus
} from "./interfaces";

const pathManager = defaultPathManager;
const STRATEGIES_DIR = pathManager.getStrategiesDir();
const DYNAMIC_STRATEGIES_DIR = pathManager.getDynamicStrategiesDir();

const SCENARIO_TEMPLATE_MAP: Record<ScenarioType, string[]> = {
  "agent-heavy": ["fast", "balanced"],
  education: ["balanced", "smart"],
  health: ["balanced", "smart"],
  finance: ["smart", "fast"],
  coding: ["balanced", "fast"],
  research: ["smart", "fast"],
  creative: ["smart", "balanced"],
  daily: ["balanced", "fast"],
  writing: ["smart", "balanced"],
  multimedia: ["smart", "balanced"],
  social: ["smart", "balanced"],
  tools: ["balanced", "fast"],
  entertainment: ["balanced", "fast"],
  documentation: ["balanced", "fast"]
};

const MODEL_FALLBACKS: Record<Priority, { models: string[] }> = {
  quality: { models: ["anthropic/claude-opus-4-6", "openai/gpt-5.1-codex-max"] },
  cost: { models: ["github-copilot/raptor-mini", "google/gemini-3.1-flash"] },
  speed: { models: ["github-copilot/grok-code-fast-1", "google/gemini-3.1-flash"] },
  balanced: { models: ["openai/gpt-5.1-codex-max", "anthropic/claude-sonnet-4-6"] },
};

function isQuotaTight(provider: string, quotaStatus?: QuotaStatus[]): boolean {
  if (!quotaStatus) return false;
  const quota = quotaStatus.find((q) => q.provider === provider);
  if (!quota) return false;
  return quota.usagePercent >= 0.8;
}

function selectFallbackModel(priority: Priority, quotaStatus?: QuotaStatus[]): string | null {
  const candidates = MODEL_FALLBACKS[priority]?.models || [];
  for (const model of candidates) {
    const provider = getProviderFromModel(model);
    if (!isQuotaTight(provider, quotaStatus)) return model;
  }
  return candidates[0] || null;
}

function optimizeAgentModels(config: StrategyConfig, priority: Priority, quotaStatus?: QuotaStatus[]): void {
  if (!config.agents) return;
  for (const agent of Object.values(config.agents)) {
    if (!agent?.model) continue;
    const provider = getProviderFromModel(agent.model);
    if (isQuotaTight(provider, quotaStatus)) {
      const replacement = selectFallbackModel(priority, quotaStatus);
      if (replacement) agent.model = replacement;
    }
  }
}

function tuneAgentParameters(config: StrategyConfig, scenarioType: ScenarioType): void {
  if (!config.agents) return;
  const tuning = {
    temperature: { coding: 0.2, research: 0.2, creative: 0.75, writing: 0.6, multimedia: 0.7, social: 0.7, documentation: 0.25, daily: 0.3, tools: 0.25, education: 0.4, health: 0.35, finance: 0.2, entertainment: 0.6 } as Record<ScenarioType, number>,
    maxTokens: { coding: 5000, research: 7000, creative: 5000, writing: 4500, multimedia: 4500, social: 4000, documentation: 3500, daily: 3500, tools: 3000, education: 4000, health: 4000, finance: 4500, entertainment: 3500 } as Record<ScenarioType, number>,
  };

  for (const agent of Object.values(config.agents)) {
    if (!agent) continue;
    if (typeof agent.temperature === "number") agent.temperature = tuning.temperature[scenarioType];
    if (typeof agent.maxTokens === "number") agent.maxTokens = tuning.maxTokens[scenarioType];
  }
}

function formatTimestamp(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return date.getFullYear().toString() + pad(date.getMonth() + 1) + pad(date.getDate()) + pad(date.getHours()) + pad(date.getMinutes());
}

export function cleanupDynamicStrategies(retentionDays: number = 7): number {
  if (!fileExists(DYNAMIC_STRATEGIES_DIR)) return 0;
  const now = Date.now();
  const maxAge = retentionDays * 24 * 60 * 60 * 1000;
  let removed = 0;

  for (const file of fs.readdirSync(DYNAMIC_STRATEGIES_DIR)) {
    if (!file.endsWith(".jsonc") || !file.startsWith("strategy-")) continue;
    const filePath = path.join(DYNAMIC_STRATEGIES_DIR, file);
    const stat = fs.statSync(filePath);
    if (now - stat.mtime.getTime() > maxAge) {
      fs.unlinkSync(filePath);
      removed++;
    }
  }
  return removed;
}

export function generateDynamicStrategy(options: DynamicStrategyOptions): DynamicStrategyResult | null {
  const parsed = parseRecommendationContext(options.description);
  const scenarioType = parsed.scenario?.type || ("daily" as ScenarioType);
  const priority = options.priority || parsed.scenario?.priority || "balanced";

  const templates = SCENARIO_TEMPLATE_MAP[scenarioType] || ["balanced", "fast"];
  const baseTemplate = templates[0];
  const templatePath = pathManager.getTemplateFilePath(baseTemplate);

  if (!fileExists(templatePath)) {
    error(`模板不存在: ${baseTemplate}`);
    return null;
  }

  const config = readJSONC(templatePath) as StrategyConfig;
  optimizeAgentModels(config, priority, options.quotaStatus);
  tuneAgentParameters(config, scenarioType);

  const today = new Date().toISOString().split("T")[0];
  config.description = `动态生成(${scenarioType}/${priority}) ${config.description || ""}`.trim();
  config.metadata = { ...config.metadata, updated: today, use_case: scenarioType, optimization: "dynamic-generated" };

  if (!validateStrategy(config)) {
    error("动态策略生成失败: 验证未通过");
    return null;
  }

  const name = `strategy-generated-${scenarioType}-${formatTimestamp(new Date())}`;
  const filePath = path.join(DYNAMIC_STRATEGIES_DIR, `${name}.jsonc`);

  cleanupDynamicStrategies(options.retentionDays ?? 7);

  if (options.save !== false) {
    writeJSONC(filePath, config);
  }

  return { name, filePath, baseTemplate, config };
}

export function saveDynamicStrategyAs(dynamicName: string, targetName: string): boolean {
  const sourcePath = path.join(DYNAMIC_STRATEGIES_DIR, `${dynamicName}.jsonc`);
  const targetPath = path.join(STRATEGIES_DIR, `${targetName}.jsonc`);

  if (!fileExists(sourcePath)) {
    error(`动态策略不存在: ${dynamicName}`);
    return false;
  }
  if (fileExists(targetPath)) {
    error(`目标策略已存在: ${targetName}`);
    return false;
  }

  try {
    fs.copyFileSync(sourcePath, targetPath);
    success(`已固化动态策略: ${dynamicName} → ${targetName}`);
    return true;
  } catch (err) {
    error(`固化失败: ${err}`);
    return false;
  }
}
