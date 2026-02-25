/**
 * HistoryManager.ts
 * 策略切换历史记录管理
 */

import * as fs from "fs";
import * as path from "path";
import type { HistoryEntry } from "./ManageStrategies";
import { fileExists } from "./FileSystemUtils";
import { error, success, info, formatTable } from "./FormatUtils";

const HISTORY_FILE =
  process.env.HOME +
  "/.config/opencode/strategies/history.json";
const CONFIG_FILE =
  process.env.HOME + "/.config/opencode/strategy.jsonc";

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
    // 注意：这里需要调用 switchStrategy，但为了避免循环依赖，
    // 我们在 ManageStrategies.ts 中处理这个逻辑
    return false;
  } else {
    error(`无法回滚: 策略文件或备份不存在`);
    return false;
  }
}
