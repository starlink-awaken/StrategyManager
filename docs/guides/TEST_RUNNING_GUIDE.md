# 测试运行指南 - StrategyManager

本文档介绍如何运行新增的测试套件，以及使用本地开发流程。

## 📋 快速开始

### 前置条件

```bash
# 确认 Bun 已安装
bun --version

# 确认 TypeScript 已配置
bun run type-check
```

### 安装依赖

```bash
bun install
```

## 🧪 测试命令

### 1. 运行所有测试

```bash
# 标准运行
bun test

# Watch 模式（自动重新运行）
bun test:watch

# 生成覆盖率报告
bun test:coverage
```

### 2. 运行特定模块测试

```bash
# 仅运行 PathManager 测试
bun test:pathmanager
# 或
bun test tests/unit/PathManager.test.ts

# 仅运行 Validator 测试
bun test:validator
# 或
bun test tests/unit/Validator.test.ts

# 仅运行 Recommender 测试
bun test:recommender
# 或
bun test tests/unit/Recommender.test.ts
```

### 3. 单元测试运行

```bash
# 所有单元测试
bun test:unit
# 或
bun test tests/unit/
```

### 4. CI 模式运行

```bash
# 生成 JUnit 格式的测试报告和覆盖率
bun test:ci
```

## 📊 覆盖率报告

### 生成覆盖率

```bash
bun test:coverage
```

这将生成：

- `coverage/` 目录包含详细的覆盖率数据
- 终端输出覆盖率摘要

### 查看覆盖率详情

```bash
# HTML 报告（如果配置了）
open coverage/index.html

# JSON 报告
cat coverage/coverage-final.json
```

## 🔍 调试测试

### 添加调试日志

在测试文件中使用 `console.log()` 或 `console.error()`：

```typescript
it("should do something", () => {
  const result = someFunction();
  console.log("Result:", result);
  expect(result).toBe(true);
});
```

### 启用详细输出

```bash
# 详细的测试输出
bun test --verbose

# 显示测试计时
bun test --slow 100  # 超过 100ms 的测试标记为慢
```

### 只运行特定测试

```bash
# 运行匹配特定模式的测试
bun test -- --grep "PathManager"

# 运行单个测试文件
bun test tests/unit/PathManager.test.ts

# 运行单个测试套件
# 编辑文件，将 describe 改为 describe.only
describe.only('PathManager', () => {
  // 只有这个套件会运行
});
```

## 🐛 常见问题

### 问题：测试超时

**症状**: `Test timeout after XXXms`

**解决方案**:

```bash
# 增加超时时间
bun test -- --timeout 10000  # 10 秒

# 或在测试中指定
it('slow test', async () => {
  // ...
}, { timeout: 10000 });
```

### 问题：文件系统权限问题

**症状**: `EACCES: permission denied`

**解决方案**:

```bash
# 使用 sudo（不推荐）
sudo bun test

# 或检查 /tmp 权限
ls -la /tmp | grep pm-test
chmod 755 /tmp/pm-test-*

# 或修改测试使用其他目录
export TEST_TEMP_DIR=/var/tmp
bun test
```

### 问题：HOME 目录未设置

**症状**: `Cannot read property 'split' of undefined` (in PathManager)

**解决方案**:

```bash
# 设置 HOME 环境变量
export HOME=$PWD
bun test

# 或使用项目模式
TEST_MODE=project bun test
```

### 问题：端口被占用

**症状**: 集成测试中的 `EADDRINUSE: address already in use`

**解决方案**:

```bash
# 找到占用的进程
lsof -i :3000
# 杀死进程
kill -9 <PID>

# 或重启
killall node bun
```

## 📈 开发工作流

### 1. 开发新功能的测试优先方法

```bash
# 1. 编写测试
# vim tests/unit/Feature.test.ts

# 2. 运行测试（会失败）
bun test:watch

# 3. 实现功能
# vim Tools/Feature.ts

# 4. 测试通过
# Ctrl+S 自动重新运行

# 5. 检查覆盖率
bun test:coverage
```

### 2. 运行完整的验证套件

```bash
#!/bin/bash
# validate.sh

echo "🔍 Type checking..."
bun run type-check || exit 1

echo "🧪 Running tests..."
bun test || exit 1

echo "📊 Checking coverage..."
bun test:coverage

echo "✅ All validations passed!"
```

### 3. 提交前检查清单

```bash
# 运行完整验证
./validate.sh

# 检查未提交的更改
git status

# 查看代码变动
git diff

# 提交
git commit -m "Add feature X"

# 推送
git push origin feature/X
```

## 🚀 CI/CD 流程

### GitHub Actions

所有推送和 PR 自动运行测试：

```bash
# 查看 CI 状态
# 访问 https://github.com/owner/repo/actions

# 本地模拟 CI 运行
bun test:ci
```

### 本地 CI 模拟

```bash
#!/bin/bash
# ci-local.sh

echo "Running local CI simulation..."

# 类型检查
echo "1️⃣  Type checking..."
bun run type-check
if [ $? -ne 0 ]; then
  echo "❌ Type check failed"
  exit 1
fi

# 运行所有测试
echo "2️⃣  Running tests..."
bun test:ci
if [ $? -ne 0 ]; then
  echo "❌ Tests failed"
  exit 1
fi

# 生成报告
echo "3️⃣  Generating coverage..."
bun test:coverage

echo "✅ Local CI passed!"
```

## 📝 测试维护

### 更新测试

当代码变化时，可能需要更新测试：

```bash
# 1. 识别失败的测试
bun test

# 2. 更新测试文件
vim tests/unit/Feature.test.ts

# 3. 重新运行
bun test:watch
```

### 添加新测试

```bash
# 1. 创建测试文件
touch tests/unit/NewFeature.test.ts

# 2. 编写测试（参考现有文件）

# 3. 运行
bun test tests/unit/NewFeature.test.ts

# 4. 集成到运行流程
# 自动发现，无需额外配置
```

### 清理过期测试

```bash
# 查找并删除过期测试
grep -r "skip\|todo" tests/ --include="*.test.ts"

# 移除空测试文件
find tests -name "*.test.ts" -size 0
```

## 🎯 性能优化

### 测试执行时间优化

```bash
# 查看最慢的测试
bun test -- --slow 100

# 并行运行测试
# Bun 默认并行，可通过环境变量控制
BUN_TEST_MAX_PARALLEL=4 bun test

# 增量测试（仅运行改变的）
git status --porcelain | grep '\.ts$' | xargs bun test
```

## 🔐 测试隔离

### 临时文件清理

```bash
# 手动清理测试生成的临时文件
rm -rf /tmp/pm-test-*
rm -rf /tmp/strategy-manager-tests-*

# 自动清理脚本
#!/bin/bash
# cleanup-test-files.sh
find /tmp -name "pm-test-*" -type d -mtime +1 -exec rm -rf {} \;
find /tmp -name "strategy-manager-tests-*" -type d -mtime +1 -exec rm -rf {} \;
```

### Mock 文件验证

```bash
# 检查 Mock 数据的有效性
bun run -e "
  import { mockStrategies } from './tests/fixtures/mock-data.ts';
  console.log('Mock strategies count:', mockStrategies.length);
  console.log('First strategy:', mockStrategies[0].name);
"
```

## 📚 参考资源

- [Bun 测试文档](https://bun.sh/docs/test/overview)
- [TypeScript 测试指南](https://www.typescriptlang.org/docs/handbook/testing.html)
- [项目 README](../README.md)
- [测试增强计划](./TEST_ENHANCEMENT_PLAN.md)

## 🆘 获取帮助

### 常见错误排查

| 错误                   | 原因           | 解决方案           |
| ---------------------- | -------------- | ------------------ |
| `Module not found`     | 导入路径错误   | 检查 `import` 语句 |
| `Cannot read property` | Null/undefined | 添加空值检查       |
| `Timeout`              | 异步操作太慢   | 增加超时或优化代码 |
| `EACCES`               | 权限问题       | 修改文件权限       |

### 获取更多帮助

```bash
# Bun 帮助
bun help test

# 查看本项目文档
ls docs/guides/

# 检查问题跟踪
# https://github.com/owner/repo/issues
```

---

**最后更新**: 2026-02-05  
**维护者**: QA 团队
