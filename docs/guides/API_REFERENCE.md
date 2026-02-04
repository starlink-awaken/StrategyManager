# UsageSync API 参考文档

**版本**: 1.0  
**最后更新**: 2026-02-04  
**状态**: ✅ 生产级

---

## 目录

- [快速开始](#快速开始)
- [核心类](#核心类)
- [数据接口](#数据接口)
- [同步器](#同步器)
- [数据处理](#数据处理)
- [CLI 工具](#cli-工具)
- [错误处理](#错误处理)

---

## 快速开始

### 基础使用

```typescript
import {
  UsageSyncCoordinator,
  AnthropicSync,
  OpenAISync,
} from "./Tools/UsageSync";

// 创建协调器
const coordinator = new UsageSyncCoordinator();

// 注册同步器
coordinator.register(new AnthropicSync());
coordinator.register(new OpenAISync());

// 同步所有数据
const result = await coordinator.syncAll();
console.log(`成功: ${result.successful}, 失败: ${result.failed}`);

// 获取聚合数据
const allData = coordinator.aggregateUsage(result.results);
```

### CLI 使用

```bash
# 配置检查
bun run Tools/UsageSync/CLI.ts config get

# 同步数据
bun run Tools/UsageSync/CLI.ts sync

# 生成报告
bun run Tools/UsageSync/CLI.ts report --json --save

# 健康检查
bun run Tools/UsageSync/CLI.ts health
```

---

## 核心类

### UsageSyncCoordinator

协调多个厂商的同步。

```typescript
export class UsageSyncCoordinator {
  // 注册同步器
  register(sync: UsageSync): void;

  // 移除同步器
  unregister(provider: string): void;

  // 获取所有已注册的厂商
  getProviders(): string[];

  // 获取同步器实例 (用于 CLI)
  getSyncInstance(provider: string): UsageSync | null;

  // 同步单个厂商
  async syncOne(
    provider: string,
    period?: { start: Date; end: Date },
  ): Promise<SyncResult>;

  // 同步所有厂商 (并行)
  async syncAll(period?: { start: Date; end: Date }): Promise<BatchSyncResult>;

  // 健康检查所有同步器
  async healthCheckAll(): Promise<Record<string, boolean>>;

  // 聚合使用量数据
  aggregateUsage(results: SyncResult[]): UsageData[];
}
```

### UsageSyncCLI

完整的命令行工具。

```typescript
export class UsageSyncCLI {
  constructor();

  // 主命令分发器
  async run(args: string[]): Promise<void>;
}

// 使用
const cli = new UsageSyncCLI();
await cli.run(["sync"]); // 同步
await cli.run(["report", "--json"]); // 生成报告
await cli.run(["config", "get"]); // 查看配置
await cli.run(["health"]); // 健康检查
```

---

## 数据接口

### UsageData

基础使用量数据结构。

```typescript
interface UsageData {
  // 厂商标识
  provider:
    | "anthropic"
    | "openai"
    | "zhipu"
    | "github"
    | "gemini"
    | "deepseek"
    | "silicon-flow";

  // 模型名称
  model: string;

  // 使用量统计
  usage: {
    inputTokens: number; // 输入 token
    outputTokens: number; // 输出 token
    totalTokens: number; // 总 token
    requests?: number; // 请求数
    cachedTokens?: number; // 缓存 token (如果支持)
  };

  // 成本 (USD)
  cost?: number;

  // 数据来源
  source: string; // 例如: "✅ API (官方)" 或 "⚠️ 本地估算"

  // 精确度 (0-100%)
  accuracy: number;

  // 时间周期
  period: {
    start: Date;
    end: Date;
  };

  // 最后更新时间
  lastUpdated: Date;

  // 元数据
  metadata?: Record<string, any>;
}
```

### SyncResult

单个同步结果。

```typescript
interface SyncResult {
  success: boolean;
  provider: string;
  data?: UsageData[];
  error?: string;
  duration: number; // 毫秒
  timestamp: Date;
}
```

### BatchSyncResult

批量同步结果。

```typescript
interface BatchSyncResult {
  total: number; // 总厂商数
  successful: number; // 成功数
  failed: number; // 失败数
  results: SyncResult[]; // 详细结果
  totalDuration: number; // 总耗时 (毫秒)
}
```

---

## 同步器

### 通用同步器接口

```typescript
interface UsageSync {
  readonly provider: string;
  readonly accuracy: number;  // 0-100%

  // 获取使用量数据
  async fetchUsage(period?: { start: Date; end: Date }): Promise<UsageData[]>;

  // 健康检查
  async healthCheck(): Promise<boolean>;
}
```

### AnthropicSync

Anthropic Claude 使用量同步器。

```typescript
import { AnthropicSync } from "./Tools/UsageSync/AnthropicSync";

// 使用 API Key
const sync = new AnthropicSync(apiKey);

// 从 opencode auth.json 创建
const sync = AnthropicSync.fromOpenCodeAuth(auth.anthropic);

// 获取使用量
const data = await sync.fetchUsage({
  start: new Date("2026-01-01"),
  end: new Date("2026-02-01"),
});

// 健康检查
const healthy = await sync.healthCheck();
```

**特性**:

- 精确度: 99%
- 认证: 环境变量或 opencode auth.json
- 数据源: Anthropic 官方 CLI

### OpenAISync

OpenAI ChatGPT 使用量同步器。

```typescript
import { OpenAISync } from "./Tools/UsageSync/OpenAISync";

// 使用 API Key
const sync = new OpenAISync(apiKey);

// 从 opencode auth.json 创建
const sync = OpenAISync.fromOpenCodeAuth(auth.openai);

// 获取使用量
const data = await sync.fetchUsage();
```

**特性**:

- 精确度: 99%
- 认证: OAuth Token 或 API Key
- 数据源: OpenAI Usage API

### ZhiPuSync

ZhiPu (智谱) GLM 使用量同步器。

```typescript
import { ZhiPuSync } from "./Tools/UsageSync/ZhiPuSync";

// 使用 API Key
const sync = new ZhiPuSync(apiKey);

// 从 opencode auth.json 创建
const sync = ZhiPuSync.fromOpenCodeAuth(auth.zhipu);

// 获取使用量
const data = await sync.fetchUsage();
```

**特性**:

- 精确度: 95%
- 认证: API Key
- 数据源: ZhiPu API

### GitHubSync

GitHub Copilot 使用量同步器。

```typescript
import { GitHubSync } from "./Tools/UsageSync/GitHubSync";

// 使用 GitHub Token
const sync = new GitHubSync(token, owner);

// 从 opencode auth.json 创建
const sync = GitHubSync.fromOpenCodeAuth(auth["github-copilot"]);

// 获取使用量
const data = await sync.fetchUsage();
```

**特性**:

- 精确度: 99%
- 认证: GitHub OAuth Token
- 数据源: GitHub Billing API

### GeminiSync

Google Gemini 使用量同步器。

```typescript
import { GeminiSync } from "./Tools/UsageSync/GeminiSync";

// 使用 Access Token
const sync = new GeminiSync(accessToken);

// 从 opencode auth.json 创建
const sync = GeminiSync.fromOpenCodeAuth(auth.google);

// 获取使用量
const data = await sync.fetchUsage();
```

**特性**:

- 精确度: 90%
- 认证: Google OAuth Access Token
- 数据源: Google Quota API (参考 Antigravity-Manager)

### DeepSeekSync

DeepSeek 使用量同步器 (本地统计)。

```typescript
import { DeepSeekSync } from "./Tools/UsageSync/LocalStatsSync";

// 使用 API Key
const sync = new DeepSeekSync(apiKey);

// 获取使用量
const data = await sync.fetchUsage();
```

**特性**:

- 精确度: 75%
- 认证: API Key
- 数据源: 本地统计

### SiliconFlowSync

Silicon Flow 使用量同步器 (本地统计)。

```typescript
import { SiliconFlowSync } from "./Tools/UsageSync/LocalStatsSync";

// 创建同步器
const sync = new SiliconFlowSync();

// 获取使用量
const data = await sync.fetchUsage();
```

**特性**:

- 精确度: 75%
- 认证: 本地配置
- 数据源: 本地统计

---

## 数据处理

### Validator

数据验证和异常检测。

```typescript
import { Validator } from "./Tools/UsageSync/Validator";

const validator = new Validator();

// 验证单条数据
const errors = validator.validateUsageData(data);
if (errors.length > 0) {
  console.error("数据错误:", errors);
}

// 批量验证
const results = validator.validateBatch(dataArray);

// 检测重复
const duplicates = validator.detectDuplicates(dataArray);

// 检测异常 (3-Sigma 规则)
const anomalies = validator.detectAnomalies(dataArray);
```

**验证项**:

- ✅ 字段完整性
- ✅ 值范围有效性
- ✅ 时间戳一致性
- ✅ 重复数据检测
- ✅ 异常值检测

### CostCalculator

成本计算和定价管理。

```typescript
import { CostCalculator } from "./Tools/UsageSync/CostCalculator";

const calculator = new CostCalculator();

// 计算单条成本
const cost = calculator.calculateCost(data);

// 批量计算
const costReport = calculator.calculateBatchCost(dataArray);

// 生成报告
const report = calculator.generateCostReport(dataArray);
// report: {
//   totalCost: number,
//   averageCostPerRequest: number,
//   averageCostPerToken: number,
//   costByProvider: Record<string, { cost, percentage }>
// }

// 更新定价
calculator.updatePricing("anthropic", {
  "claude-3-5-sonnet": { input: 3 / 1000000, output: 15 / 1000000 },
});
```

**支持的厂商定价**:

- Anthropic (多个 Claude 模型)
- OpenAI (GPT-4, GPT-4 Turbo 等)
- ZhiPu (多个 GLM 模型)
- Gemini (标准定价)
- GitHub (按座位计费)
- DeepSeek (基础定价)
- Silicon Flow (基础定价)

### SourceTagger

数据来源标记和质量评分。

```typescript
import { SourceTagger } from "./Tools/UsageSync/SourceTagger";

const tagger = new SourceTagger();

// 标记单条数据
const tagged = tagger.tagData(data);

// 批量标记
const taggedArray = tagger.tagBatch(dataArray);

// 生成来源报告
const sourceReport = tagger.generateSourceReport(dataArray);

// 验证数据质量
const quality = tagger.validateDataQuality(data);

// 生成审计证书
const certificate = tagger.generateSourceCertificate(dataArray);
```

**评分维度**:

- 数据来源 (官方 API 100%, 本地估算 60-75%)
- 更新频率 (实时 100%, 日更 80%, 月更 50%)
- 精确度 (90%+ = 优秀, 70-90% = 良好, <70% = 一般)

### CostReport

报告生成。

```typescript
import { CostReport } from "./Tools/CostReport";

const report = new CostReport(dataArray, {
  start: new Date("2026-01-01"),
  end: new Date("2026-02-01"),
});

// 生成文本报告
const textReport = report.generateTextReport();
console.log(textReport);

// 生成 JSON 报告
const jsonReport = report.generateJsonReport();
const parsed = JSON.parse(jsonReport);
```

---

## CLI 工具

### 命令列表

```bash
# 同步所有厂商数据
bun run Tools/UsageSync/CLI.ts sync

# 生成成本报告
bun run Tools/UsageSync/CLI.ts report          # 文本格式
bun run Tools/UsageSync/CLI.ts report --json   # JSON 格式
bun run Tools/UsageSync/CLI.ts report --save   # 保存到文件

# 管理配置
bun run Tools/UsageSync/CLI.ts config get      # 显示配置
bun run Tools/UsageSync/CLI.ts config validate # 验证配置

# 健康检查
bun run Tools/UsageSync/CLI.ts health

# 显示帮助
bun run Tools/UsageSync/CLI.ts --help
```

### 命令详解

#### sync

```bash
bun run Tools/UsageSync/CLI.ts sync
```

**功能**:

- 并行同步所有 7 个厂商
- 自动从 opencode auth.json 加载认证
- 显示实时进度
- 保存结果到本地

**输出**:

```
ℹ 开始同步所有厂商数据...

════════════════════════════════════════════════════════════
                    同步完成汇总
════════════════════════════════════════════════════════════

✓ anthropic       150000 records, 45000000 tokens
✓ openai          200000 records, 80000000 tokens
...
✓ 成功: 7  ✗ 失败: 0  ⏱ 耗时: 12.34s

✓ 数据已保存到: ~/.config/strategy-manager/data/sync-2026-02-04.json
```

#### report

```bash
# 文本格式
bun run Tools/UsageSync/CLI.ts report

# JSON 格式
bun run Tools/UsageSync/CLI.ts report --json

# 保存到文件
bun run Tools/UsageSync/CLI.ts report --json --save
```

**功能**:

- 读取最新的同步数据
- 计算成本和统计
- 输出格式化报告

#### config

```bash
# 显示配置
bun run Tools/UsageSync/CLI.ts config get

# 验证配置
bun run Tools/UsageSync/CLI.ts config validate
```

**功能**:

- 显示已登录的服务
- 验证必需服务配置
- 检查认证有效性

#### health

```bash
bun run Tools/UsageSync/CLI.ts health
```

**功能**:

- 测试所有厂商的连接
- 显示连接状态
- 诊断问题

---

## 错误处理

### 常见错误

#### 认证失败

```typescript
try {
  const sync = new AnthropicSync();
} catch (error) {
  if (error.message.includes("ANTHROPIC_API_KEY is required")) {
    console.error("缺少 Anthropic API Key");
    // 从 opencode auth.json 加载
    const sync = AnthropicSync.fromOpenCodeAuth(auth.anthropic);
  }
}
```

#### 网络错误

```typescript
try {
  const data = await sync.fetchUsage();
} catch (error) {
  if (error.code === "ECONNREFUSED") {
    console.error("无法连接到服务器");
    // 检查网络连接
  }
}
```

#### 数据验证错误

```typescript
const errors = validator.validateUsageData(data);
if (errors.length > 0) {
  console.error("数据验证失败:");
  for (const error of errors) {
    console.error(`  - ${error.field}: ${error.message}`);
  }
}
```

### 错误代码

| 代码          | 含义       | 解决方案              |
| ------------- | ---------- | --------------------- |
| AUTH_FAILED   | 认证失败   | 检查 API Key 或 Token |
| NETWORK_ERROR | 网络错误   | 检查网络连接          |
| INVALID_DATA  | 数据无效   | 检查数据格式          |
| TIMEOUT       | 请求超时   | 增加超时时间或重试    |
| NOT_FOUND     | 资源不存在 | 检查资源标识          |

---

## 扩展和集成

### 添加新的同步器

```typescript
import { UsageSync, UsageData } from "./interfaces";

export class CustomSync implements UsageSync {
  readonly provider = "custom";
  readonly accuracy = 85;

  async fetchUsage(period?: { start: Date; end: Date }): Promise<UsageData[]> {
    // 实现同步逻辑
    return [];
  }

  async healthCheck(): Promise<boolean> {
    // 实现健康检查
    return true;
  }

  static fromOpenCodeAuth(authInfo: any): CustomSync {
    return new CustomSync(authInfo.key);
  }
}

// 注册到协调器
const coordinator = new UsageSyncCoordinator();
coordinator.register(new CustomSync());
```

### 自定义数据处理

```typescript
// 继承 Validator
class CustomValidator extends Validator {
  override validateUsageData(data: UsageData): ValidationError[] {
    const errors = super.validateUsageData(data);

    // 添加自定义验证
    if (data.usage.totalTokens > 1000000) {
      errors.push({
        field: "totalTokens",
        message: "超过阈值",
        severity: "warning",
      });
    }

    return errors;
  }
}
```

---

## 完整示例

```typescript
import {
  UsageSyncCoordinator,
  AnthropicSync,
  OpenAISync,
  ZhiPuSync,
  Validator,
  CostCalculator,
  CostReport,
} from "./Tools/UsageSync";

async function main() {
  // 1. 创建协调器
  const coordinator = new UsageSyncCoordinator();

  // 2. 注册同步器
  coordinator.register(new AnthropicSync());
  coordinator.register(new OpenAISync());
  coordinator.register(new ZhiPuSync());

  // 3. 同步所有数据
  console.log("正在同步数据...");
  const result = await coordinator.syncAll({
    start: new Date("2026-01-01"),
    end: new Date("2026-02-01"),
  });

  console.log(`成功: ${result.successful}, 失败: ${result.failed}`);

  // 4. 验证数据
  const allData = coordinator.aggregateUsage(result.results);
  const validator = new Validator();
  const errors = validator.validateBatch(allData);

  if (errors.length > 0) {
    console.error("数据验证错误:", errors);
  }

  // 5. 计算成本
  const calculator = new CostCalculator();
  const costReport = calculator.generateCostReport(allData);

  console.log(`总成本: $${costReport.totalCost.toFixed(2)}`);

  // 6. 生成报告
  const report = new CostReport(allData, {
    start: new Date("2026-01-01"),
    end: new Date("2026-02-01"),
  });

  console.log(report.generateTextReport());
}

main().catch(console.error);
```

---

## 相关文档

- [最佳实践](./BEST_PRACTICES.md)
- [配置指南](./CONFIGURATION.md)
- [故障排查](./TROUBLESHOOTING.md)
- [FAQ](./FAQ.md)

---

**版本历史**:

- v1.0 (2026-02-04): 初始发布，覆盖所有核心 API
