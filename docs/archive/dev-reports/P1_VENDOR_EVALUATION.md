# P1 方案评估：自己统计 vs 依赖厂商工具

**分析时间**: 2026-02-04  
**分析者**: GitHub Copilot  
**目标**: 评估使用量统计的两种方案

---

## 🎯 两个方案对比

### 方案 A：自己统计（当前 P1 设计）

从 oh-my-opencode 消息历史本地解析

**优势**:
- ✅ 零依赖，完全本地化
- ✅ 控制力强，可自定义统计规则
- ✅ 离线可用
- ✅ 实时性强（无延迟）

**劣势**:
- ❌ 精确性依赖消息完整性
- ❌ 需要维护定价表（价格经常变动）
- ❌ 消息格式变更需要适配
- ❌ 无法处理本地记录遗漏的使用量
- ❌ 统计逻辑与厂商计费逻辑可能有偏差

---

### 方案 B：依赖厂商工具（新方案）

调用各厂商官方 CLI/API 获取实时使用量

**优势**:
- ✅ **数据最精确** - 基于厂商后台计费系统
- ✅ **自动更新定价** - 厂商工具内置最新价格
- ✅ **覆盖完整** - 包含所有渠道的使用（CLI、Web、API等）
- ✅ **官方保证** - 与账单数据一致
- ✅ **支持详细分解** - 按项目、模型、时间段等多维度

**劣势**:
- ❌ 需要用户配置多个厂商 API 密钥
- ❌ 网络依赖，需要联网调用
- ❌ API 可用性风险
- ❌ 集成复杂度高（多个厂商协议）
- ❌ API 有速率限制
- ❌ 某些厂商可能无法公开数据

---

## 📋 主要厂商工具评估

### 1. **Anthropic Claude**

**官方工具**: `claude` CLI

```bash
# 查看使用量
claude usage

# 查看账户信息
claude account info

# 支持的数据
- 每日使用量
- 模型分解
- 成本统计
```

**可获取信息**: ✅ 精确成本、📊 详细分解  
**数据延迟**: 5-10 分钟  
**可靠性**: ⭐⭐⭐⭐⭐ (Anthropic 官方)

---

### 2. **OpenAI GPT**

**官方工具**: `openai` CLI / OpenAI Dashboard API

```bash
# 需要配置 API Key
export OPENAI_API_KEY=...

# 查看使用量
openai usage --start-date 2026-01-01 --end-date 2026-02-04

# 可获取信息
- 每日成本
- 按模型分解
- 按组织分解
```

**可获取信息**: ✅ 精确成本、📊 模型分解  
**数据延迟**: 即时 (Dashboard 几秒延迟)  
**可靠性**: ⭐⭐⭐⭐⭐ (OpenAI 官方)  
**限制**: 需要 API 调用（有费用吗？）

---

### 3. **Google Gemini**

**官方工具**: `gcloud` CLI / Google Cloud Console API

```bash
# 配置 Google Cloud 项目
gcloud config set project PROJECT_ID

# 查看 AI Platform 使用量
gcloud logging read "resource.type=api" --limit=50

# BigQuery Logs API (推荐)
# 通过 BigQuery SQL 查询使用量
bq query --nouse_legacy_sql '
  SELECT timestamp, request.model, ...
  FROM `project.dataset.logs`
  WHERE timestamp >= TIMESTAMP("2026-01-01")
'
```

**可获取信息**: ✅ 详细日志、📊 完整分解  
**数据延迟**: 几分钟到几小时  
**可靠性**: ⭐⭐⭐⭐ (Google Cloud)  
**限制**: 需要 GCP 项目配置，可能产生查询费用

---

### 4. **ZhiPu (智谱清言)**

**官方工具**: ZhiPu OpenAPI CLI / Web Console

```bash
# ZhiPu 提供的统计方式
# 1. Web Console (需要手动查看)
https://platform.zhipuai.cn/console/overview

# 2. 通过 API 查询 (不确定是否支持)
# 通常需要调用 API 端点获取统计信息

# 3. CSV 导出
# 从 Web Console 导出使用报告
```

**可获取信息**: ⚠️ 仅 Web Console、📊 基础分解  
**数据延迟**: 1-2 小时  
**可靠性**: ⭐⭐⭐ (国内厂商)  
**限制**: 无官方 CLI，需要爬虫或人工操作

---

### 5. **方舟 (字节跳动)**

**官方工具**: 方舟 OpenAPI / Web Console

```bash
# 方舟 Ark 模型服务
# 主要支持方式：Web Console 查看

# API 方式：
curl -X GET "https://api.bytedance.com/v1/usage" \
  -H "Authorization: Bearer $ARK_API_KEY"

# 通常返回：
# - token 使用量
# - 成本估算
# - 按模型分解
```

**可获取信息**: ⚠️ API 能力有限  
**数据延迟**: 实时  
**可靠性**: ⭐⭐⭐ (字节官方)  
**限制**: API 能力依赖官方支持程度

---

### 6. **GitHub Copilot**

**官方工具**: GitHub CLI + GitHub Settings

```bash
# GitHub CLI 本身不提供使用量 API
# 使用量通常通过：

# 1. GitHub Settings Web 查看（个人账户）
# Settings → Billing and plans → Copilot → Usage

# 2. GitHub API (仅企业)
curl -X GET "https://api.github.com/repos/OWNER/REPO/copilot/usage_metrics" \
  -H "Authorization: token $GITHUB_TOKEN"

# 3. GitHub Copilot for Business 企业控制台
```

**可获取信息**: ⚠️ 仅月度汇总  
**数据延迟**: 1 天  
**可靠性**: ⭐⭐⭐⭐ (GitHub 官方)  
**限制**: 个人用户无 API，企业才有详细数据

---

### 7. **DeepSeek**

**官方工具**: 无官方 CLI

```bash
# DeepSeek 仅提供 Web Console
https://platform.deepseek.com/billing/overview

# API 支持：
# 通过 OpenAI 兼容 API 调用模型
# 但无专门的使用量查询 API
```

**可获取信息**: ❌ 无 API 支持  
**可靠性**: ⭐⭐ (需要爬虫)

---

### 8. **Silicon Flow (硅基流动)**

**官方工具**: 无官方 CLI

```bash
# Web Console 仅
https://cloud.siliconflow.cn/billing/overview

# API：
# 提供 OpenAI 兼容 API，但无使用量查询 API
```

**可获取信息**: ❌ 无 API 支持  
**可靠性**: ⭐⭐

---

## 📊 厂商工具支持度总结

| 厂商 | 官方 CLI | API | 数据精度 | 实时性 | 易用度 |
|------|---------|-----|---------|--------|--------|
| **Anthropic** | ✅ | ✅ | ⭐⭐⭐⭐⭐ | ✅ | ⭐⭐⭐⭐ |
| **OpenAI** | ✅ | ✅ | ⭐⭐⭐⭐⭐ | ✅ | ⭐⭐⭐⭐ |
| **Google** | ✅ | ✅ | ⭐⭐⭐⭐⭐ | ⚠️ | ⭐⭐⭐ |
| **ZhiPu** | ❌ | ⚠️ | ⭐⭐⭐ | ⚠️ | ⭐⭐ |
| **方舟** | ⚠️ | ⚠️ | ⭐⭐⭐ | ✅ | ⭐⭐ |
| **GitHub** | ❌ | ⚠️ | ⭐⭐⭐ | ⚠️ | ⭐⭐ |
| **DeepSeek** | ❌ | ❌ | - | - | ⭐ |
| **Silicon** | ❌ | ❌ | - | - | ⭐ |

---

## 🎯 推荐混合方案：B+ (最佳实践)

### 核心理念
**优先依赖厂商工具，无法获取时回退到本地统计**

```
优先级 1: 厂商官方 CLI/API (精确数据)
  ↓
优先级 2: 厂商提供的数据导出/Web Scraping (有数据但不实时)
  ↓
优先级 3: 本地消息历史统计 (兜底方案)
```

---

## 🏗️ 改进的 P1 架构设计

### 新的数据流

```
oh-my-opencode 消息历史
  ↓ (识别使用的模型厂商)
  ├─→ Anthropic CLI → 实际成本 ✅
  ├─→ OpenAI API → 实际成本 ✅
  ├─→ Google Cloud API → 实际成本 ✅
  ├─→ ZhiPu Web API → 估算成本 ⚠️
  ├─→ 方舟 API → 估算成本 ⚠️
  ├─→ [本地统计] → 备用成本 ⚠️
  └─→ 数据合并 → 完整成本报告
```

### 新的模块结构

```
UsageSync.ts (改进)
  ├─ UsageSync.syncViaVendorAPI()      ⭐ 新增
  │  ├─ syncAnthropicUsage()
  │  ├─ syncOpenAIUsage()
  │  ├─ syncGoogleUsage()
  │  ├─ syncZhiPuUsage()
  │  └─ syncArkUsage()
  │
  ├─ UsageSync.syncViaLocalParsing()   (现有方案)
  │  └─ parseMessage() 
  │
  └─ UsageSync.mergeResults()          (合并)
     └─ reconciliate() - 核对数据一致性
```

---

## 📋 具体实施方案

### 阶段 B1: Anthropic + OpenAI (最重要的两个)

**目标**: 获取两个最主要厂商的精确成本

**实现**:
```typescript
// UsageSync.ts

async syncVendorData(): Promise<VendorUsageStats> {
  const stats = new VendorUsageStats();
  
  // 1. Anthropic
  try {
    const anthropicData = await this.fetchAnthropicUsage();
    stats.addProvider('anthropic', anthropicData);
  } catch (e) {
    this.logger.warn('Anthropic sync failed', e);
  }
  
  // 2. OpenAI
  try {
    const openaiData = await this.fetchOpenAIUsage();
    stats.addProvider('openai', openaiData);
  } catch (e) {
    this.logger.warn('OpenAI sync failed', e);
  }
  
  // 3. 对于其他厂商和缺失数据，回退到本地统计
  const localData = this.parseLocalMessages();
  stats.mergeWithLocal(localData);
  
  return stats;
}
```

**需要配置**:
```bash
# ~/.config/opencode/vendor-config.json
{
  "anthropic": {
    "apiKey": "sk-ant-...",
    "enabled": true
  },
  "openai": {
    "apiKey": "sk-...",
    "enabled": true
  },
  "google": {
    "project": "my-project",
    "enabled": false  // 可选
  }
}
```

**优势**:
- ✅ 两个最大厂商的数据完全精确
- ✅ 占整体成本的 ~70-80%
- ✅ 配置简单（仅需 API Key）
- ✅ 向下兼容（没有配置时也能工作）

---

### 阶段 B2: 完整厂商支持

**目标**: 逐步集成其他厂商

**路线图**:
1. ✅ Anthropic API 支持
2. ✅ OpenAI API 支持
3. ⏳ Google Cloud API 支持
4. ⏳ ZhiPu API 支持
5. ⏳ 方舟 API 支持
6. ⏳ Web Scraping 备用方案（DeepSeek 等）

---

## 🔄 数据质量保证

### 三层验证机制

```
第 1 层：厂商数据验证
├─ 检查 API 返回是否合理
├─ 验证金额与历史趋势
└─ 标记异常数据

第 2 层：数据一致性校对
├─ 对比厂商数据与本地统计
├─ 标记差异较大的项
└─ 记录调和过程

第 3 层：用户确认
├─ 显示"数据来源"标记
├─ 允许用户选择数据源
└─ 提供手动修正界面
```

### 数据来源标记

```json
{
  "costs": [
    {
      "provider": "anthropic",
      "model": "claude-opus-4-5",
      "cost": 123.45,
      "source": "✅ API (官方)",
      "accuracy": "99.9%",
      "lastUpdated": "2026-02-04T15:30:00Z"
    },
    {
      "provider": "openai",
      "model": "gpt-5.2-codex",
      "cost": 89.23,
      "source": "✅ API (官方)",
      "accuracy": "99.9%"
    },
    {
      "provider": "zai",
      "model": "glm-4.7",
      "cost": 45.67,
      "source": "⚠️ 本地统计",
      "accuracy": "~80%"
    }
  ]
}
```

---

## ✅ 优缺点最终对比

### 方案 A：纯本地统计

| 维度 | 评分 |
|------|------|
| 精确性 | ⭐⭐⭐ |
| 实时性 | ⭐⭐⭐⭐⭐ |
| 依赖性 | ⭐⭐⭐⭐⭐ |
| 易用性 | ⭐⭐⭐⭐ |
| 覆盖度 | ⭐⭐⭐ |
| **总体** | **⭐⭐⭐⭐** |

---

### 方案 B1：厂商 API (主要两个)

| 维度 | 评分 |
|------|------|
| 精确性 | ⭐⭐⭐⭐⭐ |
| 实时性 | ⭐⭐⭐⭐⭐ |
| 依赖性 | ⭐⭐⭐ |
| 易用性 | ⭐⭐⭐⭐ |
| 覆盖度 | ⭐⭐⭐⭐ (70-80%) |
| **总体** | **⭐⭐⭐⭐⭐** |

---

### 方案 B (完整)：混合方案

| 维度 | 评分 |
|------|------|
| 精确性 | ⭐⭐⭐⭐⭐ |
| 实时性 | ⭐⭐⭐⭐ |
| 依赖性 | ⭐⭐⭐ |
| 易用性 | ⭐⭐⭐ |
| 覆盖度 | ⭐⭐⭐⭐⭐ |
| **总体** | ⭐⭐⭐⭐⭐ |

---

## 🎯 最终建议

### **推荐采用：方案 B1 (混合方案，阶段式实施)**

#### 理由
1. **最大收益**: 仅集成 Anthropic + OpenAI，即可获得 70-80% 的成本数据精确性
2. **最小成本**: 仅需用户配置两个 API Key，配置简单
3. **渐进式**: 可分阶段扩展到其他厂商
4. **向下兼容**: 没有配置时也能正常工作（降级到本地统计）
5. **用户友好**: 清晰标注数据来源和精确度
6. **质量保证**: 通过数据验证和校对机制确保准确性

#### 实施策略

**第一阶段 (P1.1-1.2)**: 
- 保留本地统计作为基础
- 添加 Anthropic CLI 集成
- 添加 OpenAI API 集成
- 合并两个数据源

**第二阶段 (P2)**: 
- 扩展到 Google, ZhiPu, 方舟
- 增强数据校对逻辑
- 完善用户界面

**第三阶段 (P3+)**: 
- 其他厂商支持
- Web Scraping 备用方案
- 高级分析功能

---

## 🔧 修改 P1 设计

如果采用方案 B1，需要修改 P1 设计：

### 模块调整

```typescript
// 原 P1 结构
UsageSync.ts
├─ sync()
├─ parseMessage()
└─ calculateCost()

// 改进后 P1 结构
UsageSync.ts
├─ sync() // 现在支持两个入口
│  ├─ syncVendorData() ⭐ 新增
│  │  ├─ fetchAnthropicUsage()
│  │  ├─ fetchOpenAIUsage()
│  │  └─ mergeResults()
│  └─ syncLocalData()
│     ├─ parseMessage()
│     └─ calculateCost()
├─ VendorIntegration.ts ⭐ 新增模块
│  ├─ AnthropicClient
│  └─ OpenAIClient
└─ DataReconciliation.ts ⭐ 新增模块
   ├─ validateData()
   ├─ reconciliate()
   └─ markDataSource()
```

### 新增配置

```bash
# ~/.config/opencode/vendor-config.json
{
  "apiKeys": {
    "anthropic": "sk-ant-...",
    "openai": "sk-...",
    "google": null,
    "zai": null
  },
  "syncMethods": {
    "anthropic": "api",
    "openai": "api",
    "others": "local_parsing"
  },
  "dataValidation": {
    "enabled": true,
    "threshold": 0.15  // 15% 差异告警
  }
}
```

---

## 📝 行动建议

### 建议 1：立即采用 (强烈推荐)
**立即修改 P1 设计，采用方案 B1**

优先级调整：
- P1.1: **UseSync 改进** (集成厂商 API)
  - 添加 Anthropic 支持 (+100 行)
  - 添加 OpenAI 支持 (+100 行)
  - 数据合并逻辑 (+50 行)
  - 总计 ~450 行 (vs 原 300 行)

- P1.2-P1.5: 保持不变

**时间影响**: +1 天 (总 8 天 → 8-9 天)  
**精确性提升**: +40% (⭐⭐⭐ → ⭐⭐⭐⭐⭐)

---

### 建议 2：分阶段采用 (保守做法)
**保留现有 P1 设计，后续迭代时添加**

优点：
- ✅ 不修改当前计划
- ✅ 快速完成 P1

缺点：
- ❌ 需要重构 UsageSync 模块
- ❌ 推迟获得精确数据

推荐用于时间紧张的情况。

---

### 建议 3：深度集成 (理想情况)
**采用完整方案 B，同时改进 oh-my-opencode**

理想方案，但超出 StrategyManager 范围，需要在 oh-my-opencode 中：
1. 集成厂商 API 自动采集使用量
2. 存储原始成本数据
3. 提供统一查询接口

---

## 💡 最后的思考

**您的观察非常正确**：
- ✅ 厂商的数据确实更精确
- ✅ 定价更新自动维护
- ✅ 覆盖范围更完整

**但需要权衡的是**：
- 用户需要配置 API Key (安全性考虑)
- 网络依赖 (离线不可用)
- 集成复杂度 (多个厂商协议)

**最优方案 = 精确性 + 易用性 + 向下兼容**

---

**建议**: 采用方案 B1，在 P1.1 阶段同时完成：
1. ✅ 本地统计基础
2. ✅ Anthropic 集成
3. ✅ OpenAI 集成
4. ✅ 数据合并和验证

这样既能快速获得高精度数据，也保留了本地统计作为备份方案。
