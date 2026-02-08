# StrategyManager 策略升级迁移指南 (2026)

**文档版本**: 1.0.0  
**最后更新**: 2026-02-08  
**适用版本**: StrategyManager 3.0.0+

---

## 📋 目录

1. [概述](#概述)
2. [升级前准备](#升级前准备)
3. [升级流程](#升级流程)
4. [回滚策略](#回滚策略)
5. [风险管理](#风险管理)
6. [验证和监控](#验证和监控)
7. [快速参考](#快速参考)
8. [故障排查](#故障排查)
9. [常见问题](#常见问题)

---

## 概述

### 适用场景

本迁移指南适用于以下场景：

- 从旧版策略（Strategy-0/1/2/3/4/5）升级到 2026 优化策略（Strategy-1/2/6）
- 切换不同成本级别的策略（如从 Strategy-1 降级到 Strategy-3）
- 从 GitHub Copilot 渠道迁移到直连 API 渠道
- 策略配置格式升级（如新增 metadata 字段）

### 新策略概览

| 策略 | 月成本 | 核心优化 | 适用场景 |
|------|--------|----------|----------|
| **Strategy-1 (Performance)** | ¥1000-1500 | GPT-5.2-Codex + GPT-4o Fallback | 重要任务、生产环境 |
| **Strategy-2 (Balanced)** | ¥280-490 | GPT-5 mini + GPT-4o Fallback | 日常开发（推荐） |
| **Strategy-6 (Agent-Focused)** | ¥800-1200 | 智能体混合（GPT-5.2-Codex + GLM-4.7） | 多 Agent 协作、架构决策 |

### 关键变更

#### 1. 模型替换

- **Oracle Agent**: `github-copilot/gpt-5.2-codex` → `openai/gpt-5-mini`
- **Visual-Engineering Category**: `github-copilot/gpt-5.2-codex` → `openai/gpt-5-mini`

#### 2. Fallback 机制增强

- **一级 Fallback**: `github-copilot/gpt-4o` (免费)
- **二级 Fallback**: `zhipuai-coding-plan/glm-4.7` (60倍额度)
- **三级 Fallback**: 策略降级（手动触发）

#### 3. 成本优化

- **Strategy-2**: 从 ¥400-700 降至 ¥280-490（30% 节省）
- **Strategy-6**: 新增智能体专用策略（¥800-1200）

---

## 升级前准备

### Phase 0: 环境检查

#### 1. 验证系统环境

```bash
# 检查 StrategyManager 版本
cd /path/to/StrategyManager
git log --oneline -1

# 检查 Bun 版本
bun --version  # 需要 1.0+

# 检查 Node.js 版本（可选）
node --version  # 建议 18.0+
```

#### 2. 检查当前策略

```bash
# 列出所有可用策略
bun run Tools/ManageStrategies.ts list

# 查看当前策略详情
bun run Tools/ManageStrategies.ts list --json
```

**预期输出示例**:

```
当前策略: strategy-2-balanced (v1.0.0)
成本级别: medium
月度成本: ¥400-700
状态: ✅ 正常
```

#### 3. 备份现有配置

```bash
# 手动备份策略配置
cp ~/.config/opencode/oh-my-opencode.json \
   ~/.config/opencode/backups/oh-my-opencode.json.$(date +%Y%m%d-%H%M%S)

# 备份策略历史
cp ~/.config/opencode/strategy-history.json \
   ~/.config/opencode/backups/strategy-history.json.$(date +%Y%m%d-%H%M%S)

# 验证备份
ls -lh ~/.config/opencode/backups/
```

#### 4. 验证 API 密钥

```bash
# 检查必需的环境变量
echo "OpenAI API: ${OPENAI_API_KEY:0:10}..."
echo "Anthropic API: ${ANTHROPIC_API_KEY:0:10}..."
echo "ZhiPu API: ${ZHIPUAI_API_KEY:0:10}..."

# 如果使用 GitHub Copilot
echo "GitHub Token: ${GITHUB_TOKEN:0:10}..."
```

**注意事项**:

- 如果 API 密钥缺失，请参考 [Configuration Guide](./guides/CONFIGURATION.md)
- 新策略需要 OpenAI 和 ZhiPu API 密钥
- GitHub Copilot 渠道需要 GitHub Token

#### 5. 检查策略模板

```bash
# 验证新策略模板存在
ls -lh templates/strategy-{1,2,6}*.jsonc

# 安装/更新策略模板
bash scripts/install.sh
```

---

### Phase 1: 策略验证

#### 1. 验证目标策略

```bash
# 验证新策略文件格式
bun run Tools/ManageStrategies.ts validate strategy-1-performance
bun run Tools/ManageStrategies.ts validate strategy-2-balanced
bun run Tools/ManageStrategies.ts validate strategy-6-agent-focused

# 严格验证（推荐）
bun run Tools/ManageStrategies.ts validate strategy-2-balanced --strict
```

**成功标准**:

- ✅ Schema 验证通过
- ✅ 所有必需字段存在
- ✅ Model ID 格式正确
- ⚠️ 警告（可选）: 推荐字段缺失

#### 2. 比较新旧策略

```bash
# 对比当前策略与目标策略
bun run Tools/ManageStrategies.ts compare strategy-2-balanced strategy-2-balanced-direct

# 仅显示关键差异
bun run Tools/ManageStrategies.ts compare strategy-2-balanced strategy-6-agent-focused --keys-only
```

**预期输出**:

```
策略对比: strategy-2-balanced vs strategy-6-agent-focused

差异摘要:
  + agents.sisyphus.model: zhipuai-coding-plan/glm-4.7
  ~ agents.oracle.model: openai/gpt-5-mini → openai/gpt-5.2-codex
  - agents.prometheus.fallback: github-copilot/gpt-4o

成本差异:
  旧策略: ¥400-700/月
  新策略: ¥800-1200/月
  变化: +¥400-500/月 (57% 增加)
```

#### 3. 获取推荐

```bash
# 基于场景获取策略推荐
bun run Tools/ManageStrategies.ts recommend "日常开发"

# 基于预算获取推荐
bun run Tools/ManageStrategies.ts recommend "关键项目" --budget 1000
```

---

## 升级流程

### Phase 2: 执行升级

#### 方案 A: 直接切换（推荐）

适用于：策略验证通过、对新策略有信心

```bash
# Step 1: 切换到新策略（自动备份）
bun run Tools/ManageStrategies.ts switch strategy-2-balanced

# Step 2: 验证切换成功
bun run Tools/ManageStrategies.ts list

# Step 3: 检查软链接
ls -lh ~/.config/opencode/oh-my-opencode.json
```

**预期输出**:

```
✅ 策略切换成功
  旧策略: strategy-2-balanced (v1.0.0)
  新策略: strategy-2-balanced (v1.1.0)
  备份路径: ~/.config/opencode/oh-my-opencode.json.backup.20260208143000
  历史记录: 已更新
```

#### 方案 B: 渐进式升级（保守）

适用于：生产环境、对新策略不确定

```bash
# Step 1: 导出当前策略
bun run Tools/ManageStrategies.ts export my-current-strategy ./backup/

# Step 2: 创建测试环境（项目模式）
mkdir -p .config
cp templates/strategy-2-balanced.jsonc .config/oh-my-opencode.json

# Step 3: 测试新策略
export STRATEGIES_DIR=$(pwd)/.config
bun run Tools/ManageStrategies.ts list

# Step 4: 验证成功后，切换用户配置
unset STRATEGIES_DIR
bun run Tools/ManageStrategies.ts switch strategy-2-balanced
```

#### 方案 C: 分阶段迁移（企业级）

适用于：多人团队、高可用场景

```bash
# Phase 2.1: 部分 Agent 升级
# 手动编辑 oh-my-opencode.json，仅更新 Prometheus 和 Hephaestus
# 保留 Oracle 和 Sisyphus 使用旧模型

# Phase 2.2: 监控 24 小时
# 观察成本、延迟、质量

# Phase 2.3: 全量升级
bun run Tools/ManageStrategies.ts switch strategy-2-balanced
```

---

### Phase 3: 验证升级

#### 1. 配置验证

```bash
# 验证软链接指向正确
readlink ~/.config/opencode/oh-my-opencode.json

# 验证策略内容
cat ~/.config/opencode/oh-my-opencode.json | head -20

# 验证 JSON 格式
bun run Tools/ManageStrategies.ts validate ~/.config/opencode/oh-my-opencode.json
```

#### 2. 功能测试

```bash
# 运行单元测试
cd /path/to/StrategyManager
bun test

# 运行集成测试
bun test tests/integration/
```

#### 3. LSP 诊断

```bash
# 检查配置文件语法
bun run Tools/ManageStrategies.ts validate --strict
```

---

## 回滚策略

### 快速回滚（紧急）

#### 场景 1: 切换后立即发现问题

```bash
# 使用历史记录快速回滚（最快）
bun run Tools/ManageStrategies.ts rollback

# 或指定时间点回滚
bun run Tools/ManageStrategies.ts history
bun run Tools/ManageStrategies.ts rollback 2026-02-08T14:30:00Z
```

**预期效果**:

- ✅ 立即恢复到上一个策略
- ✅ 保留当前策略备份
- ✅ 更新历史记录

#### 场景 2: 使用备份文件恢复

```bash
# 列出所有备份
ls -lht ~/.config/opencode/backups/

# 恢复指定备份
cp ~/.config/opencode/backups/oh-my-opencode.json.20260208143000 \
   ~/.config/opencode/oh-my-opencode.json

# 验证恢复
bun run Tools/ManageStrategies.ts list
```

#### 场景 3: Git 版本回滚

```bash
# 如果策略文件在 Git 仓库中
cd ~/.config/opencode
git log oh-my-opencode.json

# 回滚到指定提交
git checkout <commit-hash> oh-my-opencode.json

# 验证
bun run Tools/ManageStrategies.ts validate
```

---

### 策略降级

#### 场景 4: 成本超支，降级到经济模式

```bash
# 紧急降级到 Strategy-3（成本敏感）
bun run Tools/ManageStrategies.ts switch strategy-3-economical

# 或使用推荐引擎
bun run Tools/ManageStrategies.ts recommend "成本敏感" --max-cost 150
```

**月成本对比**:

| 策略 | 月成本 | 降级节省 |
|------|--------|----------|
| Strategy-1 | ¥1000-1500 | - |
| Strategy-2 | ¥280-490 | 60-70% |
| Strategy-3 | ¥50-150 | 85-90% |

#### 场景 5: 临时替代模型

如果某个 AI 服务不可用，手动修改配置：

```bash
# 编辑配置文件
vim ~/.config/opencode/oh-my-opencode.json

# 修改示例：将 OpenAI 模型替换为 Claude
# "model": "openai/gpt-5-mini" → "model": "anthropic/claude-sonnet-4-5"

# 验证修改
bun run Tools/ManageStrategies.ts validate
```

---

### 完整配置恢复

#### 场景 6: 灾难恢复（配置文件损坏）

```bash
# Step 1: 从模板重新安装
bash scripts/install.sh

# Step 2: 恢复历史记录
cp ~/.config/opencode/backups/strategy-history.json.20260208 \
   ~/.config/opencode/strategy-history.json

# Step 3: 切换到默认策略
bun run Tools/ManageStrategies.ts switch strategy-2-balanced

# Step 4: 验证
bun run Tools/ManageStrategies.ts list
bun test
```

---

## 风险管理

### 识别的风险

#### 1. 技术风险

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| **API 不可用** | 🔴 高 | 低 | 配置多层 Fallback |
| **模型响应质量下降** | 🟡 中 | 中 | 渐进式迁移，监控输出质量 |
| **配置格式错误** | 🔴 高 | 低 | 使用严格验证 `--strict` |
| **软链接失败** | 🟡 中 | 低 | 检查文件系统权限 |
| **历史记录丢失** | 🟢 低 | 低 | 定期备份历史文件 |

#### 2. 成本风险

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| **成本激增** | 🔴 高 | 中 | 监控成本报告，设置预算上限 |
| **Fallback 模型成本高** | 🟡 中 | 中 | 使用免费模型（GPT-4o）作为一级 Fallback |
| **配额耗尽** | 🟡 中 | 中 | 使用高额度模型（GLM-4.7）作为二级 Fallback |
| **多平台成本叠加** | 🟡 中 | 低 | 统一使用直连 API，避免多渠道 |

#### 3. 用户体验风险

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| **响应延迟增加** | 🟡 中 | 低 | 选择低延迟模型（GPT-5 mini） |
| **模型行为变化** | 🟡 中 | 中 | 测试关键场景，调整 Temperature |
| **Agent 协作失败** | 🔴 高 | 低 | 使用 Strategy-6 智能体专用策略 |
| **兼容性问题** | 🟢 低 | 低 | 遵循 oh-my-opencode Schema |

---

### 缓解措施

#### 措施 1: 渐进式升级

```bash
# 分阶段升级计划
# Week 1: 升级非关键 Agent（Librarian, Explore）
# Week 2: 升级中等优先级 Agent（Hephaestus, Prometheus）
# Week 3: 升级关键 Agent（Oracle, Sisyphus）
```

#### 措施 2: 监控和告警

```bash
# 每日成本监控
bun run Tools/ManageStrategies.ts cost-report

# 使用数据同步
bun run Tools/ManageStrategies.ts sync-usage

# 设置成本上限（未来功能）
# bun run Tools/ManageStrategies.ts set-budget 500
```

#### 措施 3: 保留回滚窗口

- **时间窗口**: 升级后 48 小时内保留旧配置
- **备份策略**: 自动保留最近 5 个备份（`MAX_BACKUPS=5`）
- **快速回滚**: 使用 `rollback` 命令立即恢复

#### 措施 4: 质量验证

```bash
# 升级后运行完整测试套件
bun test

# 手动验证关键场景
# 1. 代码生成质量
# 2. 架构决策准确性
# 3. 多 Agent 协作流畅性
```

---

### 应急响应流程

#### 级别 1: 低优先级问题（如响应延迟）

1. **记录问题**: 在 GitHub Issues 报告
2. **继续使用**: 暂时接受性能下降
3. **计划优化**: 调整 Temperature 或切换模型

#### 级别 2: 中优先级问题（如成本超支）

1. **立即降级**: 切换到 Strategy-3
2. **分析原因**: 查看成本报告
3. **优化配置**: 调整 Fallback 或模型选择

```bash
# 紧急降级
bun run Tools/ManageStrategies.ts switch strategy-3-economical

# 分析成本
bun run Tools/ManageStrategies.ts cost-report --start 2026-02-01 --end 2026-02-08
```

#### 级别 3: 高优先级问题（如 API 不可用）

1. **快速回滚**: 使用 `rollback` 命令
2. **切换渠道**: 从直连 API 切换到 GitHub Copilot
3. **联系支持**: 报告 API 服务商

```bash
# 快速回滚
bun run Tools/ManageStrategies.ts rollback

# 切换到 Copilot 渠道
bun run Tools/ManageStrategies.ts switch strategy-2-balanced-copilot
```

#### 级别 4: 灾难性问题（如配置损坏）

1. **停止服务**: 暂停 AI 服务使用
2. **灾难恢复**: 从备份恢复配置
3. **完整验证**: 运行所有测试

```bash
# 灾难恢复
bash scripts/install.sh
bun run Tools/ManageStrategies.ts switch strategy-2-balanced
bun test
```

---

## 验证和监控

### 升级后验证清单

#### ✅ 配置验证

- [ ] 软链接指向正确策略文件
- [ ] 策略文件格式正确（`validate` 通过）
- [ ] 所有必需字段存在
- [ ] Model ID 格式正确
- [ ] Fallback 配置正确

#### ✅ 功能验证

- [ ] 单元测试通过（`bun test`）
- [ ] LSP 诊断无错误
- [ ] 策略切换成功
- [ ] 历史记录更新

#### ✅ 性能验证

- [ ] 响应延迟在可接受范围内（< 5s）
- [ ] 模型输出质量满足要求
- [ ] Agent 协作流畅

#### ✅ 成本验证

- [ ] 成本报告生成成功
- [ ] 月度成本在预算范围内
- [ ] Fallback 机制未频繁触发

---

### 监控指标

#### 1. 成本监控

```bash
# 每日成本报告
bun run Tools/ManageStrategies.ts cost-report

# 按时间范围查询
bun run Tools/ManageStrategies.ts cost-report --start 2026-02-01 --end 2026-02-08

# 包含 Copilot 分析
bun run Tools/ManageStrategies.ts cost-report --copilot --format json
```

**关键指标**:

- **日均成本**: 目标 < ¥20/天（Strategy-2）
- **月度成本**: 目标 ¥280-490（Strategy-2）
- **Fallback 触发率**: 目标 < 5%

#### 2. 使用监控

```bash
# 同步使用数据
bun run Tools/ManageStrategies.ts sync-usage

# 查看使用报告
bun run Tools/ManageStrategies.ts usage-report

# 特定提供商
bun run Tools/ManageStrategies.ts sync-usage --providers anthropic,openai
```

**关键指标**:

- **总请求数**: 监控异常增长
- **Token 使用量**: 监控单次调用 Token 数
- **错误率**: 目标 < 1%

#### 3. 质量监控

**手动验证场景**:

1. **代码生成**: 生成一个简单函数，检查语法和逻辑
2. **架构决策**: 询问系统设计问题，检查推理质量
3. **多 Agent 协作**: 触发 Agent 协作任务，检查流畅性

**自动化测试**:

```bash
# 运行回归测试
bun test tests/integration/

# 运行性能测试
bun test tests/performance/
```

---

## 快速参考

### 常用命令速查表

| 命令 | 用途 | 示例 |
|------|------|------|
| `list` | 列出所有策略 | `bun run Tools/ManageStrategies.ts list` |
| `switch` | 切换策略 | `bun run Tools/ManageStrategies.ts switch strategy-2-balanced` |
| `validate` | 验证策略 | `bun run Tools/ManageStrategies.ts validate strategy-2-balanced --strict` |
| `compare` | 比较策略 | `bun run Tools/ManageStrategies.ts compare strategy-1 strategy-2` |
| `history` | 查看历史 | `bun run Tools/ManageStrategies.ts history` |
| `rollback` | 回滚策略 | `bun run Tools/ManageStrategies.ts rollback` |
| `cost-report` | 成本报告 | `bun run Tools/ManageStrategies.ts cost-report` |
| `sync-usage` | 同步使用 | `bun run Tools/ManageStrategies.ts sync-usage` |
| `recommend` | 获取推荐 | `bun run Tools/ManageStrategies.ts recommend "日常开发"` |
| `export` | 导出策略 | `bun run Tools/ManageStrategies.ts export my-strategy ./output/` |
| `import` | 导入策略 | `bun run Tools/ManageStrategies.ts import ./strategy.jsonc` |

---

### 文件路径速查表

| 文件类型 | 路径 | 用途 |
|----------|------|------|
| **策略配置** | `~/.config/opencode/oh-my-opencode.json` | 当前使用的策略（软链接） |
| **策略模板** | `/path/to/StrategyManager/templates/*.jsonc` | 策略模板（只读） |
| **策略文件** | `~/.config/opencode/strategies/*.jsonc` | 已安装的策略 |
| **历史记录** | `~/.config/opencode/strategy-history.json` | 策略切换历史 |
| **备份文件** | `~/.config/opencode/backups/*.backup.*` | 自动备份（最近 5 个） |
| **日志文件** | `~/.config/opencode/logs/*.log` | 操作日志（如果启用） |

---

### 策略选择速查表

| 场景 | 推荐策略 | 月成本 | 核心特性 |
|------|----------|--------|----------|
| **日常开发** | Strategy-2 | ¥280-490 | GPT-5 mini + GPT-4o Fallback |
| **关键项目** | Strategy-1 | ¥1000-1500 | GPT-5.2-Codex + 高质量输出 |
| **多 Agent 协作** | Strategy-6 | ¥800-1200 | GPT-5.2-Codex + GLM-4.7 混合 |
| **创意写作** | Strategy-4 | ¥500-800 | Claude Sonnet + 优秀文笔 |
| **深度研究** | Strategy-5 | ¥1800-2500 | Claude Opus + 最强推理 |
| **成本敏感** | Strategy-3 | ¥50-150 | GPT-4o + GLM-4.7（免费/额度） |

---

### Model ID 格式速查表

#### OpenAI

| 模型 | 直连 API | GitHub Copilot |
|------|----------|----------------|
| GPT-5 mini | `openai/gpt-5-mini` | 不支持 |
| GPT-5.2-Codex | `openai/gpt-5.2-codex` | 不支持 |
| GPT-4o | `openai/gpt-4o` | `github-copilot/gpt-4o` (免费) |

#### Anthropic

| 模型 | 直连 API | GitHub Copilot |
|------|----------|----------------|
| Claude Sonnet 4.5 | `anthropic/claude-sonnet-4-5` | `github-copilot/claude-sonnet-4.5` |
| Claude Opus 4.5 | `anthropic/claude-opus-4-5` | 不支持 |
| Claude Haiku 4 | `anthropic/claude-haiku-4` | 不支持 |

#### 其他

| 模型 | 直连 API | GitHub Copilot |
|------|----------|----------------|
| Gemini 2.5 Flash | `google/gemini-2.5-flash` | 不支持 |
| GLM-4.7 | `zhipuai-coding-plan/glm-4.7` | 不支持 |

---

## 故障排查

### 常见问题和解决方案

#### 问题 1: 策略切换后无法启动

**症状**:

```
Error: Failed to load strategy: oh-my-opencode.json
```

**原因**: 软链接损坏或指向不存在的文件

**解决方案**:

```bash
# 检查软链接
ls -lh ~/.config/opencode/oh-my-opencode.json

# 删除损坏的软链接
rm ~/.config/opencode/oh-my-opencode.json

# 重新切换策略
bun run Tools/ManageStrategies.ts switch strategy-2-balanced
```

---

#### 问题 2: 验证失败（Model ID 不存在）

**症状**:

```
❌ 验证失败: Model 'openai/gpt-5-mini' is not in the allowed models list
```

**原因**: Model ID 不在 `Validator.ts` 的允许列表中

**解决方案**:

```bash
# 检查允许的模型列表
grep "ALLOWED_MODELS" Tools/Validator.ts

# 更新策略，使用允许的模型
vim ~/.config/opencode/oh-my-opencode.json

# 重新验证
bun run Tools/ManageStrategies.ts validate --strict
```

---

#### 问题 3: 成本激增

**症状**:

```
⚠️ 月度成本超出预算: ¥1200 (预算: ¥500)
```

**原因**: Fallback 模型频繁触发或高频调用

**解决方案**:

```bash
# 查看成本报告
bun run Tools/ManageStrategies.ts cost-report --start 2026-02-01

# 降级到经济模式
bun run Tools/ManageStrategies.ts switch strategy-3-economical

# 分析使用情况
bun run Tools/ManageStrategies.ts sync-usage
```

---

#### 问题 4: API 密钥无效

**症状**:

```
Error: Invalid API key for OpenAI
```

**原因**: 环境变量未设置或密钥过期

**解决方案**:

```bash
# 检查环境变量
echo $OPENAI_API_KEY

# 设置环境变量（临时）
export OPENAI_API_KEY="sk-..."

# 永久设置（添加到 ~/.bashrc 或 ~/.zshrc）
echo 'export OPENAI_API_KEY="sk-..."' >> ~/.bashrc
source ~/.bashrc

# 验证
bun run Tools/ManageStrategies.ts validate
```

---

#### 问题 5: Fallback 模型频繁触发

**症状**: 成本报告显示大量 Fallback 调用

**原因**: 主模型不可用或配额耗尽

**解决方案**:

```bash
# 检查主模型状态
curl https://api.openai.com/v1/models/gpt-5-mini \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# 临时禁用 Fallback（编辑配置）
# "fallback": null

# 或切换到更稳定的策略
bun run Tools/ManageStrategies.ts switch strategy-1-performance
```

---

#### 问题 6: 历史记录丢失

**症状**: `history` 命令无输出

**原因**: `strategy-history.json` 文件损坏或删除

**解决方案**:

```bash
# 从备份恢复
cp ~/.config/opencode/backups/strategy-history.json.20260208 \
   ~/.config/opencode/strategy-history.json

# 如果无备份，重新初始化
echo '[]' > ~/.config/opencode/strategy-history.json

# 验证
bun run Tools/ManageStrategies.ts history
```

---

#### 问题 7: 测试失败

**症状**:

```
❌ 2/49 tests failed
```

**原因**: 策略配置变更导致测试用例失败

**解决方案**:

```bash
# 查看失败的测试
bun test --verbose

# 更新测试快照（如果是快照测试）
bun test --update-snapshots

# 修复测试用例
vim tests/unit/ManageStrategies.test.ts

# 重新运行测试
bun test
```

---

#### 问题 8: Agent 协作失败

**症状**: 多 Agent 任务无法完成

**原因**: Agent 模型配置不兼容

**解决方案**:

```bash
# 切换到智能体专用策略
bun run Tools/ManageStrategies.ts switch strategy-6-agent-focused

# 验证 Agent 配置
bun run Tools/ManageStrategies.ts validate --strict

# 测试 Agent 协作
# 手动触发多 Agent 任务
```

---

## 常见问题

### Q1: 升级后可以立即回滚吗？

**A**: 可以。StrategyManager 在每次切换时自动创建备份，可以使用 `rollback` 命令立即回滚。

```bash
bun run Tools/ManageStrategies.ts rollback
```

---

### Q2: 升级会影响正在进行的任务吗？

**A**: 不会。策略切换只影响新创建的 Agent，已运行的任务不受影响。建议在任务间隙进行升级。

---

### Q3: 新策略需要额外的 API 密钥吗？

**A**: 可能需要。Strategy-2 和 Strategy-6 需要 OpenAI 和 ZhiPu API 密钥。请确保环境变量已设置。

---

### Q4: 如何验证升级是否成功？

**A**: 运行以下命令验证：

```bash
bun run Tools/ManageStrategies.ts list
bun test
bun run Tools/ManageStrategies.ts cost-report
```

---

### Q5: 成本报告准确吗？

**A**: 成本报告基于模型定价和使用数据估算，准确度取决于：

- **API 使用数据**: 如果同步成功，准确度 90%+
- **本地估算**: 如果未同步，准确度 60-70%

建议定期运行 `sync-usage` 命令提高准确度。

---

### Q6: 可以同时使用多个策略吗？

**A**: 不可以。`oh-my-opencode.json` 是全局唯一配置。但可以使用 **项目模式** 为不同项目配置不同策略：

```bash
# 项目 A
cd /path/to/project-a
mkdir -p .config
cp templates/strategy-1-performance.jsonc .config/oh-my-opencode.json

# 项目 B
cd /path/to/project-b
mkdir -p .config
cp templates/strategy-3-economical.jsonc .config/oh-my-opencode.json
```

---

### Q7: Fallback 机制如何工作？

**A**: 当主模型不可用时，自动切换到 Fallback 模型：

1. **一级 Fallback**: `github-copilot/gpt-4o` (免费)
2. **二级 Fallback**: `zhipuai-coding-plan/glm-4.7` (60倍额度)
3. **三级 Fallback**: 策略降级（手动触发）

---

### Q8: 如何优化成本？

**A**: 成本优化策略：

1. **选择合适策略**: 日常开发使用 Strategy-2
2. **配置 Fallback**: 使用免费模型（GPT-4o）
3. **监控使用**: 定期查看成本报告
4. **调整 Temperature**: 降低 Temperature 减少 Token 使用

---

### Q9: 升级后性能下降怎么办？

**A**: 尝试以下方法：

1. **调整 Temperature**: 提高 Temperature 增加多样性
2. **切换模型**: 使用更强的模型（如 GPT-5.2-Codex）
3. **启用 Thinking**: 为复杂任务启用 Thinking 模式
4. **联系支持**: 报告性能问题

---

### Q10: 如何获取帮助？

**A**: 获取帮助的途径：

- **文档**: 查看 [docs/](../docs/) 目录的完整文档
- **GitHub Issues**: [报告问题](https://github.com/starlink-awaken/StrategyManager/issues)
- **社区**: 加入讨论（如果有）
- **邮件**: 联系维护者（见 README.md）

---

## 附录

### A. 策略配置示例

#### Strategy-2-Balanced (推荐)

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/master/assets/oh-my-opencode.schema.json",
  "description": "平衡策略: 性价比最高的日常开发配置",
  "metadata": {
    "version": "1.1.0",
    "updated": "2026-02-08",
    "cost_level": "medium",
    "monthly_cost": "¥280-490"
  },
  "agents": {
    "prometheus": {
      "model": "openai/gpt-5-mini",
      "fallback": "github-copilot/gpt-4o",
      "temperature": 0.2
    },
    "oracle": {
      "model": "openai/gpt-5-mini",
      "fallback": "github-copilot/gpt-4o",
      "temperature": 0.3
    }
  },
  "categories": {
    "visual-engineering": {
      "model": "openai/gpt-5-mini",
      "fallback": "github-copilot/gpt-4o"
    }
  }
}
```

---

### B. 环境变量清单

```bash
# OpenAI
export OPENAI_API_KEY="sk-..."

# Anthropic
export ANTHROPIC_API_KEY="sk-ant-..."

# ZhiPu AI
export ZHIPUAI_API_KEY="..."

# GitHub Copilot（可选）
export GITHUB_TOKEN="ghp_..."

# Google Gemini（可选）
export GOOGLE_API_KEY="..."

# StrategyManager 配置（可选）
export STRATEGIES_DIR="$HOME/.config/opencode/strategies"
export CONFIG_DIR="$HOME/.config/opencode"
```

---

### C. 测试清单

#### 升级前测试

- [ ] 当前策略验证通过
- [ ] 所有单元测试通过
- [ ] 备份已创建
- [ ] API 密钥已验证

#### 升级后测试

- [ ] 新策略验证通过
- [ ] 软链接指向正确
- [ ] 历史记录更新
- [ ] 所有单元测试通过
- [ ] 功能测试通过
- [ ] 成本在预算内

#### 回滚测试

- [ ] 回滚命令执行成功
- [ ] 配置恢复到旧版本
- [ ] 功能正常

---

### D. 联系方式

- **项目主页**: https://github.com/starlink-awaken/StrategyManager
- **问题反馈**: https://github.com/starlink-awaken/StrategyManager/issues
- **文档**: [docs/](../docs/)
- **维护者**: starlink-awaken

---

**文档更新日志**:

- **2026-02-08**: 初始版本，包含完整升级和回滚流程
