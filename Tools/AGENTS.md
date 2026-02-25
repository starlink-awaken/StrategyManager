# Tools 核心模块

**父级**: `../AGENTS.md`

## OVERVIEW
AI 策略管理核心逻辑实现层。11k+ 行 TypeScript 代码，涵盖策略 CRUD、智能推荐、多厂商同步及成本分析。

## STRUCTURE
- `ManageStrategies.ts`: 主入口，负责 CLI 路由与核心调度。
- `UsageSync/`: 独立子模块，处理多平台使用数据同步。
- `Recommender.ts`: 推荐引擎，基于场景与预算进行评分。
- `Validator.ts`: 策略 Schema 验证与自动修复建议。
- `KeywordWeightEngine.ts`: 自然语言解析与关键词权重计算。
- `PathManager.ts`: 跨平台路径解析与配置定位。
- `ContextEnhancer.ts`: 推荐上下文构造与增强。
- `CostReport.ts`: 成本分析与 GitHub Copilot 报告生成。

## WHERE TO LOOK
- **策略切换与列表**: `ManageStrategies.ts` (2802 行)。
- **推荐逻辑**: `Recommender.ts` (841 行) 与 `KeywordWeightEngine.ts`。
- **路径与备份管理**: `PathManager.ts`。
- **Schema 校验**: `Validator.ts`。

## CONVENTIONS
- **单文件规模**: `ManageStrategies.ts` 超过 2500 行，修改前需评估拆分必要性。
- **符号统计**: 55 functions, 16 interfaces, 包含多组核心常量。
- **错误处理**: 强制使用 `chalk` 彩色输出（green=成功, red=错误, yellow=警告, blue=信息）。

## MODULES
- `ManageStrategies`: 核心调度器，依赖 `PathManager`, `Recommender`, `UsageSync`。
- `SmartRecommender`: 评分引擎，依赖 `KeywordWeightEngine`, `ContextEnhancer`。
- `StrategyValidator`: 独立验证器，支持 Error/Warn/Info 三层校验。

## WORKFLOWS
| CLI 命令 | 映射工作流 |
| :--- | :--- |
| `list` / `switch` | `Workflows/List.md`, `Workflows/Switch.md` |
| `recommend` | `Workflows/Recommend.md` |
| `compare` | `Workflows/Compare.md` |
| `validate` / `fix` | `Workflows/Validate.md`, `Workflows/Fix.md` |
| `history` / `rollback` | `Workflows/History.md` |
| `sync-usage` | `Workflows/UsageSync.md` |],op:
