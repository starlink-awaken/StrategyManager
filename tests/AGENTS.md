# Tests 测试套件

**父级**: `../AGENTS.md`

## 概述

Bun 原生测试套件，3500+ 行测试代码，覆盖核心模块。8 个测试文件，Mock 数据支持。

## 目录结构

```
tests/
├── unit/                  # 单元测试
│   ├── PathManager.test.ts
│   ├── Validator.test.ts
│   ├── Recommender.test.ts
│   └── Recommender.v2.test.ts  # 重构版本测试
├── fixtures/              # Mock 数据
│   └── mock-data.ts
├── CLI.test.ts            # CLI 命令测试
├── DataProcessing.test.ts # 数据处理测试
├── ManageStrategies.test.ts  # 核心功能测试
└── UsageSync.test.ts      # 使用同步测试
```

## 测试文件映射

| 测试文件 | 模块 | 测试内容 |
|---------|------|---------|
| PathManager.test.ts | `Tools/PathManager.ts` | 路径解析、配置目录 |
| Validator.test.ts | `Tools/Validator.ts` | Schema 验证、错误检测 |
| Recommender.test.ts | `Tools/Recommender.ts` | 推荐算法、评分逻辑 |
| Recommender.v2.test.ts | `Tools/Recommender.ts` | 重构版本测试 |
| CLI.test.ts | `Tools/UsageSync/CLI.ts` | CLI 命令行 |
| DataProcessing.test.ts | 通用 | 数据转换、格式化 |
| ManageStrategies.test.ts | `Tools/ManageStrategies.ts` | 策略 CRUD、切换 |
| UsageSync.test.ts | `Tools/UsageSync/` | 多厂商同步 |

## Mock 数据

### fixtures/mock-data.ts
```typescript
// Mock 策略配置
export const mockStrategyConfig: StrategyConfig = {
  agents: {
    "agent1": {
      model: "claude-3-opus",
      category: "deep"
    }
  }
}

// Mock 使用数据
export const mockUsageData: UsageData = {
  provider: "anthropic",
  model: "claude-3-opus",
  usage: {
    inputTokens: 1000,
    outputTokens: 500,
    totalTokens: 1500
  },
  cost: 0.03
}
```

## 测试命令

```bash
# 所有测试
bun test

# 单元测试
bun test tests/unit/

# 特定测试
bun test tests/unit/Validator.test.ts

# 覆盖率
bun test --coverage

# 监听模式
bun test --watch
```

## 测试模式

```typescript
import { describe, it, expect, beforeEach } from "bun:test"

describe("模块名", () => {
  beforeEach(() => { /* setup */ })

  it("应该做什么", () => {
    expect(result).toBe(expected)
  })
})
```

### 异步 & Mock
```typescript
it("异步操作", async () => {
  const result = await asyncFunction()
  expect(result).toBeDefined()
})

it("Mock 数据", () => {
  const mockConfig = mockStrategyConfig
  expect(validate(mockConfig).errors).toHaveLength(0)
})
```

## 覆盖率目标

| 模块 | 目标 | 当前 |
|------|------|------|
#ZQ|| PathManager | 90%+ | ✅ |
#YY|| Validator | 85%+ | ✅ |
#ST|| Recommender | 80%+ | ✅ |
#MK|| ManageStrategies | 75%+ | ✅ |
#TY|| UsageSync | 70%+ | ⚠️ 未达 |
| Validator | 85% | ✅ |
| Recommender | 80% | ✅ |
| ManageStrategies | 75% | ✅ |
| UsageSync | 70% | ⚠️ |

## 测试约定

### 命名
- 测试文件: `<ModuleName>.test.ts`
- 测试组: `describe("模块名", ...)`
- 测试用例: `it("应该做什么", ...)`

### 断言
```typescript
.toBe()      .toEqual()      .toBeDefined()
.toBeGreaterThan()  .toHaveLength()  .toThrow()
```

## 已知问题

#YN|- **Recommender.v2.test.ts**: 存在重构版本测试，Recommender 处于重构中
#HQ|- **UsageSync 覆盖率**: 目标 70%+，当前未达目标
#QR|- **测试文件规模**: 最大测试文件 Recommender.test.ts 达 837 行，Validator.test.ts 达 655 行
- **UsageSync 覆盖率**: 目标 70%，当前未达

## 注意事项

- 使用 Bun 原生测试（`bun test`）
- Mock 数据统一放在 `tests/fixtures/mock-data.ts`
- 遵循命名约定：`<ModuleName>.test.ts`
- 测试覆盖率目标：核心模块 80%+
