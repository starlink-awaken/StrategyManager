# OpenCode 集成指南

如何在 oh-my-opencode 中配置和使用 StrategyManager 的 `/strategies` 命令。

---

## 快速设置（推荐）

运行自动配置脚本：

```bash
bash scripts/setup-opencode-integration.sh
```

脚本会自动：

1. 验证 StrategyManager 已安装到 `~/.config/opencode/skills/`
2. 创建或更新 `~/.config/opencode/oh-my-opencode.json`
3. 配置 `/strategies` 命令的所有必要设置

---

## 手动配置

### 第1步：确保 StrategyManager 已安装

```bash
ls -la ~/.config/opencode/skills/StrategyManager
```

如果不存在，运行：

```bash
bash scripts/install.sh
```

### 第2步：配置 oh-my-opencode.json

编辑 `~/.config/opencode/oh-my-opencode.json`：

```bash
nano ~/.config/opencode/oh-my-opencode.json
```

添加或更新以下配置：

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/master/assets/oh-my-opencode.schema.json",

  // 启用 StrategyManager 技能
  "skills": {
    "sources": [
      // 其他 skill 源...
    ],
    "enable": ["StrategyManager"],

    // 配置 StrategyManager 的命令别名和处理器
    "StrategyManager": {
      "description": "管理 AI 模型策略配置 - 列表、切换、对比、推荐、成本分析",
      "template": "你是 StrategyManager 专家。根据用户的请求，使用 StrategyManager 的工作流来管理策略。\n\n用户请求: {{input}}\n\n可用操作:\n- 列表策略: Workflows/List.md\n- 切换策略: Workflows/Switch.md\n- 对比策略: Workflows/Compare.md\n- 推荐策略: Workflows/Recommend.md\n- 生成动态策略: Workflows/Generate.md\n- 导入/导出: Workflows/Import.md, Workflows/Export.md\n- 历史管理: Workflows/History.md\n- 成本报告: Workflows/CostReport.md\n- 使用同步: Workflows/UsageSync.md\n- 验证修复: Workflows/Validate.md, Workflows/Fix.md",
    },
  },

  // 可选：创建自定义命令快捷方式
  // 注意：此功能需要 oh-my-opencode >= 3.2.0
  "custom_commands": {
    "/strategies": {
      "skill": "StrategyManager",
      "description": "管理策略配置",
    },
  },
}
```

### 第3步：验证配置

重新启动 OpenCode：

```bash
# 验证配置有效性
opencode --version

# 查看 StrategyManager 是否已加载
opencode doctor
```

---

## 使用 `/strategies` 命令

### 通过自然语言触发

在 Claude Code 或 OpenCode 中：

```
@StrategyManager 列出所有策略
```

或直接使用斜杠命令（如果配置了 custom_commands）：

```
/strategies list
/strategies recommend 日常开发
/strategies switch strategy-2-balanced
```

### 支持的操作

| 操作 | 命令示例                                                         | 映射工作流              |
| ---- | ---------------------------------------------------------------- | ----------------------- |
| 列表 | `/strategies list`                                               | Workflows/List.md       |
| 切换 | `/strategies switch strategy-2-balanced`                         | Workflows/Switch.md     |
| 对比 | `/strategies compare strategy-1-performance strategy-2-balanced` | Workflows/Compare.md    |
| 推荐 | `/strategies recommend "日常开发"`                               | Workflows/Recommend.md  |
| 生成 | `/strategies generate "深度研究" --priority quality`             | Workflows/Generate.md   |
| 成本 | `/strategies cost-report`                                        | Workflows/CostReport.md |
| 同步 | `/strategies sync-usage`                                         | Workflows/UsageSync.md  |
| 历史 | `/strategies history`                                            | Workflows/History.md    |
| 验证 | `/strategies validate ./strategy.jsonc`                          | Workflows/Validate.md   |
| 修复 | `/strategies fix ./strategy.jsonc`                               | Workflows/Fix.md        |
| 导入 | `/strategies import ./my-strategy.jsonc`                         | Workflows/Import.md     |
| 导出 | `/strategies export strategy-2-balanced -o ./backup.jsonc`       | Workflows/Export.md     |

---

## 故障排查

### 问题：`/strategies` 命令不识别

**解决方案：**

1. 确认 StrategyManager 已在 skills 启用列表中
2. 重启 OpenCode：`opencode --version`
3. 检查 `~/.config/opencode/oh-my-opencode.json` 语法是否正确

```bash
# 验证 JSON 有效性
jq . ~/.config/opencode/oh-my-opencode.json
```

### 问题：触发时出现错误

**解决方案：**

1. 查看 OpenCode 日志：`~/.config/opencode/logs/`
2. 确保 StrategyManager 工作流文件存在
3. 运行配置诊断：`opencode doctor`

### 问题：工作流不执行

**解决方案：**

1. 验证工作流文件路径正确
2. 检查依赖的 Tools 是否可访问
3. 确保有必要的 API 密钥（如用 cost-report 需要 Anthropic/OpenAI 密钥）

---

## 配置示例

### 完整的 oh-my-opencode.json 示例

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/master/assets/oh-my-opencode.schema.json",

  // 代理配置
  "agents": {
    "Sisyphus": {
      "model": "anthropic/claude-opus-4-5",
    },
    "oracle": {
      "model": "openai/gpt-5.2",
    },
  },

  // Skill 配置
  "skills": {
    "sources": [{ "path": "~/.config/opencode/skills", "recursive": true }],
    "enable": ["StrategyManager", "git-master"],

    "StrategyManager": {
      "description": "管理 AI 模型策略配置 - 列表、切换、对比、推荐、成本分析",
      "template": "你是 StrategyManager 专家。根据用户的请求，使用 StrategyManager 的工作流来管理策略。",
    },
  },

  // 分类配置
  "categories": {
    "quick": {
      "model": "anthropic/claude-haiku-4-5",
    },
    "ultrabrain": {
      "model": "openai/gpt-5.2-codex",
      "variant": "xhigh",
    },
  },
}
```

---

## 进阶配置

### 为不同的策略操作指定不同的 Agent

```jsonc
{
  "skills": {
    "StrategyManager": {
      "description": "管理策略",
      "agent": "Sisyphus", // 使用 Sisyphus agent
      "template": "使用 StrategyManager 完成策略管理任务...",
    },
  },
}
```

### 为成本报告指定 OpenAI 的 GPT

```bash
# 在环境变量中配置（可选）
export STRATEGY_REPORT_AGENT="oracle"  # 使用 oracle agent 处理复杂的成本分析
```

---

## 验证成功

运行以下命令确认配置成功：

```bash
# 1. 验证 StrategyManager 已加载
opencode doctor | grep -i strategy

# 2. 列出所有可用的 skills
opencode skills list

# 3. 测试执行一个简单的策略命令
# 在 OpenCode 中输入：
# /strategies list
```

---

## 更多帮助

- 📖 [StrategyManager 使用指南](./overview.md)
- ⚙️ [配置参考](./configuration.md)
- 🔗 [API 参考](./api-reference.md)
- 📚 [oh-my-opencode 官方文档](https://github.com/code-yeongyu/oh-my-opencode/tree/dev/docs)
