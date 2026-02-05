# 配置指南（精简版）

仅保留最常用配置与环境变量说明。

---

## 必要配置

```bash
bun install
```

如果需要使用同步或成本报告，请设置至少一个 API Key。

---

## 常用环境变量

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
export OPENAI_API_KEY="sk-..."
export GITHUB_TOKEN="ghp_..."
export GOOGLE_API_KEY="..."
export ZHIPU_API_KEY="..."
```

---

## 配置目录

默认目录：

- ~/.config/opencode/strategies
- ~/.config/opencode/dynamic-strategies
- ~/.config/opencode/strategy-history.json

---

## 常见问题

- 未生效：确认环境变量已导出并重启终端
- 权限错误：检查 ~/.config/opencode 读写权限

---

## 进一步阅读

- API 参考：./api-reference.md
