# UsageSync 多厂商使用同步

**父级**: `../AGENTS.md`

## 概述

统一的多 AI 服务使用量统计系统，支持 Anthropic、OpenAI、ZhiPu、GitHub、Gemini、DeepSeek、SiliconFlow。2411 行代码，独立子模块（有独立 index.ts）。

## 架构图

```
UsageSync/
├── interfaces.ts              # 数据接口定义（统一格式）
├── index.ts                  # 导出 + UsageSyncCoordinator
├── AnthropicSync.ts          # Anthropic CLI 集成
├── OpenAISync.ts             # OpenAI API 集成
├── ZhiPuSync.ts              # ZhiPu 插件集成
├── GitHubSync.ts             # GitHub Billing API
├── GeminiSync.ts             # Gemini Quota API
├── LocalStatsSync.ts         # DeepSeek/SiliconFlow 本地统计
├── CLI.ts                   # 命令行工具（547 行）
├── CostCalculator.ts        # 成本计算
├── Validator.ts             # 数据验证
└── SourceTagger.ts          # 来源标记
```

## 核心类型

### 统一数据格式
```typescript
interface UsageData {
  provider: string            // "anthropic", "openai", ...
  model: string              // "claude-3-opus", "gpt-4", ...
  usage: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
    requests?: number
    cachedTokens?: number
  }
  cost?: number              // 成本（USD）
  source: "✅ API (官方)" | "⚠️ 估算 (本地)"
  accuracy: number           // 精确度 0-100
  period: {
    start: Date
    end: Date
  }
  lastUpdated: Date
}
```

### 同步接口
```typescript
interface UsageSync {
  provider: string           // 厂商标识
  fetchUsage(period?: {start, end}): Promise<UsageData[]>
  healthCheck(): Promise<boolean>
}
```

## 厂商支持矩阵

| 厂商 | 查询方式 | 精确度 | 状态 | 文件 |
|------|---------|--------|------|------|
| Anthropic | CLI | 99% | ✅ | AnthropicSync.ts |
| OpenAI | API | 99% | ✅ | OpenAISync.ts |
| ZhiPu GLM | 插件 | 95% | ⚠️ | ZhiPuSync.ts |
| GitHub Copilot | Billing API | 99% | ⚠️ | GitHubSync.ts |
| Gemini | Quota API | 90% | ⚠️ | GeminiSync.ts |
| DeepSeek | 本地统计 | 75% | ⚠️ | LocalStatsSync.ts |
| Silicon Flow | 本地统计 | 75% | ⚠️ | LocalStatsSync.ts |

## UsageSyncCoordinator

协调多个厂商同步的核心类。

```typescript
class UsageSyncCoordinator {
  // 注册同步器
  register(sync: UsageSync): void

  // 同步所有
  async syncAll(period?): Promise<BatchSyncResult>

  // 同步单个
  async syncOne(provider, period?): Promise<SyncResult>

  // 健康检查
  async healthCheckAll(): Promise<Map<string, boolean>>

  // 获取同步器实例
  getSyncInstance(provider): UsageSync | null
}
```

### 批量结果
```typescript
interface BatchSyncResult {
  successful: number
  failed: number
  results: SyncResult[]
  providers: string[]
}
```

## 环境变量

### 必需
```bash
# Anthropic
export ANTHROPIC_API_KEY="sk-ant-..."

# OpenAI
export OPENAI_API_KEY="sk-..."

# GitHub
export GITHUB_TOKEN="ghp_..."
```

### 可选
```bash
# ZhiPu
export ZHIPU_API_KEY="..."

# Gemini
export GEMINI_API_KEY="..."
```

## 认证自动加载

`index.ts` 自动加载认证：
```typescript
import "./setup_auth"  // 自动读取环境变量
```

`setup_auth.ts` 负责读取环境变量并验证。

## CLI 工具

```bash
# 同步所有厂商
bun run Tools/UsageSync/CLI.ts sync-all

# 同步单个厂商
bun run Tools/UsageSync/CLI.ts sync anthropic

# 健康检查
bun run Tools/UsageSync/CLI.ts health-check

# 生成报告
bun run Tools/UsageSync/CLI.ts report
```

## 辅助模块

### CostCalculator
```typescript
class CostCalculator {
  // 计算成本
  calculateCost(usage, pricing): number

  // 批量计算
  calculateBatchCost(usages): Map<string, number>
}
```

### Validator
```typescript
class UsageValidator {
  // 验证数据格式
  validate(data): ValidationResult

  // 检查精度
  checkAccuracy(data): number
}
```

### SourceTagger
```typescript
class SourceTagger {
  // 标记来源
  tagSource(data, method): "API (官方)" | "估算 (本地)"

  // 标记精度
  tagAccuracy(data, method): number
}
```

## 使用示例

### 单独使用
```typescript
import { AnthropicSync } from "./UsageSync"

const anthropic = new AnthropicSync()
const data = await anthropic.fetchUsage()
console.log(data)
```

### 使用协调器（推荐）
```typescript
import {
  UsageSyncCoordinator,
  AnthropicSync,
  OpenAISync,
} from "./UsageSync"

const coordinator = new UsageSyncCoordinator()
coordinator.register(new AnthropicSync())
coordinator.register(new OpenAISync())

// 同步所有
const result = await coordinator.syncAll()
console.log(`成功: ${result.successful}, 失败: ${result.failed}`)

// 健康检查
const health = await coordinator.healthCheckAll()
console.log(health)
```

## 注意事项

- **环境变量**: 通过 `setup_auth.ts` 自动加载，不要硬编码
- **精度标记**: `source` 字段区分 API（99%）和估算（75%）
- **时间范围**: `fetchUsage(period?)` 支持可选时间范围
- **错误处理**: `SyncResult` 包含 success/error 信息
- **测试**: `tests/UsageSync.test.ts`
