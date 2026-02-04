# UsageSync 最佳实践指南

**版本**: 1.0  
**最后更新**: 2026-02-04

---

## 目录

- [认证管理](#认证管理)
- [性能优化](#性能优化)
- [错误处理](#错误处理)
- [数据管理](#数据管理)
- [监控和日志](#监控和日志)
- [安全最佳实践](#安全最佳实践)

---

## 认证管理

### ✅ 推荐方式：opencode auth.json

```bash
# CLI 自动从 opencode auth.json 加载
bun run Tools/UsageSync/CLI.ts config get

# 无需任何环境变量配置
bun run Tools/UsageSync/CLI.ts sync
```

**优点**:

- ✅ 零配置
- ✅ 中央管理
- ✅ 多个服务统一认证
- ✅ 安全存储

### ❌ 不推荐方式：环境变量

```bash
# 不要这样做
export ANTHROPIC_API_KEY="sk-..."
export OPENAI_API_KEY="sk-..."

bun run script.ts  # 容易泄露
```

**问题**:

- ❌ 容易暴露
- ❌ 难以管理多个密钥
- ❌ 不安全

### 使用 fromOpenCodeAuth 方法

```typescript
// 推荐：自动从 auth.json 加载
import { AnthropicSync } from "./Tools/UsageSync";

const sync = AnthropicSync.fromOpenCodeAuth(auth.anthropic);

// 而不是手动指定
// const sync = new AnthropicSync(apiKey);
```

### 定期更新认证

```bash
# 检查认证有效性
bun run Tools/UsageSync/CLI.ts config validate

# 显示已登录服务
bun run Tools/UsageSync/CLI.ts config get
```

---

## 性能优化

### 使用并行同步

```typescript
// ✅ 好：并行同步，耗时 = 最慢的一个
const result = await coordinator.syncAll();

// ❌ 不好：串行同步，耗时 = 所有之和
for (const provider of ["anthropic", "openai", "zhipu"]) {
  await coordinator.syncOne(provider); // 串行执行
}
```

**性能对比**:

- 并行: ~12-15 秒
- 串行: ~45-60 秒

### 批量处理 vs 单条处理

```typescript
const calculator = new CostCalculator();

// ✅ 好：批量处理
const report = calculator.calculateBatchCost(dataArray); // 1 次循环

// ❌ 不好：单条处理
const costs = dataArray.map((data) => calculator.calculateCost(data)); // N 次循环
```

### 缓存结果

```typescript
// 缓存同步结果
const syncResult = await coordinator.syncAll();

// 在有效期内复用，不需要重新同步
const allData = coordinator.aggregateUsage(syncResult.results);
```

### 优化数据查询周期

```typescript
// ✅ 推荐：按月查询
await sync.fetchUsage({
  start: new Date("2026-01-01"),
  end: new Date("2026-02-01"),
});

// ⚠️ 谨慎：按小时查询可能导致速率限制
await sync.fetchUsage({
  start: new Date("2026-02-04T10:00:00Z"),
  end: new Date("2026-02-04T11:00:00Z"),
});
```

---

## 错误处理

### 完整的错误处理模式

```typescript
async function robustSync() {
  try {
    const result = await coordinator.syncAll();

    // 检查是否有部分失败
    if (result.failed > 0) {
      console.warn(`部分失败 (${result.failed}/${result.total})`);

      for (const syncResult of result.results) {
        if (!syncResult.success) {
          console.error(`${syncResult.provider}: ${syncResult.error}`);

          // 记录失败事件
          logFailure(syncResult);
        }
      }
    }

    // 即使有失败，也处理成功的数据
    const successData = result.results
      .filter((r) => r.success && r.data)
      .flatMap((r) => r.data!);

    return successData;
  } catch (error) {
    // 网络错误、超时等致命错误
    console.error("同步失败:", error);
    throw error; // 或返回缓存的旧数据
  }
}
```

### 重试逻辑

```typescript
async function syncWithRetry(maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await coordinator.syncAll();
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      // 指数退避
      const delay = Math.pow(2, i) * 1000;
      console.log(`重试 ${i + 1}/${maxRetries}，等待 ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}
```

### 部分失败处理

```typescript
// 某个厂商失败时继续处理其他的
const result = await coordinator.syncAll();

for (const syncResult of result.results) {
  if (syncResult.success) {
    // 处理成功的数据
    processData(syncResult.data);
  } else {
    // 选项 1: 使用缓存数据
    const cachedData = loadCache(syncResult.provider);
    if (cachedData) {
      console.warn(`使用缓存数据: ${syncResult.provider}`);
      processData(cachedData);
    }

    // 选项 2: 跳过并记录
    else {
      console.error(`无法获取 ${syncResult.provider}: ${syncResult.error}`);
      recordMissing(syncResult.provider);
    }
  }
}
```

---

## 数据管理

### 数据验证流程

```typescript
const validator = new Validator();

// 1. 检测重复
const duplicates = validator.detectDuplicates(dataArray);
if (duplicates.length > 0) {
  console.warn(`检测到 ${duplicates.length} 条重复数据`);

  // 去重处理
  const unique = [...new Set(dataArray.map((d) => d.model))];
}

// 2. 检测异常
const anomalies = validator.detectAnomalies(dataArray);
if (anomalies.length > 0) {
  console.warn(`检测到 ${anomalies.length} 条异常数据`);

  // 检查和处理异常
  for (const anomaly of anomalies) {
    console.warn(
      `${anomaly.type}: ${anomaly.value} (Z-score: ${anomaly.zscore})`,
    );
  }
}

// 3. 数据验证
const errors = validator.validateBatch(dataArray);
if (errors.length > 0) {
  console.error("数据验证失败:", errors);
  throw new Error("数据质量问题");
}
```

### 数据持久化

```typescript
import * as fs from "fs";
import * as path from "path";

// 保存数据
function saveData(data: UsageData[]) {
  const timestamp = new Date().toISOString().split("T")[0];
  const filepath = path.join(
    process.env.HOME,
    ".config/strategy-manager/data",
    `sync-${timestamp}.json`,
  );

  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  console.log(`数据已保存到: ${filepath}`);
}

// 加载数据
function loadData(date: string): UsageData[] {
  const filepath = path.join(
    process.env.HOME,
    ".config/strategy-manager/data",
    `sync-${date}.json`,
  );

  if (!fs.existsSync(filepath)) {
    throw new Error(`文件不存在: ${filepath}`);
  }

  return JSON.parse(fs.readFileSync(filepath, "utf-8"));
}
```

### 数据归档

```typescript
// 按月份组织数据
function organizeDataByMonth(dataArray: UsageData[]) {
  const byMonth = new Map<string, UsageData[]>();

  for (const data of dataArray) {
    const month = data.period.start.toISOString().substring(0, 7);

    if (!byMonth.has(month)) {
      byMonth.set(month, []);
    }

    byMonth.get(month)!.push(data);
  }

  return byMonth;
}

// 删除旧数据
function archiveOldData(days: number = 90) {
  const dataDir = path.join(process.env.HOME, ".config/strategy-manager/data");
  const files = fs.readdirSync(dataDir);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  for (const file of files) {
    const filepath = path.join(dataDir, file);
    const stat = fs.statSync(filepath);

    if (stat.mtime < cutoffDate) {
      fs.unlinkSync(filepath);
      console.log(`已删除过期数据: ${file}`);
    }
  }
}
```

---

## 监控和日志

### 结构化日志

```typescript
interface LogEntry {
  timestamp: Date;
  level: "debug" | "info" | "warn" | "error";
  component: string;
  message: string;
  metadata?: Record<string, any>;
}

class Logger {
  log(entry: LogEntry) {
    const logStr = JSON.stringify({
      timestamp: entry.timestamp.toISOString(),
      level: entry.level.toUpperCase(),
      component: entry.component,
      message: entry.message,
      ...entry.metadata,
    });

    console.log(logStr);
  }
}

// 使用
const logger = new Logger();
logger.log({
  timestamp: new Date(),
  level: "info",
  component: "UsageSync",
  message: "同步完成",
  metadata: { provider: "anthropic", records: 150000 },
});
```

### 性能监控

```typescript
function measureSync() {
  const startTime = Date.now();

  coordinator.syncAll().then((result) => {
    const duration = Date.now() - startTime;

    console.log(`同步耗时: ${duration}ms`);
    console.log(`成功: ${result.successful}/${result.total}`);
    console.log(`平均耗时/厂商: ${duration / result.total}ms`);
  });
}
```

### 监控脚本示例

```bash
#!/bin/bash

# 定期执行同步，记录结果
LOG_FILE="$HOME/.config/strategy-manager/sync.log"

{
  echo "同步开始: $(date)"

  bun run Tools/UsageSync/CLI.ts sync >> "$LOG_FILE" 2>&1

  if [ $? -eq 0 ]; then
    echo "同步成功: $(date)" >> "$LOG_FILE"
  else
    echo "同步失败: $(date)" >> "$LOG_FILE"
  fi
} >> "$LOG_FILE"

# 生成报告
bun run Tools/UsageSync/CLI.ts report --json >> "$LOG_FILE" 2>&1
```

---

## 安全最佳实践

### 密钥管理

```typescript
// ✅ 推荐：使用 opencode auth.json
const sync = AnthropicSync.fromOpenCodeAuth(auth.anthropic);

// ❌ 不推荐：在代码中硬编码
// const sync = new AnthropicSync('sk-ant-...');

// ❌ 不推荐：在日志中打印
// console.log('API Key:', apiKey);  // 危险！
```

### 文件权限

```bash
# 设置配置文件权限 (仅所有者可读)
chmod 600 ~/.local/share/opencode/auth.json
chmod 700 ~/.config/strategy-manager

# 验证权限
ls -la ~/.local/share/opencode/auth.json
# -rw------- 1 user user ...  (600)
```

### 审计日志

```typescript
// 记录所有重要操作
class AuditLogger {
  log(action: string, details: any) {
    const entry = {
      timestamp: new Date().toISOString(),
      action,
      user: process.env.USER,
      details,
    };

    // 写入审计日志（不包含敏感信息）
    console.log(JSON.stringify(entry));
  }
}

const audit = new AuditLogger();
audit.log("SYNC_COMPLETED", { provider: "anthropic", records: 150000 });
audit.log("REPORT_GENERATED", { format: "json", cost: 234.56 });
```

### 敏感信息过滤

```typescript
// 从日志中移除敏感信息
function sanitizeLog(log: any): any {
  const sensitive = ["apiKey", "token", "secret", "password"];

  for (const key of Object.keys(log)) {
    if (sensitive.some((s) => key.toLowerCase().includes(s))) {
      log[key] = "***REDACTED***";
    }
  }

  return log;
}
```

---

## 常见场景

### 场景 1: 每日成本报告

```bash
# crontab -e
0 9 * * * cd ~/Workspace/Skills/StrategyManager && \
  bun run Tools/UsageSync/CLI.ts sync && \
  bun run Tools/UsageSync/CLI.ts report --json > reports/daily-$(date +%Y-%m-%d).json
```

### 场景 2: 按需同步和报告

```typescript
async function generateReport() {
  // 同步
  const result = await coordinator.syncAll();

  if (result.failed > 0) {
    console.error(`${result.failed} 个厂商同步失败`);
  }

  // 聚合和验证
  const data = coordinator.aggregateUsage(result.results);
  const errors = validator.validateBatch(data);

  if (errors.length > 0) {
    console.warn(`${errors.length} 条数据有问题`);
  }

  // 计算成本
  const report = calculator.generateCostReport(data);

  // 输出报告
  console.log(`总成本: $${report.totalCost.toFixed(2)}`);

  return report;
}
```

### 场景 3: 成本告警

```typescript
async function checkCostThreshold(threshold: number) {
  const data = coordinator.aggregateUsage(await coordinator.syncAll());

  const report = calculator.generateCostReport(data);

  if (report.totalCost > threshold) {
    // 发送告警
    sendAlert({
      level: "warning",
      message: `成本超过阈值: $${report.totalCost.toFixed(2)} > $${threshold}`,
      details: report.costByProvider,
    });
  }
}
```

---

## 常见问题解决

### Q: 如何处理同步失败？

A: 使用重试逻辑，或从缓存加载旧数据，确保业务连续性。

### Q: 如何监控数据质量？

A: 使用 Validator 检测异常和重复，定期审查精确度指标。

### Q: 如何优化性能？

A: 使用并行同步、批量处理、合理的查询周期。

### Q: 如何保证数据安全？

A: 使用 opencode auth.json，设置文件权限，记录审计日志。

---

## 相关文档

- [API 参考](./API_REFERENCE.md)
- [配置指南](./CONFIGURATION.md)
- [故障排查](./TROUBLESHOOTING.md)
- [FAQ](./FAQ.md)

---

**版本历史**:

- v1.0 (2026-02-04): 初始发布
