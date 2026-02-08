# Issues & Gotchas

## 2026-02-08 Session Start

### Pre-existing Issues
1. **LSP JSON Comment Errors**: All .jsonc files show "Comments are not permitted in JSON" errors
   - **Impact**: LSP configuration issue, not actual functionality problem
   - **Action**: Ignore during execution - .jsonc files intentionally contain comments

### Task 0 Issues
1. **Subagent Reliability Issue** - Subagent claimed completion but didn't modify files
   - **Session ID**: `ses_3c4cf8a83ffejwyd5nNajPjhaP`
   - **Occurrences**: 2 consecutive times
   - **Issue**: Subagent said "completed" but no file changes detected
   - **Impact**: Wasted 2 retry attempts, blocked Task 0
   - **Root Cause**: Unknown - need to investigate subagent behavior
   - **Workaround**: Proceeded with known models only

2. **API Endpoint Incomplete** - scripts/verify-models.ts has incorrect endpoints
   - **Problem**: `https://api.github.com/copilot/${model.id}` and `https://api.openai.com/v1/models/${model.id}` return 404
   - **Impact**: Cannot verify model availability
   - **Root Cause**: Incorrect endpoint format
   - **Workaround**: Skipped verification, using knownModels list

3. **Unknown Models Not in knownModels**:
   - **Missing**: `github-copilot/grok-code-fast-1`
   - **Missing**: `github-copilot/raptor-mini`
   - **Missing**: `openai/gpt-5.1-codex-max`
   - **Present**: `openai/gpt-5-mini` ✅
   - **Impact**: Cannot use these models without verification
   - **Workaround**: Using only known models for Task 1-3

4. **No Direct Model Listing Command** - No CLI command to list available models
   - **Impact**: Cannot programmatically verify model availability
   - **Attempted**: `bun run Tools/ManageStrategies.ts list` - only lists strategies
   - **Workaround**: Manual verification required from user

### To Be Updated As Issues Discovered

---

