# StrategyManager Scripts 知识库

## OVERVIEW
本目录包含 StrategyManager 的安装, 配置, 验证及 OpenCode 集成脚本。

## STRUCTURE
- **Shell 脚本**: 处理系统安装, 路径设置与命令注册。
- **TypeScript 脚本**: 处理模型验证, 认证管理等复杂逻辑。

## WHERE TO LOOK
| 任务 | 脚本 | 说明 |
| :--- | :--- | :--- |
| 初始安装 | `install.sh` | 环境初始化 |
| OpenCode 集成 | `setup-opencode-integration.sh` | 自动化集成设置 |
| 注册命令 | `install-slash-command.sh` | 注册 OpenCode 斜杠命令 |
| 验证模型 | `verify-models.ts` | 检查平台连通性 |
| 认证管理 | `setup_auth.ts` | 配置 API 密钥 |
| 路径检查 | `test-command-path.sh` | 验证执行路径 |
| 策略辅助 | `strategy-helper.sh` | 策略操作辅助 |
|
## CONVENTIONS
- **权限**: 确保 `.sh` 文件有执行权限 (`chmod +x`)。
- **健壮性**: Shell 脚本开启 `set -e`。TS 脚本需处理异常并使用 `chalk` 输出。
- **运行时**: TS 脚本统一通过 `bun` 执行。
- **路径**: 严禁硬编码绝对路径, 需动态定位项目根目录。

## SCRIPT EXAMPLES
```bash
# 执行安装
bash scripts/install.sh

# 验证模型
bun scripts/verify-models.ts

# 注册命令
./scripts/install-slash-command.sh
```

