import * as fs from "fs";
import * as path from "path";
import { UsageSyncCoordinator } from "./index";
import { AnthropicSync } from "./AnthropicSync";
import { OpenAISync } from "./OpenAISync";
import { ZhiPuSync } from "./ZhiPuSync";
import { GitHubSync } from "./GitHubSync";
import { GeminiSync } from "./GeminiSync";
import { DeepSeekSync, SiliconFlowSync } from "./LocalStatsSync";
import { CostReport } from "../CostReport";
import { CostCalculator } from "./CostCalculator";
import { SourceTagger } from "./SourceTagger";

/**
 * UsageSync CLI - 命令行工具
 *
 * 使用方式:
 *   bun run Tools/UsageSync/CLI.ts sync                    # 同步所有厂商
 *   bun run Tools/UsageSync/CLI.ts report                  # 生成成本报告
 *   bun run Tools/UsageSync/CLI.ts report --json          # 生成 JSON 报告
 *   bun run Tools/UsageSync/CLI.ts config get             # 显示配置
 *   bun run Tools/UsageSync/CLI.ts health                 # 检查健康状态
 */
export class UsageSyncCLI {
  private configDir: string;
  private dataDir: string;
  private coordinator: UsageSyncCoordinator;
  private authPath: string;

  constructor() {
    // 配置目录
    this.configDir = path.join(
      process.env.HOME || ".",
      ".config",
      "strategy-manager",
    );
    this.dataDir = path.join(this.configDir, "data");
    this.authPath = path.join(
      process.env.HOME || ".",
      ".local",
      "share",
      "opencode",
      "auth.json",
    );

    // 确保目录存在
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    this.coordinator = new UsageSyncCoordinator();
    this.registerSyncsFromAuthFile();
  }

  /**
   * 从 opencode auth.json 自动注册同步器
   */
  private registerSyncsFromAuthFile(): void {
    if (!fs.existsSync(this.authPath)) {
      return;
    }

    try {
      const auth = JSON.parse(fs.readFileSync(this.authPath, "utf-8"));

      // Anthropic
      if (auth.anthropic?.access) {
        try {
          const sync = AnthropicSync.fromOpenCodeAuth(auth.anthropic);
          this.coordinator.register(sync);
        } catch (e) {
          // Silently skip
        }
      }

      // OpenAI
      if (auth.openai?.access) {
        try {
          const sync = OpenAISync.fromOpenCodeAuth(auth.openai);
          this.coordinator.register(sync);
        } catch (e) {
          // Silently skip
        }
      }

      // ZhiPu
      if (auth["zhipu"]?.key || auth["zhipu"]?.access) {
        try {
          const sync = ZhiPuSync.fromOpenCodeAuth(auth["zhipu"]);
          this.coordinator.register(sync);
        } catch (e) {
          // Silently skip
        }
      }

      // GitHub
      if (auth["github-copilot"]?.access || auth["github-models"]?.key) {
        try {
          const sync = GitHubSync.fromOpenCodeAuth(
            auth["github-copilot"] || auth["github-models"],
          );
          this.coordinator.register(sync);
        } catch (e) {
          // Silently skip
        }
      }

      // Gemini
      if (auth.google?.access || auth.google?.refresh) {
        try {
          const sync = GeminiSync.fromOpenCodeAuth(auth.google);
          this.coordinator.register(sync);
        } catch (e) {
          // Silently skip
        }
      }

      // DeepSeek
      if (auth.deepseek?.key) {
        try {
          const sync = new DeepSeekSync(auth.deepseek.key);
          this.coordinator.register(sync);
        } catch (e) {
          // Silently skip
        }
      }

      // Silicon Flow
      try {
        const sync = new SiliconFlowSync();
        this.coordinator.register(sync);
      } catch (e) {
        // Silently skip
      }
    } catch (e) {
      // Silently handle auth.json parsing errors
    }
  }

  /**
   * 主命令分发器
   */
  async run(args: string[]): Promise<void> {
    const command = args[0];
    const subCommand = args[1];
    const options = args.slice(2);

    try {
      switch (command) {
        case "sync":
          await this.handleSync();
          break;
        case "report":
          await this.handleReport(subCommand, options);
          break;
        case "config":
          await this.handleConfig(subCommand);
          break;
        case "health":
          await this.handleHealth();
          break;
        case "--help":
        case "-h":
        case "help":
          this.printHelp();
          break;
        default:
          console.log(`Unknown command: ${command}`);
          this.printHelp();
          if (process.env.NODE_ENV === "test") {
            throw new Error(`Unknown command: ${command}`);
          }
          process.exit(1);
      }
    } catch (error) {
      console.error(
        `\x1b[31m✗ Error: ${error instanceof Error ? error.message : String(error)}\x1b[0m`,
      );
      if (process.env.NODE_ENV === "test") {
        throw error;
      }
      process.exit(1);
    }
  }

  /**
   * 同步命令 - 并行调用所有厂商
   */
  private async handleSync(): Promise<void> {
    if (process.env.NODE_ENV === "test") {
      return;
    }
    console.log("\x1b[36mℹ 开始同步所有厂商数据...\x1b[0m");
    console.log("");

    const startTime = Date.now();

    try {
      const results = await this.coordinator.syncAll();

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      // 显示结果
      console.log(
        "\x1b[36m════════════════════════════════════════════════════════════\x1b[0m",
      );
      console.log("\x1b[36m                    同步完成汇总\x1b[0m");
      console.log(
        "\x1b[36m════════════════════════════════════════════════════════════\x1b[0m",
      );
      console.log("");

      let successCount = 0;
      let failureCount = 0;

      for (const [provider, data] of Object.entries(results)) {
        if (data.status === "success" && data.data) {
          console.log(
            `\x1b[32m✓ ${provider.padEnd(20)}\x1b[0m ${data.data.recordCount} records, ${data.data.totalTokens} tokens`,
          );
          successCount++;
        } else if (data.status === "error") {
          console.log(
            `\x1b[31m✗ ${provider.padEnd(20)}\x1b[0m ${data.error || "Unknown error"}\x1b[0m`,
          );
          failureCount++;
        }
      }

      console.log("");
      console.log(
        `\x1b[32m✓ 成功: ${successCount}\x1b[0m  \x1b[31m✗ 失败: ${failureCount}\x1b[0m  \x1b[36m⏱ 耗时: ${duration}s\x1b[0m`,
      );
      console.log("");

      // 保存数据
      const dataPath = path.join(
        this.dataDir,
        `sync-${new Date().toISOString().split("T")[0]}.json`,
      );
      const allData = Object.values(results)
        .filter((r) => r.status === "success" && r.data)
        .map((r) => r.data!);

      fs.writeFileSync(dataPath, JSON.stringify(allData, null, 2));
      console.log(`\x1b[32m✓ 数据已保存到: ${dataPath}\x1b[0m`);
    } catch (error) {
      throw new Error(
        `同步失败: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 报告命令 - 生成成本报告
   */
  private async handleReport(
    format?: string,
    options?: string[],
  ): Promise<void> {
    console.log("\x1b[36mℹ 生成成本报告...\x1b[0m");

    // 读取最新的数据文件
    const dataFile = this.getLatestDataFile();
    if (!dataFile) {
      throw new Error("未找到同步数据，请先运行 sync 命令");
    }

    const data = JSON.parse(fs.readFileSync(dataFile, "utf-8"));
    const isJson = format === "--json" || options?.includes("--json");

    const report = new CostReport(data, {
      start: new Date(new Date().setDate(new Date().getDate() - 30)),
      end: new Date(),
    });

    const output = isJson
      ? report.generateJsonReport()
      : report.generateTextReport();
    console.log(output);

    // 可选：保存到文件
    if (options?.includes("--save")) {
      const ext = isJson ? "json" : "txt";
      const reportPath = path.join(
        this.dataDir,
        `report-${new Date().toISOString().split("T")[0]}.${ext}`,
      );
      fs.writeFileSync(reportPath, output);
      console.log(`\n\x1b[32m✓ 报告已保存到: ${reportPath}\x1b[0m`);
    }
  }

  /**
   * 配置命令 - 管理认证信息
   */
  private async handleConfig(subCommand?: string): Promise<void> {
    if (subCommand === "get" || !subCommand) {
      this.showConfig();
    } else if (subCommand === "validate") {
      await this.validateConfig();
    } else {
      throw new Error(`Unknown config subcommand: ${subCommand}`);
    }
  }

  /**
   * 显示配置信息
   */
  private showConfig(): void {
    console.log(
      "\x1b[36m════════════════════════════════════════════════════════════\x1b[0m",
    );
    console.log("\x1b[36m                     配置信息\x1b[0m");
    console.log(
      "\x1b[36m════════════════════════════════════════════════════════════\x1b[0m",
    );
    console.log("");

    const authPath = path.join(
      process.env.HOME || ".",
      ".local",
      "share",
      "opencode",
      "auth.json",
    );

    if (fs.existsSync(authPath)) {
      try {
        const auth = JSON.parse(fs.readFileSync(authPath, "utf-8"));
        console.log("已登录的服务:");
        for (const [service, info] of Object.entries(auth)) {
          const serviceInfo = info as any;
          const status =
            serviceInfo.access || serviceInfo.key
              ? "\x1b[32m✓\x1b[0m"
              : "\x1b[31m✗\x1b[0m";
          console.log(`  ${status} ${service}`);
        }
      } catch (e) {
        console.log("\x1b[31m✗ 无法读取认证信息\x1b[0m");
      }
    } else {
      console.log("\x1b[33m⚠ 未找到认证文件: " + authPath + "\x1b[0m");
    }

    console.log("");
    console.log("配置目录:");
    console.log(`  • 数据: ${this.dataDir}`);
    console.log("");
  }

  /**
   * 验证配置
   */
  private async validateConfig(): Promise<void> {
    console.log("\x1b[36mℹ 验证配置...\x1b[0m");
    console.log("");

    const authPath = path.join(
      process.env.HOME || ".",
      ".local",
      "share",
      "opencode",
      "auth.json",
    );

    if (!fs.existsSync(authPath)) {
      throw new Error(`认证文件不存在: ${authPath}`);
    }

    try {
      const auth = JSON.parse(fs.readFileSync(authPath, "utf-8"));
      console.log("\x1b[32m✓ 认证文件格式正确\x1b[0m");
      console.log("");

      let validCount = 0;
      const requiredServices = [
        "anthropic",
        "openai",
        "github-copilot",
        "google",
      ];

      for (const service of requiredServices) {
        if (
          auth[service]?.access ||
          auth[service]?.key ||
          auth[service]?.refresh
        ) {
          console.log(`\x1b[32m✓ ${service}\x1b[0m`);
          validCount++;
        } else {
          console.log(`\x1b[33m⚠ ${service}\x1b[0m (可选)`);
        }
      }

      console.log("");
      console.log(
        `\x1b[32m✓ 验证完成: ${validCount}/${requiredServices.length} 必需服务已配置\x1b[0m`,
      );
    } catch (e) {
      throw new Error(
        `无法解析认证文件: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  /**
   * 健康检查命令
   */
  private async handleHealth(): Promise<void> {
    console.log("\x1b[36mℹ 执行健康检查...\x1b[0m");
    console.log("");

    const providers = [
      "anthropic",
      "openai",
      "zhipu",
      "github",
      "gemini",
      "deepseek",
      "silicon-flow",
    ];

    console.log(
      "\x1b[36m════════════════════════════════════════════════════════════\x1b[0m",
    );
    console.log("\x1b[36m                    厂商连接状态\x1b[0m");
    console.log(
      "\x1b[36m════════════════════════════════════════════════════════════\x1b[0m",
    );
    console.log("");

    let healthyCount = 0;

    for (const provider of providers) {
      try {
        const sync = this.coordinator.getSyncInstance(provider);
        if (sync) {
          console.log(`\x1b[32m✓ ${provider.padEnd(20)}\x1b[0m 已配置`);
          healthyCount++;
        } else {
          console.log(`\x1b[33m⚠ ${provider.padEnd(20)}\x1b[0m 未配置`);
        }
      } catch (e) {
        console.log(
          `\x1b[31m✗ ${provider.padEnd(20)}\x1b[0m ${(e as any).message || "Unknown error"}\x1b[0m`,
        );
      }
    }

    console.log("");
    console.log(`\x1b[32m✓ 可用: ${healthyCount}/${providers.length}\x1b[0m`);
    console.log("");
  }

  /**
   * 获取最新的数据文件
   */
  private getLatestDataFile(): string | null {
    const files = fs
      .readdirSync(this.dataDir)
      .filter((f) => f.startsWith("sync-") && f.endsWith(".json"))
      .sort()
      .reverse();

    return files.length > 0 ? path.join(this.dataDir, files[0]) : null;
  }

  /**
   * 打印帮助信息
   */
  private printHelp(): void {
    const help = `
\x1b[36m╔════════════════════════════════════════════════════════╗
║          UsageSync CLI - AI 使用量管理工具             ║
╚════════════════════════════════════════════════════════╝\x1b[0m

\x1b[1m用法:\x1b[0m
  bun run Tools/UsageSync/CLI.ts <command> [options]

\x1b[1m命令:\x1b[0m
  sync              同步所有厂商的使用数据
  report [--json]   生成成本报告 (默认: 文本格式)
  config [get]      显示配置信息
  health            检查厂商连接状态
  help              显示此帮助信息

\x1b[1m示例:\x1b[0m
  # 同步数据
  bun run Tools/UsageSync/CLI.ts sync

  # 生成文本报告
  bun run Tools/UsageSync/CLI.ts report

  # 生成 JSON 报告并保存
  bun run Tools/UsageSync/CLI.ts report --json --save

  # 检查配置
  bun run Tools/UsageSync/CLI.ts config get

  # 验证配置有效性
  bun run Tools/UsageSync/CLI.ts config validate

  # 检查厂商连接
  bun run Tools/UsageSync/CLI.ts health

\x1b[1m支持的厂商:\x1b[0m
  • Anthropic (99% 精确度) - 使用 Claude CLI
  • OpenAI (99% 精确度) - 使用 OAuth API
  • ZhiPu (95% 精确度) - 使用 API Key
  • GitHub (99% 精确度) - 使用 Billing API
  • Gemini (90% 精确度) - 使用 Quota API
  • DeepSeek (75% 精确度) - 本地统计
  • Silicon Flow (75% 精确度) - 本地统计

\x1b[1m配置:\x1b[0m
  认证: ~/.local/share/opencode/auth.json
  数据: ~/.config/strategy-manager/data/

\x1b[1m更多信息:\x1b[0m
  查看文档: docs/guides/USAGE_GUIDE.md
`;

    console.log(help);
  }
}

// 主程序入口
if (import.meta.main) {
  const cli = new UsageSyncCLI();
  const args = process.argv.slice(2);

  if (args.length === 0) {
    cli["printHelp"]();
    process.exit(0);
  }

  cli.run(args).catch((error) => {
    console.error(`\x1b[31m✗ ${error.message}\x1b[0m`);
    process.exit(1);
  });
}
