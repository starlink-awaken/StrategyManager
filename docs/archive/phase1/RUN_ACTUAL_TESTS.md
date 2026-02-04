# P1 实际功能验证指南

## 问题的核心

之前的"深度复核"主要验证了**代码结构**，但没有用真实凭证验证**实际功能**。这份指南是为了进行真正的功能验证。

---

## 第1步：加载凭证

auth.json 中的凭证需要设置为环境变量。根据你的 shell，选择对应的命令：

### Bash/Zsh (macOS 推荐):

```bash
# 方法A: 直接导出所有凭证
export ANTHROPIC_API_KEY=$(jq -r '.anthropic' ~/.local/share/opencode/auth.json)
export OPENAI_API_KEY=$(jq -r '.openai' ~/.local/share/opencode/auth.json)
export ZHIPU_API_KEY=$(jq -r '.zhipu' ~/.local/share/opencode/auth.json)
export GITHUB_TOKEN=$(jq -r '.github' ~/.local/share/opencode/auth.json)
export GEMINI_API_KEY=$(jq -r '.gemini' ~/.local/share/opencode/auth.json)

# 验证是否成功加载
echo "✅ Anthropic: ${ANTHROPIC_API_KEY:0:10}..."
echo "✅ OpenAI: ${OPENAI_API_KEY:0:10}..."
echo "✅ ZhiPu: ${ZHIPU_API_KEY:0:10}..."
echo "✅ GitHub: ${GITHUB_TOKEN:0:10}..."
echo "✅ Gemini: ${GEMINI_API_KEY:0:10}..."
```

### 方法B: 如果没有 jq，用 Python:

```bash
python3 << 'EOF'
import json
with open(os.path.expanduser('~/.local/share/opencode/auth.json')) as f:
    creds = json.load(f)

# 打印环境变量设置命令
for key, val in creds.items():
    env_key = {
        'anthropic': 'ANTHROPIC_API_KEY',
        'openai': 'OPENAI_API_KEY',
        'zhipu': 'ZHIPU_API_KEY',
        'github': 'GITHUB_TOKEN',
        'gemini': 'GEMINI_API_KEY'
    }.get(key)
    if env_key:
        print(f'export {env_key}="{val}"')
EOF
```

---

## 第2步：运行实际单元测试

这些测试会用真实凭证连接到各个厂商的 API：

### 运行所有测试:

```bash
cd /Volumes/Model/Workspace/Skills/StrategyManager
bun test 2>&1
```

### 运行特定的测试文件:

```bash
# 测试所有厂商的同步功能
bun test tests/UsageSync.test.ts 2>&1

# 测试数据处理模块
bun test tests/DataProcessing.test.ts 2>&1

# 测试 CLI 命令
bun test tests/CLI.test.ts 2>&1
```

---

## 第3步：理解测试结果

### 成功的测试看起来像:

```
✓ AnthropicSync > should initialize with API key (2ms)
✓ AnthropicSync > should fetch usage data (450ms)
✓ OpenAISync > should fetch usage data (523ms)
...
16 pass (2.3s)
```

### 失败的测试看起来像:

```
✗ AnthropicSync > should fetch usage data
  error: 401 Unauthorized
```

这表示凭证没有配置好，或者 API 密钥无效。

---

## 第4步：验证清单

### 4.1 检查认证配置

在运行测试之前，验证这些内容：

- [ ] auth.json 文件存在于 `~/.local/share/opencode/auth.json`
- [ ] auth.json 包含以下字段:
  - `anthropic`: Anthropic API key
  - `openai`: OpenAI API key
  - `zhipu`: ZhiPu API key
  - `github`: GitHub personal access token
  - `gemini`: Gemini API key
- [ ] 所有的 API key 都是有效的（未过期或失效）
- [ ] 环境变量成功导出（用 `echo $ANTHROPIC_API_KEY` 验证）

### 4.2 检查各厂商可用性

运行测试后，检查每个厂商的状态：

| 厂商        | 预期结果 | 实际结果 | 备注           |
| ----------- | -------- | -------- | -------------- |
| Anthropic   | ✅ 通过  | [ ]      |                |
| OpenAI      | ✅ 通过  | [ ]      |                |
| ZhiPu       | ✅ 通过  | [ ]      |                |
| GitHub      | ✅ 通过  | [ ]      |                |
| Gemini      | ✅ 通过  | [ ]      |                |
| DeepSeek    | ✅ 通过  | [ ]      | 不需要 API key |
| SiliconFlow | ✅ 通过  | [ ]      | 不需要 API key |

### 4.3 功能可用性评分

- **7/7 通过** = 100% 可用，完全生产就绪 ✅
- **5-6/7 通过** = 70-85% 可用，大部分功能工作
- **3-4/7 通过** = 40-60% 可用，需要配置更多厂商
- **1-2/7 通过** = 少于 30% 可用，需要进行系统调试

---

## 第5步：故障排查

### 症状: 所有测试都 404 或超时

**可能原因:**

- 网络连接问题
- API 密钥无效
- API 端点已更改

**解决方案:**

```bash
# 测试网络连接
curl -I https://api.anthropic.com/

# 验证 API 密钥格式
echo "$ANTHROPIC_API_KEY" | head -c 20

# 检查是否是测试密钥
echo "$OPENAI_API_KEY" | grep -o '^[^_]*'
```

### 症状: 部分厂商成功，部分失败

**可能原因:**

- 某些 API 密钥无效
- 某些厂商的额度已用完

**解决方案:**

```bash
# 检查各个密钥
echo "Anthropic: $ANTHROPIC_API_KEY"
echo "OpenAI: $OPENAI_API_KEY"
# ... 等等

# 查看详细错误信息
bun test --reporter=tap 2>&1 | grep -A 5 "error"
```

### 症状: 健康检查通过但获取数据失败

**可能原因:**

- API 有速率限制
- 账户没有计费权限

**解决方案:**

- 等待几分钟后重试
- 检查账户是否有活跃的计费方式

---

## 第6步：实际数据验证

如果所有单元测试都通过了，进行实际数据验证：

### 6.1 运行 CLI 同步命令

```bash
cd /Volumes/Model/Workspace/Skills/StrategyManager

# 同步所有数据
bun run Tools/CLI.ts sync --all

# 生成报告
bun run Tools/CLI.ts report

# 检查健康状态
bun run Tools/CLI.ts health
```

### 6.2 检查同步结果

```bash
# 查看生成的报告
cat ~/.opencode/usage-report.json | jq .

# 查看成本计算
cat ~/.opencode/usage-report.json | jq '.costs'

# 查看数据来源标签
cat ~/.opencode/usage-report.json | jq '.tags'
```

---

## 第7步：生成验证报告

运行完所有测试后，生成一份实际的验证报告：

```bash
# 创建验证报告
cat > /Volumes/Model/Workspace/Skills/StrategyManager/P1_ACTUAL_VERIFICATION_REPORT.md << 'EOF'
# P1 实际功能验证报告

## 测试执行时间
- 日期: $(date)
- 运行者: (你的名字)

## 单元测试结果
- 总数: 47
- 通过: X
- 失败: Y
- 跳过: Z

## 厂商可用性
| 厂商 | 状态 | 备注 |
|-----|------|------|
| Anthropic | ✅/⚠️/❌ | |
| OpenAI | ✅/⚠️/❌ | |
| ZhiPu | ✅/⚠️/❌ | |
| GitHub | ✅/⚠️/❌ | |
| Gemini | ✅/⚠️/❌ | |
| DeepSeek | ✅/⚠️/❌ | |
| SiliconFlow | ✅/⚠️/❌ | |

## CLI 命令验证
- [ ] sync --all 成功完成
- [ ] report 生成有效的 JSON
- [ ] health 显示所有状态
- [ ] config 能读取和更新配置

## 数据同步验证
- [ ] 至少一个厂商的使用数据被成功获取
- [ ] 成本计算结果合理
- [ ] 数据源标签正确应用

## 总体评分
功能可用率: X/7 (XX%)

## 结论
(根据实际测试结果写出是否生产就绪)
EOF
```

---

## 关键点总结

✅ **代码层面验证已完成**:

- 文件结构正确 ✅ 49/49
- 类型检查通过 ✅
- 所有接口定义正确 ✅

❌ **功能层面需要验证**:

- 用真实凭证运行单元测试 <- **你在这里**
- 实际 API 连接验证
- 真实数据同步
- CLI 命令执行
- 报告生成

---

## 下一步

1. **立即**: 设置环境变量，运行 `bun test`
2. **观察**: 记录每个厂商的测试结果
3. **分析**: 确定哪些功能真正可用，哪些需要修复
4. **报告**: 生成真实的验证报告，替换之前的代码审查报告

**重要**: 这将是第一次用真实凭证验证系统的实际功能。之前的"49/49 通过"是代码结构验证，不是功能验证。
