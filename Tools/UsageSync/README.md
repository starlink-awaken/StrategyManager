# UsageSync - 多厂商使用量统计系统

## 概述

UsageSync 是一个统一的使用量统计系统，支持多个 AI 服务厂商的使用量查询和成本分析。

## 支持的厂商

| 厂商         | 查询方式    | 精确度 | 状态      | 实施日期 |
| ------------ | ----------- | ------ | --------- | -------- |
| Anthropic    | CLI         | 99%    | ✅ 已完成 | Day 1    |
| OpenAI       | API         | 99%    | ✅ 已完成 | Day 1    |
| ZhiPu GLM    | 插件        | 95%    | ⏳ 计划中 | Day 3    |
| GitHub       | Billing API | 99%    | ⏳ 计划中 | Day 4    |
| Gemini       | Quota API   | 90%    | ⏳ 计划中 | Day 4-5  |
| DeepSeek     | 本地统计    | 75%    | ⏳ 计划中 | Day 6    |
| Silicon Flow | 本地统计    | 75%    | ⏳ 计划中 | Day 6    |

## 快速开始

### 安装依赖

```bash
bun install
```

### 环境变量配置

```bash
# Anthropic
export ANTHROPIC_API_KEY="sk-ant-..."

# OpenAI
export OPENAI_API_KEY="sk-..."
```

### 基本使用

```typescript
import {
  AnthropicSync,
  OpenAISync,
  UsageSyncCoordinator,
} from "./Tools/UsageSync";

// 1. 单独使用
const anthropic = new AnthropicSync();
const data = await anthropic.fetchUsage();
console.log(data);

// 2. 使用协调器（推荐）
const coordinator = new UsageSyncCoordinator();
coordinator.register(new AnthropicSync());
coordinator.register(new OpenAISync());

// 同步所有厂商
const result = await coordinator.syncAll();
console.log(`成功: ${result.successful}, 失败: ${result.failed}`);

// 健康检查
const health = await coordinator.healthCheckAll();
console.log(health);
```

## 数据格式

### UsageData

所有厂商的数据都会转换为统一的 `UsageData` 格式：

```typescript
interface UsageData {
  provider: string; // 厂商名称
  model: string; // 模型名称
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    requests?: number;
    cachedTokens?: number;
  };
  cost?: number; // 成本（USD）
  source: "✅ API (官方)" | "⚠️ 估算 (本地)";
  accuracy: number; // 精确度 (0-100)
  period: {
    start: Date;
    end: Date;
  };
  lastUpdated: Date;
}
```

## 架构设计

```
UsageSync/
├── interfaces.ts              # 数据接口定义
├── AnthropicSync.ts           # Anthropic CLI 集成
├── OpenAISync.ts              # OpenAI API 集成
├── ZhiPuSync.ts               # ZhiPu 插件集成 (Day 3)
├── GitHubSync.ts              # GitHub Billing API (Day 4)
├── GeminiSync.ts              # Gemini Quota API (Day 4-5)
├── LocalSync.ts               # 本地统计 (Day 6)
├── UsageSyncCoordinator.ts    # 协调器
└── index.ts                   # 主入口
```

## 测试

```bash
# 运行所有测试
bun test tests/UsageSync.test.ts

# 运行特定测试
bun test tests/UsageSync.test.ts -t "AnthropicSync"
```

## 开发计划

### Phase 1: 核心厂商 (Day 1-3.5)

- ✅ Day 1-2: Anthropic CLI + OpenAI API
- ⏳ Day 3: ZhiPu 插件
- ⏳ Day 4 上午: GitHub Billing API

### Phase 2: 扩展厂商 (Day 4-6)

- ⏳ Day 4-5: Gemini Quota API
- ⏳ Day 6: DeepSeek + Silicon Flow (本地统计)

### Phase 3: 数据处理 (Day 7)

- ⏳ UsageSync 协调器增强
- ⏳ CostCalculator 成本计算
- ⏳ Validator 数据验证
- ⏳ SourceTagger 来源标记

### Phase 4: 报告和 CLI (Day 8)

- ⏳ CostReport 报告生成
- ⏳ CLI 命令集成
- ⏳ 文档完善

## 注意事项

### Anthropic CLI

需要安装 `anthropic_api_usage` CLI 工具：

```bash
pip install anthropic-sdk
# 或
brew install anthropic-cli
```

### OpenAI Usage API

OpenAI Usage API 需要 Organization Admin 权限。如果没有权限，可能会收到 403 错误。

### 环境变量

所有 API Key 都应该通过环境变量提供，不要硬编码在代码中。

## 贡献

欢迎贡献新的厂商集成！请参考现有的 `AnthropicSync` 和 `OpenAISync` 实现。

## License

MIT
