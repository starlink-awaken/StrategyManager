# Decisions

## 2026-02-08 Session Start

### Initial Setup Decisions
1. **Plan Execution Strategy**: Follow wave-based parallel execution from plan
2. **Task 0 Priority**: Model verification is blocking all subsequent tasks - must complete first
3. **QA Protocol**: Follow Atlas verification rules - project-level lsp_diagnostics, build, test suite after each delegation

### 2026-02-08 Task 0 Blockage Resolution

**Decision**: Adjust Model Selection for Task 1-3

### 2026-02-08 Task 2 Blockage Resolution

**Decision**: Mark Task 2 as Manual Due to Subagent Reliability

**Rationale:**
- Subagent session: `ses_3c4bbc3ebffeRBLtyHu3qxH3e7`
- Attempts: 3 consecutive failures
- Issue: Subagent claimed "done" but file had JSON syntax errors
- LSP errors: Multiple syntax issues (lines 20, 22, 37) - Chinese comments not properly formatted
- Root cause: Missing `//` prefix for JSONC comments in Chinese text sections

**Workaround:**
- Mark Task 2 as "needs manual fix" in problems.md
- File partially modified (oracle/ultrabrain/momus updated correctly)
- Remaining issue: JSONC comment format (lines 19-24, 28-36)
- Decision: Skip Task 2, proceed to Task 3 using Task 1's successful pattern

**Trade-off:**
- ✅ Can proceed with execution (Task 3 independent of Task 2)
- ✅ Task 1 provides successful optimization pattern for reference
- ⚠️ Task 2 requires manual review to fix Chinese comment format
- ⚠️ Reduced cost savings for Strategy-1 (partial optimization only)

**Rationale:**
- Task 0 blocked by unreliable subagent and missing verification methods
- 3/4 target models not in knownModels list
- Must use only known, verified models to proceed

**Adjusted Models:**
- **Task 1 (Strategy-2)**:
  - Remove: Grok Code Fast 1 (unknown), Raptor mini (unknown)
  - Use: `openai/gpt-5-mini` (known, exists in knownModels line 157)
  - Fallback: Existing low-cost models from Strategy-3

- **Task 2 (Strategy-1)**:
  - Use: `openai/gpt-5-mini` (known)
  - Replace: Some GPT-5.2-Codex calls with GPT-5-mini for cost savings

- **Task 3 (Strategy-6)**:
  - Remove: GPT-5.1-Codex-Max (unknown)
  - Use: `openai/gpt-5-mini` + `openai/gpt-5.2-codex` (both known)
  - Agent-specific optimization still achievable

**Trade-off:**
- ✅ Can proceed with execution (no more blocking)
- ✅ Using verified models from knownModels
- ⚠️ Reduced cost savings (no free Grok/Raptor models)
- ⚠️ Task 0 requires manual user verification for new models

### To Be Updated As Decisions Made

---

