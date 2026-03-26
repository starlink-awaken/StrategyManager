/**
 * ManageStrategies.ts
 * 策略管理 CLI 工具入口
 * 
 * 职责：
 * 1. CLI 命令解析与路由
 * 2. 聚合各模块功能对外提供 API
 * 3. 处理高层治理逻辑 (Governance)
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { defaultPathManager } from "./PathManager";
import { readJSONC, writeJSONC, fileExists } from './FileSystemUtils';
import { addHistoryEntry, getHistory, displayHistory, rollbackToHistory } from './HistoryManager';
import { colorize, success, error, info, warning, formatTable } from './FormatUtils';
import { validateStrategy } from "./Validator";
import { defaultHealthManager } from './HealthManager';
import { defaultActiveValidator } from './ActiveValidator';

// 导入拆分后的模块
import {
  extractModels,
  normalizeMetadata,
  validateMetadata,
  isSymlink,
  readSymlink,
  getCurrentStrategy,
  readStrategy,
  listStrategiesWithOptions,
  switchStrategy,
  applyToolConstraints,
} from "./StrategyCore";

import {
  fixStrategies,
  compareStrategies,
  displayStrategyDiff,
  exportStrategy,
  importStrategy,
} from "./StrategyOperations";

import {
  buildRecommendationContext,
  recommendStrategySmart,
  displayRecommendation,
  loadRecommendationFeedback,
  recordRecommendationFeedback,
  generateRecommendationFeedbackReport,
  renderRecommendationFeedbackReport,
} from "./RecommendationEngine";

import {
  generateDynamicStrategy,
  cleanupDynamicStrategies,
  saveDynamicStrategyAs,
} from "./DynamicStrategy";

import {
  UsageSyncCoordinator,
  AnthropicLocalSync,
  OpenAILocalSync,
  GitHubSync,
  GeminiLocalSync,
  ZhiPuLocalSync,
  DeepSeekSync,
  SiliconFlowSync,
} from "./UsageSync";

import type {
  StrategyConfig,
  StrategyMetadata,
  RecommendationInput,
  BudgetConfig,
} from "./interfaces";

const pathManager = defaultPathManager;
const STRATEGIES_DIR = pathManager.getStrategiesDir();
const CONFIG_FILE = pathManager.getConfigFileWithComments();
const MAX_BACKUPS = 5;

// ==================== 备份管理 (保持在主入口) ====================

/**
 * 清理旧备份
 */
export function cleanOldBackups(): void {
  const backupDir = path.join(process.env.HOME || "", ".config", "opencode");
  if (!fileExists(backupDir)) return;

  try {
    const files = fs.readdirSync(backupDir);
    const backups = files
      .filter((f) => f.startsWith("strategies-backup-") || f.includes(".backup."))
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
        fs.copyFileSync(path.join(STRATEGIES_DIR, file), path.join(backupDir, file));
      }
    }
    info(`备份已创建: ${backupDir}`);
    return backupDir;
  } catch (err) {
    error(`创建备份失败: ${err}`);
    return null;
  }
}

// ==================== 模板管理 (保持在主入口) ====================

/**
 * 安装策略模板
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
 * 同步所有模板
 */
export function syncAllTemplates(force: boolean = false): boolean {
  const templates = pathManager.listTemplates();
  if (templates.length === 0) {
    error("没有找到可用的模板");
    return false;
  }

  let installed = 0, skipped = 0, overwritten = 0;
  for (const template of templates) {
    const templatePath = pathManager.getTemplateFilePath(template);
    const targetPath = pathManager.getStrategyFilePath(template);

    if (fileExists(targetPath)) {
      if (force) {
        const backupPath = path.join(pathManager.getBackupDir(), `${template}-${Date.now()}.jsonc`);
        fs.copyFileSync(targetPath, backupPath);
        fs.copyFileSync(templatePath, targetPath);
        warning(`已覆盖: ${template} (备份: ${path.basename(backupPath)})`);
        overwritten++;
      } else {
        skipped++;
      }
    } else {
      fs.copyFileSync(templatePath, targetPath);
      success(`已安装: ${template}`);
      installed++;
    }
  }
  success(`同步完成: ${installed} 个新安装, ${overwritten} 个覆盖, ${skipped} 个跳过`);
  return true;
}

/**
 * 列出可用模板
 */
export function listTemplates(): void {
  const templates = pathManager.listTemplates();
  info(`可用模板 (${templates.length} 个):`);
  for (const t of templates) {
    const status = pathManager.isStrategyInstalled(t) ? colorize("[已安装]", "green") : colorize("[未安装]", "yellow");
    console.log(`  ${status} ${t}`);
  }
}

/**
 * 列出并显示策略
 */
export async function displayStrategies(includeDynamic: boolean = false): Promise<void> {
  const strategies = listStrategiesWithOptions({ includeDynamic });
  const current = getCurrentStrategy();

  info(`可用策略 (${strategies.length} 个):`);
  const headers = ["名称", "描述", "成本", "来源", "状态"];
  const rows = strategies.map(s => [
    s.name,
    s.description.substring(0, 30) + (s.description.length > 30 ? "..." : ""),
    s.costLevel,
    s.source === "dynamic" ? colorize("动态", "cyan") : "安装",
    s.isCurrent ? colorize("● 激活", "green") : "",
  ]);
  console.log(formatTable(headers, rows));
}

// ==================== CLI 入口逻辑 ====================

function parseArgs(argv: string[]): { command: string | null; positionals: string[]; flags: Record<string, string | boolean> } {
  const flags: Record<string, string | boolean> = {};
  const positionals: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const [key, value] = arg.slice(2).split("=");
      if (value !== undefined) { flags[key] = value; }
      else if (argv[i + 1] && !argv[i + 1].startsWith("--")) { flags[key] = argv[++i]; }
      else { flags[key] = true; }
    } else { positionals.push(arg); }
  }
  const command = positionals.shift() || null;
  return { command, positionals, flags };
}

function parsePriority(value?: string): any {
  if (!value) return undefined;
  const lower = value.toLowerCase();
  if (["quality", "cost", "speed", "balanced"].includes(lower)) return lower;
  return undefined;
}

function printCliHelp(): void {
  console.log(colorize("\nStrategyManager CLI", "cyan"));
  console.log("\n用法:");
  console.log("  list [--include-dynamic]    列出所有可用策略");
  console.log("  current                     显示当前激活的策略");
  console.log("  switch <name>               切换到指定策略");
  console.log("  validate <name>             验证指定策略的合法性");
  console.log("  compare <n1> <n2>           比较两个策略的差异");
  console.log("  recommend <desc>            基于环境智能推荐策略");
  console.log("  sync-usage                  同步多平台使用数据");
  console.log("  check-health                执行主动健康检查");
  console.log("  disable/enable <target>     手动熔断/恢复模型厂商");
  console.log("  generate <desc>             动态生成策略");
  console.log("  govern                      执行自主治理扫描");
}

if (import.meta.main) {
  (async () => {
    const { command, positionals, flags } = parseArgs(process.argv.slice(2));
    if (!command) return printCliHelp();

    try {
      switch (command) {
        case "list": await displayStrategies(!!flags["include-dynamic"]); break;
        case "current": 
          const cur = getCurrentStrategy();
          console.log(`当前策略: ${colorize(cur ? cur.name : "none", "green")}`);
          break;
        case "switch": 
          if (!positionals[0]) error("请提供策略名称");
          else await switchStrategy(positionals[0]);
          break;
        case "validate":
          if (!positionals[0]) error("请提供策略名称");
          else {
            const config = readStrategy(positionals[0]);
            const res = validateStrategy(config as any);
            console.log(res ? success("验证通过") : error("验证失败"));
          }
          break;
        case "compare":
          if (!positionals[0] || !positionals[1]) error("请提供两个策略名称");
          else displayStrategyDiff(positionals[0], positionals[1]);
          break;
        case "recommend":
          if (positionals.length === 0) error("请提供场景描述");
          else await recommendStrategySmart({
            description: positionals.join(" "),
            priority: parsePriority(flags.priority as string),
            includeDynamic: !!flags["include-dynamic"]
          });
          break;
        case "sync-usage":
          const coordinator = new UsageSyncCoordinator();
          const syncs = [new AnthropicLocalSync(), new OpenAILocalSync(), new GitHubSync(), new GeminiLocalSync(), new ZhiPuLocalSync(), new DeepSeekSync(), new SiliconFlowSync()];
          for (const s of syncs) try { coordinator.register(s); } catch {}
          info("同步中...");
          const results = await coordinator.syncAll();
          const total = (results.results || []).reduce((sum, r) => sum + (r.data?.length || 0), 0);
          success(`同步完成: ${total} 条记录`);
          break;
        case "check-health": await defaultActiveValidator.checkAll(); break;
        case "disable":
          if (!positionals[0]) error("请提供目标");
          else await defaultHealthManager.disable(positionals[0], positionals[0].includes('/') ? 'model' : 'provider', positionals[1] || "Manual disable");
          break;
        case "enable":
          if (!positionals[0]) error("请提供目标");
          else await defaultHealthManager.enable(positionals[0], positionals[0].includes('/') ? 'model' : 'provider');
          break;
        case "generate":
          if (positionals.length === 0) error("请提供场景描述");
          else {
            const result = generateDynamicStrategy({
              description: positionals.join(" "),
              priority: parsePriority(flags.priority as string),
              retentionDays: flags["retention-days"] ? parseInt(flags["retention-days"] as string) : undefined,
              save: flags.save !== false
            });
            if (result) {
              success(`已生成动态策略: ${result.name}`);
              info(`基于模板: ${result.baseTemplate}`);
              info(`描述: ${result.config.description}`);
              info(`文件路径: ${result.filePath}`);
            } else {
              error("生成失败");
            }
          }
          break;
        case "govern":
          await handleGovernance();
          break;
        default: printCliHelp();
      }
    } catch (err) {
      error(`执行失败: ${err}`);
    }
  })();
}

/**
 * 自主治理逻辑
 */
export async function handleGovernance(): Promise<void> {
  info("🔍 正在启动自主治理引擎...");
  const current = getCurrentStrategy();
  if (!current) return error("未激活策略");

  const config = readStrategy(current.name);
  if (!config) return error("读取配置失败");

  const models = extractModels(config);
  const details: string[][] = [];
  let totalHealth = 0;

  for (const m of models) {
    const score = await defaultHealthManager.getHealthScore(m);
    totalHealth += score;
    details.push([m, score === 1 ? colorize("Healthy", "green") : (score === 0.5 ? colorize("Degraded", "yellow") : colorize("Disabled", "red"))]);
  }

  const avg = models.length > 0 ? totalHealth / models.length : 1;
  info(`当前健康评估: ${current.name}`);
  console.log(formatTable(["Model", "Status"], details));

  if (avg < 0.7) {
    warning(`健康度过低 (${(avg * 100).toFixed(0)}%)，尝试重平衡...`);
    const rec = await recommendStrategySmart({ description: "治理重平衡", priority: "balanced", includeDynamic: true });
    if (rec && rec.strategyName !== current.name) {
      success(`切换到更好方案: ${rec.strategyName}`);
      await switchStrategy(rec.strategyName);
    }
  } else {
    success("策略健康状态良好");
  }
}

/**
 * 兼容性导出对象
 */
export const ManageStrategies = {
  pathManager,
  installTemplate,
  syncAllTemplates,
  listTemplates,
  getCurrentStrategy,
  readStrategy,
  switchStrategy,
  listStrategiesWithOptions,
  displayStrategies,
  fixStrategies,
  validateStrategy,
  compareStrategies,
  displayStrategyDiff,
  getHistory,
  addHistoryEntry,
  displayHistory,
  rollbackToHistory,
  exportStrategy,
  importStrategy,
  recommendStrategySmart,
  displayRecommendation,
  loadRecommendationFeedback,
  recordRecommendationFeedback,
  generateRecommendationFeedbackReport,
  renderRecommendationFeedbackReport,
  generateDynamicStrategy,
  cleanupDynamicStrategies,
  saveDynamicStrategyAs,
  cleanOldBackups,
  createBackup,
  colorize,
  success,
  error,
  warning,
  info,
  formatTable,
  handleGovernance,
};

export default ManageStrategies;
