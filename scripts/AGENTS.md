# scripts 安装和配置脚本

**父级**: `../AGENTS.md`

## 概述

Shell 脚本目录，包含 6 个实用工具脚本，用于项目安装、配置和集成设置。

## 结构

```
scripts/
├── install.sh                         # 策略模板安装脚本
├── setup-opencode-integration.sh      # OpenCode 集成配置
├── verify-models.ts                   # 模型验证脚本（TypeScript）
├── (其他脚本...)
```

## WHERE TO LOOK

| 任务 | 脚本 | 说明 |
|------|------|------|
| 安装模板 | `install.sh` | 安装策略模板到用户目录 |
| 配置集成 | `setup-opencode-integration.sh` | 配置 OpenCode 环境集成 |
| 验证模型 | `verify-models.ts` | 检查模型配置有效性 |

## CONVENTIONS

- **格式**: Bash (.sh) 或 TypeScript (.ts)
- **权限**: Bash 脚本需可执行权限 (`chmod +x`)
- **依赖**: 使用 `bun` 运行 TypeScript 脚本
- **错误处理**: 使用 `set -e` 和 `trap` 进行错误捕获
- **输出**: 使用 `echo` 和颜色标记（绿色=成功，红色=错误）

## 脚本示例

### install.sh
```bash
#!/bin/bash
set -e

# 安装策略模板
bun run Tools/ManageStrategies.ts import templates/strategy-2-balanced.jsonc

echo "✅ 模板安装完成"
```

### verify-models.ts
```typescript
// 验证模型配置
import { validateStrategy } from "./Tools/Validator"

const result = validateStrategy("templates/strategy-2-balanced.jsonc")
console.log(result)
```

## ANTI-PATTERNS

- 不要在脚本中硬编码绝对路径（使用相对路径或配置）
- 避免脚本依赖未记录的假设（如特定环境变量）
- 不要忽略错误（确保 `set -e` 或检查退出码）
- 避免脚本包含业务逻辑（逻辑应在 Tools/ 模块）

## NOTES

- 运行脚本前确保已安装 Bun 运行时
- Bash 脚本支持 LF 行尾（非 CRLF）
- TypeScript 脚本通过 `bun run` 执行
- 修改脚本后需重新赋予执行权限（如需要）
