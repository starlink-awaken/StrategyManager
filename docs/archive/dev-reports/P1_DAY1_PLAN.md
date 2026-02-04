# P1 第一天实施计划

**日期**: 2026-02-04 (Day 1/8)  
**任务**: P1.1.1 - Anthropic CLI + OpenAI API 集成 (第 1/2 天)  
**状态**: 🚀 准备启动

---

## 🎯 今日目标

### 核心任务
1. ✅ 创建基础架构
2. ✅ Anthropic CLI 集成
3. ✅ OpenAI API 集成（部分）
4. ✅ 数据接口定义

### 预期产出
- `Tools/UsageSync/` - 使用量同步模块
- `Tools/UsageSync/interfaces.ts` - 数据接口定义
- `Tools/UsageSync/AnthropicSync.ts` - Anthropic 集成
- `Tools/UsageSync/OpenAISync.ts` - OpenAI 集成（初步）
- `tests/UsageSync.test.ts` - 单元测试（初步）

---

## 📁 文件结构设计

```
Tools/
├── UsageSync/
│   ├── index.ts                  # 主入口
│   ├── interfaces.ts             # 数据接口定义
│   ├── AnthropicSync.ts          # Anthropic CLI 集成
│   ├── OpenAISync.ts             # OpenAI API 集成
│   ├── ZhiPuSync.ts              # ZhiPu 插件集成 (Day 3)
│   ├── GitHubSync.ts             # GitHub Billing API (Day 4)
│   ├── GeminiSync.ts             # Gemini Quota API (Day 4-5)
│   ├── LocalSync.ts              # 本地统计 (Day 6)
│   └── UsageSyncCoordinator.ts   # 协调器 (Day 7)
├── CostReport/                   # 成本报告 (Day 8)
├── Validator.ts                  # 验证器 (Day 7)
├── ManageStrategies.ts           # 已存在
├── PathManager.ts                # 已存在
└── Recommender.ts                # 已存在
```

---

## 🔧 数据接口设计

### 核心接口

```typescript
// Tools/UsageSync/interfaces.ts

/**
 * 使用量数据统一接口
 */
export interface UsageData {
  provider: string;               // "anthropic" | "openai" | "zhipu" | ...
  model: string;                  // "claude-3.5-sonnet" | "gpt-4o" | ...
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    requests?: number;
    cachedTokens?: number;
  };
  cost?: number;                  // 可选：成本（如果 API 提供）
  source: '✅ API (官方)' | '⚠️ 估算 (本地)';
  accuracy: number;               // 0-100
  period: {
    start: Date;
    end: Date;
  };
  lastUpdated: Date;
  metadata?: Record<string, any>; // 额外元数据
}

/**
 * 使用量同步器接口
 */
export interface UsageSync {
  readonly provider: string;
  readonly accuracy: number;
  
  /**
   * 获取使用量数据
   * @param period 查询周期（可选）
   */
  fetchUsage(period?: { start: Date; end: Date }): Promise<UsageData[]>;
  
  /**
   * 健康检查
   */
  healthCheck(): Promise<boolean>;
}

/**
 * 同步结果
 */
export interface SyncResult {
  success: boolean;
  provider: string;
  data?: UsageData[];
  error?: string;
  duration: number; // ms
}
```

---

## 🛠️ Anthropic CLI 集成

### 实现步骤

**1. 安装和验证 Anthropic CLI**
```bash
# 检查是否已安装
which anthropic_api_usage

# 测试调用
anthropic_api_usage --api-key $ANTHROPIC_API_KEY
```

**2. 实现 AnthropicSync 类**

```typescript
// Tools/UsageSync/AnthropicSync.ts

import { exec } from 'child_process';
import { promisify } from 'util';
import { UsageSync, UsageData } from './interfaces';

const execAsync = promisify(exec);

export class AnthropicSync implements UsageSync {
  readonly provider = 'anthropic';
  readonly accuracy = 99;
  
  private apiKey: string;
  
  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('ANTHROPIC_API_KEY is required');
    }
  }
  
  async healthCheck(): Promise<boolean> {
    try {
      const { stdout } = await execAsync('which anthropic_api_usage');
      return stdout.trim().length > 0;
    } catch {
      return false;
    }
  }
  
  async fetchUsage(period?: { start: Date; end: Date }): Promise<UsageData[]> {
    try {
      // 调用 Anthropic CLI
      const { stdout } = await execAsync(
        `anthropic_api_usage --api-key ${this.apiKey} --format json`
      );
      
      // 解析输出
      const data = JSON.parse(stdout);
      
      // 转换为统一格式
      return this.transformData(data, period);
    } catch (error) {
      throw new Error(`Anthropic CLI failed: ${error.message}`);
    }
  }
  
  private transformData(data: any, period?: { start: Date; end: Date }): UsageData[] {
    // 根据实际 CLI 输出格式转换
    // 这里是示例结构
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return [{
      provider: 'anthropic',
      model: 'claude-3.5-sonnet',
      usage: {
        inputTokens: data.usage?.input_tokens || 0,
        outputTokens: data.usage?.output_tokens || 0,
        totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
        requests: data.usage?.requests || 0,
      },
      cost: data.cost_usd,
      source: '✅ API (官方)',
      accuracy: 99,
      period: {
        start: period?.start || startOfMonth,
        end: period?.end || now,
      },
      lastUpdated: now,
    }];
  }
}
```

---

## 🌐 OpenAI API 集成

### 实现步骤

**1. 安装依赖**
```bash
bun add openai
```

**2. 实现 OpenAISync 类**

```typescript
// Tools/UsageSync/OpenAISync.ts

import OpenAI from 'openai';
import { UsageSync, UsageData } from './interfaces';

export class OpenAISync implements UsageSync {
  readonly provider = 'openai';
  readonly accuracy = 99;
  
  private client: OpenAI;
  
  constructor(apiKey?: string) {
    const key = apiKey || process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error('OPENAI_API_KEY is required');
    }
    this.client = new OpenAI({ apiKey: key });
  }
  
  async healthCheck(): Promise<boolean> {
    try {
      // 简单的 API 调用验证
      await this.client.models.list();
      return true;
    } catch {
      return false;
    }
  }
  
  async fetchUsage(period?: { start: Date; end: Date }): Promise<UsageData[]> {
    try {
      // OpenAI Usage API 端点
      // GET https://api.openai.com/v1/usage
      
      const now = new Date();
      const startDate = period?.start || new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = period?.end || now;
      
      // 注意：OpenAI Usage API 可能需要特殊权限
      // 这里使用通用方法
      const response = await fetch('https://api.openai.com/v1/usage', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.client.apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      return this.transformData(data, { start: startDate, end: endDate });
    } catch (error) {
      throw new Error(`OpenAI API failed: ${error.message}`);
    }
  }
  
  private transformData(data: any, period: { start: Date; end: Date }): UsageData[] {
    // 根据实际 API 返回格式转换
    const now = new Date();
    
    // 按模型聚合
    const usageByModel: Record<string, UsageData> = {};
    
    for (const item of data.data || []) {
      const model = item.operation || 'unknown';
      
      if (!usageByModel[model]) {
        usageByModel[model] = {
          provider: 'openai',
          model,
          usage: {
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
            requests: 0,
          },
          source: '✅ API (官方)',
          accuracy: 99,
          period: { start: period.start, end: period.end },
          lastUpdated: now,
        };
      }
      
      usageByModel[model].usage.inputTokens += item.n_context_tokens_total || 0;
      usageByModel[model].usage.outputTokens += item.n_generated_tokens_total || 0;
      usageByModel[model].usage.totalTokens += 
        (item.n_context_tokens_total || 0) + (item.n_generated_tokens_total || 0);
      usageByModel[model].usage.requests += item.n_requests || 0;
    }
    
    return Object.values(usageByModel);
  }
}
```

---

## 🧪 单元测试

```typescript
// tests/UsageSync.test.ts

import { describe, test, expect, beforeAll } from 'bun:test';
import { AnthropicSync } from '../Tools/UsageSync/AnthropicSync';
import { OpenAISync } from '../Tools/UsageSync/OpenAISync';

describe('UsageSync', () => {
  describe('AnthropicSync', () => {
    let sync: AnthropicSync;
    
    beforeAll(() => {
      // 需要设置 ANTHROPIC_API_KEY 环境变量
      if (!process.env.ANTHROPIC_API_KEY) {
        console.warn('ANTHROPIC_API_KEY not set, skipping tests');
      }
    });
    
    test('should initialize correctly', () => {
      expect(() => new AnthropicSync()).not.toThrow();
    });
    
    test('should pass health check', async () => {
      sync = new AnthropicSync();
      const healthy = await sync.healthCheck();
      expect(healthy).toBe(true);
    });
    
    test('should fetch usage data', async () => {
      if (!process.env.ANTHROPIC_API_KEY) return;
      
      sync = new AnthropicSync();
      const data = await sync.fetchUsage();
      
      expect(data).toBeArray();
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty('provider', 'anthropic');
      expect(data[0]).toHaveProperty('usage');
      expect(data[0].accuracy).toBe(99);
    });
  });
  
  describe('OpenAISync', () => {
    let sync: OpenAISync;
    
    test('should initialize correctly', () => {
      if (!process.env.OPENAI_API_KEY) {
        console.warn('OPENAI_API_KEY not set, skipping tests');
        return;
      }
      expect(() => new OpenAISync()).not.toThrow();
    });
    
    test('should pass health check', async () => {
      if (!process.env.OPENAI_API_KEY) return;
      
      sync = new OpenAISync();
      const healthy = await sync.healthCheck();
      expect(healthy).toBe(true);
    });
  });
});
```

---

## ✅ 今日验收标准

### 必须完成
- [ ] `Tools/UsageSync/interfaces.ts` 创建完成
- [ ] `Tools/UsageSync/AnthropicSync.ts` 实现完成
- [ ] `Tools/UsageSync/OpenAISync.ts` 实现完成（至少 80%）
- [ ] AnthropicSync 能成功调用 CLI 并返回数据
- [ ] 数据格式符合 UsageData 接口
- [ ] 单元测试通过 (至少 AnthropicSync)

### 可选完成
- [ ] OpenAISync 完全实现并测试通过
- [ ] 错误处理和重试机制
- [ ] 日志记录

---

## 🚧 潜在问题和解决方案

### 问题 1: Anthropic CLI 未安装
**解决**: 
```bash
pip install anthropic-sdk
# 或
brew install anthropic-cli
```

### 问题 2: OpenAI Usage API 权限不足
**解决**: 
- 使用 Organization Admin 账号
- 或使用其他 OpenAI API 端点估算

### 问题 3: 环境变量未设置
**解决**: 
- 创建 `.env` 文件
- 在测试中提供清晰的错误信息

---

## 📝 开发备注

### 注意事项
1. **类型安全**: 严格使用 TypeScript 类型
2. **错误处理**: 所有外部调用都要 try-catch
3. **日志记录**: 关键步骤添加日志
4. **测试优先**: 先写测试，再写实现（TDD）

### Bun 特性利用
- 使用 `Bun.sh` 代替 child_process（更快）
- 使用 `Bun.file()` 读写文件
- 使用 `bun test` 运行测试

---

## 🎯 明日计划 (Day 2)

1. 完成 OpenAISync 剩余部分
2. 优化错误处理和重试机制
3. 完善单元测试（覆盖率 > 80%）
4. 开始准备 ZhiPuSync 接口设计
5. 文档更新

---

**准备就绪！开始第一天的开发 🚀**
