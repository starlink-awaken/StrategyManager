/**
 * StrategyCore.ts
 * 策略管理核心逻辑
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { defaultPathManager } from "./PathManager";
import { readJSONC, writeJSONC, fileExists } from './FileSystemUtils';
import { addHistoryEntry } from './HistoryManager';
import { colorize, success, error, info, warning } from './FormatUtils';
import { validateStrategy } from "./Validator";
import type { StrategyConfig, StrategyMetadata } from "./interfaces";

const pathManager = defaultPathManager;
const STRATEGIES_DIR = pathManager.getStrategiesDir();
const DYNAMIC_STRATEGIES_DIR = pathManager.getDynamicStrategiesDir();
const CONFIG_FILE = pathManager.getConfigFileWithComments();
const RECOMMENDATION_FEEDBACK_FILE = pathManager.getRecommendationFeedbackFile();

/**
 * 提取策略中使用的模型列表
 */
export function extractModels(config: StrategyConfig): string[] {
  const models: string[] = [];

  if (config.agents) {
    for (const agent of Object.values(config.agents)) {
      if (agent?.model && typeof agent.model === "string") {
        models.push(agent.model);
      }
    }
  }

  if (config.categories) {
    for (const category of Object.values(config.categories)) {
      if (category?.model && typeof category.model === "string") {
        models.push(category.model);
      }
    }
  }

  return Array.from(new Set(models));
}

/**
 * 规范化策略元数据
 */
export function normalizeMetadata(
  config: StrategyConfig,
  strategyName: string,
): StrategyConfig {
  const now = new Date().toISOString().split("T")[0];

  if (!config.metadata) {
    config.metadata = {};
  }

  if (!config.metadata.version) {
    config.metadata.version = "1.0.0";
  }

  if (!config.metadata.updated) {
    config.metadata.updated = now;
  }

  if (!config.metadata.cost_level) {
    if (strategyName.includes("super") || strategyName.includes("performance")) {
      config.metadata.cost_level = "high";
    } else if (strategyName.includes("economical")) {
      config.metadata.cost_level = "low";
    } else {
      config.metadata.cost_level = "medium";
    }
  }

  if (!config.metadata.use_case) {
    config.metadata.use_case = "通用场景";
  }

  return config;
}

/**
 * 验证元数据完整性
 */
export function validateMetadata(config: StrategyConfig): string[] {
  const warnings: string[] = [];

  if (!config.metadata) {
    warnings.push("缺少 metadata 字段（建议补充）");
    return warnings;
  }

  if (!config.metadata.version) warnings.push("metadata 缺少 version 字段");
  if (!config.metadata.updated) warnings.push("metadata 缺少 updated 字段");
  if (!config.metadata.cost_level) warnings.push("metadata 缺少 cost_level 字段");
  if (!config.metadata.use_case) warnings.push("metadata 缺少 use_case 字段");

  return warnings;
}

/**
 * 检查是否为软链接
 */
export function isSymlink(filePath: string): boolean {
  try {
    return fs.lstatSync(filePath).isSymbolicLink();
  } catch {
    return false;
  }
}

/**
 * 读取软链接目标
 */
export function readSymlink(filePath: string): string | null {
  try {
    return fs.readlinkSync(filePath);
  } catch {
    return null;
  }
}

/**
 * 读取当前激活策略
 */
export function getCurrentStrategy(): StrategyMetadata | null {
  if (!fileExists(CONFIG_FILE)) return null;

  if (isSymlink(CONFIG_FILE)) {
    const target = readSymlink(CONFIG_FILE);
    if (!target) return null;

    const name = path.basename(target, ".jsonc");
    try {
      const config = readJSONC(target) as StrategyConfig;
      return {
        name,
        filePath: target,
        description: config.metadata?.description || config.description || "无描述",
        costLevel: config.metadata?.cost_level || "unknown",
        version: config.metadata?.version,
        isCurrent: true,
        useCase: config.metadata?.use_case,
        models: extractModels(config),
        source: target.startsWith(DYNAMIC_STRATEGIES_DIR) ? "dynamic" : "installed",
      };
    } catch (err) {
      error(`读取策略失败: ${target}`);
      return null;
    }
  }

  return null;
}

/**
 * 读取指定策略配置
 */
export function readStrategy(strategyName: string): StrategyConfig | null {
  const strategyFile = path.join(STRATEGIES_DIR, `${strategyName}.jsonc`);
  const dynamicFile = path.join(DYNAMIC_STRATEGIES_DIR, `${strategyName}.jsonc`);

  if (!fileExists(strategyFile) && !fileExists(dynamicFile)) {
    error(`策略文件不存在: ${strategyFile}`);
    return null;
  }

  try {
    return fileExists(strategyFile) ? readJSONC(strategyFile) : readJSONC(dynamicFile);
  } catch (err) {
    error(`读取策略失败: ${strategyName}`);
    return null;
  }
}

/**
 * 获取所有可用策略
 */
export function listStrategiesWithOptions(options?: {
  includeDynamic?: boolean;
}): StrategyMetadata[] {
  if (!fileExists(STRATEGIES_DIR)) {
    error(`策略目录不存在: ${STRATEGIES_DIR}`);
    return [];
  }

  const current = getCurrentStrategy();
  const strategies: StrategyMetadata[] = [];

  const collectFromDir = (dir: string, source: "installed" | "dynamic") => {
    if (!fileExists(dir)) return;
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const isStrategyFormat = file.startsWith("strategy-") && file.endsWith(".jsonc");
      const isCoreTemplate = ["smart.jsonc", "balanced.jsonc", "fast.jsonc", "cheap.jsonc"].includes(file);
      const isValidFile = (isStrategyFormat || isCoreTemplate) && !file.includes(".backup");

      if (!isValidFile) continue;

      const filePath = path.join(dir, file);
      try {
        const config = readJSONC(filePath) as StrategyConfig;
        const name = path.basename(file, ".jsonc");

        strategies.push({
          name,
          filePath,
          description: config.metadata?.description || config.description || "无描述",
          costLevel: config.metadata?.cost_level || "unknown",
          version: config.metadata?.version,
          isCurrent: current?.filePath === filePath || (current?.name === name && current?.source === source),
          useCase: config.metadata?.use_case,
          models: extractModels(config),
          source,
        });
      } catch (err) {
        warning(`跳过无效策略文件: ${file}`);
      }
    }
  };

  collectFromDir(STRATEGIES_DIR, "installed");
  if (options?.includeDynamic) {
    collectFromDir(DYNAMIC_STRATEGIES_DIR, "dynamic");
  }

  return strategies.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * 切换策略
 */
export async function switchStrategy(strategyName: string): Promise<boolean> {
  const strategyFile = path.join(STRATEGIES_DIR, `${strategyName}.jsonc`);
  const dynamicFile = path.join(DYNAMIC_STRATEGIES_DIR, `${strategyName}.jsonc`);
  const targetFile = fileExists(strategyFile) ? strategyFile : dynamicFile;

  if (!fileExists(targetFile)) {
    error(`策略文件不存在: ${strategyName}`);
    return false;
  }

  let config = readStrategy(strategyName);
  if (!config) return false;

  config = normalizeMetadata(config, strategyName);

  if (!validateStrategy(config)) {
    error(`策略验证失败: ${strategyName}`);
    return false;
  }

  // 备份现有配置（如果是普通文件）
  if (fileExists(CONFIG_FILE) && !isSymlink(CONFIG_FILE)) {
    const backupPath = `${CONFIG_FILE}.backup.${Date.now()}`;
    info(`备份现有配置: ${backupPath}`);
    fs.copyFileSync(CONFIG_FILE, backupPath);
  }

  const current = getCurrentStrategy();
  if (current) {
    addHistoryEntry({
      timestamp: new Date().toISOString(),
      strategyName: current.name,
      strategyPath: current.filePath,
      action: "switch",
      backupPath: fileExists(CONFIG_FILE) && !isSymlink(CONFIG_FILE) ? `${CONFIG_FILE}.backup.${Date.now()}` : undefined,
    });
  }

  applyToolConstraints(config);

  const jsoncContent = JSON.stringify(config, null, 2) + "\n";
  fs.writeFileSync(targetFile, jsoncContent, "utf8");
  info(`已应用工具约束并更新配置: ${targetFile}`);

  try {
    const configFileJsonc = pathManager.getConfigFileWithComments();
    execSync(`ln -sf "${targetFile}" "${configFileJsonc}"`, { stdio: "inherit" });
    info(`已更新 JSONC 软链: ${configFileJsonc}`);

    success(`已切换到策略: ${strategyName}`);
    info(`软链目标: ${targetFile}`);
    info(`描述: ${config.description}`);
    
    console.log();
    console.log(colorize("⚠️  请重启 Claude Code 或 OpenCode 使新策略生效", "yellow"));

    addHistoryEntry({
      timestamp: new Date().toISOString(),
      strategyName,
      strategyPath: targetFile,
      action: "switch",
    });

    const { updateLastRecommendationSelection } = require("./RecommendationEngine");
    updateLastRecommendationSelection(strategyName);

    return true;
  } catch (err) {
    error(`切换策略失败: ${err}`);
    return false;
  }
}

/**
 * 应用工具约束过滤
 */
export function applyToolConstraints(config: StrategyConfig): void {
  const constraints = config.lsp?.constraints || {};
  const allowedTools = (constraints as { allowedTools?: string[] }).allowedTools;
  const maxTools = (constraints as { maxTools?: number }).maxTools;

  if (!allowedTools && !maxTools) return;

  for (const agent of Object.values(config.agents || {})) {
    if (!agent?.tools) continue;
    let filtered: string[] = (agent as any).tools;

    if (allowedTools && Array.isArray(allowedTools)) {
      filtered = filtered.filter((tool: string) => allowedTools.includes(tool));
    }
    if (typeof maxTools === 'number' && filtered.length > maxTools) {
      filtered = filtered.slice(0, maxTools);
    }
    (agent as any).tools = filtered;
  }

  for (const category of Object.values(config.categories || {})) {
    if (!category?.tools) continue;
    let filtered: string[] = (category as any).tools;

    if (allowedTools && Array.isArray(allowedTools)) {
      filtered = filtered.filter((tool: string) => allowedTools.includes(tool));
    }
    if (typeof maxTools === 'number' && filtered.length > maxTools) {
      filtered = filtered.slice(0, maxTools);
    }
    (category as any).tools = filtered;
  }
}
