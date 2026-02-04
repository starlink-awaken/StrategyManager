# P1 阶段方案设计文档

**状态**: 方案设计阶段  
**创建于**: 2026-02-04  
**目标**: 完成使用量同步 + 成本分析 + 推荐优化  

---

## 📋 P1 目标

基于 omo-quota 的经验，为 StrategyManager 实现：

1. **使用量同步** (`UsageSync.ts`)
   - 读取 oh-my-opencode 消息历史
   - 解析 agent/model 调用信息
   - 计算成本
   - 聚合存储

2. **成本分析** (`CostReport.ts`)
   - 日/周/月成本统计
   - 成本趋势分析
   - 按提供商/模型/Agent 分解
   - 生成优化建议

3. **推荐集成** (`Recommender.ts`)
   - 基于实际使用数据优化推荐
   - 动态调整权重
   - 提供成本-性能平衡建议

---

## 🏗️ 架构设计

### 数据流

```
oh-my-opencode 消息历史
  (~/.local/share/opencode/storage/message/*.json)
         ↓
  UsageSync 模块
    - 文件解析
    - 成本计算
    - 数据聚合
         ↓
  ~/.config/opencode/strategy-usage.json
  (~/.config/opencode/strategy-cost.json)
         ↓
  CostReport 模块
    - 统计分析
    - 趋势计算
    - 建议生成
         ↓
  Recommender 集成
    - 加载实际使用数据
    - 调整推荐权重
    - 生成数据驱动建议
```

### 文件结构

```
Tools/
├── ManageStrategies.ts      # 现有核心模块
├── UsageSync.ts             # 新增：使用量同步
├── CostReport.ts            # 新增：成本分析
├── Recommender.ts           # 扩展：推荐优化
├── PathManager.ts           # 现有：路径管理
└── Validator.ts             # 现有：验证

~/.config/opencode/
├── strategy-usage.json      # 新增：使用统计
├── strategy-cost.json       # 新增：成本数据
└── strategy-history.json    # 现有：历史记录
```

### 模块职责

| 模块 | 职责 | 输入 | 输出 |
|------|------|------|------|
| UsageSync | 读取消息历史，计算成本 | `~/.local/share/opencode/storage/message/` | JSON 使用统计 |
| CostReport | 分析成本趋势，生成报告 | 使用统计 JSON | 成本报告对象 |
| Recommender | 基于使用数据推荐策略 | 使用统计 + 当前策略 | 排序推荐列表 |
| ManageStrategies | 集成新功能到现有命令 | （同上） | 扩展的 sync/report/recommend 命令 |

---

## 📊 数据结构设计

### 1. 使用统计数据 (`strategy-usage.json`)

```json
{
  "version": "1.0.0",
  "lastSync": "2026-02-04T15:00:00Z",
  "summary": {
    "totalCalls": 12345,
    "totalTokens": 1234567,
    "activeDays": 30,
    "averageCallsPerDay": 411.5,
    "averageTokensPerDay": 41152.3
  },
  "byProvider": {
    "anthropic": {
      "calls": 4567,
      "tokens": 456789,
      "models": {
        "claude-opus-4-5": 2345,
        "claude-sonnet-4-5": 1234,
        "claude-haiku-4-5": 988
      }
    },
    "openai": {
      "calls": 3456,
      "tokens": 345678,
      "models": {
        "gpt-5.2-codex": 1567,
        "gpt-5-mini": 1889
      }
    },
    "google": {
      "calls": 2345,
      "tokens": 234567,
      "models": {
        "gemini-3-pro": 1234,
        "gemini-3-flash": 1111
      }
    },
    "zai": {
      "calls": 1977,
      "tokens": 197533,
      "models": {
        "glm-4.7": 1977
      }
    }
  },
  "byAgent": {
    "sisyphus": { "calls": 2345, "tokens": 234567, "averageCostPerCall": 0.0234 },
    "prometheus": { "calls": 1234, "tokens": 123456, "averageCostPerCall": 0.0456 },
    "oracle": { "calls": 890, "tokens": 89012, "averageCostPerCall": 0.0789 },
    "hephaestus": { "calls": 2567, "tokens": 256789, "averageCostPerCall": 0.0178 },
    "librarian": { "calls": 3456, "tokens": 345678, "averageCostPerCall": 0.0045 },
    "explore": { "calls": 1234, "tokens": 123456, "averageCostPerCall": 0.0012 },
    "multimodal-looker": { "calls": 456, "tokens": 45678, "averageCostPerCall": 0.0067 },
    "metis": { "calls": 234, "tokens": 23456, "averageCostPerCall": 0.0234 },
    "momus": { "calls": 123, "tokens": 12345, "averageCostPerCall": 0.0089 },
    "atlas": { "calls": 76, "tokens": 7654, "averageCostPerCall": 0.0456 }
  },
  "trends": {
    "daily": {
      "2026-01-25": { "calls": 234, "tokens": 23456, "cost": 12.34 },
      "2026-01-26": { "calls": 256, "tokens": 25678, "cost": 14.56 },
      "2026-01-27": { "calls": 289, "tokens": 28901, "cost": 18.90 },
      "2026-01-28": { "calls": 312, "tokens": 31234, "cost": 22.34 },
      "2026-01-29": { "calls": 334, "tokens": 33456, "cost": 25.67 },
      "2026-01-30": { "calls": 378, "tokens": 37890, "cost": 28.90 },
      "2026-01-31": { "calls": 400, "tokens": 40000, "cost": 31.23 }
    },
    "weekly": {
      "week-1": { "calls": 1234, "cost": 567.89 },
      "week-2": { "calls": 1567, "cost": 678.90 },
      "week-3": { "calls": 1890, "cost": 789.12 },
      "week-4": { "calls": 2154, "cost": 845.67 }
    },
    "monthly": {
      "2026-01": { "calls": 12345, "cost": 2881.58 },
      "2026-02": { "calls": 2134, "cost": 512.34 }
    }
  }
}
```

### 2. 成本数据 (`strategy-cost.json`)

```json
{
  "version": "1.0.0",
  "timestamp": "2026-02-04T15:00:00Z",
  "pricingModel": "2026-02",
  "costByStrategy": {
    "strategy-0-super": {
      "estimatedMonthlyCost": 2500,
      "actualMonthlyCost": 2834.56,
      "deviance": "+13.4%",
      "status": "⚠️ 超预算",
      "models": {
        "anthropic/claude-opus-4-5": {
          "usage": 2345,
          "cost": 1234.56,
          "percentage": "43.5%"
        }
      }
    },
    "strategy-2-balanced": {
      "estimatedMonthlyCost": 700,
      "actualMonthlyCost": 612.34,
      "deviance": "-12.5%",
      "status": "✅ 符合预算",
      "models": {}
    }
  },
  "costByProvider": {
    "anthropic": { "monthly": 1456.78, "percentage": "42%" },
    "openai": { "monthly": 987.65, "percentage": "28%" },
    "google": { "monthly": 456.78, "percentage": "13%" },
    "zai": { "monthly": 345.67, "percentage": "10%" },
    "others": { "monthly": 234.56, "percentage": "7%" }
  },
  "warningThresholds": {
    "dailyCost": { "yellow": 50, "red": 80 },
    "monthlyCost": { "yellow": 1500, "red": 2400 },
    "costGrowth": { "yellow": "20%", "red": "50%" }
  },
  "currentStatus": {
    "dailyCostToday": 32.45,
    "dailyAverageThisMonth": 28.90,
    "monthlyCostSoFar": 612.34,
    "daysInMonth": 28,
    "projectedMonthlyTotal": 2834.56,
    "budgetRemaining": "-634.56",
    "costTrend": "📈 增长趋势 (+34% 本周)"
  }
}
```

### 3. 推荐优化数据 (Recommender 扩展)

```json
{
  "recommendations": [
    {
      "rank": 1,
      "strategy": "strategy-2-balanced",
      "score": 92.5,
      "reasoning": [
        "✅ 成本符合预算 (-12.5%)",
        "✅ 覆盖 79% 使用场景",
        "✅ 质量评分 8/10"
      ],
      "estimatedCostReduction": "-$188 vs strategy-0-super",
      "compatibilityScore": 0.95
    },
    {
      "rank": 2,
      "strategy": "strategy-3-economical",
      "score": 78.5,
      "reasoning": [
        "✅ 成本最低 (-72% vs current)",
        "⚠️ 质量评分 6/10 (可接受)",
        "✅ 适合探索/学习"
      ],
      "estimatedCostReduction": "-$2222 vs strategy-0-super",
      "compatibilityScore": 0.65
    }
  ],
  "insights": {
    "costDrivers": [
      {
        "type": "model",
        "name": "claude-opus-4-5",
        "usage": 2345,
        "cost": 1234.56,
        "recommendation": "仅在关键决策时使用，常规任务用 Sonnet"
      }
    ],
    "agentOptimization": [
      {
        "agent": "oracle",
        "currentModel": "claude-opus-4-5",
        "suggestedModel": "claude-sonnet-4-5",
        "estimatedSavings": "60%",
        "compatibilityRisk": "低"
      }
    ],
    "budgetForecast": {
      "currentMonthEnd": 2834.56,
      "nextMonth": 3100.00,
      "alert": "🔴 将超出预算，建议立即切换"
    }
  }
}
```

---

## 🔧 模块详细设计

### 1. UsageSync.ts

**功能**:
- 读取 `~/.local/share/opencode/storage/message/` 中的消息历史
- 解析每条消息的 agent、model、token 数据
- 计算成本（使用内置定价表）
- 聚合到日/周/月维度
- 保存到 `strategy-usage.json`

**关键方法**:
```typescript
class UsageSync {
  sync(): Promise<UsageStats>          // 完整同步
  syncDeltaOnly(): Promise<UsageStats> // 增量同步（仅新数据）
  parseMessage(msg: Message): Usage    // 解析单条消息
  calculateCost(usage: Usage): number  // 计算成本
  aggregateUsage(usages: Usage[]): UsageStats
  saveUsageStats(stats: UsageStats): void
  loadUsageStats(): UsageStats
}
```

**流程**:
1. 读取 `~/.local/share/opencode/storage/message/` 所有 JSON 文件
2. 按文件名提取日期，按时间排序
3. 增量同步：仅处理最后一个加载时间之后的文件
4. 对每条消息：
   - 提取 agent、model、role、content
   - 计算 token 数（使用启发式或调用计数）
   - 查表获取单价
   - 计算成本
5. 聚合：按 provider/model/agent 统计
6. 生成日/周/月趋势
7. 保存到 `strategy-usage.json`

**定价表** (`src/pricing.ts` - 需创建):
```typescript
const PRICING = {
  'anthropic/claude-opus-4-5': {
    inputPerMilToken: 0.003,
    outputPerMilToken: 0.015
  },
  'anthropic/claude-sonnet-4-5': {
    inputPerMilToken: 0.0025,
    outputPerMilToken: 0.0075
  },
  // ... 其他模型
};
```

---

### 2. CostReport.ts

**功能**:
- 读取 `strategy-usage.json`
- 生成各类成本报告
- 分析趋势
- 生成优化建议
- 导出 Markdown/JSON

**关键方法**:
```typescript
class CostReport {
  generateDailyReport(): DailyReport      // 最近 7 天
  generateWeeklyReport(): WeeklyReport    // 当前周
  generateMonthlyReport(): MonthlyReport  // 当前月
  generateCustomReport(range: DateRange): CustomReport
  
  analyzeTrends(): TrendAnalysis
  identifyAnomaly(): Anomaly[]
  suggestOptimization(): Suggestion[]
  
  exportMarkdown(report: Report): string
  exportJSON(report: Report): string
}
```

**报告类型**:

1. **Daily Report** (最近 7 天)
   - 每日成本折线图 (ASCII art)
   - 成本统计 (总额/平均/高低)
   - 按提供商分解
   - 按 Agent 分解
   - 优化建议

2. **Weekly Report** (当前周)
   - 每天对比
   - 周 vs 周比较
   - 成本增长率
   - 高成本操作 Top 5
   - 异常检测

3. **Monthly Report** (当前月)
   - 成本汇总表
   - 按模型 Top 10
   - 按 Agent 分解
   - 成本超出预算分析
   - 月底预测

---

### 3. Recommender.ts 扩展

**扩展点**:
- 现有：基于策略元数据的静态推荐
- 新增：基于实际使用数据的动态调整

**关键方法**:
```typescript
class Recommender {
  // 现有方法
  recommend(context: Context): Strategy[]
  
  // 新增方法
  recommendWithUsageData(context: Context, usage: UsageStats): EnhancedStrategy[]
  calculateCostImpact(strategy: Strategy, usage: UsageStats): CostProjection
  optimizeByUsage(usage: UsageStats): Suggestion[]
  forecastCost(strategy: Strategy, usage: UsageStats, days: number): number
  
  // 权重调整
  private adjustWeights(usage: UsageStats): WeightMap
  private calculateCompatibility(strategy: Strategy, usage: UsageStats): number
}
```

**推荐逻辑**:
1. 计算当前使用模式中每个 Agent 的调用频率
2. 检查目标策略中这些 Agent 的模型成本
3. 模拟在目标策略下的成本
4. 对比当前策略，计算成本差异
5. 综合质量、成本、兼容性评分
6. 排序并返回建议

**权重公式** (示例):
```
Score = (qualityScore × 0.3) + (costScore × 0.4) + (compatibilityScore × 0.3)

其中:
- qualityScore: 基于策略质量等级 (0-100)
- costScore: 基于成本差异 (越低成本越高分)
- compatibilityScore: 基于实际使用模型覆盖度
```

---

## 🔄 集成到 ManageStrategies.ts

### 新增命令

1. **sync** (现有扩展)
```bash
bun run Tools/ManageStrategies.ts sync [--delta]
```
- 调用 UsageSync.sync()
- 显示同步结果
- 支持 `--delta` 快速同步

2. **report** (新增)
```bash
bun run Tools/ManageStrategies.ts report [daily|weekly|monthly] [--export] [--format json|markdown]
```
- 调用 CostReport.generate*Report()
- 彩色终端输出
- 支持导出为 Markdown/JSON

3. **optimize** (新增)
```bash
bun run Tools/ManageStrategies.ts optimize [--strategy NAME]
```
- 基于使用数据提供优化建议
- 显示潜在成本节省
- 提供切换建议

4. **recommend** (现有扩展)
```bash
bun run Tools/ManageStrategies.ts recommend [--with-cost] [--budget AMOUNT]
```
- 基于使用数据推荐
- `--with-cost`: 显示成本预测
- `--budget`: 根据预算推荐

---

## 📝 工作流定义

### Workflows/Sync.md

```markdown
# 同步使用量数据

## 目的
读取 oh-my-opencode 消息历史，计算使用成本

## 前置条件
- oh-my-opencode 已安装
- 有使用消息历史 (~/.local/share/opencode/storage/message/)

## 步骤
1. 运行 sync 命令
2. 确认同步完成
3. 使用 report 查看成本

## 输出
- 更新 ~/.config/opencode/strategy-usage.json
- 更新 ~/.config/opencode/strategy-cost.json
```

### Workflows/Report.md

```markdown
# 成本分析报告

## 目的
分析使用成本，生成优化建议

## 前置条件
- 已运行 sync 命令

## 步骤
1. 选择报告类型 (daily/weekly/monthly)
2. 查看成本分解
3. 查看优化建议
4. 可选：导出为 Markdown

## 输出示例
- 成本折线图
- 成本表格
- 按提供商/模型/Agent 分解
- 优化建议列表
```

### Workflows/Optimize.md

```markdown
# 基于使用数据的成本优化

## 目的
根据实际使用模式，推荐成本更低的策略

## 前置条件
- 已运行 sync 命令
- 有至少 7 天的使用数据

## 步骤
1. 分析历史使用模型
2. 对比各策略的模型配置
3. 计算切换后的成本影响
4. 显示优化建议

## 输出
- 推荐策略列表（带成本预测）
- 每个策略的优缺点
- 切换风险评估
```

---

## ✅ 验证清单

根据一致性准则检查：

### 1. TypeScript 类型定义
- [ ] 新增接口（UsageStats, CostReport 等）
- [ ] 与 StrategyConfig 类型兼容
- [ ] 定价表类型定义
- [ ] 测试用例覆盖

### 2. 模板更新
- [ ] 所有模板文件是否需要新增字段？
- [ ] 运行 validate 确认兼容性

### 3. 工作流文档
- [ ] 新增 Workflows/Sync.md
- [ ] 新增 Workflows/Report.md
- [ ] 新增 Workflows/Optimize.md
- [ ] 更新 SKILL.md 触发条件

### 4. 文档更新
- [ ] 更新 README.md 新增命令
- [ ] 更新 USAGE_GUIDE.md
- [ ] 补充 ARCHITECTURE.md 新模块说明
- [ ] 更新 CHANGELOG.md

### 5. 脚本集成
- [ ] scripts/strategy-helper.sh 中添加快捷命令
- [ ] scripts/install.sh 检查数据目录

### 6. 测试
- [ ] UsageSync 单元测试
- [ ] CostReport 单元测试
- [ ] Recommender 集成测试
- [ ] 所有新命令集成测试

---

## 🎯 实施阶段

### P1.1 实现 UsageSync (1-2 天)
- [ ] 设计数据结构
- [ ] 实现文件读取
- [ ] 实现成本计算
- [ ] 实现数据聚合
- [ ] 单元测试

### P1.2 实现 CostReport (1-2 天)
- [ ] 实现报告生成
- [ ] 实现 ASCII 图表
- [ ] 实现 Markdown 导出
- [ ] 单元测试

### P1.3 扩展 Recommender (1 天)
- [ ] 加载使用数据
- [ ] 调整权重
- [ ] 计算成本影响
- [ ] 集成测试

### P1.4 集成到 ManageStrategies (1 天)
- [ ] 添加新命令
- [ ] 集成到 CLI
- [ ] 集成测试

### P1.5 文档和工作流 (1 天)
- [ ] 编写工作流文档
- [ ] 更新主文档
- [ ] 更新 SKILL.md
- [ ] 测试完整流程

---

## 📊 成功指标

- ✅ 可以读取消息历史并正确计算成本
- ✅ 成本数据与 omo-quota 结果一致（允许 ±5% 误差）
- ✅ 生成的报告清晰、信息丰富
- ✅ 推荐基于实际使用数据动态变化
- ✅ 所有新代码通过类型检查和测试
- ✅ 文档与代码完全同步
- ✅ 用户可以完整执行 sync → report → optimize 流程

---

## 🔗 相关文档

- [omo-quota 成本分析](../../../Workspace/Skills/omo-quota/docs/COST_ANALYSIS.md)
- [StrategyManager 架构](./ARCHITECTURE.md)
- [一致性检查清单](./CONSISTENCY_CHECKLIST.md)
