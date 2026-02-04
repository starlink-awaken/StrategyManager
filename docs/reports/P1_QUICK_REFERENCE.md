# P1 方案设计 - 快速参考

**完成于**: 2026-02-04 15:30  
**文档版本**: 1.0  
**状态**: ✅ 方案设计完成，准备实施

---

## 📋 三句话总结 P1

1. **读取**: 从 `~/.local/share/opencode/storage/message/` 读取 oh-my-opencode 消息历史
2. **计算**: 根据 agent、model、tokens 计算实际 API 成本
3. **推荐**: 基于使用数据动态调整推荐权重，提供更精准的策略建议

---

## 🎯 P1 的三大模块

| 模块 | 职责 | 新增代码 | 关键方法 |
|------|------|---------|---------|
| **UsageSync** | 读取消息历史并计算成本 | ~300 行 | `sync()`, `parseMessage()`, `calculateCost()` |
| **CostReport** | 生成成本报告和趋势分析 | ~400 行 | `generateDaily/Weekly/Monthly()`, `suggestOptimization()` |
| **Recommender** | 基于使用数据优化推荐 | +150 行 | `recommendWithUsageData()`, `calculateCostImpact()` |

---

## 🔧 新增的四个命令

```bash
# 1. 同步使用数据（扩展现有 sync）
bun run Tools/ManageStrategies.ts sync [--delta]

# 2. 生成成本报告（新增）
bun run Tools/ManageStrategies.ts report [daily|weekly|monthly] [--export]

# 3. 显示优化建议（新增）
bun run Tools/ManageStrategies.ts optimize [--strategy NAME]

# 4. 基于使用数据推荐（扩展现有 recommend）
bun run Tools/ManageStrategies.ts recommend [--with-cost] [--budget AMOUNT]
```

---

## 📊 数据流简图

```
oh-my-opencode 消息历史        UsageSync              CostReport         Recommender
~/.local/share/opencode    →  读取+解析+计算  →  分析+报告+建议  →  动态权重调整
  storage/message/           JSON 存储           可视化展示         精准推荐
```

---

## 📁 文件变更清单

### 新增文件 (9 个)
- `Tools/UsageSync.ts` - 使用量同步模块
- `Tools/CostReport.ts` - 成本分析报告
- `Tools/pricing.ts` - 定价表
- `Workflows/Sync.md` - 同步工作流
- `Workflows/Report.md` - 报告工作流
- `Workflows/Optimize.md` - 优化工作流
- `tests/UsageSync.test.ts` - UsageSync 测试
- `tests/CostReport.test.ts` - CostReport 测试
- `docs/reports/P1_DESIGN.md` - 本设计文档

### 修改文件 (6 个)
- `Tools/ManageStrategies.ts` - 集成新命令 (+100 行)
- `Tools/Recommender.ts` - 添加使用数据集成 (+150 行)
- `SKILL.md` - 添加新工作流路由
- `README.md` - 文档新增命令说明
- `ARCHITECTURE.md` - 补充新模块说明
- `CHANGELOG.md` - 记录版本变更

---

## ⏱️ 实施进度表

| 阶段 | 任务 | 工期 | 状态 |
|------|------|------|------|
| P1.1 | UsageSync 实现 | 2 天 | ⏳ 待实施 |
| P1.2 | CostReport 实现 | 2 天 | ⏳ 待实施 |
| P1.3 | Recommender 扩展 | 1 天 | ⏳ 待实施 |
| P1.4 | CLI 集成 | 1 天 | ⏳ 待实施 |
| P1.5 | 文档和工作流 | 1 天 | ⏳ 待实施 |
| **合计** | | **7 天** | |

---

## 🔑 关键设计决策

| 决策 | 方案 | 理由 |
|------|------|------|
| 数据来源 | `~/.local/share/opencode/storage/message/` | 与 oh-my-opencode 官方存储一致 |
| 增量同步 | 记录最后同步时间，仅处理新文件 | 性能优化，避免重复计算 |
| 定价表位置 | `Tools/pricing.ts` | 集中管理，便于维护 |
| 权重调整 | 基于实际调用频率 | 动态适应用户使用模式 |
| 成本计算 | 按输入/输出 token 分开 | 符合各提供商定价模式 |
| 数据存储 | `~/.config/opencode/strategy-{usage,cost}.json` | 与现有配置位置一致 |

---

## 📝 生成的详细文档

| 文档 | 行数 | 用途 |
|------|------|------|
| [P1_DESIGN.md](./P1_DESIGN.md) | 635 | 完整的技术设计规格 |
| [P1_PLAN.md](./P1_PLAN.md) | 298 | 实施计划和任务细分 |
| 本文档 | - | 快速参考 |

---

## ✅ 验证检查点

### 每个阶段都要检查

```bash
# 类型检查
bun run type-check

# 单元测试
bun test

# 模板验证
for f in templates/*.jsonc; do
  bun run Tools/ManageStrategies.ts validate "$f"
done

# 功能测试
bun run Tools/ManageStrategies.ts sync
bun run Tools/ManageStrategies.ts report daily
bun run Tools/ManageStrategies.ts recommend --with-cost
```

---

## 💡 P1 的核心价值

✅ **数据驱动**: 从猜测到基于实际使用数据的决策  
✅ **成本透明**: 完整可视化成本分解，便于预算管理  
✅ **智能推荐**: 权重动态调整，推荐变得个性化  
✅ **趋势分析**: 发现使用模式，发现优化机会  
✅ **预测能力**: 预测策略切换的成本影响  

---

## 🚀 立即开始

```bash
# 1. 审阅详细设计
cat docs/reports/P1_DESIGN.md

# 2. 查看实施计划
cat docs/reports/P1_PLAN.md

# 3. 开始 P1.1 阶段
# → 在 Tools/UsageSync.ts 中实现消息读取

# 4. 遵循一致性检查清单
cat docs/guides/CONSISTENCY_CHECKLIST.md
```

---

## 📞 关键参考

- **设计文档**: [P1_DESIGN.md](./P1_DESIGN.md)
- **实施计划**: [P1_PLAN.md](./P1_PLAN.md)
- **一致性清单**: [CONSISTENCY_CHECKLIST.md](../guides/CONSISTENCY_CHECKLIST.md)
- **项目架构**: [ARCHITECTURE.md](./ARCHITECTURE.md)

---

**上次更新**: 2026-02-04 15:30  
**下一步**: 开始 P1.1 阶段 - UsageSync 实现
