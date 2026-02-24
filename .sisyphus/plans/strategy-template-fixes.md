# Strategy Template Fixes — 22 Issues Across 10 Files

## TL;DR

> **Quick Summary**: 修复 10 个策略模板文件中的 22 个已验证问题，涵盖 3 个 Bug、8 个一致性问题、5 个模型/并发错误和 6 个优化项。按 Tier 1→2→3 优先级逐文件修复，每文件改完即验证。
>
> **Deliverables**:
> - 修复 10 个 `templates/strategy-*.jsonc` 文件
> - 所有策略通过 `validate` 命令验证
> - 测试基线保持 ≥152 pass / ≤6 fail
>
> **Estimated Effort**: Medium（~2-3 小时执行时间）
> **Parallel Execution**: YES — 3 waves
> **Critical Path**: Task 1 (Tier 1 Bugs) → Task 2 (China-First 修复) → Task 4 (全局验证)

---

## Context

### Original Request
用户手动修改了全部 10 个策略模板文件后，要求深度审查并修复发现的所有问题。

### Interview Summary
**Key Discussions**:
- 22 个问题已全部验证（含精确行号），分 3 个优先级
- 用户选择先验证 Schema → Schema 验证完成
- oh-my-opencode Schema 只定义 agents/categories/top-level 字段
- 底部配置段（sisyphus_agent/git_master/tmux/experimental）是自定义扩展，不在 Schema 中但被运行时消费
- Validator.ts 仅检查 5 层，不验证底部配置

**Research Findings**:
- Validator.ts 仅读取 `background_task.modelConcurrency`
- 底部配置段被 oh-my-opencode 平台运行时消费
- `context_length` 在 Schema 中不存在，仅 strategy-7 使用
- `thinking.budgetTokens` Schema 合法，但 GPT-4o 运行时是否支持存疑

### Metis Review
**Identified Gaps** (addressed):
- Bottom-level 标准化 → 默认以 strategy-0-super 为标准模板
- Deprecated 策略 → 跳过，仅修活跃的 10 个
- 模型名称来源 → 以各平台官方文档为准
- 成本估算 → 不更新（metadata 装饰性字段）
- JSONC 注释/字段顺序 → 保持现有风格不变

---

## Work Objectives

### Core Objective
修复 10 个策略模板中 22 个已验证的 Bug、一致性问题和配置错误，确保策略文件正确、一致且可靠运行。

### Concrete Deliverables
- 10 个修复后的 `templates/strategy-*.jsonc` 文件
- 所有策略文件通过 `validate` 命令
- 测试基线不退化

### Definition of Done
- [x] 所有 3 个 Bug（#1-#3）修复完成
- [x] 所有一致性问题（#4-#11）按决策修复（context_length 全部删除）
- [x] 所有模型/并发错误（#12-#16）修复完成
- [x] 所有优化项（#17-#22）完成：补 fallback、增加中国厂商、多样化模型选择、修复成本估算
- [x] `bun run Tools/ManageStrategies.ts validate` → 通过
- [x] `bun test` → ≥152 pass / ≤6 fail

### Must Have
- 修复 3 个 Bug（Tier 1）
- 修复明确的模型/并发错误（#12-#16）
- 所有策略文件有 `$schema` 字段
- 同一模型名称跨策略一致

### Must NOT Have (Guardrails)
- ❌ 不修改 `tests/` 目录
- ❌ 不修改任何 `.md` 文档文件
- ❌ 不引入新的自定义字段
- ❌ 不调整未出错的并发数配置
- ❌ 单次不修改多个文件后才验证（每文件改完即验）
- ❌ 不修复 deprecated 策略文件
- ⚠️ 优化项（#17-#22）允许修改策略设计，但必须保持策略的整体定位不变（如 china-first 仍以中国厂商为主）

---

## Verification Strategy

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL verification by agent using tools. No human action permitted.

### Test Decision
- **Infrastructure exists**: YES
- **Automated tests**: Tests-after (验证修复不退化)
- **Framework**: bun test

### Agent-Executed QA Scenarios (MANDATORY)

**Per-File Verification (每个文件修复后):**

```
Scenario: JSONC syntax valid after fix
  Tool: Bash
  Steps:
    1. bun run Tools/ManageStrategies.ts validate
    2. Assert: output contains "策略验证通过" or similar success
  Evidence: Terminal output captured

Scenario: Test baseline maintained
  Tool: Bash
  Steps:
    1. bun test 2>&1 | tail -5
    2. Assert: pass >= 152, fail <= 6
  Evidence: Terminal output captured
```

---

## Decisions Resolved

### ✅ Decision #1: context_length 处理
**用户选择**: **A — 全部删除**
- `strategy-7-china-first.jsonc` 中 18 处 `context_length` 字段全部移除
- 理由：严格符合 oh-my-opencode Schema

### ✅ Decision #2: Optimization 范围
**用户选择**: **A — 全部修复（22 个问题全修）**
- 包含 #17-#22 所有优化：补 fallback、减少模型依赖、修复成本估算
- 理由：一次性修复到位，避免多轮迭代

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — Tier 1 Bugs):
├── Task 1: Fix 3 confirmed bugs (strategy-0-super, strategy-2-balanced, strategy-2-balanced-premium-safe)
└── Task 2: Fix strategy-7-china-first (5 issues: #4/#5/#7/#8/#9)

Wave 2 (After Wave 1 — Tier 2 Consistency + Tier 3 Model Errors):
├── Task 3: Fix model/concurrency issues across strategy-1/2/3/4 (#10-#16)
└── Task 4: Fix strategy-6-agent-focused multimodal-looker (#19)

Wave 3 (After Wave 2 — Optimizations + Fallbacks + Cleanup):
└── Task 5: context_length deletion (#6) + Chinese provider fallbacks (#17) + model diversification (#18) + cost fix (#20) + missing fallbacks (#21/#22) + bottom-level standardization (#11)

Final: Task 6: Global validation
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 6 | 2 |
| 2 | None | 6 | 1 |
| 3 | 1 (balanced files) | 6 | 4 |
| 4 | None | 6 | 3 |
| 5 | Decisions resolved, Task 2, Task 4 | 6 | None |
| 6 | 1,2,3,4,5 | None | None (final) |

### Agent Dispatch Summary

| Wave | Tasks | Recommended |
|------|-------|-------------|
| 1 | 1, 2 | parallel background tasks |
| 2 | 3, 4 | parallel after Wave 1 |
| 3 | 5 | after decisions resolved |
| Final | 6 | sequential final validation |

---

## TODOs

- [x] 1. Fix Tier 1 Bugs — 3 Files

  **What to do**:
  
  **Bug #1: strategy-0-super.jsonc L39 — model 名截断**
  - 找到 `sisyphus` agent 的 `model` 字段
  - 将 `"github-copilot/claude-sonnet-4."` 改为 `"github-copilot/claude-sonnet-4.5"`
  - 验证：同文件其他 agent 的 claude-sonnet-4.5 引用作为参照
  
  **Bug #2: strategy-2-balanced.jsonc L201-207 — self-fallback**
  - 找到 `deep` category
  - `model` 和 `fallback` 都是 `"github-copilot/claude-sonnet-4.5"`
  - 将 `fallback` 改为合理的降级模型，参考同文件其他 category 的 fallback 模式
  - 建议 fallback: `"github-copilot/gpt-4o"` 或 `"google/gemini-3-pro"`（参照该策略 `ultrabrain` category 的 fallback 模式）
  
  **Bug #3: strategy-2-balanced-premium-safe.jsonc L192 — provider 名错误**
  - 找到 `providerConcurrency` 中的 `"ark": 10`
  - 改为 `"ark-coding-plan": 10`
  - 验证：grep 其他策略文件确认 `ark-coding-plan` 是标准命名

  **Must NOT do**:
  - 不改变这些文件中的其他配置
  - 不修改注释内容
  - 不调整非 bug 相关的并发数

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 3 个精确定位的单行/单字段修复，无复杂逻辑
  - **Skills**: [`git-master`]
    - `git-master`: 修复后需要精确 commit
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: 无 UI 相关工作
    - `playwright`: 无浏览器验证需求

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 2)
  - **Blocks**: Task 3, Task 6
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `templates/strategy-0-super.jsonc:39` — Bug #1 位置：sisyphus agent model 字段截断
  - `templates/strategy-2-balanced.jsonc:201-207` — Bug #2 位置：deep category model=fallback 自引用
  - `templates/strategy-2-balanced.jsonc:120-135` — 参照：ultrabrain category 的 fallback 模式
  - `templates/strategy-2-balanced-premium-safe.jsonc:192` — Bug #3 位置：providerConcurrency ark 键名
  - `templates/strategy-0-super.jsonc:240-260` — 参照：正确的 providerConcurrency 格式（ark-coding-plan）

  **WHY Each Reference Matters**:
  - L39: 精确定位截断的 model 字段，修复为完整名称
  - L201-207: 定位 self-fallback，需要参考同文件 ultrabrain 的 fallback 选择合理替代
  - L192: 定位错误 provider 名，参考其他策略确认正确命名

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Bug #1 — sisyphus model name is complete
    Tool: Bash
    Preconditions: strategy-0-super.jsonc exists
    Steps:
      1. grep "claude-sonnet-4\." templates/strategy-0-super.jsonc
      2. Assert: ALL matches show "claude-sonnet-4.5" (no truncated "claude-sonnet-4.")
      3. bun run Tools/ManageStrategies.ts validate
      4. Assert: output contains success message
    Expected Result: No truncated model names
    Evidence: grep output + validate output

  Scenario: Bug #2 — deep category fallback differs from model
    Tool: Bash
    Preconditions: strategy-2-balanced.jsonc exists
    Steps:
      1. Parse deep category: extract model and fallback values
      2. Assert: model != fallback
      3. Assert: fallback is a valid model name (exists in other categories)
    Expected Result: fallback points to different model than model field
    Evidence: parsed values

  Scenario: Bug #3 — providerConcurrency uses correct provider name
    Tool: Bash
    Preconditions: strategy-2-balanced-premium-safe.jsonc exists
    Steps:
      1. grep "ark" templates/strategy-2-balanced-premium-safe.jsonc
      2. Assert: shows "ark-coding-plan" (not bare "ark")
      3. grep -c '"ark"[^-]' templates/strategy-2-balanced-premium-safe.jsonc
      4. Assert: count is 0 (no bare "ark" keys)
    Expected Result: Only "ark-coding-plan" appears as provider key
    Evidence: grep output
  ```

  **Commit**: YES
  - Message: `fix(templates): fix 3 critical bugs — truncated model, self-fallback, wrong provider name`
  - Files: `templates/strategy-0-super.jsonc`, `templates/strategy-2-balanced.jsonc`, `templates/strategy-2-balanced-premium-safe.jsonc`
  - Pre-commit: `bun run Tools/ManageStrategies.ts validate`

---

- [x] 2. Fix strategy-7-china-first Consistency — 5 Issues

  **What to do**:

  **Issue #4: 补 $schema 字段**
  - 在文件顶部（第一个 `{` 后）添加 `"$schema"` 字段
  - 值参照其他策略：`"https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/master/assets/oh-my-opencode.schema.json"`

  **Issue #5: 补 description 字段**
  - 在顶层添加 `"description"` 字段
  - 值基于 metadata.name 生成，如 `"中国厂商优先策略 - 优先使用国内 AI 模型，海外模型作为兜底"`

  **Issue #7: 标准化 sisyphus_agent**
  - 当前有 `model`/`fallback` 字段（其他策略使用 `disabled`/`default_builder_enabled`/`planner_enabled`/`replace_plan`）
  - 改为标准模式，参照 `strategy-0-super.jsonc` 的 sisyphus_agent 格式
  - 保留功能等效配置

  **Issue #8: 标准化 git_master**
  - 当前有 `model` 字段（非标准）
  - 改为标准模式：`commit_footer`/`include_co_authored_by`，参照 strategy-0-super

  **Issue #9: 补 background_task 缺失字段**
  - 添加 `defaultConcurrency` 和 `staleTimeoutMs`
  - 值参照其他策略（如 strategy-2-balanced: `defaultConcurrency: 12`, `staleTimeoutMs: 300000`）

  **Must NOT do**:
  - 不修改 agents/categories 配置（仅修底部配置段 + $schema/description）
  - 不改变策略的模型选择

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: 结构化 JSONC 编辑，复杂度低但需要仔细对照模板
  - **Skills**: [`git-master`]
    - `git-master`: 修复后 commit

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: Task 6
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `templates/strategy-0-super.jsonc:1-10` — $schema 和 description 字段格式参照
  - `templates/strategy-0-super.jsonc:260-290` — sisyphus_agent 标准格式参照
  - `templates/strategy-0-super.jsonc:290-305` — git_master / tmux / experimental 标准格式参照
  - `templates/strategy-7-china-first.jsonc:1-10` — 当前缺失 $schema 的位置
  - `templates/strategy-7-china-first.jsonc:225-246` — 当前非标准的 sisyphus_agent/git_master
  - `templates/strategy-2-balanced.jsonc:215-225` — background_task 完整格式参照

  **WHY Each Reference Matters**:
  - strategy-0-super 是最完整的标准模板，所有字段都有
  - 对照当前 china-first 的非标准格式，逐段替换为标准格式

  **Acceptance Criteria**:

  ```
  Scenario: $schema field exists
    Tool: Bash
    Steps:
      1. grep '$schema' templates/strategy-7-china-first.jsonc
      2. Assert: output contains schema URL
    Expected Result: $schema field present
    Evidence: grep output

  Scenario: sisyphus_agent matches standard format
    Tool: Bash
    Steps:
      1. grep -A5 'sisyphus_agent' templates/strategy-7-china-first.jsonc
      2. Assert: contains "disabled", "default_builder_enabled", "planner_enabled"
      3. Assert: does NOT contain standalone "model" or "fallback" keys
    Expected Result: Standard sisyphus_agent format
    Evidence: grep output

  Scenario: background_task has all required fields
    Tool: Bash
    Steps:
      1. grep -E '(defaultConcurrency|staleTimeoutMs)' templates/strategy-7-china-first.jsonc
      2. Assert: both fields present
    Expected Result: Complete background_task section
    Evidence: grep output
  ```

  **Commit**: YES
  - Message: `fix(templates): standardize strategy-7-china-first bottom-level config sections`
  - Files: `templates/strategy-7-china-first.jsonc`
  - Pre-commit: `bun run Tools/ManageStrategies.ts validate`

---

- [x] 3. Fix Model/Concurrency Issues — 4 Files

  **What to do**:

  **Issue #10: strategy-2-balanced — GPT-4o thinking config**
  - `unspecified-high` category 对 `gpt-4o` 配了 `thinking.budgetTokens: 50000`
  - GPT-4o 不支持 thinking（仅 o-series 模型支持）
  - 移除 `thinking` 配置，或换用支持 thinking 的模型

  **Issue #12: strategy-1-performance — 无用的 modelConcurrency 条目**
  - `modelConcurrency` 引用 `gpt-5.2-codex` 和 `claude-opus-4-6`
  - 策略中实际使用的是 `claude-opus-4-5-thinking`（不是 4-6）
  - 移除未使用的条目，或修正为实际使用的模型名

  **Issue #13: strategy-2-balanced — 无用的 modelConcurrency 条目**
  - 引用 `gpt-5.2-codex` 但未使用
  - 移除未使用的条目

  **Issue #14: strategy-1-performance — 注释错误**
  - 注释写"方案一：极致性能型"
  - 实际是 strategy-1（performance），应为"方案二"或更正描述

  **Issue #15: strategy-3-economical — gemini 版本混用**
  - fallback 中使用 `gemini-2.5-flash`（L98/L110），其他位置用 `gemini-3-flash`
  - 统一为 `gemini-3-flash`（与其他 9 个策略一致），除非用户确认 2.5-flash 是有意为之

  **Issue #16: strategy-4-creative — maxTokens 异常**
  - `ultrabrain` category `maxTokens: 100000`
  - 其他策略同类 category 范围 3000-8000
  - 修正为合理值（如 16000 或 10000）

  **Must NOT do**:
  - 不改变策略的 agent/category 模型选择
  - 不调整正确的并发数配置
  - 不修改非问题相关的字段

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: 多文件多处精确修改，需仔细但不复杂
  - **Skills**: [`git-master`]
    - `git-master`: 修复后 commit

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 4)
  - **Blocks**: Task 6
  - **Blocked By**: Task 1 (balanced 文件可能有 wave 1 修改)

  **References**:

  **Pattern References**:
  - `templates/strategy-2-balanced.jsonc:155-165` — unspecified-high category with thinking config
  - `templates/strategy-2-balanced.jsonc:227-243` — modelConcurrency section
  - `templates/strategy-1-performance.jsonc:171-182` — modelConcurrency with wrong model refs
  - `templates/strategy-1-performance.jsonc:1-5` — 注释"方案一"位置
  - `templates/strategy-3-economical.jsonc:98` — gemini-2.5-flash fallback (line 98)
  - `templates/strategy-3-economical.jsonc:110` — gemini-2.5-flash fallback (line 110)
  - `templates/strategy-3-economical.jsonc:148` — gemini-3-flash fallback (line 148, correct version)
  - `templates/strategy-4-creative.jsonc:122` — ultrabrain maxTokens: 100000

  **WHY Each Reference Matters**:
  - 每个引用精确定位需要修改的行，executor 可直接定位修改
  - gemini 版本需交叉对比 L98/L110 vs L148 确认统一方向

  **Acceptance Criteria**:

  ```
  Scenario: No GPT-4o with thinking config
    Tool: Bash
    Steps:
      1. Parse unspecified-high category in strategy-2-balanced.jsonc
      2. If model is gpt-4o: Assert no "thinking" or "budgetTokens" field
    Expected Result: thinking config only on models that support it
    Evidence: parsed output

  Scenario: modelConcurrency only references used models
    Tool: Bash
    Steps:
      1. Extract all model names from agents + categories in strategy-1-performance.jsonc
      2. Extract all model names from modelConcurrency
      3. Assert: every modelConcurrency key exists in agents or categories
    Expected Result: No orphaned modelConcurrency entries
    Evidence: comparison output

  Scenario: Gemini version consistent in strategy-3
    Tool: Bash
    Steps:
      1. grep "gemini.*flash" templates/strategy-3-economical.jsonc
      2. Assert: ALL references use same version (gemini-3-flash)
    Expected Result: No mixed gemini versions
    Evidence: grep output

  Scenario: ultrabrain maxTokens is reasonable
    Tool: Bash
    Steps:
      1. Parse ultrabrain category in strategy-4-creative.jsonc
      2. Assert: maxTokens <= 20000
    Expected Result: maxTokens in reasonable range
    Evidence: parsed value
  ```

  **Commit**: YES
  - Message: `fix(templates): fix model/concurrency issues in strategy-1/2/3/4`
  - Files: `templates/strategy-1-performance.jsonc`, `templates/strategy-2-balanced.jsonc`, `templates/strategy-3-economical.jsonc`, `templates/strategy-4-creative.jsonc`
  - Pre-commit: `bun run Tools/ManageStrategies.ts validate`

---

- [x] 4. Fix strategy-6-agent-focused multimodal-looker

  **What to do**:

  **Issue #19: multimodal-looker 使用错误模型**
  - 当前使用 `zhipuai/glm-4.7`（纯文本模型）
  - multimodal-looker 专门处理多模态内容（图片分析等）
  - 应换为真正的多模态模型，如 `google/gemini-3-pro`（或 `google/gemini-3-flash`）
  - 参照其他策略中 multimodal-looker 的模型选择

  **Must NOT do**:
  - 不修改 strategy-6 中其他 agent 的配置
  - 不调整 glm-4.7 的并发配置

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 单一字段修改
  - **Skills**: [`git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 3)
  - **Blocks**: Task 6
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `templates/strategy-6-agent-focused.jsonc:50-53` — multimodal-looker 当前配置
  - `templates/strategy-0-super.jsonc:103-112` — multimodal-looker 标准配置（使用 gemini）
  - `templates/strategy-2-balanced.jsonc:95-105` — multimodal-looker 另一参照

  **WHY Each Reference Matters**:
  - L50-53 精确定位需修改的 agent
  - 其他策略的 multimodal-looker 配置提供正确模型选择参照

  **Acceptance Criteria**:

  ```
  Scenario: multimodal-looker uses multimodal model
    Tool: Bash
    Steps:
      1. Parse multimodal-looker agent in strategy-6-agent-focused.jsonc
      2. Assert: model contains "gemini" (multimodal capable)
      3. Assert: model does NOT contain "glm" (text-only)
    Expected Result: Multimodal-capable model assigned
    Evidence: parsed value
  ```

  **Commit**: YES (groups with Task 3 if same wave)
  - Message: `fix(templates): use multimodal model for multimodal-looker in strategy-6`
  - Files: `templates/strategy-6-agent-focused.jsonc`
  - Pre-commit: `bun run Tools/ManageStrategies.ts validate`

---

- [x] 5. Optimizations + Fallbacks + context_length Cleanup — 6 Files

  **What to do**:

  **Issue #6: context_length 全部删除（用户决策 #1：DELETE）**
  - 移除 strategy-7-china-first.jsonc 中全部 18 处 `context_length` 字段
  - 搜索方式：grep -n "context_length" templates/strategy-7-china-first.jsonc
  - 逐一删除包含 `"context_length"` 的行（含前导逗号或后续逗号的 JSON 修正）
  - 注意 JSONC 格式：删除后确保 JSON 结构仍然合法（无悬挂逗号）

  **Issue #17: strategy-1-performance 补中国厂商 fallback**
  - 当前 strategy-1 高度依赖 github-copilot 和 anthropic，缺少中国厂商作为 fallback
  - 为关键 agent/category 添加 `minimax-coding-plan/MiniMax-M2.1` 或 `ark-coding-plan/doubao-seed-code` 作为二级 fallback
  - 具体：检查哪些 agent 只有单一 fallback 链，在末端添加中国厂商模型
  - 参照 strategy-0-super 和 strategy-7-china-first 的中国厂商模型命名

  **Issue #18: strategy-6-agent-focused 减少 glm-4.7 依赖**
  - 当前 14 个 agent/category 中 11 个使用 `zhipuai/glm-4.7`
  - 策略定位是"Agent-Focused"，应根据 agent 特性选择最适合的模型
  - 建议多样化策略：
    - 计算密集型 agent（ultrabrain, oracle）→ 保持 glm-4.7 或换用 deepseek 系列
    - 写作/创意型 agent（artistry, writing）→ 可用 minimax 或其他擅长创作的模型
    - 通用型 agent（build, quick）→ 保持 glm-4.7
    - 多模态 agent（multimodal-looker）→ Task 4 已处理
  - 目标：glm-4.7 占比从 ~78% 降到 ~50%

  **Issue #20: strategy-6-agent-focused 成本估算修正**
  - metadata 中成本估算 ¥800-1200/月，对中国厂商策略明显偏高
  - 全部用 zhipuai/glm-4.7 等国产模型，实际成本应远低于此
  - 修正为合理估算（参考 strategy-7-china-first 的 ¥100-300 范围）

  **Issue #21: strategy-0-super — explore agent 补 fallback**
  - 该策略其他所有 agent 都有 fallback，仅 explore 缺失
  - 参照同策略其他 agent 的 fallback 模式添加
  - 建议 fallback: `"google/gemini-3-pro"` 或 `"github-copilot/gpt-4o"`（参照该策略相似 agent 的 fallback）

  **Issue #22: strategy-4-creative — hephaestus/metis 补 fallback**
  - hephaestus（deepseek）和 metis（anthropic/sonnet）无 fallback
  - 参照同策略其他 agent 的 fallback 模式添加
  - hephaestus fallback 建议：`"github-copilot/gpt-4o"` 或同策略的通用 fallback
  - metis fallback 建议：`"google/gemini-3-pro"` 或同策略的通用 fallback

  **Issue #11: 底部配置段统一**
  - 检查 strategy-3/strategy-6 的底部配置段（sisyphus_agent/git_master/tmux/experimental）
  - 如果与 strategy-0 标准模式差异较大，按同样标准统一
  - Task 2 已标准化 china-first，此处处理剩余策略

  **Must NOT do**:
  - 不改变 agent 的主 model 选择（仅添加 fallback）
  - 不添加 Schema 中不存在的新字段
  - Issue #18 的多样化不能破坏策略"中国厂商 Agent 聚焦"的定位
  - Issue #17 添加的中国厂商 fallback 不能取代原有 fallback，只能作为额外兜底

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 多文件、多类型修改，需要理解每个策略的设计意图和模型特性；Issue #18 需要对模型能力有判断力
  - **Skills**: [`git-master`]
    - `git-master`: 修复后 commit
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: 无 UI 工作
    - `playwright`: 无浏览器验证

  **Parallelization**:
  - **Can Run In Parallel**: NO (依赖 Task 2 完成 china-first 标准化)
  - **Parallel Group**: Wave 3 (sequential)
  - **Blocks**: Task 6
  - **Blocked By**: Task 2 (china-first 标准化), Task 4 (multimodal-looker 已修)

  **References**:

  **Pattern References**:
  - `templates/strategy-0-super.jsonc:99-102` — explore agent（无 fallback 的位置）
  - `templates/strategy-0-super.jsonc:85-98` — 其他 agent 的 fallback 模式参照
  - `templates/strategy-0-super.jsonc:260-305` — 底部配置段标准格式
  - `templates/strategy-1-performance.jsonc:20-160` — agents/categories 列表，需分析哪些缺中国厂商 fallback
  - `templates/strategy-4-creative.jsonc:63-68` — hephaestus 缺 fallback 位置
  - `templates/strategy-4-creative.jsonc:90-95` — metis 缺 fallback 位置
  - `templates/strategy-4-creative.jsonc:45-62` — 其他 agent fallback 模式参照
  - `templates/strategy-6-agent-focused.jsonc:1-120` — 全文 agent 配置，需分析 glm-4.7 使用分布
  - `templates/strategy-6-agent-focused.jsonc:130-162` — 底部配置段 + metadata
  - `templates/strategy-7-china-first.jsonc` — 全文 context_length 分布（18 处待删除）
  - `templates/strategy-3-economical.jsonc:200-229` — 底部配置段当前状态

  **External References**:
  - 中国厂商模型命名标准：`minimax-coding-plan/MiniMax-M2.1`, `minimax-coding-plan/MiniMax-M2.1-lightning`, `ark-coding-plan/doubao-seed-code`, `ark-coding-plan/kimi-k2-thinking`
  - 并发标准：`providerConcurrency: minimax-coding-plan=5-12, ark-coding-plan=25-35`

  **WHY Each Reference Matters**:
  - strategy-0-super 底部配置是标准模板，所有统一操作以此为参照
  - strategy-1 全文需要逐一检查 agent，找到适合添加中国厂商 fallback 的位置
  - strategy-6 需要分析 glm-4.7 分布，按 agent 特性决定替换方案
  - strategy-7 需要精确定位 18 处 context_length 以便删除

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: All context_length removed from strategy-7
    Tool: Bash
    Steps:
      1. grep -c "context_length" templates/strategy-7-china-first.jsonc
      2. Assert: count is 0
      3. bun run Tools/ManageStrategies.ts validate
      4. Assert: 验证通过
    Expected Result: Zero context_length occurrences
    Evidence: grep count + validate output

  Scenario: strategy-7 JSONC still valid after removal
    Tool: Bash
    Steps:
      1. bun -e "const fs=require('fs'); const stripJsonComments=require('strip-json-comments'); JSON.parse(stripJsonComments(fs.readFileSync('templates/strategy-7-china-first.jsonc','utf8'))); console.log('valid')"
      2. Assert: outputs "valid" (no parse error)
    Expected Result: Valid JSONC after 18 deletions
    Evidence: parse output

  Scenario: explore agent has fallback in strategy-0-super
    Tool: Bash
    Steps:
      1. grep -A5 '"explore"' templates/strategy-0-super.jsonc
      2. Assert: contains "fallback"
    Expected Result: explore agent has fallback
    Evidence: grep output

  Scenario: hephaestus and metis have fallback in strategy-4
    Tool: Bash
    Steps:
      1. grep -A3 '"hephaestus"' templates/strategy-4-creative.jsonc
      2. Assert: contains "fallback"
      3. grep -A3 '"metis"' templates/strategy-4-creative.jsonc
      4. Assert: contains "fallback"
    Expected Result: Both agents have fallback
    Evidence: grep output

  Scenario: glm-4.7 usage reduced in strategy-6
    Tool: Bash
    Steps:
      1. grep -c "glm-4.7" templates/strategy-6-agent-focused.jsonc
      2. Assert: count <= 8 (was 11, target ~50% of agents)
    Expected Result: Reduced glm-4.7 over-reliance
    Evidence: grep count before/after

  Scenario: strategy-6 cost estimate corrected
    Tool: Bash
    Steps:
      1. grep -A2 "cost_estimate" templates/strategy-6-agent-focused.jsonc
      2. Assert: value range is reasonable for Chinese models (not ¥800-1200)
    Expected Result: Cost estimate reflects actual Chinese model pricing
    Evidence: grep output

  Scenario: strategy-1 has Chinese provider fallbacks
    Tool: Bash
    Steps:
      1. grep -E "(minimax|ark|doubao|kimi)" templates/strategy-1-performance.jsonc
      2. Assert: at least 2 Chinese provider references found
    Expected Result: Chinese providers added as fallbacks
    Evidence: grep output
  ```

  **Commit**: YES
  - Message: `fix(templates): add fallbacks, remove context_length, diversify models, fix cost estimates`
  - Files: `templates/strategy-0-super.jsonc`, `templates/strategy-1-performance.jsonc`, `templates/strategy-4-creative.jsonc`, `templates/strategy-6-agent-focused.jsonc`, `templates/strategy-7-china-first.jsonc`, `templates/strategy-3-economical.jsonc` (if bottom-level changes needed)
  - Pre-commit: `bun run Tools/ManageStrategies.ts validate`

---

- [x] 6. Global Validation — Final Check

  **What to do**:
  - 运行完整验证套件
  - 确认所有 10 个策略文件通过
  - 确认测试基线未退化
  - 跨策略一致性检查

  **Must NOT do**:
  - 不修改任何文件（仅验证）

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 纯验证任务
  - **Skills**: [`git-master`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Final (sequential)
  - **Blocks**: None
  - **Blocked By**: Tasks 1-5

  **References**:
  - All 10 `templates/strategy-*.jsonc` files

  **Acceptance Criteria**:

  ```
  Scenario: All strategies validate
    Tool: Bash
    Steps:
      1. bun run Tools/ManageStrategies.ts validate
      2. Assert: output contains success for all strategies
    Expected Result: Full validation pass
    Evidence: Complete validate output

  Scenario: Test baseline maintained
    Tool: Bash
    Steps:
      1. bun test 2>&1
      2. Assert: pass >= 152, fail <= 6
    Expected Result: No test regression
    Evidence: Full test output

  Scenario: Cross-strategy model name consistency
    Tool: Bash
    Steps:
      1. grep -rho '"model":\s*"[^"]*"' templates/strategy-*.jsonc | sort | uniq -c | sort -rn
      2. Assert: same model name has consistent format across files
    Expected Result: No model name format inconsistencies
    Evidence: Aggregated model name list

  Scenario: No bare "ark" in providerConcurrency
    Tool: Bash
    Steps:
      1. grep -r '"ark"' templates/strategy-*.jsonc | grep -v "ark-coding-plan"
      2. Assert: empty output (no bare "ark")
    Expected Result: All ark references use full provider name
    Evidence: grep output

  Scenario: No truncated model names
    Tool: Bash
    Steps:
      1. grep -r 'claude-sonnet-4\."' templates/ (note: 4. followed by quote = truncated)
      2. Assert: empty output
    Expected Result: No truncated claude-sonnet model names
    Evidence: grep output
  ```

  **Commit**: NO (verification only)

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `fix(templates): fix 3 critical bugs — truncated model, self-fallback, wrong provider name` | strategy-0-super, strategy-2-balanced, strategy-2-balanced-premium-safe | validate |
| 2 | `fix(templates): standardize strategy-7-china-first bottom-level config sections` | strategy-7-china-first | validate |
| 3 | `fix(templates): fix model/concurrency issues in strategy-1/2/3/4` | strategy-1/2/3/4 | validate |
| 4 | `fix(templates): use multimodal model for multimodal-looker in strategy-6` | strategy-6-agent-focused | validate |
| 5 | `fix(templates): add fallbacks, remove context_length, diversify models, fix cost estimates` | strategy-0-super, strategy-1-performance, strategy-4-creative, strategy-6-agent-focused, strategy-7-china-first, (strategy-3 if needed) | validate |
| 6 | (no commit — verification only) | — | validate + bun test |

---

## Success Criteria

### Verification Commands
```bash
bun run Tools/ManageStrategies.ts validate   # Expected: 策略验证通过
bun test                                      # Expected: ≥152 pass / ≤6 fail
grep -r 'claude-sonnet-4\."' templates/       # Expected: empty (no truncated names)
grep -r '"ark"' templates/ | grep -v "ark-coding-plan"  # Expected: empty
```

### Final Checklist
- [x] All 3 Tier 1 Bugs fixed (#1-#3)
- [x] strategy-7-china-first standardized (#4/#5/#7/#8/#9)
- [x] All 18 context_length occurrences deleted from strategy-7 (#6)
- [x] Model/concurrency errors fixed (#10-#16)
- [x] strategy-1 has Chinese provider fallbacks (#17)
- [x] strategy-6 glm-4.7 dependency diversified (#18)
- [x] multimodal-looker uses multimodal model (#19)
- [x] strategy-6 cost estimate corrected (#20)
- [x] Missing fallbacks added: explore (#21), hephaestus/metis (#22)
- [x] Bottom-level configs consistent across all strategies (#11)
- [x] All strategies pass validation
- [x] Test baseline maintained ≥152 pass / ≤6 fail
- [x] No truncated model names remain
- [x] No bare "ark" provider names remain
