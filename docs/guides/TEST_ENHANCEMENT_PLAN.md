# StrategyManager 测试覆盖补充方案

**分析日期**: 2026-02-05  
**当前覆盖率**: 88%  
**目标覆盖率**: 95%+  
**优先级**: 高 - 关键模块零覆盖

---

## 📊 执行摘要

### 关键发现

| 模块            | 当前状态 | 复杂度 | 风险等级 | 投入估算       |
| --------------- | -------- | ------ | -------- | -------------- |
| **PathManager** | 0 测试   | 低-中  | 🔴 高    | 6-8 小时       |
| **Validator**   | 0 测试   | 中-高  | 🔴 高    | 12-16 小时     |
| **Recommender** | 0 测试   | 高     | 🔴 极高  | 16-20 小时     |
| **总计**        |          |        |          | **34-44 小时** |

### 为什么这三个模块至关重要？

```
StrategyManager 架构：
┌─────────────────────────────────────┐
│    ManageStrategies (已覆盖 ✓)      │  <- CLI 入口、核心业务逻辑
├─────────────────────────────────────┤
│   ┌──────────┬───────────┬────────┐ │
│   │PathManager │Validator│Recommender│  <- 支撑层（零覆盖 ✗）
│   │ (路径管理) │(策略验证)│(智能推荐)  │
│   └──────────┴───────────┴────────┘ │
└─────────────────────────────────────┘

关键约束：
- PathManager：系统初始化的基础，所有文件操作都依赖它
- Validator：保证配置安全，防止无效策略部署
- Recommender：用户体验核心，推荐算法的准确性直接影响用户满意度
```

---

## 1️⃣ PathManager 模块测试方案

### 1.1 模块职责分析

```typescript
PathManager 的核心职责：
├── 初始化系统 (ensureDirectories)
│   └── 创建必要的目录结构
├── 路径管理 (15+ 个 getter 方法)
│   ├── 配置目录 (getConfigDir, getConfigFile)
│   ├── 策略目录 (getStrategiesDir, getStrategyFilePath)
│   ├── 模板目录 (getTemplatesDir, getTemplateFilePath)
│   ├── 备份目录 (getBackupDir)
│   └── 历史记录 (getHistoryFile, getRecommendationFeedbackFile)
├── 文件系统检查 (listInstalledStrategies, listTemplates)
├── 状态查询 (isStrategyInstalled, getModeDescription)
└── 动态功能 (getDynamicStrategiesDir)
```

### 1.2 测试难度评估

| 难度维度    | 评分   | 说明                      |
| ----------- | ------ | ------------------------- |
| 依赖性      | ⭐     | 仅依赖 fs、path (标准库)  |
| Mock 复杂度 | ⭐⭐   | 需要 Mock fs 调用         |
| 环境隔离    | ⭐⭐⭐ | 需要临时目录和清理        |
| 跨平台      | ⭐⭐   | 路径分隔符、HOME 环境变量 |
| **总体**    | **低** | 适合快速补充              |

### 1.3 测试用例清单 (10+ 用例)

#### 分类 A: 构造器与初始化 (3 用例)

| #   | 用例名称         | 场景                                                                | 预期结果                        | 优先级 |
| --- | ---------------- | ------------------------------------------------------------------- | ------------------------------- | ------ |
| 1   | 用户模式初始化   | `new PathManager({ mode: 'user' })`                                 | 正确读取 `~/.config/opencode`   | 🔴 P0  |
| 2   | 项目模式初始化   | `new PathManager({ mode: 'project' })`                              | 正确读取 `__dirname/../.config` | 🔴 P0  |
| 3   | 自定义模式初始化 | `new PathManager({ mode: 'custom', customConfigDir: '/tmp/test' })` | 使用自定义路径                  | 🔴 P0  |

**实现建议**:

```typescript
test("user mode should resolve to ~/.config/opencode", () => {
  const pm = new PathManager({ mode: "user" });
  const configDir = pm.getConfigDir();

  expect(configDir).toContain(".config/opencode");
  expect(configDir).toMatch(new RegExp(`^${process.env.HOME}`));
});
```

#### 分类 B: 目录创建与管理 (2 用例)

| #   | 用例名称       | 场景                           | 预期结果               | 优先级 |
| --- | -------------- | ------------------------------ | ---------------------- | ------ |
| 4   | 目录结构创建   | 调用 `ensureDirectories()`     | 创建 4 个必要目录      | 🔴 P0  |
| 5   | 重复调用幂等性 | 两次调用 `ensureDirectories()` | 第二次不报错，目录保持 | 🟡 P1  |

**实现建议**:

```typescript
test("ensureDirectories should create all required directories", () => {
  const tempDir = "/tmp/pm-test";
  const pm = new PathManager({
    mode: "custom",
    customConfigDir: tempDir,
  });

  // 清理
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true });
  }

  pm.ensureDirectories();

  expect(fs.existsSync(path.join(tempDir, "strategies"))).toBe(true);
  expect(fs.existsSync(path.join(tempDir, "dynamic-strategies"))).toBe(true);
  expect(fs.existsSync(path.join(tempDir, "backups"))).toBe(true);
});
```

#### 分类 C: 路径解析 (3 用例)

| #   | 用例名称     | 场景                                       | 预期结果                                      | 优先级 |
| --- | ------------ | ------------------------------------------ | --------------------------------------------- | ------ |
| 6   | 策略文件路径 | `getStrategyFilePath('strategy-balanced')` | 返回 `.../strategies/strategy-balanced.jsonc` | 🔴 P0  |
| 7   | 模板文件路径 | `getTemplateFilePath('strategy-0-super')`  | 返回 `.../templates/strategy-0-super.jsonc`   | 🔴 P0  |
| 8   | 路径依赖关系 | 验证备份目录、历史文件都在配置目录下       | 路径结构一致                                  | 🟡 P1  |

**实现建议**:

```typescript
test("paths should maintain consistent hierarchy", () => {
  const pm = new PathManager({ mode: "user" });
  const configDir = pm.getConfigDir();

  expect(pm.getStrategiesDir()).toContain(configDir);
  expect(pm.getBackupDir()).toContain(configDir);
  expect(pm.getHistoryFile()).toContain(configDir);
});
```

#### 分类 D: 文件系统检查 (2 用例)

| #   | 用例名称         | 场景                                       | 预期结果                        | 优先级 |
| --- | ---------------- | ------------------------------------------ | ------------------------------- | ------ |
| 9   | 列出已安装策略   | 策略目录有 3 个 `.jsonc` 文件              | 返回 3 个策略名称               | 🔴 P0  |
| 10  | 检查策略安装状态 | `isStrategyInstalled('strategy-balanced')` | 存在时返回 true，不存在时 false | 🔴 P0  |

**实现建议**:

```typescript
test("listInstalledStrategies should filter jsonc files", () => {
  const tempDir = "/tmp/pm-test-strategies";
  fs.mkdirSync(tempDir, { recursive: true });

  // 创建测试文件
  fs.writeFileSync(path.join(tempDir, "strategy-test.jsonc"), "{}");
  fs.writeFileSync(path.join(tempDir, "other-file.txt"), "ignore");

  const pm = new PathManager({
    mode: "custom",
    customStrategiesDir: tempDir,
  });

  const strategies = pm.listInstalledStrategies();
  expect(strategies).toContain("strategy-test");
  expect(strategies).not.toContain("other-file");
});
```

### 1.4 Mock 策略 & 测试环境

```typescript
// 环境隔离：使用临时目录
const TEST_TEMP_DIR = "/tmp/pm-test-" + Date.now();

beforeEach(() => {
  if (!fs.existsSync(TEST_TEMP_DIR)) {
    fs.mkdirSync(TEST_TEMP_DIR, { recursive: true });
  }
});

afterEach(() => {
  if (fs.existsSync(TEST_TEMP_DIR)) {
    fs.rmSync(TEST_TEMP_DIR, { recursive: true });
  }
});

// Mock 环境变量
test("should handle missing HOME", () => {
  const oldHome = process.env.HOME;
  delete process.env.HOME;

  const pm = new PathManager({ mode: "user" });
  const configDir = pm.getConfigDir();

  expect(configDir).toBeDefined();

  process.env.HOME = oldHome;
});
```

### 1.5 时间投入估算 - PathManager

| 任务               | 时间         | 说明                   |
| ------------------ | ------------ | ---------------------- |
| 编写 10 个测试用例 | 3-4 小时     | 每个用例 20-25 分钟    |
| Mock 和环境隔离    | 1-2 小时     | 处理 fs 的 Mock 和清理 |
| 跨平台兼容性测试   | 1-2 小时     | 处理路径分隔符差异     |
| 测试审查与优化     | 1 小时       | 代码质量检查           |
| **小计**           | **6-8 小时** |                        |

---

## 2️⃣ Validator 模块测试方案

### 2.1 模块职责分析

```typescript
StrategyValidator 的核心职责：
├── 主验证 (validate)
│   └── 综合所有子验证方法
├── Schema 验证 (validateSchema)
│   ├── 检查 description 必需性
│   ├── 检查 agents/categories 互斥性
│   └── 验证 model 字段存在性
├── 模型可用性 (validateModelAvailability)
│   ├── 已知模型库 (18+ 个模型)
│   └── 版本检查和更新提示
├── 成本合理性 (validateCostReasonableness)
│   ├── 高成本模型检测
│   └── 预算警告
├── 并发配置 (validateConcurrency)
│   ├── opus 模型限制检查
│   └── GitHub Copilot 配额检查
├── GitHub Copilot 利用率 (validateGitHubCopilotUsage)
│   ├── 利用率计算
│   └── 免费模型使用建议
└── 建议生成 (generateSuggestions)
    └── 综合所有验证结果生成优化建议
```

### 2.2 测试难度评估

| 难度维度    | 评分      | 说明                       |
| ----------- | --------- | -------------------------- |
| 依赖性      | ⭐⭐      | 仅需要 StrategyConfig 类型 |
| Mock 复杂度 | ⭐⭐⭐    | 需要构造复杂的 config 对象 |
| 用例覆盖    | ⭐⭐⭐⭐  | 6 种验证方法 × 多条分支    |
| 边界情况    | ⭐⭐⭐⭐  | 很多组合逻辑               |
| **总体**    | **中-高** | 用例多、逻辑复杂           |

### 2.3 测试用例清单 (15+ 用例)

#### 分类 A: Schema 验证 (4 用例)

| #   | 用例名称               | 输入                                                | 预期                          | 优先级 |
| --- | ---------------------- | --------------------------------------------------- | ----------------------------- | ------ |
| 1   | 缺少 description       | `{ agents: {...} }`                                 | errors 包含 description       | 🔴 P0  |
| 2   | 缺少 agents/categories | `{ description: 'test' }`                           | errors 包含 agents/categories | 🔴 P0  |
| 3   | agents 缺少 model      | `{ description: 'test', agents: { main: {} } }`     | errors 包含 model 错误        | 🔴 P0  |
| 4   | categories 缺少 model  | `{ description: 'test', categories: { main: {} } }` | errors 包含 model 错误        | 🔴 P0  |

**实现建议**:

```typescript
test("should detect missing required fields", () => {
  const validator = new StrategyValidator();

  const invalidConfig = {
    agents: {
      main: { model: "claude" },
    },
    // 缺少 description
  };

  const result = validator.validate(invalidConfig);

  expect(result.valid).toBe(false);
  expect(result.errors).toContainEqual(
    expect.objectContaining({ field: "description" }),
  );
});

test("should ensure agents and categories have models", () => {
  const validator = new StrategyValidator();

  const config = {
    description: "Test",
    agents: {
      incomplete: {}, // 缺少 model
    },
  };

  const result = validator.validate(config);

  expect(result.errors.some((e) => e.field.includes("model"))).toBe(true);
});
```

#### 分类 B: 模型可用性检查 (3 用例)

| #   | 用例名称     | 输入                             | 预期                        | 优先级 |
| --- | ------------ | -------------------------------- | --------------------------- | ------ |
| 5   | 已知模型通过 | 使用 `anthropic/claude-opus-4-5` | warnings 不包含模型警告     | 🔴 P0  |
| 6   | 未知模型警告 | 使用 `unknown/model-xyz`         | warnings 包含模型可用性警告 | 🔴 P0  |
| 7   | 过时模型提示 | 使用已弃用的 `gpt-3.5-turbo`     | warnings 包含更新建议       | 🟡 P1  |

**实现建议**:

```typescript
test("should warn about unknown models", () => {
  const validator = new StrategyValidator();

  const config = {
    description: "Test",
    agents: {
      main: { model: "unknown/future-model-v99" },
    },
  };

  const result = validator.validate(config);

  expect(result.warnings.length).toBeGreaterThan(0);
  expect(result.warnings[0].message).toContain("可能不可用");
});
```

#### 分类 C: 成本合理性检查 (3 用例)

| #   | 用例名称       | 输入                               | 预期                  | 优先级 |
| --- | -------------- | ---------------------------------- | --------------------- | ------ |
| 8   | 高成本模型识别 | `anthropic/claude-opus-4-5` (3 个) | info 包含高成本提示   | 🟡 P1  |
| 9   | 成本过多警告   | 4 个高成本模型                     | warnings 包含成本过多 | 🟡 P1  |
| 10  | 平衡策略       | 混合高中低成本模型                 | 无过度警告            | 🟡 P1  |

**实现建议**:

```typescript
test("should warn when using too many expensive models", () => {
  const validator = new StrategyValidator();

  const config = {
    description: "Expensive strategy",
    agents: {
      a: { model: "anthropic/claude-opus-4-5" },
      b: { model: "github-copilot/claude-opus-4-5" },
      c: { model: "anthropic/claude-opus-4-5" },
      d: { model: "anthropic/claude-opus-4-5" },
    },
  };

  const result = validator.validate(config);

  const costWarning = result.warnings.find((w) => w.field === "cost");
  expect(costWarning).toBeDefined();
  expect(costWarning?.message).toContain("高成本");
});
```

#### 分类 D: 并发配置检查 (2 用例)

| #   | 用例名称              | 输入                    | 预期                    | 优先级 |
| --- | --------------------- | ----------------------- | ----------------------- | ------ |
| 11  | 高成本模型高并发      | opus 模型并发=5         | warnings 提示降低并发   | 🟡 P1  |
| 12  | GitHub Copilot 高并发 | github-copilot 并发=100 | warnings 提示可能超配额 | 🟡 P1  |

**实现建议**:

```typescript
test("should warn about high concurrency on expensive models", () => {
  const validator = new StrategyValidator();

  const config = {
    description: "Test",
    agents: { main: { model: "anthropic/claude-opus-4-5" } },
    background_task: {
      modelConcurrency: {
        "anthropic/claude-opus-4-5": 10, // 过高
      },
    },
  };

  const result = validator.validate(config);

  const concurrencyWarning = result.warnings.find((w) =>
    w.field.includes("modelConcurrency"),
  );
  expect(concurrencyWarning).toBeDefined();
});
```

#### 分类 E: GitHub Copilot 利用率检查 (2 用例)

| #   | 用例名称     | 输入                   | 预期                  | 优先级 |
| --- | ------------ | ---------------------- | --------------------- | ------ |
| 13  | 利用率过低   | 仅 5% 模型使用 Copilot | warnings 建议增加使用 | 🟡 P1  |
| 14  | 未用免费模型 | Copilot 但不用免费型   | info 提示可用免费模型 | 🟡 P1  |

#### 分类 F: 综合验证 (2 用例)

| #   | 用例名称     | 输入                     | 预期                       | 优先级 |
| --- | ------------ | ------------------------ | -------------------------- | ------ |
| 15  | 完全有效配置 | 标准的 balanced 策略     | valid=true, suggestions=[] | 🔴 P0  |
| 16  | 多错误配置   | 缺 description、model 等 | 多个 errors，valid=false   | 🔴 P0  |

**实现建议**:

```typescript
test("should accept valid balanced strategy", () => {
  const validator = new StrategyValidator();

  const validConfig = {
    description: "Balanced strategy",
    agents: {
      default: { model: "anthropic/claude-sonnet-4-5" },
      coding: { model: "github-copilot/gpt-5-mini" },
    },
  };

  const result = validator.validate(validConfig);

  expect(result.valid).toBe(true);
  expect(result.errors.length).toBe(0);
});
```

### 2.4 Mock 策略 & 测试环境

```typescript
// Mock StrategyConfig 工厂
function createMockConfig(overrides: Partial<StrategyConfig> = {}) {
  return {
    description: "Test Strategy",
    agents: {
      default: { model: "anthropic/claude-sonnet-4-5" },
    },
    ...overrides,
  };
}

// 测试工具函数
function findError(result: ValidationResult, field: string) {
  return result.errors.find((e) => e.field === field);
}

function findWarning(result: ValidationResult, keyword: string) {
  return result.warnings.find((w) => w.message.includes(keyword));
}
```

### 2.5 时间投入估算 - Validator

| 任务              | 时间           | 说明                 |
| ----------------- | -------------- | -------------------- |
| 编写 15+ 测试用例 | 5-7 小时       | 逻辑复杂，需要多组合 |
| Mock 配置对象     | 1-2 小时       | 构造各类无效配置     |
| 覆盖边界情况      | 2-3 小时       | 空值、极限值处理     |
| 测试审查与文档    | 1-2 小时       | 复杂逻辑需要清晰注释 |
| **小计**          | **12-16 小时** |                      |

---

## 3️⃣ Recommender 模块测试方案

### 3.1 模块职责分析

```typescript
SmartRecommender 的核心职责：
├── 推荐引擎 (recommend)
│   ├── 评分所有策略
│   ├── 排序和返回前 3 个
│   └── 组装完整推荐对象
├── 评分系统 (scoreStrategy)
│   ├── 场景匹配度 (calculateScenarioMatch)
│   ├── 成本效率 (calculateCostEfficiency)
│   ├── 质量评分 (getQualityScore)
│   ├── 历史偏好 (getHistoryPreference)
│   ├── 模型特性评分 (calculateModelProfileScore)
│   ├── 配额评分 (calculateQuotaScore)
│   └── 权重计算 (getWeights, normalizeWeights)
├── 辅助生成 (多个 generate* 方法)
│   ├── generateReason - 推荐理由
│   ├── generatePros - 优势列表
│   ├── generateCons - 劣势列表
│   ├── calculateConfidence - 置信度
│   └── estimateCost - 成本预估
└── 工具方法
    ├── getProviderFromModel - 提取提供商
    └── parseRecommendationContext - 自然语言解析
```

### 3.2 测试难度评估

| 难度维度    | 评分       | 说明                              |
| ----------- | ---------- | --------------------------------- |
| 依赖性      | ⭐⭐⭐     | 依赖 StrategyMetadata、上下文对象 |
| Mock 复杂度 | ⭐⭐⭐⭐   | 需要构造策略库、预算、历史等      |
| 算法验证    | ⭐⭐⭐⭐⭐ | 权重计算、评分公式、排序逻辑      |
| 边界情况    | ⭐⭐⭐⭐   | 无数据、极限值、冲突场景          |
| **总体**    | **高**     | 系统最复杂的模块                  |

### 3.3 测试用例清单 (12+ 用例)

#### 分类 A: 场景匹配度计算 (3 用例)

| #   | 用例名称     | 输入                     | 预期                         | 优先级 |
| --- | ------------ | ------------------------ | ---------------------------- | ------ |
| 1   | 完美场景匹配 | 编码场景 + balanced 策略 | calculateScenarioMatch = 1.0 | 🔴 P0  |
| 2   | 次优匹配     | 研究场景 + balanced 策略 | calculateScenarioMatch = 0.7 | 🔴 P0  |
| 3   | 复杂度调整   | 复杂任务 + research 策略 | 得分提升 (复杂→高质量)       | 🟡 P1  |

**实现建议**:

```typescript
test("should give perfect score for ideal scenario match", () => {
  const strategies = [
    {
      name: "strategy-2-balanced",
      // ... other fields
    },
  ];

  const recommender = new SmartRecommender(strategies);

  const context: RecommendationContext = {
    scenario: {
      type: "coding",
      priority: "balanced",
    },
  };

  const recommendations = recommender.recommend(context);
  // balanced 应该是 coding 的最佳匹配
  expect(recommendations[0].strategyName).toBe("strategy-2-balanced");
});
```

#### 分类 B: 成本效率计算 (3 用例)

| #   | 用例名称 | 输入                              | 预期                 | 优先级 |
| --- | -------- | --------------------------------- | -------------------- | ------ |
| 4   | 预算充足 | 月度 ¥5000，已用 ¥1000，策略 ¥500 | 成本效率高 (0.8-1.0) | 🔴 P0  |
| 5   | 预算紧张 | 月度 ¥1000，已用 ¥900，策略 ¥500  | 成本效率低 (0.1-0.3) | 🔴 P0  |
| 6   | 超出预算 | 月度 ¥500，已用 ¥300，策略 ¥300   | 成本效率极低 (0.1)   | 🔴 P0  |

**实现建议**:

```typescript
test("should calculate cost efficiency based on remaining budget", () => {
  const strategies = [{ name: "strategy-2-balanced" /* ... */ }];

  const recommender = new SmartRecommender(strategies);

  const context: RecommendationContext = {
    budget: {
      monthly: 5000,
      currentSpent: 1000,
      alertThreshold: 0.8,
    },
  };

  const recommendations = recommender.recommend(context);
  // balanced 策略 (¥550) 在 ¥4000 剩余预算下，应该效率高
  expect(recommendations[0].estimatedCost.monthly).toBeLessThan(
    context.budget!.monthly * 0.3,
  );
});
```

#### 分类 C: 权重调整 (3 用例)

| #   | 用例名称 | 输入               | 预期                         | 优先级 |
| --- | -------- | ------------------ | ---------------------------- | ------ |
| 7   | 质量优先 | priority='quality' | 权重：quality=0.4, cost=0.1  | 🟡 P1  |
| 8   | 成本优先 | priority='cost'    | 权重：cost=0.45, quality=0.1 | 🟡 P1  |
| 9   | 速度优先 | priority='speed'   | 权重：speed 权重最高         | 🟡 P1  |

**实现建议**:

```typescript
test("should adjust weights based on priority", () => {
  const strategies = [
    { name: "strategy-0-super" /* high quality */ },
    { name: "strategy-3-economical" /* low cost */ },
  ];

  const recommender = new SmartRecommender(strategies);

  // 质量优先
  const qualityRecs = recommender.recommend({
    scenario: { type: "coding", priority: "quality" },
  });
  expect(qualityRecs[0].strategyName).toBe("strategy-0-super");

  // 成本优先
  const costRecs = recommender.recommend({
    scenario: { type: "coding", priority: "cost" },
    budget: { monthly: 1000, currentSpent: 500, alertThreshold: 0.8 },
  });
  expect(costRecs[0].strategyName).toContain("economical");
});
```

#### 分类 D: 历史偏好 (2 用例)

| #   | 用例名称     | 输入                   | 预期                    | 优先级 |
| --- | ------------ | ---------------------- | ----------------------- | ------ |
| 10  | 历史偏好提升 | 最近使用 balanced 3 次 | 历史分数 + 推荐理由提及 | 🟡 P1  |
| 11  | 无历史数据   | 首次使用               | 返回默认 0.5 分         | 🔴 P0  |

#### 分类 E: 配额管理 (2 用例)

| #   | 用例名称 | 输入                     | 预期                 | 优先级 |
| --- | -------- | ------------------------ | -------------------- | ------ |
| 12  | 配额充足 | anthropic 配额使用率 20% | 推荐 anthropic 策略  | 🟡 P1  |
| 13  | 配额紧张 | openai 配额使用率 90%    | 降低 openai 策略权重 | 🟡 P1  |

#### 分类 F: 完整推荐流程 (自然语言解析)

| #   | 用例名称            | 输入                           | 预期                          | 优先级 |
| --- | ------------------- | ------------------------------ | ----------------------------- | ------ |
| 14  | 自然语言解析 - 编程 | "紧急的编程任务，预算 2000 元" | 识别 coding + urgent + budget | 🟡 P1  |

**实现建议**:

```typescript
test("parseRecommendationContext should identify scenario and priority", () => {
  const description = "紧急的编程任务，预算 2000 元";

  const context = parseRecommendationContext(description);

  expect(context.scenario?.type).toBe("coding");
  expect(context.scenario?.priority).toBe("speed");
  expect(context.budget?.monthly).toBe(2000);
  expect(context.timeContext?.isUrgent).toBe(true);
});
```

### 3.4 测试数据工厂

```typescript
// 策略库工厂
function createMockStrategies(): StrategyMetadata[] {
  return [
    {
      name: "strategy-0-super",
      filePath: "/path/to/0-super.jsonc",
      description: "Super strategy",
      costLevel: "ultra-high",
      isCurrent: false,
      models: ["anthropic/claude-opus-4-5", "openai/gpt-5.2"],
      source: "installed",
    },
    {
      name: "strategy-2-balanced",
      filePath: "/path/to/2-balanced.jsonc",
      description: "Balanced strategy",
      costLevel: "medium",
      isCurrent: true,
      models: ["anthropic/claude-sonnet-4-5", "github-copilot/gpt-5-mini"],
      source: "installed",
    },
    // ... 更多策略
  ];
}

// 预算上下文工厂
function createBudgetContext(
  overrides: Partial<BudgetConfig> = {},
): BudgetConfig {
  return {
    monthly: 5000,
    currentSpent: 1000,
    alertThreshold: 0.8,
    ...overrides,
  };
}

// 历史数据工厂
function createHistoryData(overrides: Partial<HistoryData> = {}): HistoryData {
  return {
    recentStrategies: [
      "strategy-2-balanced",
      "strategy-2-balanced",
      "strategy-1-performance",
    ],
    frequentScenarios: ["coding", "daily"],
    avgCostPerDay: 30,
    ...overrides,
  };
}
```

### 3.5 时间投入估算 - Recommender

| 任务              | 时间           | 说明                       |
| ----------------- | -------------- | -------------------------- |
| 编写 12+ 测试用例 | 6-8 小时       | 算法验证复杂，需要多组合   |
| 构造测试数据工厂  | 2-3 小时       | Mock 策略库、预算、历史    |
| 算法正确性验证    | 3-4 小时       | 权重计算、评分排序逻辑     |
| 边界和异常处理    | 2-3 小时       | 空、nil、极限值            |
| 自然语言解析测试  | 2 小时         | parseRecommendationContext |
| 集成测试与优化    | 1-2 小时       | 完整流程验证               |
| **小计**          | **16-20 小时** |                            |

---

## 🔧 测试环境设置指南

### 4.1 文件结构规划

```
tests/
├── unit/
│   ├── PathManager.test.ts          # ✅ 新增
│   ├── Validator.test.ts            # ✅ 新增
│   └── Recommender.test.ts          # ✅ 新增
├── integration/
│   └── PathManager-Validator.test.ts # 集成测试
├── fixtures/                         # 测试数据
│   ├── mock-strategies.ts           # ✅ 新增
│   ├── mock-configs.ts              # ✅ 新增
│   ├── test-data/
│   │   ├── strategies/
│   │   └── config/
└── README.md
```

### 4.2 全局 Test Setup 配置

创建 `tests/setup.ts`:

```typescript
import { describe, beforeAll, afterAll } from "bun:test";
import * as fs from "fs";
import * as path from "path";

// 全局测试环境
export const TEST_TEMP_DIR = path.join(
  "/tmp",
  "strategy-manager-tests-" + Date.now(),
);

beforeAll(() => {
  if (!fs.existsSync(TEST_TEMP_DIR)) {
    fs.mkdirSync(TEST_TEMP_DIR, { recursive: true });
  }
});

afterAll(() => {
  if (fs.existsSync(TEST_TEMP_DIR)) {
    fs.rmSync(TEST_TEMP_DIR, { recursive: true });
  }
});

// Mock 工厂集中管理
export function createTempDir(subPath?: string): string {
  const dir = subPath
    ? path.join(TEST_TEMP_DIR, subPath)
    : path.join(TEST_TEMP_DIR, "unnamed-" + Math.random());

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return dir;
}

export function cleanupTempDir(dir: string): void {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true });
  }
}
```

### 4.3 Mock 导出模块

创建 `tests/fixtures/mock-strategies.ts`:

```typescript
import type { StrategyMetadata } from "../Tools/Recommender";

export const mockStrategies: StrategyMetadata[] = [
  {
    name: "strategy-0-super",
    filePath: "/mock/0-super.jsonc",
    description: "Ultimate performance and quality",
    costLevel: "ultra-high",
    version: "1.0.0",
    isCurrent: false,
    useCase: "Critical tasks requiring best quality",
    models: [
      "anthropic/claude-opus-4-5",
      "openai/gpt-5.2",
      "google/gemini-3-pro",
    ],
    source: "installed",
  },
  // ... 更多预定义策略
];

export function getStrategyByName(name: string): StrategyMetadata | undefined {
  return mockStrategies.find((s) => s.name === name);
}
```

### 4.4 Bun 测试命令扩展

更新 `package.json`:

```json
{
  "scripts": {
    "test": "bun test",
    "test:watch": "bun test --watch",
    "test:coverage": "bun test --coverage",
    "test:unit": "bun test tests/unit/",
    "test:pathmanager": "bun test tests/unit/PathManager.test.ts",
    "test:validator": "bun test tests/unit/Validator.test.ts",
    "test:recommender": "bun test tests/unit/Recommender.test.ts",
    "test:ci": "bun test --coverage --reporter=junit"
  }
}
```

---

## 📋 执行计划与优先级

### 5.1 分阶段实施计划

#### Phase 1: PathManager (第 1 周)

- ✅ 编写 10 个基础测试用例
- ✅ 设置文件系统 Mock 和隔离
- ✅ 验证跨平台兼容性
- **投入**: 6-8 小时
- **预期覆盖率**: 85%+

#### Phase 2: Validator (第 2 周)

- ✅ 编写 15 个验证测试用例
- ✅ Mock 复杂配置对象
- ✅ 边界和异常处理
- **投入**: 12-16 小时
- **预期覆盖率**: 90%+

#### Phase 3: Recommender (第 3-4 周)

- ✅ 构建测试数据工厂
- ✅ 编写 12+ 算法测试用例
- ✅ 权重计算验证
- ✅ 集成测试
- **投入**: 16-20 小时
- **预期覆盖率**: 92%+

#### Phase 4: CI 集成 (第 4 周)

- ✅ 配置 CI 管道
- ✅ 增量覆盖率报告
- ✅ 性能基准测试
- **投入**: 2-3 小时

### 5.2 优先级表

| 优先级 | 用例       | 模块        | 理由             |
| ------ | ---------- | ----------- | ---------------- |
| 🔴 P0  | 1-4, 15-16 | Validator   | 防止无效配置部署 |
| 🔴 P0  | 1-7, 9-10  | PathManager | 系统初始化基础   |
| 🔴 P0  | 1-2, 5-6   | Recommender | 推荐引擎核心     |
| 🟡 P1  | 其余用例   | 全部        | 边界和优化       |

---

## 6️⃣ 风险评估与缓解

### 6.1 关键风险

| 风险                | 影响                   | 概率 | 缓解方案            |
| ------------------- | ---------------------- | ---- | ------------------- |
| **Home 目录不存在** | PathManager 初始化失败 | 中   | Mock $HOME 环境变量 |
| **权重正规化错误**  | Recommender 得分不准   | 中   | 单元验证权重和=1    |
| **临时文件未清理**  | 测试相互污染           | 中   | 使用 UUID 隔离目录  |
| **循环引用**        | 模型配置死循环         | 低   | 限制推荐队列深度    |

### 6.2 缓解策略代码示例

```typescript
// 风险 1: 环境隔离
test("should handle missing HOME gracefully", () => {
  const oldHome = process.env.HOME;
  process.env.HOME = "";

  try {
    const pm = new PathManager({ mode: "user" });
    // 应该有默认值或错误处理
  } finally {
    process.env.HOME = oldHome;
  }
});

// 风险 2: 权重验证
test("weights should always sum to 1.0", () => {
  const recommender = new SmartRecommender([]);

  for (const priority of ["quality", "cost", "speed", "balanced"]) {
    const weights = (recommender as any).getWeights({
      scenario: { type: "coding", priority: priority as any },
    });

    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    expect(Math.abs(sum - 1.0)).toBeLessThan(0.001); // 浮点误差容限
  }
});

// 风险 3: 临时文件清理
afterEach(() => {
  const tempDirs = fs
    .readdirSync("/tmp")
    .filter(
      (f) =>
        f.startsWith("pm-test-") || f.startsWith("strategy-manager-tests-"),
    );

  for (const dir of tempDirs) {
    try {
      fs.rmSync(path.join("/tmp", dir), { recursive: true, force: true });
    } catch (e) {
      // 忽略清理失败
    }
  }
});
```

---

## 📊 最终投入时间评估

### 7.1 总投入成本

| 阶段     | 模块        | 用例数      | 时间           | 人员     | 验收指标          |
| -------- | ----------- | ----------- | -------------- | -------- | ----------------- |
| Phase 1  | PathManager | 10          | 6-8h           | 1 人     | 覆盖率 85%+       |
| Phase 2  | Validator   | 15          | 12-16h         | 1 人     | 覆盖率 90%+       |
| Phase 3  | Recommender | 12          | 16-20h         | 1 人     | 覆盖率 92%+       |
| Phase 4  | CI/文档     | -           | 2-3h           | 1 人     | CI 集成完成       |
| **总计** | **3 模块**  | **37 用例** | **36-47 小时** | **1 人** | **总覆盖率 95%+** |

### 7.2 周期估算

| 场景                | 周期     | 投入    |
| ------------------- | -------- | ------- |
| 专职（8h/天）       | 5-6 天   | 40 小时 |
| 兼职（4h/天）       | 2-2.5 周 | 40 小时 |
| 极致快速（16h/day） | 2-3 天   | 40 小时 |

### 7.3 成本估算 (以人日计)

假设月薪 ¥15,000（工作日 20 天）：

- **人均成本**: ¥750/天
- **总成本**: 40 小时 ÷ 8 = 5 天 × ¥750 = **¥3,750**

---

## 🚀 CI 集成方案

### 8.1 GitHub Actions 配置

创建 `.github/workflows/test.yml`:

```yaml
name: Test & Coverage

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install

      - name: Run type check
        run: bun run type-check

      - name: Run unit tests
        run: bun test

      - name: Generate coverage
        run: bun test --coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

      - name: Comment PR with coverage
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            // 自动评论覆盖率
```

### 8.2 本地测试命令

```bash
# 完整测试套件
bun test

# 单个模块测试
bun test:pathmanager
bun test:validator
bun test:recommender

# 覆盖率报告
bun test:coverage

# Watch 模式（开发中）
bun test:watch
```

---

## 📝 执行检查清单

### 前置条件检查

- [ ] Bun 版本 >= 1.0.0
- [ ] TypeScript 环境已配置
- [ ] 临时目录权限正常 (`/tmp` 可写)
- [ ] 依赖库已安装 (`bun install`)

### 开发阶段

- [ ] Phase 1 - PathManager 全部 10 用例通过
- [ ] Phase 2 - Validator 全部 15 用例通过
- [ ] Phase 3 - Recommender 全部 12 用例通过
- [ ] 覆盖率报告达成 95%+
- [ ] 所有测试支持 Watch 模式

### 验收标准

- [ ] 单元测试覆盖率 >= 95%
- [ ] 行覆盖率 >= 90%
- [ ] 分支覆盖率 >= 85%
- [ ] 所有测试执行时间 < 5 秒
- [ ] CI/CD 流程自动化完成
- [ ] 团队成员能独立运行和维护

---

## 📚 参考资源

### 相关文档

- [Bun Test Framework](https://bun.sh/docs/test/overview)
- [Mock 最佳实践](https://bun.sh/docs/test/mocks)
- [TypeScript 测试指南](https://www.typescriptlang.org/docs/handbook/testing.html)

### 项目内参考

- [tests/README.md](../tests/README.md) - 测试指南
- [AGENTS.md](../AGENTS.md) - 项目架构
- [Tools/ManageStrategies.ts](../Tools/ManageStrategies.ts) - 核心实现

---

## 📧 后续支持

### 常见问题

**Q1: 如何快速上手 Bun 测试?**

- 查看 [tests/README.md](../tests/README.md)
- 运行 `bun test tests/ManageStrategies.test.ts` 参考现有测试

**Q2: 测试失败如何调试?**

```bash
# 添加详细日志
BUN_DEBUG=1 bun test

# 只运行特定测试
bun test -- --grep "PathManager"
```

**Q3: 如何处理异步测试?**

- 使用 `async/await` 或返回 `Promise`
- Bun 原生支持 `async test`

---

**文档更新日期**: 2026-02-05  
**维护者**: QA 团队  
**版本**: 1.0.0
