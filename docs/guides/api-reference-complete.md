# StrategyManager API 完整参考文档

> **版本**: v3.0.0
> **最后更新**: 2026-02-10
> **作者**: 老王整理

---

## 📑 目录

- [核心策略管理 API](#核心策略管理-api)
  - [策略读取](#策略读取)
  - [策略列表](#策略列表)
  - [策略切换](#策略切换)
  - [策略比较](#策略比较)
  - [策略验证](#策略验证)
  - [策略导出/导入](#策略导出导入)
  - [历史管理](#历史管理)
- [智能推荐系统 API](#智能推荐系统-api)
- [策略验证 API](#策略验证-api-1)
- [使用量同步 API](#使用量同步-api)
- [成本报告 API](#成本报告-api)
- [工具函数 API](#工具函数-api)
- [类型定义](#类型定义)

---

## 核心策略管理 API

> **模块**: `Tools/ManageStrategies.ts`

### 策略读取

#### `getCurrentStrategy()`

获取当前激活的策略信息。

```typescript
export function getCurrentStrategy(): StrategyMetadata | null
```

**返回值**: `StrategyMetadata | null`

```typescript
interface StrategyMetadata {
  name: string;              // 策略名称
  filePath: string;          // 策略文件路径
  description: string;       // 策略描述
  costLevel: string;         // 成本等级 (low/medium/high)
  version?: string;          // 版本号
  isCurrent: boolean;        // 是否为当前策略
  useCase?: string;          // 使用场景
  models?: string[];         // 使用的模型列表
  source?: "installed" | "dynamic";  // 策略来源
}
```

**示例**:

```typescript
import { getCurrentStrategy } from './Tools/ManageStrategies';

const current = getCurrentStrategy();
if (current) {
  console.log(`当前策略: ${current.name}`);
  console.log(`描述: ${current.description}`);
  console.log(`成本等级: ${current.costLevel}`);
}
```

---

#### `readStrategy(strategyName)`

读取指定策略的完整配置。

```typescript
export function readStrategy(strategyName: string): StrategyConfig | null
```

**参数**:
- `strategyName`: 策略名称 (例如: `"strategy-2-balanced"`)

**返回值**: `StrategyConfig | null`

```typescript
interface StrategyConfig {
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
```

**示例**:

```typescript
import { readStrategy } from './Tools/ManageStrategies';

const config = readStrategy("strategy-2-balanced");
if (config) {
  console.log(`策略版本: ${config.metadata?.version}`);
  console.log(`Agent数量: ${Object.keys(config.agents || {}).length}`);
}
```

---

### 策略列表

#### `listStrategies()`

列出所有已安装的策略(不包括动态策略)。

```typescript
export function listStrategies(): StrategyMetadata[]
```

**返回值**: `StrategyMetadata[]`

---

#### `listStrategiesWithOptions(options)`

列出策略,支持过滤和排序选项。

```typescript
export function listStrategiesWithOptions(options?: {
  includeDynamic?: boolean;    // 是否包含动态策略
  sortBy?: "name" | "cost" | "updated";  // 排序字段
  filter?: {
    costLevel?: string;        // 按成本等级过滤
    source?: "installed" | "dynamic";  // 按来源过滤
  };
}): StrategyMetadata[]
```

**示例**:

```typescript
import { listStrategiesWithOptions } from './Tools/ManageStrategies';

// 列出所有策略(包括动态策略)
const allStrategies = listStrategiesWithOptions({ includeDynamic: true });

// 只列出低成本策略
const cheapStrategies = listStrategiesWithOptions({
  filter: { costLevel: "low" }
});

// 按成本排序
const sortedByCost = listStrategiesWithOptions({
  sortBy: "cost"
});
```

---

#### `displayStrategies(includeDynamic)`

在终端以表格形式显示策略列表。

```typescript
export function displayStrategies(includeDynamic: boolean = false): void
```

**参数**:
- `includeDynamic`: 是否包含动态策略 (默认: `false`)

**示例**:

```typescript
import { displayStrategies } from './Tools/ManageStrategies';

displayStrategies(true);  // 显示所有策略(包括动态策略)
```

---

### 策略切换

#### `switchStrategy(strategyName)`

切换到指定策略(自动备份当前策略)。

```typescript
export function switchStrategy(strategyName: string): boolean
```

**参数**:
- `strategyName`: 目标策略名称

**返回值**: `boolean` - 成功返回 `true`,失败返回 `false`

**功能**:
1. 验证目标策略存在
2. 自动备份当前策略到 `backups/` 目录
3. 更新软链接指向新策略
4. 记录切换历史

**示例**:

```typescript
import { switchStrategy, success, error } from './Tools/ManageStrategies';

if (switchStrategy("strategy-2-balanced")) {
  success("策略切换成功!");
} else {
  error("策略切换失败!");
}
```

---

### 策略比较

#### `compareStrategies(name1, name2)`

比较两个策略的差异。

```typescript
export function compareStrategies(
  name1: string,
  name2: string
): {
  config1: StrategyConfig;
  config2: StrategyConfig;
  diff: StrategyDiff;
} | null
```

**参数**:
- `name1`: 第一个策略名称
- `name2`: 第二个策略名称

**返回值**: 比较结果对象或 `null`

```typescript
interface StrategyDiff {
  added: string[];      // 新增字段路径
  removed: string[];    // 删除字段路径
  modified: string[];   // 修改字段路径
}
```

**示例**:

```typescript
import { compareStrategies } from './Tools/ManageStrategies';

const result = compareStrategies(
  "strategy-1-performance",
  "strategy-2-balanced"
);

if (result) {
  console.log("新增字段:", result.diff.added);
  console.log("删除字段:", result.diff.removed);
  console.log("修改字段:", result.diff.modified);
}
```

---

#### `displayStrategyDiff(name1, name2)`

在终端显示两个策略的差异对比。

```typescript
export function displayStrategyDiff(name1: string, name2: string): void
```

**输出格式**:
- `+` 绿色: 新增字段
- `-` 红色: 删除字段
- `~` 黄色: 修改字段

**示例**:

```typescript
import { displayStrategyDiff } from './Tools/ManageStrategies';

displayStrategyDiff(
  "strategy-1-performance",
  "strategy-2-balanced"
);
```

---

### 策略验证

#### `validateStrategy(config)`

验证策略配置的完整性和正确性。

```typescript
export function validateStrategy(config: StrategyConfig): boolean
```

**参数**:
- `config`: 策略配置对象

**返回值**: `boolean` - 验证通过返回 `true`

**验证项目**:
- Schema 结构完整性
- 必填字段存在性
- 模型名称有效性
- 配置值合法性

---

#### `validateStrategyFile(strategyName)`

验证指定策略文件。

```typescript
export function validateStrategyFile(strategyName: string): boolean
```

**参数**:
- `strategyName`: 策略名称

**返回值**: `boolean`

**示例**:

```typescript
import { validateStrategyFile } from './Tools/ManageStrategies';

if (validateStrategyFile("my-custom-strategy")) {
  console.log("✅ 策略验证通过!");
} else {
  console.log("❌ 策略验证失败!");
}
```

---

### 策略导出/导入

#### `exportStrategy(strategyName, outputPath)`

导出策略到指定路径。

```typescript
export function exportStrategy(
  strategyName: string,
  outputPath: string
): boolean
```

**参数**:
- `strategyName`: 策略名称
- `outputPath`: 导出文件路径

**返回值**: `boolean`

**示例**:

```typescript
import { exportStrategy } from './Tools/ManageStrategies';

exportStrategy(
  "strategy-2-balanced",
  "./my-backup.jsonc"
);
```

---

#### `importStrategy(strategyName, inputPath, options)`

导入策略文件。

```typescript
export function importStrategy(
  strategyName: string,
  inputPath: string,
  options?: {
    validate?: boolean;   // 是否验证 (默认: true)
    overwrite?: boolean;  // 是否覆盖 (默认: false)
  }
): boolean
```

**参数**:
- `strategyName`: 导入后的策略名称
- `inputPath`: 策略文件路径
- `options`: 可选配置

**返回值**: `boolean`

**示例**:

```typescript
import { importStrategy } from './Tools/ManageStrategies';

// 标准导入
importStrategy("my-strategy", "./my-strategy.jsonc");

// 跳过验证导入
importStrategy("my-strategy", "./my-strategy.jsonc", { validate: false });

// 强制覆盖导入
importStrategy("my-strategy", "./my-strategy.jsonc", { overwrite: true });
```

---

### 历史管理

#### `getHistory()`

获取策略切换历史记录。

```typescript
export function getHistory(): HistoryEntry[]
```

**返回值**: `HistoryEntry[]`

```typescript
interface HistoryEntry {
  timestamp: string;       // ISO 8601 时间戳
  strategyName: string;    // 策略名称
  strategyPath: string;    // 策略文件路径
  action: "switch" | "rollback" | "import";  // 操作类型
  backupPath?: string;     // 备份文件路径
}
```

---

#### `displayHistory(limit)`

在终端显示历史记录。

```typescript
export function displayHistory(limit: number = 10): void
```

**参数**:
- `limit`: 显示条数 (默认: 10)

---

#### `rollbackToHistory(index)`

回滚到历史记录中的指定版本。

```typescript
export function rollbackToHistory(index: number): boolean
```

**参数**:
- `index`: 历史记录索引 (从 `displayHistory()` 查看)

**返回值**: `boolean`

**示例**:

```typescript
import { rollbackToHistory } from './Tools/ManageStrategies';

// 回滚到第3条历史记录
rollbackToHistory(3);
```

---

### 动态策略生成

#### `generateDynamicStrategy(options)`

基于场景和配额状态动态生成优化策略。

```typescript
export function generateDynamicStrategy(
  options: DynamicStrategyOptions
): DynamicStrategyResult | null
```

**参数**:

```typescript
interface DynamicStrategyOptions {
  description: string;           // 场景描述
  priority?: Priority;           // 优先级 (quality/cost/speed/balanced)
  quotaStatus?: QuotaStatus[];   // 配额状态
  save?: boolean;                // 是否保存到文件
  retentionDays?: number;        // 保留天数
}
```

**返回值**:

```typescript
interface DynamicStrategyResult {
  name: string;              // 动态策略名称
  filePath: string;          // 策略文件路径
  baseTemplate: string;      // 基础模板
  config: StrategyConfig;    // 策略配置
}
```

**示例**:

```typescript
import { generateDynamicStrategy } from './Tools/ManageStrategies';

const result = generateDynamicStrategy({
  description: "深度研究项目",
  priority: "quality",
  quotaStatus: [
    {
      provider: "anthropic",
      remaining: 50,
      total: 100,
      usagePercent: 0.5
    }
  ],
  save: true
});

if (result) {
  console.log(`动态策略已生成: ${result.name}`);
}
```

---

#### `saveDynamicStrategyAs(dynamicName, customName)`

将动态策略固化为永久策略。

```typescript
export function saveDynamicStrategyAs(
  dynamicName: string,
  customName: string
): boolean
```

**参数**:
- `dynamicName`: 动态策略名称
- `customName`: 自定义策略名称

**返回值**: `boolean`

**示例**:

```typescript
import { saveDynamicStrategyAs } from './Tools/ManageStrategies';

saveDynamicStrategyAs(
  "strategy-generated-coding-20260205",
  "my-coding-strategy"
);
```

---

#### `cleanupDynamicStrategies(retentionDays)`

清理过期的动态策略。

```typescript
export function cleanupDynamicStrategies(retentionDays: number = 7): number
```

**参数**:
- `retentionDays`: 保留天数 (默认: 7)

**返回值**: `number` - 清理的策略数量

---

### 模板管理

#### `installTemplate(templateName)`

从 `templates/` 目录安装策略模板。

```typescript
export function installTemplate(templateName: string): boolean
```

**参数**:
- `templateName`: 模板文件名 (例如: `"strategy-2-balanced"`)

**返回值**: `boolean`

---

#### `syncAllTemplates(force)`

同步所有模板到策略目录。

```typescript
export function syncAllTemplates(force: boolean = false): boolean
```

**参数**:
- `force`: 是否强制覆盖已存在的策略

**返回值**: `boolean`

---

#### `listTemplates()`

列出所有可用的模板。

```typescript
export function listTemplates(): void
```

---

## 智能推荐系统 API

> **模块**: `Tools/Recommender.ts`

### `SmartRecommender` 类

智能推荐引擎,基于多因素评分算法。

#### `constructor(context?)`

```typescript
constructor(context?: RecommendationContext)
```

**参数**:

```typescript
interface RecommendationContext {
  scenario?: ScenarioConfig;     // 场景配置
  budget?: BudgetConfig;         // 预算配置
  history?: HistoryData;         // 历史数据
  timeContext?: TimeContext;     // 时间上下文
  quotaStatus?: QuotaStatus[];   // 配额状态
}
```

---

#### `recommendFor(input)`

根据输入推荐最合适的策略。

```typescript
recommendFor(input: RecommendationInput): Recommendation | null
```

**参数**:

```typescript
interface RecommendationInput {
  description: string;           // 场景描述
  priority?: Priority;           // 优先级
  budget?: BudgetConfig;         // 预算
  history?: HistoryData;         // 历史数据
  quotaStatus?: QuotaStatus[];   // 配额状态
  includeDynamic?: boolean;      // 包含动态策略
}
```

**返回值**:

```typescript
interface Recommendation {
  strategyName: string;          // 推荐策略名称
  score: number;                 // 评分 (0-100)
  reason: string;                // 推荐理由
  estimatedCost: EstimatedCost;  // 成本估算
  pros: string[];                // 优势
  cons: string[];                // 劣势
  confidence: number;            // 置信度 (0-1)
}
```

**示例**:

```typescript
import { SmartRecommender } from './Tools/Recommender';

const recommender = new SmartRecommender();

const rec = recommender.recommendFor({
  description: "日常开发工作",
  priority: "balanced"
});

console.log(`推荐策略: ${rec?.strategyName}`);
console.log(`推荐理由: ${rec?.reason}`);
console.log(`预估成本: $${rec?.estimatedCost.monthly}/月`);
```

---

### 推荐相关函数

#### `recommendStrategySmart(input)`

便捷的智能推荐函数(在 ManageStrategies.ts 中)。

```typescript
export function recommendStrategySmart(
  input: RecommendationInput
): Recommendation | null
```

**示例**:

```typescript
import { recommendStrategySmart } from './Tools/ManageStrategies';

const rec = recommendStrategySmart({
  description: "深度研究项目",
  priority: "quality",
  quotaStatus: [
    {
      provider: "anthropic",
      remaining: 50,
      total: 100,
      usagePercent: 0.5
    }
  ]
});

console.log(rec?.strategyName);
```

---

#### `parseRecommendationContext(input)`

解析推荐输入为结构化上下文。

```typescript
export function parseRecommendationContext(
  input: RecommendationInput
): RecommendationContext
```

---

### 推荐反馈系统

#### `recordRecommendationFeedback(data)`

记录推荐反馈数据(用于分析推荐准确性)。

```typescript
export function recordRecommendationFeedback(
  data: RecommendationFeedback
): void
```

**参数**:

```typescript
interface RecommendationFeedback {
  timestamp: string;              // 时间戳
  scenario: string;               // 场景描述
  recommendedStrategy: string;    // 推荐策略
  selectedStrategy?: string;      // 用户选择的策略
  score?: number;                 // 评分
  quotaSnapshot?: QuotaStatus[];  // 配额快照
}
```

---

#### `generateRecommendationFeedbackReport(options)`

生成推荐反馈报告。

```typescript
export function generateRecommendationFeedbackReport(options?: {
  bucket?: FeedbackBucket;  // 分桶方式 (day/week/month)
  limit?: number;           // 限制条数
}): {
  totalRecommendations: number;
  adoptionRate: number;
  topScenarios: Array<{scenario: string; count: number}>;
  selectedStrategies: Array<{strategy: string; count: number}>;
  byBucket: Record<string, {
    total: number;
    adopted: number;
    adoptionRate: number;
  }>;
}
```

**示例**:

```typescript
import { generateRecommendationFeedbackReport } from './Tools/ManageStrategies';

const report = generateRecommendationFeedbackReport({
  bucket: "week"
});

console.log(`总推荐次数: ${report.totalRecommendations}`);
console.log(`采纳率: ${(report.adoptionRate * 100).toFixed(1)}%`);
```

---

## 策略验证 API

> **模块**: `Tools/Validator.ts`

### `StrategyValidator` 类

多层次策略验证系统。

#### `validate(config, strategyName?)`

验证策略配置。

```typescript
validate(config: StrategyConfig, strategyName?: string): ValidationResult
```

**返回值**:

```typescript
interface ValidationResult {
  valid: boolean;                    // 是否通过验证
  errors: ValidationError[];         // 错误列表
  warnings: ValidationError[];       // 警告列表
  info: ValidationError[];           // 信息列表
  suggestions: string[];             // 优化建议
}

interface ValidationError {
  field: string;                     // 字段路径
  message: string;                   // 错误消息
  severity: "error" | "warning" | "info";  // 严重程度
  fix?: {
    description: string;             // 修复说明
    autoFix?: () => void;            // 自动修复函数
  };
}
```

**示例**:

```typescript
import { StrategyValidator } from './Tools/Validator';

const validator = new StrategyValidator();
const result = validator.validate(config, "my-strategy");

if (!result.valid) {
  console.log("验证失败:");
  result.errors.forEach(err => {
    console.log(`  [${err.severity}] ${err.field}: ${err.message}`);
  });
}

// 显示自动修复建议
result.warnings.forEach(warn => {
  if (warn.fix) {
    console.log(`修复建议: ${warn.fix.description}`);
  }
});
```

---

#### `formatValidationResult(result)`

格式化验证结果为可读文本。

```typescript
export function formatValidationResult(result: ValidationResult): string
```

**返回值**: 格式化的字符串(带颜色)

---

## 使用量同步 API

> **模块**: `Tools/UsageSync/index.ts`

### `UsageSyncCoordinator` 类

多厂商使用量同步协调器。

#### `register(sync)`

注册一个同步器。

```typescript
register(sync: UsageSync): void
```

**参数**:

```typescript
interface UsageSync {
  provider: string;                  // 厂商标识
  fetchUsage(period?: {start: Date; end: Date}): Promise<UsageData[]>;  // 获取使用数据
}
```

---

#### `syncOne(provider, period?)`

同步单个厂商的使用数据。

```typescript
async syncOne(
  provider: string,
  period?: {start: Date; end: Date}
): Promise<SyncResult>
```

**返回值**:

```typescript
interface SyncResult {
  success: boolean;
  provider: string;
  data?: UsageData[];
  error?: string;
  duration: number;      // 耗时(ms)
  timestamp: Date;
}
```

**示例**:

```typescript
import { createUsageSyncCoordinator } from './Tools/UsageSync';

const coordinator = createUsageSyncCoordinator();

const result = await coordinator.syncOne("anthropic", {
  start: new Date("2026-01-01"),
  end: new Date("2026-01-31")
});

if (result.success) {
  console.log(`获取到 ${result.data?.length} 条使用记录`);
} else {
  console.error(`同步失败: ${result.error}`);
}
```

---

#### `syncAll(period?)`

同步所有已注册的厂商。

```typescript
async syncAll(period?: {start: Date; end: Date}): Promise<BatchSyncResult>
```

**返回值**:

```typescript
interface BatchSyncResult {
  total: number;
  successful: number;
  failed: number;
  results: SyncResult[];
  duration: number;
  timestamp: Date;
}
```

**示例**:

```typescript
const batchResult = await coordinator.syncAll();

console.log(`成功: ${batchResult.successful}/${batchResult.total}`);
console.log(`失败: ${batchResult.failed}`);
console.log(`总耗时: ${batchResult.duration}ms`);
```

---

### 支持的同步器

#### `AnthropicSync`

Anthropic CLI 使用量同步。

```typescript
import { AnthropicSync } from './Tools/UsageSync';

const sync = new AnthropicSync();
const data = await sync.fetchUsage();
```

---

#### `OpenAISync`

OpenAI API 使用量同步。

```typescript
import { OpenAISync } from './Tools/UsageSync';

const sync = new OpenAISync();
const data = await sync.fetchUsage();
```

---

#### `GitHubSync`

GitHub Copilot 使用量同步。

```typescript
import { GitHubSync } from './Tools/UsageSync';

const sync = new GitHubSync();
const data = await sync.fetchUsage();
```

---

#### `ZhiPuSync`, `GeminiSync`, `DeepSeekSync`, `SiliconFlowSync`

其他厂商同步器,使用方式类似。

---

### `createUsageSyncCoordinator()`

创建并初始化协调器(自动注册所有可用同步器)。

```typescript
export function createUsageSyncCoordinator(): UsageSyncCoordinator
```

**示例**:

```typescript
import { createUsageSyncCoordinator } from './Tools/UsageSync';

const coordinator = createUsageSyncCoordinator();

// 查看已注册的厂商
console.log("已注册厂商:", coordinator.getProviders());

// 同步所有厂商
const result = await coordinator.syncAll();
```

---

## 成本报告 API

> **模块**: `Tools/CostReport.ts`

### `CostReport` 类

成本报告生成器。

#### `constructor(data, period)`

```typescript
constructor(data: UsageData[], period: {start: Date; end: Date})
```

**参数**:
- `data`: 使用量数据数组
- `period`: 时间范围

---

#### `generateTextReport()`

生成文本格式报告。

```typescript
generateTextReport(): string
```

**返回值**: 格式化的文本报告

**示例**:

```typescript
import { CostReport } from './Tools/CostReport';
import { createUsageSyncCoordinator } from './Tools/UsageSync';

const coordinator = createUsageSyncCoordinator();
const result = await coordinator.syncAll();

const report = new CostReport(
  result.results.flatMap(r => r.data || []),
  { start: new Date("2026-01-01"), end: new Date("2026-01-31") }
);

console.log(report.generateTextReport());
```

**输出示例**:

```
══════════════════════════════════════════════════════════════
                    AI USAGE COST REPORT
══════════════════════════════════════════════════════════════

Generated: 2026-02-10T00:00:00.000Z
Period: 1/1/2026 - 1/31/2026

Total Cost: $123.45
Records: 1523
Avg Cost/Request: $0.081076
Avg Cost/Token: $0.000003145

Cost by Provider:
------------------------------------------------------------
  Anthropic          $89.12 ( 72.2%)
  OpenAI             $28.45 ( 23.0%)
  GitHub             $5.88 (  4.8%)

══════════════════════════════════════════════════════════════
```

---

### `CostCalculator` 工具类

成本计算工具。

#### `generateCostReport(data)`

```typescript
static generateCostReport(data: UsageData[]): {
  totalCost: number;
  averageCostPerRequest: number;
  averageCostPerToken: number;
  costByProvider: Record<string, {
    cost: number;
    percentage: number;
  }>;
}
```

---

## 工具函数 API

### 文件操作

#### `readJSONC(filePath)`

读取 JSONC 文件(JSON with Comments)。

```typescript
export function readJSONC(filePath: string): any
```

**特性**:
- 支持 `//` 单行注释
- 支持 `/* */` 块注释
- 自动去除注释后解析

---

#### `writeJSONC(filePath, data)`

写入 JSON 文件。

```typescript
export function writeJSONC(filePath: string, data: any): void
```

---

### 终端输出

#### `colorize(text, color)`

给文本添加颜色。

```typescript
export function colorize(text: string, color: keyof typeof COLORS): string
```

**颜色选项**: `"red" | "green" | "yellow" | "blue"`

---

#### `success(text)`, `error(text)`, `warning(text)`, `info(text)`

格式化输出消息。

```typescript
export function success(text: string): void   // ✅ 绿色
export function error(text: string): void     // ❌ 红色
export function warning(text: string): void   // ⚠️  黄色
export function info(text: string): void      // ℹ️  蓝色
```

**示例**:

```typescript
import { success, error, warning, info } from './Tools/ManageStrategies';

success("操作成功!");
error("发生错误!");
warning("注意: 这可能会导致额外费用");
info("正在同步数据...");
```

---

#### `formatTable(headers, rows)`

格式化表格输出。

```typescript
export function formatTable(headers: string[], rows: string[][]): string
```

**示例**:

```typescript
import { formatTable } from './Tools/ManageStrategies';

const table = formatTable(
  ["策略名称", "成本等级", "版本"],
  [
    ["strategy-1", "high", "1.0.0"],
    ["strategy-2", "medium", "1.1.0"],
    ["strategy-3", "low", "1.0.0"]
  ]
);

console.log(table);
```

---

### 元数据管理

#### `normalizeMetadata(config, strategyName)`

规范化策略元数据(自动补全缺失字段)。

```typescript
export function normalizeMetadata(
  config: StrategyConfig,
  strategyName: string
): StrategyConfig
```

**补全字段**:
- `version`: 默认 `"1.0.0"`
- `updated`: 当前日期
- `cost_level`: 根据策略名称推断
- `use_case`: 默认 `"通用场景"`

---

#### `validateMetadata(config)`

验证元数据完整性。

```typescript
export function validateMetadata(config: StrategyConfig): string[]
```

**返回值**: 警告消息数组

---

### 其他工具函数

#### `extractModels(config)`

提取策略中使用的所有模型。

```typescript
export function extractModels(config: StrategyConfig): string[]
```

---

#### `fileExists(filePath)`

检查文件是否存在。

```typescript
export function fileExists(filePath: string): boolean
```

---

#### `isSymlink(filePath)`

检查是否为软链接。

```typescript
export function isSymlink(filePath: string): boolean
```

---

#### `readSymlink(filePath)`

读取软链接目标。

```typescript
export function readSymlink(filePath: string): string | null
```

---

## 类型定义

### 核心类型

```typescript
// 策略配置
interface StrategyConfig {
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

// Agent 配置
interface AgentConfig {
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

// Agent 权限配置
interface AgentPermissionConfig {
  edit?: "ask" | "allow" | "deny";
  bash?: "ask" | "allow" | "deny" | Record<string, "ask" | "allow" | "deny">;
  webfetch?: "ask" | "allow" | "deny";
  doom_loop?: "ask" | "allow" | "deny";
  external_directory?: "ask" | "allow" | "deny";
}

// Agent 思考配置
interface AgentThinkingConfig {
  type: "enabled" | "disabled";
  budgetTokens?: number;
}
```

### 推荐系统类型

```typescript
// 场景类型
type ScenarioType =
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

// 优先级
type Priority = "quality" | "cost" | "speed" | "balanced";

// 复杂度
type Complexity = "simple" | "medium" | "complex";

// 场景配置
interface ScenarioConfig {
  type: ScenarioType;
  priority: Priority;
  complexity?: Complexity;
}

// 预算配置
interface BudgetConfig {
  monthly: number;           // 月度预算
  currentSpent: number;      // 本月已用
  alertThreshold: number;    // 告警阈值 (0-1)
}

// 配额状态
interface QuotaStatus {
  provider: string;          // 厂商标识
  remaining: number;         // 剩余额度 (USD)
  total: number;             // 总额度 (USD)
  usagePercent: number;      // 使用百分比 (0-1)
  resetDate?: Date;          // 重置日期
}

// 历史数据
interface HistoryData {
  recentStrategies: string[];      // 最近使用的策略
  frequentScenarios: string[];     // 常用场景
  avgCostPerDay?: number;          // 平均每日成本
}

// 时间上下文
interface TimeContext {
  isUrgent: boolean;         // 是否紧急
  deadline?: Date;           // 截止日期
}

// 推荐上下文
interface RecommendationContext {
  scenario?: ScenarioConfig;
  budget?: BudgetConfig;
  history?: HistoryData;
  timeContext?: TimeContext;
  quotaStatus?: QuotaStatus[];
}

// 成本估算
interface EstimatedCost {
  perUse: number;            // 单次使用成本
  monthly: number;           // 月度预估成本
  breakdown?: string;        // 成本细分说明
}

// 推荐结果
interface Recommendation {
  strategyName: string;
  score: number;             // 总分 (0-100)
  reason: string;            // 推荐理由
  estimatedCost: EstimatedCost;
  pros: string[];            // 优势
  cons: string[];            // 劣势
  confidence: number;        // 置信度 (0-1)
}
```

### 验证系统类型

```typescript
// 验证严重程度
type ValidationSeverity = "error" | "warning" | "info";

// 验证错误
interface ValidationError {
  field: string;
  message: string;
  severity: ValidationSeverity;
  fix?: {
    description: string;
    autoFix?: () => void;
  };
}

// 验证结果
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  info: ValidationError[];
  suggestions: string[];
}
```

### 使用量同步类型

```typescript
// 使用数据
interface UsageData {
  timestamp: Date;
  provider: string;
  model?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  cost?: number;
  requestType?: string;
  metadata?: Record<string, any>;
}

// 同步结果
interface SyncResult {
  success: boolean;
  provider: string;
  data?: UsageData[];
  error?: string;
  duration: number;
  timestamp: Date;
}

// 批量同步结果
interface BatchSyncResult {
  total: number;
  successful: number;
  failed: number;
  results: SyncResult[];
  duration: number;
  timestamp: Date;
}
```

---

## 📚 使用示例

### 示例 1: 基础策略管理

```typescript
import {
  listStrategies,
  switchStrategy,
  getCurrentStrategy
} from './Tools/ManageStrategies';

// 1. 列出所有策略
const strategies = listStrategies();
console.log("可用策略:", strategies.map(s => s.name));

// 2. 切换策略
switchStrategy("strategy-2-balanced");

// 3. 查看当前策略
const current = getCurrentStrategy();
console.log("当前策略:", current?.name);
```

---

### 示例 2: 智能推荐

```typescript
import {
  recommendStrategySmart,
  switchStrategy
} from './Tools/ManageStrategies';

// 获取推荐
const rec = recommendStrategySmart({
  description: "日常编程工作,注重成本控制",
  priority: "cost"
});

if (rec) {
  console.log(`推荐策略: ${rec.strategyName}`);
  console.log(`推荐理由: ${rec.reason}`);
  console.log(`预估成本: $${rec.estimatedCost.monthly}/月`);

  // 自动切换到推荐策略
  switchStrategy(rec.strategyName);
}
```

---

### 示例 3: 策略验证和修复

```typescript
import {
  readStrategy,
  validateStrategy,
  StrategyValidator
} from './Tools/ManageStrategies';
import { StrategyValidator } from './Tools/Validator';

const config = readStrategy("my-strategy");
if (config) {
  // 使用增强验证器
  const validator = new StrategyValidator();
  const result = validator.validate(config, "my-strategy");

  if (!result.valid) {
    console.log("验证失败:");
    result.errors.forEach(err => {
      console.log(`  [${err.severity}] ${err.field}: ${err.message}`);
    });
  }

  // 显示优化建议
  if (result.suggestions.length > 0) {
    console.log("\n优化建议:");
    result.suggestions.forEach(s => console.log(`  - ${s}`));
  }
}
```

---

### 示例 4: 使用量同步和成本报告

```typescript
import {
  createUsageSyncCoordinator
} from './Tools/UsageSync';
import { CostReport } from './Tools/CostReport';

async function generateMonthlyReport() {
  // 1. 同步所有厂商数据
  const coordinator = createUsageSyncCoordinator();
  const syncResult = await coordinator.syncAll();

  // 2. 汇总数据
  const allData = syncResult.results.flatMap(r => r.data || []);

  // 3. 生成成本报告
  const report = new CostReport(allData, {
    start: new Date("2026-01-01"),
    end: new Date("2026-01-31")
  });

  console.log(report.generateTextReport());
}

generateMonthlyReport();
```

---

### 示例 5: 动态策略生成

```typescript
import {
  generateDynamicStrategy,
  saveDynamicStrategyAs,
  switchStrategy
} from './Tools/ManageStrategies';

// 生成动态策略
const result = generateDynamicStrategy({
  description: "紧急项目,需要高质量输出",
  priority: "quality",
  quotaStatus: [
    {
      provider: "anthropic",
      remaining: 80,
      total: 100,
      usagePercent: 0.2
    }
  ],
  save: true
});

if (result) {
  console.log(`动态策略已生成: ${result.name}`);

  // 如果满意,可以固化
  saveDynamicStrategyAs(result.name, "my-urgent-project");

  // 切换使用
  switchStrategy(result.name);
}
```

---

## 🔧 高级用法

### 自定义路径管理

```typescript
import { PathManager } from './Tools/PathManager';

// 项目模式
const projectPathManager = new PathManager("project");
console.log("配置目录:", projectPathManager.getConfigDir());

// 自定义模式
const customPathManager = new PathManager("custom", {
  configDir: "/my/custom/config"
});
```

---

### 扩展验证规则

```typescript
import { StrategyValidator } from './Tools/Validator';

class CustomValidator extends StrategyValidator {
  validate(config: StrategyConfig, strategyName?: string): ValidationResult {
    const result = super.validate(config, strategyName);

    // 添加自定义验证
    if (config.agents) {
      for (const [name, agent] of Object.entries(config.agents)) {
        if (agent.temperature && agent.temperature > 1.5) {
          result.warnings.push({
            field: `agents.${name}.temperature`,
            message: "温度值过高,可能导致输出不稳定",
            severity: "warning"
          });
        }
      }
    }

    return result;
  }
}
```

---

## 📖 相关文档

- [完整使用指南](../docs/guides/USAGE_GUIDE.md)
- [配置指南](../docs/guides/CONFIGURATION.md)
- [架构文档](../docs/architecture/ARCHITECTURE.md)
- [故障排除](../docs/guides/TROUBLESHOOTING.md)

---

**文档维护**: 老王
**最后更新**: 2026-02-10
**版本**: v3.0.0
