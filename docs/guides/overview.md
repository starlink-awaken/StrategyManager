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

```bash
# 列出策略
/strategies list

# 切换策略
/strategies switch strategy-2-balanced

# 推荐策略
/strategies recommend "日常开发"

# 生成动态策略
/strategies generate "日常开发" --priority balanced

# 反馈报告
/strategies feedback-report
```

---

## 进一步阅读

- 配置指南：./configuration.md
- API 参考：./api-reference.md
