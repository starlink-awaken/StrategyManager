/**
 * StrategyOperations.ts
 * 策略文件高级操作（修正、对比、导出、导入）
 */

import * as fs from "fs";
import * as path from "path";
import { defaultPathManager } from "./PathManager";
import { fileExists, writeJSONC, readJSONC } from './FileSystemUtils';
import { colorize, success, error, info, warning, formatTable } from './FormatUtils';
import { addHistoryEntry } from './HistoryManager';
import { readStrategy, normalizeMetadata } from "./StrategyCore";
import { validateStrategy } from "./Validator";
import type { StrategyDiff, StrategyConfig } from "./interfaces";

const STRATEGIES_DIR = defaultPathManager.getStrategiesDir();

/**
 * 修正策略文件中的模型命名
 */
export function fixStrategies(): boolean {
  if (!fileExists(STRATEGIES_DIR)) {
    error(`策略目录不存在: ${STRATEGIES_DIR}`);
    return false;
  }

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
  } catch (err) {
    error(`创建备份失败: ${err}`);
    return false;
  }

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
      if (!file.endsWith(".jsonc")) continue;

      const filePath = path.join(STRATEGIES_DIR, file);
      let content = fs.readFileSync(filePath, "utf-8");
      let modified = false;

      for (const [from, to] of replacements) {
        if (content.includes(from)) {
          content = content.replace(new RegExp(from.replace(/\//g, "\\/"), "g"), to);
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

/**
 * 比较两个策略的差异
 */
export function compareStrategies(name1: string, name2: string): StrategyDiff | null {
  const config1 = readStrategy(name1);
  const config2 = readStrategy(name2);

  if (!config1 || !config2) return null;

  const diff: StrategyDiff = { added: [], removed: [], modified: [] };

  const meta1 = config1.metadata || {};
  const meta2 = config2.metadata || {};

  if (meta1.version !== meta2.version) diff.modified.push(`version (${meta1.version || "无"} → ${meta2.version || "无"})`);
  if (meta1.cost_level !== meta2.cost_level) diff.modified.push(`cost_level (${meta1.cost_level || "无"} → ${meta2.cost_level || "无"})`);
  if (meta1.use_case !== meta2.use_case) diff.modified.push(`use_case (${meta1.use_case || "无"} → ${meta2.use_case || "无"})`);
  if (config1.description !== config2.description) diff.modified.push(`description (${config1.description?.substring(0, 30)}... → ${config2.description?.substring(0, 30)}...)`);

  const agents1 = config1.agents || {};
  const agents2 = config2.agents || {};
  const allAgents = Array.from(new Set([...Object.keys(agents1), ...Object.keys(agents2)]));

  for (const agent of allAgents) {
    if (!agents1[agent]) diff.added.push(`agent: ${agent}`);
    else if (!agents2[agent]) diff.removed.push(`agent: ${agent}`);
    else if (agents1[agent].model !== agents2[agent].model) diff.modified.push(`agent: ${agent} (${agents1[agent].model} → ${agents2[agent].model})`);
  }

  const cats1 = config1.categories || {};
  const cats2 = config2.categories || {};
  const allCats = Array.from(new Set([...Object.keys(cats1), ...Object.keys(cats2)]));

  for (const cat of allCats) {
    if (!cats1[cat]) diff.added.push(`category: ${cat}`);
    else if (!cats2[cat]) diff.removed.push(`category: ${cat}`);
    else if (cats1[cat].model !== cats2[cat].model) diff.modified.push(`category: ${cat} (${cats1[cat].model} → ${cats2[cat].model})`);
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
    for (const item of diff.added) console.log(`  + ${item}`);
    console.log();
  }

  if (diff.removed.length > 0) {
    console.log(colorize("移除:", "red"));
    for (const item of diff.removed) console.log(`  - ${item}`);
    console.log();
  }

  if (diff.modified.length > 0) {
    console.log(colorize("修改:", "yellow"));
    for (const item of diff.modified) console.log(`  ~ ${item}`);
    console.log();
  }

  if (diff.added.length === 0 && diff.removed.length === 0 && diff.modified.length === 0) {
    success("策略配置完全相同");
  }
}

/**
 * 导出策略
 */
export function exportStrategy(strategyName: string, outputPath: string): boolean {
  const config = readStrategy(strategyName);
  if (!config) return false;

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
 * 导入策略
 */
export function importStrategy(strategyName: string, inputPath: string): boolean {
  if (!fileExists(inputPath)) {
    error(`文件不存在: ${inputPath}`);
    return false;
  }

  try {
    let config = readJSONC(inputPath) as StrategyConfig;
    config = normalizeMetadata(config, strategyName);

    if (!validateStrategy(config)) return false;

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
