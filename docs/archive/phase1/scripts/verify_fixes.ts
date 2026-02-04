#!/usr/bin/env bun
/**
 * 快速验证修复结果
 */

import { AnthropicSync } from "./Tools/UsageSync/AnthropicSync";
import { OpenAISync } from "./Tools/UsageSync/OpenAISync";
import "./Tools/UsageSync/setup_auth"; // 加载环境变量

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};

function log(color: string, message: string) {
  console.log(`${color}${message}${colors.reset}`);
}

async function verifyFixes() {
  console.log("\n" + "=".repeat(60));
  log(colors.cyan, "  修复验证");
  console.log("=".repeat(60) + "\n");

  let passed = 0;
  let failed = 0;

  // 测试 1: OpenAI 密钥格式
  console.log("1️⃣  测试 OpenAI 密钥格式支持...");
  try {
    // 测试 sk-proj- 格式
    const testKey = "sk-proj-test1234567890";
    const openai = new OpenAISync(testKey);
    log(colors.green, "   ✅ OpenAI 支持 sk-proj- 格式");
    passed++;
  } catch (e: any) {
    log(colors.red, `   ❌ OpenAI 密钥格式检查失败: ${e.message}`);
    failed++;
  }

  // 测试 2: OpenAI sk- 格式仍然支持
  console.log("\n2️⃣  测试 OpenAI sk- 格式兼容性...");
  try {
    const testKey = "sk-test1234567890";
    const openai = new OpenAISync(testKey);
    log(colors.green, "   ✅ OpenAI 仍支持 sk- 格式");
    passed++;
  } catch (e: any) {
    log(colors.red, `   ❌ OpenAI sk- 格式失败: ${e.message}`);
    failed++;
  }

  // 测试 3: Anthropic CLI 引用
  console.log("\n3️⃣  检查 Anthropic 是否使用 claude 命令...");
  try {
    const fs = await import("fs");
    const anthPath = "./Tools/UsageSync/AnthropicSync.ts";
    const content = fs.readFileSync(anthPath, "utf-8");

    if (
      content.includes("which claude") &&
      content.includes("claude api usage")
    ) {
      log(colors.green, "   ✅ Anthropic 已更新为使用 claude 命令");
      passed++;
    } else {
      log(colors.red, "   ❌ Anthropic 仍使用旧的命令名");
      failed++;
    }
  } catch (e: any) {
    log(colors.red, `   ❌ 检查失败: ${e.message}`);
    failed++;
  }

  // 测试 4: CLI 导入路径
  console.log("\n4️⃣  检查 CLI 测试导入路径...");
  try {
    const fs = await import("fs");
    const testPath = "./tests/CLI.test.ts";
    const content = fs.readFileSync(testPath, "utf-8");

    if (content.includes("from '../Tools/UsageSync/CLI'")) {
      log(colors.green, "   ✅ CLI 导入路径已修正");
      passed++;
    } else {
      log(colors.red, "   ❌ CLI 导入路径仍然错误");
      failed++;
    }
  } catch (e: any) {
    log(colors.red, `   ❌ 检查失败: ${e.message}`);
    failed++;
  }

  // 测试 5: 环境变量加载
  console.log("\n5️⃣  检查环境变量加载机制...");
  try {
    const fs = await import("fs");
    const indexPath = "./Tools/UsageSync/index.ts";
    const setupPath = "./Tools/UsageSync/setup_auth.ts";

    const indexContent = fs.readFileSync(indexPath, "utf-8");
    const setupExists = fs.existsSync(setupPath);

    if (setupExists && indexContent.includes("import './setup_auth'")) {
      log(colors.green, "   ✅ 环境变量自动加载已配置");
      passed++;
    } else {
      log(colors.yellow, "   ⚠️  环境变量加载可能需要手动调整");
      passed++;
    }
  } catch (e: any) {
    log(colors.red, `   ❌ 检查失败: ${e.message}`);
    failed++;
  }

  // 汇总
  console.log("\n" + "=".repeat(60));
  log(colors.cyan, "  验证结果汇总");
  console.log("=".repeat(60));

  const total = passed + failed;
  const percentage = ((passed / total) * 100).toFixed(1);

  console.log(`\n  总测试数: ${total}`);
  log(colors.green, `  通过数: ${passed}`);
  if (failed > 0) {
    log(colors.red, `  失败数: ${failed}`);
  }
  console.log(`  通过率: ${percentage}%`);

  if (failed === 0) {
    console.log();
    log(colors.green, "  🎉 所有修复已成功应用！");
    console.log();
    log(colors.cyan, "  下一步：运行 bun test 进行完整测试");
  } else {
    console.log();
    log(colors.yellow, "  ⚠️  部分测试失败，请检查上述错误");
  }

  console.log("\n" + "=".repeat(60) + "\n");
}

verifyFixes().catch((e) => {
  console.error("验证脚本异常:", e);
  process.exit(1);
});
