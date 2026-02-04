# P1 实施计划总结

**状态**: 方案设计完成，准备开始实施  
**时间**: 2026-02-04  
**预计工期**: 5-7 个工作日  

---

## 🎯 核心目标

实现使用量同步 + 成本分析 + 推荐优化功能，使 StrategyManager 能够：
- 自动从 oh-my-opencode 消息历史中提取使用数据
- 计算实际成本
- 基于使用数据提供动态推荐

---

## 📦 交付物

| 文件 | 类型 | 说明 |
|------|------|------|
| `Tools/UsageSync.ts` | 新增 | 使用量同步模块 (~300 行) |
| `Tools/CostReport.ts` | 新增 | 成本分析报告模块 (~400 行) |
| `Tools/Recommender.ts` | 扩展 | 集成使用数据的推荐优化 (~150 行新增) |
| `Workflows/Sync.md` | 新增 | 同步工作流文档 |
| `Workflows/Report.md` | 新增 | 报告工作流文档 |
| `Workflows/Optimize.md` | 新增 | 优化工作流文档 |
| `docs/reports/P1_DESIGN.md` | 新增 | 本设计文档 |
| `tests/UsageSync.test.ts` | 新增 | 使用量同步单元测试 |
| `tests/CostReport.test.ts` | 新增 | 成本分析单元测试 |
| 更新文件 | 修改 | README, SKILL.md, ARCHITECTURE.md, CHANGELOG.md |

---

## 🔑 关键特性

### 1. 数据来源
```
~/.local/share/opencode/storage/message/
    ↓
[日期-UUID].json (oh-my-opencode 消息历史)
    ↓
UsageSync 解析和聚合
    ↓
~/.config/opencode/strategy-usage.json (使用统计)
~/.config/opencode/strategy-cost.json (成本数据)
```

### 2. 报告类型

| 报告 | 时间范围 | 主要内容 |
|------|---------|---------|
| **Daily** | 最近 7 天 | 成本折线图、按提供商分解、异常检测 |
| **Weekly** | 当前周 | 日对比、周环比、成本增长率 |
| **Monthly** | 当前月 | 详细分解表、Top 10 模型、预测成本 |

### 3. 推荐优化

- **基于使用数据**: 分析历史调用模式，模拟策略切换后的成本
- **动态权重**: 根据实际使用情况调整推荐权重
- **成本预测**: 预测策略切换后的月度成本

---

## 📊 架构概览

```
ManageStrategies.ts (CLI 入口)
    ├── sync command → UsageSync.sync()
    ├── report command → CostReport.generate*Report()
    ├── optimize command → Recommender.optimizeByUsage()
    └── recommend command → Recommender.recommendWithUsageData()

PathManager.ts (路径管理)
    ├── getStrategyPath()
    ├── getConfigPath()
    └── getHistoryPath()

UsageSync.ts (使用量同步)
    ├── sync() - 完整同步
    ├── syncDeltaOnly() - 增量同步
    ├── parseMessage() - 消息解析
    ├── calculateCost() - 成本计算
    └── aggregateUsage() - 数据聚合

CostReport.ts (成本分析)
    ├── generateDailyReport()
    ├── generateWeeklyReport()
    ├── generateMonthlyReport()
    ├── analyzeTrends()
    ├── suggestOptimization()
    └── exportMarkdown()/exportJSON()

Recommender.ts (推荐优化)
    ├── recommendWithUsageData()
    ├── calculateCostImpact()
    ├── optimizeByUsage()
    └── adjustWeights()
```

---

## 🛠️ 实施阶段细分

### Phase P1.1: UsageSync 实现 (2 天)

**任务**:
1. 创建 `Tools/UsageSync.ts` 骨架
2. 实现消息文件读取逻辑
3. 实现消息解析（agent、model、tokens）
4. 创建定价表 (`src/pricing.ts`)
5. 实现成本计算
6. 实现数据聚合（按日/周/月）
7. 实现数据保存和加载
8. 编写单元测试

**验证**:
- [ ] `bun run type-check` 通过
- [ ] `bun test UsageSync.test.ts` 通过
- [ ] 测试数据能正确计算成本

---

### Phase P1.2: CostReport 实现 (2 天)

**任务**:
1. 创建 `Tools/CostReport.ts`
2. 实现日报告生成
3. 实现周报告生成
4. 实现月报告生成
5. 实现 ASCII 折线图渲染
6. 实现 Markdown 导出
7. 实现 JSON 导出
8. 编写单元测试

**验证**:
- [ ] `bun run type-check` 通过
- [ ] `bun test CostReport.test.ts` 通过
- [ ] 报告输出格式清晰

---

### Phase P1.3: Recommender 扩展 (1 天)

**任务**:
1. 扩展 `Tools/Recommender.ts`
2. 添加 `recommendWithUsageData()` 方法
3. 实现成本影响计算
4. 实现权重动态调整
5. 编写集成测试

**验证**:
- [ ] `bun run type-check` 通过
- [ ] 推荐结果基于使用数据变化

---

### Phase P1.4: 集成到 CLI (1 天)

**任务**:
1. 在 `ManageStrategies.ts` 中添加新命令
2. 实现 `sync` 命令（扩展现有）
3. 实现 `report` 命令（新增）
4. 实现 `optimize` 命令（新增）
5. 更新 `recommend` 命令（扩展现有）
6. 编写集成测试

**验证**:
- [ ] `bun run type-check` 通过
- [ ] 所有新命令可正常执行
- [ ] 彩色输出正确显示

---

### Phase P1.5: 工作流和文档 (1 天)

**任务**:
1. 创建 `Workflows/Sync.md`
2. 创建 `Workflows/Report.md`
3. 创建 `Workflows/Optimize.md`
4. 更新 `SKILL.md` 路由
5. 更新 `README.md`
6. 更新 `ARCHITECTURE.md`
7. 更新 `CHANGELOG.md`
8. 验证所有文档链接

**验证**:
- [ ] 一致性检查清单全部通过
- [ ] 所有文档链接有效
- [ ] 示例可正确执行

---

## ✅ 一致性检查清单

按照 [CONSISTENCY_CHECKLIST.md](./CONSISTENCY_CHECKLIST.md) 检查：

### 修改影响分析

| 影响范围 | 需要更新的文件 | 检查点 |
|---------|-------------|--------|
| **Templates** | `templates/*.jsonc` | 运行 validate 确认兼容性 |
| **Workflows** | 新增 3 个 + 更新 SKILL.md | 触发条件、参数、输出示例 |
| **Docs** | README, ARCHITECTURE, CHANGELOG | 新功能说明、命令文档 |
| **Scripts** | `scripts/strategy-helper.sh` | 新增快捷命令 |
| **Tests** | `tests/*.test.ts` | 新增 3 个测试文件 |

### 快速验证命令

```bash
# 完整检查
bun run type-check && \
bun test && \
for f in templates/*.jsonc; do bun run Tools/ManageStrategies.ts validate "$f"; done && \
echo "✅ 所有检查通过"
```

---

## 📈 进度跟踪

使用 GitHub Issue 或项目看板跟踪：

- [ ] P1.1 - UsageSync 实现
  - [ ] 消息读取
  - [ ] 成本计算
  - [ ] 数据聚合
  - [ ] 单元测试

- [ ] P1.2 - CostReport 实现
  - [ ] 报告生成
  - [ ] 图表渲染
  - [ ] 导出功能
  - [ ] 单元测试

- [ ] P1.3 - Recommender 扩展
  - [ ] 使用数据集成
  - [ ] 成本计算
  - [ ] 集成测试

- [ ] P1.4 - CLI 集成
  - [ ] 新命令实现
  - [ ] 彩色输出
  - [ ] 集成测试

- [ ] P1.5 - 文档和工作流
  - [ ] 工作流文档
  - [ ] 主文档更新
  - [ ] 一致性检查

---

## 🎯 成功指标

### 功能验收

- ✅ `sync` 命令能读取消息历史并计算成本
- ✅ `report daily/weekly/monthly` 生成清晰的成本报告
- ✅ `optimize` 命令给出有效的成本优化建议
- ✅ `recommend` 命令基于使用数据动态推荐策略

### 质量指标

- ✅ 类型检查通过 (100% 无错误)
- ✅ 单元测试通过率 ≥ 95%
- ✅ 代码覆盖率 ≥ 80%
- ✅ 所有新代码通过代码审查

### 文档指标

- ✅ 工作流文档完整
- ✅ API 文档与代码一致
- ✅ 示例代码可正确执行
- ✅ 所有文档链接有效

---

## 🔗 相关文档

- [P1 详细设计](./P1_DESIGN.md)
- [一致性检查清单](./CONSISTENCY_CHECKLIST.md)
- [项目架构](./ARCHITECTURE.md)
- [使用指南](./USAGE_GUIDE.md)

---

## 💡 注意事项

1. **增量同步**: 为了性能，实现增量同步机制（仅处理新文件）
2. **定价表维护**: 定价表需要定期更新以保持准确性
3. **异常处理**: 处理消息解析失败、缺失数据等边界情况
4. **向后兼容**: 新功能不应破坏现有工作流
5. **用户隐私**: 不要记录/导出敏感信息（仅统计聚合数据）

---

**下一步**: 开始 P1.1 阶段的 UsageSync 实现！ 🚀
