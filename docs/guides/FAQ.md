# UsageSync 常见问题解答 (FAQ)

**版本**: 1.0  
**最后更新**: 2026-02-04

---

## 安装与配置

### Q1: 如何快速开始使用 UsageSync？

**A**: 最快的方式是 3 步：

```bash
# 1. 安装
bun install

# 2. 登录（以 Anthropic 为例）
opencode login anthropic

# 3. 运行
bun run Tools/UsageSync/CLI.ts sync
```

详见 [配置指南 - 快速开始](./CONFIGURATION.md#快速开始)。

---

### Q2: 需要所有厂商都配置吗？

**A**: 不需要。您可以只配置需要的厂商：

```bash
# 只配置 Anthropic 和 OpenAI
opencode login anthropic
opencode login openai

# 检查配置
bun run Tools/UsageSync/CLI.ts config validate
# 输出：✓ anthropic, ✓ openai, ⚠ 其他为可选
```

---

### Q3: 在 Docker 中运行需要什么？

**A**: 需要挂载认证文件和配置目录：

```bash
docker run \
  -v ~/.local/share/opencode/auth.json:/home/user/.local/share/opencode/auth.json \
  -v ~/.config/strategy-manager:/home/user/.config/strategy-manager \
  -e DEBUG=usagesync:* \
  usagesync:latest \
  bun run Tools/UsageSync/CLI.ts sync
```

详见 [配置指南 - Docker 部署](./CONFIGURATION.md#docker-部署)。

---

## 认证与权限

### Q4: 如何修改认证信息？

**A**: 编辑认证文件或重新登录：

```bash
# 方式 1: 编辑认证文件
vim ~/.local/share/opencode/auth.json

# 方式 2: 重新登录
opencode login anthropic  # 覆盖现有认证
```

---

### Q5: 权限错误 "permission denied" 如何解决？

**A**: 修复目录权限：

```bash
chmod 755 ~/.config/strategy-manager
chmod 755 ~/.config/strategy-manager/data

# 验证
ls -la ~/.config/ | grep strategy-manager
```

详见 [故障排查 - 错误 2](./TROUBLESHOOTING.md#错误-2-permission-denied)。

---

### Q6: 认证信息存储在哪里？是否安全？

**A**: 认证信息存储在：

- **位置**: `~/.local/share/opencode/auth.json`
- **权限**: 仅所有者可读（600）
- **加密**: OpenCode 框架负责加密存储
- **安全性**: 与系统密钥管理集成

最佳实践：

- ✅ 定期备份
- ✅ 限制目录访问权限
- ❌ 不要在版本控制中提交
- ❌ 不要在环境变量中存储

详见 [最佳实践 - 认证管理](./BEST_PRACTICES.md#认证管理)。

---

## 同步与数据

### Q7: 同步多长时间完成一次？

**A**: 取决于几个因素：

```bash
# 单次同步耗时（测试）
time bun run Tools/UsageSync/CLI.ts sync

# 通常：
# - 5 个配置的厂商：10-30 秒
# - 所有 7 个厂商：20-60 秒
# - 查询历史 3 个月：30-90 秒
```

优化建议：

- 只同步活跃的厂商（减少 API 调用）
- 使用较大的时间范围（API 可能更快）
- 避免频繁同步（使用缓存）

详见 [最佳实践 - 性能优化](./BEST_PRACTICES.md#性能优化)。

---

### Q8: 可以只同步特定厂商吗？

**A**: 当前实现是全量同步，但可以扩展：

```typescript
// 当前（全量）
const result = await coordinator.sync();

// 需要自定义：修改 Coordinator.ts
// 添加方法：syncSelected(['anthropic', 'openai'])
```

建议：提交功能请求或自己贡献代码。

---

### Q9: 数据存储在哪里？

**A**: 数据存储位置：

```
~/.config/strategy-manager/
├── data/
│   ├── sync-2026-02-04-120000.json     # 同步快照
│   ├── sync-2026-02-03-120000.json
│   └── ...
├── backups/                             # 备份
├── history.json                         # 历史记录
└── config.json                          # 配置
```

检查数据：

```bash
# 查看最新同步
cat ~/.config/strategy-manager/data/sync-*.json | jq . | head -100

# 统计数据
cat ~/.config/strategy-manager/data/sync-*.json | jq 'length'

# 按厂商分组
cat ~/.config/strategy-manager/data/sync-*.json | jq 'group_by(.provider)'
```

---

### Q10: 如何清除旧数据？

**A**: 使用日期和大小来管理数据：

```bash
# 清除所有缓存数据
rm -rf ~/.config/strategy-manager/data/*

# 只保留最近 30 天的数据
find ~/.config/strategy-manager/data -mtime +30 -delete

# 备份重要数据后清除
tar czf backup-2026-02-04.tar.gz ~/.config/strategy-manager/data
rm -rf ~/.config/strategy-manager/data/*
```

---

## 功能与用法

### Q11: 支持哪些厂商？

**A**: 当前支持 7 个主要 AI 厂商：

| 厂商          | 同步器          | 精确度 | 状态 |
| ------------- | --------------- | ------ | ---- |
| Anthropic     | AnthropicSync   | 99%    | ✅   |
| OpenAI        | OpenAISync      | 95%    | ✅   |
| 智谱          | ZhiPuSync       | 99%    | ✅   |
| GitHub        | GitHubSync      | 99%    | ✅   |
| Google Gemini | GeminiSync      | 90%    | ✅   |
| DeepSeek      | DeepSeekSync    | 75%    | ⚠️   |
| SiliconFlow   | SiliconFlowSync | 75%    | ⚠️   |

详见 [API 参考 - 同步器](./API_REFERENCE.md#同步器)。

---

### Q12: 如何生成成本报告？

**A**: 使用 CLI 命令：

```bash
# 生成标准报告
bun run Tools/UsageSync/CLI.ts report

# 输出示例
════════════════════════════════════════════════════════════
                  使用情况和成本报告
════════════════════════════════════════════════════════════

【汇总统计】
├─ 总成本: $123.45
├─ 总 Token: 1,234,567
└─ 平均成本: $0.0001 / 1K tokens

【按厂商统计】
├─ Anthropic: 450,000 tokens, $45.00
├─ OpenAI: 500,000 tokens, $50.00
└─ ...
```

---

### Q13: 可以导出数据吗？

**A**: 支持多种导出格式：

```bash
# 导出为 JSON
bun run Tools/UsageSync/CLI.ts export data.json

# 导出为 CSV（需要自定义）
# 或者手动转换
cat ~/.config/strategy-manager/data/sync-*.json | jq -r \
  '.[] | [.provider, .model, .usage.totalTokens, .cost] | @csv' > data.csv
```

详见 [API 参考 - CLI 工具](./API_REFERENCE.md#cli-工具)。

---

### Q14: 如何设置定期自动同步？

**A**: 使用系统的任务计划工具：

**macOS (cron)**:

```bash
# 编辑 cron 任务
crontab -e

# 每天 8:00 同步一次
0 8 * * * cd /path/to/project && bun run Tools/UsageSync/CLI.ts sync >> /tmp/usagesync.log 2>&1
```

**Linux (systemd)**:

```bash
# 创建 service
sudo nano /etc/systemd/system/usagesync.service

# [Unit]
# Description=UsageSync Daily
# After=network.target
#
# [Service]
# Type=oneshot
# ExecStart=/usr/bin/bun run /path/to/CLI.ts sync
# User=username

# 创建 timer
sudo nano /etc/systemd/system/usagesync.timer

# [Unit]
# Description=Run UsageSync daily at 8:00
# Requires=usagesync.service
#
# [Timer]
# OnCalendar=daily
# OnCalendar=08:00
# Persistent=true

# [Install]
# WantedBy=timers.target

# 启用
sudo systemctl enable usagesync.timer
sudo systemctl start usagesync.timer
```

**Windows (Task Scheduler)**:
使用"创建任务"向导，设置每天 8:00 运行。

---

## 故障与错误

### Q15: "Cannot find module" 错误如何解决？

**A**: 安装依赖：

```bash
# 清除 node_modules 和 lock 文件
rm -rf node_modules bun.lockb

# 重新安装
bun install

# 验证
bun run type-check
```

---

### Q16: 网络错误 "ENOTFOUND" 如何解决？

**A**: 检查网络连接和 DNS：

```bash
# 检查网络
ping 8.8.8.8

# 检查特定 API
ping api.openai.com

# 检查 DNS
nslookup api.openai.com

# 如果都失败，检查代理
echo $HTTP_PROXY
echo $HTTPS_PROXY
```

详见 [故障排查 - 错误 3](./TROUBLESHOOTING.md#错误-3-enotfound)。

---

### Q17: "timeout" 错误如何解决？

**A**: 增加超时时间：

```bash
# 增加到 60 秒
export SYNC_TIMEOUT=60000

# 重试
bun run Tools/UsageSync/CLI.ts sync

# 检查网络延迟
ping -c 5 api.openai.com | grep avg
```

详见 [故障排查 - 错误 4](./TROUBLESHOOTING.md#错误-4-timeout)。

---

### Q18: JSON 错误 "Unexpected token" 如何解决？

**A**: 清除缓存并重试：

```bash
# 清除数据缓存
rm -rf ~/.config/strategy-manager/data/*

# 清除认证缓存
rm -rf ~/.local/share/opencode/auth.json

# 重新登录
opencode login anthropic

# 重试
bun run Tools/UsageSync/CLI.ts sync
```

详见 [故障排查 - 错误 5](./TROUBLESHOOTING.md#错误-5-invalid-json-response)。

---

## 开发与扩展

### Q19: 如何添加新的厂商支持？

**A**: 创建新的 Sync 类：

```typescript
// 1. 创建 NewProviderSync.ts
import { BaseSync } from './BaseSync';

export class NewProviderSync extends BaseSync {
  provider = 'new-provider';

  async healthCheck(): Promise<boolean> {
    // 实现健康检查
  }

  async fetchUsage(options: FetchOptions): Promise<UsageData[]> {
    // 实现数据获取
  }

  static fromOpenCodeAuth(auth: any): NewProviderSync {
    // 实现认证初始化
  }
}

// 2. 在 index.ts 中注册
export { NewProviderSync };

// 3. 在 Coordinator.ts 中添加
const syncs = [
  new AnthropicSync(...),
  new NewProviderSync(...),  // 添加这里
];
```

详见 [API 参考 - 扩展和集成](./API_REFERENCE.md#扩展和集成)。

---

### Q20: 如何自定义数据处理？

**A**: 继承 Validator 或 CostCalculator：

```typescript
import { Validator, UsageData } from "./Tools/CostCalculator";

class CustomValidator extends Validator {
  validateUsageData(data: UsageData): ValidationError[] {
    const errors = super.validateUsageData(data);

    // 添加自定义验证
    if (data.usage.totalTokens > 1000000) {
      errors.push({
        field: "usage.totalTokens",
        value: data.usage.totalTokens,
        message: "超过配额警告",
      });
    }

    return errors;
  }
}

// 使用自定义验证器
const validator = new CustomValidator();
const errors = validator.validateBatch(dataArray);
```

---

## 性能与优化

### Q21: 如何提高同步速度？

**A**: 几个优化策略：

```bash
# 1. 只同步活跃的厂商（而不是所有 7 个）
# 编辑 Coordinator.ts 中的 DEFAULT_PROVIDERS

# 2. 增加查询范围（API 可能更高效）
const result = await sync.fetchUsage({
  start: new Date('2026-01-01'),
  end: new Date('2026-02-28')  # 一个月而不是每天
});

# 3. 使用缓存
# 避免重复查询相同时间段

# 4. 并行调用（已支持）
const results = await Promise.all([
  coordinator.syncOne('anthropic'),
  coordinator.syncOne('openai'),
]);
```

---

### Q22: 内存使用过高如何解决？

**A**: 分批处理大数据：

```typescript
// 分批处理
const dataArray = [...];  // 1M+ 条记录
const batchSize = 10000;

for (let i = 0; i < dataArray.length; i += batchSize) {
  const batch = dataArray.slice(i, i + batchSize);
  await processBatch(batch);

  // 垃圾回收
  global.gc?.();
}
```

详见 [故障排查 - 性能问题](./TROUBLESHOOTING.md#性能问题)。

---

## 最佳实践

### Q23: 生产环境最佳实践是什么？

**A**: 关键建议：

1. **认证管理**
   - ✅ 使用 OpenCode auth.json
   - ❌ 不要硬编码密钥
   - ❌ 不要在环境变量存储敏感信息

2. **错误处理**
   - 实现重试逻辑
   - 记录所有错误
   - 使用死信队列处理失败

3. **监控**
   - 监控 API 配额使用
   - 跟踪同步性能
   - 设置成本告警

4. **安全**
   - 定期更新依赖
   - 限制文件权限
   - 审计 API 调用

详见 [最佳实践](./BEST_PRACTICES.md)。

---

### Q24: 如何避免 API 超额？

**A**: 实现成本监控和告警：

```typescript
import { CostCalculator } from "./Tools/CostCalculator";

const calculator = new CostCalculator();
const monthlyData = await coordinator.sync();
const cost = calculator.calculateTotalCost(monthlyData);

// 设置告警
const MONTHLY_BUDGET = 1000; // $1000

if (cost > MONTHLY_BUDGET * 0.8) {
  console.warn(`⚠️ 警告: 已使用 80% 预算 ($${cost})`);
}

if (cost > MONTHLY_BUDGET) {
  console.error(`🚨 错误: 超出预算! ($${cost} > $${MONTHLY_BUDGET})`);
  // 发送通知
}
```

详见 [最佳实践 - 监控](./BEST_PRACTICES.md#监控)。

---

## 相关文档

- 📖 [完整文档索引](#文档体系)
- 🔧 [API 参考](./API_REFERENCE.md)
- 💡 [最佳实践](./BEST_PRACTICES.md)
- ⚙️ [配置指南](./CONFIGURATION.md)
- 🐛 [故障排查](./TROUBLESHOOTING.md)

---

## 获取帮助

### 还有问题？

1. **查看文档**: [完整文档](../README.md)
2. **检查日志**: `tail -50 ~/.config/strategy-manager/sync.log`
3. **运行诊断**: `bun run Tools/UsageSync/CLI.ts health`
4. **提交问题**: 创建 GitHub Issue

---

**版本历史**:

- v1.0 (2026-02-04): 初始发布，包含 24 个常见问题
