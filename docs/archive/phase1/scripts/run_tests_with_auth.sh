#!/bin/bash
cd /Volumes/Model/Workspace/Skills/StrategyManager

# 从 auth.json 提取并设置环境变量
AUTH_FILE="$HOME/.local/share/opencode/auth.json"

# 使用 node/bun 内置的 JSON 解析
export ANTHROPIC_API_KEY=$(cat "$AUTH_FILE" | bun run -e "console.log(require('fs').readFileSync('/dev/stdin', 'utf8'))" | grep -o '"access":"[^"]*' | head -1 | cut -d'"' -f4 2>/dev/null || echo "")

# 更简单的方式：使用 jq 如果可用，否则使用 python
if command -v jq &> /dev/null; then
    export ANTHROPIC_API_KEY=$(jq -r '.anthropic.access' "$AUTH_FILE")
    export OPENAI_API_KEY=$(jq -r '.openai.access' "$AUTH_FILE")
    export ZHIPU_API_KEY=$(jq -r '.["zhipuai-coding-plan"].key' "$AUTH_FILE")
    export GITHUB_TOKEN=$(jq -r '.["github-models"].key' "$AUTH_FILE")
    export GEMINI_API_KEY=$(jq -r '.google.access' "$AUTH_FILE")
    export DEEPSEEK_API_KEY=$(jq -r '.deepseek.key' "$AUTH_FILE")
    export OPENROUTER_API_KEY=$(jq -r '.openrouter.key' "$AUTH_FILE")
else
    # 使用 python3 作为备选
    python3 << 'PYEOF'
import json
import os

auth_file = os.path.expanduser("~/.local/share/opencode/auth.json")
with open(auth_file, 'r') as f:
    auth = json.load(f)

mappings = {
    'ANTHROPIC_API_KEY': ('anthropic', 'access'),
    'OPENAI_API_KEY': ('openai', 'access'),
    'ZHIPU_API_KEY': ('zhipuai-coding-plan', 'key'),
    'GITHUB_TOKEN': ('github-models', 'key'),
    'GEMINI_API_KEY': ('google', 'access'),
    'DEEPSEEK_API_KEY': ('deepseek', 'key'),
    'OPENROUTER_API_KEY': ('openrouter', 'key'),
}

for env_var, (vendor, field) in mappings.items():
    try:
        value = auth.get(vendor, {}).get(field, '')
        if value:
            os.environ[env_var] = value
            print(f"✓ {env_var} set")
        else:
            print(f"✗ {env_var} not set (empty value)")
    except Exception as e:
        print(f"✗ {env_var} failed: {e}")
PYEOF
fi

echo ""
echo "======================================"
echo "运行单元测试"
echo "======================================"
echo ""

# 运行测试
bun test
