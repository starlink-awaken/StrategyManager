/**
 * RecommendationEngine.ts
 * 智能推荐引擎及其反馈系统
 */

import * as fs from "fs";
import { defaultPathManager } from "./PathManager";
import { fileExists } from './FileSystemUtils';
import { colorize, info, error, warning, formatTable } from './FormatUtils';
import {
  SmartRecommender,
  parseRecommendationContext,
} from "./Recommender";
import {
  listStrategiesWithOptions,
} from "./StrategyCore";
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
  Recommendation,
  RecommendationInput,
  RecommendationFeedback,
  RecommendationContext,
  FeedbackBucket,
  UsageData,
} from "./interfaces";

const RECOMMENDATION_FEEDBACK_FILE = defaultPathManager.getRecommendationFeedbackFile();

/**
 * 构建推荐上下文
 */
export function buildRecommendationContext(input: RecommendationInput): RecommendationContext {
  const parsed = parseRecommendationContext(input.description);

  if (input.priority) {
    if (parsed.scenario) {
      parsed.scenario.priority = input.priority;
    } else {
      parsed.scenario = {
        type: "daily",
        priority: input.priority,
      };
    }
  }

  if (input.budget) parsed.budget = input.budget;
  if (input.history) parsed.history = input.history;
  if (input.quotaStatus) parsed.quotaStatus = input.quotaStatus;

  return parsed;
}

/**
 * 智能推荐
 */
export async function recommendStrategySmart(input: RecommendationInput): Promise<Recommendation | null> {
  const strategies = await listStrategiesWithOptions({
    includeDynamic: input.includeDynamic ?? false,
  });
  if (strategies.length === 0) return null;

  const context = buildRecommendationContext(input);
  const recommender = new SmartRecommender(strategies);
  const results = await recommender.recommend(context);
  const best = results[0];

  if (!best) return null;

  return {
    strategyName: best.strategyName,
    reason: best.reason,
    score: best.score,
  };
}

/**
 * 显示推荐结果
 */
export async function displayRecommendation(scenario: string): Promise<void> {
  const recommendation = await recommendStrategySmart({ description: scenario });

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
  if (!fileExists(RECOMMENDATION_FEEDBACK_FILE)) return [];

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
export function recordRecommendationFeedback(entry: RecommendationFeedback): void {
  const entries = loadRecommendationFeedback();
  entries.push(entry);

  try {
    fs.writeFileSync(RECOMMENDATION_FEEDBACK_FILE, JSON.stringify(entries, null, 2), "utf-8");
  } catch (err) {
    warning("写入推荐反馈失败");
  }
}

/**
 * 更新最后一次推荐的选择
 */
export function updateLastRecommendationSelection(selectedStrategy: string): void {
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
    fs.writeFileSync(RECOMMENDATION_FEEDBACK_FILE, JSON.stringify(entries, null, 2), "utf-8");
  } catch (err) {
    warning("更新推荐反馈失败");
  }
}

/**
 * 生成推荐反馈报告
 */
export function generateRecommendationFeedbackReport(options?: {
  bucket?: FeedbackBucket;
}): any {
  const entries = loadRecommendationFeedback();
  const total = entries.length;
  const acceptedEntries = entries.filter((e) => !!e.selectedStrategy);
  const accepted = acceptedEntries.length;
  const acceptanceRate = total === 0 ? 0 : accepted / total;
  const bucket = options?.bucket ?? "day";

  const countBy = (items: string[]): Map<string, number> => {
    const map = new Map<string, number>();
    for (const item of items) map.set(item, (map.get(item) || 0) + 1);
    return map;
  };

  const recommendedMap = countBy(entries.map((e) => e.recommendedStrategy).filter((v): v is string => !!v));
  const selectedMap = countBy(acceptedEntries.map((e) => e.selectedStrategy).filter((v): v is string => !!v));

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
    if (bucket === "day") return date.toISOString().split("T")[0];
    if (bucket === "month") return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    
    const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = tmp.getUTCDay() || 7;
    tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
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
    Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([strategy, count]) => ({ strategy, count }));

  return {
    total,
    accepted,
    acceptanceRate,
    funnel: { recommended: total, selected: accepted, acceptanceRate },
    topRecommended: toTopList(recommendedMap),
    topSelected: toTopList(selectedMap),
    byScenario: Array.from(scenarioMap.entries()).sort((a, b) => b[1].count - a[1].count).map(([scenario, stats]) => ({ scenario, count: stats.count, accepted: stats.accepted })),
    byTimeBucket: Array.from(bucketMap.entries()).sort((a, b) => (a[0] > b[0] ? 1 : -1)).map(([key, stats]) => ({ bucket: key, total: stats.total, accepted: stats.accepted, acceptanceRate: stats.total === 0 ? 0 : stats.accepted / stats.total })),
  };
}

/**
 * 渲染推荐反馈报告
 */
export function renderRecommendationFeedbackReport(report: any): string {
  const lines: string[] = [
    "推荐反馈统计",
    `总推荐次数: ${report.total}`,
    `采纳次数: ${report.accepted}`,
    `采纳率: ${(report.acceptanceRate * 100).toFixed(1)}%`,
    "",
    "转化漏斗:",
    `  推荐: ${report.funnel.recommended}`,
    `  选择: ${report.funnel.selected}`,
    `  采纳率: ${(report.funnel.acceptanceRate * 100).toFixed(1)}%`,
    "",
    "Top 推荐策略:",
  ];

  for (const item of report.topRecommended) lines.push(`  ${item.strategy}: ${item.count}`);
  lines.push("", "Top 选择策略:");
  for (const item of report.topSelected) lines.push(`  ${item.strategy}: ${item.count}`);
  
  if (report.byScenario.length > 0) {
    lines.push("", "场景采纳率:");
    const headers = ["场景", "推荐次数", "采纳次数", "采纳率"];
    const rows = report.byScenario.map((item: any) => [item.scenario, item.count.toString(), item.accepted.toString(), `${((item.count === 0 ? 0 : item.accepted / item.count) * 100).toFixed(1)}%`]);
    lines.push(formatTable(headers, rows));
  }

  if (report.byTimeBucket.length > 0) {
    lines.push("", "时间分桶统计:");
    const headers = ["时间", "推荐次数", "采纳次数", "采纳率"];
    const rows = report.byTimeBucket.map((item: any) => [item.bucket, item.total.toString(), item.accepted.toString(), `${(item.acceptanceRate * 100).toFixed(1)}%`]);
    lines.push(formatTable(headers, rows));
  }

  return lines.join("\n");
}
