# UsageSync 故障排查指南

**版本**: 1.0  
**最后更新**: 2026-02-04

---

## 目录

- [常见错误](#常见错误)
- [诊断工具](#诊断工具)
- [日志分析](#日志分析)
- [性能问题](#性能问题)
- [数据问题](#数据问题)

---

## 常见错误

### 错误 1: "ANTHROPIC_API_KEY is required"

**症状**:

```
Error: AnthropicSync: ANTHROPIC_API_KEY is required
```

**原因**:

- Anthropic 未认证
- opencode auth.json 中没有 anthropic 记录

**解决方案**:

```bash
# 方案 1: 通过 opencode 登录
opencode login anthropic

# 方案 2: 验证 auth.json
cat ~/.local/share/opencode/auth.json | jq .anthropic

# 方案 3: 验证认证
bun run Tools/UsageSync/CLI.ts config get
# 应该看到 ✓ anthropic
```

---

### 错误 2: "permission denied"

**症状**:

```
Error: EACCES: permission denied, open '/Users/user/.config/strategy-manager/data'
```

**原因**:

- 目录权限不正确
- 用户无写权限

**解决方案**:

```bash
# 修复权限
chmod 755 ~/.config/strategy-manager
chmod 755 ~/.config/strategy-manager/data

# 或重新创建
rm -rf ~/.config/strategy-manager
mkdir -p ~/.config/strategy-manager/data

# 验证
ls -la ~/.config/ | grep strategy-manager
# drwxr-xr-x  ...  strategy-manager
```

---

### 错误 3: "ENOTFOUND: getaddrinfo ENOTFOUND api.openai.com"

**症状**:

```
Error: ENOTFOUND: getaddrinfo ENOTFOUND api.openai.com
```

**原因**:

- 网络连接问题
- DNS 解析失败
- 代理配置错误

**解决方案**:

```bash
# 检查网络连接
ping 8.8.8.8
# 如果失败，检查网络

# 检查 DNS
nslookup api.openai.com
# 应该返回 IP 地址

# 如果使用代理，配置代理
export HTTP_PROXY="http://proxy:3128"
export HTTPS_PROXY="http://proxy:3128"

# 禁用代理
unset HTTP_PROXY
unset HTTPS_PROXY
```

---

### 错误 4: "timeout"

**症状**:

```
Error: Request timeout
```

**原因**:

- 网络慢
- API 服务响应慢
- 默认超时时间太短

**解决方案**:

```bash
# 增加超时时间
export SYNC_TIMEOUT=60000  # 60 秒

# 重试同步
bun run Tools/UsageSync/CLI.ts sync

# 检查网络延迟
ping -c 5 api.openai.com | grep avg
```

---

### 错误 5: "INVALID JSON response"

**症状**:

```
Error: Unexpected token in JSON
```

**原因**:

- API 返回非 JSON 响应
- 响应被截断
- 字符编码问题

**解决方案**:

```bash
# 清除缓存
rm -rf ~/.config/strategy-manager/data/*

# 重新同步
bun run Tools/UsageSync/CLI.ts sync

# 检查响应
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/usage/requests
```

---

### 错误 6: "data validation failed"

**症状**:

```
ValidationError: Field 'inputTokens' is missing
```

**原因**:

- API 返回的数据格式与预期不符
- 某个字段值无效

**解决方案**:

```typescript
// 调查数据结构
const data = await sync.fetchUsage();
console.log(JSON.stringify(data[0], null, 2));

// 手动验证
const validator = new Validator();
const errors = validator.validateUsageData(data[0]);

for (const error of errors) {
  console.error(`${error.field}: ${error.message}`);
}
```

---

## 诊断工具

### 健康检查

```bash
# 检查所有厂商连接
bun run Tools/UsageSync/CLI.ts health

# 输出示例
════════════════════════════════════════════════════════════
                    厂商连接状态
════════════════════════════════════════════════════════════

✓ anthropic          已配置
✓ openai             已配置
✓ zhipu              已配置
✓ github             已配置
✓ gemini             已配置
⚠ deepseek           未配置
⚠ silicon-flow       未配置

✓ 可用: 5/7
```

### 配置验证

```bash
# 验证所有配置
bun run Tools/UsageSync/CLI.ts config validate

# 输出示例
✓ 认证文件格式正确
✓ anthropic
✓ openai
✓ zhipu
✓ github-copilot
✓ google
⚠ deepseek (可选)

✓ 验证完成: 5/5 必需服务已配置
```

### 手动测试单个同步器

```typescript
import { AnthropicSync } from "./Tools/UsageSync";

async function testSync() {
  try {
    const sync = AnthropicSync.fromOpenCodeAuth(auth.anthropic);

    // 测试健康检查
    const healthy = await sync.healthCheck();
    console.log(`健康检查: ${healthy ? "✓" : "✗"}`);

    // 测试获取数据
    const data = await sync.fetchUsage({
      start: new Date("2026-01-01"),
      end: new Date("2026-02-01"),
    });
    console.log(`获取数据: ${data.length} 条`);

    // 显示第一条
    console.log(JSON.stringify(data[0], null, 2));
  } catch (error) {
    console.error("测试失败:", error);
  }
}

testSync();
```

---

## 日志分析

### 启用调试模式

```bash
# 启用详细日志
export DEBUG=usagesync:*

# 运行同步，查看详细日志
bun run Tools/UsageSync/CLI.ts sync

# 输出示例
usagesync:sync 开始同步 +0ms
usagesync:anthropic 连接中... +10ms
usagesync:anthropic 获取数据中... +50ms
usagesync:anthropic 数据获取完成, 150000 条记录 +100ms
...
```

### 查看最近的日志

```bash
# 显示最后 50 行日志
tail -50 ~/.config/strategy-manager/sync.log

# 按错误级别过滤
grep ERROR ~/.config/strategy-manager/sync.log

# 按时间戳查找
grep "2026-02-04T09" ~/.config/strategy-manager/sync.log
```

### 分析日志模式

```bash
# 统计错误出现次数
grep ERROR ~/.config/strategy-manager/sync.log | wc -l

# 查找最常见的错误
grep ERROR ~/.config/strategy-manager/sync.log | \
  sed 's/.*Error: //' | sort | uniq -c | sort -rn

# 查看特定厂商的日志
grep "anthropic" ~/.config/strategy-manager/sync.log
```

---

## 性能问题

### 同步速度慢

**诊断**:

```bash
# 测量同步耗时
time bun run Tools/UsageSync/CLI.ts sync

# 输出示例
real    0m15.234s
user    0m8.123s
sys     0m1.234s
```

**解决方案**:

```bash
# 1. 检查网络
ping -c 5 api.openai.com

# 2. 只同步特定厂商
# (需要修改代码)

# 3. 调整查询周期 (更大的时间范围可能更快)
await sync.fetchUsage({
  start: new Date('2026-01-01'),
  end: new Date('2026-01-31')  // 整个月而不是每天
});

# 4. 增加并发数 (如果支持)
const result = await Promise.all([
  coordinator.syncOne('anthropic'),
  coordinator.syncOne('openai'),
  // 其他厂商
]);
```

### 内存使用过高

**诊断**:

```bash
# 监控内存使用
while true; do
  ps aux | grep "bun run"
  sleep 1
done
```

**解决方案**:

```typescript
// 分批处理数据
const dataArray = [...];
const batchSize = 10000;

for (let i = 0; i < dataArray.length; i += batchSize) {
  const batch = dataArray.slice(i, i + batchSize);
  await processBatch(batch);

  // 清理内存
  global.gc?.();
}
```

---

## 数据问题

### 数据缺失

**诊断**:

```bash
# 检查数据文件
ls -la ~/.config/strategy-manager/data/

# 检查数据内容
cat ~/.config/strategy-manager/data/sync-*.json | jq '.[] | .provider' | sort | uniq -c
```

**解决方案**:

```bash
# 1. 重新同步
bun run Tools/UsageSync/CLI.ts sync

# 2. 检查特定厂商
bun run Tools/UsageSync/CLI.ts health

# 3. 检查日志
grep "ERROR" ~/.config/strategy-manager/sync.log

# 4. 使用缓存数据
# 加载最近一次成功的同步
```

### 数据不一致

**诊断**:

```typescript
// 检测重复
const duplicates = validator.detectDuplicates(dataArray);
console.log(`重复数据: ${duplicates.length} 条`);

// 检测异常
const anomalies = validator.detectAnomalies(dataArray);
console.log(`异常数据: ${anomalies.length} 条`);

// 检查验证错误
const errors = validator.validateBatch(dataArray);
console.log(`验证错误: ${errors.length} 条`);
```

**解决方案**:

```typescript
// 清理重复数据
const unique = Array.from(
  new Map(
    dataArray.map((item) => [item.model + item.period.start, item]),
  ).values(),
);

// 标记异常
const cleaned = dataArray.map((item) => ({
  ...item,
  flagged: anomalies.some((a) => a.value === item.usage.totalTokens),
}));

// 保存清理后的数据
fs.writeFileSync("cleaned-data.json", JSON.stringify(cleaned, null, 2));
```

---

## 快速参考

### 常见问题快速修复

| 问题     | 快速修复                               |
| -------- | -------------------------------------- |
| 认证失败 | `opencode login <provider>`            |
| 权限错误 | `chmod 755 ~/.config/strategy-manager` |
| 网络错误 | `ping 8.8.8.8` 或检查代理              |
| 超时     | `export SYNC_TIMEOUT=60000`            |
| 数据缺失 | `bun run Tools/UsageSync/CLI.ts sync`  |
| 数据问题 | 检查验证错误日志                       |

### 完整诊断流程

1. **基础检查**

   ```bash
   bun run Tools/UsageSync/CLI.ts health
   bun run Tools/UsageSync/CLI.ts config validate
   ```

2. **测试同步**

   ```bash
   bun run Tools/UsageSync/CLI.ts sync
   ```

3. **检查结果**

   ```bash
   ls -la ~/.config/strategy-manager/data/
   cat ~/.config/strategy-manager/data/sync-*.json | jq .
   ```

4. **生成报告**

   ```bash
   bun run Tools/UsageSync/CLI.ts report
   ```

5. **分析问题**
   ```bash
   grep ERROR ~/.config/strategy-manager/sync.log
   ```

---

## 相关文档

- [API 参考](./API_REFERENCE.md)
- [最佳实践](./BEST_PRACTICES.md)
- [配置指南](./CONFIGURATION.md)
- [FAQ](./FAQ.md)

---

**版本历史**:

- v1.0 (2026-02-04): 初始发布
