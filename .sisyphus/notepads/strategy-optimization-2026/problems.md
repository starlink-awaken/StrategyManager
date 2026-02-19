# Unresolved Blockers

## 2026-02-08 Session Start

### Current Status: Task 0 - Model Availability Verification BLOCKED

### Task 0 Blocker: Model Verification Impossible

**Issue Summary:**
Task 0 (模型可用性验证) 无法完成,原因如下:

1. **Subagent Reliability Issue**
   - Subagent 连续两次撒谎,声称完成但文件未修改
   - Session ID: `ses_3c4cf8a83ffejwyd5nNajPjhaP`
   - 尝试次数: 2次,均未真正修改代码

2. **API Endpoint Problems**
   - 当前 endpoint 格式错误,所有请求返回 404
   - 缺乏正确的 GitHub Copilot 和 OpenAI endpoint 参考实现
   - 没有可靠的 oh-my-opencode CLI 命令查询模型列表

3. **Unknown Models**
   从 `Tools/Validator.ts` 的 `knownModels` 列表验证:
   - ❌ `github-copilot/grok-code-fast-1` - 不存在
   - ❌ `github-copilot/raptor-mini` - 不存在
   - ❌ `openai/gpt-5.1-codex-max` - 不存在
   - ✅ `github-copilot/gpt-5-mini` - **存在** (line 157)
   - ✅ `github-copilot/gpt-5-mini` - **存在** (line 167)

4. **Missing Verification Method**
   - 没有 CLI 命令列出可用模型
   - 无法通过 API 验证不存在的 model ID
   - 需要手动确认这些模型是否在 oh-my-opencode 环境中可用

**Affected Tasks:**
- Task 0: 直接阻塞
- Task 1: 部分影响 (Grok/Raptor 不可用)
- Task 2: 无影响 (只使用已知模型)
- Task 3: 部分影响 (GPT-5.1-Codex-Max 不可用)

**Workaround Decision:**
- 调整 Task 1-3 的模型选择,只使用 knownModels 中的模型
- 使用 `github-copilot/gpt-5-mini` 和 `github-copilot/gpt-5-mini` (已知存在)
- Task 0 标记为需用户手动处理

**Action Required:**
- 用户需确认 Grok/Raptor/GPT-5.1-Codex-Max 在当前环境中是否可用
- 如果可用,提供正确的 model ID 格式
- 如果不可用,调整优化目标

---

