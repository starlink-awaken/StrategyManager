# 🚀 1小时快速修复指南

修复所有 4 个配置问题，让系统 100% 生产就绪。

---

## 📋 修复清单

- [ ] 问题 #1: Anthropic CLI 命令 (2 分钟)
- [ ] 问题 #2: OpenAI 密钥格式 (5 分钟)
- [ ] 问题 #3: 环境变量映射 (10 分钟)
- [ ] 问题 #4: CLI 导入路径 (5 分钟)
- [ ] 最终验证 (5 分钟)

---

## 🔴 问题 #1: Anthropic CLI 命令 (2 分钟)

### 问题描述

Claude Code 的 CLI 命令是 `claude`，不是 `anthropic`。代码中使用了错误的命令名。

### 修复步骤

**步骤 1**: 打开文件

```bash
cd /Volumes/Model/Workspace/Skills/StrategyManager
vim Tools/UsageSync/AnthropicSync.ts
```

**步骤 2**: 查找并替换所有 `anthropic` CLI 调用

查找类似这样的代码：

```typescript
const result = execSync("anthropic usage", { encoding: "utf-8" });
// 或
const cmd = "anthropic";
```

替换为：

```typescript
const result = execSync("claude usage", { encoding: "utf-8" });
// 或
const cmd = "claude";
```

**步骤 3**: 验证修改

```bash
# 检查文件中是否还有 'anthropic' 命令
grep -n "anthropic" Tools/UsageSync/AnthropicSync.ts | grep -v "Anthropic" | grep -v "anthropic.com"
```

如果没有输出，说明修改成功。

---

## 🟠 问题 #2: OpenAI 密钥格式 (5 分钟)

### 问题描述

OpenAI 现在使用 `sk-proj-...` 格式的密钥，但代码只接受 `sk-...` 格式。

### 修复步骤

**步骤 1**: 打开文件

```bash
vim Tools/UsageSync/OpenAISync.ts
```

**步骤 2**: 找到密钥验证代码（约第 10-20 行）

旧代码:

```typescript
if (!apiKey || !apiKey.startsWith("sk-")) {
  throw new Error("OPENAI_API_KEY is required");
}
```

新代码:

```typescript
if (!apiKey) {
  throw new Error("OPENAI_API_KEY is required");
}
// 支持两种格式: sk-... 和 sk-proj-...
if (!apiKey.startsWith("sk-proj-") && !apiKey.startsWith("sk-")) {
  throw new Error("Invalid OPENAI_API_KEY format");
}
```

**步骤 3**: 保存并验证

```bash
grep "sk-proj" Tools/UsageSync/OpenAISync.ts
# 应该看到新添加的检查
```

---

## 🟡 问题 #3: 环境变量映射 (10 分钟)

### 问题描述

auth.json 中的字段名（如 `anthropic`）与环境变量名（如 `ANTHROPIC_API_KEY`）不一致。

### 修复步骤

**步骤 1**: 查看现有的 setup_auth.ts

```bash
cat Tools/UsageSync/setup_auth.ts 2>/dev/null || echo "文件不存在"
```

**步骤 2**: 如果文件不存在，创建它

```bash
cat > Tools/UsageSync/setup_auth.ts << 'EOF'
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * 从 auth.json 加载凭证到环境变量
 */
export function loadAuthFromJson() {
  const authPath = path.join(os.homedir(), '.local/share/opencode/auth.json');

  if (!fs.existsSync(authPath)) {
    console.warn(`⚠️  auth.json not found at ${authPath}`);
    return;
  }

  try {
    const authData = JSON.parse(fs.readFileSync(authPath, 'utf-8'));

    // 映射: auth.json 字段 → 环境变量
    const envMapping: Record<string, string> = {
      'anthropic': 'ANTHROPIC_API_KEY',
      'openai': 'OPENAI_API_KEY',
      'zhipu': 'ZHIPU_API_KEY',
      'github': 'GITHUB_TOKEN',
      'gemini': 'GEMINI_API_KEY',
      'deepseek': 'DEEPSEEK_API_KEY',
      'siliconflow': 'SILICONFLOW_API_KEY',
    };

    // 加载到环境变量
    for (const [key, envVar] of Object.entries(envMapping)) {
      const value = authData[key];
      if (value && !process.env[envVar]) {
        process.env[envVar] = value;
      }
    }

    console.log('✅ Loaded credentials from auth.json');
  } catch (e) {
    console.error('❌ Failed to load auth.json:', e);
  }
}
EOF
```

**步骤 3**: 在入口文件中导入

编辑 `Tools/UsageSync/index.ts`，在文件最顶部添加：

```typescript
import { loadAuthFromJson } from "./setup_auth";

// 在所有其他代码之前调用
loadAuthFromJson();

// ... 其他导入和代码
```

**步骤 4**: 验证

```bash
# 检查文件是否创建
ls -la Tools/UsageSync/setup_auth.ts

# 检查 index.ts 是否已导入
grep "loadAuthFromJson" Tools/UsageSync/index.ts
```

---

## 🟢 问题 #4: CLI 导入路径 (5 分钟)

### 问题描述

测试文件中的 CLI 导入路径不正确。

### 修复步骤

**步骤 1**: 打开测试文件

```bash
vim tests/CLI.test.ts
```

**步骤 2**: 找到导入语句

旧代码 (可能是这些之一):

```typescript
import { CLI } from "./CLI";
// 或
import { CLI } from "../CLI";
```

新代码:

```typescript
import { CLI } from "../Tools/UsageSync/CLI";
```

**步骤 3**: 检查其他导入

确保所有 UsageSync 相关的导入都使用正确的路径：

```typescript
import { UsageSyncCoordinator } from "../Tools/UsageSync";
import type { UsageData } from "../Tools/UsageSync/interfaces";
```

**步骤 4**: 验证

```bash
# 类型检查
bun run --check tests/CLI.test.ts
```

---

## ✅ 最终验证 (5 分钟)

修复完所有问题后，运行完整测试：

```bash
cd /Volumes/Model/Workspace/Skills/StrategyManager

# 加载凭证（如果还没有加载）
export ANTHROPIC_API_KEY=$(cat ~/.local/share/opencode/auth.json | jq -r '.anthropic')
export OPENAI_API_KEY=$(cat ~/.local/share/opencode/auth.json | jq -r '.openai')
export ZHIPU_API_KEY=$(cat ~/.local/share/opencode/auth.json | jq -r '.zhipu')
export GITHUB_TOKEN=$(cat ~/.local/share/opencode/auth.json | jq -r '.github')
export GEMINI_API_KEY=$(cat ~/.local/share/opencode/auth.json | jq -r '.gemini')

# 运行所有测试
bun test 2>&1
```

**预期输出**:

```
✓ 49 tests passed (2.3s)
```

**如果看到这个** → 🎉 修复成功！系统 100% 生产就绪！

---

## 🚨 故障排查

### 测试仍然失败？

**症状 1**: Anthropic 测试失败

```bash
# 验证 claude 命令可用
claude --version

# 如果命令不存在，claude 可能不在 PATH 中
which claude
```

**症状 2**: OpenAI 测试失败

```bash
# 检查密钥格式
echo $OPENAI_API_KEY | head -c 20
# 应该看到 sk-proj- 或 sk-
```

**症状 3**: 环境变量未加载

```bash
# 手动测试 setup_auth
bun run -e "
import { loadAuthFromJson } from './Tools/UsageSync/setup_auth';
loadAuthFromJson();
console.log('Keys loaded:', {
  anthropic: !!process.env.ANTHROPIC_API_KEY,
  openai: !!process.env.OPENAI_API_KEY,
  zhipu: !!process.env.ZHIPU_API_KEY
});
"
```

**症状 4**: 导入路径错误

```bash
# 详细错误信息
bun test tests/CLI.test.ts --reporter=verbose
```

---

## ⏱️ 预计时间表

```
09:00  问题 #1: Anthropic CLI      (2 min)   09:02 ✅
09:02  问题 #2: OpenAI 密钥        (5 min)   09:07 ✅
09:07  问题 #3: 环境变量映射        (10 min)  09:17 ✅
09:17  问题 #4: CLI 路径           (5 min)   09:22 ✅
09:22  最终验证                    (5 min)   09:27 ✅

总耗时: 27 分钟 (预留缓冲 → 实际可能需要 1 小时)
```

---

## 📝 修复完成后

- [ ] 运行 `bun test` - 确认 49/49 通过
- [ ] 更新 README - 说明系统已生产就绪
- [ ] 提交代码 - 创建 commit: "fix: 修复 4 个配置问题"
- [ ] 庆祝 🎉

---

**需要帮助？** 查看 [FAQ.md](FAQ.md) 或 [FULL_REPORT.md](FULL_REPORT.md)
