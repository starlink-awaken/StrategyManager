# 策略模板模型版本升级

## TL;DR

> **快速摘要**: 将所有策略模板中的 GLM 模型从 4.7 升级到 5.0，Minimax 模型从 2.1 升级到 2.5，确保符合 oh-my-opencode 规范。
>
> **交付物**:
> - 10 个更新的策略模板文件（排除已废弃的 copilot 版本）
> - 所有 `glm-4.7` → `glm-5`
> - 所有 `MiniMax-M2.1` → `MiniMax-M2.5`
> - 所有 `MiniMax-M2.1-lightning` → `MiniMax-M2.5-lightning`
> - 保留 `glm-4.5-air`（GLM-5 无快速版本）
>
> **预估工作量**: Short（约 1-2 小时）
> **并行执行**: YES - 3 waves（测试 → 批量更新 → 验证）
> **关键路径**: Phase 1 单文件测试 → Phase 2 批量更新 → Phase 3 全量验证

---

## Context

### 原始请求
用户请求：
> 目前 GLM 模型已经升级到5.0， Minimax 的模型也升级到 2.5 了，请进行一次全面的 templates 的策略更新吧

### 访谈摘要
**关键讨论**:
- 用户确认智谱 Pro 套餐已支持 GLM-5 ✅
- MiniMax 所有 Coding Plan 套餐都支持 M2.5 ✅
- GLM-5 目前只有旗舰版本，无 flash/air 版本
- 保留 `glm-4.5-air` 作为快速模型选项

**研究发现**:
- **GLM-5**: 744B 参数（激活 40B），200K 上下文，128K 输出，旗舰模型
- **MiniMax-M2.5**: 最新旗舰模型，所有套餐支持
- **MiniMax-M2.5-lightning**: 快速版本，性能相同速度更快
- **provider 前缀**: 使用 `zhipuai-coding-plan/` 和 `minimax-coding-plan/`（与现有模板一致）

### Metis 审查
**识别的差距**（已处理）:
1. ✅ **模型名称验证**: 已通过官方文档确认正确格式
2. ✅ **定价变化**: 本次不调整 `estimated_monthly_cost`（保持现有估算）
3. ✅ **Deprecated 文件**: `strategy-2-balanced-copilot.jsonc` 不更新
4. ✅ **验收标准**: 已定义详细的命令行验证标准
5. ✅ **metadata 更新**: 包含 `resources_used` 和 `description` 中的模型引用
6. ✅ **范围控制**: 明确禁止参数优化、结构重构等范围蔓延

---

## Work Objectives

### Core Objective
将所有策略模板中的 GLM 和 Minimax 模型版本升级到最新版本，同时保持策略逻辑和结构不变。

### Concrete Deliverables
- `templates/strategy-0-super.jsonc` - GLM 升级
- `templates/strategy-1-performance.jsonc` - GLM + Minimax 升级
- `templates/strategy-2-balanced.jsonc` - GLM 升级
- `templates/strategy-2-balanced-direct.jsonc` - GLM 升级
- `templates/strategy-2-balanced-premium-safe.jsonc` - GLM 升级
- `templates/strategy-3-economical.jsonc` - GLM 升级
- `templates/strategy-4-creative.jsonc` - GLM 升级
- `templates/strategy-5-research.jsonc` - GLM 升级
- `templates/strategy-6-agent-focused.jsonc` - GLM + Minimax 升级
- `templates/strategy-7-china-first.jsonc` - GLM + Minimax 升级

### Definition of Done
- [ ] 所有 `glm-4.7` 替换为 `glm-5`
- [ ] 所有 `MiniMax-M2.1` 替换为 `MiniMax-M2.5`
- [ ] 所有 `MiniMax-M2.1-lightning` 替换为 `MiniMax-M2.5-lightning`
- [ ] `glm-4.5-air` 保持不变
- [ ] 所有策略文件通过 `validate` 命令
- [ ] 现有测试套件通过
- [ ] 策略可正常加载（`list` 命令）

### Must Have
- 所有 GLM 和 Minimax 模型名称准确更新
- 所有策略文件 schema 合规
- 版本号递增（PATCH 版本）
- 日期更新为 2026-02-13

### Must NOT Have (Guardrails)
- ❌ 修改除 model/provider/metadata 外的其他配置
- ❌ 调整 temperature/top_p/max_tokens 参数
- ❌ 重新设计策略结构或 agent 分配
- ❌ 添加新的 agents 或 categories
- ❌ 修改 lsp/sisyphus_agent/git_master 配置
- ❌ 更新 Tools/ 或 Workflows/ 代码
- ❌ 更新已废弃的 `strategy-2-balanced-copilot.jsonc`
- ❌ 删除 `glm-4.5-air`（保留快速模型选项）

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: YES
- **Automated tests**: Tests-after（更新后运行现有测试）
- **Framework**: bun test

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

#### Scenario 1: 模型名称替换完整性验证
```
Scenario: 无残留旧模型名称
  Tool: Bash (grep)
  Preconditions: 所有策略文件已更新
  Steps:
    1. grep -r "glm-4.7" templates/*.jsonc
    2. Assert: 输出为空（无残留）
    3. grep -r "MiniMax-M2.1" templates/*.jsonc | grep -v "MiniMax-M2.5"
    4. Assert: 输出为空（排除 M2.5 的误匹配）
  Expected Result: 无任何旧模型名称残留
  Failure Indicators: grep 返回非空结果
  Evidence: 终端输出显示空结果
```

#### Scenario 2: 新模型名称正确性验证
```
Scenario: 新模型名称格式正确
  Tool: Bash (grep + wc)
  Preconditions: 所有策略文件已更新
  Steps:
    1. grep -r "zhipuai-coding-plan/glm-5" templates/*.jsonc | wc -l
    2. Assert: 计数 >= 预期（基于原 glm-4.7 出现次数）
    3. grep -r "minimax-coding-plan/MiniMax-M2.5" templates/*.jsonc | wc -l
    4. Assert: 计数 >= 预期（基于原 M2.1 出现次数）
  Expected Result: 新模型名称出现次数与旧模型匹配
  Failure Indicators: 计数不一致
  Evidence: 终端输出显示计数结果
```

#### Scenario 3: Schema 合规性验证
```
Scenario: 所有策略通过验证
  Tool: Bash (bun run)
  Preconditions: 所有策略文件已更新
  Steps:
    1. for file in templates/strategy-{0,1,2,3,4,5,6,7}-*.jsonc; do
         bun run Tools/ManageStrategies.ts validate "$file"
       done
    2. Assert: 所有文件输出 "✅ 策略验证通过"
  Expected Result: 所有策略文件验证通过
  Failure Indicators: 任何文件输出错误信息
  Evidence: 终端输出显示所有验证通过
```

#### Scenario 4: 保留项验证
```
Scenario: GLM-4.5-air 未被误删
  Tool: Bash (grep)
  Preconditions: 所有策略文件已更新
  Steps:
    1. grep -r "glm-4.5-air" templates/*.jsonc | wc -l
    2. Assert: 输出 > 0（未被误删）
  Expected Result: glm-4.5-air 仍然存在
  Failure Indicators: wc -l 返回 0
  Evidence: 终端输出显示计数 > 0
```

#### Scenario 5: 回归测试
```
Scenario: 现有测试通过
  Tool: Bash (bun test)
  Preconditions: 所有策略文件已更新
  Steps:
    1. bun test tests/unit/
    2. Assert: 所有测试 PASS
    3. bun type-check
    4. Assert: 无类型错误
  Expected Result: 所有现有测试通过
  Failure Indicators: 任何测试失败
  Evidence: 测试输出显示全部通过
```

#### Scenario 6: 策略加载验证
```
Scenario: 策略可正常加载
  Tool: Bash (bun run)
  Preconditions: 所有策略文件已更新
  Steps:
    1. bun run Tools/ManageStrategies.ts list 2>&1 | grep -i error
    2. Assert: 输出为空（无加载错误）
  Expected Result: 所有策略正常显示
  Failure Indicators: grep 返回错误信息
  Evidence: list 命令输出显示所有策略
```

#### Scenario 7: Deprecated 文件未修改验证
```
Scenario: 已废弃文件未被修改
  Tool: Bash (git diff)
  Preconditions: 所有策略文件已更新
  Steps:
    1. git diff templates/strategy-2-balanced-copilot.jsonc
    2. Assert: 输出为空（未修改）
  Expected Result: 废弃文件保持不变
  Failure Indicators: git diff 返回变更
  Evidence: git diff 输出为空
```

#### Scenario 8: Provider 字段一致性验证
```
Scenario: Provider 字段与 model 前缀一致
  Tool: Bash (jq + shell)
  Preconditions: 所有策略文件已更新
  Steps:
    1. for file in templates/strategy-*.jsonc; do
         # 使用 grep 提取 model 和 provider，验证前缀匹配
         grep -E '"model"|"provider"' "$file" | 验证配对
       done
    2. Assert: 所有 model 的前缀与 provider 字段一致
  Expected Result: 无不一致的报告
  Failure Indicators: 发现前缀不匹配
  Evidence: 验证脚本输出为空
```

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (测试阶段 - 单文件):
└── Task 1: 在 strategy-2-balanced.jsonc 上测试完整流程

Wave 2 (批量更新 - 并行):
├── Task 2: 更新 strategy-0-super.jsonc
├── Task 3: 更新 strategy-1-performance.jsonc
├── Task 4: 更新 strategy-2-balanced-direct.jsonc
├── Task 5: 更新 strategy-2-balanced-premium-safe.jsonc
├── Task 6: 更新 strategy-3-economical.jsonc
├── Task 7: 更新 strategy-4-creative.jsonc
├── Task 8: 更新 strategy-5-research.jsonc
├── Task 9: 更新 strategy-6-agent-focused.jsonc
└── Task 10: 更新 strategy-7-china-first.jsonc

Wave 3 (全量验证):
└── Task 11: 运行完整验证套件

Critical Path: Task 1 → Task 2-10 → Task 11
Parallel Speedup: ~70% faster than sequential
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2-10 | None (测试阶段) |
| 2 | 1 | 11 | 3, 4, 5, 6, 7, 8, 9, 10 |
| 3 | 1 | 11 | 2, 4, 5, 6, 7, 8, 9, 10 |
| 4 | 1 | 11 | 2, 3, 5, 6, 7, 8, 9, 10 |
| 5 | 1 | 11 | 2, 3, 4, 6, 7, 8, 9, 10 |
| 6 | 1 | 11 | 2, 3, 4, 5, 7, 8, 9, 10 |
| 7 | 1 | 11 | 2, 3, 4, 5, 6, 8, 9, 10 |
| 8 | 1 | 11 | 2, 3, 4, 5, 6, 7, 9, 10 |
| 9 | 1 | 11 | 2, 3, 4, 5, 6, 7, 8, 10 |
| 10 | 1 | 11 | 2, 3, 4, 5, 6, 7, 8, 9 |
| 11 | 2-10 | None | None (最终验证) |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1 | task(category="quick", load_skills=[], run_in_background=false) |
| 2 | 2-10 | 并行 dispatch（所有任务独立） |
| 3 | 11 | task(category="quick", load_skills=[], run_in_background=false) |

---

## TODOs

- [x] 1. Phase 1: 单文件测试 - strategy-2-balanced.jsonc

  **What to do**:
  - 在 `strategy-2-balanced.jsonc` 上执行完整的更新流程
  - 验证所有替换规则和验收标准
  - 确认无副作用后再批量应用

  **Must NOT do**:
  - 修改任何其他文件
  - 跳过验证步骤
  - 修改除模型名称外的其他配置

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 单文件批量替换，操作明确且快速
  - **Skills**: `[]`
    - 无特殊技能需求，标准文本替换

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 (测试阶段)
  - **Blocks**: Tasks 2-10
  - **Blocked By**: None

  **References**:
  - `templates/strategy-2-balanced.jsonc` - 测试目标文件
  - `.sisyphus/drafts/strategy-model-upgrade.md` - 替换规则参考

  **Acceptance Criteria**:
  - [ ] `glm-4.7` → `glm-5` 替换完成
  - [ ] `MiniMax-M2.1` → `MiniMax-M2.5` 替换完成（如有）
  - [ ] `glm-4.5-air` 保持不变
  - [ ] `bun run Tools/ManageStrategies.ts validate templates/strategy-2-balanced.jsonc` → PASS
  - [ ] `bun test tests/unit/` → PASS
  - [ ] 版本号递增（如 v2.2.0 → v2.2.1）
  - [ ] 日期更新为 2026-02-13

  **Agent-Executed QA Scenarios**:
  ```
  Scenario: 单文件更新后验证
    Tool: Bash
    Steps:
      1. grep "glm-4.7" templates/strategy-2-balanced.jsonc
         Assert: 输出为空
      2. grep "glm-5" templates/strategy-2-balanced.jsonc | wc -l
         Assert: 计数 >= 原始 glm-4.7 出现次数
      3. bun run Tools/ManageStrategies.ts validate templates/strategy-2-balanced.jsonc
         Assert: 输出 "✅ 策略验证通过"
    Expected Result: 单文件所有验证通过
    Evidence: 终端输出截图
  ```

  **Commit**: YES
  - Message: `feat(templates): upgrade GLM to 5.0 and Minimax to 2.5 in strategy-2-balanced`
  - Files: `templates/strategy-2-balanced.jsonc`
  - Pre-commit: `bun run Tools/ManageStrategies.ts validate templates/strategy-2-balanced.jsonc`

---

- [x] 2. Phase 2: 更新 strategy-0-super.jsonc

  **What to do**:
  - 替换所有 `zhipuai-coding-plan/glm-4.7` → `zhipuai-coding-plan/glm-5`
  - 保留 `zhipuai-coding-plan/glm-4.5-air`
  - 更新 metadata（版本号 +1，日期 2026-02-13）
  - 更新 `resources_used` 中的模型描述

  **Must NOT do**:
  - 修改 temperature/top_p 等参数
  - 添加或删除 agents
  - 修改 strategy 结构

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 批量文本替换，无需复杂决策
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3-10)
  - **Blocks**: Task 11
  - **Blocked By**: Task 1

  **References**:
  - `templates/strategy-0-super.jsonc` - 更新目标

  **Acceptance Criteria**:
  - [ ] 无 `glm-4.7` 残留
  - [ ] `glm-5` 出现次数正确
  - [ ] `glm-4.5-air` 保留
  - [ ] validate 通过
  - [ ] 版本号递增

  **Agent-Executed QA Scenarios**:
  ```
  Scenario: strategy-0-super 更新验证
    Tool: Bash
    Steps:
      1. grep "glm-4.7" templates/strategy-0-super.jsonc
         Assert: 输出为空
      2. bun run Tools/ManageStrategies.ts validate templates/strategy-0-super.jsonc
         Assert: 输出 "✅ 策略验证通过"
    Expected Result: 文件更新正确
    Evidence: 验证输出
  ```

  **Commit**: YES (groups with 3-10)
  - Message: `feat(templates): upgrade GLM to 5.0 and Minimax to 2.5`
  - Files: `templates/strategy-0-super.jsonc`
  - Pre-commit: `bun run Tools/ManageStrategies.ts validate templates/strategy-0-super.jsonc`

---

- [x] 3. Phase 2: 更新 strategy-1-performance.jsonc

  **What to do**:
  - 替换 `glm-4.7` → `glm-5`
  - 替换 `MiniMax-M2.1` → `MiniMax-M2.5`
  - 替换 `MiniMax-M2.1-lightning` → `MiniMax-M2.5-lightning`
  - 更新 metadata

  **Must NOT do**:
  - 修改其他配置

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 11
  - **Blocked By**: Task 1

  **References**:
  - `templates/strategy-1-performance.jsonc`

  **Acceptance Criteria**:
  - [ ] 无旧模型名称残留
  - [ ] validate 通过

  **Commit**: YES (groups with 2, 4-10)
  - Message: `feat(templates): upgrade GLM to 5.0 and Minimax to 2.5`
  - Files: `templates/strategy-1-performance.jsonc`

---

- [x] 4. Phase 2: 更新 strategy-2-balanced-direct.jsonc

  **What to do**:
  - 替换 `glm-4.7` → `glm-5`
  - 保留 `glm-4.5-air`
  - 更新 metadata

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 11
  - **Blocked By**: Task 1

  **Commit**: YES (groups with 2-3, 5-10)
  - Files: `templates/strategy-2-balanced-direct.jsonc`

---

- [x] 5. Phase 2: 更新 strategy-2-balanced-premium-safe.jsonc

  **What to do**:
  - 替换 `glm-4.7` → `glm-5`
  - 保留 `glm-4.5-air`
  - 更新 metadata

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 11
  - **Blocked By**: Task 1

  **Commit**: YES (groups with 2-4, 6-10)
  - Files: `templates/strategy-2-balanced-premium-safe.jsonc`

---

- [x] 6. Phase 2: 更新 strategy-3-economical.jsonc

  **What to do**:
  - 替换 `glm-4.7` → `glm-5`
  - 更新 metadata

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 11
  - **Blocked By**: Task 1

  **Commit**: YES (groups with 2-5, 7-10)
  - Files: `templates/strategy-3-economical.jsonc`

---

- [x] 7. Phase 2: 更新 strategy-4-creative.jsonc

  **What to do**:
  - 替换 `glm-4.7` → `glm-5`
  - 更新 metadata

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 11
  - **Blocked By**: Task 1

  **Commit**: YES (groups with 2-6, 8-10)
  - Files: `templates/strategy-4-creative.jsonc`

---

- [x] 8. Phase 2: 更新 strategy-5-research.jsonc

  **What to do**:
  - 替换 `glm-4.7` → `glm-5`
  - 更新 metadata

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 11
  - **Blocked By**: Task 1

  **Commit**: YES (groups with 2-7, 9-10)
  - Files: `templates/strategy-5-research.jsonc`

---

- [x] 9. Phase 2: 更新 strategy-6-agent-focused.jsonc

  **What to do**:
  - 替换 `glm-4.7` → `glm-5`
  - 替换 `MiniMax-M2.1` → `MiniMax-M2.5`
  - 替换 `MiniMax-M2.1-lightning` → `MiniMax-M2.5-lightning`
  - 更新 metadata

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 11
  - **Blocked By**: Task 1

  **Commit**: YES (groups with 2-8, 10)
  - Files: `templates/strategy-6-agent-focused.jsonc`

---

- [x] 10. Phase 2: 更新 strategy-7-china-first.jsonc

  **What to do**:
  - 替换 `glm-4.7` → `glm-5`
  - 替换 `MiniMax-M2.1` → `MiniMax-M2.5`
  - 替换 `MiniMax-M2.1-lightning` → `MiniMax-M2.5-lightning`
  - 更新 metadata
  - 这是使用 GLM 和 Minimax 最多的策略，需要特别注意

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 11
  - **Blocked By**: Task 1

  **Commit**: YES (groups with 2-9)
  - Files: `templates/strategy-7-china-first.jsonc`

---

- [ ] 11. Phase 3: 全量验证

  **What to do**:
  - 运行完整的验证套件
  - 确认所有策略文件无残留旧模型
  - 确认所有策略通过 validate
  - 运行完整测试套件
  - 生成变更报告

  **Must NOT do**:
  - 修改任何文件
  - 跳过任何验证步骤

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 验证任务，需要仔细但快速执行
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (最终验证)
  - **Blocks**: None
  - **Blocked By**: Tasks 2-10

  **References**:
  - 所有 `templates/strategy-*.jsonc` 文件

  **Acceptance Criteria**:
  - [ ] `grep -r "glm-4.7" templates/*.jsonc` → 输出为空
  - [ ] `grep -r "MiniMax-M2.1" templates/*.jsonc | grep -v "M2.5"` → 输出为空
  - [ ] `grep -r "glm-4.5-air" templates/*.jsonc | wc -l` → > 0
  - [ ] 所有策略文件 validate 通过
  - [ ] `bun test tests/unit/` → PASS
  - [ ] `bun type-check` → PASS
  - [ ] `bun run Tools/ManageStrategies.ts list` → 无错误

  **Agent-Executed QA Scenarios**:
  ```
  Scenario: 全量验证套件
    Tool: Bash
    Steps:
      1. echo "=== 检查旧模型残留 ==="
         grep -r "glm-4.7" templates/*.jsonc && echo "❌ 发现 glm-4.7 残留" || echo "✅ 无 glm-4.7 残留"
         grep -r "MiniMax-M2.1[^.5]" templates/*.jsonc && echo "❌ 发现 MiniMax-M2.1 残留" || echo "✅ 无 MiniMax-M2.1 残留"
      
      2. echo "=== 检查新模型存在 ==="
         glm5_count=$(grep -r "glm-5" templates/*.jsonc | wc -l | tr -d ' ')
         echo "✅ glm-5 出现 $glm5_count 次"
         
      3. echo "=== 检查保留项 ==="
         grep -r "glm-4.5-air" templates/*.jsonc > /dev/null && echo "✅ glm-4.5-air 已保留" || echo "❌ glm-4.5-air 被误删"
      
      4. echo "=== Schema 验证 ==="
         for file in templates/strategy-{0,1,2,3,4,5,6,7}-*.jsonc; do
           bun run Tools/ManageStrategies.ts validate "$file" || echo "❌ $file 验证失败"
         done
      
      5. echo "=== 测试套件 ==="
         bun test tests/unit/
         bun type-check
      
      6. echo "=== 策略加载测试 ==="
         bun run Tools/ManageStrategies.ts list > /dev/null 2>&1 && echo "✅ 策略加载正常" || echo "❌ 策略加载失败"
    
    Expected Result: 所有检查显示 ✅
    Failure Indicators: 任何 ❌ 输出
    Evidence: 完整的终端输出日志
  ```

  **Commit**: NO
  - 这是验证任务，不产生代码变更

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `feat(templates): upgrade GLM to 5.0 and Minimax to 2.5 in strategy-2-balanced` | strategy-2-balanced.jsonc | validate |
| 2-10 (batch) | `feat(templates): upgrade GLM to 5.0 and Minimax to 2.5` | strategy-*.jsonc (9 files) | validate each |
| 11 | N/A (verification only) | N/A | full test suite |

---

## Success Criteria

### Verification Commands
```bash
# 1. 无旧模型残留
grep -r "glm-4.7" templates/*.jsonc
# Expected: 无输出

grep -r "MiniMax-M2.1[^.5]" templates/*.jsonc
# Expected: 无输出

# 2. 新模型存在
grep -r "glm-5" templates/*.jsonc | wc -l
# Expected: > 0

grep -r "MiniMax-M2.5" templates/*.jsonc | wc -l
# Expected: > 0

# 3. 保留项检查
grep -r "glm-4.5-air" templates/*.jsonc | wc -l
# Expected: > 0

# 4. Schema 验证
for file in templates/strategy-{0,1,2,3,4,5,6,7}-*.jsonc; do
  bun run Tools/ManageStrategies.ts validate "$file"
done
# Expected: 所有文件输出 "✅ 策略验证通过"

# 5. 测试套件
bun test tests/unit/
# Expected: 所有测试 PASS

bun type-check
# Expected: 无错误

# 6. 策略加载
bun run Tools/ManageStrategies.ts list
# Expected: 所有策略正常显示，无错误
```

### Final Checklist
- [ ] 所有 "Must Have" 存在（模型升级完成）
- [ ] 所有 "Must NOT Have" 缺失（无范围蔓延）
- [ ] 所有测试通过
- [ ] 所有策略验证通过
- [ ] 无旧模型名称残留
- [ ] `glm-4.5-air` 已保留
- [ ] Deprecated 文件未修改
- [ ] 所有版本号已递增
- [ ] 所有日期已更新
