# UsageSync 配置指南

**版本**: 1.0  
**最后更新**: 2026-02-04

---

## 目录

- [快速配置](#快速配置)
- [环境设置](#环境设置)
- [认证配置](#认证配置)
- [高级配置](#高级配置)
- [Docker 部署](#docker-部署)

---

## 快速配置

### 最简配置 (推荐)

对于大多数用户，只需：

1. **检查认证文件**

   ```bash
   cat ~/.local/share/opencode/auth.json | jq .
   ```

2. **验证配置**

   ```bash
   bun run Tools/UsageSync/CLI.ts config validate
   ```

3. **开始使用**
   ```bash
   bun run Tools/UsageSync/CLI.ts sync
   ```

就这么简单！无需额外配置。

---

## 环境设置

### 目录结构

UsageSync 会自动创建以下目录：

```
~/.config/strategy-manager/
├── data/                          # 数据目录
│   ├── sync-2026-02-04.json      # 同步数据
│   └── report-2026-02-04.json    # 报告数据
└── (其他配置)

~/.local/share/opencode/
└── auth.json                      # 认证文件 (由 opencode 管理)
```

### 手动创建目录

```bash
mkdir -p ~/.config/strategy-manager/data
mkdir -p ~/.local/share/opencode
```

### 检查目录权限

```bash
# 应该如下所示
ls -la ~/.config/strategy-manager/
# drwxr-xr-x   user  group  ...  data/

# 认证文件应该是 600 权限
ls -la ~/.local/share/opencode/auth.json
# -rw-------   user  group  ...  auth.json
```

---

## 认证配置

### opencode auth.json 格式

```json
{
  "anthropic": {
    "type": "oauth",
    "access": "sk-ant-oat01-...",
    "refresh": "sk-ant-ort01-..."
  },
  "openai": {
    "type": "oauth",
    "access": "eyJhbGc...",
    "accountId": "org-..."
  },
  "zhipu": {
    "type": "api",
    "key": "f487b8bac06c...",
    "access": "zhipu_..."
  },
  "github-copilot": {
    "type": "oauth",
    "access": "gho_VnBQ..."
  },
  "google": {
    "type": "oauth",
    "access": "ya29...",
    "refresh": "|tensile-depot..."
  },
  "deepseek": {
    "type": "api",
    "key": "sk-2ec38c71..."
  },
  "github-models": {
    "type": "api",
    "key": "github_pat_11ABI..."
  }
}
```

### 各厂商认证方式

#### Anthropic

**类型**: OAuth + CLI

```bash
# 通过 opencode 登录
opencode login anthropic

# 验证
bun run Tools/UsageSync/CLI.ts health
# ✓ anthropic 已配置
```

**所需权限**: API 使用权限

#### OpenAI

**类型**: OAuth + API

```bash
# 通过 opencode 登录
opencode login openai

# 或手动设置 API Key
export OPENAI_API_KEY="sk-..."
```

**所需权限**: 使用量查询权限

#### ZhiPu (智谱)

**类型**: API Key

```bash
# 从 https://open.bigmodel.cn/ 获取 API Key

# 手动配置
export ZHIPU_API_KEY="your-api-key"

# 或通过 opencode
opencode login zhipu
```

**所需权限**: 用量查询权限

#### GitHub

**类型**: OAuth Token + Billing API

```bash
# 通过 opencode 登录
opencode login github

# 或手动设置
export GITHUB_TOKEN="ghp_..."
export GITHUB_OWNER="your-org"  # 可选
```

**所需权限**:

- repo 权限
- read:org 权限 (如果查询组织数据)

#### Google Gemini

**类型**: OAuth Access Token

```bash
# 通过 opencode 登录
opencode login google

# 验证
bun run Tools/UsageSync/CLI.ts health
# ✓ gemini 已配置
```

**所需权限**: Gemini API 访问权限

#### DeepSeek

**类型**: API Key

```bash
# 从 https://platform.deepseek.com/ 获取 API Key

export DEEPSEEK_API_KEY="sk-..."
```

#### Silicon Flow

**类型**: 本地配置

```bash
# 无需额外认证
# 使用本地统计数据
```

---

## 高级配置

### 自定义数据目录

```bash
# 设置环境变量
export STRATEGY_MANAGER_DATA_DIR="/custom/path/data"

# CLI 会使用自定义目录
bun run Tools/UsageSync/CLI.ts sync
```

### 自定义时间周期

```typescript
// 默认是当前月份
const result = await coordinator.syncAll();

// 自定义时间段
const result = await coordinator.syncAll({
  start: new Date("2026-01-01"),
  end: new Date("2026-01-31"),
});
```

### 部分厂商同步

```typescript
// 不是同步所有，而是选择性同步
const anthropicData = await coordinator.syncOne("anthropic");
const openaiData = await coordinator.syncOne("openai");

// 聚合
const allData = [...anthropicData.data, ...openaiData.data];
```

### 自定义定价

```typescript
const calculator = new CostCalculator();

// 更新 Anthropic 定价
calculator.updatePricing("anthropic", {
  "claude-3-5-sonnet": {
    input: 3 / 1000000, // $3 per 1M tokens
    output: 15 / 1000000, // $15 per 1M tokens
  },
});

// 计算成本时使用新定价
const report = calculator.generateCostReport(data);
```

### 日志配置

```typescript
// 启用详细日志
process.env.DEBUG = "usagesync:*";

// 定向到文件
const logStream = fs.createWriteStream("sync.log");
console.log = (...args) => {
  logStream.write(args.join(" ") + "\n");
};
```

---

## Docker 部署

### Dockerfile 示例

```dockerfile
FROM oven/bun:latest

WORKDIR /app

# 复制项目
COPY . .

# 安装依赖
RUN bun install

# 挂载认证和数据卷
VOLUME /root/.local/share/opencode
VOLUME /root/.config/strategy-manager

# 设置时区
ENV TZ=Asia/Shanghai

# 默认命令
CMD ["bun", "run", "Tools/UsageSync/CLI.ts", "sync"]
```

### docker-compose.yml 示例

```yaml
version: "3.8"

services:
  usagesync:
    build: .
    container_name: strategy-manager-usagesync

    volumes:
      # 挂载认证文件
      - ~/.local/share/opencode:/root/.local/share/opencode:ro
      # 挂载数据目录
      - ./data:/root/.config/strategy-manager/data
      # 挂载日志
      - ./logs:/app/logs

    environment:
      - TZ=Asia/Shanghai
      - DEBUG=usagesync:*

    # 每天 9 点运行一次
    entrypoint: |
      sh -c 'while true; do
        echo "执行定时同步..."
        bun run Tools/UsageSync/CLI.ts sync
        bun run Tools/UsageSync/CLI.ts report --json > /root/.config/strategy-manager/data/report-$(date +%Y-%m-%d).json
        sleep 86400
      done'
```

### Docker 运行

```bash
# 构建镜像
docker build -t strategy-manager:latest .

# 运行容器
docker run -it \
  -v ~/.local/share/opencode:/root/.local/share/opencode:ro \
  -v ./data:/root/.config/strategy-manager/data \
  strategy-manager:latest

# 使用 docker-compose
docker-compose up -d
```

---

## 配置验证

### 验证命令

```bash
# 完整验证
bun run Tools/UsageSync/CLI.ts config validate

# 输出示例
════════════════════════════════════════════════════════════
                     配置验证
════════════════════════════════════════════════════════════

✓ anthropic
✓ openai
✓ zhipu
✓ github
✓ gemini
⚠ deepseek (可选)
⚠ silicon-flow (可选)

✓ 验证完成: 5/7 核心服务已配置
```

### 手动检查

```bash
# 检查认证文件
cat ~/.local/share/opencode/auth.json | jq '.anthropic'

# 检查数据目录
ls -la ~/.config/strategy-manager/data/

# 检查最新数据
cat ~/.config/strategy-manager/data/sync-*.json | jq '.[] | .provider'
```

---

## 故障排除

### 认证失败

```bash
# 症状：CLI 报告认证失败

# 解决：
1. 检查文件是否存在
   ls ~/.local/share/opencode/auth.json

2. 验证格式
   cat ~/.local/share/opencode/auth.json | jq .

3. 重新登录
   opencode login anthropic

4. 检查权限
   chmod 600 ~/.local/share/opencode/auth.json
```

### 数据目录问题

```bash
# 症状：无法保存数据

# 解决：
1. 创建目录
   mkdir -p ~/.config/strategy-manager/data

2. 检查权限
   chmod 755 ~/.config/strategy-manager
   chmod 755 ~/.config/strategy-manager/data

3. 检查磁盘空间
   df -h ~/.config/
```

### 网络连接问题

```bash
# 症状：同步超时或连接失败

# 解决：
1. 检查网络
   ping 8.8.8.8

2. 检查代理设置
   echo $HTTP_PROXY
   echo $HTTPS_PROXY

3. 增加超时时间
   export SYNC_TIMEOUT=60000  # 毫秒

4. 检查防火墙
   # 确保允许访问 API 端点
```

---

## 环境变量速查

| 变量                  | 用途                | 示例              |
| --------------------- | ------------------- | ----------------- |
| `ANTHROPIC_API_KEY`   | Anthropic API Key   | `sk-ant-...`      |
| `OPENAI_API_KEY`      | OpenAI API Key      | `sk-...`          |
| `ZHIPU_API_KEY`       | ZhiPu API Key       | `f487b8bac06c...` |
| `GITHUB_TOKEN`        | GitHub Token        | `ghp_...`         |
| `GITHUB_OWNER`        | GitHub Owner        | `my-org`          |
| `GEMINI_ACCESS_TOKEN` | Google Access Token | `ya29...`         |
| `DEEPSEEK_API_KEY`    | DeepSeek API Key    | `sk-...`          |
| `TZ`                  | 时区                | `Asia/Shanghai`   |
| `DEBUG`               | 调试模式            | `usagesync:*`     |

---

## 配置检查清单

- [ ] opencode 已安装
- [ ] 至少一个厂商已登录
- [ ] ~/.local/share/opencode/auth.json 存在
- [ ] 文件权限正确 (600)
- [ ] ~/.config/strategy-manager 目录存在
- [ ] 数据目录可写
- [ ] 网络连接正常
- [ ] config validate 显示 ✓

---

## 相关文档

- [API 参考](./API_REFERENCE.md)
- [最佳实践](./BEST_PRACTICES.md)
- [故障排查](./TROUBLESHOOTING.md)
- [FAQ](./FAQ.md)

---

**版本历史**:

- v1.0 (2026-02-04): 初始发布
