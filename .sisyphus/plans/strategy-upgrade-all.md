# 全策略升级工作计划

## TL;DR

> **Quick Summary**: 对 9 个策略模板进行全面升级：添加 fallback 机制、补全缺失 categories、优化成本结构、明确差异化定位。废弃 balanced-copilot，保留 8 个策略。
> 
> **Deliverables**:
> - 升级 8 个策略文件（废弃 1 个）
> - Fallback 覆盖率从 20% 提升到 65%+
> - 所有策略 categories 完整
> - 版本号统一升级 +0.1
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 4 waves
> **Critical Path**: Task 1 (balanced) → Task 9 (验证)

---

## Context

### Original Request
针对 templates 目录下的 9 个策略，进行深度分析对比，升级优化。

### Interview Summary
**Key Discussions**:
- Balanced 系列 3 个策略重合度 85%，需精简为 2 个
- 所有策略 fallback 覆盖率仅 20%，需大幅提升
- 6 个策略缺失关键 categories，需补全

**Research Findings**:
- Super 策略 0% fallback 是严重问题（应该最稳定，实际最脆弱）
- Agent-focused 缺失 4 个 categories（artistry, ultrabrain, deep, writing）
- balanced 文件名与实际配置不符（实际是 Copilot 变体）

### User Decisions
1. **Balanced 系列** → 精简为 2 个（废弃 balanced-copilot）
2. **Super 策略** → 极致稳定（添加 fallback，目标 80%+ 覆盖率）
3. **Agent-focused** → 补全所有 4 个 categories
4. **Economical** → 配置低成本 deep

### Metis Review
**Identified Gaps** (addressed):
- 版本号升级规则 → 统一 +0.1
- Fallback 哲学 → 混合策略（核心 agent 高→高，category 高→免费）
- 文件名修改风险 → 只改 metadata，不动文件名
- 二级 fallback → 不支持，超出 schema 范围

---

## Work Objectives

### Core Objective
升级 StrategyManager 的策略模板体系，提升稳定性、降低成本、明确差异化定位。

### Concrete Deliverables
- `templates/strategy-0-super.jsonc` → v1.1.0（80%+ fallback 覆盖）
- `templates/strategy-1-performance.jsonc` → v1.1.0（补全 hephaestus/atlas/deep）
- `templates/strategy-2-balanced.jsonc` → v2.2.0（全链路 fallback）
- `templates/strategy-2-balanced-direct.jsonc` → v2.2.0-direct（定位明确化）
- `templates/strategy-2-balanced-copilot.jsonc` → **废弃**（添加 deprecated 标记）
- `templates/strategy-3-economical.jsonc` → v1.1.0（补全低成本 deep）
- `templates/strategy-4-creative.jsonc` → v1.1.0（补全 ultrabrain/deep/metis）
- `templates/strategy-5-research.jsonc` → v1.1.0（添加 fallback）
- `templates/strategy-6-agent-focused.jsonc` → v1.1.0（补全 4 个 categories）

### Definition of Done

- [x] 所有 8 个活跃策略通过 schema 验证
- [x] Fallback 覆盖率：super ≥80%, 其他 ≥50%
- [x] Categories 完整性：所有策略包含核心 7 个 categories
- [x] balanced-copilot 标记为 deprecated

### Must Have
- 每个策略 metadata.version 升级
- 每个策略 metadata.updated 更新为执行日期
- 所有 fallback 包含 fallbackReason 说明
- 遵循 oh-my-opencode schema

### Must NOT Have (Guardrails)
- ❌ 修改策略文件名
- ❌ 超出 oh-my-opencode schema 范围
- ❌ 改变已有配置的核心模型选择
- ❌ 删除任何已有的配置项
- ❌ 引入新的 categories 名称
- ❌ 修改非策略文件的代码逻辑

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES
- **Automated tests**: Tests-after
- **Framework**: bun test

### Agent-Executed QA Scenarios (MANDATORY)

**Verification Tool by Deliverable Type:**

| Type | Tool | How Agent Verifies |
|------|------|-------------------|
| JSONC 文件 | Bash | bun run Tools/ManageStrategies.ts validate |
| Schema 验证 | Bash | JSON schema 检查 |
| Fallback 分析 | Bash | grep -c "fallback" 统计 |

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately - 高优先级):
├── Task 1: strategy-2-balanced (P0 主力策略)
├── Task 2: strategy-1-performance (P1)
└── Task 3: strategy-6-agent-focused (P1)

Wave 2 (After Wave 1):
├── Task 4: strategy-0-super (P2)
├── Task 5: strategy-5-research (P2)
└── Task 6: strategy-2-balanced-direct (P2)

Wave 3 (After Wave 2):
├── Task 7: strategy-3-economical (P3)
├── Task 8: strategy-4-creative (P3)
└── Task 9: strategy-2-balanced-copilot (废弃标记)

Wave 4 (After Wave 3):
└── Task 10: 全量验证与报告生成

Critical Path: Task 1 → Task 4 → Task 10
Parallel Speedup: ~50% faster than sequential
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 4, 10 | 2, 3 |
| 2 | None | 4, 10 | 1, 3 |
| 3 | None | 4, 10 | 1, 2 |
| 4 | 1, 2, 3 | 10 | 5, 6 |
| 5 | 1, 2, 3 | 10 | 4, 6 |
| 6 | 1, 2, 3 | 10 | 4, 5 |
| 7 | 4, 5, 6 | 10 | 8, 9 |
| 8 | 4, 5, 6 | 10 | 7, 9 |
| 9 | 4, 5, 6 | 10 | 7, 8 |
| 10 | 7, 8, 9 | None | None (final) |

---

## TODOs

---

### Wave 1: 高优先级策略

- [x] 1. 升级 strategy-2-balanced.jsonc (P0 主力策略)
- [x] 2. 升级 strategy-1-performance.jsonc (P1)
- [x] 3. 升级 strategy-6-agent-focused.jsonc (P1)

### Wave 2: 中优先级策略

- [x] 4. 升级 strategy-0-super.jsonc (P2 极致稳定)
- [x] 5. 升级 strategy-5-research.jsonc (P2)

### Wave 3: 低优先级策略

- [x] 6. 升级 strategy-2-balanced-direct.jsonc (P2)
- [x] 7. 升级 strategy-3-economical.jsonc (P3)
- [x] 8. 升级 strategy-4-creative.jsonc (P3)

### Wave 4: 废弃与验证

- [x] 9. 废弃 strategy-2-balanced-copilot.jsonc

### Wave 4: 验证与报告

- [x] 10. 全量验证与报告生成

  **What to do**:
  - 验证所有 8 个活跃策略通过 schema 验证
  - 统计升级后 fallback 覆盖率
  - 生成升级对比报告
  - 运行单元测试确认无回归

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (final)
  - **Blocks**: None
  - **Blocked By**: Tasks 7, 8, 9

  **References**:
  - Test: `tests/unit/Validator.test.ts`
  - Tool: `Tools/ManageStrategies.ts validate`

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: 全量 schema 验证
    Tool: Bash
    Steps:
      1. for file in templates/strategy-*.jsonc; do bun run Tools/ManageStrategies.ts validate "$file"; done
      2. Assert: 所有文件返回成功
    Expected Result: 8 个活跃策略全部验证通过
    Evidence: 验证输出

  Scenario: 单元测试无回归
    Tool: Bash
    Steps:
      1. bun test tests/unit/
      2. Assert: 所有测试通过
    Expected Result: 无测试失败
    Evidence: 测试输出

  Scenario: Fallback 覆盖率统计
    Tool: Bash
    Steps:
      1. 统计每个策略的 fallback 数量
      2. 计算覆盖率
      3. Assert: super >= 80%, 其他 >= 50%
    Expected Result: 覆盖率达标
    Evidence: 统计报告
  ```

  **Commit**: YES
  - Message: `docs(templates): complete strategy upgrade to all v1.1.0/v2.2.0`
  - Files: 无新增，仅验证

---

## Commit Strategy

| After Task | Message | Files |
|------------|---------|-------|
| 1 | `feat(templates): upgrade balanced strategy to v2.2.0 with full fallback` | strategy-2-balanced.jsonc |
| 2 | `feat(templates): upgrade performance strategy to v1.1.0 with missing agents` | strategy-1-performance.jsonc |
| 3 | `feat(templates): upgrade agent-focused strategy to v1.1.0 with 4 categories` | strategy-6-agent-focused.jsonc |
| 4 | `feat(templates): upgrade super strategy to v1.1.0 with 80%+ fallback` | strategy-0-super.jsonc |
| 5 | `feat(templates): upgrade research strategy to v1.1.0 with fallback` | strategy-5-research.jsonc |
| 6 | `feat(templates): upgrade balanced-direct strategy to v2.2.0-direct` | strategy-2-balanced-direct.jsonc |
| 7 | `feat(templates): upgrade economical strategy to v1.1.0 with low-cost categories` | strategy-3-economical.jsonc |
| 8 | `feat(templates): upgrade creative strategy to v1.1.0 with missing categories` | strategy-4-creative.jsonc |
| 9 | `chore(templates): deprecate balanced-copilot strategy` | strategy-2-balanced-copilot.jsonc |
| 10 | `docs(templates): complete strategy upgrade verification` | - |

---

## Success Criteria

### Verification Commands
```bash
# 全量 schema 验证
for file in templates/strategy-*.jsonc; do
  bun run Tools/ManageStrategies.ts validate "$file" --strict
done
# Expected: 所有文件返回 "✅ 验证通过"

# Fallback 覆盖率检查
grep -c '"fallback"' templates/strategy-0-super.jsonc
# Expected: >= 15 (80%+ 覆盖率)

# 单元测试
bun test tests/unit/
# Expected: 所有测试通过

# 版本号验证
grep '"version"' templates/strategy-*.jsonc
# Expected: 所有版本号已更新
```

### Final Checklist
- [x] 所有 8 个活跃策略版本号已升级
- [x] super 策略 fallback 覆盖率 >= 80% (15/18 = 83%)
- [x] 其他策略 fallback 覆盖率 >= 50% (balanced 5, agent-focused 6)
- [x] agent-focused 包含 artistry, ultrabrain, deep, writing
- [x] performance/economical/creative 包含 deep
- [x] balanced-copilot 标记为 deprecated
- [x] 所有测试通过 (Validator: 28 pass 0 fail)
- [x] 无破坏性变更（文件名未改）
