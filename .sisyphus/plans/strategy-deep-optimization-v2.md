# 策略模板深度优化 v2

## TL;DR

> **Quick Summary**: 在前 8 个任务的基础上，对所有策略模板进行第二轮深度优化：修复结构缺失、提升中国 provider 覆盖率、统一版本管理、清理废弃文件、全面验证合规性。
>
> **Deliverables**:
> - 修复 strategy-1-performance 缺失的 3 个 section
> - 增强 strategy-6-agent-focused 的 Chinese provider 覆盖
> - 增强 strategy-5-research 的 minimax fallback
> - 清理 strategy-2-balanced-copilot 残留引用（文件已删除，清理文档残留）
> - 统一 metadata 版本号和 changelog
> - 完整 schema 合规验证（bun test + CLI validate）
> - 文档同步更新
>
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Task 1-3 (parallel) → Task 4-5 (parallel) → Task 6-7 (sequential)

---

## Context

### Original Request
用户拥有 Github Copilot Pro+、Claude Pro、ChatGPT Plus、zhipu Coding Plan Pro、minimax Coding Plan Pro、方舟 CodingPlan Pro 等订阅，以及 DeepSeek ¥300、硅基流动 ¥200、OpenRouter ¥100 API 额度。要求对 templates/ 目录下所有策略模板进行深度优化，确保 schema 合规、场景覆盖完整、成本平衡、中国 provider 利用率最大化。

### Previous Work (Phase A + Phase B Wave 1-3)
前 8 个任务已完成：
- `copilot/` → `github-copilot/` 前缀迁移
- `anthropic/claude-sonnet-4.5` → `claude-sonnet-4-5` 命名修复
- Copilot Premium 优化（去除所有 3x opus 引用）
- 创建 strategy-2-balanced-premium-safe.jsonc 和 strategy-7-china-first.jsonc
- 注册新策略到 Tools/Recommender.ts 和文档

### Research Findings

#### 模型命名规范（已确认）
| Provider 前缀 | 命名格式 | 示例 | 来源 |
|-------------|----------|------|------|
| `github-copilot/` | DOT（点号） | `claude-sonnet-4.5` | Validator.ts L166 |
| `anthropic/` | DASH（连字符） | `claude-sonnet-4-5` | Validator.ts L152-153 |
| `zhipuai-coding-plan/` | 原始名称 | `glm-4.7` | 现有模板 |
| `minimax-coding-plan/` | PascalCase | `MiniMax-M2.1` | 现有模板 |
| `ark-coding-plan/` | 原始名称 | `doubao-seed-code` | 现有模板 |

#### Section 完整性审计
| 模板 | sisyphus_agent | git_master | tmux | experimental | disabled_mcps | disabled_hooks |
|------|:---:|:---:|:---:|:---:|:---:|:---:|
| strategy-0-super | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| strategy-1-performance | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| strategy-2-balanced | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| strategy-2-balanced-direct | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| strategy-2-balanced-premium-safe | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| strategy-3-economical | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| strategy-4-creative | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| strategy-5-research | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| strategy-6-agent-focused | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| strategy-7-china-first | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

#### Chinese Provider 覆盖审计
| Provider | 当前覆盖 | 缺失策略 |
|----------|---------|---------|
| zhipuai-coding-plan (glm-4.7) | 10/10 | 无 ✅ |
| ark-coding-plan (doubao-seed-code) | 8/10 | premium-safe(设计如此), agent-focused |
| minimax-coding-plan (MiniMax-M2.1) | 8/10 | premium-safe(设计如此), agent-focused |
| deepseek | 3/10 | 仅在 strategy-3,4,7 (API fallback) |
| siliconflow | 1/10 | 仅在 strategy-7 (API fallback) |
| openrouter | 1/10 | 仅在 strategy-7 (API fallback) |

#### Copilot Premium 状态
所有策略已清除 3x models，Premium 消耗控制良好：
- strategy-0: ~200 req/mo (sonnet 1x)
- 其余: <100 req/mo

### Metis Review
**Identified Gaps (addressed)**:
- schema 合规验证需要双重检查（Validator.ts + CLI） → 已加入 Task 6
- deprecated 文件删除需要预扫描引用 → 已加入 Task 4
- strategy-1 缺失 section 需要合理默认值 → 使用 strategy-2-balanced 的值（最近似的参考）
- 模型名称格式需严格遵循 provider 规范 → 已在计划中强调
- 版本号策略需要统一 → 使用 metadata 更新而非强制统一版本号

---

## Work Objectives

### Core Objective
在前 8 个任务的成果上，完成策略模板的深度优化：修复所有结构缺陷、提升中国 provider 覆盖、确保完整 schema 合规。

### Concrete Deliverables
- 修复 `strategy-1-performance.jsonc`：添加 sisyphus_agent, disabled_mcps, disabled_hooks
- 增强 `strategy-6-agent-focused.jsonc`：添加 minimax/ark 模型作为 fallback
- 增强 `strategy-5-research.jsonc`：添加 minimax 模型作为 fallback
- 清理 `strategy-2-balanced-copilot` 残留引用（文件已删除，仅清理文档/代码残留）
- 统一所有策略的 metadata.version 和 changelog
- 通过 bun test + CLI validate 双重验证
- 更新 `command/strategies.md`、`docs/migration-guide-2026.md`、`Tools/Recommender.ts`

### Definition of Done
- [x] `bun test` 通过（≥152 pass，≤6 fail）
- [x] `bun run Tools/ManageStrategies.ts validate` 无错误
- [x] `grep -r "strategy-2-balanced-copilot" docs/ command/ Tools/` 无结果
- [x] 所有 10 个策略模板具有完整的 6 个 bottom-level sections
- [x] strategy-6 和 strategy-5 包含中国 provider fallback

### Must Have
- strategy-1-performance 结构完整性修复
- deprecated 文件安全删除
- 全面 schema 合规验证

### Must NOT Have (Guardrails)
- ❌ 不得修改 strategy-0-super 和 strategy-2-balanced 的核心逻辑（基准策略）
- ❌ 不得在 economical 策略中使用 Premium 模型
- ❌ 不得添加 oh-my-opencode schema 未定义的字段
- ❌ 不得创建新的策略模板文件（仅优化现有 10 个）
- ❌ 不得修改 Tools/ 目录的业务逻辑代码（仅更新 Recommender.ts 的数据映射）
- ❌ 不得修改 strategy-2-balanced-direct.jsonc（用户未要求）
- ❌ 不得在非中国策略中将 Chinese providers 作为 primary model

---

## Verification Strategy

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks MUST be verifiable by agent-executed commands.

### Test Decision
- **Infrastructure exists**: YES
- **Automated tests**: YES (tests-after, validation focused)
- **Framework**: bun test (existing)
- **CLI validation**: `bun run Tools/ManageStrategies.ts validate`

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

每个 task 完成后必须执行：
1. **JSONC 语法验证**: `node -e "const json5=require('json5');json5.parse(require('fs').readFileSync('FILE','utf8'))"`
2. **Validator.ts 验证**: `bun run Tools/ManageStrategies.ts validate`
3. **单元测试**: `bun test`
4. **特定 grep 检查**: 根据任务的具体修改内容

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — 3 parallel tasks):
├── Task 1: Fix strategy-1-performance structure [no deps]
├── Task 2: Enhance strategy-6-agent-focused [no deps]
└── Task 3: Enhance strategy-5-research [no deps]

Wave 2 (After Wave 1 — 2 parallel tasks):
├── Task 4: Delete deprecated file + clean refs [depends: none, but after wave 1 for safety]
└── Task 5: Unify metadata versions + changelog [depends: 1,2,3]

Wave 3 (After Wave 2 — 2 sequential tasks):
├── Task 6: Full validation (bun test + CLI) [depends: 1-5]
└── Task 7: Documentation sync [depends: 4,5,6]
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 5, 6 | 2, 3 |
| 2 | None | 5, 6 | 1, 3 |
| 3 | None | 5, 6 | 1, 2 |
| 4 | None | 7 | 5 |
| 5 | 1, 2, 3 | 6 | 4 |
| 6 | 1-5 | 7 | None |
| 7 | 4, 5, 6 | None | None (final) |

---

## TODOs

- [x] 1. Fix strategy-1-performance: Add 3 Missing Sections

  **What to do**:
  - 在 `strategy-1-performance.jsonc` 中添加 `sisyphus_agent`, `disabled_mcps`, `disabled_hooks` 三个 section
  - 参考 `strategy-2-balanced.jsonc` 的对应 section 作为模板（最近似的参考策略）
  - `sisyphus_agent` 配置：`default_builder_enabled: true`, `planner_enabled: true`, `auto_compact: true`
  - `disabled_mcps`: 空数组 `[]`
  - `disabled_hooks`: 空数组 `[]`
  - 确保插入位置在 `experimental` section 之后（遵循其他策略的顺序）
  - 更新 `metadata.version`（追加 patch：当前版本 +0.0.1）
  - 更新 `metadata.updated` 为当前日期

  **Must NOT do**:
  - 不修改任何现有 agent/category/model 配置
  - 不添加 schema 未定义的字段
  - 不改变 performance 策略的定位和成本

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 单文件修改，结构清晰，低风险
  - **Skills**: []
    - 无需特殊 skills，仅 JSON 编辑
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: 不涉及 UI

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: Task 5, Task 6
  - **Blocked By**: None

  **References**:

  **Pattern References** (existing code to follow):
  - `templates/strategy-2-balanced.jsonc:L245-268` — sisyphus_agent, git_master, tmux, experimental, disabled_mcps, disabled_hooks 完整 section 示范（6 个 section 的标准布局）
  - `templates/strategy-0-super.jsonc:L269-301` — 另一个完整的 6-section 参考（super 策略可能有更丰富的配置）

  **API/Type References**:
  - `Tools/Validator.ts` — 验证 sisyphus_agent, disabled_mcps, disabled_hooks 的字段规范

  **Target File**:
  - `templates/strategy-1-performance.jsonc` — 当前有 git_master(L232), tmux(L236), experimental(L241)，需要在 experimental 之后插入 3 个缺失 section

  **Acceptance Criteria**:

  - [ ] `grep -c 'sisyphus_agent' templates/strategy-1-performance.jsonc` → 1
  - [ ] `grep -c 'disabled_mcps' templates/strategy-1-performance.jsonc` → 1
  - [ ] `grep -c 'disabled_hooks' templates/strategy-1-performance.jsonc` → 1
  - [ ] JSONC 语法有效：`node -e "const s=require('json5');JSON.parse(s(require('fs').readFileSync('templates/strategy-1-performance.jsonc','utf8')))"`
  - [ ] `bun run Tools/ManageStrategies.ts validate` → 无错误

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Verify 3 missing sections added correctly
    Tool: Bash (grep + node)
    Preconditions: strategy-1-performance.jsonc modified
    Steps:
      1. grep -n 'sisyphus_agent' templates/strategy-1-performance.jsonc
         Assert: Exactly 1 match, line number > 241 (after experimental)
      2. grep -n 'disabled_mcps' templates/strategy-1-performance.jsonc
         Assert: Exactly 1 match
      3. grep -n 'disabled_hooks' templates/strategy-1-performance.jsonc
         Assert: Exactly 1 match
      4. node -e "const s=require('json5');const j=JSON.parse(s(require('fs').readFileSync('templates/strategy-1-performance.jsonc','utf8')));console.log(Object.keys(j).join(','))"
         Assert: Output includes sisyphus_agent, disabled_mcps, disabled_hooks
      5. bun run Tools/ManageStrategies.ts validate
         Assert: No errors for strategy-1-performance
    Expected Result: All 3 sections present, valid JSONC, passes validation
    Evidence: Terminal output captured

  Scenario: Verify no regression in existing config
    Tool: Bash (diff + bun test)
    Preconditions: strategy-1-performance.jsonc modified
    Steps:
      1. node -e "const s=require('json5');const j=JSON.parse(s(require('fs').readFileSync('templates/strategy-1-performance.jsonc','utf8')));console.log(JSON.stringify(j.agents?.sisyphus?.model))"
         Assert: Output unchanged from before modification
      2. bun test
         Assert: ≥152 pass, ≤6 fail
    Expected Result: Existing configuration untouched
    Evidence: Test output captured
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `fix(templates): add missing sections to strategy-1-performance`
  - Files: `templates/strategy-1-performance.jsonc`
  - Pre-commit: `bun test`

---

- [x] 2. Enhance strategy-6-agent-focused: Add Chinese Provider Fallbacks

  **What to do**:
  - 在 `strategy-6-agent-focused.jsonc` 的相关 category 中添加 `minimax-coding-plan` 和 `ark-coding-plan` 模型作为 fallback
  - 具体添加位置（参考现有中国 provider 集成模式）：
    - `categories.ultrabrain` 或 `categories.deep` 的 fallback 数组中添加 `ark-coding-plan/kimi-k2-thinking`
    - `categories.unspecified-high` 的 fallback 中添加 `minimax-coding-plan/MiniMax-M2.1`
    - `categories.unspecified-low` 的 fallback 中添加 `minimax-coding-plan/MiniMax-M2.1-lightning`
  - 在 `background_task.modelConcurrency` 中添加 minimax 和 ark 模型的并发配置
  - 在 `background_task.providerConcurrency` 中添加 `minimax-coding-plan` 和 `ark-coding-plan` 条目
  - 更新 `metadata` 中的 resources_used 和 version

  **Must NOT do**:
  - 不将 Chinese providers 设为 primary model
  - 不修改 sisyphus/prometheus/oracle 等核心 agent 的 primary model
  - 不改变策略的成本定位

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: 多处小修改，需要仔细对照现有模式
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: 不涉及 UI

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3)
  - **Blocks**: Task 5, Task 6
  - **Blocked By**: None

  **References**:

  **Pattern References** (existing code to follow):
  - `templates/strategy-2-balanced.jsonc` — 中国 provider fallback 的标准集成模式（查看 categories 中的 fallback 数组如何引用 zhipuai-coding-plan, minimax-coding-plan, ark-coding-plan）
  - `templates/strategy-7-china-first.jsonc` — 中国 provider 为主力的参考（查看 providerConcurrency 和 modelConcurrency 中的 minimax/ark 配置值）
  - `templates/strategy-4-creative.jsonc` — 另一个包含 minimax/ark 的参考策略

  **Target File**:
  - `templates/strategy-6-agent-focused.jsonc` — 当前 zhipuai-coding-plan 已集成（agents.sisyphus.model），但 minimax 和 ark 缺失

  **WHY Each Reference Matters**:
  - strategy-2-balanced: 展示 fallback 数组中 Chinese provider 的标准排序（Claude > Copilot > ZhiPu > MiniMax > Ark）
  - strategy-7-china-first: 展示 minimax/ark 的并发值设置（典型 modelConcurrency 值）
  - strategy-4-creative: 验证 MiniMax-M2.1 和 MiniMax-M2.1-lightning 的正确拼写

  **Acceptance Criteria**:

  - [ ] `grep -c 'minimax-coding-plan' templates/strategy-6-agent-focused.jsonc` → ≥2 (model + concurrency)
  - [ ] `grep -c 'ark-coding-plan' templates/strategy-6-agent-focused.jsonc` → ≥2 (model + concurrency)
  - [ ] JSONC 语法有效
  - [ ] `bun run Tools/ManageStrategies.ts validate` → 无错误

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Verify minimax and ark added as fallbacks
    Tool: Bash (grep + node)
    Preconditions: strategy-6-agent-focused.jsonc modified
    Steps:
      1. grep 'minimax-coding-plan' templates/strategy-6-agent-focused.jsonc
         Assert: ≥2 matches (at least 1 in categories, 1 in concurrency)
      2. grep 'ark-coding-plan' templates/strategy-6-agent-focused.jsonc
         Assert: ≥2 matches
      3. node -e "const s=require('json5');const j=JSON.parse(s(require('fs').readFileSync('templates/strategy-6-agent-focused.jsonc','utf8')));console.log(JSON.stringify(j.background_task?.providerConcurrency))"
         Assert: Output includes minimax-coding-plan and ark-coding-plan
      4. bun run Tools/ManageStrategies.ts validate
         Assert: No errors
    Expected Result: Chinese providers integrated as fallback, valid config
    Evidence: Terminal output captured

  Scenario: Verify primary models unchanged
    Tool: Bash (grep)
    Preconditions: strategy-6-agent-focused.jsonc modified
    Steps:
      1. grep '"model"' templates/strategy-6-agent-focused.jsonc | head -5
         Assert: Primary models (zhipuai-coding-plan/glm-4.7, github-copilot/gpt-5-mini, etc.) unchanged
      2. node -e "const s=require('json5');const j=JSON.parse(s(require('fs').readFileSync('templates/strategy-6-agent-focused.jsonc','utf8')));console.log(j.agents.sisyphus.model)"
         Assert: Output is "zhipuai-coding-plan/glm-4.7" (unchanged)
    Expected Result: Core agent config untouched
    Evidence: Terminal output captured
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `feat(templates): add minimax/ark fallbacks to strategy-6-agent-focused`
  - Files: `templates/strategy-6-agent-focused.jsonc`
  - Pre-commit: `bun test`

---

- [x] 3. Enhance strategy-5-research: Add MiniMax Fallback

  **What to do**:
  - 在 `strategy-5-research.jsonc` 的相关 category fallback 中添加 `minimax-coding-plan/MiniMax-M2.1` 作为 fallback
  - 添加到 `background_task.modelConcurrency` 和 `providerConcurrency`
  - Research 策略侧重深度思考，MiniMax-M2.1 作为辅助 fallback（不改变主力 Opus/Sonnet 配置）
  - 更新 metadata

  **Must NOT do**:
  - 不修改核心研究 agent 的 primary model（必须保留 Opus/extended thinking）
  - 不改变 research 策略的高端定位

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 单文件小修改，添加 fallback 模型
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2)
  - **Blocks**: Task 5, Task 6
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `templates/strategy-5-research.jsonc` — 目标文件，查看现有 fallback 模式
  - `templates/strategy-2-balanced.jsonc` — minimax fallback 的标准集成模式（包括 modelConcurrency 值设置）

  **Target File**:
  - `templates/strategy-5-research.jsonc` — 当前有 zhipuai 和 ark，但缺少 minimax

  **Acceptance Criteria**:

  - [ ] `grep -c 'minimax-coding-plan' templates/strategy-5-research.jsonc` → ≥2
  - [ ] JSONC 语法有效
  - [ ] `bun run Tools/ManageStrategies.ts validate` → 无错误

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Verify minimax added to research strategy
    Tool: Bash (grep + validate)
    Preconditions: strategy-5-research.jsonc modified
    Steps:
      1. grep 'minimax-coding-plan' templates/strategy-5-research.jsonc
         Assert: ≥2 matches
      2. node -e "const s=require('json5');const j=JSON.parse(s(require('fs').readFileSync('templates/strategy-5-research.jsonc','utf8')));console.log(j.agents?.sisyphus?.model)"
         Assert: Primary model unchanged (still opus or sonnet based)
      3. bun run Tools/ManageStrategies.ts validate
         Assert: No errors
    Expected Result: MiniMax added as fallback without changing research positioning
    Evidence: Terminal output captured
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `feat(templates): add minimax fallback to strategy-5-research`
  - Files: `templates/strategy-5-research.jsonc`
  - Pre-commit: `bun test`

---

- [x] 4. Clean Up Deprecated strategy-2-balanced-copilot References

  **What to do**:
  - **注意**: 该文件已在 Phase B 中被删除，不再存在于 `templates/` 目录下
  - **确认文件已删除**: `ls templates/strategy-2-balanced-copilot.jsonc` → 应返回 "No such file"
  - **清理残留引用**（已知残留）：
    - `docs/migration-guide-2026.md:527` — 仍有 `strategy-2-balanced-copilot` 引用，需删除/更新该行
    - `Tools/Recommender.ts` — 检查 COST_LEVELS 和 QUALITY_SCORES 中是否有条目，如有则删除
    - `Tools/ManageStrategies.ts` — 搜索 balanced-copilot 字符串，清理
    - `command/strategies.md` — 确认已无引用（前 Task 8C 已处理，但需 double-check）
  - **验证** git 状态确认文件已删除

  **Must NOT do**:
  - 不创建 deprecated/ 目录（git 历史已有完整记录，无需额外保留）
  - 不修改其他策略文件

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 文件删除 + grep 清理，简单直接
  - **Skills**: [`git-master`]
    - `git-master`: 确保 git rm 正确执行

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 5)
  - **Blocks**: Task 7
  - **Blocked By**: None (logically after Wave 1 for safety, but no hard dependency)

  **References**:

  **Pre-deletion Check**:
  - `Tools/Recommender.ts:L130` — COST_LEVELS map（检查是否有 balanced-copilot 条目）
  - `Tools/ManageStrategies.ts` — 搜索 balanced-copilot 字符串
  - `command/strategies.md` — 目录列表和策略表（Task 8C 已移除，但需确认）

  **Acceptance Criteria**:

  - [ ] `ls templates/strategy-2-balanced-copilot.jsonc` → 文件不存在
  - [ ] `grep -r "strategy-2-balanced-copilot" ./ --include="*.ts" --include="*.md"` → 无结果
  - [ ] `bun test` → ≥152 pass, ≤6 fail

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Verify deprecated file deleted and no residual references
    Tool: Bash (ls + grep)
    Preconditions: File deletion executed
    Steps:
      1. ls templates/strategy-2-balanced-copilot.jsonc 2>&1
         Assert: "No such file or directory"
      2. grep -r "strategy-2-balanced-copilot" ./ --include="*.ts" --include="*.md" --include="*.json" --include="*.jsonc" 2>/dev/null
         Assert: Exit code 1 (no matches)
      3. bun test
         Assert: ≥152 pass, ≤6 fail
      4. bun run Tools/ManageStrategies.ts list
         Assert: Output does NOT contain "balanced-copilot"
    Expected Result: File removed, zero references, tests pass
    Evidence: Terminal output captured
  ```

  **Commit**: YES
  - Message: `chore(templates): remove deprecated strategy-2-balanced-copilot`
  - Files: `templates/strategy-2-balanced-copilot.jsonc` (deleted), potentially Recommender.ts
  - Pre-commit: `bun test`

---

- [x] 5. Unify Metadata Versions and Changelog

  **What to do**:
  - 对所有在本轮优化中被修改的策略模板，统一更新 metadata：
    - `version`: 基于当前版本递增 patch（如 v3.0.0 → v3.0.1, v3.1.0 → v3.1.1）
    - `updated`: 当前日期
    - 确保 `metadata.changelog` 包含本轮修改的条目
  - 对未被修改的策略（strategy-0, strategy-2-balanced, strategy-2-direct, strategy-3, strategy-4, strategy-7），仅检查不修改
  - 确保所有策略的 metadata 结构一致（都有 name, version, description, updated, cost_level, estimated_monthly_cost, resources_used）

  **Must NOT do**:
  - 不强制统一版本号（各策略保留自己的版本线）
  - 不修改未在本轮修改的策略文件的内容
  - 不改变策略的功能行为

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Metadata 更新，纯 JSON 编辑
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 4)
  - **Blocks**: Task 6
  - **Blocked By**: Tasks 1, 2, 3

  **References**:

  **Pattern References**:
  - `templates/strategy-0-super.jsonc:L1-20` — metadata 完整结构示例（name, version, description, updated, cost_level, etc.）
  - `templates/strategy-2-balanced.jsonc:L1-20` — 另一个 metadata 完整示例

  **Target Files** (仅修改本轮被 Task 1-3 改动的文件):
  - `templates/strategy-1-performance.jsonc` — 需更新 version/updated
  - `templates/strategy-5-research.jsonc` — 需更新 version/updated
  - `templates/strategy-6-agent-focused.jsonc` — 需更新 version/updated

  **Acceptance Criteria**:

  - [ ] 所有 3 个修改的策略文件的 metadata.updated 为当前日期
  - [ ] 版本号已递增（patch level）
  - [ ] JSONC 语法有效
  - [ ] 未修改的策略文件无变化

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Verify metadata updates are correct
    Tool: Bash (grep + node)
    Preconditions: Tasks 1-3 completed, metadata updated
    Steps:
      1. for f in strategy-1-performance strategy-5-research strategy-6-agent-focused; do
           grep '"updated"' "templates/$f.jsonc"
         done
         Assert: All 3 files show today's date (2026-02-10 or later)
      2. for f in strategy-0-super strategy-2-balanced strategy-3-economical strategy-4-creative strategy-7-china-first; do
           git diff "templates/$f.jsonc"
         done
         Assert: No changes in unmodified files
      3. bun run Tools/ManageStrategies.ts validate
         Assert: No errors
    Expected Result: Only modified files have updated metadata
    Evidence: Terminal output captured
  ```

  **Commit**: YES (groups with Task 4)
  - Message: `chore(templates): update metadata versions for optimized strategies`
  - Files: `templates/strategy-{1,5,6}*.jsonc`
  - Pre-commit: `bun test`

---

- [x] 6. Full Validation (Read-Only Verification)

  **What to do**:
  - 执行全面的验证套件，**不修改任何文件**：
    1. **JSONC 语法验证**: 对所有 9 个策略文件（删除 balanced-copilot 后）运行 JSON 解析
    2. **Provider 前缀验证**: `grep '"copilot/' templates/strategy-*.jsonc | grep -v 'github-copilot/'` → 空
    3. **Model 命名验证**: `grep 'anthropic/claude-sonnet-4\.5\|anthropic/claude-haiku-4\.5' templates/` → 空
    4. **Section 完整性**: 每个策略都有 sisyphus_agent, git_master, tmux, experimental, disabled_mcps, disabled_hooks
    5. **Chinese Provider 覆盖**: strategy-5 和 strategy-6 现在包含 minimax
    6. **Premium 审计**: 无 3x Copilot 模型
    7. **`bun test`**: ≥152 pass, ≤6 fail
    8. **CLI validate**: `bun run Tools/ManageStrategies.ts validate` → 无错误

  **Must NOT do**:
  - 不修改任何文件（纯验证）

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 只读验证，一系列 grep/test 命令
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (sequential)
  - **Blocks**: Task 7
  - **Blocked By**: Tasks 1-5

  **References**:

  **Validation Commands Reference**:
  - `bun test` — 测试套件（tests/ 目录）
  - `bun run Tools/ManageStrategies.ts validate` — CLI 验证命令
  - `Tools/Validator.ts` — 验证器实现（了解验证规则）

  **Acceptance Criteria**:

  - [ ] 9 个策略文件全部 JSONC 解析成功
  - [ ] 0 个 `"copilot/` 前缀残留（不含 `github-`）
  - [ ] 0 个 `anthropic/claude-*4.5` 命名残留
  - [ ] 所有 9 个策略具有完整 6 个 bottom-level sections
  - [ ] 0 个 3x Copilot Premium 模型
  - [ ] `bun test` ≥152 pass, ≤6 fail
  - [ ] `bun run Tools/ManageStrategies.ts validate` 无错误

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Complete validation suite
    Tool: Bash (comprehensive)
    Preconditions: All Tasks 1-5 completed
    Steps:
      1. for f in templates/strategy-*.jsonc; do
           echo "Parsing $f..."
           node -e "const s=require('json5');JSON.parse(s(require('fs').readFileSync('$f','utf8')))" && echo "OK" || echo "FAIL"
         done
         Assert: All 9 files output "OK"
      2. grep '"copilot/' templates/strategy-*.jsonc | grep -v 'github-copilot/'
         Assert: Exit code 1 (no matches)
      3. grep 'anthropic/claude-sonnet-4\.5\|anthropic/claude-haiku-4\.5' templates/strategy-*.jsonc
         Assert: Exit code 1 (no matches)
      4. for f in templates/strategy-*.jsonc; do
           node -e "const s=require('json5');const j=JSON.parse(s(require('fs').readFileSync('$f','utf8')));const keys=['sisyphus_agent','git_master','tmux','experimental','disabled_mcps','disabled_hooks'];const missing=keys.filter(k=>!(k in j));if(missing.length)console.log('MISSING in $f:',missing.join(','));else console.log('$f: ALL SECTIONS OK')"
         done
         Assert: All 9 files report "ALL SECTIONS OK"
      5. grep 'github-copilot/claude-opus' templates/strategy-*.jsonc
         Assert: Exit code 1 (no 3x models)
      6. bun test
         Assert: ≥152 pass, ≤6 fail
      7. bun run Tools/ManageStrategies.ts validate
         Assert: No errors

    Expected Result: All 7 validation checks pass
    Evidence: Terminal output captured for each check
  ```

  **Commit**: NO (read-only task)

---

- [x] 7. Documentation Sync

  **What to do**:
  - **`command/strategies.md`**:
    - 确认 `strategy-2-balanced-copilot` 已从目录列表和策略表中移除（Task 8C 已处理）
    - 确认新增的 strategy-6/7/premium-safe 信息正确
    - 如果 Task 1-3 的修改影响了成本估算，更新表格中的月成本列
  - **`docs/migration-guide-2026.md`**:
    - 添加新条目：v2 深度优化 section（记录 Task 1-5 的修改内容）
    - 标注 strategy-2-balanced-copilot 已删除
  - **`Tools/Recommender.ts`**:
    - 如果 Task 4 删除 balanced-copilot 时发现了残留条目，确认已清理
    - 确认 COST_LEVELS 和 QUALITY_SCORES 的值与修改后的策略一致
  - **`AGENTS.md`**:
    - 更新 Available strategy templates 表格（移除 balanced-copilot，确认其他信息）

  **Must NOT do**:
  - 不修改 Tools/ 的业务逻辑代码
  - 不添加新的文档文件

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: 多文件文档更新，需要仔细对照
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (sequential, after Task 6)
  - **Blocks**: None (final task)
  - **Blocked By**: Tasks 4, 5, 6

  **References**:

  **Target Files**:
  - `command/strategies.md` — 策略目录和表格（L366-405 区域）
  - `docs/migration-guide-2026.md` — 迁移指南（L912+ 区域）
  - `Tools/Recommender.ts` — COST_LEVELS(~L130), QUALITY_SCORES(~L145)
  - `AGENTS.md` — Available strategy templates 表格

  **Pattern References**:
  - Task 8C 和 8D 的修改模式（前一轮已更新过这些文件，参考其格式和位置）

  **Acceptance Criteria**:

  - [ ] `grep -r "strategy-2-balanced-copilot" command/ docs/ Tools/ AGENTS.md` → 无结果
  - [ ] `command/strategies.md` 策略表包含 9 个策略（非 10 个）
  - [ ] `docs/migration-guide-2026.md` 有 v2 深度优化的条目
  - [ ] `bun test` → ≥152 pass, ≤6 fail

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Verify documentation is consistent
    Tool: Bash (grep + wc)
    Preconditions: All previous tasks completed
    Steps:
      1. grep -r "strategy-2-balanced-copilot" command/ docs/ Tools/ AGENTS.md
         Assert: Exit code 1 (no matches)
      2. grep -c 'strategy-' command/strategies.md | head -1
         Assert: Count reflects 9 strategies (not 10)
      3. grep 'v2.*深度优化\|deep.*optimization' docs/migration-guide-2026.md
         Assert: At least 1 match (new section exists)
      4. bun test
         Assert: ≥152 pass, ≤6 fail
    Expected Result: All docs synced, no stale references
    Evidence: Terminal output captured

  Scenario: Verify Recommender.ts consistency
    Tool: Bash (grep)
    Preconditions: Documentation sync completed
    Steps:
      1. grep 'balanced-copilot' Tools/Recommender.ts
         Assert: Exit code 1 (no matches — cleaned)
      2. grep 'strategy-6-agent-focused\|strategy-7-china-first\|premium-safe' Tools/Recommender.ts
         Assert: 4+ matches (COST_LEVELS + QUALITY_SCORES for each)
    Expected Result: Recommender data consistent with template changes
    Evidence: Terminal output captured
  ```

  **Commit**: YES
  - Message: `docs: sync documentation after v2 deep optimization`
  - Files: `command/strategies.md`, `docs/migration-guide-2026.md`, `Tools/Recommender.ts` (if needed), `AGENTS.md`
  - Pre-commit: `bun test`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| Wave 1 (1,2,3) | `fix(templates): add missing sections to strategy-1-performance` | strategy-1-performance.jsonc | bun test |
| Wave 1 (1,2,3) | `feat(templates): add minimax/ark fallbacks to strategy-6-agent-focused` | strategy-6-agent-focused.jsonc | bun test |
| Wave 1 (1,2,3) | `feat(templates): add minimax fallback to strategy-5-research` | strategy-5-research.jsonc | bun test |
| Wave 2 (4) | `chore(templates): remove deprecated strategy-2-balanced-copilot` | strategy-2-balanced-copilot.jsonc (deleted) | bun test + grep |
| Wave 2 (5) | `chore(templates): update metadata versions for optimized strategies` | strategy-{1,5,6}*.jsonc | bun test |
| Wave 3 (7) | `docs: sync documentation after v2 deep optimization` | command/strategies.md, docs/*, AGENTS.md | bun test |

---

## Success Criteria

### Verification Commands
```bash
# 1. All tests pass
bun test
# Expected: ≥152 pass, ≤6 fail

# 2. CLI validation
bun run Tools/ManageStrategies.ts validate
# Expected: No errors

# 3. No deprecated file references
grep -r "strategy-2-balanced-copilot" ./ --include="*.ts" --include="*.md" --include="*.json" --include="*.jsonc"
# Expected: Exit code 1 (no matches)

# 4. All 9 strategies have complete structure
for f in templates/strategy-*.jsonc; do echo "$f"; done | wc -l
# Expected: 9

# 5. No prefix residual
grep '"copilot/' templates/strategy-*.jsonc | grep -v 'github-copilot/'
# Expected: Empty

# 6. No 3x Premium models
grep 'github-copilot/claude-opus' templates/strategy-*.jsonc
# Expected: Empty

# 7. Chinese provider coverage
grep -l 'minimax-coding-plan' templates/strategy-*.jsonc | wc -l
# Expected: ≥9 (all except premium-safe)
```

### Final Checklist
- [x] All "Must Have" present
- [x] All "Must NOT Have" absent
- [x] All tests pass
- [x] Documentation synchronized
- [x] Deprecated file removed
- [x] All 9 strategies schema-compliant
