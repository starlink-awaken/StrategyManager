# 文档总览

面向使用者的精简入口，覆盖快速上手、关键命令与主要能力。

---

## 1 分钟上手

1. 安装依赖：`bun install`
2. 列出策略：`/strategies list`
3. 获取推荐：`/strategies recommend "日常开发"`

---

## 主要能力

- 策略管理：列表、切换、对比、导入/导出、历史
- 智能推荐：场景 + 预算 + 配额感知
- 动态生成：基于场景与配额自动生成策略
- 使用同步：多平台使用与配额汇总
- 成本报告：成本分布与优化建议

---

## 常用命令（最小集）

### 方式 1: 在终端直接执行

```bash
# 列出策略
bun run Tools/ManageStrategies.ts list

# 切换策略
bun run Tools/ManageStrategies.ts switch strategy-2-balanced

# 推荐策略
bun run Tools/ManageStrategies.ts recommend "日常开发"

# 生成动态策略
bun run Tools/ManageStrategies.ts generate "日常开发" --priority balanced

# 成本报告
bun run Tools/ManageStrategies.ts cost-report
```

### 方式 2: 在 Claude Code 中使用（推荐）

需要先配置 OpenCode 集成，然后可以在 Claude Code 中使用：

```
@StrategyManager 推荐适合日常开发的策略
```

或使用斜杠命令：

```
/strategies list
/strategies recommend 日常开发
/strategies switch strategy-2-balanced
```

---

## 集成到 OpenCode（启用 /strategies 命令）

要在 Claude Code 中使用 `/strategies` 命令，需要配置 oh-my-opencode：

```bash
# 自动配置（推荐）
bash scripts/setup-opencode-integration.sh

# 或手动配置
# 见 OpenCode 集成指南
```

---

## 进一步阅读

- 📚 **[OpenCode 集成指南](./opencode-integration.md)** - 如何配置 `/strategies` 命令
- ⚙️ **[配置指南](./configuration.md)** - 环境变量和配置目录
- 📖 **[API 参考](./api-reference.md)** - 编程接口
