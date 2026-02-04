# 策略库使用指南

**快速参考版本 v2.0**  
**最后更新：** 2026-02-04

---

## 🎯 快速决策流程

```
开始任务
    ↓
问：这是什么类型的任务？
    ↓
├─ 项目开发/AI探索 ────────→ balanced（日常）/ performance（复杂）
├─ 子女教育/健康管理 ───────→ balanced（已优化教育场景）
├─ 公文/日常工具/娱乐 ──────→ economical（免费快速）
├─ 笔记整理/知识管理 ───────→ balanced（高并发）
├─ 深度研究/金融/体系搭建 ──→ research-thinking（深度推理）
└─ 创作/写作/新媒体 ─────────→ creative-content（创意优化）
    ↓
问：预算是否充足？
    ↓
├─ 充足 ──→ 按上述推荐执行
├─ 紧张 ──→ 降级到 economical 或 balanced
└─ 超支 ──→ 仅用 economical
    ↓
执行任务
```

---

## 📊 场景-策略映射表（快速查询）

| 场景                | 主推荐       | 备选        | 为什么                     |
| ------------------- | ------------ | ----------- | -------------------------- |
| **1. 个人项目开发** | balanced     | performance | GPT-5.2-Codex专精 ✅        |
| **2. 子女教育**     | balanced     | creative    | Claude Sonnet + 教育提示 ❤️ |
| **3. 公文处理**     | economical   | balanced    | 免费模型足够 💰             |
| **4. 健康管理**     | balanced     | performance | 专业提示 + Opus验证 🏥      |
| **5. AI项目探索**   | performance  | balanced    | 实验迭代需要质量 🔬         |
| **6. 深度研究报告** | **research** | performance | Opus + 300k thinking 🧠     |
| **7. 金融交易**     | **research** | performance | 多模型验证 + 风险意识 📈    |
| **8. 日常工具**     | economical   | balanced    | 快速免费 ⚡                 |
| **9. 笔记管理**     | balanced     | economical  | GLM高并发整理 📝            |
| **10. 体系搭建**    | **research** | performance | 系统性深度思考 🏗️           |
| **11. 娱乐**        | economical   | balanced    | 轻量有趣 🎮                 |
| **12. 多媒体创作**  | **creative** | balanced    | Sonnet + Gemini 创意 🎨     |
| **13. 写作发布**    | **creative** | balanced    | 高质量文笔 ✍️               |
| **14. 新媒体运营**  | **creative** | balanced    | 创意 + 传播性 📱            |

---

## 🚀 快速切换命令

### 设置别名（推荐）

```bash
# 添加到 ~/.zshrc 或 ~/.bashrc
alias balanced='opencode --config ~/.config/opencode/strategies/strategy-2-balanced.jsonc'
alias research='opencode --config ~/.config/opencode/strategies/strategy-research-thinking.jsonc'
alias creative='opencode --config ~/.config/opencode/strategies/strategy-creative-content.jsonc'
alias perf='opencode --config ~/.config/opencode/strategies/strategy-1-performance.jsonc'
alias eco='opencode --config ~/.config/opencode/strategies/strategy-3-economical.jsonc'
alias super='opencode --config ~/.config/opencode/strategies/strategy-0-super.jsonc'

# 使用策略助手
alias which-strategy='~/.config/opencode/strategies/strategy-helper.sh'
```

### 直接使用

```bash
# 默认（日常）
opencode --config ~/.config/opencode/strategies/strategy-2-balanced.jsonc

# 深度研究
opencode --config ~/.config/opencode/strategies/strategy-research-thinking.jsonc

# 创意写作
opencode --config ~/.config/opencode/strategies/strategy-creative-content.jsonc
```

---

## 💰 成本参考

| 策略                  | 单次成本 | 适用频率  | 月度预算  |
| --------------------- | -------- | --------- | --------- |
| **balanced**          | ¥15-25   | 每天多次  | ¥400-700  |
| **research-thinking** | ¥150-250 | 每周1-2次 | ¥600-1000 |
| **creative-content**  | ¥40-60   | 每周10次  | ¥400-600  |
| **performance**       | ¥50-80   | 按需升级  | ¥100-200  |
| **economical**        | ¥2-5     | 轻量任务  | ¥50-150   |
| **super**             | ¥200+    | 紧急关键  | 仅偶尔用  |

**总月度预算：** ¥500-900（可控范围）

---

## 🎯 使用建议

### 默认工作流

1. **80% 时间：** 使用 `balanced`
   - 已针对13个场景优化
   - 成本可控，质量稳定

2. **10% 时间：** 按需切换专用策略
   - 深度研究 → `research-thinking`
   - 创意写作 → `creative-content`
   - 重要开发 → `performance`

3. **10% 时间：** 成本压力时降级
   - 月末额度紧张 → `economical`
   - 轻量任务 → `economical`

### 场景化使用模式

#### 📅 工作日模式
```bash
# 早上：查看日程和笔记
eco

# 白天：项目开发
balanced

# 晚上：写作或新媒体
creative  # 如果有重要内容
balanced  # 如果是常规更新
```

#### 📅 周末模式
```bash
# 子女教育时间
balanced  # 已有教育场景优化

# 深度研究时间
research  # 如果做重要研究
balanced  # 如果是常规学习

# 娱乐放松
eco
```

#### 📅 冲刺模式（重要项目）
```bash
# 关键阶段
perf  # 或 super（极端情况）

# 一般开发
balanced

# 快速迭代
eco  # 草稿阶段
```

---

## ⚡ 策略特性对比

| 特性         | balanced | research | creative | performance | economical |
| ------------ | -------- | -------- | -------- | ----------- | ---------- |
| **推理能力** | ⭐⭐⭐      | ⭐⭐⭐⭐⭐    | ⭐⭐⭐      | ⭐⭐⭐⭐        | ⭐⭐         |
| **创意性**   | ⭐⭐⭐      | ⭐⭐       | ⭐⭐⭐⭐⭐    | ⭐⭐⭐         | ⭐⭐         |
| **代码能力** | ⭐⭐⭐⭐     | ⭐⭐⭐      | ⭐⭐       | ⭐⭐⭐⭐⭐       | ⭐⭐⭐        |
| **速度**     | ⭐⭐⭐⭐     | ⭐⭐       | ⭐⭐⭐      | ⭐⭐⭐         | ⭐⭐⭐⭐⭐      |
| **成本**     | ⭐⭐⭐      | ⭐        | ⭐⭐       | ⭐⭐          | ⭐⭐⭐⭐⭐      |
| **场景覆盖** | ⭐⭐⭐⭐⭐    | ⭐⭐       | ⭐⭐       | ⭐⭐⭐⭐        | ⭐⭐⭐        |

---

## 🔧 常见问题

### Q1: 不知道该用哪个策略？
**A:** 使用策略助手：
```bash
strategy-helper.sh
```
或者：**默认用 balanced**，80% 场景都适用。

---

### Q2: 成本超支了怎么办？
**A:** 立即切换到 `economical`：
```bash
eco  # 如果设置了别名
```
或检查成本状态：
```bash
cost-monitor.sh  # 查看本月使用情况
```

---

### Q3: balanced 和 performance 有什么区别？
**A:** 
- **balanced**: 日常工作，GLM大额度 + 适度强模型，成本 ¥400-700/月
- **performance**: 重要任务，更多强模型，成本 ¥1000-1500/月

**建议**: 先用 balanced，不够再升级 performance。

---

### Q4: 什么时候用 research-thinking？
**A:** 仅用于：
- 深度研究报告（每周1-2次）
- 金融交易分析（需要多模型验证）
- 个人体系搭建（系统性思考）

**不要用于**：常规学习、简单查询（太贵）

---

### Q5: 创意写作一定要用 creative-content 吗？
**A:** 不一定：
- **重要发布**（公众号、专业文章）→ `creative-content`
- **常规更新**（日常笔记、草稿）→ `balanced`
- **快速记录** → `economical`

---

### Q6: 如何验证策略是否生效？
**A:** 检查配置加载：
```bash
opencode --config ~/.config/opencode/strategies/strategy-2-balanced.jsonc --debug
```
查看日志中的模型名称是否匹配策略配置。

---

## 📈 优化建议

### 1. 建立使用习惯
- **第1周**: 仅用 `balanced`，熟悉基础功能
- **第2周**: 尝试 `research` 和 `creative`，对比效果
- **第3周**: 建立个人使用模式

### 2. 收集数据
创建使用日志：
```bash
# 每次使用后记录
echo "$(date) | balanced | 项目开发 | 满意度:4/5" >> ~/strategy-log.txt
```

### 3. 定期回顾
每月检查：
- 实际成本 vs 预算
- 各策略使用频率
- 场景匹配度
- 调整策略配置

---

## 🎓 最佳实践

### ✅ 推荐做法

1. **设置默认策略为 balanced**
   ```bash
   echo "export OPENCODE_DEFAULT_STRATEGY=balanced" >> ~/.zshrc
   ```

2. **为常用场景创建工作区配置**
   ```
   项目A/ → 绑定 performance
   写作/ → 绑定 creative
   学习/ → 绑定 balanced
   ```

3. **使用策略助手减少决策**
   ```bash
   which-strategy  # 每次不确定时运行
   ```

4. **监控成本避免超支**
   ```bash
   cost-monitor.sh  # 每周检查一次
   ```

### ❌ 避免做法

1. **盲目使用 super 策略**
   - 成本极高（¥200+/次）
   - 大部分场景 performance 已足够

2. **频繁切换策略**
   - 增加心理负担
   - 80% 时间用 balanced 即可

3. **过度担心成本**
   - 资源总价值 ¥3500-4500/月
   - 合理使用不会超支

4. **忽视场景特性**
   - 教育场景用 balanced（有专门优化）
   - 深度研究用 research（不要省这个钱）

---

## 🔗 相关文档

- [策略优化方案](./STRATEGY_OPTIMIZATION_PLAN.md) - 完整设计文档
- [策略规划文档](./STRATEGY_PLANNING.md) - 原始规划
- [完成总结](./COMPLETION_SUMMARY.md) - 成果总结

---

## 📞 支持

### 问题反馈
如果发现策略配置问题或有优化建议：
1. 检查配置文件语法
2. 查看 oh-my-opencode 日志
3. 参考优化方案文档

### 持续改进
策略配置会根据使用情况持续优化：
- 每月回顾实际效果
- 调整模型分配
- 优化成本控制
- 新增场景支持

---

**使用原则：** 默认 balanced，按需升级，数据驱动，持续优化 🚀

**版本：** 2.0  
**维护：** Strategy Planning System
