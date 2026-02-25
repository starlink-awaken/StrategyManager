# tests/ AGENTS.md

## OVERVIEW
基于 Bun 原生测试套件的自动化测试体系，包含 3500+ 行测试代码。覆盖从底层路径管理到高层策略 CRUD 及多厂商同步的核心逻辑。

## STRUCTURE
```
tests/
├── unit/                  # 核心模块单元测试
├── fixtures/              # 静态 Mock 数据
├── CLI.test.ts            # 命令行交互测试
├── DataProcessing.test.ts # 数据转换逻辑测试
├── ManageStrategies.test.ts # 策略生命周期测试
└── UsageSync.test.ts      # 多厂商同步逻辑测试
```

## WHERE TO LOOK
| 测试文件 | 对应源码 | 核心关注点 |
| :--- | :--- | :--- |
| `unit/PathManager.test.ts` | `Tools/PathManager.ts` | 路径解析、配置目录定位 |
| `unit/Validator.test.ts` | `Tools/Validator.ts` | Schema 校验、自动修复建议 |
| `unit/Recommender.*.test.ts` | `Tools/Recommender.ts` | 推荐评分算法、v2 重构逻辑 |
| `ManageStrategies.test.ts` | `Tools/ManageStrategies.ts` | 策略 CRUD、备份与回滚机制 |
| `UsageSync.test.ts` | `Tools/UsageSync/` | API 响应解析、成本计算 |
| `CLI.test.ts` | `Tools/UsageSync/CLI.ts` | 命令行参数解析与输出 |
| `DataProcessing.test.ts` | 通用逻辑 | 数据转换、格式化准确性 |

## TESTING PATTERNS
使用 `bun test` 运行。采用 `describe/it/expect` 经典模式。
```typescript
import { describe, it, expect, beforeEach } from "bun:test";

describe("Feature", () => {
  it("should handle success", async () => {
    const result = await targetFunction();
    expect(result).toBeDefined();
  });
});
```

## FIXTURES
Mock 数据统一管理于 `tests/fixtures/mock-data.ts`。
**模式**: 导出强类型的常量，避免在测试文件中硬编码复杂对象。
```typescript
import { mockStrategyConfig } from "./fixtures/mock-data";
// 在测试中直接使用 mockStrategyConfig
```

## COVERAGE TARGETS
| 模块 | 目标覆盖率 |
| :--- | :--- |
| PathManager | 90%+ |
| Validator | 85%+ |
| Recommender | 80%+ |
| ManageStrategies | 75%+ |
| UsageSync | 70%+ |

---
*注：Recommender.v2.test.ts 针对重构中的版本，修改算法时需同步更新。*
