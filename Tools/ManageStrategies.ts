/**
 * ManageStrategies.ts
 * 策略管理系统核心工具
 *
 * 提供策略的读取、切换、列表、修正、验证、对比、历史记录、导出/导入和智能推荐功能
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// ==================== 类型定义 ====================

/**
 * 策略配置接口
 */
export interface StrategyConfig {
  $schema?: string;
  description: string;
  lsp?: Record<string, any>;
  agents?: Record<string, { model: string; variant?: string }>;
  categories?: Record<string, { model: string; variant?: string }>;
  metadata?: {
    version?: string;
    updated?: string;
    cost_level?: 'low' | 'medium' | 'high';
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
}

/**
 * 历史记录项
 */
export interface HistoryEntry {
  timestamp: string;
  strategyName: string;
  strategyPath: string;
  action: 'switch' | 'rollback' | 'import';
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

// ==================== 常量定义 ====================

const CONFIG_DIR = path.join(process.env.HOME || '', '.config', 'opencode');
const STRATEGIES_DIR = path.join(CONFIG_DIR, 'strategies');
const CONFIG_FILE = path.join(CONFIG_DIR, 'oh-my-opencode.json');
const HISTORY_FILE = path.join(CONFIG_DIR, 'strategy-history.json');
const MAX_BACKUPS = 5;

// ==================== 彩色输出 ====================

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bright: '\x1b[1m',
};

/**
 * 彩色输出函数
 */
export function colorize(text: string, color: keyof typeof COLORS): string {
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

export function success(text: string): void {
  console.log(colorize(`✓ ${text}`, 'green'));
}

export function error(text: string): void {
  console.error(colorize(`✗ ${text}`, 'red'));
}

export function warning(text: string): void {
  console.log(colorize(`⚠ ${text}`, 'yellow'));
}

export function info(text: string): void {
  console.log(colorize(`ℹ ${text}`, 'blue'));
}

// ==================== 格式化表格 ====================

/**
 * 格式化表格输出
 */
export function formatTable(headers: string[], rows: string[][]): string {
  const maxWidths = headers.map((header, i) => {
    const columnWidths = rows.map(row => (row[i] || '').length);
    return Math.max(header.length, ...columnWidths);
  });

  const separator = maxWidths.map(width => '-'.repeat(width + 2)).join('+');

  let result = separator + '\n';
  result += '| ' + headers.map((header, i) =>
    header.padEnd(maxWidths[i])
  ).join(' | ') + ' |\n';
  result += separator + '\n';

  for (const row of rows) {
    result += '| ' + row.map((cell, i) =>
      (cell || '').padEnd(maxWidths[i])
    ).join(' | ') + ' |\n';
  }

  result += separator;
  return result;
}

// ==================== 文件系统操作 ====================

export function readJSONC(filePath: string): any {
  const content = fs.readFileSync(filePath, 'utf-8');

  const hasComments = /\/\/.*$|\/\*[\s\S]*?\*\//.test(content);

  if (!hasComments) {
    return JSON.parse(content);
  }

  const jsonContent = content
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');

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
  fs.writeFileSync(filePath, jsonContent, 'utf-8');
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

    const name = path.basename(target, '.jsonc');
    try {
      const config = readJSONC(target);
      return {
        name,
        filePath: target,
        description: config.description || '无描述',
        costLevel: config.metadata?.cost_level || 'unknown',
        version: config.metadata?.version,
        isCurrent: true,
        useCase: config.metadata?.use_case,
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

  if (!fileExists(strategyFile)) {
    error(`策略文件不存在: ${strategyFile}`);
    return null;
  }

  try {
    return readJSONC(strategyFile);
  } catch (err) {
    error(`读取策略失败: ${strategyFile}`);
    return null;
  }
}

// ==================== 策略切换功能 ====================

/**
 * 切换策略
 */
export function switchStrategy(strategyName: string): boolean {
  const strategyFile = path.join(STRATEGIES_DIR, `${strategyName}.jsonc`);

  if (!fileExists(strategyFile)) {
    error(`策略文件不存在: ${strategyFile}`);
    return false;
  }

  // 验证策略有效性
  const config = readStrategy(strategyName);
  if (!config) {
    return false;
  }

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
      action: 'switch',
      backupPath: fileExists(CONFIG_FILE) && !isSymlink(CONFIG_FILE) ?
        `${CONFIG_FILE}.backup.${Date.now()}` : undefined,
    });
  }

  // 创建软链接
  try {
    execSync(`ln -sf "${strategyFile}" "${CONFIG_FILE}"`, { stdio: 'inherit' });

    success(`已切换到策略: ${strategyName}`);
    info(`软链目标: ${strategyFile}`);
    info(`描述: ${config.description}`);

    // 添加新历史记录
    addHistoryEntry({
      timestamp: new Date().toISOString(),
      strategyName,
      strategyPath: strategyFile,
      action: 'switch',
    });

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
  if (!fileExists(STRATEGIES_DIR)) {
    error(`策略目录不存在: ${STRATEGIES_DIR}`);
    return [];
  }

  const files = fs.readdirSync(STRATEGIES_DIR);
  const current = getCurrentStrategy();

  const strategies: StrategyMetadata[] = [];

  for (const file of files) {
    if (!file.startsWith('strategy-') || !file.endsWith('.jsonc') || file.includes('.backup')) {
      continue;
    }

    const filePath = path.join(STRATEGIES_DIR, file);
    try {
      const config = readJSONC(filePath);
      const name = path.basename(file, '.jsonc');

      strategies.push({
        name,
        filePath,
        description: config.description || '无描述',
        costLevel: config.metadata?.cost_level || 'unknown',
        version: config.metadata?.version,
        isCurrent: current?.name === name,
        useCase: config.metadata?.use_case,
      });
    } catch (err) {
      warning(`跳过无效策略文件: ${file}`);
    }
  }

  return strategies.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * 显示策略列表
 */
export function displayStrategies(): void {
  const strategies = listStrategies();

  if (strategies.length === 0) {
    error('没有找到可用的策略');
    return;
  }

  info('可用策略:');
  console.log();

  const headers = ['名称', '成本级别', '描述', '状态'];
  const rows: string[][] = [];

  for (const strategy of strategies) {
    rows.push([
      strategy.name,
      strategy.costLevel,
      strategy.description.substring(0, 30) + (strategy.description.length > 30 ? '...' : ''),
      strategy.isCurrent ? colorize('[当前]', 'green') : '',
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
    process.env.HOME || '',
    '.config',
    'opencode',
    `strategies-backup-${Date.now()}`
  );

  try {
    fs.mkdirSync(backupDir, { recursive: true });

    const files = fs.readdirSync(STRATEGIES_DIR);
    for (const file of files) {
      if (file.endsWith('.jsonc')) {
        fs.copyFileSync(
          path.join(STRATEGIES_DIR, file),
          path.join(backupDir, file)
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
    ['google/gemini-3-pro', 'google/antigravity-gemini-3-pro'],
    ['google/gemini-3-flash', 'google/antigravity-gemini-3-flash'],
    ['google/gemini-2.0-', 'google/antigravity-gemini-2.0-'],
    ['google/gemini-2.5-', 'google/antigravity-gemini-2.5-'],
  ];

  let fixedCount = 0;

  try {
    const files = fs.readdirSync(STRATEGIES_DIR);
    for (const file of files) {
      if (!file.endsWith('.jsonc')) {
        continue;
      }

      const filePath = path.join(STRATEGIES_DIR, file);
      let content = fs.readFileSync(filePath, 'utf-8');
      let modified = false;

      for (const [from, to] of replacements) {
        if (content.includes(from)) {
          content = content.replace(new RegExp(from.replace(/\//g, '\\/'), 'g'), to);
          modified = true;
        }
      }

      if (modified) {
        fs.writeFileSync(filePath, content, 'utf-8');
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

  // 检查必需字段
  if (!config.description) {
    errors.push('缺少 description 字段');
  }

  // 验证 agents 配置
  if (config.agents) {
    for (const [agentName, agentConfig] of Object.entries(config.agents)) {
      if (!agentConfig.model) {
        errors.push(`agent ${agentName} 缺少 model 字段`);
      }
    }
  }

  // 验证 categories 配置
  if (config.categories) {
    for (const [categoryName, categoryConfig] of Object.entries(config.categories)) {
      if (!categoryConfig.model) {
        errors.push(`category ${categoryName} 缺少 model 字段`);
      }
    }
  }

  if (errors.length > 0) {
    error('策略验证失败:');
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
export function compareStrategies(name1: string, name2: string): StrategyDiff | null {
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

  // 对比 agents
  const agents1 = config1.agents || {};
  const agents2 = config2.agents || {};

  const allAgents = Array.from(new Set([
    ...Object.keys(agents1),
    ...Object.keys(agents2),
  ]));

  for (const agent of allAgents) {
    if (!agents1[agent]) {
      diff.added.push(`agent: ${agent}`);
    } else if (!agents2[agent]) {
      diff.removed.push(`agent: ${agent}`);
    } else if (agents1[agent].model !== agents2[agent].model) {
      diff.modified.push(
        `agent: ${agent} (${agents1[agent].model} → ${agents2[agent].model})`
      );
    }
  }

  // 对比 categories
  const cats1 = config1.categories || {};
  const cats2 = config2.categories || {};

  const allCats = Array.from(new Set([
    ...Object.keys(cats1),
    ...Object.keys(cats2),
  ]));

  for (const cat of allCats) {
    if (!cats1[cat]) {
      diff.added.push(`category: ${cat}`);
    } else if (!cats2[cat]) {
      diff.removed.push(`category: ${cat}`);
    } else if (cats1[cat].model !== cats2[cat].model) {
      diff.modified.push(
        `category: ${cat} (${cats1[cat].model} → ${cats2[cat].model})`
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
    error('无法比较策略');
    return;
  }

  info(`对比: ${name1} → ${name2}`);
  console.log();

  if (diff.added.length > 0) {
    console.log(colorize('新增:', 'green'));
    for (const item of diff.added) {
      console.log(`  + ${item}`);
    }
    console.log();
  }

  if (diff.removed.length > 0) {
    console.log(colorize('移除:', 'red'));
    for (const item of diff.removed) {
      console.log(`  - ${item}`);
    }
    console.log();
  }

  if (diff.modified.length > 0) {
    console.log(colorize('修改:', 'yellow'));
    for (const item of diff.modified) {
      console.log(`  ~ ${item}`);
    }
    console.log();
  }

  if (diff.added.length === 0 && diff.removed.length === 0 && diff.modified.length === 0) {
    success('策略配置完全相同');
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
    const content = fs.readFileSync(HISTORY_FILE, 'utf-8');
    const data = JSON.parse(content);

    if (Array.isArray(data)) {
      return data;
    }

    if (data && typeof data === 'object' && Array.isArray(data.history)) {
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
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(trimmedHistory, null, 2), 'utf-8');
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
    info('没有历史记录');
    return;
  }

  info('策略切换历史:');
  console.log();

  const headers = ['时间', '策略', '操作', '备份'];
  const rows: string[][] = [];

  for (const entry of displayHistory) {
    const date = new Date(entry.timestamp).toLocaleString('zh-CN');
    rows.push([
      date,
      entry.strategyName,
      entry.action,
      entry.backupPath ? path.basename(entry.backupPath) : '-',
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

  if (entry.action === 'switch' && entry.backupPath && fileExists(entry.backupPath)) {
    // 从备份恢复
    try {
      fs.copyFileSync(entry.backupPath, CONFIG_FILE);
      success(`已从备份恢复: ${path.basename(entry.backupPath)}`);

      addHistoryEntry({
        timestamp: new Date().toISOString(),
        strategyName: entry.strategyName,
        strategyPath: entry.strategyPath,
        action: 'rollback',
      });

      return true;
    } catch (err) {
      error(`恢复备份失败: ${err}`);
      return false;
    }
  } else if (fileExists(entry.strategyPath)) {
    // 直接切换到历史策略
    return switchStrategy(path.basename(entry.strategyPath, '.jsonc'));
  } else {
    error(`无法回滚: 策略文件或备份不存在`);
    return false;
  }
}

// ==================== 导出/导入功能 ====================

/**
 * 导出策略为 JSON 文件
 */
export function exportStrategy(strategyName: string, outputPath: string): boolean {
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
export function importStrategy(strategyName: string, inputPath: string): boolean {
  if (!fileExists(inputPath)) {
    error(`文件不存在: ${inputPath}`);
    return false;
  }

  try {
    const config = readJSONC(inputPath);

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
      action: 'import',
    });

    return true;
  } catch (err) {
    error(`导入失败: ${err}`);
    return false;
  }
}

// ==================== 智能推荐功能 ====================

/**
 * 基于场景推荐策略
 */
export function recommendStrategy(scenario: string): Recommendation | null {
  const strategies = listStrategies();
  if (strategies.length === 0) {
    return null;
  }

  const scenarioLower = scenario.toLowerCase();
  let bestStrategy: StrategyMetadata | null = null;
  let bestScore = 0;
  let bestReason = '';

  // 推荐规则
  for (const strategy of strategies) {
    let score = 0;
    let reason = '';

    // 基于 use_case 和 cost_level 的推荐
    if (scenarioLower.includes('performance') || scenarioLower.includes('速度') ||
        scenarioLower.includes('快速') || scenarioLower.includes('紧急')) {
      if (strategy.costLevel === 'high') {
        score = 90;
        reason = '高性能模式适合快速响应和紧急任务';
      }
    }

    if (scenarioLower.includes('economical') || scenarioLower.includes('节省') ||
        scenarioLower.includes('便宜') || scenarioLower.includes('预算')) {
      if (strategy.costLevel === 'low') {
        score = 95;
        reason = '经济模式最大程度降低成本';
      }
    }

    if (scenarioLower.includes('balanced') || scenarioLower.includes('均衡') ||
        scenarioLower.includes('日常') || scenarioLower.includes('开发')) {
      if (strategy.costLevel === 'medium') {
        score = 85;
        reason = '均衡模式适合日常开发工作';
      }
    }

    if (scenarioLower.includes('overnight') || scenarioLower.includes('夜间') ||
        scenarioLower.includes('晚上')) {
      if (strategy.name.includes('overnight')) {
        score = 100;
        reason = '夜间模式优化夜间工作的成本和性能';
      }
    }

    if (scenarioLower.includes('emergency') || scenarioLower.includes('紧急') ||
        scenarioLower.includes('快速')) {
      if (strategy.name.includes('emergency')) {
        score = 95;
        reason = '紧急模式提供最快的响应速度';
      }
    }

    if (strategy.useCase && scenarioLower.includes(strategy.useCase.toLowerCase())) {
      score = Math.max(score, 80);
      reason = `使用场景匹配: ${strategy.useCase}`;
    }

    if (score > bestScore) {
      bestScore = score;
      bestStrategy = strategy;
      bestReason = reason;
    }
  }

  if (bestStrategy && bestScore > 50) {
    return {
      strategyName: bestStrategy.name,
      reason: bestReason,
      score: bestScore,
    };
  }

  // 如果没有明确匹配，推荐均衡策略
  const balanced = strategies.find(s => s.costLevel === 'medium' || s.name.includes('balanced'));
  if (balanced) {
    return {
      strategyName: balanced.name,
      reason: '均衡模式适合大多数使用场景',
      score: 70,
    };
  }

  return null;
}

/**
 * 显示推荐结果
 */
export function displayRecommendation(scenario: string): void {
  const recommendation = recommendStrategy(scenario);

  if (!recommendation) {
    error('无法生成推荐');
    return;
  }

  info(`基于场景 "${scenario}" 的推荐:`);
  console.log();
  console.log(colorize(`推荐策略: ${recommendation.strategyName}`, 'green'));
  console.log(`推荐理由: ${recommendation.reason}`);
  console.log(`匹配度: ${recommendation.score}%`);
}

// ==================== 备份管理 ====================

/**
 * 清理旧备份，保留最近 MAX_BACKUPS 个
 */
export function cleanOldBackups(): void {
  const backupDir = path.join(
    process.env.HOME || '',
    '.config',
    'opencode'
  );

  if (!fileExists(backupDir)) {
    return;
  }

  try {
    const files = fs.readdirSync(backupDir);
    const backups = files
      .filter(f => f.startsWith('strategies-backup-') || f.includes('.backup.'))
      .map(f => ({
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
    process.env.HOME || '',
    '.config',
    'opencode',
    `strategies-backup-${Date.now()}`
  );

  try {
    fs.mkdirSync(backupDir, { recursive: true });

    const files = fs.readdirSync(STRATEGIES_DIR);
    for (const file of files) {
      if (file.endsWith('.jsonc')) {
        fs.copyFileSync(
          path.join(STRATEGIES_DIR, file),
          path.join(backupDir, file)
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

export const ManageStrategies = {
  // 读取功能
  getCurrentStrategy,
  readStrategy,

  // 切换功能
  switchStrategy,

  // 列表功能
  listStrategies,
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
  displayRecommendation,

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
