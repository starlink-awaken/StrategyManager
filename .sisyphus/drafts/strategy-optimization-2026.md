# Draft: 策略深度优化（基于 GitHub 模型特性）

## 信息收集

### GitHub Copilot 模型特性（官方文档）

#### 1. 通用编程与写作（高频场景）
- **GPT-4.1**: 快速准确代码补全
- **GPT-5 mini**: 可靠默认，深度推理与调试（比 GPT-5 更快）
- **GPT-5.1-Codex**: 高质量复杂工程任务
- **Grok Code Fast 1**: 代码专精，免费试用中
- **Raptor mini**: 专用于快速内联建议
- **Claude Sonnet 4.5**: 通用编程与智能体任务
- **Qwen2.5**: 代码生成、推理、调试

#### 2. 快速简单任务（轻量级、低延迟）
- **Claude Haiku 4.5**: 快速响应与质量平衡
- **Gemini 3 Flash**: 快速可靠的轻量级任务

#### 3. 深度推理与调试（复杂场景）
- **GPT-5**: 复杂推理、代码分析
- **GPT-5.2**: 高级推理与技术决策
- **GPT-5.1**: 步骤推理、多文件理解
- **GPT-5.1-Codex-Max**: 智能体软件开发
- **GPT-5.1-Codex-Mini**: 深度推理（轻量版）
- **GPT-5.2-Codex**: 智能体任务专用
- **Claude Sonnet 4.0**: 编程工作流平衡
- **Claude Opus 4.1/4.5/4.6**: 复杂问题、精密推理
- **Gemini 2.5 Pro**: 复杂代码生成、调试、研究
- **Gemini 3 Pro**: 长上下文、科学分析

#### 4. 视觉输入（图表、截图）
- **GPT-5 mini**: 视觉输入处理
- **GPT-5.2**: 图像理解
- **Claude Opus 4.5**: 详细视觉分析
- **Gemini 3 Flash/Pro**: 多模态能力

#### 5. 智能体开发任务（Agentic）
- **GPT-5.1-Codex-Max**: 多步骤自主任务
- **GPT-5.2-Codex**: 智能体任务
- **Claude Sonnet 4.5**: 智能体任务

---

### 当前策略配置全景

#### 现有策略清单
| 策略               | 成本/月    | 适用场景                | 核心模型组合                                  |
| ------------------ | ---------- | ----------------------- | --------------------------------------------- |
| Strategy-0         | ¥2000-3000 | 关键项目、必须成功      | Opus 4-6 + GPT-5.2-Codex + Gemini 3 Pro       |
| Strategy-1         | ¥1000-1500 | 重要任务、生产环境      | Opus 4-6 + GPT-5.2-Codex + Sonnet 4-5         |
| Strategy-2         | ¥400-700   | 日常工作（默认推荐）    | Copilot Sonnet/Codex + ZhiPu GLM-4.7         |
| Strategy-2-Direct  | ¥400-700   | 日常工作（直连优先）    | Sonnet 4-5 + GPT-4o + ZhiPu GLM-4.7          |
| Strategy-2-Copilot | ¥400-700   | 日常工作（Copilot优先） | Copilot Opus/Sonnet + ZhiPu GLM-4.7          |
| Strategy-3         | ¥50-150    | 学习、探索、成本敏感    | Copilot Free + ZhiPu GLM-4.7                 |
| Strategy-4         | ¥500-800   | 创意写作、新媒体运营    | Sonnet 4-5 + Gemini 3 Pro + DeepSeek V3-2    |
| Strategy-5         | ¥1800-2500 | 深度研究、金融分析      | Opus 4-6 (300k thinking) + GPT-5.2 + Gemini  |

#### 核心配置架构
```
10 个 Agent: sisyphus, prometheus, oracle, hephaestus, librarian, 
             explore, multimodal-looker, metis, momus, atlas
             
8 个 Category: visual-engineering, ultrabrain, artistry, quick,
               unspecified-low, unspecified-high, writing, deep
```

#### 当前模型使用模式
- **Anthropic Claude**: Opus 4-6 (关键决策) → Sonnet 4-5 (平衡) → Haiku 4-5 (快速)
- **OpenAI GPT**: GPT-5.2-Codex (代码专精) → GPT-4o (免费/便宜)
- **Google Gemini**: Gemini 3 Pro (高质量) → Gemini 3 Flash (快速)
- **ZhiPu**: GLM-4.7 (60倍额度，主力经济模型)
- **GitHub Copilot**: 作为访问通道，提供免费/高级模型

---

## 需求已确认 ✅

### 用户决策（2026-02-08）

#### Q1: 优化重点
- ✅ **C. 成本优先** - 降低 Token 消耗和费用
- ✅ **D. 场景适配** - 不同场景使用最优模型
- ✅ **E. 体验优化** - 模型选择更智能，配置更清晰

#### Q2: 主要使用策略
- **Strategy-1**（重要任务，¥1000-1500/月）
- **Strategy-2**（日常默认，¥400-700/月）

#### Q3: 当前问题
- ✅ **D. 模型选择困难** - 不知道用哪个模型
- ✅ **E. 新模型集成不清楚** - Grok/Raptor 等新模型不知道怎么集成

#### Q4: 策略数量调整
- ✅ **A. 保留所有 8 个策略**，只优化内部模型配置
- ✅ **C. 可增加新策略** - 如"智能体专用策略"
- ✅ **听 Prometheus 建议**

---

## 初步优化方向（待确认）

### 机会点识别

1. **模型对齐优化**
   - GitHub 文档推荐 GPT-5 mini 作为深度推理的快速替代（比 GPT-5 更快）
   - 当前策略未使用 GPT-5 mini，可考虑替换部分场景

2. **智能体任务专精**
   - GPT-5.1-Codex-Max、GPT-5.2-Codex 专为智能体设计
   - 当前 Strategy-0/1 的 hephaestus/atlas 可优化

3. **快速任务优化**
   - Raptor mini 专用于快速内联建议
   - Claude Haiku 4.5、Gemini 3 Flash 适合轻量任务
   - 当前 explore agent 使用 Haiku 4-5（正确），但 quick 分类可优化

4. **视觉任务配置**
   - 当前 multimodal-looker 使用 Gemini（正确）
   - 可考虑为视觉场景添加 GPT-5.2 或 Claude Opus 4.5 备选

5. **成本结构优化**
   - ZhiPu GLM-4.7 (60倍额度) 作为主力经济模型
   - GitHub Copilot 免费模型可更充分利用
   - Grok Code Fast 1 免费试用中，可纳入 Strategy-2/3

---

## 优化策略（基于用户需求）

### 核心优化方向
1. **成本优化** - 充分利用免费资源（Grok、Copilot Free），降低付费模型调用
2. **场景适配** - 为 Strategy-1/2 优化模型选择，明确不同场景最优模型
3. **体验优化** - 添加模型选择指南，简化配置理解
4. **新模型集成** - 将 Grok Code Fast 1、Raptor mini、GPT-5 mini 集成到合适位置

### 具体行动（待生成计划）
1. **Strategy-2 优化**（日常默认）
   - 集成 Grok Code Fast 1（免费）替代部分 GPT-4o
   - 使用 Raptor mini 优化快速补全场景
   - 添加 GPT-5 mini 作为深度推理的快速选项

2. **Strategy-1 优化**（重要任务）
   - 使用 GPT-5 mini 替代部分 GPT-5 场景（成本降低，速度提升）
   - 优化智能体任务（atlas/hephaestus）使用 GPT-5.2-Codex

3. **新增策略 6**（智能体专用）
   - 专为多步骤自主任务设计
   - 核心模型：GPT-5.1-Codex-Max + GPT-5.2-Codex + Claude Sonnet 4.5
   - 成本：¥800-1200/月

4. **模型选择指南**
   - 为每个 Agent 添加 "why this model" 说明
   - 创建场景-模型映射表
   - 添加渠道差异对照（Copilot vs 直连 API）

---

## 下一步：生成工作计划

所有需求已清楚，准备进入计划生成阶段。
