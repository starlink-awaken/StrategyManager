# 使用同步工作流

## 目的

描述 StrategyManager 中的使用同步（UsageSync）功能，从多个 AI 提供商同步使用数据和配额信息，为策略推荐和动态生成提供数据支持。

## 触发条件

- **手动触发**: 用户执行同步命令
- **推荐前**: 智能推荐时自动同步配额状态
- **生成前**: 动态策略生成时获取最新配额
- **定时任务**: 周期性同步（可选）

## 支持的提供商

| 提供商      | 同步器          | 数据来源 | 支持数据             |
| ----------- | --------------- | -------- | -------------------- |
| Anthropic   | AnthropicSync   | API      | 用量百分比、重置时间 |
| OpenAI      | OpenAISync      | API      | 使用统计、成本       |
| GitHub      | GitHubSync      | API      | Copilot 使用情况     |
| Google      | GeminiSync      | API      | 配额使用情况         |
| ZhiPu       | ZhiPuSync       | API      | 使用统计             |
| DeepSeek    | DeepSeekSync    | API      | 使用统计             |
| SiliconFlow | SiliconFlowSync | API      | 使用统计             |

## 输出数据

### UsageData 接口

```typescript
interface UsageData {
  provider: string; // 提供商名称
  date: string; // 日期
  inputTokens?: number; // 输入 token 数
  outputTokens?: number; // 输出 token 数
  totalTokens?: number; // 总 token 数
  requests?: number; // 请求次数
  cost?: number; // 成本
  metadata?: any; // 额外元数据
}
```

### QuotaStatus 接口

```typescript
interface QuotaStatus {
  provider: string; // 提供商名称
  remaining: number; // 剩余配额（0-1）
  total: number; // 总配额
  usagePercent: number; // 使用百分比（0-1）
  resetDate?: Date; // 重置日期
}
```

## 执行步骤

### 1. 协调器初始化

```typescript
const coordinator = new UsageSyncCoordinator();

// 注册同步器
coordinator.register(new AnthropicSync());
coordinator.register(new OpenAISync());
coordinator.register(new GitHubSync());
coordinator.register(new GeminiSync());
coordinator.register(new ZhiPuSync());
coordinator.register(new DeepSeekSync());
coordinator.register(new SiliconFlowSync());
```

### 2. 批量同步

```typescript
// 同步所有提供商
const results = await coordinator.syncAll();

// 处理结果
for (const result of results.results) {
  if (result.success && result.data) {
    // 处理使用数据
    processUsageData(result.data);
  } else {
    // 处理错误
    logError(result.provider, result.error);
  }
}
```

### 3. 配额推导

从使用数据推导配额状态：

```typescript
function deriveQuotaStatusFromUsageData(data: UsageData[]): QuotaStatus[];
```

**推导规则**:

1. **优先使用元数据**: 如果 metadata 包含 usagePercentage 或 quotaPercentage，直接使用
2. **回退到成本分析**: 基于相对成本计算使用百分比
3. **保守估计**: 最高使用率不超过 90%，最低剩余不低于 10%

### 4. 集成到推荐系统

```typescript
async function fetchQuotaStatusFromUsageSync(): Promise<QuotaStatus[]> {
  const coordinator = new UsageSyncCoordinator();
  // ... 注册同步器
  const results = await coordinator.syncAll();
  const allData = results.results
    .filter((r) => r.success && r.data)
    .flatMap((r) => r.data);
  return deriveQuotaStatusFromUsageData(allData);
}
```

## 实现参考

**核心文件**: Tools/UsageSync/

```
UsageSync/
├── index.ts              # 主导出
├── interfaces.ts         # 类型定义
├── CLI.ts               # 命令行接口
├── AnthropicSync.ts     # Anthropic 同步器
├── OpenAISync.ts        # OpenAI 同步器
├── GitHubSync.ts        # GitHub 同步器
├── GeminiSync.ts        # Gemini 同步器
├── ZhiPuSync.ts         # ZhiPu 同步器
├── DeepSeekSync.ts      # DeepSeek 同步器
├── SiliconFlowSync.ts   # SiliconFlow 同步器
├── LocalStatsSync.ts    # 本地统计
├── SourceTagger.ts      # 来源标记
├── CostCalculator.ts    # 成本计算
├── Validator.ts         # 数据验证
└── setup_auth.ts        # 认证设置
```

**关键类**:

```typescript
// 协调器
export class UsageSyncCoordinator {
  register(sync: UsageSync): void;
  async syncAll(): Promise<SyncAllResult>;
}

// 同步器基类
export abstract class UsageSync {
  abstract readonly provider: string;
  abstract sync(options?: SyncOptions): Promise<UsageData[]>;
}
```

## 使用示例

### CLI 命令

```bash
# 同步所有提供商
bun run Tools/UsageSync/CLI.ts sync

# 同步特定提供商
bun run Tools/UsageSync/CLI.ts sync --providers anthropic,openai

# 查看使用报告
bun run Tools/UsageSync/CLI.ts report

# 成本分析
bun run Tools/UsageSync/CLI.ts cost --month 2026-02

# 设置认证
bun run Tools/UsageSync/CLI.ts setup
```

### 编程接口

```typescript
import { UsageSyncCoordinator, AnthropicSync } from "./UsageSync";

// 单个同步
const sync = new AnthropicSync();
const data = await sync.sync({
  startDate: "2026-02-01",
  endDate: "2026-02-05",
});

// 批量同步
const coordinator = new UsageSyncCoordinator();
coordinator.register(new AnthropicSync());
coordinator.register(new OpenAISync());
const results = await coordinator.syncAll();

// 与推荐系统集成
const quotaStatus = await fetchQuotaStatusFromUsageSync();
const recommendation = recommendStrategySmart({
  description: "日常开发",
  quotaStatus,
});
```

## 验证方法

### 环境变量配置

确保配置了必要的 API 密钥：

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
export OPENAI_API_KEY="sk-..."
export GITHUB_TOKEN="ghp_..."
export GOOGLE_API_KEY="..."
export ZHIPU_API_KEY="..."
```

### 单元测试

```typescript
// 测试单个同步器
describe("AnthropicSync", () => {
  it("应该返回有效的使用数据", async () => {
    const sync = new AnthropicSync();
    const data = await sync.sync();
    expect(data).toBeArray();
    expect(data[0]).toHaveProperty("provider", "anthropic");
  });
});

// 测试配额推导
describe("deriveQuotaStatusFromUsageData", () => {
  it("应该正确推导配额状态", () => {
    const usageData = [
      /* 测试数据 */
    ];
    const quotaStatus = deriveQuotaStatusFromUsageData(usageData);
    expect(quotaStatus).toBeArray();
    expect(quotaStatus[0].usagePercent).toBeLessThanOrEqual(1);
  });
});
```

### 集成测试

1. **同步验证**
   - 执行 `syncAll()`
   - 验证所有配置的提供商都返回数据
   - 验证数据格式正确

2. **配额推导验证**
   - 从真实 API 获取数据
   - 推导配额状态
   - 验证配额百分比合理（0-100%）

3. **推荐集成验证**
   - 同步配额数据
   - 生成推荐
   - 验证推荐考虑了配额状态

## 错误处理

### 常见错误

1. **API 密钥未设置**

   ```
   Error: ANTHROPIC_API_KEY not set
   Solution: 设置环境变量或运行 setup
   ```

2. **API 限流**

   ```
   Error: Rate limit exceeded
   Solution: 使用 --retry 选项或稍后重试
   ```

3. **网络错误**
   ```
   Error: Network timeout
   Solution: 检查网络连接，增加超时时间
   ```

### 容错机制

- **部分失败**: 某个提供商失败不影响其他提供商
- **重试机制**: 自动重试失败的请求（可配置）
- **降级处理**: 无法获取配额时使用保守估计

## 性能考虑

1. **并行同步**: 使用协调器并行同步多个提供商
2. **缓存机制**: 缓存最近的同步结果（建议 1 小时）
3. **增量同步**: 仅同步新的数据（支持 startDate/endDate）
4. **按需同步**: 仅在需要时同步（推荐/生成触发）

## 注意事项

1. **API 密钥安全**: 使用环境变量，不要硬编码
2. **速率限制**: 注意各提供商的 API 限流策略
3. **数据隐私**: 使用数据仅用于策略优化，不外传
4. **成本追踪**: 定期查看使用报告，避免超支
5. **配额警告**: 使用率超过 80% 时应收到警告

## 相关约定

- 提供商名称: 小写（anthropic/openai/github/google/zhipu）
- 日期格式: ISO 8601（2026-02-05）
- 成本单位: USD（美元）
- 配额范围: 0.0-1.0（百分比）

## 扩展建议

1. **新提供商**: 实现 UsageSync 接口即可添加
2. **自定义指标**: 扩展 UsageData 接口添加指标
3. **报警系统**: 配额超限时发送通知
4. **可视化**: 生成使用趋势图表
5. **预测分析**: 基于历史数据预测未来用量
