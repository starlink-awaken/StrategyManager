# 模型选择指南 2026

**最后更新**: 2026-02-08  
**适用版本**: StrategyManager v3.0+

---

## 目录

1. [场景分类与推荐](#场景分类与推荐)
2. [模型对比矩阵](#模型对比矩阵)
3. [渠道 ID 格式对照](#渠道-id-格式对照)
4. [Fallback 策略](#fallback-策略)
5. [快速参考表](#快速参考表)

---

## 场景分类与推荐

### 1. 日常开发

**特征**: 快速编码、调试、代码重构、问题排查  
**月度调用**: 200-400 次  
**推荐策略**: **Strategy-2 (平衡型)** 或 **Strategy-3 (经济型)**

| 角色/类别 | 推荐模型 | Fallback | 成本/月 |
|-----------|----------|----------|---------|
| Oracle | `openai/gpt-5-mini` | `github-copilot/gpt-4o` | ¥280-490 |
| Visual-engineering | `openai/gpt-5-mini` | `github-copilot/gpt-4o` | (包含在内) |
| Sisyphus | `zhipuai-coding-plan/glm-4.7` | - | 几乎免费 |

**适用场景**:
- 个人项目开发
- 代码审查和重构
- 快速原型开发
- 文档编写

**成本优化建议**:
- 使用 GLM-4.7 处理大规模文本编辑（60倍额度）
- GPT-4o 作为免费兜底，适合快速任务
- GPT-5 mini 处理中等复杂度推理

---

### 2. 重要任务

**特征**: 关键决策、架构设计、核心算法、生产环境  
**月度调用**: 100-200 次  
**推荐策略**: **Strategy-1 (高性能)** 或 **Strategy-6 (智能体专用)**

| 角色/类别 | 推荐模型 | Fallback | 成本/月 |
|-----------|----------|----------|---------|
| Oracle | `openai/gpt-5.2-codex` | `github-copilot/gpt-4o` | ¥1000-1500 |
| Ultrabrain | `github-copilot/claude-opus-4.6` | - | (包含在内) |
| Prometheus | `github-copilot/claude-sonnet-4.5` | - | (包含在内) |

**适用场景**:
- 关键架构决策
- 复杂算法设计
- 生产环境调试
- 安全审计

**质量保证**:
- GPT-5.2-Codex: 代码专精，推理能力最强
- Claude Opus: 深度分析，长上下文理解
- Claude Sonnet: 平衡性能和质量

---

### 3. 智能体协作

**特征**: 多 agent 同时工作、自动化流水线、代码生成、规划执行  
**月度调用**: 300-600 次  
**推荐策略**: **Strategy-6 (智能体专用)**

| 角色/类别 | 推荐模型 | Fallback | 成本/月 |
|-----------|----------|----------|---------|
| Sisyphus | `zhipuai-coding-plan/glm-4.7` | - | ¥800-1200 |
| Prometheus | `openai/gpt-5-mini` | `github-copilot/gpt-4o` | (包含在内) |
| Oracle | `openai/gpt-5.2-codex` | `github-copilot/gpt-4o` | (包含在内) |
| Hephaestus | `openai/gpt-5-mini` | `github-copilot/gpt-4o` | (包含在内) |
| 其他 agents | `zhipuai-coding-plan/glm-4.7` | - | (包含在内) |

**适用场景**:
- 多 agent 协作开发
- 自动化测试流水线
- 代码生成和重构
- 规划-执行闭环

**优化建议**:
- 编排器使用 GLM-4.7（大额度支持高并发）
- 关键决策使用 GPT-5.2-Codex（质量保证）
- 规划器使用 GPT-5 mini（性价比高）
- 探索和查询使用 GLM-4.7（快速响应）

---

### 4. 创意写作

**特征**: 博客、文案、小说、营销材料、社交媒体内容  
**月度调用**: 100-200 次  
**推荐策略**: **Strategy-4 (创意型)** 或 **Strategy-2 (平衡型)**

| 角色/类别 | 推荐模型 | Fallback | 成本/月 |
|-----------|----------|----------|---------|
| Writing | `github-copilot/claude-sonnet-4.5` | - | ¥500-800 |
| Artistry | `github-copilot/claude-sonnet-4.5` | - | (包含在内) |
| Prometheus | `github-copilot/claude-sonnet-4.5` | - | (包含在内) |

**适用场景**:
- 技术博客和文章
- 营销文案和广告
- 新媒体运营
- 创意故事和小说
- 子女教育内容

**模型特点**:
- Claude Sonnet: 文笔优秀，创意丰富，适合长文本
- 温度设置 0.6-0.7（创意平衡）
- 支持 Extended Thinking（深度创作）

---

### 5. 深度研究

**特征**: 文献综述、技术调研、竞品分析、金融分析、健康管理  
**月度调用**: 50-100 次  
**推荐策略**: **Strategy-5 (研究型)** 或 **Strategy-1 (高性能)**

| 角色/类别 | 推荐模型 | Fallback | 成本/月 |
|-----------|----------|----------|---------|
| Deep | `github-copilot/claude-opus-4.6` | - | ¥1800-2500 |
| Ultrabrain | `github-copilot/claude-opus-4.6` | - | (包含在内) |
| Oracle | `openai/gpt-5.2-codex` | - | (包含在内) |

**适用场景**:
- 文献综述和学术研究
- 复杂技术调研
- 金融投资分析
- 健康和医疗决策
- 重要决策支持

**质量保证**:
- Claude Opus: 最强推理能力，长上下文（200K）
- Extended Thinking: 120K tokens 预算
- 温度 0.2（精确分析）
- 专业领域 System Prompt

---

### 6. 成本敏感

**特征**: 学习探索、快速实验、个人项目  
**月度调用**: 500+ 次  
**推荐策略**: **Strategy-3 (经济型)**

| 角色/类别 | 推荐模型 | Fallback | 成本/月 |
|-----------|----------|----------|---------|
| Sisyphus | `github-copilot/gpt-4o` | - | ¥50-150 |
| Prometheus | `github-copilot/gpt-4o` | - | (包含在内) |
| Oracle | `zhipuai-coding-plan/glm-4.7` | - | (包含在内) |
| Librarian | `github-copilot/gpt-5-mini` | - | (包含在内) |

**适用场景**:
- 学习和探索
- 快速实验
- 个人项目
- 原型开发

**成本优化**:
- 80% 使用 GitHub Copilot 免费模型
- 15% 使用 ZhiPu 大额度模型
- 5% 使用顶级模型（仅关键场景）

---

## 模型对比矩阵

### OpenAI 系列

| 模型 | 性能 | 成本 | 延迟 | 适用场景 | 备注 |
|------|------|------|------|----------|------|
| **GPT-5.2-Codex** | ⭐⭐⭐⭐⭐ | ¥0.01/1K (in) + ¥0.03/1K (out) | 中等 | 关键决策、架构设计 | 代码专精，最强推理 |
| **GPT-5 mini** | ⭐⭐⭐⭐ | ¥0.005/1K (in) + ¥0.015/1K (out) | 低 (快 30-40%) | 日常开发、中等任务 | 性价比最高 |
| **GPT-4o** | ⭐⭐⭐ | **免费** | 低 | 快速任务、Fallback | GitHub Copilot 免费 |

#### GPT-5.2-Codex vs GPT-5 mini

```
性能对比:
  GPT-5.2-Codex: 推理能力 100%，代码专精
  GPT-5 mini:    推理能力 ~80%，速度快 30-40%

成本对比:
  GPT-5.2-Codex: 月成本 ¥1000-1500（高频使用）
  GPT-5 mini:    月成本 ¥500-750（同等调用）
  节省:          50%

延迟对比:
  GPT-5.2-Codex: 首字响应 2-3s
  GPT-5 mini:    首字响应 1.5-2s（快 15-25%）

推荐场景:
  GPT-5.2-Codex → 关键架构、复杂算法、生产环境
  GPT-5 mini    → 日常开发、重构、调试、文档
```

#### GPT-5 mini vs GPT-4o

```
性能对比:
  GPT-5 mini: 推理能力 80%，适合中等任务
  GPT-4o:     推理能力 ~60%，适合快速任务

成本对比:
  GPT-5 mini: 月成本 ¥500-750（高频使用）
  GPT-4o:     完全免费（GitHub Copilot）
  节省:       100%

用途对比:
  GPT-5 mini → 主力模型（日常开发）
  GPT-4o     → Fallback 模型（免费兜底）

关键差异:
  ❌ GPT-4o 不适合作为主力模型（推理能力较弱）
  ✅ GPT-4o 适合 Fallback（免费、快速）
  ✅ GPT-5 mini 是主力（性能和成本平衡）
```

---

### Anthropic 系列

| 模型 | 性能 | 成本 | 上下文 | 适用场景 | 备注 |
|------|------|------|--------|----------|------|
| **Claude Opus 4.6** | ⭐⭐⭐⭐⭐ | 高 | 200K | 深度研究、复杂分析 | 最强推理，长上下文 |
| **Claude Sonnet 4.5** | ⭐⭐⭐⭐ | 中 | 200K | 创意写作、规划 | 平衡性能和成本 |
| **Claude Haiku 4.5** | ⭐⭐⭐ | 低 | 200K | 快速任务、探索 | 轻量级、高性价比 |

#### Claude Sonnet vs Haiku

```
性能对比:
  Sonnet: 推理能力 100%，文笔优秀
  Haiku:  推理能力 ~70%，速度快 50%

成本对比:
  Sonnet: 月成本 ¥500-800（创意写作）
  Haiku:  月成本 ¥125-200（同等调用）
  节省:   75%

用途对比:
  Sonnet → 创意写作、深度分析、规划
  Haiku  → 快速探索、轻量级任务

推荐场景:
  Sonnet: 技术博客、营销文案、架构设计
  Haiku:  快速查询、文档搜索、原型探索
```

---

### 其他系列

| 模型 | 性能 | 成本 | 适用场景 | 备注 |
|------|------|------|----------|------|
| **GLM-4.7** | ⭐⭐⭐⭐ | **极低** (¥0.0001/1K) | 高并发、大规模编辑 | ZhiPu 60倍额度 |
| **Gemini 2.5 Flash** | ⭐⭐⭐⭐ | 低 | 多模态、视觉任务 | Google Pro |
| **Gemini 2.5 Pro** | ⭐⭐⭐⭐⭐ | 中 | 复杂推理、多模态 | Google Pro |

---

## 渠道 ID 格式对照

### OpenAI

| 渠道 | Model ID 格式 | 示例 | 功能差异 |
|------|---------------|------|----------|
| **直连 API** | `openai/{model-name}` | `openai/gpt-5-mini`<br>`openai/gpt-5.2-codex` | ✅ 完整功能<br>✅ 最新模型<br>✅ 无限流 |
| **GitHub Copilot** | `github-copilot/{model-name}` | `github-copilot/gpt-5-mini`<br>`github-copilot/gpt-4o` (免费) | ⚠️ 可能限流<br>⚠️ 集成化<br>✅ 部分免费 |

**注意事项**:
- **GPT-4o** 仅在 GitHub Copilot 中免费
- **GPT-5.2-Codex** 直连 API 功能完整，Copilot 可能有额外限制
- **限流**: Copilot 在高峰期可能限制 QPS

---

### Anthropic

| 渠道 | Model ID 格式 | 示例 | 功能差异 |
|------|---------------|------|----------|
| **直连 API** | `anthropic/{model-name}` | `anthropic/claude-sonnet-4-5`<br>`anthropic/claude-opus-4-6` | ✅ 完整功能<br>✅ 最新模型<br>✅ Extended Thinking |
| **GitHub Copilot** | `github-copilot/{model-name}` | `github-copilot/claude-sonnet-4.5`<br>`github-copilot/claude-opus-4.6` | ⚠️ 可能缺少最新版本<br>⚠️ Extended Thinking 支持有限 |

**注意事项**:
- **版本号差异**: 直连 API 使用日期格式（如 `-20250110`），Copilot 使用简化版本号
- **Extended Thinking**: Copilot 支持，但预算可能有限制
- **最新模型**: Copilot 可能不支持最新发布的模型

---

### Google Gemini

| 渠道 | Model ID 格式 | 示例 | 功能差异 |
|------|---------------|------|----------|
| **直连 API** | `google/{model-name}` | `google/gemini-2.5-flash`<br>`google/gemini-2.5-pro` | ✅ 完整功能<br>✅ 多模态支持<br>✅ 无限流 |
| **GitHub Copilot** | ❌ **不支持** | - | ❌ Copilot 未集成 Gemini 2.5 |

**注意事项**:
- **Gemini 2.5** 系列 **不在 GitHub Copilot 中提供**
- 必须使用 **Google AI Studio** 或 **Vertex AI** 直连
- 多模态功能（图像、视频）仅直连 API 支持

---

### ZhiPu GLM

| 渠道 | Model ID 格式 | 示例 | 功能差异 |
|------|---------------|------|----------|
| **直连 API** | `zhipuai-coding-plan/{model-name}` | `zhipuai-coding-plan/glm-4.7` | ✅ 60倍额度<br>✅ 高并发<br>✅ 极低成本 |
| **GitHub Copilot** | ❌ **不支持** | - | ❌ Copilot 未集成 ZhiPu |

**注意事项**:
- **GLM-4.7** 是 ZhiPu AI CodingPlan 专属模型
- 享受 **60倍额度**，适合高并发场景
- 成本极低（¥0.0001/1K tokens）

---

## Fallback 策略

### 一级 Fallback: 免费模型（推荐）

```jsonc
{
  "oracle": {
    "model": "openai/gpt-5-mini",
    "fallback": "github-copilot/gpt-4o",
    "fallbackReason": "成本优化 - GPT-4o 免费兜底"
  }
}
```

**适用场景**:
- 日常开发（Strategy-2）
- 智能体协作（Strategy-6）
- 预算有限

**优势**:
- ✅ GPT-4o 完全免费
- ✅ 快速响应（低延迟）
- ✅ 无额度限制

**局限**:
- ⚠️ 推理能力较弱（适合简单任务）
- ⚠️ 不适合复杂算法

---

### 二级 Fallback: 高额度模型

```jsonc
{
  "oracle": {
    "model": "openai/gpt-5.2-codex",
    "fallback": "zhipuai-coding-plan/glm-4.7",
    "fallbackReason": "高额度兜底 - GLM-4.7 60倍额度"
  }
}
```

**适用场景**:
- 重要任务（Strategy-1）
- 深度研究（Strategy-5）
- 预算充足

**优势**:
- ✅ GLM-4.7 额度大（60倍）
- ✅ 成本极低
- ✅ 高并发支持

**局限**:
- ⚠️ 推理能力略低于 GPT-5.2-Codex

---

### 三级 Fallback: 策略降级

当单个模型 Fallback 不够用时，可以降级到成本更低的策略：

```
Strategy-1 (高性能, ¥1000-1500/月)
    ↓ 预算不足
Strategy-2 (平衡, ¥280-490/月)
    ↓ 预算不足
Strategy-3 (经济, ¥50-150/月)
```

**触发条件**:
- 月度预算超支
- 配额耗尽
- 成本告警

**实施方式**:
```bash
# 手动切换
bun run Tools/ManageStrategies.ts switch strategy-2-balanced

# 自动降级（未来功能）
# 基于成本监控自动切换策略
```

---

### Fallback 最佳实践

#### 1. 双层 Fallback（推荐）

```jsonc
{
  "oracle": {
    "model": "openai/gpt-5-mini",           // 主模型
    "fallback": "github-copilot/gpt-4o"    // 一级 Fallback（免费）
    // 未来支持: "secondaryFallback": "zhipuai-coding-plan/glm-4.7"
  }
}
```

#### 2. 场景化 Fallback

```jsonc
// 日常开发 - 免费 Fallback
"visual-engineering": {
  "model": "openai/gpt-5-mini",
  "fallback": "github-copilot/gpt-4o"
}

// 关键任务 - 高额度 Fallback
"ultrabrain": {
  "model": "openai/gpt-5.2-codex",
  "fallback": "zhipuai-coding-plan/glm-4.7"
}
```

#### 3. 成本监控触发策略降级

```bash
# 查看月度成本
bun run Tools/ManageStrategies.ts cost-report

# 如果成本超支，手动降级
bun run Tools/ManageStrategies.ts switch strategy-3-economical
```

---

## 快速参考表

### 场景 → 策略 → 模型

| 场景 | 推荐策略 | 主模型 | Fallback | 成本/月 |
|------|----------|--------|----------|---------|
| **日常开发** | Strategy-2 | GPT-5 mini | GPT-4o (免费) | ¥280-490 |
| **重要任务** | Strategy-1 | GPT-5.2-Codex | GPT-4o (免费) | ¥1000-1500 |
| **智能体协作** | Strategy-6 | GPT-5.2-Codex + GPT-5 mini | GPT-4o (免费) | ¥800-1200 |
| **创意写作** | Strategy-4 | Claude Sonnet | - | ¥500-800 |
| **深度研究** | Strategy-5 | Claude Opus | - | ¥1800-2500 |
| **成本敏感** | Strategy-3 | GPT-4o (免费) | GLM-4.7 (额度) | ¥50-150 |

---

### 模型 → 适用场景

| 模型 | 性能评分 | 成本评分 | 适用场景 | 不适用场景 |
|------|----------|----------|----------|------------|
| **GPT-5.2-Codex** | ⭐⭐⭐⭐⭐ | ⭐⭐ | 关键决策、架构设计、复杂算法 | 日常任务（过度浪费） |
| **GPT-5 mini** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 日常开发、重构、调试 | 超复杂推理 |
| **GPT-4o** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ (免费) | Fallback、快速任务 | 主力模型（推理弱） |
| **Claude Opus** | ⭐⭐⭐⭐⭐ | ⭐⭐ | 深度分析、长上下文 | 快速迭代 |
| **Claude Sonnet** | ⭐⭐⭐⭐ | ⭐⭐⭐ | 创意写作、规划 | 超高并发 |
| **Claude Haiku** | ⭐⭐⭐ | ⭐⭐⭐⭐ | 快速探索、轻量级 | 复杂推理 |
| **GLM-4.7** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 高并发、大规模编辑 | 英文内容（中文优化） |
| **Gemini 2.5 Pro** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 多模态、复杂推理 | 纯文本任务 |
| **Gemini 2.5 Flash** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 多模态、视觉任务 | 深度推理 |

---

### 渠道差异速查

| 模型系列 | GitHub Copilot | 直连 API |
|----------|----------------|----------|
| **OpenAI** | ✅ 支持（GPT-4o 免费） | ✅ 完整功能 |
| **Anthropic** | ✅ 支持（可能缺少最新版本） | ✅ 完整功能 |
| **Google Gemini** | ❌ **不支持** | ✅ 完整功能 |
| **ZhiPu GLM** | ❌ **不支持** | ✅ 60倍额度 |

---

### 成本优化速查

| 优化方案 | 节省比例 | 适用场景 |
|----------|----------|----------|
| GPT-5.2-Codex → GPT-5 mini | 50% | 日常开发 |
| GPT-5 mini → GPT-4o (Fallback) | 100% (免费) | 成本压力大 |
| Claude Sonnet → Haiku | 75% | 快速探索 |
| 顶级模型 → GLM-4.7 | 95%+ | 高并发场景 |
| Strategy-1 → Strategy-2 | 70-80% | 预算有限 |
| Strategy-2 → Strategy-3 | 80-90% | 极度节省 |

---

## 总结

### 推荐决策树

```
┌─────────────────────────────────────────┐
│       你的任务是什么类型？             │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴──────────┐
        │                    │
   关键决策/架构          日常开发
        │                    │
   Strategy-1            Strategy-2
   GPT-5.2-Codex         GPT-5 mini
   ¥1000-1500/月         ¥280-490/月
        │                    │
   需要更多智能体？       预算紧张？
        │                    │
        Yes                  Yes
        │                    │
   Strategy-6            Strategy-3
   GPT-5.2-Codex         GPT-4o (免费)
   + GLM-4.7             + GLM-4.7
   ¥800-1200/月          ¥50-150/月
```

### 关键建议

1. **日常开发**: Strategy-2 + GPT-5 mini（性价比最高）
2. **关键任务**: Strategy-1 + GPT-5.2-Codex（质量优先）
3. **智能体协作**: Strategy-6 + 混合模型（并发优化）
4. **成本敏感**: Strategy-3 + 免费模型（极致节省）
5. **创意写作**: Strategy-4 + Claude Sonnet（文笔优秀）
6. **深度研究**: Strategy-5 + Claude Opus（推理最强）

### 常见错误

❌ **错误 1**: 日常任务使用 GPT-5.2-Codex（浪费成本）  
✅ **正确**: 日常任务使用 GPT-5 mini + GPT-4o Fallback

❌ **错误 2**: 关键决策使用 GPT-4o（推理能力不足）  
✅ **正确**: 关键决策使用 GPT-5.2-Codex 或 Claude Opus

❌ **错误 3**: 忽略 Fallback 配置（成本失控）  
✅ **正确**: 所有主模型配置免费 Fallback

❌ **错误 4**: 使用 GitHub Copilot 访问 Gemini 2.5（不支持）  
✅ **正确**: Gemini 系列必须直连 Google API

---

**版本历史**:
- v1.0.0 (2026-02-08): 初始版本
- 基于 cost-simulation-2026.json 和现有策略配置

**相关文档**:
- [策略配置模板](../templates/)
- [成本优化报告](../reports/cost-simulation-2026.json)
- [使用指南](./guides/overview.md)
