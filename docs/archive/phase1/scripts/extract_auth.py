#!/usr/bin/env python3
import json
import os
import sys

# 读取 auth.json
auth_file = os.path.expanduser("~/.local/share/opencode/auth.json")
try:
    with open(auth_file, 'r') as f:
        auth = json.load(f)
except Exception as e:
    print(f"Error reading auth.json: {e}")
    sys.exit(1)

# 关键的 API 名称映射
vendor_mapping = {
    "anthropic": "ANTHROPIC_API_KEY",
    "openai": "OPENAI_API_KEY",
    "zhipuai-coding-plan": "ZHIPU_API_KEY",
    "github-models": "GITHUB_TOKEN",
    "google": "GEMINI_API_KEY",
    "deepseek": "DEEPSEEK_API_KEY",
    "openrouter": "OPENROUTER_API_KEY"
}

print("=" * 50)
print("已配置的凭证")
print("=" * 50)
print()

configured_vendors = []
missing_vendors = []

for vendor, env_var in vendor_mapping.items():
    if vendor in auth:
        config = auth[vendor]
        configured_vendors.append(vendor)
        print(f"✅ {vendor.upper()}")
        print(f"   Environment Var: {env_var}")
        print(f"   Type: {config.get('type')}")
        if config.get('type') == 'api':
            key = config.get('key', '')
            status = '✓ 存在' if key else '✗ 缺失'
            print(f"   Key Status: {status}")
        elif config.get('type') == 'oauth':
            access = config.get('access', '')
            refresh = config.get('refresh', '')
            status = '✓ 存在' if access else '✗ 缺失'
            print(f"   Token Status: {status}")
        print()
    else:
        missing_vendors.append(vendor)

print(f"\n总计: {len(configured_vendors)} 个厂商已配置, {len(missing_vendors)} 个缺失")
print(f"\n已配置: {', '.join(configured_vendors)}")
print(f"缺失: {', '.join(missing_vendors)}")

# 输出为 bash 变量设置格式
print("\n" + "=" * 50)
print("环境变量设置命令")
print("=" * 50)
print()

env_exports = []
for vendor, env_var in vendor_mapping.items():
    if vendor in auth:
        config = auth[vendor]
        if config.get('type') == 'api':
            key = config.get('key', '')
            if key:
                env_exports.append(f'export {env_var}="{key}"')
        elif config.get('type') == 'oauth':
            access = config.get('access', '')
            if access:
                env_exports.append(f'export {env_var}="{access}"')

for cmd in env_exports:
    print(cmd)
