# 成本报告工作流

## 目的

描述 StrategyManager 中的成本报告（CostReport）功能，分析和展示 AI 使用成本，特别是 GitHub Copilot 的使用情况和优化建议。

## 触发条件

- **月度回顾**: 每月生成成本报告
- **预算监控**: 接近预算上限时
- **优化分析**: 需要成本优化建议时
- **对比分析**: 比较不同时期的成本变化

## 功能特性

### 1. 使用统计

- **总使用量**: 输入/输出 token 统计
- **请求次数**: API 调用次数
- **模型分布**: 各模型的使用占比
- **时间趋势**: 日/周/月使用趋势

### 2. 成本分析

- **直接成本**: API 调用费用
- **间接成本**: GitHub Copilot 使用成本
- **成本占比**: 各提供商成本分布
- **单位成本**: 每 1K token 平均成本

### 3. GitHub Copilot 分析

- **使用模式**: 代码补全、聊天、命令等使用情况
- **高级模型**: GPT-5.2-Codex, o1-mini 等使用统计
- **免费额度**: 免费模型（GPT-5-mini）使用情况
- **优化建议**: 基于使用模式的优化建议

### 4. 优化建议

- **模型替换**: 推荐低成本替代模型
- **额度利用**: 建议充分利用高额度资源
- **场景优化**: 针对不同场景的模型配置
- **预算控制**: 预算分配和控制建议

## 输出格式

### 文本报告

```
=== 成本分析报告 ===
报告周期: 2026-02-01 至 2026-02-05

总览:
- 总成本: $150.00
- 总请求: 5,000 次
- 总 Token: 2,500,000

提供商成本分布:
┌──────────┬────────┬────────┐
│ 提供商   │ 成本   │ 占比   │
├──────────┼────────┼────────┤
│ Anthropic│ $80.00 │ 53.3%  │
│ OpenAI   │ $50.00 │ 33.3%  │
│ GitHub   │ $20.00 │ 13.3%  │
└──────────┴────────┴────────┘

GitHub Copilot 分析:
- 高级模型使用: 200 次
- 免费模型使用: 800 次
- 建议: 增加免费模型使用比例

优化建议:
1. 将 Claude Sonnet 替换为 GLM-5（高额度配额）
2. 日常任务使用 GPT-5-mini（免费）
3. 深度工作使用 Anthropic Claude 3.5 Opus

2. 日常任务使用 GPT-5-mini（免费）
3. 深度工作使用 Anthropic 高级模型
```

### JSON 报告

```json
{
  "period": {
    "start": "2026-02-01",
    "end": "2026-02-05"
  },
  "summary": {
    "totalCost": 150.0,
    "totalRequests": 5000,
    "totalTokens": 2500000
  },
  "byProvider": [
    {
      "provider": "anthropic",
      "cost": 80.0,
      "percentage": 53.3,
      "requests": 2000,
      "tokens": 1000000
    }
  ],
  "copilotAnalysis": {
    "advancedModelUsage": 200,
    "freeModelUsage": 800,
    "recommendations": ["..."]
  },
  "recommendations": ["..."]
}
```

## 实现参考

**核心文件**: Tools/CostReport.ts

```typescript
// 主报告类
export class CostReport {
  constructor(
    private usageData: UsageData[],
    private options?: CostReportOptions,
  ) {}

  // 生成报告
  generate(): CostReportResult {
    return {
      summary: this.generateSummary(),
      byProvider: this.analyzeByProvider(),
      byModel: this.analyzeByModel(),
      byDate: this.analyzeByDate(),
      copilot: this.analyzeCopilot(),
      recommendations: this.generateRecommendations(),
    };
  }

  // 分析 GitHub Copilot
  private analyzeCopilot(): CopilotAnalysis {
    // 识别高级模型使用
    // 统计免费模型使用
    // 生成优化建议
  }

  // 生成优化建议
  private generateRecommendations(): string[] {
    // 基于使用模式
    // 考虑成本结构
    // 结合额度情况
  }

  // 渲染文本报告
  renderText(): string {
    // 格式化输出
  }

  // 导出 JSON
  toJSON(): object {
    // 结构化输出
  }
}

// 成本计算器
export class CostCalculator {
  // 计算 token 成本
  calculateTokenCost(
    model: string,
    inputTokens: number,
    outputTokens: number,
  ): number;

  // 计算总成本
  calculateTotalCost(usageData: UsageData[]): number;

  // 模型价格表
  private getPricing(model: string): ModelPricing;
}
```

**使用同步集成**:

```typescript
import { UsageSyncCoordinator } from "./UsageSync";
import { CostReport } from "./CostReport";

// 同步使用数据
const coordinator = new UsageSyncCoordinator();
const results = await coordinator.syncAll();
const usageData = results.results
  .filter((r) => r.success && r.data)
  .flatMap((r) => r.data);

// 生成成本报告
const report = new CostReport(usageData, {
  startDate: "2026-02-01",
  endDate: "2026-02-05",
  includeCopilotAnalysis: true,
});

const result = report.generate();
console.log(report.renderText());
```

## 使用示例

### CLI 命令

```bash
# 生成本月成本报告
/strategies cost-report

# 指定时间范围
/strategies cost-report --start 2026-02-01 --end 2026-02-05

# 包含 Copilot 分析
/strategies cost-report --copilot

# 导出 JSON 格式
/strategies cost-report --format json --output report.json

# 显示详细信息
/strategies cost-report --verbose

# 按提供商分组
/strategies cost-report --group-by provider

# 按模型分组
/strategies cost-report --group-by model
```

### 编程接口

```typescript
import { generateCostReport } from "./CostReport";

// 简单调用
const report = await generateCostReport();

// 高级选项
const report = await generateCostReport({
  startDate: "2026-02-01",
  endDate: "2026-02-05",
  groupBy: "provider",
  includeCopilotAnalysis: true,
  includeRecommendations: true,
  format: "json",
});

// 自定义处理
const report = new CostReport(usageData);
const summary = report.generateSummary();
const copilotAnalysis = report.analyzeCopilot();
const recommendations = report.generateRecommendations();
```

## GitHub Copilot 优化策略

### 识别高成本使用

1. **高级模型**: GPT-5.2-Codex, o1-mini, o1-preview
2. **使用场景**: 复杂代码生成、架构设计
3. **频率分析**: 每日/每周使用次数

### 优化建议生成

**规则引擎**:

```typescript
const rules = [
  {
    condition: (analysis) =>
      analysis.advancedModelUsage > 100 && analysis.freeModelUsage < 500,
    recommendation: "增加 GPT-5-mini（免费）使用，减少高级模型使用",
  },
  {
    condition: (analysis) => analysis.codexUsageRatio > 0.5,
    recommendation: "将部分 Codex 任务迁移到 Claude Sonnet",
  },
  {
    condition: (analysis) => analysis.copilotCost > monthlyBudget * 0.3,
    recommendation: "Copilot 成本占比过高，考虑使用直接 API",
  },
];
```

### 替代方案建议

| 当前使用       | 建议替代                 | 成本节省 | 质量影响 |
| -------------- | ------------------------ | -------- | -------- |
| GPT-5.1-Codex  | Claude Sonnet 4.6        | 40%      | 轻微     |
| o1-mini        | Claude 3.5 Sonnet       | 30%      | 无       |
| GPT-5-standard | GLM-5 (高配额)           | 90%      | 中等     |
| GPT-4o         | Gemini 3.1 Flash         | 70%      | 轻微     |

| o1-mini        | Claude Sonnet + thinking | 30%      | 无       |
| GPT-5-standard | GLM-4.7 (60倍)           | 90%      | 中等     |
| GPT-4o         | Gemini 3 Flash           | 70%      | 轻微     |

## 验证方法

### 数据完整性

```typescript
describe("CostReport", () => {
  it("应该正确计算总成本", () => {
    const report = new CostReport(mockUsageData);
    const result = report.generate();
    expect(result.summary.totalCost).toBeGreaterThan(0);
  });

  it("应该识别 Copilot 使用", () => {
    const report = new CostReport(copilotUsageData);
    const copilot = report.analyzeCopilot();
    expect(copilot.advancedModelUsage).toBeGreaterThan(0);
  });

  it("应该生成优化建议", () => {
    const report = new CostReport(highCostData);
    const recommendations = report.generateRecommendations();
    expect(recommendations.length).toBeGreaterThan(0);
  });
});
```

### 报告准确性

1. **手动验证**: 对比实际账单
2. **交叉验证**: 与提供商后台数据对比
3. **趋势验证**: 检查时间趋势合理性

### 建议有效性

1. **成本节省**: 实施建议后成本下降
2. **质量保持**: 输出质量未明显下降
3. **用户满意度**: 使用体验良好

## 预算监控

### 预算配置

```typescript
interface BudgetConfig {
  monthly: number; // 月预算
  alert: number; // 警告阈值（0-1）
  providers: {
    [key: string]: number; // 各提供商预算分配
  };
}
```

### 警告机制

```typescript
function checkBudgetStatus(
  spending: number,
  budget: BudgetConfig,
): BudgetAlert {
  const usage = spending / budget.monthly;

  if (usage >= 1.0) {
    return { level: "critical", message: "已超出预算" };
  } else if (usage >= budget.alert) {
    return { level: "warning", message: "接近预算上限" };
  } else {
    return { level: "normal", message: "预算健康" };
  }
}
```

### 预算建议

```bash
# 查看预算状态
/strategies budget-status

# 设置预算
/strategies budget-set --monthly 200 --alert 0.8

# 预算分配
/strategies budget-allocate --anthropic 100 --openai 60 --github 40
```

## 注意事项

1. **数据时效**: 成本数据可能有延迟（1-2 天）
2. **汇率波动**: 跨货币成本需考虑汇率
3. **免费额度**: 正确识别免费使用量
4. **批量折扣**: 大客户可能有特殊定价
5. **隐藏成本**: 考虑网络、存储等间接成本

## 相关约定

- 成本单位: USD（美元）
- 精度: 保留 2 位小数
- 时区: UTC
- 报告周期: 自然月或自定义

## 扩展建议

1. **可视化**: 生成成本趋势图表
2. **预测**: 基于历史数据预测未来成本
3. **对比**: 多月份/多策略对比
4. **导出**: 支持 CSV、Excel 格式
5. **集成**: 与财务系统集成
