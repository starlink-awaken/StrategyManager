import * as fs from "fs";
import * as path from "path";
import { UsageSyncCoordinator } from "./Tools/UsageSync/index";
import { AnthropicSync } from "./Tools/UsageSync/AnthropicSync";
import { OpenAISync } from "./Tools/UsageSync/OpenAISync";
import { ZhiPuSync } from "./Tools/UsageSync/ZhiPuSync";
import { GitHubSync } from "./Tools/UsageSync/GitHubSync";
import { GeminiSync } from "./Tools/UsageSync/GeminiSync";
import { DeepSeekSync, SiliconFlowSync } from "./Tools/UsageSync/LocalStatsSync";

async function main() {
  const authPath = path.join(
    process.env.HOME || ".",
    ".local",
    "share",
    "opencode",
    "auth.json",
  );

  if (!fs.existsSync(authPath)) {
    console.error("\x1b[31m✗ 认证文件不存在: " + authPath + "\x1b[0m");
    process.exit(1);
  }

  const auth = JSON.parse(fs.readFileSync(authPath, "utf-8"));
  const coordinator = new UsageSyncCoordinator();

  console.log("\x1b[36m📋 注册可用的同步器...\x1b[0m\n");

  // Anthropic
  if (auth.anthropic?.access) {
    try {
      const sync = AnthropicSync.fromOpenCodeAuth(auth.anthropic);
      coordinator.register(sync);
      console.log("  \x1b[32m✓ Anthropic\x1b[0m - 已注册");
    } catch (e: any) {
      console.log(`  \x1b[33m⚠ Anthropic\x1b[0m - ${e.message}`);
    }
  } else {
    console.log("  \x1b[33m⊘ Anthropic\x1b[0m - 未配置");
  }

  // OpenAI
  if (auth.openai?.access) {
    try {
      const sync = OpenAISync.fromOpenCodeAuth(auth.openai);
      coordinator.register(sync);
      console.log("  \x1b[32m✓ OpenAI\x1b[0m - 已注册");
    } catch (e: any) {
      console.log(`  \x1b[33m⚠ OpenAI\x1b[0m - ${e.message}`);
    }
  } else {
    console.log("  \x1b[33m⊘ OpenAI\x1b[0m - 未配置");
  }

  // ZhiPu
  if (auth["zhipu"]?.key || auth["zhipu"]?.access) {
    try {
      const sync = ZhiPuSync.fromOpenCodeAuth(auth["zhipu"]);
      coordinator.register(sync);
      console.log("  \x1b[32m✓ ZhiPu\x1b[0m - 已注册");
    } catch (e: any) {
      console.log(`  \x1b[33m⚠ ZhiPu\x1b[0m - ${e.message}`);
    }
  } else {
    console.log("  \x1b[33m⊘ ZhiPu\x1b[0m - 未配置");
  }

  // GitHub
  if (auth["github-copilot"]?.access || auth["github-models"]?.key) {
    try {
      const sync = GitHubSync.fromOpenCodeAuth(
        auth["github-copilot"] || auth["github-models"],
      );
      coordinator.register(sync);
      console.log("  \x1b[32m✓ GitHub\x1b[0m - 已注册");
    } catch (e: any) {
      console.log(`  \x1b[33m⚠ GitHub\x1b[0m - ${e.message}`);
    }
  } else {
    console.log("  \x1b[33m⊘ GitHub\x1b[0m - 未配置");
  }

  // Gemini
  if (auth.google?.access || auth.google?.refresh) {
    try {
      const sync = GeminiSync.fromOpenCodeAuth(auth.google);
      coordinator.register(sync);
      console.log("  \x1b[32m✓ Gemini\x1b[0m - 已注册");
    } catch (e: any) {
      console.log(`  \x1b[33m⚠ Gemini\x1b[0m - ${e.message}`);
    }
  } else {
    console.log("  \x1b[33m⊘ Gemini\x1b[0m - 未配置");
  }

  // DeepSeek
  if (auth.deepseek?.key) {
    try {
      const sync = new DeepSeekSync(auth.deepseek.key);
      coordinator.register(sync);
      console.log("  \x1b[32m✓ DeepSeek\x1b[0m - 已注册");
    } catch (e: any) {
      console.log(`  \x1b[33m⚠ DeepSeek\x1b[0m - ${e.message}`);
    }
  } else {
    console.log("  \x1b[33m⊘ DeepSeek\x1b[0m - 未配置");
  }

  // Silicon Flow
  try {
    const sync = new SiliconFlowSync();
    coordinator.register(sync);
    console.log("  \x1b[32m✓ Silicon Flow\x1b[0m - 已注册");
  } catch (e: any) {
    console.log(`  \x1b[33m⚠ Silicon Flow\x1b[0m - ${e.message}`);
  }

  const providers = coordinator.getProviders();
  console.log(`\n\x1b[36m📊 共注册 ${providers.length} 个同步器\x1b[0m`);
  console.log(`\x1b[36m可用平台: ${providers.join(", ")}\x1b[0m\n`);

  // 选择第一个可用平台进行测试同步
  if (providers.length === 0) {
    console.error("\x1b[31m✗ 没有可用的同步器\x1b[0m");
    process.exit(1);
  }

  const testProvider = providers[0];
  console.log(`\x1b[36m🔄 开始同步: ${testProvider}\x1b[0m\n`);

  const startTime = Date.now();

  try {
    const result = await coordinator.syncOne(testProvider);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log("\x1b[36m" + "=".repeat(60) + "\x1b[0m");
    console.log("\x1b[36m同步结果\x1b[0m");
    console.log("\x1b[36m" + "=".repeat(60) + "\x1b[0m\n");

    if (result.success && result.data) {
      console.log(`\x1b[32m✓ ${testProvider}\x1b[0m`);
      console.log(`  记录数: ${result.data.length}`);
      console.log(`  耗时: ${duration}s`);
      console.log(`  时间戳: ${result.timestamp.toISOString()}\n`);

      // 打印详细数据
      console.log("\x1b[36m📊 使用详情:\x1b[0m\n");
      for (const data of result.data) {
        console.log(`  \x1b[1m${data.model}\x1b[0m`);
        console.log(`    输入: ${data.usage.inputTokens.toLocaleString()} tokens`);
        console.log(`    输出: ${data.usage.outputTokens.toLocaleString()} tokens`);
        console.log(`    总计: ${data.usage.totalTokens.toLocaleString()} tokens`);
        if (data.usage.requests !== undefined) {
          console.log(`    请求: ${data.usage.requests}`);
        }
        if (data.cost !== undefined) {
          console.log(`    成本: $${data.cost.toFixed(4)}`);
        }
        console.log(`    来源: ${data.source}`);
        console.log(`    精确度: ${data.accuracy}%\n`);
      }
    } else {
      console.log(`\x1b[31m✗ ${testProvider}\x1b[0m`);
      console.log(`  错误: ${result.error}`);
      console.log(`  耗时: ${duration}s\n`);
    }
  } catch (error: any) {
    console.error(`\x1b[31m✗ 同步失败: ${error.message}\x1b[0m`);
    process.exit(1);
  }
}

main();
