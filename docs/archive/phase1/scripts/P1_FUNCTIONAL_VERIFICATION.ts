/**
 * P1 实际功能验证脚本
 *
 * 验证所有配置的厂商是否真正可用
 */

import * as fs from "fs";
import * as path from "path";
import { AnthropicSync } from "./Tools/UsageSync/AnthropicSync";
import { OpenAISync } from "./Tools/UsageSync/OpenAISync";
import { ZhiPuSync } from "./Tools/UsageSync/ZhiPuSync";
import { GitHubSync } from "./Tools/UsageSync/GitHubSync";
import { GeminiSync } from "./Tools/UsageSync/GeminiSync";
import {
  DeepSeekSync,
  SiliconFlowSync,
} from "./Tools/UsageSync/LocalStatsSync";

const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

function log(color: string, message: string) {
  console.log(`${color}${message}${colors.reset}`);
}

function section(title: string) {
  console.log("\n" + "=".repeat(80));
  log(colors.cyan, `  ${title}`);
  console.log("=".repeat(80));
}

function testResult(
  passed: boolean,
  name: string,
  message: string,
  details?: string,
) {
  const icon = passed ? "✅" : "❌";
  const color = passed ? colors.green : colors.red;
  log(color, `  ${icon} ${name}: ${message}`);
  if (details) {
    log(colors.gray, `     ${details}`);
  }
  return passed;
}

interface TestResult {
  provider: string;
  available: boolean;
  hasAuth: boolean;
  healthCheck?: boolean;
  fetchUsage?: boolean;
  error?: string;
}

const results: TestResult[] = [];

async function testProvider(
  name: string,
  factory: () => any,
  requiresAuth: boolean = true,
): Promise<TestResult> {
  const result: TestResult = {
    provider: name,
    available: false,
    hasAuth: !requiresAuth,
    error: undefined,
  };

  try {
    // 1. 检查认证
    if (requiresAuth) {
      const envKey = getEnvKeyForProvider(name);
      if (!process.env[envKey]) {
        result.error = `Missing environment variable: ${envKey}`;
        testResult(false, name, "❌ 缺少认证密钥", result.error);
        return result;
      }
      result.hasAuth = true;
      testResult(true, name, "✅ 找到认证密钥");
    }

    // 2. 创建实例
    let instance: any;
    try {
      instance = factory();
      testResult(true, name, "✅ 实例创建成功");
    } catch (e: any) {
      result.error = `Failed to create instance: ${e.message}`;
      testResult(false, name, "❌ 实例创建失败", result.error);
      return result;
    }

    // 3. 健康检查
    try {
      const health = await Promise.race([
        instance.healthCheck(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Health check timeout")), 5000),
        ),
      ]);
      result.healthCheck = health as boolean;
      if (health) {
        testResult(true, name, "✅ 健康检查通过");
      } else {
        testResult(
          true,
          name,
          "⚠️  健康检查返回 false",
          "可能是网络或认证问题",
        );
      }
    } catch (e: any) {
      testResult(true, name, "⚠️  健康检查超时或失败", e.message);
      result.healthCheck = false;
    }

    // 4. 尝试获取使用量
    try {
      const usage = (await Promise.race([
        instance.fetchUsage({
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          end: new Date(),
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Fetch usage timeout")), 10000),
        ),
      ])) as any;

      if (Array.isArray(usage) && usage.length >= 0) {
        result.fetchUsage = true;
        testResult(
          true,
          name,
          `✅ 成功获取使用量数据`,
          `共 ${usage.length} 条记录`,
        );
        result.available = true;
      }
    } catch (e: any) {
      testResult(false, name, "❌ 获取使用量失败", e.message);
    }
  } catch (e: any) {
    result.error = e.message;
    testResult(false, name, "❌ 测试异常", e.message);
  }

  return result;
}

function getEnvKeyForProvider(provider: string): string {
  const keyMap: Record<string, string> = {
    Anthropic: "ANTHROPIC_API_KEY",
    OpenAI: "OPENAI_API_KEY",
    ZhiPu: "ZHIPU_API_KEY",
    GitHub: "GITHUB_TOKEN",
    Gemini: "GEMINI_API_KEY",
  };
  return keyMap[provider] || `${provider.toUpperCase()}_API_KEY`;
}

// ============================================================================
// 主测试流程
// ============================================================================

async function runTests() {
  section("1. 环境变量检查");

  const providers = [
    { name: "Anthropic", key: "ANTHROPIC_API_KEY" },
    { name: "OpenAI", key: "OPENAI_API_KEY" },
    { name: "ZhiPu", key: "ZHIPU_API_KEY" },
    { name: "GitHub", key: "GITHUB_TOKEN" },
    { name: "Gemini", key: "GEMINI_API_KEY" },
  ];

  for (const { name, key } of providers) {
    const hasKey = !!process.env[key];
    const color = hasKey ? colors.green : colors.yellow;
    const icon = hasKey ? "✅" : "⚠️ ";
    log(color, `  ${icon} ${name}: ${hasKey ? "已配置" : "未配置"}`);
  }

  // ========================================================================
  // 第2部分: 厂商可用性测试
  // ========================================================================

  section("2. 厂商可用性测试");

  // Anthropic
  log(colors.blue, "\n  测试 Anthropic...");
  results.push(
    await testProvider(
      "Anthropic",
      () => new AnthropicSync(process.env.ANTHROPIC_API_KEY),
    ),
  );

  // OpenAI
  log(colors.blue, "\n  测试 OpenAI...");
  results.push(
    await testProvider(
      "OpenAI",
      () => new OpenAISync(process.env.OPENAI_API_KEY),
    ),
  );

  // ZhiPu
  log(colors.blue, "\n  测试 ZhiPu...");
  results.push(
    await testProvider("ZhiPu", () => new ZhiPuSync(process.env.ZHIPU_API_KEY)),
  );

  // GitHub
  log(colors.blue, "\n  测试 GitHub...");
  results.push(
    await testProvider(
      "GitHub",
      () => new GitHubSync(process.env.GITHUB_TOKEN),
    ),
  );

  // Gemini
  log(colors.blue, "\n  测试 Gemini...");
  results.push(
    await testProvider(
      "Gemini",
      () => new GeminiSync(process.env.GEMINI_API_KEY),
    ),
  );

  // DeepSeek (不需要认证)
  log(colors.blue, "\n  测试 DeepSeek...");
  results.push(await testProvider("DeepSeek", () => new DeepSeekSync(), false));

  // SiliconFlow (不需要认证)
  log(colors.blue, "\n  测试 SiliconFlow...");
  results.push(
    await testProvider("SiliconFlow", () => new SiliconFlowSync(), false),
  );

  // ========================================================================
  // 第3部分: 汇总报告
  // ========================================================================

  section("3. 测试结果汇总");

  let availableCount = 0;
  let authConfiguredCount = 0;
  let healthPassCount = 0;
  let fetchSuccessCount = 0;

  for (const result of results) {
    if (result.available) availableCount++;
    if (result.hasAuth) authConfiguredCount++;
    if (result.healthCheck) healthPassCount++;
    if (result.fetchUsage) fetchSuccessCount++;
  }

  console.log("\n");
  log(colors.cyan, `  厂商可用性统计`);
  log(
    colors.green,
    `    ✅ 完全可用 (健康检查 + 数据获取): ${fetchSuccessCount}/${results.length}`,
  );
  log(
    colors.yellow,
    `    ⚠️  部分可用 (配置但不可用): ${authConfiguredCount - fetchSuccessCount}/${results.length}`,
  );
  log(
    colors.red,
    `    ❌ 不可用 (无配置): ${results.length - authConfiguredCount}/${results.length}`,
  );

  console.log("\n  详细结果:");
  for (const result of results) {
    const status = result.fetchUsage ? "✅" : result.healthCheck ? "⚠️" : "❌";
    const statusStr = result.fetchUsage
      ? "完全可用"
      : result.healthCheck
        ? "部分可用"
        : "不可用";
    log(
      colors.gray,
      `    ${status} ${result.provider.padEnd(15)} ${statusStr}`,
    );
    if (result.error) {
      log(colors.gray, `       错误: ${result.error}`);
    }
  }

  // ========================================================================
  // 第4部分: 建议
  // ========================================================================

  section("4. 建议和行动");

  const unconfigured = results.filter((r) => !r.hasAuth);
  if (unconfigured.length > 0) {
    log(colors.yellow, `\n  需要配置的厂商 (${unconfigured.length} 个):`);
    for (const result of unconfigured) {
      const key = getEnvKeyForProvider(result.provider);
      log(colors.yellow, `    - 配置 ${key} 来启用 ${result.provider}`);
    }
  }

  const unavailable = results.filter((r) => r.hasAuth && !r.fetchUsage);
  if (unavailable.length > 0) {
    log(colors.red, `\n  需要故障排查的厂商 (${unavailable.length} 个):`);
    for (const result of unavailable) {
      log(colors.red, `    - ${result.provider}: ${result.error}`);
    }
  }

  const available = results.filter((r) => r.fetchUsage);
  if (available.length > 0) {
    log(colors.green, `\n  ✅ 完全可用的厂商 (${available.length} 个):`);
    for (const result of available) {
      log(colors.green, `    - ${result.provider}`);
    }
  }

  // ========================================================================
  // 总体评分
  // ========================================================================

  section("5. 总体评分");

  const score = (fetchSuccessCount / results.length) * 100;
  const scoreColor =
    score === 100 ? colors.green : score >= 70 ? colors.yellow : colors.red;

  log(
    scoreColor,
    `\n  功能可用率: ${score.toFixed(1)}% (${fetchSuccessCount}/${results.length})\n`,
  );

  if (score === 100) {
    log(colors.green, "  🎉 所有功能都完全可用！");
  } else if (score >= 70) {
    log(colors.yellow, "  ⚠️  大部分功能可用，建议配置缺失的厂商");
  } else {
    log(colors.red, "  ❌ 需要配置更多厂商才能充分利用系统");
  }

  console.log("\n" + "=".repeat(80) + "\n");
}

// 运行测试
runTests().catch((e) => {
  log(colors.red, `\n❌ 测试异常: ${e.message}\n`);
  process.exit(1);
});
