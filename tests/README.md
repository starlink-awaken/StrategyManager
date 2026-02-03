# 测试说明

## 运行测试

```bash
# 运行所有测试
bun test

# 运行特定测试文件
bun test tests/ManageStrategies.test.ts

# 查看测试覆盖率
bun test --coverage
```

## 测试结构

```
tests/
├── ManageStrategies.test.ts    # 核心功能测试
└── setup.ts                  # 测试设置（待添加）
```

## 测试覆盖范围

- ✅ 策略验证 (`validateStrategy`)
- ✅ 表格格式化 (`formatTable`)
- ✅ 构造函数和初始化
- 🔄 文件系统操作（待添加）
- 🔄 策略切换逻辑（待添加）
- 🔄 历史记录管理（待添加）

## Mock 策略

当前测试使用简化版 `ManageStrategies` 类和 mock：
- `fs.readFileSync` / `fs.writeFileSync` - 文件系统操作
- `process.env` - 环境变量

## 添加新测试

1. 在 `tests/` 目录创建新的 `.test.ts` 文件
2. 使用 Bun 测试 API：
   ```typescript
   import { describe, it, expect } from 'bun:test';

   describe('Feature', () => {
     it('should work', () => {
       expect(true).toBe(true);
     });
   });
   ```
3. 运行 `bun test` 验证
