# 策略规划文档 - 深度分析与优化方案

生成时间：2026-02-04
作者：AI Planning System

## 📊 资源清单与限制分析

### 一、付费订阅资源

#### 1. GitHub Copilot Pro+ (1500 高级请求/月)
**免费模型（0倍率）：**
- GPT-4.1 (0x)
- GPT-5-mini (0x)
- 其他免费模型

**高级模型成本：**
- Claude Opus 4.5: 3x (最经济的强模型)
- Claude Sonnet 4.5: 1x
- Claude Haiku 4.5: 0.33x
- GPT-5.2: 1x
- GPT-5.1-Codex-Max: 1x
- GPT-5.2-Codex: 1x
- Gemini 3 Pro: 1x
- Gemini 3 Flash: 0.33x

**月度配额计算：**
- 1500 / 3 = 500次 Claude Opus 4.5 调用（高成本，须控制）
- 1500 / 1 = 1500次 中等模型调用（GPT-5.2, Sonnet等）
- 1500 / 0.33 = 4545次 轻量级模型调用

**策略：** 优先用于高难度决策和编排（Sisyphus），对性价比要求高

---

#### 2. Google Pro 年订阅 (5小时/重置)
**能力：**
- Gemini 3 Pro (原生Google)
- Gemini 3 Flash
- Claude 4.5 (通过 Antigravity 插件)

**限制：** 5小时重置，但具体 token 限制需查证

**月度折合：** 假设 5小时约 100-200 个标准请求/重置周期

**策略：** 用于多模态任务、UI/UX设计、Claude思考型任务

---

#### 3. Anthropic Pro 年订阅 (5小时/重置 + 周限制)
**能力：**
- Claude Opus 4.5
- Claude Sonnet 4.5
- Claude Haiku 4.5
- 支持 Extended Thinking

**限制：** 5小时重置，周限制（具体数值需查）

**月度折合：** ~500-1000 个中等复杂度请求

**策略：** 用于思考型任务、深度规划、原始Anthropic通道

---

#### 4. OpenAI Plus 年订阅 (5小时/重置 + 周限制)
**能力：**
- GPT-5.2
- GPT-5.1-Codex-Max
- o1/o3-mini (如果有)

**限制：** 5小时重置，周限制

**月度折合：** ~500-1000 个请求

**策略：** 用于深度逻辑推理、编程架构、高端代码审查

---

#### 5. ZhiPu CodingPlan Max (60倍 Anthropic Pro 用量)
**能力：**
- GLM 4.7
- 访问 Anthropic 模型（代理）
- 大用量、性价比高

**限制：** 5小时重置，但额度是 Anthropic Pro 的 60倍

**月度折合：** 假设 Anthropic Pro 基础额度 100 单位，则 ZhiPu = 6000 单位/月

**成本效益：** ⭐⭐⭐⭐⭐ 最高

**策略：** 主要用于高频快速任务、代码探索、文档查询

---

#### 6. 方舟 CodingPlan Pro (20倍 Anthropic Pro 用量)
**能力：**
- 开源模型支持
- Anthropic 代理通道
- 20倍额度

**限制：** 5小时重置

**月度折合：** 假设基础 100 单位，则 方舟 = 2000 单位/月

**成本效益：** ⭐⭐⭐⭐ 高

**策略：** 用于开源模型（Qwen等）、备用通道、探索性任务

---

### 二、额度资源

#### 7. DeepSeek 300元额度
**模型：** DeepSeek-V3.2, R1等

**成本：** 约 $0.5-2 / 百万tokens（极便宜）

**月度折合：** 300元 / ~$0.5 = 600万tokens

**成本效益：** ⭐⭐⭐⭐⭐ 极高（用完最后)

**策略：** 快速迭代、大量生成、成本无所谓的任务

---

#### 8. 硅基流动 200元额度
**支持模型：** 各种API服务商模型

**成本：** 通常 $0.3-1 / 百万tokens

**月度折合：** 200元 / ~$0.3-1 = 200-600万tokens

**成本效益：** ⭐⭐⭐⭐⭐ 极高

**策略：** 备用通道、成本敏感任务

---

## 🎯 四大策略的优化方案

### Strategy-0: 极致性能型 (Super Performance)
**适用场景：** 关键项目、复杂架构、高效产出

**理念：** 不考虑成本，用最强模型做最重要的事

**核心配置：**

```json
{
  "agents": {
    "sisyphus": {
      "model": "anthropic/claude-opus-4-5",
      "variant": "max",
      "thinking": { "type": "enabled", "budgetTokens": 200000 }
    },
    "prometheus": {
      "model": "google/antigravity-claude-opus-4-5-thinking",
      "thinking": { "type": "enabled", "budgetTokens": 150000 }
    },
    "oracle": {
      "model": "openai/gpt-5.2-codex",
      "reasoningEffort": "xhigh"
    },
    "hephaestus": {
      "model": "openai/gpt-5.2-codex",
      "reasoningEffort": "high"
    },
    "librarian": {
      "model": "zai-coding-plan/glm-4.7"  // 60倍额度，快速查询
    },
    "explore": {
      "model": "anthropic/claude-haiku-4-5",
      "variant": "fast"
    },
    "multimodal-looker": {
      "model": "google/gemini-3-pro",
      "variant": "high"
    }
  },
  "categories": {
    "visual-engineering": {
      "model": "google/gemini-3-pro",
      "variant": "high",
      "temperature": 0.4
    },
    "ultrabrain": {
      "model": "openai/gpt-5.2-codex",
      "variant": "xhigh",
      "reasoningEffort": "xhigh",
      "temperature": 0.2
    },
    "quick": {
      "model": "zai-coding-plan/glm-4.7",
      "temperature": 0.3
    }
  },
  "background_task": {
    "modelConcurrency": {
      "anthropic/claude-opus-4-5": 2,
      "openai/gpt-5.2-codex": 3,
      "zai-coding-plan/glm-4.7": 20
    }
  }
}
```

**成本预期：** 月度 1500-3000 元（GitHub Copilot为主，配合其他订阅）

---

### Strategy-1: 性能优先型 (Performance First)
**适用场景：** 中等重要项目、权衡性能与成本

**理念：** 关键路径用强模型，其他路径用经济模型

**核心配置：**

```json
{
  "agents": {
    "sisyphus": {
      "model": "anthropic/claude-sonnet-4-5",  // 降级为 Sonnet（1倍 vs Opus 3倍）
      "thinking": { "type": "enabled", "budgetTokens": 100000 }
    },
    "prometheus": {
      "model": "openai/gpt-5.2-codex",  // 改为 GPT-5.2
      "reasoningEffort": "high"
    },
    "oracle": {
      "model": "anthropic/claude-opus-4-5"  // 关键决策保持 Opus
    },
    "librarian": {
      "model": "zai-coding-plan/glm-4.7"
    },
    "explore": {
      "model": "anthropic/claude-haiku-4-5"
    },
    "multimodal-looker": {
      "model": "google/gemini-3-flash"  // 轻量级
    }
  },
  "categories": {
    "visual-engineering": {
      "model": "google/gemini-3-pro"
    },
    "ultrabrain": {
      "model": "openai/gpt-5.2-codex",
      "reasoningEffort": "high"
    },
    "quick": {
      "model": "anthropic/claude-haiku-4-5"
    },
    "unspecified-low": {
      "model": "anthropic/claude-sonnet-4-5"
    }
  }
}
```

**成本预期：** 月度 800-1500 元

---

### Strategy-2: 平衡型 (Balanced)
**适用场景：** 常规开发、日常工作

**理念：** 充分利用大额度资源（ZhiPu 60倍、方舟 20倍）

**核心配置：**

```json
{
  "agents": {
    "sisyphus": {
      "model": "zai-coding-plan/glm-4.7",  // 用大额度资源
      "thinking": { "type": "disabled" }
    },
    "prometheus": {
      "model": "anthropic/claude-sonnet-4-5"
    },
    "oracle": {
      "model": "openai/gpt-5.2-codex",
      "reasoningEffort": "medium"
    },
    "librarian": {
      "model": "zai-coding-plan/glm-4.7"  // 主力查询
    },
    "explore": {
      "model": "anthropic/claude-haiku-4-5"
    },
    "multimodal-looker": {
      "model": "google/gemini-3-flash"
    }
  },
  "categories": {
    "visual-engineering": {
      "model": "google/gemini-3-flash"  // 轻量
    },
    "ultrabrain": {
      "model": "anthropic/claude-opus-4-5"  // 难题才用
    },
    "quick": {
      "model": "zai-coding-plan/glm-4.7"  // 大量用
    },
    "unspecified-low": {
      "model": "zai-coding-plan/glm-4.7"
    },
    "unspecified-high": {
      "model": "anthropic/claude-sonnet-4-5"
    }
  }
}
```

**成本预期：** 月度 300-600 元（主要消耗 ZhiPu/方舟 额度）

---

### Strategy-3: 经济型 (Economical)
**适用场景：** 探索、学习、快速迭代

**理念：** 最大化利用免费和额度资源

**核心配置：**

```json
{
  "agents": {
    "sisyphus": {
      "model": "zai-coding-plan/glm-4.7"
    },
    "prometheus": {
      "model": "zai-coding-plan/glm-4.7"
    },
    "oracle": {
      "model": "github-copilot/gpt-5-mini"  // GitHub 免费
    },
    "librarian": {
      "model": "zai-coding-plan/glm-4.7"
    },
    "explore": {
      "model": "github-copilot/gpt-5-mini"
    },
    "multimodal-looker": {
      "model": "google/gemini-3-flash"
    },
    "metis": {
      "model": "deepseek/deepseek-v3-2"  // 用额度
    }
  },
  "categories": {
    "visual-engineering": {
      "model": "google/gemini-3-flash"
    },
    "quick": {
      "model": "github-copilot/gpt-4.1"  // GitHub 免费
    },
    "unspecified-low": {
      "model": "zai-coding-plan/glm-4.7"
    },
    "unspecified-high": {
      "model": "zai-coding-plan/glm-4.7"
    },
    "writing": {
      "model": "deepseek/deepseek-v3-2"
    }
  },
  "background_task": {
    "modelConcurrency": {
      "zai-coding-plan/glm-4.7": 30,  // 充分并发
      "github-copilot/gpt-5-mini": 50,
      "deepseek/deepseek-v3-2": 20
    }
  }
}
```

**成本预期：** 月度 50-150 元（主要消耗额度资源）

---

## 🎪 关键优化建议

### 1. 并发控制策略
- **Strategy-0：** 严格限制（2-3并发）- 高成本模型
- **Strategy-1：** 中等限制（5-10并发）
- **Strategy-2/3：** 激进并发（15-30并发）- 充分利用大额度

### 2. 思考预算分配
- **Opus 4.5 + Thinking：** 200k tokens - 用于架构决策
- **Sonnet 4.5 + Thinking：** 100k tokens - 用于规划
- **Haiku：** 禁用Thinking - 成本太高

### 3. Token 预算优化
- **快速查询：** GLM 4.7（ZhiPu，10k限制）
- **中等任务：** Claude Sonnet（50k）
- **复杂任务：** Claude Opus（200k）

### 4. 提供商优先级链
```
快速路径：GitHub-Copilot (免费) → ZhiPu (60倍) → DeepSeek (便宜)
逻辑路径：OpenAI (GPT-5.2) → Anthropic (Opus) → GLM
创意路径：Google Gemini → Claude → DeepSeek
```

---

## 📈 使用建议

### 何时切换策略？

| 情景               | 建议策略          |
| ------------------ | ----------------- |
| 全力开发关键项目   | Strategy-0        |
| 日常工作、功能开发 | Strategy-1/2      |
| 学习、探索、原型   | Strategy-2/3      |
| 成本压力大         | Strategy-3        |
| 额度用完           | 降级到 Strategy-3 |

### 月度成本预估

| 策略       | 预期成本   | 性能指数 |
| ---------- | ---------- | -------- |
| Strategy-0 | ¥2000+     | ⭐⭐⭐⭐⭐    |
| Strategy-1 | ¥1000-1500 | ⭐⭐⭐⭐     |
| Strategy-2 | ¥300-600   | ⭐⭐⭐      |
| Strategy-3 | ¥50-150    | ⭐⭐       |

---

## ✅ 实现检查清单

- [ ] Strategy-0: 完整的极致性能配置
- [ ] Strategy-1: 性能-成本平衡配置
- [ ] Strategy-2: 大额度充分利用配置
- [ ] Strategy-3: 免费+额度最大化配置
- [ ] 配置并发限制（基于模型成本）
- [ ] 配置提供商链（优先级顺序）
- [ ] 设置思考预算
- [ ] 测试模型降级流程
