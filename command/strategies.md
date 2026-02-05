---
description: Manage and operate strategies (list, switch, fix, validate, compare, history, recommend, generate, export, import, cost-report, usage-sync, feedback, help)
---

Usage: /strategies <subcommand> [options]

Subcommands:

- list [--include-dynamic]
  - 描述: 列出所有策略，按名称、版本、最后修改时间和状态显示表格。
  - 用法: /strategies list [--include-dynamic]
  - 输出: ASCII 表格。表格包含: name | version | active? | modifiedAt
  - --include-dynamic: 包含动态生成的策略

- switch <name>
  - 描述: 切换到指定策略（创建备份并记录历史）。
  - 用法: /strategies switch <name>
  - 交互: 在执行前提示确认（显示当前策略 -> 目标策略的简要差异）。

- fix
  - 描述: 根据 StrategyManager 的修复工具自动修正发现的策略问题（格式/字段/依赖）。
  - 用法: /strategies fix [--dry-run]
  - 交互: 默认提示确认修复操作（显示将被修改的文件列表）。
  - --dry-run: 仅报告建议更改，不写文件。

- validate
  - 描述: 验证策略配置的完整性与架构符合性。
  - 用法: /strategies validate [<name>] [--strict]
  - 输出: 列表形式显示验证结果；非零返回码表示失败。
  - --strict: 启用更严格的规则（额外检查兼容性）。

- compare <strategy1> <strategy2>
  - 描述: 对比两个策略文件的差异，按字段列出变更、新增、移除和值变化。
  - 用法: /strategies compare <strategy1> <strategy2> [--keys-only]
  - 输出: 彩色差异（绿色=新增, 红色=删除, 黄色=修改）和结构化摘要。

- history [limit]
  - 描述: 查看策略操作历史（切换/导入/回滚），默认显示最近记录。
  - 用法: /strategies history [limit]
  - 输出: 时间戳 | action | user | details 表格。

- rollback <timestamp>
  - 描述: 回滚到指定时间戳的策略快照（从历史中恢复）。
  - 用法: /strategies rollback <timestamp>
  - 交互: 强制确认（显示将恢复的文件及差异）。

- recommend <description> [options]
  - 描述: 基于场景描述智能推荐策略，支持多因素评分和配额感知。
  - 用法: /strategies recommend <description> [--priority quality|cost|speed|balanced] [--include-dynamic] [--with-usage-sync] [--budget-monthly <amount>] [--budget-spent <amount>] [--budget-alert <ratio>]
  - 输出: 推荐策略名称、评分、理由和匹配度。
  - --priority: 优先级（quality=质量优先，cost=成本优先，speed=速度优先，balanced=均衡）
  - --include-dynamic: 包含动态生成的策略
  - --with-usage-sync: 同步配额状态并基于配额进行推荐
  - --budget-monthly: 月度预算（人民币）
  - --budget-spent: 当前已花费金额
  - --budget-alert: 预算警告阈值（0-1，默认 0.8）

- generate <description> [options]
  - 描述: 根据场景和配额状态动态生成优化策略配置。
  - 用法: /strategies generate <description> [--priority quality|cost|speed|balanced] [--retention <days>] [--no-save] [--with-usage-sync]
  - 输出: 动态策略名称、基础模板、文件路径。
  - --priority: 优先级
  - --retention: 保留天数（默认 7 天）
  - --no-save: 不保存到文件系统（仅返回配置）
  - --with-usage-sync: 基于实时配额状态优化

- save-dynamic <dynamic-name> <target-name>
  - 描述: 将动态策略保存为永久策略。
  - 用法: /strategies save-dynamic <dynamic-name> <target-name>
  - 输出: 保存成功消息。

- cleanup-dynamic [--retention <days>]
  - 描述: 清理过期的动态策略。
  - 用法: /strategies cleanup-dynamic [--retention 7]
  - 输出: 已清理的策略数量。
  - --retention: 保留天数（默认 7 天）

- feedback <scenario> <recommended> <selected> [--score <number>]
  - 描述: 记录推荐反馈（用户选择的策略 vs 系统推荐）。
  - 用法: /strategies feedback <scenario> <recommended> <selected> [--score 80]
  - --score: 用户评分（0-100）

- feedback-report [options]
  - 描述: 生成推荐反馈报告，分析采纳率和策略偏好。
  - 用法: /strategies feedback-report [--bucket day|week|month] [--format text|json] [--output <file>]
  - 输出: 推荐次数、采纳率、Top 策略统计、时间趋势。
  - --bucket: 时间分桶（day=按天，week=按周，month=按月）
  - --format: 输出格式（text=文本报告，json=JSON 数据）
  - --output: 输出文件路径

- export <name> [output-file]
  - 描述: 导出指定策略为 JSON 文件（默认导出到当前工作目录，文件名 <name>.json）。
  - 用法: /strategies export <name> [output-file]
  - 输出: 成功消息并显示目标路径。

- import <input-file> [--validate]
  - 描述: 导入策略文件（支持 JSON/JSONC）。默认启用验证。
  - 用法: /strategies import <input-file> [--validate]
  - 交互: 若导入将覆盖现有同名策略，提示确认。
  - --validate: 启用/禁用导入时的验证（默认启用）。

- help
  - 描述: 显示帮助信息与示例用法。

Color output conventions:

- 使用颜色常量：
  - success (绿色): 用于成功消息与确认成功的操作。
  - error (红色): 用于错误与失败信息。
  - warn (黄色): 用于警告、潜在风险或注意事项。
  - info (蓝色): 用于普通信息输出和步骤说明。

- 在终端上使用 ANSI 颜色转义序列。

Interactive confirmations:

- 默认在执行前提示确认（对于需要的命令）
- 确认格式：显示要变更的摘要（差异/将写入的文件/备份位置）
- 非交互式自动化可通过环境变量或特定参数实现

Integration with StrategyManager skill:

- 所有子命令将调用 StrategyManager skill 的对应工作流：
  - list -> Workflows/List.md
  - switch -> Workflows/Switch.md
  - fix -> Workflows/Fix.md
  - validate -> Workflows/Validate.md
  - compare -> Workflows/Compare.md
  - history/rollback -> Workflows/History.md
  - recommend -> Workflows/Recommend.md
  - generate -> Workflows/Generate.md
  - feedback/feedback-report -> Workflows/FeedbackReport.md
  - export -> Workflows/Export.md
  - import -> Workflows/Import.md
  - cost-report -> Workflows/CostReport.md (通过独立工具)
  - usage-sync -> Workflows/UsageSync.md (通过独立工具)

- 调用模式：命令层负责参数解析与交互（颜色输出/确认）；Skill 层负责执行业务逻辑（读写策略、对比、校验、推荐算法）。
- 错误处理：当 Skill 返回错误/异常时，命令打印红色错误并返回非零退出码；若 Skill 提供可修复建议，命令提示用户运行 /strategies fix。

UX notes and examples:

- 列出策略（包含动态策略）：
  /strategies list --include-dynamic

- 切换策略（交互）：
  /strategies switch strategy-2-balanced
  Info: 当前策略: strategy-1-performance -> 目标: strategy-2-balanced
  Diff: - agent.alpha.model: claude-opus -> claude-sonnet (yellow)
  Proceed? (y/N)

- 智能推荐（配额感知）：
  /strategies recommend "日常开发" --priority balanced --with-usage-sync --budget-monthly 500

- 生成动态策略：
  /strategies generate "深度研究" --priority quality --with-usage-sync

- 对比策略（彩色）：
  /strategies compare strategy-2-balanced strategy-3-economical
  输出中: + 新增字段 (green), - 删除字段 (red), ~ 修改 (yellow)

- 反馈报告（按周统计）：
  /strategies feedback-report --bucket week --format text

Implementation details (for implementers):

- 输出颜色应封装为 COLORS 常量（支持 names: reset, green, red, yellow, blue, cyan, magenta）
- 表格格式化使用 formatTable 函数（动态列宽计算）
- 验证返回非零时应打印简明失败原因与修复建议
- 动态策略文件名格式：`strategy-generated-{scenario}-{timestamp}.jsonc`
- 推荐反馈记录格式：`{ timestamp, scenario, recommendedStrategy, selectedStrategy?, score?, quotaSnapshot? }`

Advanced features:

### 配额感知推荐

当使用 `--with-usage-sync` 参数时，系统会：

1. 自动同步各提供商的配额状态
2. 识别配额紧张的提供商（使用率 ≥ 80%）
3. 推荐避免使用受限提供商的策略
4. 在推荐理由中说明配额考虑

### 动态策略生成

动态策略系统支持：

1. **场景识别**: 自动识别 education/health/finance/coding/research/creative/daily 等场景
2. **模板选择**: 基于场景选择合适的基础模板
3. **配额优化**: 根据实时配额状态调整模型选择
4. **参数调优**: 根据场景类型调整 temperature/top_p/maxTokens 等参数
5. **自动清理**: 支持定期清理过期动态策略（默认 7 天）

### 反馈分析

反馈报告提供：

1. **采纳率**: 推荐策略被实际采纳的比例
2. **Top 策略**: 最常推荐和最常选择的策略
3. **时间趋势**: 按天/周/月统计的使用变化
4. **评分分布**: 用户对推荐的满意度

### 成本分析（独立工具）

通过 Tools/CostReport.ts 提供：

1. **使用统计**: Token 使用、请求次数、模型分布
2. **成本分析**: 直接成本、间接成本、单位成本
3. **GitHub Copilot**: 代码补全、聊天等使用情况
4. **优化建议**: 基于使用模式的优化方案

### 使用同步（独立工具）

通过 Tools/UsageSync 提供多厂商集成：

- **Anthropic**: 配额百分比、重置时间
- **OpenAI**: 使用统计、成本
- **GitHub Copilot**: 代码补全和高级模型使用
- **Google Gemini**: 配额使用情况
- **ZhiPu AI**: 使用统计
- **DeepSeek**: 使用统计
- **SiliconFlow**: 使用统计

Files created/updated by workflows:

- Strategy files: $STRATEGIES_DIR/<name>.jsonc
- Dynamic strategy files: $STRATEGIES_DIR/strategy-generated-{scenario}-{timestamp}.jsonc
- History store: $CONFIG_DIR/strategy-history.json
- Recommendation feedback: $CONFIG_DIR/recommendation-feedback.json
- Backups: $CONFIG_DIR/backups/<name>-<timestamp>.jsonc
- Usage sync data: $CONFIG_DIR/usage-sync-data.json (if enabled)

Directory structure:

```
$HOME/.config/opencode/
├── oh-my-opencode.json           # OpenCode 主配置文件
├── strategies/                   # 策略文件目录
│   ├── strategy-0-super.jsonc
│   ├── strategy-1-performance.jsonc
│   ├── strategy-2-balanced.jsonc
│   ├── strategy-2-balanced-copilot.jsonc
│   ├── strategy-2-balanced-direct.jsonc
│   ├── strategy-3-economical.jsonc
│   ├── strategy-4-creative.jsonc
│   ├── strategy-5-research.jsonc
│   └── strategy-generated-*.jsonc  # 动态生成的策略
├── strategy-history.json         # 操作历史记录
├── recommendation-feedback.json  # 推荐反馈数据
├── usage-sync-data.json         # 使用同步数据（可选）
└── backups/                     # 备份目录
    └── *.jsonc
```

Available strategy templates:

| 模板名称                    | 成本/月    | 适用场景            | 特点                   |
| --------------------------- | ---------- | ------------------- | ---------------------- |
| strategy-0-super            | ¥2000-3000 | 关键项目、必须成功  | 全 Claude Opus，极致   |
| strategy-1-performance      | ¥1000-1500 | 重要任务、生产环境  | Claude Sonnet 主导     |
| strategy-2-balanced         | ¥400-700   | 日常工作（推荐）    | Sonnet + Haiku 均衡    |
| strategy-2-balanced-copilot | ¥400-700   | GitHub Copilot 优化 | 充分利用 Copilot 额度  |
| strategy-2-balanced-direct  | ¥400-700   | 直接 API 调用       | 避免 Copilot 路由      |
| strategy-3-economical       | ¥50-150    | 成本敏感、学习探索  | Haiku + 国产模型       |
| strategy-4-creative         | ¥500-800   | 创意写作、新媒体    | Sonnet + 高 temp       |
| strategy-5-research         | ¥1800-2500 | 深度研究、金融分析  | Extended thinking 开启 |

Common workflows:

1. **首次使用**：

   ```bash
   bun run Tools/ManageStrategies.ts list
   bun run Tools/ManageStrategies.ts switch strategy-2-balanced
   ```

2. **智能推荐**：

   ```bash
   bun run Tools/ManageStrategies.ts recommend "日常开发" --priority balanced
   bun run Tools/ManageStrategies.ts recommend "深度研究" --with-usage-sync
   ```

3. **动态生成**：

   ```bash
   bun run Tools/ManageStrategies.ts generate "学生学习" --priority cost
   bun run Tools/ManageStrategies.ts cleanup-dynamic --retention 7
   ```

4. **配额监控**：

   ```bash
   # 通过独立工具进行使用同步
   bun run Tools/UsageSync/CLI.ts sync anthropic
   bun run Tools/UsageSync/CLI.ts sync --all

   # 通过 CostReport 工具生成成本报告
   bun run Tools/CostReport.ts --period month
   ```

5. **反馈分析**：
   ```bash
   bun run Tools/ManageStrategies.ts feedback "日常开发" "strategy-2-balanced" "strategy-2-balanced" --score 90
   bun run Tools/ManageStrategies.ts feedback-report --bucket week
   ```

Environment variables:

- `OPENCODE_CONFIG_DIR`: 覆盖默认配置目录（默认 `~/.config/opencode`）
- `OPENCODE_STRATEGIES_DIR`: 覆盖策略目录（默认 `$OPENCODE_CONFIG_DIR/strategies`）
- `OPENCODE_TEMPLATES_DIR`: 覆盖模板目录（默认项目根目录的 `templates/`）

Related tools:

- **ManageStrategies.ts**: 主要策略管理工具
- **UsageSync/CLI.ts**: 使用同步工具（多厂商 API 调用）
- **CostReport.ts**: 成本分析工具
- **PathManager.ts**: 路径管理工具
- **Recommender.ts**: 智能推荐引擎
- **Validator.ts**: 策略验证器

Notes:

- 请勿在此文件中实现业务逻辑；该文档仅为命令层说明，实际逻辑放在 Tools/ 和 Workflows/。
- 所有策略文件必须符合 oh-my-opencode 官方 schema 规范。
- 动态策略默认 7 天后自动清理，可通过 --retention 参数调整。
- 推荐反馈数据用于改进推荐算法，建议定期查看 feedback-report。
- 配额同步需要配置相应的 API 密钥，参考 Tools/UsageSync/setup_auth.ts。
