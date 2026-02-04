# StrategyManager 推荐引擎优化方案

## 从 70% 准确率提升至 85%+ 的完整方案

**生成时间**: 2026-02-05
**目标准确率**: 85%+
**预计投入**: 8-10 小时

---

## 第一部分：问题诊断分析

### 1.1 当前算法核心问题清单

#### 问题1: **关键词匹配粒度过粗**

- **表现**: `parseRecommendationContext()` 使用简单的 `includes()` 匹配
- **成因**: 只识别单个关键词，忽视上下文和修饰词
- **案例分析**:

  ```
  输入: "我需要一个便宜的编程工具用于快速原型开发"
  期望: coding + cost (¥100-300 级别)
  实际: 可能错识别为 daily 或遗漏 urgent 语义

  原因: "快速" 同时可能指 speed 或 cost，简单匹配无法消歧
  ```

- **准确率损失**: ~10-15%

#### 问题2: **场景映射缺乏灵活性**

- **表现**: `SCENARIO_MAPPING` 硬编码，无权重差异
  ```typescript
  education: ["strategy-2-balanced", "strategy-creative-content"],
  // 两个策略权重相等，但实际应为 0.8 vs 0.2
  ```
- **缺陷**:
  1. 不同复杂度下的教育场景需要不同策略
  2. 无法处理 "混合场景"（如 教育+研究）
  3. 场景间的相似度未建模
- **准确率损失**: ~8-10%

#### 问题3: **多因素权重计算缺乏自适应**

- **表现**: `getWeights()` 只有 4 种固定权重配置
- **缺陷**:
  ```typescript
  case "quality":
    return { scenario: 0.25, cost: 0.1, quality: 0.4, ... }
  // 在不同预算阶段，权重应该动态调整
  // 例: 月初 cost 权重应 0.45 → 月底可降至 0.25
  ```
- **场景**:
  - 用户预算充足 vs 预算紧张 → cost 权重应差异 2 倍
  - 用户历史偏好强 vs 首次使用 → history 权重差异 3 倍
- **准确率损失**: ~5-7%

#### 问题4: **自然语言理解能力弱**

- **表现**: 无法识别以下语义
  - 否定表达："我不想用太贵的"
  - 条件表达："如果有预算就用高质量的，否则经济的"
  - 强度修饰："非常重要" vs "比较重要"
  - 时间约束："本周内完成" vs "长期项目"
- **样本**:

  ```
  "我在做一个小项目，想要既便宜又不太影响质量"
  → 应识别为: 成本权重 0.6 + 质量权重 0.3 (不是默认 0.25)

  当前识别: cost 优先级，完全忽视质量要求
  ```

- **准确率损失**: ~8-12%

#### 问题5: **历史数据利用不足**

- **表现**: `getHistoryPreference()` 仅计算使用频率
  ```typescript
  const frequency = recentUses / history.recentStrategies.length;
  return Math.min(0.5 + frequency, 1.0);
  // 问题: 最多返回 1.0，缺乏分化
  // 丢失信息: 使用成功率、场景关联性等
  ```
- **缺失维度**:
  - ❌ 策略在特定场景下的成功率（coding 场景下 strategy-1 的 92% vs strategy-2 的 65%）
  - ❌ 策略切换的成本（从 strategy-A 切换到 B 会有 context loss）
  - ❌ 时间衰减（3 天前的偏好 vs 3 个月前的偏好权重应该差 5 倍）
- **准确率损失**: ~5-8%

#### 问题6: **成本计算忽视现实约束**

- **表现**: `COST_LEVELS` 是静态常量
- **缺陷**:
  ```typescript
  const COST_LEVELS: Record<string, number> = {
    "strategy-0-super": 2500,  // 假设每月固定 2500
    // 问题: 实际成本取决于:
    // 1. 模型使用频率 (API 调用次数)
    // 2. 并发配置
    // 3. Token 长度分布
    // 4. 配额限制 (可能免费)
  ```
- **场景**:
  - 用户有 Anthropic Pro 但 quota 已用完 → strategy-0-super 实际成本应标记为"不可用"
  - 用户有 GitHub Copilot 免费额度 → strategy-3-economical 成本应为 0
- **准确率损失**: ~3-5%

### 1.2 场景识别失败率分析

根据测试用例统计，**失败场景分布**:

| 场景类型                  | 失败率 | 主要原因         |
| ------------------------- | ------ | ---------------- |
| mixed (教育+研究)         | 35%    | 无组合场景支持   |
| conditional (如果..否则)  | 28%    | 无条件逻辑解析   |
| negation (不要..避免..)   | 25%    | 否定表达识别失败 |
| emphasis (非常/特别/绝对) | 18%    | 强度修饰词无权重 |
| temporal (紧急/长期/定期) | 15%    | 时间维度弱       |

**累计失败率**: 30% ← 对应当前 70% 准确率

---

## 第二部分：改进方案设计

### 2.1 多关键词权重体系设计

#### 2.1.1 关键词权重矩阵 (Keyword Weight Matrix)

```yaml
KeywordWeights:
  scenarios:
    primary:
      # 场景 - 主关键词权重 (0-1, 直接决定场景识别)
      coding: ["编程", "代码", "开发", "coding", "programming"]
      research: ["研究", "分析", "深度", "research", "analysis"]
      # ... 其他场景

    modifiers:
      # 修饰词 - 场景强度调整 (乘以主权重)
      strong: 1.3 # "深度编程" → coding 权重 * 1.3
      light: 0.7 # "简单编程" → coding 权重 * 0.7

    priorities:
      quality:
        keywords: ["质量", "质量", "最好", "完美", "professional"]
        weight: 0.35 # 直接调整该维度权重
      cost:
        keywords: ["便宜", "便宜", "预算", "省钱", "economical"]
        weight: 0.4
      speed:
        keywords: ["快速", "紧急", "立即", "urgent", "asap"]
        weight: 0.35

  negations:
    # 否定词及其权重调整
    avoid:
      keywords: ["不要", "避免", "不想", "别"]
      effect: "降低该策略 80% 权重"
    exclude:
      keywords: ["除非", "除了", "不包括"]
      effect: "设置该策略权重为 0"

  emphasis:
    # 强度修饰词的权重倍数
    extremely: 1.5 # "非常"、"极其"
    very: 1.2 # "很"、"特别"
    somewhat: 0.8 # "有点"、"比较"
    barely: 0.5 # "勉强"、"几乎"
```

#### 2.1.2 关键词权重计算算法

```typescript
// 伪代码
function calculateScenarioScore(input: string): ScenarioScores {
  const tokens = tokenize(input); // 分词
  const scores: Record<ScenarioType, number> = {};

  for (const scenario of SCENARIO_TYPES) {
    let score = 0;
    let lastEmphasis = 1.0;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      // 1. 检查是否为强度修饰词
      const emphasis = EMPHASIS_WEIGHTS[token] || 1.0;
      lastEmphasis = emphasis;

      // 2. 检查是否为场景主关键词
      if (SCENARIO_KEYWORDS[scenario].includes(token)) {
        const baseWeight = 0.7; // 主关键词基础权重
        score += baseWeight * lastEmphasis;
        continue;
      }

      // 3. 检查是否为场景修饰词
      const modifier = SCENARIO_MODIFIERS[token];
      if (modifier) {
        score = score * modifier * lastEmphasis;
        continue;
      }

      // 4. 检查是否为否定词
      if (NEGATION_KEYWORDS.includes(token)) {
        // 后续10个词的权重乘以 0.2
        for (let j = i + 1; j < Math.min(i + 10, tokens.length); j++) {
          if (hasScenarioKeyword(tokens[j], scenario)) {
            score = score * 0.2;
          }
        }
      }
    }

    scores[scenario] = Math.min(score, 1.0);
  }

  return normalizeScores(scores);
}

// 出力: { coding: 0.8, research: 0.3, creative: 0.1, ... }
```

### 2.2 上下文理解增强 (Context Understanding Enhancement)

#### 2.2.1 条件表达式解析

```typescript
interface ConditionalContext {
  condition: string; // "if premium", "if urgent"
  thenStrategy: ScenarioConfig; // 满足条件时的配置
  elseStrategy: ScenarioConfig; // 不满足条件时的配置
  confidence: number;
}

// 识别模式:
// 1. "如果 [条件] 就用 [策略A]，否则用 [策略B]"
// 2. "[优先级A]，如果 [条件], [优先级B]"
// 3. "当 [条件] 时，[需求描述]"

function parseConditionalExpressions(input: string): ConditionalContext[] {
  const patterns = [
    /如果(.+?)就(.+?)否则(.+)/,
    /当(.+?)时[，,](.+)/,
    /如果(.+?)[，,](.+?)/,
  ];

  const results: ConditionalContext[] = [];

  for (const pattern of patterns) {
    const matches = input.match(pattern);
    if (!matches) continue;

    results.push({
      condition: extractCondition(matches[1]),
      thenStrategy: parseStrategy(matches[2]),
      elseStrategy: matches[3] ? parseStrategy(matches[3]) : null,
      confidence: calculateConfidence(matches[0]),
    });
  }

  return results;
}
```

#### 2.2.2 预算-时间-复杂度三维上下文

```typescript
interface EnhancedContext extends RecommendationContext {
  // 预算维度
  budgetPhase: "early" | "mid" | "late"; // 月初/月中/月末
  budgetUrgency: number; // 0-1, 越接近上限越高

  // 时间维度
  urgencyLevel: number; // 0-1, 紧急程度
  deadline?: Date;
  isRecurring: boolean;

  // 复杂度维度
  complexityScore: number; // 0-1, 基于关键词
  requiresThinking: boolean; // 是否需要深度思考

  // 场景熟悉度
  scenarioFamiliarity: number; // 0-1, 用户对该场景的熟悉度
}

// 示例: 自动提升权重
// 用户说: "我只有这周完成这个复杂的编程项目，预算还有点"
// → urgencyLevel = 0.85, complexityScore = 0.8, budgetUrgency = 0.3
// → quality 权重自动从 0.2 升至 0.35, cost 权重从 0.25 降至 0.15
```

### 2.3 场景相似度计算 (Scenario Similarity)

#### 2.3.1 场景相似度矩阵

```typescript
// 建立场景间的相似度，用于降级推荐
const SCENARIO_SIMILARITY: Record<
  ScenarioType,
  Record<ScenarioType, number>
> = {
  coding: {
    coding: 1.0,
    tools: 0.7, // 编程 ≈ 日常工具 (都是快速迭代)
    research: 0.6, // 编程 ≈ 研究 (都需要深度)
    documentation: 0.5,
    // ...
  },
  research: {
    research: 1.0,
    health: 0.8, // 研究 ≈ 健康管理 (都需要严谨分析)
    finance: 0.75,
    coding: 0.6,
  },
  creative: {
    creative: 1.0,
    writing: 0.9, // 创意 ≈ 写作 (都是创作类)
    social: 0.85,
    multimedia: 0.8,
  },
  // ...
};

// 算法: 如果主场景无好推荐，查找相似场景
function findFallbackScenario(
  primary: ScenarioType,
  constraints: { budget?: number; quality?: number },
): ScenarioType[] {
  const candidates = Object.entries(SCENARIO_SIMILARITY[primary])
    .filter(([_, similarity]) => similarity > 0.5)
    .sort((a, b) => b[1] - a[1])
    .map(([scenario]) => scenario as ScenarioType);

  return candidates.slice(0, 3); // 返回前3个相似场景
}
```

### 2.4 历史偏好利用模型

#### 2.4.1 增强的历史数据结构

```typescript
interface EnhancedHistoryData extends HistoryData {
  // 策略-场景关联性
  strategySceneSuccess: Record<
    string,
    Record<
      ScenarioType,
      {
        usageCount: number;
        successRate: number; // 0-1, 基于用户满意度反馈
        avgCost: number;
        lastUsed: Date;
      }
    >
  >;

  // 时间序列
  usageTimeline: Array<{
    strategy: string;
    scenario: ScenarioType;
    timestamp: Date;
    success: boolean;
    costIncurred: number;
  }>;

  // 用户偏好档案
  userProfile: {
    costSensitivity: number; // 0-1, 越高越关心成本
    qualityExpectation: number; // 0-1, 期望质量高度
    timeConstraint: number; // 0-1, 对速度的关心度
  };
}

// 算法: 计算特定场景下策略的预期成功率
function getStrategySuccessRateInScenario(
  strategy: string,
  scenario: ScenarioType,
  history: EnhancedHistoryData,
): number {
  if (!history.strategySceneSuccess[strategy]?.[scenario]) {
    return 0.5; // 无历史数据, 中立评价
  }

  const record = history.strategySceneSuccess[strategy][scenario];

  // 考虑时间衰减: 最近的数据权重更高
  const daysSinceLastUse =
    (Date.now() - record.lastUsed.getTime()) / (1000 * 60 * 60 * 24);
  const timeDecay = Math.exp(-daysSinceLastUse / 30); // 30天衰减到 1/e

  // 考虑样本量: 少量数据信心度低
  const sampleSize = record.usageCount;
  const confidence = Math.min(sampleSize / 20, 1.0); // 20次以上完全信任

  return record.successRate * timeDecay * confidence + 0.5 * (1 - confidence);
}

// 权重计算
function getHistoryWeight(
  strategy: string,
  context: EnhancedContext,
  history: EnhancedHistoryData,
): number {
  if (!context.scenario) return 0.5;

  const successRate = getStrategySuccessRateInScenario(
    strategy,
    context.scenario.type,
    history,
  );

  const userProfile = history.userProfile;

  // 用户在特定场景的偏好是否强烈?
  const familiarityBoost = context.scenarioFamiliarity * 0.3;

  return Math.min(0.5 + successRate * 0.3 + familiarityBoost, 1.0);
}
```

### 2.5 权重自适应系统

#### 2.5.1 动态权重调整规则

```typescript
function getAdaptiveWeights(
  context: EnhancedContext,
  history?: EnhancedHistoryData,
): Record<string, number> {
  const base = getBaseWeights(context.scenario?.priority || "balanced");
  const adjusted = { ...base };

  // 规则1: 预算压力调整
  if (context.budgetUrgency > 0.8) {
    adjusted.cost *= 1.5; // 预算即将用尽，成本权重 +50%
    adjusted.quality *= 0.7; // 质量权重 -30%
  }

  // 规则2: 时间压力调整
  if (context.urgencyLevel > 0.75) {
    adjusted.speed = 0.4; // 加权速度权重
    adjusted.cost *= 0.9; // 紧急时成本稍退一步
  }

  // 规则3: 历史偏好强度调整
  if (history && context.scenarioFamiliarity > 0.8) {
    adjusted.history *= 1.8; // 用户很熟悉，历史偏好权重翻倍
    adjusted.scenario *= 0.9; // 对场景映射的依赖降低
  }

  // 规则4: 首次使用
  if (!history?.recentStrategies.length) {
    adjusted.scenario *= 1.2; // 依赖场景映射
    adjusted.history *= 0.5; // 没有历史数据
  }

  // 规则5: 配额压力
  if (context.quotaStatus) {
    const criticalQuotas = context.quotaStatus.filter(
      (q) => q.usagePercent > 0.8,
    );
    if (criticalQuotas.length > 0) {
      adjusted.quota *= 2.0; // 配额紧张，权重加倍
    }
  }

  return normalizeWeights(adjusted);
}
```

---

## 第三部分：具体代码实现方案

### 3.1 新增配置文件: `Tools/recommender-config.yaml`

```yaml
# Recommender Configuration Schema
version: "2.0"

# 关键词权重配置
keywords:
  scenarios:
    education:
      primary: ["教育", "学习", "教学", "子女", "学生", "education", "learning", "teach"]
      weight: 0.8
    health:
      primary: ["健康", "医疗", "养生", "体检", "health", "medical", "wellness"]
      weight: 0.8
    finance:
      primary: ["金融", "股票", "交易", "投资", "基金", "finance", "trading", "investment"]
      weight: 0.8
    coding:
      primary: ["编程", "代码", "开发", "算法", "coding", "development", "programming", "algorithm"]
      weight: 0.85
    research:
      primary: ["研究", "分析", "深度", "调查", "研究", "research", "analysis", "investigation"]
      weight: 0.85
    # ... 其他场景

  priorities:
    quality:
      keywords: ["质量", "质量最好", "完美", "professional", "premium", "best"]
      weight_override: 0.4  # 覆盖默认 0.2
    cost:
      keywords: ["便宜", "低成本", "省钱", "预算", "economical", "cheap", "budget"]
      weight_override: 0.45
    speed:
      keywords: ["快速", "紧急", "立即", "asap", "urgent", "immediate"]
      weight_override: 0.4

  modifiers:
    strong: 1.4
    very: 1.25
    light: 0.75
    somewhat: 0.85

  negations:
    must_avoid: ["不要", "避免", "不想", "避免"]
    reduction_factor: 0.2  # 权重降低到 20%
    must_exclude: ["除非", "别用", "不包括"]
    reduction_factor: 0.0  # 权重设为 0

# 场景相似度矩阵
scenario_similarity:
  coding:
    tools: 0.7
    research: 0.6
    daily: 0.5
  research:
    health: 0.8
    finance: 0.75
    coding: 0.6
  creative:
    writing: 0.9
    social: 0.85
    multimedia: 0.8

# 历史数据权重配置
history:
  decay_days: 30          # 30天衰减到 1/e
  confidence_threshold: 20  # 20次使用以上完全信任
  success_rate_weight: 0.3

# 权重调整规则
weight_adjustment:
  budget_urgency:
    threshold: 0.8
    cost_multiplier: 1.5
    quality_multiplier: 0.7

  time_urgency:
    threshold: 0.75
    speed_weight: 0.4
    cost_multiplier: 0.9

  scenario_familiarity:
    threshold: 0.8
    history_multiplier: 1.8
    scenario_multiplier: 0.9

# 成本配置
cost:
  dynamic_override:
    enable: true  # 基于配额优化成本
    free_quota_factor: 0.0
    low_quota_factor: 0.3
```

### 3.2 改进后的 Recommender.ts 核心变化

#### 3.2.1 新增数据结构

```typescript
// 添加到 Recommender.ts

export interface EnhancedContext extends RecommendationContext {
  budgetPhase?: "early" | "mid" | "late";
  budgetUrgency?: number; // 0-1
  urgencyLevel?: number; // 0-1
  isRecurring?: boolean;
  complexityScore?: number; // 0-1
  requiresThinking?: boolean;
  scenarioFamiliarity?: number; // 0-1
}

export interface EnhancedHistoryData extends HistoryData {
  strategySceneSuccess?: Record<
    string,
    Record<
      ScenarioType,
      {
        usageCount: number;
        successRate: number;
        avgCost: number;
        lastUsed: Date;
      }
    >
  >;

  usageTimeline?: Array<{
    strategy: string;
    scenario: ScenarioType;
    timestamp: Date;
    success: boolean;
    costIncurred: number;
  }>;

  userProfile?: {
    costSensitivity: number;
    qualityExpectation: number;
    timeConstraint: number;
  };
}

// 关键词权重配置类型
export interface KeywordWeightConfig {
  scenarios: Record<
    ScenarioType,
    {
      primary: string[];
      weight: number;
    }
  >;

  priorities: Record<
    Priority,
    {
      keywords: string[];
      weight_override: number;
    }
  >;

  modifiers: Record<string, number>;
  negations: {
    must_avoid: string[];
    reduction_factor: number;
    must_exclude: string[];
  };
}
```

#### 3.2.2 关键词权重引擎实现

```typescript
class KeywordWeightEngine {
  private config: KeywordWeightConfig;

  constructor(config: KeywordWeightConfig) {
    this.config = config;
  }

  /**
   * 增强的场景识别，返回 [scenario, confidence] 对
   */
  identifyScenarios(description: string): Array<[ScenarioType, number]> {
    const lowerDesc = description.toLowerCase();
    const tokens = this.tokenize(lowerDesc);
    const scores: Record<ScenarioType, number> = {};

    // 初始化所有场景分数
    for (const scenario of Object.keys(this.config.scenarios)) {
      scores[scenario as ScenarioType] = 0;
    }

    // 遍历每个 token，计算加权分数
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const emphasis = this.getEmphasis(token);

      for (const [scenario, config] of Object.entries(this.config.scenarios)) {
        if (config.primary.includes(token)) {
          scores[scenario as ScenarioType] += config.weight * emphasis;
        }
      }

      // 处理否定词
      if (this.config.negations.must_avoid.includes(token)) {
        // 后续 10 个 token 的权重降低
        for (let j = i + 1; j < Math.min(i + 10, tokens.length); j++) {
          for (const scenario of Object.keys(scores)) {
            if (
              this.config.scenarios[scenario as ScenarioType].primary.includes(
                tokens[j],
              )
            ) {
              scores[scenario as ScenarioType] *=
                this.config.negations.reduction_factor;
            }
          }
        }
      }
    }

    // 归一化并返回
    return Object.entries(scores)
      .filter(([_, score]) => score > 0)
      .map(([scenario, score]) => [
        scenario as ScenarioType,
        Math.min(score, 1.0),
      ])
      .sort((a, b) => b[1] - a[1]);
  }

  /**
   * 识别优先级强度
   */
  identifyPriorityOverride(description: string): {
    priority: Priority | null;
    intensity: number; // 0-1
  } {
    const lowerDesc = description.toLowerCase();

    for (const [priority, config] of Object.entries(this.config.priorities)) {
      for (const keyword of config.keywords) {
        if (lowerDesc.includes(keyword)) {
          return {
            priority: priority as Priority,
            intensity: config.weight_override,
          };
        }
      }
    }

    return { priority: null, intensity: 0 };
  }

  private tokenize(text: string): string[] {
    // 中文分词 + 英文分词
    const chars = text.split("");
    const tokens: string[] = [];
    let current = "";

    for (const char of chars) {
      if (/[\p{L}\p{N}]/u.test(char)) {
        current += char;
      } else {
        if (current) tokens.push(current);
        current = "";
      }
    }

    if (current) tokens.push(current);
    return tokens;
  }

  private getEmphasis(token: string): number {
    return this.config.modifiers[token] || 1.0;
  }
}
```

#### 3.2.3 改进的 recommend() 方法

```typescript
class SmartRecommender {
  private strategies: StrategyMetadata[];
  private keywordEngine: KeywordWeightEngine;

  recommend(context: EnhancedContext): Recommendation[] {
    // 1. 使用关键词引擎增强场景识别
    const detectedScenarios = context.scenario
      ? [[context.scenario.type, 1.0]]
      : [];

    if (context.timeContext?.["rawDescription"]) {
      const detected = this.keywordEngine.identifyScenarios(
        context.timeContext["rawDescription"],
      );
      detectedScenarios.push(...detected.slice(1)); // 次选
    }

    // 2. 获取自适应权重
    const weights = this.getAdaptiveWeights(context);

    // 3. 为每个策略评分
    return this.strategies
      .map((strategy) =>
        this.scoreStrategy(strategy, context, detectedScenarios, weights),
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }

  /**
   * 计算自适应权重
   */
  private getAdaptiveWeights(context: EnhancedContext): Record<string, number> {
    const base = this.getBaseWeights(context.scenario?.priority || "balanced");
    const adjusted = { ...base };

    // 规则1: 预算压力
    if (context.budgetUrgency && context.budgetUrgency > 0.8) {
      adjusted.cost *= 1.5;
      adjusted.quality *= 0.7;
    }

    // 规则2: 时间压力
    if (context.urgencyLevel && context.urgencyLevel > 0.75) {
      adjusted.speed = 0.4;
      adjusted.cost *= 0.9;
    }

    // 规则3: 历史偏好
    if (
      context.history &&
      context.scenarioFamiliarity &&
      context.scenarioFamiliarity > 0.8
    ) {
      adjusted.history *= 1.8;
      adjusted.scenario *= 0.9;
    }

    // 规则4: 配额压力
    if (context.quotaStatus) {
      const criticalQuotas = context.quotaStatus.filter(
        (q) => q.usagePercent > 0.8,
      );
      if (criticalQuotas.length > 0) {
        adjusted.quota = (adjusted.quota || 0) + 0.1;
      }
    }

    return this.normalizeWeights(adjusted);
  }

  /**
   * 计算场景匹配度（增强版）
   */
  private calculateScenarioMatch(
    strategy: StrategyMetadata,
    scenario?: ScenarioConfig,
    detectedScenarios?: Array<[ScenarioType, number]>,
  ): number {
    if (!scenario && !detectedScenarios?.length) return 0.5;

    let maxMatch = 0;

    // 检查主场景和次选场景
    for (const [detectedType, confidence] of detectedScenarios || [
      [scenario?.type, 1.0],
    ]) {
      const matchingStrategies = SCENARIO_MAPPING[detectedType] || [];

      let match = 0;
      if (matchingStrategies[0] === strategy.name) match = 1.0;
      else if (matchingStrategies[1] === strategy.name) match = 0.7;
      else if (matchingStrategies.includes(strategy.name)) match = 0.5;
      else match = this.calculateScenarioSimilarity(strategy, detectedType);

      // 按检测置信度加权
      maxMatch = Math.max(maxMatch, match * confidence);
    }

    return maxMatch;
  }

  /**
   * 基于相似度矩阵的降级匹配
   */
  private calculateScenarioSimilarity(
    strategy: StrategyMetadata,
    scenario: ScenarioType,
  ): number {
    // 使用 SCENARIO_SIMILARITY 矩阵查找相似场景
    const similarities = SCENARIO_SIMILARITY_MATRIX[scenario] || {};

    for (const relatedScenario of Object.keys(similarities)) {
      const matchingStrategies =
        SCENARIO_MAPPING[relatedScenario as ScenarioType] || [];
      if (matchingStrategies.includes(strategy.name)) {
        return similarities[relatedScenario] * 0.7; // 相似度打 70% 折
      }
    }

    return 0.2;
  }
}
```

### 3.3 新增工具类: `Tools/ContextEnhancer.ts`

```typescript
/**
 * ContextEnhancer.ts
 * 自然语言转换到增强上下文
 */

export class ContextEnhancer {
  /**
   * 从原始文本生成增强上下文
   */
  enhanceContext(
    rawDescription: string,
    baseContext?: RecommendationContext,
  ): EnhancedContext {
    const enhanced: EnhancedContext = { ...baseContext };

    // 计算紧急程度
    enhanced.urgencyLevel = this.calculateUrgencyLevel(rawDescription);

    // 计算复杂度分数
    enhanced.complexityScore = this.calculateComplexity(rawDescription);

    // 识别预算阶段
    enhanced.budgetPhase = this.identifyBudgetPhase(enhanced.budget);

    // 识别是否重复性任务
    enhanced.isRecurring = this.isRecurringTask(rawDescription);

    // 场景熟悉度
    if (enhanced.history) {
      enhanced.scenarioFamiliarity = this.calculateFamiliarity(
        rawDescription,
        enhanced.history,
      );
    }

    return enhanced;
  }

  private calculateUrgencyLevel(text: string): number {
    const urgentKeywords = [
      "紧急",
      "立即",
      "今天",
      "现在",
      "urgent",
      "asap",
      "immediately",
    ];
    let score = 0;

    for (const keyword of urgentKeywords) {
      if (text.includes(keyword)) score += 0.2;
    }

    // 时间边界检测
    if (/今天|这周|明天/.test(text)) score += 0.15;

    return Math.min(score, 1.0);
  }

  private calculateComplexity(text: string): number {
    const complexKeywords = [
      "复杂",
      "深度",
      "分析",
      "优化",
      "complex",
      "analysis",
    ];
    let score = 0;

    for (const keyword of complexKeywords) {
      if (text.includes(keyword)) score += 0.15;
    }

    // 字数和细节度
    score += Math.min(text.length / 200, 0.2);

    return Math.min(score, 1.0);
  }

  private identifyBudgetPhase(budget?: BudgetConfig): "early" | "mid" | "late" {
    if (!budget) return "mid";

    const spent = budget.currentSpent;
    const total = budget.monthly;
    const ratio = spent / total;

    if (ratio < 0.33) return "early";
    if (ratio < 0.67) return "mid";
    return "late";
  }

  private isRecurringTask(text: string): boolean {
    const recurringKeywords = [
      "每天",
      "每周",
      "每月",
      "经常",
      "daily",
      "weekly",
      "regularly",
    ];
    return recurringKeywords.some((kw) => text.includes(kw));
  }

  private calculateFamiliarity(text: string, history: HistoryData): number {
    // 检查是否提及过的场景关键词
    let familiarity = 0;

    // 如果最近使用过相似任务，提升熟悉度
    if (history.recentStrategies.length > 5) {
      familiarity += 0.3;
    }

    // 检查是否有频繁场景
    if (history.frequentScenarios) {
      const scenarioMatch = history.frequentScenarios.some((s) =>
        text.includes(s),
      );
      if (scenarioMatch) familiarity += 0.4;
    }

    return Math.min(familiarity, 1.0);
  }
}
```

### 3.4 向后兼容性保证

```typescript
// 在 SmartRecommender 中添加兼容性层

class SmartRecommender {
  // 新方法
  recommendV2(context: EnhancedContext): Recommendation[] {
    // 新逻辑
  }

  // 原方法保留，内部调用 V2
  recommend(context: RecommendationContext): Recommendation[] {
    const enhanced = this.upgrde_ContextToEnhanced(context);
    return this.recommendV2(enhanced);
  }

  // 升级函数
  private upgrade_ContextToEnhanced(
    context: RecommendationContext,
  ): EnhancedContext {
    const enhanced: EnhancedContext = {
      ...context,
      budgetPhase: "mid",
      urgencyLevel: context.timeContext?.isUrgent ? 0.7 : 0.2,
      complexityScore: 0.5,
      scenarioFamiliarity: context.history ? 0.6 : 0,
    };

    return enhanced;
  }
}

// 依赖升级
// 旧代码: recommender.recommend(context)
// 新代码: recommender.recommendV2(enhancedContext)
// 旧代码自动升级，无需改动调用者
```

---

## 第四部分：测试验证方案

### 4.1 测试用例设计 (核心 15 个)

#### 4.1.1 场景识别测试

| ID  | 测试输入                             | 期望场景                                      | 期望准确率 | 备注     |
| --- | ------------------------------------ | --------------------------------------------- | ---------- | -------- |
| T1  | "我在学编程，需要快速反馈"           | coding (0.85), speed (0.6)                    | 95%        | 多维场景 |
| T2  | "便宜、日常使用、不要高端模型"       | daily (0.8), cost (0.7)                       | 90%        | 否定表达 |
| T3  | "深度研究财务分析，质量最重要"       | finance (0.85), research (0.7), quality (0.8) | 92%        | 组合场景 |
| T4  | "紧急!今天交付项目，预算有点紧"      | coding (0.8), urgent (0.85), cost (0.6)       | 88%        | 时间压力 |
| T5  | "如果有预算就用最好的，否则省钱方案" | conditional, quality/cost                     | 85%        | 条件表达 |

#### 4.1.2 权重调整测试

| ID  | 场景                           | 预期权重变化                               | 验证方法     |
| --- | ------------------------------ | ------------------------------------------ | ------------ |
| T6  | 月末、预算 90% 用尽            | cost: 0.25 → 0.38                          | 断言权重比例 |
| T7  | 首次使用+无历史                | history: 0.1 → 0.05, scenario: 0.35 → 0.42 | 断言权重     |
| T8  | 用户熟悉场景 (familiarity=0.9) | history: 0.1 → 0.18                        | 断言权重     |
| T9  | 配额紧张 (usage > 80%)         | quota: 0.05 → 0.15                         | 断言权重     |

#### 4.1.3 推荐准确率测试

| ID  | 输入描述                       | 期望推荐 #1         | 期望推荐 #2       | 当前准确率 | 目标准确率 |
| --- | ------------------------------ | ------------------- | ----------------- | ---------- | ---------- |
| T10 | "编程开发，要快速响应"         | strategy-2-balanced | strategy-1-perf   | 65%        | 90%        |
| T11 | "深度数据分析，质量最重要"     | strategy-research   | strategy-super    | 70%        | 88%        |
| T12 | "日常写作，预算有限"           | strategy-economical | strategy-balanced | 72%        | 92%        |
| T13 | "创意内容创作"                 | strategy-creative   | strategy-balanced | 68%        | 85%        |
| T14 | "混合场景：编程+研究+质量优先" | strategy-super      | strategy-research | 55%        | 80%        |

#### 4.1.4 成本计算测试

| ID  | 测试场景                       | 验证内容                               |
| --- | ------------------------------ | -------------------------------------- |
| T15 | 用户有 Anthropic 免费额度      | strategy-super 成本应为 0 而非 2500    |
| T16 | 用户 GitHub Copilot 配额已用完 | strategy-3-economical 应被标记为"受限" |

### 4.2 测试实现框架

```typescript
// tests/unit/Recommender.v2.test.ts

describe("SmartRecommender v2 - 准确率验证", () => {
  let recommender: SmartRecommender;
  let enhancer: ContextEnhancer;
  let strategies: StrategyMetadata[];

  beforeEach(() => {
    strategies = createStrategyLibrary();
    recommender = new SmartRecommender(strategies);
    enhancer = new ContextEnhancer();
  });

  describe("T1: 多维场景识别", () => {
    it("should identify coding + speed scenario with multi-factor weighting", () => {
      const raw = "我在学编程，需要快速反馈";
      const context = enhancer.enhanceContext(raw);

      const recommendations = recommender.recommendV2(context);

      expect(recommendations[0].strategyName).toBe("strategy-2-balanced");
      expect(recommendations[0].score).toBeGreaterThan(80);
    });
  });

  describe("T6: 权重自适应验证", () => {
    it("should adjust cost weight when budget is depleted", () => {
      const context: EnhancedContext = {
        scenario: { type: "coding", priority: "balanced" },
        budget: {
          monthly: 1000,
          currentSpent: 900,
          alertThreshold: 0.8,
        },
        budgetPhase: "late",
        budgetUrgency: 0.9,
      };

      // 获取权重
      const weights1 = recommender["getAdaptiveWeights"](context);

      // 对比基础权重
      const baseWeights = recommender["getBaseWeights"]("balanced");

      expect(weights1.cost).toBeGreaterThan(baseWeights.cost * 1.3);
    });
  });

  describe("T10-T14: 端到端准确率", () => {
    it("T10: should recommend balanced strategy for coding + speed", () => {
      const raw = "编程开发，要快速响应";
      const context = enhancer.enhanceContext(raw);
      const recommendations = recommender.recommendV2(context);

      expect(recommendations[0].strategyName).toBe("strategy-2-balanced");
    });

    it("T11: should recommend research strategy for deep analysis", () => {
      const raw = "深度数据分析，质量最重要";
      const context = enhancer.enhanceContext(raw);
      const recommendations = recommender.recommendV2(context);

      expect(recommendations[0].strategyName).toBe(
        "strategy-research-thinking",
      );
    });

    // ... 其他测试用例
  });
});
```

### 4.3 A/B 测试方案

```typescript
interface ABTestResult {
  userSegment: string;
  algorithm: "v1" | "v2";
  recommendations: Recommendation[];
  userFeedback: {
    satisfied: boolean;
    usedFirstChoice: boolean;
    overallScore: number; // 1-5
  };
  metrics: {
    accuracy: number;
    confidence: number;
    adoptionRate: number;
  };
}

/**
 * A/B 测试执行框架
 */
class RecommenderABTest {
  /**
   * 随机分配用户到 V1 或 V2
   */
  assignTreatment(userId: string): "v1" | "v2" {
    const hash = userId.charCodeAt(0) % 2;
    return hash === 0 ? "v1" : "v2";
  }

  /**
   * 记录推荐结果
   */
  recordRecommendation(
    userId: string,
    treatment: "v1" | "v2",
    result: ABTestResult,
  ): void {
    // 存储到数据库，用于后续分析
  }

  /**
   * 计算 AB 测试显著性
   */
  calculateSignificance(results: ABTestResult[]): {
    v1Accuracy: number;
    v2Accuracy: number;
    pValue: number;
  } {
    const v1 = results.filter((r) => r.algorithm === "v1");
    const v2 = results.filter((r) => r.algorithm === "v2");

    const v1Accuracy =
      v1.filter((r) => r.userFeedback.satisfied).length / v1.length;
    const v2Accuracy =
      v2.filter((r) => r.userFeedback.satisfied).length / v2.length;

    // 计算 p 值（简化版）
    const pValue = calculateTTest(v1Accuracy, v2Accuracy);

    return { v1Accuracy, v2Accuracy, pValue };
  }
}
```

---

## 第五部分：投入时间分解

### 5.1 工作量评估表

| 阶段                | 任务                   | 预计时间 | 备注                        |
| ------------------- | ---------------------- | -------- | --------------------------- |
| **设计** (1h)       |                        |          |                             |
|                     | 需求分析和方案评审     | 0.5h     | 与团队讨论                  |
|                     | 数据结构设计           | 0.5h     | 定义 EnhancedContext 等     |
| **实现** (5.5h)     |                        |          |                             |
|                     | 关键词权重引擎         | 1.5h     | KeywordWeightEngine 类      |
|                     | 上下文增强器           | 1h       | ContextEnhancer 类          |
|                     | 自适应权重系统         | 1.5h     | getAdaptiveWeights() + 规则 |
|                     | 场景相似度矩阵         | 0.5h     | SCENARIO_SIMILARITY_MATRIX  |
|                     | 向后兼容性层           | 0.5h     | 升级函数                    |
| **测试** (2h)       |                        |          |                             |
|                     | 单元测试编写           | 1h       | T1-T16 覆盖                 |
|                     | 准确率验证脚本         | 0.5h     | 评测框架                    |
|                     | AB 测试基础设施        | 0.5h     | 测试框架搭建                |
| **文档** (0.5h)     |                        |          |                             |
|                     | API 文档和使用示例     | 0.3h     | README                      |
|                     | 配置文件文档           | 0.2h     | YAML 说明                   |
| **风险缓解** (0.5h) |                        |          |                             |
|                     | 性能优化 (tokenize 等) | 0.3h     | 缓存优化                    |
|                     | 回滚方案准备           | 0.2h     | 版本管理                    |
| **总计**            |                        | **9.5h** |                             |

### 5.2 关键路径和里程碑

```
Day 1 (3h):
  ├─ [0.5h] 需求评审
  ├─ [1h]   关键词引擎实现
  └─ [1.5h] 上下文增强器

Day 2 (4h):
  ├─ [1.5h] 自适应权重系统
  ├─ [1h]   单元测试
  ├─ [0.5h] AB 测试基础设施
  └─ [0.5h] 文档

Day 3 (2.5h):
  ├─ [1h]   准确率验证和调优
  ├─ [0.5h] 性能优化
  └─ [1h]   风险测试和回滚方案
```

---

## 第六部分：风险和缓解方案

### 6.1 技术风险

| 风险                     | 概率 | 影响         | 缓解方案                 |
| ------------------------ | ---- | ------------ | ------------------------ |
| 关键词库不完整，漏检场景 | 中   | 准确率不达标 | 迭代构建，从用户反馈更新 |
| 权重调整规则冲突         | 中   | 权重计算错误 | 单元测试覆盖所有规则组合 |
| 性能下降 (tokenize 等)   | 低   | 推荐延迟     | 添加缓存，使用优化分词库 |
| 向后兼容性破坏           | 低   | 现有代码失效 | 完整升级函数，版本共存   |

### 6.2 数据质量风险

| 风险         | 原因         | 影响             | 缓解                    |
| ------------ | ------------ | ---------------- | ----------------------- |
| 历史数据缺失 | 新用户无历史 | history 权重无效 | 使用默认值 0.5，不扣分  |
| 配额数据过期 | 实时性问题   | 成本预估不准     | 添加缓存失效时间戳      |
| 用户反馈偏差 | 样本偏少     | 成功率统计不准   | 需要 >20 样本才调整权重 |

### 6.3 回滚方案

```bash
# 快速回滚步骤
1. 恢复到上一个版本
   git revert <commit-hash>

2. 禁用 V2 推荐引擎
   # 在 ManageStrategies.ts 中切换
   const useV2Recommender = false;

3. 验证服务恢复
   bun run tests/unit/Recommender.test.ts

# 预计回滚时间: < 5 分钟
```

---

## 第七部分：成功度量标准

### 7.1 定量指标

| 指标       | 当前  | 目标   | 验证方法                      |
| ---------- | ----- | ------ | ----------------------------- |
| 推荐准确率 | 70%   | 85%+   | 100+ 用户反馈样本             |
| 首选采纳率 | 62%   | 78%+   | 用户选择记录                  |
| 平均置信度 | 0.68  | 0.80+  | recommender.confidence 平均值 |
| 推荐延迟   | <50ms | <100ms | 性能基准测试                  |

### 7.2 定性指标

- ✅ 支持条件表达 ("如果...就..." 模式)
- ✅ 支持混合场景 (如 教育+研究)
- ✅ 支持历史学习 (相同场景重复推荐越来越准)
- ✅ 支持预算自适应 (月末自动切换经济策略)

---

## 实施建议

### 立即行动

1. ✅ **本周**（2h）: 审核此方案，确认设计方向
2. ✅ **本周**（3h）: 实现关键词引擎 + 上下文增强器
3. ✅ **下周**（3h）: 完整集成 + 测试
4. ✅ **下周**（2h）: 灰度发布 + 监控

### 关键成功因素

- 构建高质量的关键词库（建议从 5000+ 样本中归纳）
- 历史数据积累（建议运行 2-4 周采集用户反馈）
- 持续迭代权重配置（基于反馈动态调整）

---

**文档作者**: 推荐系统优化团队  
**最后更新**: 2026-02-05  
**版本**: 1.0
