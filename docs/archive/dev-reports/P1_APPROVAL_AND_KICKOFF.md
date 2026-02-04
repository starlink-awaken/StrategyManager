# P1 方案批准与启动

**批准时间**: 2026-02-04  
**批准方案**: 方案 C (完整多厂商支持)  
**状态**: ✅ 已批准，正式启动

---

## 📋 批准摘要

### 方案 C: 完整多厂商使用量统计系统

**核心指标**:
- ✅ **精确度**: 94.7% (加权平均)
- ✅ **厂商覆盖**: 7/7 (100%)
- ✅ **实施时间**: 8 天
- ✅ **维护成本**: 低（5/7 使用官方 API）

**厂商清单**:
1. ✅ Anthropic (CLI, 99%)
2. ✅ OpenAI (API, 99%)
3. ✅ ZhiPu GLM (插件, 95%)
4. ✅ GitHub Copilot (Billing API, 99%)
5. ✅ Google Gemini (Quota API, 90%) ⭐ Antigravity 验证
6. ⚠️ DeepSeek (本地统计, 75%)
7. ⚠️ Silicon Flow (本地统计, 75%)

---

## 🎯 批准理由

1. **唯一完整覆盖**: 7/7 订阅服务，无遗漏
2. **高精确度**: 94.7%，5 个官方 API + 2 个本地估算
3. **生产验证**: Gemini Quota API 已被 Antigravity (21k⭐) 验证
4. **数据透明**: 清晰标注来源和精确度
5. **时间合理**: 8 天，比 B2 仅多 2 天
6. **用户体验**: 一次查询，全部订阅

---

## 📅 实施计划 (8天)

### 第 1-2 天: 核心厂商基础
- **P1.1.1**: Anthropic CLI + OpenAI API (2天)
  - Anthropic CLI 集成
  - OpenAI Usage API 集成
  - 数据格式标准化
  - 单元测试

### 第 3 天: ZhiPu 插件
- **P1.1.2**: ZhiPu 插件集成 (1天)
  - glm-plan-usage 插件调用
  - 数据解析和验证
  - 错误处理

### 第 4 天上午: GitHub Billing
- **P1.1.3**: GitHub Billing API (0.5天)
  - Fine-grained PAT 配置
  - Billing API 调用
  - 数据解析

### 第 4 天下午 + 第 5 天: Gemini Quota
- **P1.2.1**: Google Gemini Quota API (1天)
  - OAuth Token 管理
  - fetchAvailableModels API
  - 配额百分比解析
  - 参考 Antigravity 实现

### 第 6 天: DeepSeek/Silicon Flow
- **P1.2.2**: 本地统计 (1天)
  - 本地数据解析
  - 模型识别
  - Token 估算

### 第 7 天: 数据处理层
- **P1.3**: 数据处理层 (1天)
  - UsageSync 协调器
  - CostCalculator 引擎
  - Validator 验证器
  - SourceTagger 标记器

### 第 8 天上午: 报告生成
- **P1.4**: CostReport (0.5天)
  - 报告生成器
  - 数据聚合
  - 导出功能

### 第 8 天下午: CLI + 文档
- **P1.5**: CLI + 文档 (0.5天)
  - CLI 命令扩展
  - Workflow 更新
  - 用户文档
  - 集成测试

---

## 🛠️ 技术架构

```
┌─────────────────────────────────────────────────────────┐
│  P1 多厂商使用量统计系统                                    │
└─────────────────────────────────────────────────────────┘

数据源层 (7 个独立订阅)
├─ ✅ Anthropic CLI         (官方，99%)
├─ ✅ OpenAI API            (官方，99%)
├─ ✅ ZhiPu 插件            (官方，95%)
├─ ✅ GitHub Billing API    (官方，99%)
├─ ✅ Gemini Quota API      (官方，90%)
├─ ⚠️ DeepSeek 本地统计     (估算，75%)
└─ ⚠️ Silicon 本地统计      (估算，75%)

数据处理层
├─ UsageSync (数据同步)
├─ CostCalculator (成本计算)
├─ Validator (数据验证)
└─ SourceTagger (来源标记)

展示层
├─ CostReport (日/周/月报告)
├─ Recommender (策略推荐)
└─ CLI (命令行界面)
```

---

## 📊 加权精确度计算

```
Anthropic: 30% × 99% = 29.7%
OpenAI:    20% × 99% = 19.8%
ZhiPu:     15% × 95% = 14.25%
GitHub:    10% × 99% = 9.9%
Gemini:    15% × 90% = 13.5%  ✅ Quota API (Antigravity 验证)
DeepSeek:  5%  × 75% = 3.75%
Silicon:   5%  × 75% = 3.75%
───────────────────────────
总计:      100%        94.7%
```

---

## 🔑 必需的认证信息

```bash
# 1. Anthropic
export ANTHROPIC_API_KEY="sk-ant-..."

# 2. OpenAI
export OPENAI_API_KEY="sk-..."

# 3. ZhiPu GLM
# (通过 glm-plan-usage 插件，无需额外配置)

# 4. GitHub
export GITHUB_PAT="github_pat_..."  # 需要 plan:read 权限

# 5. Google Gemini (OAuth 用户)
# OAuth Token 通过 Google 登录获取
# 需要实现 Token 刷新机制

# 6. DeepSeek (本地统计，无需 API Key)

# 7. Silicon Flow (本地统计，无需 API Key)
```

---

## 🎓 参考资料

### 核心参考项目
- **Antigravity-Manager**: https://github.com/lbjlaq/Antigravity-Manager
  - 21k stars
  - Gemini Quota API 实现: `src-tauri/src/modules/quota.rs`
  - API 文档: `API反代流量消耗机制分析.md`

### API 文档
- Anthropic CLI: https://docs.anthropic.com/
- OpenAI Usage API: https://platform.openai.com/docs/api-reference/usage
- GitHub Billing API: https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens#user-permissions-for-plan
- Google Quota API: `https://daily-cloudcode-pa.sandbox.googleapis.com/v1internal:fetchAvailableModels`

### 已创建文档
1. P1_DESIGN.md (635行) - 技术规格
2. P1_PLAN.md (298行) - 实施计划
3. P1_VENDOR_EVALUATION.md (630行) - 厂商评估
4. P1_DECISION.md - 方案决策
5. P1_GITHUB_BILLING_API_DISCOVERY.md - GitHub API 发现
6. P1_MULTI_VENDOR_SOLUTION.md - 完整多厂商方案
7. P1_APPROVAL_AND_KICKOFF.md (本文档) - 批准与启动

---

## ✅ 里程碑验收标准

### Phase 1 验收 (Day 3.5)
- ✅ Anthropic CLI 正常工作
- ✅ OpenAI API 正常工作
- ✅ ZhiPu 插件正常工作
- ✅ GitHub Billing API 正常工作
- ✅ 数据格式统一
- ✅ 单元测试覆盖率 > 80%

### Phase 2 验收 (Day 6)
- ✅ Gemini Quota API 正常工作
- ✅ DeepSeek 本地统计正常
- ✅ Silicon Flow 本地统计正常
- ✅ 7/7 厂商数据可查询

### Phase 3 验收 (Day 7)
- ✅ UsageSync 协调器正常
- ✅ CostCalculator 计算准确
- ✅ Validator 验证有效
- ✅ SourceTagger 标记正确

### 最终验收 (Day 8)
- ✅ CostReport 生成正确
- ✅ CLI 命令正常工作
- ✅ 文档完整清晰
- ✅ 集成测试全部通过
- ✅ 加权精确度 >= 94%

---

## 🚀 下一步行动

**立即开始**: P1.1.1 - Anthropic CLI + OpenAI API 集成

**预计完成时间**: 2026-02-12 (8个工作日)

**开发模式**: 增量开发，每日验收，及时调整

---

**批准人**: 用户  
**批准日期**: 2026-02-04  
**文档版本**: v1.0  
**状态**: ✅ 正式启动
