---
description: Manage and operate strategies (list, switch, fix, validate, compare, history, rollback, recommend, generate, export, import, cost-report, usage-sync, health, govern, feedback, help)
argument-hint: [list|switch|recommend|compare|validate|fix|import|export|history|rollback|generate|cost-report|usage-sync|health|govern|feedback|feedback-report|help]
allowed-tools:
  - bash
  - read_file
  - grep_search
---

# StrategyManager Command Handler

## 用户输入

{{{args}}}

## 命令执行

```bash
#!/bin/bash

# 解析 Skill 路径（支持软链接）
SKILL_PATH="${HOME}/.config/opencode/skills/StrategyManager"
if [ -L "$SKILL_PATH" ]; then
  REAL_PATH="$(readlink "$SKILL_PATH" 2>/dev/null)"
  if [ -z "$REAL_PATH" ]; then
    REAL_PATH="$(readlink -f "$SKILL_PATH" 2>/dev/null)"
  fi
  [ -n "$REAL_PATH" ] && SKILL_PATH="$REAL_PATH"
fi

# 验证路径
if [ ! -d "$SKILL_PATH" ]; then
  echo "错误: StrategyManager skill 未找到"
  echo "路径: $SKILL_PATH"
  echo "请先安装: bash scripts/install.sh"
  exit 1
fi

# 切换到 skill 目录
cd "$SKILL_PATH" || exit 1

# 解析用户输入并执行
USER_INPUT="{{{args}}}"

# 命令路由
case "$USER_INPUT" in
  list*)
    bun run Tools/ManageStrategies.ts list ${USER_INPUT#list}
    ;;
  switch*)
    bun run Tools/ManageStrategies.ts switch ${USER_INPUT#switch}
    ;;
  recommend*)
    bun run Tools/ManageStrategies.ts recommend ${USER_INPUT#recommend}
    ;;
  generate*)
    bun run Tools/ManageStrategies.ts generate ${USER_INPUT#generate}
    ;;
  compare*)
    bun run Tools/ManageStrategies.ts compare ${USER_INPUT#compare}
    ;;
  validate*)
    bun run Tools/ManageStrategies.ts validate ${USER_INPUT#validate}
    ;;
  fix*)
    bun run Tools/ManageStrategies.ts fix ${USER_INPUT#fix}
    ;;
  history*)
    bun run Tools/ManageStrategies.ts history ${USER_INPUT#history}
    ;;
  rollback*)
    bun run Tools/ManageStrategies.ts rollback ${USER_INPUT#rollback}
    ;;
  export*)
    bun run Tools/ManageStrategies.ts export ${USER_INPUT#export}
    ;;
  import*)
    bun run Tools/ManageStrategies.ts import ${USER_INPUT#import}
    ;;
  cost-report*)
    bun run Tools/CostReport.ts ${USER_INPUT#cost-report}
    ;;
  usage-sync*|usage-report*|sync-usage*)
    bun run Tools/UsageSync/CLI.ts ${USER_INPUT#usage-sync}
    ;;
  health*|check-health*|provider-status*)
    bun run Tools/ManageStrategies.ts health ${USER_INPUT#health}
    ;;
  govern*)
    bun run Tools/ManageStrategies.ts govern ${USER_INPUT#govern}
    ;;
  feedback-report*)
    bun run Tools/ManageStrategies.ts feedback-report ${USER_INPUT#feedback-report}
    ;;
  feedback*)
    bun run Tools/ManageStrategies.ts feedback ${USER_INPUT#feedback}
    ;;
  save-dynamic*)
    bun run Tools/ManageStrategies.ts save-dynamic ${USER_INPUT#save-dynamic}
    ;;
  cleanup-dynamic*)
    bun run Tools/ManageStrategies.ts cleanup-dynamic ${USER_INPUT#cleanup-dynamic}
    ;;
  disable-provider*|enable-model*)
    bun run Tools/ManageStrategies.ts health ${USER_INPUT}
    ;;
  help|--help|-h|"")
    bun run Tools/ManageStrategies.ts --help
    ;;
  *)
    echo "未知命令: $USER_INPUT"
    echo "使用 /strategies help 查看帮助"
    exit 1
    ;;
esac
```

## 命令与工作流映射

所有子命令调用 StrategyManager skill 的对应工作流，详细 SOP 请查阅各工作流文件：

| 子命令                              | 工作流                          | 说明                         |
| ----------------------------------- | ------------------------------- | ---------------------------- |
| `list`                              | `Workflows/List.md`             | 列出所有策略                 |
| `switch`                            | `Workflows/Switch.md`           | 切换到指定策略               |
| `compare`                           | `Workflows/Compare.md`          | 对比两个策略差异             |
| `validate`                          | `Workflows/Validate.md`         | 验证策略配置完整性           |
| `fix`                               | `Workflows/Fix.md`              | 自动修复策略问题             |
| `export`                            | `Workflows/Export.md`           | 导出策略为 JSON              |
| `import`                            | `Workflows/Import.md`           | 导入策略文件                 |
| `history` / `rollback`              | `Workflows/History.md`          | 查看操作历史 / 回滚          |
| `recommend`                         | `Workflows/Recommend.md`        | 智能推荐策略                 |
| `feedback` / `feedback-report`      | `Workflows/FeedbackReport.md`   | 推荐反馈与报告               |
| `generate`                          | `Workflows/Generate.md`         | 动态生成优化策略             |
| `usage-sync` / `usage-report`       | `Workflows/UsageSync.md`        | 同步使用数据 / 使用报告      |
| `cost-report`                       | `Workflows/CostReport.md`       | 成本分析报告                 |
| `health` / `provider-status`        | `Workflows/Health.md`           | 健康检查 / 提供商状态        |
| `disable-provider` / `enable-model` | `Workflows/Health.md`           | 禁用提供商 / 启用模型        |
| `govern`                            | `Workflows/Govern.md`           | 自动化治理                   |

## 注意事项

- 此文件仅为命令层说明，业务逻辑在 `Tools/` 和 `Workflows/` 中。
- 所有策略文件必须符合 oh-my-opencode 官方 schema 规范。
- 详细使用说明请参考 `docs/guides/overview.md` 和各 `Workflows/*.md` 文件。
