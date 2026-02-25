/**
 * interfaces.ts
 * StrategyManager 类型定义与共享接口
 */

import { UsageData } from "./UsageSync/interfaces";

// ==================== 基础枚举与类型 ====================

export type ScenarioType =
  | "agent-heavy"
  | "education"
  | "health"
  | "finance"
  | "coding"
  | "research"
  | "creative"
  | "daily"
  | "writing"
  | "multimedia"
  | "social"
  | "tools"
  | "entertainment"
  | "documentation";

export type Priority = "quality" | "cost" | "speed" | "balanced";
export type Complexity = "simple" | "medium" | "complex";
export type ValidationSeverity = "error" | "warning" | "info";
export type FeedbackBucket = "day" | "week" | "month";
export type HealthLevel = "Healthy" | "Degraded" | "Disabled";

// ==================== Agent 配置相关 ====================

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

// ==================== 策略配置 ====================

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
    description?: string;
  };
}

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

// ==================== 运行上下文与推荐 ====================

export interface ScenarioConfig {
  type: ScenarioType;
  priority: Priority;
  complexity?: Complexity;
}

export interface BudgetConfig {
  monthly: number;
  currentSpent: number;
  alertThreshold: number;
}

export interface QuotaStatus {
  provider: string;
  remaining: number;
  total: number;
  usagePercent: number;
  resetDate?: Date;
}

export interface HistoryData {
  recentStrategies: string[];
  frequentScenarios: string[];
  avgCostPerDay?: number;
}

export interface RecommendationContext {
  scenario?: ScenarioConfig;
  budget?: BudgetConfig;
  history?: HistoryData;
  quotaStatus?: QuotaStatus[];
  timeContext?: {
    isUrgent: boolean;
    deadline?: Date;
  };
}

export interface RecommendationInput {
  description: string;
  priority?: Priority;
  budget?: BudgetConfig;
  history?: HistoryData;
  quotaStatus?: QuotaStatus[];
  includeDynamic?: boolean;
}

export interface EstimatedCost {
  perUse: number;
  monthly: number;
  breakdown?: string;
}

export interface Recommendation {
  strategyName: string;
  score: number;
  reason: string;
  estimatedCost?: EstimatedCost;
  pros?: string[];
  cons?: string[];
  confidence?: number;
}

export interface RecommendationFeedback {
  timestamp: string;
  scenario: string;
  recommendedStrategy: string;
  selectedStrategy?: string;
  score?: number;
  quotaSnapshot?: QuotaStatus[];
}

// ==================== 动态策略相关 ====================

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

// ==================== 审计与历史 ====================

export interface HistoryEntry {
  timestamp: string;
  strategyName: string;
  strategyPath: string;
  action: "switch" | "rollback" | "import";
  backupPath?: string;
}

export interface StrategyDiff {
  added: string[];
  removed: string[];
  modified: string[];
}

export interface HealthIssue {
  level: HealthLevel;
  reason: string;
  timestamp: string;
  autoRecoverAt?: string;
}

export interface HealthStatus {
  disabledProviders: string[];
  disabledModels: string[];
  degradedItems: Record<string, HealthIssue>;
  lastChecked: Record<string, string>;
  issues: Record<string, string>;
}

export { UsageData };
