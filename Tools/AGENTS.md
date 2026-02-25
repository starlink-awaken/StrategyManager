# Tools 核心模块

**父级**: `./AGENTS.md`

## 概述

AI 策略管理核心功能集：策略 CRUD、智能推荐、多厂商使用同步、成本分析。11k+ 行 TypeScript 代码，Bun 运行时。

## 模块清单

| 模块 | 行数 | 职责 |
|------|------|------|
| ManageStrategies.ts | 2802 | 主入口：CLI 路由、策略切换、历史管理 |
| UsageSync/ | 2400+ | 多厂商使用同步（独立子模块） |
| Recommender.ts | 841 | 智能推荐引擎：场景预算质量评分 |
| Validator.ts | 489 | 策略验证：Schema 兼容性检查 |
| KeywordWeightEngine.ts | 533 | 关键词权重：自然语言解析 |
| PathManager.ts | 195 | 路径管理：配置目录解析 |
| ContextEnhancer.ts | 295 | 上下文增强：推荐上下文构造 |
| CostReport.ts | 91 | 成本报告：GitHub Copilot 分析 |

## 核心类与接口

### 主入口：ManageStrategies
```typescript
// 命令路由（Commander）
program
  .command("list")
  .command("switch <name>")
  .command("compare <a> <b>")
  .command("recommend [scenario]")
  .command("validate <file>")
  // ... 10+ commands

// 关键函数
switchStrategy(name)      // 策略切换 + 备份
compareStrategies(a, b)   // 差异可视化
recommend(scenario)       // 智能推荐
importStrategy(path)       // 导入 + 验证
exportStrategy(name, out) // 导出 JSON
```

### 推荐：Recommender
```typescript
class SmartRecommender {
  // 多因素评分
  calculateScore(strategy, context): number

  // 场景类型
  scenarioTypes = {
    "日常开发", "深度研究", "创意写作", "成本敏感"
  }

  // 优先级
  priorities = {
    "balanced", "quality", "cost", "speed"
  }
}
```

### 验证：Validator
```typescript
class StrategyValidator {
  // 三层验证
  validate(config): {
    errors: ValidationError[]
    warnings: ValidationWarning[]
    info: ValidationInfo[]
  }

  // 自动修复建议
  suggestFixes(errors): FixSuggestion[]
}
```

### 路径：PathManager
```typescript
class PathManager {
  // 配置目录（优先级）
  getConfigDir(): string
  getStrategiesDir(): string
  getHistoryPath(): string
  getBackupDir(): string
}
```

## 导入依赖关系

```
ManageStrategies.ts
  ├─ PathManager (路径解析)
  ├─ Recommender (推荐引擎)
  └─ UsageSync (使用同步)

Recommender.ts
  ├─ KeywordWeightEngine (关键词解析)
  └─ ContextEnhancer (上下文)

Validator.ts (独立)
```

## 工作流映射

| CLI 命令 | 工作流 |
|----------|--------|
| list | Workflows/List.md |
| switch | Workflows/Switch.md |
| compare | Workflows/Compare.md |
| recommend | Workflows/Recommend.md |
| validate | Workflows/Validate.md |
| import/export | Workflows/Import.md / Export.md |
| history/rollback | Workflows/History.md |
| fix | Workflows/Fix.md |

## 注意事项

#MV|- **ManageStrategies.ts**: 单文件 2882 行，修改前评估拆分必要性（当前技术债务）
- **UsageSync/** 独立子模块，详见 `Tools/UsageSync/AGENTS.md`
#YK|- **Recommender.v2**: 存在（`tests/unit/Recommender.v2.test.ts`），重构进行中
#BY|- **颜色输出**: 使用 `chalk`，遵循 green=success, red=error, yellow=warn, blue=info
#HV|- **硬性约束**: 禁止使用 `as any` 或 `@ts-ignore`（代码库有 24 处违规）
