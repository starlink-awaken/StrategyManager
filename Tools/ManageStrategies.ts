/**
 * ManageStrategies.ts
 * 策略管理系统核心工具
 *
 * 提供策略的读取、切换、列表、修正、验证、对比、历史记录、导出/导入和智能推荐功能
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { PathManager, defaultPathManager } from "./PathManager";
import {
  SmartRecommender,
  parseRecommendationContext,
  type ScenarioType,
  type Priority,
  type QuotaStatus,
  type RecommendationContext,
  type HistoryData,
  type BudgetConfig,
} from "./Recommender";
import {
  UsageSyncCoordinator,
  AnthropicSync,
  AnthropicLocalSync,
  OpenAISync,
  OpenAILocalSync,
  GitHubSync,
  GeminiSync,
  GeminiLocalSync,
  ZhiPuSync,
  ZhiPuLocalSync,
  DeepSeekSync,
  SiliconFlowSync,
  ConfigLoader,
  type UsageData,
} from "./UsageSync";

// ==================== 类型定义 ====================

/**
 * 策略配置接口
 */
export interface AgentPermissionConfig {
  edit?: "ask" | "allow" | "deny";
  bash?: "ask" | "allow" | "deny" | Record<string, "ask" | "allow" | "deny">;
  webfetch?: "ask" | "allow" | "deny";
  doom_loop?: "ask" | "allow" | "deny";
  external_directory?: "ask" | "allow" | "deny";
}

export interface AgentThinkingConfig {
  type: "enabled" | "disabled";
  budgetTokens?: number;
}

export interface AgentConfig {
  model?: string;
  variant?: string;
  category?: string;
  skills?: string[];
  temperature?: number;
  top_p?: number;
  prompt?: string;
  prompt_append?: string;
  tools?: Record<string, boolean>;
  disable?: boolean;
  description?: string;
  mode?: "subagent" | "primary" | "all";
  color?: string;
  permission?: AgentPermissionConfig;
  maxTokens?: number;
  thinking?: AgentThinkingConfig;
  reasoningEffort?: "low" | "medium" | "high" | "xhigh";
  textVerbosity?: "low" | "medium" | "high";
  providerOptions?: Record<string, any>;
}

export interface CategoryConfig {
  description?: string;
  model?: string;
  variant?: string;
  temperature?: number;
  top_p?: number;
  maxTokens?: number;
  thinking?: AgentThinkingConfig;
  reasoningEffort?: "low" | "medium" | "high" | "xhigh";
  textVerbosity?: "low" | "medium" | "high";
  tools?: Record<string, boolean>;
  prompt_append?: string;
  is_unstable_agent?: boolean;
}

export interface StrategyConfig {
  $schema?: string;
  description?: string;
  lsp?: Record<string, any>;
  agents?: Record<string, AgentConfig>;
  categories?: Record<string, CategoryConfig>;
  background_task?: {
    modelConcurrency?: Record<string, number>;
  };
  metadata?: {
    version?: string;
    updated?: string;
    cost_level?: "low" | "medium" | "high";
    use_case?: string;
    optimization?: string;
  };
}

/**
 * 策略元信息
 */
export interface StrategyMetadata {
  name: string;
  filePath: string;
  description: string;
  costLevel: string;
  version?: string;
  isCurrent: boolean;
  useCase?: string;
  models?: string[];
  source?: "installed" | "dynamic";
}

/**
 * 历史记录项
 */
export interface HistoryEntry {
  timestamp: string;
  strategyName: string;
  strategyPath: string;
  action: "switch" | "rollback" | "import";
  backupPath?: string;
}

/**
 * 策略差异
 */
export interface StrategyDiff {
  added: string[];
  removed: string[];
  modified: string[];
}

/**
 * 推荐结果
 */
export interface Recommendation {
  strategyName: string;
  reason: string;
  score: number;
}

export interface RecommendationInput {
  description: string;
  priority?: Priority;
  budget?: BudgetConfig;
  history?: HistoryData;
  quotaStatus?: QuotaStatus[];
  includeDynamic?: boolean;
}

export interface RecommendationFeedback {
  timestamp: string;
  scenario: string;
  recommendedStrategy: string;
  selectedStrategy?: string;
  score?: number;
  quotaSnapshot?: QuotaStatus[];
}

export interface DynamicStrategyOptions {
  description: string;
  priority?: Priority;
  quotaStatus?: QuotaStatus[];
  save?: boolean;
  retentionDays?: number;
}

export interface DynamicStrategyResult {
  name: string;
  filePath: string;
  baseTemplate: string;
  config: StrategyConfig;
}

// ==================== 常量定义 ====================

// 使用默认路径管理器（用户模式）
const pathManager = defaultPathManager;
const CONFIG_DIR = pathManager.getConfigDir();
const STRATEGIES_DIR = pathManager.getStrategiesDir();
const DYNAMIC_STRATEGIES_DIR = pathManager.getDynamicStrategiesDir();
const CONFIG_FILE = pathManager.getConfigFileWithComments();
const HISTORY_FILE = pathManager.getHistoryFile();
const RECOMMENDATION_FEEDBACK_FILE =
  pathManager.getRecommendationFeedbackFile();
const MAX_BACKUPS = 5;

// 确保必要的目录存在
pathManager.ensureDirectories();

// ==================== 元数据规范化 ====================

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

  // 补充缺失的字段
  if (!config.metadata.version) {
    config.metadata.version = "1.0.0";
  }

  if (!config.metadata.updated) {
    config.metadata.updated = now;
  }

  if (!config.metadata.cost_level) {
    // 根据策略名称推断成本等级
    if (
      strategyName.includes("super") ||
      strategyName.includes("performance")
    ) {
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

  if (!config.metadata.version) {
    warnings.push("metadata 缺少 version 字段");
  }

  if (!config.metadata.updated) {
    warnings.push("metadata 缺少 updated 字段");
  }

  if (!config.metadata.cost_level) {
    warnings.push("metadata 缺少 cost_level 字段");
  }

  if (!config.metadata.use_case) {
    warnings.push("metadata 缺少 use_case 字段");
  }

  return warnings;
}

// ==================== 输出格式化 ====================

const COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

export function colorize(text: string, color: keyof typeof COLORS): string {
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

export function success(text: string): void {
  console.log(colorize(`✅ ${text}`, "green"));
}

export function error(text: string): void {
  console.error(colorize(`❌ ${text}`, "red"));
}

export function warning(text: string): void {
  console.log(colorize(`⚠️  ${text}`, "yellow"));
}

export function info(text: string): void {
  console.log(colorize(`ℹ️  ${text}`, "blue"));
}

// ==================== 格式化表格 ====================

/**
 * 格式化表格输出
 */
export function formatTable(headers: string[], rows: string[][]): string {
  const maxWidths = headers.map((header, i) => {
    const columnWidths = rows.map((row) => (row[i] || "").length);
    return Math.max(header.length, ...columnWidths);
  });

  const separator = maxWidths.map((width) => "-".repeat(width + 2)).join("+");

  let result = separator + "\n";
  result +=
    "| " +
    headers.map((header, i) => header.padEnd(maxWidths[i])).join(" | ") +
    " |\n";
  result += separator + "\n";

  for (const row of rows) {
    result +=
      "| " +
      row.map((cell, i) => (cell || "").padEnd(maxWidths[i])).join(" | ") +
      " |\n";
  }

  result += separator;
  return result;
}

// ==================== 文件系统操作 ====================

export function readJSONC(filePath: string): any {
  const content = fs.readFileSync(filePath, "utf-8");

  const hasComments = /^\s*\/\/|\/\*/m.test(content);

  if (!hasComments) {
    return JSON.parse(content);
  }

  let result = content;

  // 先移除块注释 /* ... */
  result = result.replace(/\/\*[\s\S]*?\*\//g, "");

  // 移除行尾的 // 注释（需要小心不匹配字符串内的 //）
  // 策略：逐行处理，只移除不在引号内的 //
  const lines = result.split("\n");
  const processedLines: string[] = [];

  for (const line of lines) {
    let processedLine = "";
    let inString = false;
    let escapeNext = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (escapeNext) {
        processedLine += char;
        escapeNext = false;
        continue;
      }

      if (char === "\\") {
        processedLine += char;
        escapeNext = true;
        continue;
      }

      if (char === '"' || char === "'" || char === "`") {
        inString = !inString;
        processedLine += char;
        continue;
      }

      // 如果不在字符串内且遇到 //，则截断
      if (
        !inString &&
        char === "/" &&
        i + 1 < line.length &&
        line[i + 1] === "/"
      ) {
        break;
      }

      processedLine += char;
    }

    processedLines.push(processedLine);
  }

  const jsonContent = processedLines.join("\n");

  try {
    return JSON.parse(jsonContent);
  } catch (err) {
    throw new Error(`解析 JSONC 文件失败: ${filePath}`);
  }
}

/**
 * 写入 JSONC 文件
 */
export function writeJSONC(filePath: string, data: any): void {
  const jsonContent = JSON.stringify(data, null, 2);
  fs.writeFileSync(filePath, jsonContent, "utf-8");
}

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

  return Array.from(new Set(models));
}

/**
 * 检查文件是否存在
 */
export function fileExists(filePath: string): boolean {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
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

// ==================== 策略读取功能 ====================

/**
 * 读取当前激活策略
 */
export function getCurrentStrategy(): StrategyMetadata | null {
  if (!fileExists(CONFIG_FILE)) {
    return null;
  }

  if (isSymlink(CONFIG_FILE)) {
    const target = readSymlink(CONFIG_FILE);
    if (!target) return null;

    const name = path.basename(target, ".jsonc");
    try {
      const config = readJSONC(target);
      return {
        name,
        filePath: target,
        description: config.description || "无描述",
        costLevel: config.metadata?.cost_level || "unknown",
        version: config.metadata?.version,
        isCurrent: true,
        useCase: config.metadata?.use_case,
        models: extractModels(config),
        source: target.startsWith(DYNAMIC_STRATEGIES_DIR)
          ? "dynamic"
          : "installed",
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

  const dynamicFile = path.join(
    DYNAMIC_STRATEGIES_DIR,
    `${strategyName}.jsonc`,
  );

  if (!fileExists(strategyFile) && !fileExists(dynamicFile)) {
    error(`策略文件不存在: ${strategyFile}`);
    return null;
  }

  try {
    return fileExists(strategyFile)
      ? readJSONC(strategyFile)
      : readJSONC(dynamicFile);
  } catch (err) {
    error(`读取策略失败: ${strategyName}`);
    return null;
  }
}

// ==================== 策略切换功能 ====================

/**
 * 切换策略
 */
export function switchStrategy(strategyName: string): boolean {
  const strategyFile = path.join(STRATEGIES_DIR, `${strategyName}.jsonc`);
  const dynamicFile = path.join(
    DYNAMIC_STRATEGIES_DIR,
    `${strategyName}.jsonc`,
  );

  const targetFile = fileExists(strategyFile) ? strategyFile : dynamicFile;

  if (!fileExists(targetFile)) {
    error(`策略文件不存在: ${strategyName}`);
    return false;
  }

  // 验证策略有效性
  let config = readStrategy(strategyName);
  if (!config) {
    return false;
  }

  // 规范化元数据
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

  // 记录历史
  const current = getCurrentStrategy();
  if (current) {
    addHistoryEntry({
      timestamp: new Date().toISOString(),
      strategyName: current.name,
      strategyPath: current.filePath,
      action: "switch",
      backupPath:
        fileExists(CONFIG_FILE) && !isSymlink(CONFIG_FILE)
          ? `${CONFIG_FILE}.backup.${Date.now()}`
          : undefined,
    });
  }

  // 创建软链接（只维护 .jsonc）
  try {
    const configFileJsonc = pathManager.getConfigFileWithComments();
    execSync(`ln -sf "${targetFile}" "${configFileJsonc}"`, { stdio: "inherit" });
    info(`已更新 JSONC 软链: ${configFileJsonc}`);

    success(`已切换到策略: ${strategyName}`);
    info(`软链目标: ${targetFile}`);
    info(`描述: ${config.description}`);
    
    // 重启提醒
    console.log();
    console.log(colorize("⚠️  请重启 Claude Code 或 OpenCode 使新策略生效", "yellow"));

    // 添加新历史记录
    addHistoryEntry({
      timestamp: new Date().toISOString(),
      strategyName,
      strategyPath: targetFile,
      action: "switch",
    });

    updateLastRecommendationSelection(strategyName);

    return true;
  } catch (err) {
    error(`切换策略失败: ${err}`);
    return false;
  }
}

// ==================== 策略列表功能 ====================

/**
 * 获取所有可用策略
 */
export function listStrategies(): StrategyMetadata[] {
  return listStrategiesWithOptions({ includeDynamic: false });
}

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
      if (
        !file.startsWith("strategy-") ||
        !file.endsWith(".jsonc") ||
        file.includes(".backup")
      ) {
        continue;
      }

      const filePath = path.join(dir, file);
      try {
        const config = readJSONC(filePath);
        const name = path.basename(file, ".jsonc");

        strategies.push({
          name,
          filePath,
          description: config.description || "无描述",
          costLevel: config.metadata?.cost_level || "unknown",
          version: config.metadata?.version,
          isCurrent:
            current?.filePath === filePath ||
            (current?.name === name && current?.source === source),
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
 * 显示策略列表
 */
export function displayStrategies(includeDynamic: boolean = false): void {
  const strategies = listStrategiesWithOptions({ includeDynamic });

  if (strategies.length === 0) {
    error("没有找到可用的策略");
    return;
  }

  info("可用策略:");
  console.log();

  const headers = ["名称", "成本级别", "描述", "来源", "状态"];
  const rows: string[][] = [];

  for (const strategy of strategies) {
    rows.push([
      strategy.name,
      strategy.costLevel,
      strategy.description.substring(0, 30) +
        (strategy.description.length > 30 ? "..." : ""),
      strategy.source === "dynamic" ? "动态" : "预置",
      strategy.isCurrent ? colorize("[当前]", "green") : "",
    ]);
  }

  console.log(formatTable(headers, rows));
}

// ==================== 策略修正功能 ====================

/**
 * 修正策略文件中的模型命名
 */
export function fixStrategies(): boolean {
  if (!fileExists(STRATEGIES_DIR)) {
    error(`策略目录不存在: ${STRATEGIES_DIR}`);
    return false;
  }

  // 创建备份
  const backupDir = path.join(
    process.env.HOME || "",
    ".config",
    "opencode",
    `strategies-backup-${Date.now()}`,
  );

  try {
    fs.mkdirSync(backupDir, { recursive: true });

    const files = fs.readdirSync(STRATEGIES_DIR);
    for (const file of files) {
      if (file.endsWith(".jsonc")) {
        fs.copyFileSync(
          path.join(STRATEGIES_DIR, file),
          path.join(backupDir, file),
        );
      }
    }

    info(`备份已创建: ${backupDir}`);
  } catch (err) {
    error(`创建备份失败: ${err}`);
    return false;
  }

  // 修正 Google 模型命名
  const replacements = [
    ["google/gemini-3-pro", "google/antigravity-gemini-3-pro"],
    ["google/gemini-3-flash", "google/antigravity-gemini-3-flash"],
    ["google/gemini-2.0-", "google/antigravity-gemini-2.0-"],
    ["google/gemini-2.5-", "google/antigravity-gemini-2.5-"],
  ];

  let fixedCount = 0;

  try {
    const files = fs.readdirSync(STRATEGIES_DIR);
    for (const file of files) {
      if (!file.endsWith(".jsonc")) {
        continue;
      }

      const filePath = path.join(STRATEGIES_DIR, file);
      let content = fs.readFileSync(filePath, "utf-8");
      let modified = false;

      for (const [from, to] of replacements) {
        if (content.includes(from)) {
          content = content.replace(
            new RegExp(from.replace(/\//g, "\\/"), "g"),
            to,
          );
          modified = true;
        }
      }

      if (modified) {
        fs.writeFileSync(filePath, content, "utf-8");
        info(`已修正: ${file}`);
        fixedCount++;
      }
    }

    success(`修正完成: ${fixedCount} 个策略文件`);
    return true;
  } catch (err) {
    error(`修正失败: ${err}`);
    return false;
  }
}

// ==================== 策略验证功能 ====================

/**
 * 验证策略配置
 */
export function validateStrategy(config: StrategyConfig): boolean {
  const errors: string[] = [];
  const warnings: string[] = [];

  const isObject = (value: unknown): value is Record<string, any> =>
    typeof value === "object" && value !== null;
  const isString = (value: unknown): value is string =>
    typeof value === "string";
  const isNumber = (value: unknown): value is number =>
    typeof value === "number" && !Number.isNaN(value);
  const isBoolean = (value: unknown): value is boolean =>
    typeof value === "boolean";
  const isStringArray = (value: unknown): value is string[] =>
    Array.isArray(value) && value.every((item) => typeof item === "string");

  // 检查必需字段
  if (!config.description) {
    warnings.push("缺少 description 字段（建议补充）");
  }

  // 验证 agents 配置
  if (config.agents) {
    for (const [agentName, agentConfig] of Object.entries(config.agents)) {
      if (!isObject(agentConfig)) {
        errors.push(`agent ${agentName} 配置不是对象`);
        continue;
      }

      if (agentConfig.model !== undefined && !isString(agentConfig.model)) {
        errors.push(`agent ${agentName} 的 model 必须是字符串`);
      }

      if (agentConfig.model === undefined) {
        warnings.push(`agent ${agentName} 未配置 model`);
      }

      if (agentConfig.variant !== undefined && !isString(agentConfig.variant)) {
        errors.push(`agent ${agentName} 的 variant 必须是字符串`);
      }

      if (
        agentConfig.category !== undefined &&
        !isString(agentConfig.category)
      ) {
        errors.push(`agent ${agentName} 的 category 必须是字符串`);
      }

      if (
        agentConfig.skills !== undefined &&
        !isStringArray(agentConfig.skills)
      ) {
        errors.push(`agent ${agentName} 的 skills 必须是字符串数组`);
      }

      if (
        agentConfig.temperature !== undefined &&
        !isNumber(agentConfig.temperature)
      ) {
        errors.push(`agent ${agentName} 的 temperature 必须是数字`);
      }

      if (agentConfig.top_p !== undefined && !isNumber(agentConfig.top_p)) {
        errors.push(`agent ${agentName} 的 top_p 必须是数字`);
      }

      if (
        agentConfig.maxTokens !== undefined &&
        !isNumber(agentConfig.maxTokens)
      ) {
        errors.push(`agent ${agentName} 的 maxTokens 必须是数字`);
      }

      if (agentConfig.prompt !== undefined && !isString(agentConfig.prompt)) {
        errors.push(`agent ${agentName} 的 prompt 必须是字符串`);
      }

      if (
        agentConfig.prompt_append !== undefined &&
        !isString(agentConfig.prompt_append)
      ) {
        errors.push(`agent ${agentName} 的 prompt_append 必须是字符串`);
      }

      if (agentConfig.tools !== undefined && !isObject(agentConfig.tools)) {
        errors.push(`agent ${agentName} 的 tools 必须是对象`);
      }

      if (
        agentConfig.disable !== undefined &&
        !isBoolean(agentConfig.disable)
      ) {
        errors.push(`agent ${agentName} 的 disable 必须是布尔值`);
      }

      if (
        agentConfig.description !== undefined &&
        !isString(agentConfig.description)
      ) {
        errors.push(`agent ${agentName} 的 description 必须是字符串`);
      }

      if (agentConfig.mode !== undefined && !isString(agentConfig.mode)) {
        errors.push(`agent ${agentName} 的 mode 必须是字符串`);
      }

      if (agentConfig.color !== undefined && !isString(agentConfig.color)) {
        errors.push(`agent ${agentName} 的 color 必须是字符串`);
      }

      if (
        agentConfig.permission !== undefined &&
        !isObject(agentConfig.permission)
      ) {
        errors.push(`agent ${agentName} 的 permission 必须是对象`);
      }

      if (
        agentConfig.thinking !== undefined &&
        !isObject(agentConfig.thinking)
      ) {
        errors.push(`agent ${agentName} 的 thinking 必须是对象`);
      }

      if (
        agentConfig.reasoningEffort !== undefined &&
        !isString(agentConfig.reasoningEffort)
      ) {
        errors.push(`agent ${agentName} 的 reasoningEffort 必须是字符串`);
      }

      if (
        agentConfig.textVerbosity !== undefined &&
        !isString(agentConfig.textVerbosity)
      ) {
        errors.push(`agent ${agentName} 的 textVerbosity 必须是字符串`);
      }

      if (
        agentConfig.providerOptions !== undefined &&
        !isObject(agentConfig.providerOptions)
      ) {
        errors.push(`agent ${agentName} 的 providerOptions 必须是对象`);
      }
    }
  }

  // 验证 categories 配置
  if (config.categories) {
    for (const [categoryName, categoryConfig] of Object.entries(
      config.categories,
    )) {
      if (!isObject(categoryConfig)) {
        errors.push(`category ${categoryName} 配置不是对象`);
        continue;
      }

      if (
        categoryConfig.model !== undefined &&
        !isString(categoryConfig.model)
      ) {
        errors.push(`category ${categoryName} 的 model 必须是字符串`);
      }

      if (categoryConfig.model === undefined) {
        warnings.push(`category ${categoryName} 未配置 model`);
      }

      if (
        categoryConfig.variant !== undefined &&
        !isString(categoryConfig.variant)
      ) {
        errors.push(`category ${categoryName} 的 variant 必须是字符串`);
      }

      if (
        categoryConfig.description !== undefined &&
        !isString(categoryConfig.description)
      ) {
        errors.push(`category ${categoryName} 的 description 必须是字符串`);
      }

      if (
        categoryConfig.temperature !== undefined &&
        !isNumber(categoryConfig.temperature)
      ) {
        errors.push(`category ${categoryName} 的 temperature 必须是数字`);
      }

      if (
        categoryConfig.top_p !== undefined &&
        !isNumber(categoryConfig.top_p)
      ) {
        errors.push(`category ${categoryName} 的 top_p 必须是数字`);
      }

      if (
        categoryConfig.maxTokens !== undefined &&
        !isNumber(categoryConfig.maxTokens)
      ) {
        errors.push(`category ${categoryName} 的 maxTokens 必须是数字`);
      }

      if (
        categoryConfig.thinking !== undefined &&
        !isObject(categoryConfig.thinking)
      ) {
        errors.push(`category ${categoryName} 的 thinking 必须是对象`);
      }

      if (
        categoryConfig.reasoningEffort !== undefined &&
        !isString(categoryConfig.reasoningEffort)
      ) {
        errors.push(`category ${categoryName} 的 reasoningEffort 必须是字符串`);
      }

      if (
        categoryConfig.textVerbosity !== undefined &&
        !isString(categoryConfig.textVerbosity)
      ) {
        errors.push(`category ${categoryName} 的 textVerbosity 必须是字符串`);
      }

      if (
        categoryConfig.tools !== undefined &&
        !isObject(categoryConfig.tools)
      ) {
        errors.push(`category ${categoryName} 的 tools 必须是对象`);
      }

      if (
        categoryConfig.prompt_append !== undefined &&
        !isString(categoryConfig.prompt_append)
      ) {
        errors.push(`category ${categoryName} 的 prompt_append 必须是字符串`);
      }

      if (
        categoryConfig.is_unstable_agent !== undefined &&
        !isBoolean(categoryConfig.is_unstable_agent)
      ) {
        errors.push(
          `category ${categoryName} 的 is_unstable_agent 必须是布尔值`,
        );
      }
    }
  }

  if (warnings.length > 0) {
    warning("策略验证警告:");
    for (const item of warnings) {
      console.log(`  - ${item}`);
    }
  }

  if (errors.length > 0) {
    error("策略验证失败:");
    for (const err of errors) {
      console.log(`  - ${err}`);
    }
    return false;
  }

  return true;
}

/**
 * 验证策略文件
 */
export function validateStrategyFile(strategyName: string): boolean {
  const config = readStrategy(strategyName);
  if (!config) {
    return false;
  }

  return validateStrategy(config);
}

// ==================== 策略对比功能 ====================

/**
 * 比较两个策略的差异
 */
export function compareStrategies(
  name1: string,
  name2: string,
): StrategyDiff | null {
  const config1 = readStrategy(name1);
  const config2 = readStrategy(name2);

  if (!config1 || !config2) {
    return null;
  }

  const diff: StrategyDiff = {
    added: [],
    removed: [],
    modified: [],
  };

  // 对比 metadata
  const meta1 = config1.metadata || {};
  const meta2 = config2.metadata || {};

  if (meta1.version !== meta2.version) {
    diff.modified.push(
      `metadata.version (${meta1.version || "无"} → ${meta2.version || "无"})`,
    );
  }

  if (meta1.cost_level !== meta2.cost_level) {
    diff.modified.push(
      `metadata.cost_level (${meta1.cost_level || "无"} → ${meta2.cost_level || "无"})`,
    );
  }

  if (meta1.use_case !== meta2.use_case) {
    diff.modified.push(
      `metadata.use_case (${meta1.use_case || "无"} → ${meta2.use_case || "无"})`,
    );
  }

  if (config1.description !== config2.description) {
    diff.modified.push(
      `description (${config1.description?.substring(0, 30) || "无"}... → ${config2.description?.substring(0, 30) || "无"}...)`,
    );
  }

  // 对比 agents
  const agents1 = config1.agents || {};
  const agents2 = config2.agents || {};

  const allAgents = Array.from(
    new Set([...Object.keys(agents1), ...Object.keys(agents2)]),
  );

  for (const agent of allAgents) {
    if (!agents1[agent]) {
      diff.added.push(`agent: ${agent}`);
    } else if (!agents2[agent]) {
      diff.removed.push(`agent: ${agent}`);
    } else if (agents1[agent].model !== agents2[agent].model) {
      diff.modified.push(
        `agent: ${agent} (${agents1[agent].model} → ${agents2[agent].model})`,
      );
    }
  }

  // 对比 categories
  const cats1 = config1.categories || {};
  const cats2 = config2.categories || {};

  const allCats = Array.from(
    new Set([...Object.keys(cats1), ...Object.keys(cats2)]),
  );

  for (const cat of allCats) {
    if (!cats1[cat]) {
      diff.added.push(`category: ${cat}`);
    } else if (!cats2[cat]) {
      diff.removed.push(`category: ${cat}`);
    } else if (cats1[cat].model !== cats2[cat].model) {
      diff.modified.push(
        `category: ${cat} (${cats1[cat].model} → ${cats2[cat].model})`,
      );
    }
  }

  return diff;
}

/**
 * 显示策略差异
 */
export function displayStrategyDiff(name1: string, name2: string): void {
  const diff = compareStrategies(name1, name2);

  if (!diff) {
    error("无法比较策略");
    return;
  }

  info(`对比: ${name1} → ${name2}`);
  console.log();

  if (diff.added.length > 0) {
    console.log(colorize("新增:", "green"));
    for (const item of diff.added) {
      console.log(`  + ${item}`);
    }
    console.log();
  }

  if (diff.removed.length > 0) {
    console.log(colorize("移除:", "red"));
    for (const item of diff.removed) {
      console.log(`  - ${item}`);
    }
    console.log();
  }

  if (diff.modified.length > 0) {
    console.log(colorize("修改:", "yellow"));
    for (const item of diff.modified) {
      console.log(`  ~ ${item}`);
    }
    console.log();
  }

  if (
    diff.added.length === 0 &&
    diff.removed.length === 0 &&
    diff.modified.length === 0
  ) {
    success("策略配置完全相同");
  }
}

// ==================== 历史记录功能 ====================

/**
 * 获取历史记录
 */
export function getHistory(): HistoryEntry[] {
  if (!fileExists(HISTORY_FILE)) {
    return [];
  }

  try {
    const content = fs.readFileSync(HISTORY_FILE, "utf-8");
    const data = JSON.parse(content);

    if (Array.isArray(data)) {
      return data;
    }

    if (data && typeof data === "object" && Array.isArray(data.history)) {
      return data.history;
    }

    return [];
  } catch (err) {
    error(`读取历史记录失败: ${err}`);
    return [];
  }
}

/**
 * 添加历史记录
 */
export function addHistoryEntry(entry: HistoryEntry): void {
  const history = getHistory();
  history.unshift(entry);

  // 保留最近 100 条记录
  const trimmedHistory = history.slice(0, 100);

  try {
    fs.writeFileSync(
      HISTORY_FILE,
      JSON.stringify(trimmedHistory, null, 2),
      "utf-8",
    );
  } catch (err) {
    error(`保存历史记录失败: ${err}`);
  }
}

/**
 * 显示历史记录
 */
export function displayHistory(limit: number = 10): void {
  const history = getHistory();
  const displayHistory = history.slice(0, limit);

  if (displayHistory.length === 0) {
    info("没有历史记录");
    return;
  }

  info("策略切换历史:");
  console.log();

  const headers = ["时间", "策略", "操作", "备份"];
  const rows: string[][] = [];

  for (const entry of displayHistory) {
    const date = new Date(entry.timestamp).toLocaleString("zh-CN");
    rows.push([
      date,
      entry.strategyName,
      entry.action,
      entry.backupPath ? path.basename(entry.backupPath) : "-",
    ]);
  }

  console.log(formatTable(headers, rows));
}

/**
 * 回滚到历史记录
 */
export function rollbackToHistory(index: number): boolean {
  const history = getHistory();

  if (index < 0 || index >= history.length) {
    error(`无效的历史记录索引: ${index}`);
    return false;
  }

  const entry = history[index];

  if (
    entry.action === "switch" &&
    entry.backupPath &&
    fileExists(entry.backupPath)
  ) {
    // 从备份恢复
    try {
      fs.copyFileSync(entry.backupPath, CONFIG_FILE);
      success(`已从备份恢复: ${path.basename(entry.backupPath)}`);

      addHistoryEntry({
        timestamp: new Date().toISOString(),
        strategyName: entry.strategyName,
        strategyPath: entry.strategyPath,
        action: "rollback",
      });

      return true;
    } catch (err) {
      error(`恢复备份失败: ${err}`);
      return false;
    }
  } else if (fileExists(entry.strategyPath)) {
    // 直接切换到历史策略
    return switchStrategy(path.basename(entry.strategyPath, ".jsonc"));
  } else {
    error(`无法回滚: 策略文件或备份不存在`);
    return false;
  }
}

// ==================== 导出/导入功能 ====================

/**
 * 导出策略为 JSON 文件
 */
export function exportStrategy(
  strategyName: string,
  outputPath: string,
): boolean {
  const config = readStrategy(strategyName);
  if (!config) {
    return false;
  }

  try {
    writeJSONC(outputPath, config);
    success(`已导出策略: ${strategyName} → ${outputPath}`);
    return true;
  } catch (err) {
    error(`导出失败: ${err}`);
    return false;
  }
}

/**
 * 导入策略并验证
 */
export function importStrategy(
  strategyName: string,
  inputPath: string,
): boolean {
  if (!fileExists(inputPath)) {
    error(`文件不存在: ${inputPath}`);
    return false;
  }

  try {
    let config = readJSONC(inputPath);

    // 规范化元数据
    config = normalizeMetadata(config, strategyName);

    if (!validateStrategy(config)) {
      return false;
    }

    const outputPath = path.join(STRATEGIES_DIR, `${strategyName}.jsonc`);
    writeJSONC(outputPath, config);

    success(`已导入策略: ${strategyName} ← ${inputPath}`);

    addHistoryEntry({
      timestamp: new Date().toISOString(),
      strategyName,
      strategyPath: outputPath,
      action: "import",
    });

    return true;
  } catch (err) {
    error(`导入失败: ${err}`);
    return false;
  }
}

// ==================== 智能推荐功能 ====================

/**
 * 构建推荐上下文
 */
export function buildRecommendationContext(
  input: RecommendationInput,
): RecommendationContext {
  const parsed = parseRecommendationContext(input.description);

  if (input.priority) {
    if (parsed.scenario) {
      parsed.scenario.priority = input.priority;
    } else {
      parsed.scenario = {
        type: "daily" as ScenarioType,
        priority: input.priority,
      };
    }
  }

  if (input.budget) {
    parsed.budget = input.budget;
  }

  if (input.history) {
    parsed.history = input.history;
  }

  if (input.quotaStatus) {
    parsed.quotaStatus = input.quotaStatus;
  }

  return parsed;
}

/**
 * 智能推荐（支持配额与模型特性）
 */
export function recommendStrategySmart(
  input: RecommendationInput,
): Recommendation | null {
  const strategies = listStrategiesWithOptions({
    includeDynamic: input.includeDynamic ?? false,
  });
  if (strategies.length === 0) {
    return null;
  }

  const context = buildRecommendationContext(input);
  const recommender = new SmartRecommender(strategies);
  const best = recommender.recommend(context)[0];

  if (!best) return null;

  return {
    strategyName: best.strategyName,
    reason: best.reason,
    score: best.score,
  };
}

/**
 * 基于场景推荐策略（兼容旧接口）
 */
export function recommendStrategy(scenario: string): Recommendation | null {
  return recommendStrategySmart({ description: scenario });
}

/**
 * 显示推荐结果
 */
export function displayRecommendation(scenario: string): void {
  const recommendation = recommendStrategySmart({ description: scenario });

  if (!recommendation) {
    error("无法生成推荐");
    return;
  }

  info(`基于场景 "${scenario}" 的推荐:`);
  console.log();
  console.log(colorize(`推荐策略: ${recommendation.strategyName}`, "green"));
  console.log(`推荐理由: ${recommendation.reason}`);
  console.log(`匹配度: ${recommendation.score}%`);

  recordRecommendationFeedback({
    timestamp: new Date().toISOString(),
    scenario,
    recommendedStrategy: recommendation.strategyName,
    score: recommendation.score,
  });
}

/**
 * 读取推荐反馈记录
 */
export function loadRecommendationFeedback(): RecommendationFeedback[] {
  if (!fileExists(RECOMMENDATION_FEEDBACK_FILE)) {
    return [];
  }

  try {
    const content = fs.readFileSync(RECOMMENDATION_FEEDBACK_FILE, "utf-8");
    const data = JSON.parse(content);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    warning("读取推荐反馈失败，已忽略");
    return [];
  }
}

/**
 * 记录推荐反馈
 */
export function recordRecommendationFeedback(
  entry: RecommendationFeedback,
): void {
  const entries = loadRecommendationFeedback();
  entries.push(entry);

  try {
    fs.writeFileSync(
      RECOMMENDATION_FEEDBACK_FILE,
      JSON.stringify(entries, null, 2),
      "utf-8",
    );
  } catch (err) {
    warning("写入推荐反馈失败");
  }
}

export function updateLastRecommendationSelection(
  selectedStrategy: string,
): void {
  const entries = loadRecommendationFeedback();
  if (entries.length === 0) return;

  const last = entries[entries.length - 1];
  if (last.selectedStrategy) return;

  const lastTime = Date.parse(last.timestamp || "");
  if (!Number.isNaN(lastTime)) {
    const ageHours = (Date.now() - lastTime) / (1000 * 60 * 60);
    if (ageHours > 24) return;
  }

  last.selectedStrategy = selectedStrategy;

  try {
    fs.writeFileSync(
      RECOMMENDATION_FEEDBACK_FILE,
      JSON.stringify(entries, null, 2),
      "utf-8",
    );
  } catch (err) {
    warning("更新推荐反馈失败");
  }
}

export type FeedbackBucket = "day" | "week" | "month";

export function generateRecommendationFeedbackReport(options?: {
  bucket?: FeedbackBucket;
}): {
  total: number;
  accepted: number;
  acceptanceRate: number;
  funnel: {
    recommended: number;
    selected: number;
    acceptanceRate: number;
  };
  topRecommended: Array<{ strategy: string; count: number }>;
  topSelected: Array<{ strategy: string; count: number }>;
  byScenario: Array<{ scenario: string; count: number; accepted: number }>;
  byTimeBucket: Array<{
    bucket: string;
    total: number;
    accepted: number;
    acceptanceRate: number;
  }>;
} {
  const entries = loadRecommendationFeedback();
  const total = entries.length;
  const acceptedEntries = entries.filter((e) => !!e.selectedStrategy);
  const accepted = acceptedEntries.length;
  const acceptanceRate = total === 0 ? 0 : accepted / total;
  const bucket = options?.bucket ?? "day";

  const countBy = (items: string[]): Map<string, number> => {
    const map = new Map<string, number>();
    for (const item of items) {
      map.set(item, (map.get(item) || 0) + 1);
    }
    return map;
  };

  const recommendedMap = countBy(
    entries.map((e) => e.recommendedStrategy).filter(Boolean),
  );
  const selectedMap = countBy(
    acceptedEntries
      .map((e) => e.selectedStrategy)
      .filter((v): v is string => !!v),
  );

  const scenarioMap = new Map<string, { count: number; accepted: number }>();
  for (const entry of entries) {
    const key = entry.scenario || "unknown";
    const existing = scenarioMap.get(key) || { count: 0, accepted: 0 };
    existing.count += 1;
    if (entry.selectedStrategy) existing.accepted += 1;
    scenarioMap.set(key, existing);
  }

  const bucketMap = new Map<string, { total: number; accepted: number }>();
  const getBucketKey = (timestamp: string): string | null => {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return null;

    if (bucket === "day") {
      return date.toISOString().split("T")[0];
    }

    if (bucket === "month") {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      return `${year}-${month}`;
    }

    const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = tmp.getUTCDay() || 7;
    tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    const week = String(weekNo).padStart(2, "0");
    return `${tmp.getUTCFullYear()}-W${week}`;
  };

  for (const entry of entries) {
    const key = getBucketKey(entry.timestamp);
    if (!key) continue;
    const existing = bucketMap.get(key) || { total: 0, accepted: 0 };
    existing.total += 1;
    if (entry.selectedStrategy) existing.accepted += 1;
    bucketMap.set(key, existing);
  }

  const toTopList = (map: Map<string, number>) =>
    Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([strategy, count]) => ({ strategy, count }));

  return {
    total,
    accepted,
    acceptanceRate,
    funnel: {
      recommended: total,
      selected: accepted,
      acceptanceRate,
    },
    topRecommended: toTopList(recommendedMap),
    topSelected: toTopList(selectedMap),
    byScenario: Array.from(scenarioMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .map(([scenario, stats]) => ({
        scenario,
        count: stats.count,
        accepted: stats.accepted,
      })),
    byTimeBucket: Array.from(bucketMap.entries())
      .sort((a, b) => (a[0] > b[0] ? 1 : -1))
      .map(([key, stats]) => ({
        bucket: key,
        total: stats.total,
        accepted: stats.accepted,
        acceptanceRate: stats.total === 0 ? 0 : stats.accepted / stats.total,
      })),
  };
}

export function renderRecommendationFeedbackReport(report: {
  total: number;
  accepted: number;
  acceptanceRate: number;
  funnel: {
    recommended: number;
    selected: number;
    acceptanceRate: number;
  };
  topRecommended: Array<{ strategy: string; count: number }>;
  topSelected: Array<{ strategy: string; count: number }>;
  byScenario: Array<{ scenario: string; count: number; accepted: number }>;
  byTimeBucket: Array<{
    bucket: string;
    total: number;
    accepted: number;
    acceptanceRate: number;
  }>;
}): string {
  const lines: string[] = [];
  lines.push("推荐反馈统计");
  lines.push(`总推荐次数: ${report.total}`);
  lines.push(`采纳次数: ${report.accepted}`);
  lines.push(`采纳率: ${(report.acceptanceRate * 100).toFixed(1)}%`);
  lines.push("");

  lines.push("转化漏斗:");
  lines.push(`  推荐: ${report.funnel.recommended}`);
  lines.push(`  选择: ${report.funnel.selected}`);
  lines.push(`  采纳率: ${(report.funnel.acceptanceRate * 100).toFixed(1)}%`);
  lines.push("");

  lines.push("Top 推荐策略:");
  for (const item of report.topRecommended) {
    lines.push(`  ${item.strategy}: ${item.count}`);
  }
  lines.push("");

  lines.push("Top 选择策略:");
  for (const item of report.topSelected) {
    lines.push(`  ${item.strategy}: ${item.count}`);
  }
  lines.push("");

  if (report.byScenario.length > 0) {
    lines.push("场景采纳率:");
    const headers = ["场景", "推荐次数", "采纳次数", "采纳率"];
    const rows = report.byScenario.map((item) => {
      const rate = item.count === 0 ? 0 : item.accepted / item.count;
      return [
        item.scenario,
        item.count.toString(),
        item.accepted.toString(),
        `${(rate * 100).toFixed(1)}%`,
      ];
    });
    lines.push(formatTable(headers, rows));
  }

  if (report.byTimeBucket.length > 0) {
    lines.push("");
    lines.push("时间分桶统计:");
    const headers = ["时间", "推荐次数", "采纳次数", "采纳率"];
    const rows = report.byTimeBucket.map((item) => [
      item.bucket,
      item.total.toString(),
      item.accepted.toString(),
      `${(item.acceptanceRate * 100).toFixed(1)}%`,
    ]);
    lines.push(formatTable(headers, rows));
  }

  return lines.join("\n");
}

function deriveQuotaStatusFromUsageData(data: UsageData[]): QuotaStatus[] {
  const result: QuotaStatus[] = [];
  const byProvider = new Map<string, UsageData[]>();
  const costByProvider = new Map<string, number>();

  for (const item of data) {
    const list = byProvider.get(item.provider) || [];
    list.push(item);
    byProvider.set(item.provider, list);
    if (typeof item.cost === "number") {
      costByProvider.set(
        item.provider,
        (costByProvider.get(item.provider) || 0) + item.cost,
      );
    }
  }

  const maxCostAcross = Math.max(0, ...Array.from(costByProvider.values()));

  for (const [provider, items] of byProvider.entries()) {
    const normalizedProvider = provider === "gemini" ? "google" : provider;
    const withMeta = items.find((i) => i.metadata);
    const metadata = withMeta?.metadata as
      | {
          usagePercentage?: number;
          quotaPercentage?: number;
          resetTime?: string;
        }
      | undefined;

    const usagePercentFromMeta =
      typeof metadata?.usagePercentage === "number"
        ? metadata.usagePercentage / 100
        : typeof metadata?.quotaPercentage === "number"
          ? 1 - metadata.quotaPercentage / 100
          : undefined;

    if (usagePercentFromMeta !== undefined) {
      const remainingPercent = Math.max(
        0,
        Math.min(1, 1 - usagePercentFromMeta),
      );
      result.push({
        provider: normalizedProvider,
        remaining: remainingPercent,
        total: 1,
        usagePercent: usagePercentFromMeta,
        resetDate: metadata?.resetTime
          ? new Date(metadata.resetTime)
          : undefined,
      });
      continue;
    }

    const totalCost = costByProvider.get(provider) || 0;
    if (totalCost <= 0 || maxCostAcross <= 0) continue;

    const usagePercentFallback = Math.min(0.9, totalCost / maxCostAcross);
    const remainingPercentFallback = Math.max(0.1, 1 - usagePercentFallback);
    result.push({
      provider: normalizedProvider,
      remaining: remainingPercentFallback,
      total: 1,
      usagePercent: usagePercentFallback,
      resetDate: undefined,
    });
  }

  return result;
}

async function fetchQuotaStatusFromUsageSync(): Promise<QuotaStatus[]> {
  const coordinator = new UsageSyncCoordinator();
  
  // 加载增强配置（从3个配置文件合并）
  const config = ConfigLoader.loadAll();

  // Anthropic: API优先 → 本地回退
  try {
    coordinator.register(new AnthropicSync());
  } catch {
    try {
      coordinator.register(new AnthropicLocalSync());
    } catch {}
  }

  // OpenAI: API优先 → 本地回退
  try {
    coordinator.register(new OpenAISync());
  } catch {
    try {
      coordinator.register(new OpenAILocalSync());
    } catch {}
  }

  // GitHub: 仅API
  try {
    coordinator.register(new GitHubSync());
  } catch {}

  // Gemini: API优先 → 本地回退
  try {
    coordinator.register(new GeminiSync());
  } catch {
    try {
      coordinator.register(new GeminiLocalSync());
    } catch {}
  }

  // ZhiPu: API优先 → 本地回退（处理404）
  try {
    coordinator.register(new ZhiPuSync());
  } catch {
    try {
      coordinator.register(new ZhiPuLocalSync());
    } catch {}
  }

  // DeepSeek: 仅本地
  try {
    coordinator.register(new DeepSeekSync());
  } catch {}

  // SiliconFlow: 仅本地
  try {
    coordinator.register(new SiliconFlowSync());
  } catch {}

  const results = await coordinator.syncAll();
  const data: UsageData[] = [];

  for (const result of results.results || []) {
    if (result.success && result.data) {
      data.push(...result.data);
    }
  }

  return deriveQuotaStatusFromUsageData(data);
}

// ==================== 动态策略生成 ====================

const SCENARIO_TEMPLATE_MAP: Record<ScenarioType, string[]> = {
  education: ["strategy-2-balanced", "strategy-4-creative"],
  health: ["strategy-2-balanced", "strategy-5-research"],
  finance: ["strategy-5-research", "strategy-1-performance"],
  coding: ["strategy-2-balanced", "strategy-1-performance"],
  research: ["strategy-5-research", "strategy-1-performance"],
  creative: ["strategy-4-creative", "strategy-2-balanced"],
  daily: ["strategy-2-balanced", "strategy-3-economical"],
  writing: ["strategy-4-creative", "strategy-2-balanced"],
  multimedia: ["strategy-4-creative", "strategy-2-balanced"],
  social: ["strategy-4-creative", "strategy-2-balanced"],
  tools: ["strategy-3-economical", "strategy-2-balanced"],
  entertainment: ["strategy-3-economical", "strategy-2-balanced"],
  documentation: ["strategy-3-economical", "strategy-2-balanced"],
};

const MODEL_FALLBACKS: Record<Priority, { models: string[] }> = {
  quality: {
    models: [
      "anthropic/claude-sonnet-4-5",
      "openai/gpt-5.2-codex",
      "zhipuai-coding-plan/glm-4.7",
    ],
  },
  cost: {
    models: [
      "zhipuai-coding-plan/glm-4.7",
      "google/gemini-3-flash",
      "anthropic/claude-haiku-4-5",
    ],
  },
  speed: {
    models: [
      "google/gemini-3-flash",
      "anthropic/claude-haiku-4-5",
      "openai/gpt-5.2-codex",
    ],
  },
  balanced: {
    models: [
      "openai/gpt-5.2-codex",
      "zhipuai-coding-plan/glm-4.7",
      "anthropic/claude-haiku-4-5",
      "google/gemini-3-flash",
    ],
  },
};

function getProviderFromModel(model: string): string {
  const lower = model.toLowerCase();
  if (lower.startsWith("anthropic/")) return "anthropic";
  if (lower.startsWith("openai/")) return "openai";
  if (lower.startsWith("google/")) return "google";
  if (lower.startsWith("zai-") || lower.includes("zhipu")) return "zhipu";
  if (lower.startsWith("github/")) return "github";
  return "unknown";
}

function isQuotaTight(provider: string, quotaStatus?: QuotaStatus[]): boolean {
  if (!quotaStatus) return false;
  const quota = quotaStatus.find((q) => q.provider === provider);
  if (!quota) return false;

  const usage =
    quota.usagePercent > 0
      ? quota.usagePercent
      : quota.total > 0
        ? 1 - Math.min(quota.remaining / quota.total, 1)
        : 0;
  return usage >= 0.8;
}

function selectFallbackModel(
  priority: Priority,
  quotaStatus?: QuotaStatus[],
): string | null {
  const candidates = MODEL_FALLBACKS[priority]?.models || [];
  for (const model of candidates) {
    const provider = getProviderFromModel(model);
    if (!isQuotaTight(provider, quotaStatus)) {
      return model;
    }
  }
  return candidates[0] || null;
}

function optimizeAgentModels(
  config: StrategyConfig,
  priority: Priority,
  quotaStatus?: QuotaStatus[],
): void {
  if (!config.agents) return;

  for (const agent of Object.values(config.agents)) {
    if (!agent?.model) continue;
    const provider = getProviderFromModel(agent.model);

    if (isQuotaTight(provider, quotaStatus)) {
      const replacement = selectFallbackModel(priority, quotaStatus);
      if (replacement) {
        agent.model = replacement;
      }
    }
  }
}

function tuneAgentParameters(
  config: StrategyConfig,
  scenarioType: ScenarioType,
): void {
  if (!config.agents) return;

  const tuning = {
    temperature: {
      coding: 0.2,
      research: 0.2,
      creative: 0.75,
      writing: 0.6,
      multimedia: 0.7,
      social: 0.7,
      documentation: 0.25,
      daily: 0.3,
      tools: 0.25,
      education: 0.4,
      health: 0.35,
      finance: 0.2,
      entertainment: 0.6,
    } as Record<ScenarioType, number>,
    maxTokens: {
      coding: 5000,
      research: 7000,
      creative: 5000,
      writing: 4500,
      multimedia: 4500,
      social: 4000,
      documentation: 3500,
      daily: 3500,
      tools: 3000,
      education: 4000,
      health: 4000,
      finance: 4500,
      entertainment: 3500,
    } as Record<ScenarioType, number>,
  };

  for (const agent of Object.values(config.agents)) {
    if (!agent) continue;
    if (typeof agent.temperature === "number") {
      agent.temperature = tuning.temperature[scenarioType];
    }
    if (typeof agent.maxTokens === "number") {
      agent.maxTokens = tuning.maxTokens[scenarioType];
    }
  }
}

function formatTimestamp(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes())
  );
}

export function cleanupDynamicStrategies(retentionDays: number = 7): number {
  if (!fileExists(DYNAMIC_STRATEGIES_DIR)) {
    return 0;
  }

  const now = Date.now();
  const maxAge = retentionDays * 24 * 60 * 60 * 1000;
  let removed = 0;

  for (const file of fs.readdirSync(DYNAMIC_STRATEGIES_DIR)) {
    if (!file.endsWith(".jsonc") || !file.startsWith("strategy-")) {
      continue;
    }

    const filePath = path.join(DYNAMIC_STRATEGIES_DIR, file);
    const stat = fs.statSync(filePath);
    if (now - stat.mtime.getTime() > maxAge) {
      fs.unlinkSync(filePath);
      removed++;
    }
  }

  return removed;
}

export function generateDynamicStrategy(
  options: DynamicStrategyOptions,
): DynamicStrategyResult | null {
  const parsed = parseRecommendationContext(options.description);
  const scenarioType = parsed.scenario?.type || ("daily" as ScenarioType);
  const priority = options.priority || parsed.scenario?.priority || "balanced";

  const templates = SCENARIO_TEMPLATE_MAP[scenarioType] || [
    "strategy-2-balanced",
  ];
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
  config.description = `动态生成(${scenarioType}/${priority}) ${
    config.description || ""
  }`.trim();
  config.metadata = config.metadata || {};
  config.metadata.updated = today;
  config.metadata.use_case = `${scenarioType}`;
  config.metadata.optimization = "dynamic-generated";

  if (!validateStrategy(config)) {
    error("动态策略生成失败: 验证未通过");
    return null;
  }

  const timestamp = formatTimestamp(new Date());
  const name = `strategy-generated-${scenarioType}-${timestamp}`;
  const filePath = path.join(DYNAMIC_STRATEGIES_DIR, `${name}.jsonc`);

  cleanupDynamicStrategies(options.retentionDays ?? 7);

  if (options.save !== false) {
    writeJSONC(filePath, config);
  }

  return {
    name,
    filePath,
    baseTemplate,
    config,
  };
}

export function saveDynamicStrategyAs(
  dynamicName: string,
  targetName: string,
): boolean {
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

// ==================== 备份管理 ====================

/**
 * 清理旧备份，保留最近 MAX_BACKUPS 个
 */
export function cleanOldBackups(): void {
  const backupDir = path.join(process.env.HOME || "", ".config", "opencode");

  if (!fileExists(backupDir)) {
    return;
  }

  try {
    const files = fs.readdirSync(backupDir);
    const backups = files
      .filter(
        (f) => f.startsWith("strategies-backup-") || f.includes(".backup."),
      )
      .map((f) => ({
        name: f,
        path: path.join(backupDir, f),
        time: fs.statSync(path.join(backupDir, f)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time);

    if (backups.length > MAX_BACKUPS) {
      const toDelete = backups.slice(MAX_BACKUPS);

      for (const backup of toDelete) {
        fs.unlinkSync(backup.path);
        info(`已删除旧备份: ${backup.name}`);
      }

      success(`已清理 ${toDelete.length} 个旧备份，保留最近 ${MAX_BACKUPS} 个`);
    }
  } catch (err) {
    error(`清理备份失败: ${err}`);
  }
}

/**
 * 创建策略备份
 */
export function createBackup(): string | null {
  const backupDir = path.join(
    process.env.HOME || "",
    ".config",
    "opencode",
    `strategies-backup-${Date.now()}`,
  );

  try {
    fs.mkdirSync(backupDir, { recursive: true });

    const files = fs.readdirSync(STRATEGIES_DIR);
    for (const file of files) {
      if (file.endsWith(".jsonc")) {
        fs.copyFileSync(
          path.join(STRATEGIES_DIR, file),
          path.join(backupDir, file),
        );
      }
    }

    info(`备份已创建: ${backupDir}`);
    return backupDir;
  } catch (err) {
    error(`创建备份失败: ${err}`);
    return null;
  }
}

// ==================== 主导出 ====================

/**
 * 安装策略模板到用户配置目录
 */
export function installTemplate(templateName: string): boolean {
  const templatePath = pathManager.getTemplateFilePath(templateName);
  const targetPath = pathManager.getStrategyFilePath(templateName);

  if (!fileExists(templatePath)) {
    error(`模板不存在: ${templateName}`);
    return false;
  }

  if (fileExists(targetPath)) {
    warning(`策略已存在: ${templateName}`);
    return false;
  }

  try {
    fs.copyFileSync(templatePath, targetPath);
    success(`已安装模板: ${templateName}`);
    return true;
  } catch (err) {
    error(`安装失败: ${err}`);
    return false;
  }
}

/**
 * 同步所有模板到用户配置目录
 */
export function syncAllTemplates(force: boolean = false): boolean {
  const templates = pathManager.listTemplates();

  if (templates.length === 0) {
    error("没有找到可用的模板");
    return false;
  }

  info(`找到 ${templates.length} 个模板`);
  let installedCount = 0;
  let skippedCount = 0;
  let overwrittenCount = 0;

  for (const template of templates) {
    const templatePath = pathManager.getTemplateFilePath(template);
    const targetPath = pathManager.getStrategyFilePath(template);

    if (fileExists(targetPath)) {
      if (force) {
        // 创建备份
        const backupPath = path.join(
          pathManager.getBackupDir(),
          `${template}-${Date.now()}.jsonc`,
        );
        fs.copyFileSync(targetPath, backupPath);
        fs.copyFileSync(templatePath, targetPath);
        warning(`已覆盖: ${template} (备份: ${path.basename(backupPath)})`);
        overwrittenCount++;
      } else {
        info(`跳过已存在: ${template}`);
        skippedCount++;
      }
    } else {
      fs.copyFileSync(templatePath, targetPath);
      success(`已安装: ${template}`);
      installedCount++;
    }
  }

  console.log();
  success(
    `同步完成: ${installedCount} 个新安装, ${overwrittenCount} 个覆盖, ${skippedCount} 个跳过`,
  );
  return true;
}

/**
 * 列出所有可用的模板
 */
export function listTemplates(): void {
  const templates = pathManager.listTemplates();

  if (templates.length === 0) {
    error("没有找到可用的模板");
    return;
  }

  info(`可用模板 (${templates.length} 个):`);
  console.log();

  for (const template of templates) {
    const isInstalled = pathManager.isStrategyInstalled(template);
    const status = isInstalled
      ? colorize("[已安装]", "green")
      : colorize("[未安装]", "yellow");
    console.log(`  ${status} ${template}`);
  }
}

// ==================== CLI 入口 ====================

function parseArgs(argv: string[]): {
  command: string | null;
  positionals: string[];
  flags: Record<string, string | boolean>;
} {
  const flags: Record<string, string | boolean> = {};
  const positionals: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const keyValue = arg.slice(2).split("=");
      const key = keyValue[0];
      const value = keyValue[1];

      if (value !== undefined) {
        flags[key] = value;
        continue;
      }

      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      positionals.push(arg);
    }
  }

  const command = positionals.shift() || null;
  return { command, positionals, flags };
}

function parsePriority(value?: string): Priority | undefined {
  if (!value) return undefined;
  const lower = value.toLowerCase();
  if (lower === "quality" || lower === "cost" || lower === "speed") {
    return lower as Priority;
  }
  if (lower === "balanced") return "balanced";
  return undefined;
}

function printCliHelp(): void {
  console.log("\nStrategyManager CLI");
  console.log("\n用法:");
  console.log("  bun run Tools/ManageStrategies.ts list [--include-dynamic]");
  console.log("  bun run Tools/ManageStrategies.ts switch <strategy-name>");
  console.log(
    "  bun run Tools/ManageStrategies.ts recommend <description> [--priority quality|cost|speed|balanced] [--include-dynamic] [--with-usage-sync] [--budget-monthly 100] [--budget-spent 20] [--budget-alert 0.8]",
  );
  console.log(
    "  bun run Tools/ManageStrategies.ts generate <description> [--priority ...] [--retention 7] [--no-save] [--with-usage-sync]",
  );
  console.log(
    "  bun run Tools/ManageStrategies.ts save-dynamic <dynamic-name> <target-name>",
  );
  console.log(
    "  bun run Tools/ManageStrategies.ts cleanup-dynamic [--retention 7]",
  );
  console.log(
    "  bun run Tools/ManageStrategies.ts feedback <scenario> <recommended> <selected> [--score 80]",
  );
  console.log(
    "  bun run Tools/ManageStrategies.ts feedback-report [--json] [--format text|json] [--output ./report.txt]",
  );
  console.log(
    "    可选: --bucket day|week|month",
  );
  console.log(
    "  bun run Tools/ManageStrategies.ts cost-report [--output ./report.txt]",
  );
  console.log("    成本分析报告");
  console.log(
    "  bun run Tools/ManageStrategies.ts sync-usage [--output ./usage.txt]",
  );
  console.log("    同步多平台使用数据");
  console.log("");
}

function parseBudget(
  flags: Record<string, string | boolean>,
): BudgetConfig | undefined {
  const monthly =
    typeof flags["budget-monthly"] === "string"
      ? Number(flags["budget-monthly"])
      : undefined;
  if (!monthly || Number.isNaN(monthly)) return undefined;

  const currentSpent =
    typeof flags["budget-spent"] === "string"
      ? Number(flags["budget-spent"])
      : 0;
  const alertThreshold =
    typeof flags["budget-alert"] === "string"
      ? Number(flags["budget-alert"])
      : 0.8;

  return {
    monthly,
    currentSpent: Number.isNaN(currentSpent) ? 0 : currentSpent,
    alertThreshold: Number.isNaN(alertThreshold) ? 0.8 : alertThreshold,
  };
}

if (import.meta.main) {
  (async () => {
    const { command, positionals, flags } = parseArgs(process.argv.slice(2));

    if (!command) {
      printCliHelp();
    } else if (command === "list") {
      const includeDynamic = Boolean(flags["include-dynamic"]);
      displayStrategies(includeDynamic);
    } else if (command === "switch") {
      const name = positionals[0];
      if (!name) {
        error("请提供策略名称");
      } else {
        switchStrategy(name);
      }
    } else if (command === "recommend") {
      const description = positionals.join(" ");
      if (!description) {
        error("请提供场景描述");
      } else {
        const priority = parsePriority(flags.priority as string | undefined);
        const includeDynamic = Boolean(flags["include-dynamic"]);
        const withUsageSync = Boolean(flags["with-usage-sync"]);
        const budget = parseBudget(flags);
        const quotaStatus = withUsageSync
          ? await fetchQuotaStatusFromUsageSync()
          : undefined;
        const recommendation = recommendStrategySmart({
          description,
          priority,
          includeDynamic,
          quotaStatus,
          budget,
        });

        if (!recommendation) {
          error("无法生成推荐");
        } else {
          info(`基于场景 "${description}" 的推荐:`);
          console.log();
          console.log(
            colorize(`推荐策略: ${recommendation.strategyName}`, "green"),
          );
          console.log(`推荐理由: ${recommendation.reason}`);
          console.log(`匹配度: ${recommendation.score}%`);
          recordRecommendationFeedback({
            timestamp: new Date().toISOString(),
            scenario: description,
            recommendedStrategy: recommendation.strategyName,
            score: recommendation.score,
            quotaSnapshot: quotaStatus,
          });
        }
      }
    } else if (command === "generate") {
      const description = positionals.join(" ");
      if (!description) {
        error("请提供场景描述");
      } else {
        const priority = parsePriority(flags.priority as string | undefined);
        const retention =
          typeof flags.retention === "string"
            ? Number(flags.retention)
            : undefined;
        const save = flags["no-save"] ? false : true;
        const withUsageSync = Boolean(flags["with-usage-sync"]);
        const quotaStatus = withUsageSync
          ? await fetchQuotaStatusFromUsageSync()
          : undefined;

        const result = generateDynamicStrategy({
          description,
          priority,
          retentionDays: retention,
          save,
          quotaStatus,
        });

        if (!result) return;

        success(`已生成动态策略: ${result.name}`);
        info(`基础模板: ${result.baseTemplate}`);
        info(`输出路径: ${result.filePath}`);
      }
    } else if (command === "save-dynamic") {
      const dynamicName = positionals[0];
      const targetName = positionals[1];
      if (!dynamicName || !targetName) {
        error("请提供动态策略名称和目标名称");
      } else {
        saveDynamicStrategyAs(dynamicName, targetName);
      }
    } else if (command === "cleanup-dynamic") {
      const retention =
        typeof flags.retention === "string" ? Number(flags.retention) : 7;
      const removed = cleanupDynamicStrategies(retention);
      success(`已清理动态策略: ${removed} 个`);
    } else if (command === "feedback") {
      const scenario = positionals[0];
      const recommended = positionals[1];
      const selected = positionals[2];
      if (!scenario || !recommended || !selected) {
        error("请提供场景、推荐策略和选择策略");
      } else {
        const score =
          typeof flags.score === "string" ? Number(flags.score) : undefined;
        recordRecommendationFeedback({
          timestamp: new Date().toISOString(),
          scenario,
          recommendedStrategy: recommended,
          selectedStrategy: selected,
          score,
        });
        success("已记录反馈");
      }
    } else if (command === "feedback-report") {
      const bucket =
        typeof flags.bucket === "string"
          ? (flags.bucket as FeedbackBucket)
          : undefined;
      const report = generateRecommendationFeedbackReport({ bucket });
      const format =
        typeof flags.format === "string"
          ? flags.format
          : flags.json
            ? "json"
            : "text";
      const output =
        typeof flags.output === "string" ? flags.output : undefined;
      const content =
        format === "json"
          ? JSON.stringify(report, null, 2)
          : renderRecommendationFeedbackReport(report);

      if (output) {
        fs.writeFileSync(output, content, "utf-8");
        success(`已写入反馈报告: ${output}`);
      } else {
        console.log(content);
      }
    } else if (command === "cost-report") {
      // 成本报告命令
      try {
        const { CostReport } = await import("./CostReport");
        const coordinator = new UsageSyncCoordinator();

        // 注册所有提供商
        try {
          coordinator.register(new AnthropicSync());
        } catch {}
        try {
          coordinator.register(new OpenAISync());
        } catch {}
        try {
          coordinator.register(new GitHubSync());
        } catch {}
        try {
          coordinator.register(new GeminiSync());
        } catch {}
        try {
          coordinator.register(new ZhiPuSync());
        } catch {}
        try {
          coordinator.register(new DeepSeekSync());
        } catch {}
        try {
          coordinator.register(new SiliconFlowSync());
        } catch {}

        const results = await coordinator.syncAll();
        const usageData: UsageData[] = [];

        for (const result of results.results || []) {
          if (result.success && result.data) {
            usageData.push(...result.data);
          }
        }

        if (usageData.length === 0) {
          warning("未获取到使用数据，请检查 API 密钥配置");
          return;
        }

        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const endDate = now;

        const report = new CostReport(usageData, { start: startDate, end: endDate });
        const content = report.generateTextReport();

        const output =
          typeof flags.output === "string" ? flags.output : undefined;

        if (output) {
          fs.writeFileSync(output, content, "utf-8");
          success(`已写入成本报告: ${output}`);
        } else {
          console.log(content);
        }
      } catch (err) {
        error(`成本报告生成失败: ${err}`);
      }
    } else if (command === "sync-usage") {
      // 使用同步命令
      try {
        const coordinator = new UsageSyncCoordinator();

        // 注册所有提供商（使用本地统计版本以避免 OAuth/CLI 问题）
        try {
          coordinator.register(new AnthropicLocalSync());
        } catch {}
        try {
          coordinator.register(new OpenAILocalSync());
        } catch {}
        try {
          coordinator.register(new GitHubSync());
        } catch {}
        try {
          coordinator.register(new GeminiLocalSync());
        } catch {}
        try {
          coordinator.register(new ZhiPuSync());
        } catch {}
        try {
          coordinator.register(new DeepSeekSync());
        } catch {}
        try {
          coordinator.register(new SiliconFlowSync());
        } catch {}

        info("正在同步多平台使用数据...");
        const results = await coordinator.syncAll();

        console.log();
        info("同步结果:");
        console.log();

        const headers = ["提供商", "状态", "数据量", "说明"];
        const rows: string[][] = [];

        for (const result of results.results || []) {
          const status = result.success ? colorize("✓", "green") : colorize("✗", "red");
          const dataCount = result.data?.length || 0;
          const message = result.error || (result.success ? "成功" : "失败");

          rows.push([result.provider, status, dataCount.toString(), message]);
        }

        console.log(formatTable(headers, rows));
        console.log();

        const totalData = (results.results || []).reduce(
          (sum, r) => sum + (r.data?.length || 0),
          0,
        );
        success(`同步完成: 共获取 ${totalData} 条使用记录`);
      } catch (err) {
        error(`使用同步失败: ${err}`);
      }
    } else {
      printCliHelp();
    }
  })();
}

export const ManageStrategies = {
  // 路径管理
  pathManager,

  // 安装功能
  installTemplate,
  syncAllTemplates,
  listTemplates,

  // 读取功能
  getCurrentStrategy,
  readStrategy,

  // 切换功能
  switchStrategy,

  // 列表功能
  listStrategies,
  listStrategiesWithOptions,
  displayStrategies,

  // 修正功能
  fixStrategies,

  // 验证功能
  validateStrategy,
  validateStrategyFile,

  // 对比功能
  compareStrategies,
  displayStrategyDiff,

  // 历史记录
  getHistory,
  addHistoryEntry,
  displayHistory,
  rollbackToHistory,

  // 导出/导入
  exportStrategy,
  importStrategy,

  // 推荐
  recommendStrategy,
  recommendStrategySmart,
  displayRecommendation,
  buildRecommendationContext,
  loadRecommendationFeedback,
  recordRecommendationFeedback,
  generateRecommendationFeedbackReport,
  renderRecommendationFeedbackReport,

  // 动态策略
  generateDynamicStrategy,
  cleanupDynamicStrategies,
  saveDynamicStrategyAs,

  // 备份
  cleanOldBackups,
  createBackup,

  // 工具函数
  colorize,
  success,
  error,
  warning,
  info,
  formatTable,
};

// 默认导出
export default ManageStrategies;
