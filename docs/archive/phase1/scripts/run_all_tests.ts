import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { execSync } from "child_process";

// 首先设置环境变量
const authFile = path.join(os.homedir(), ".local/share/opencode/auth.json");
const auth = JSON.parse(fs.readFileSync(authFile, "utf-8"));

const mappings: Record<string, [string, string]> = {
  ANTHROPIC_API_KEY: ["anthropic", "access"],
  OPENAI_API_KEY: ["openai", "access"],
  ZHIPU_API_KEY: ["zhipuai-coding-plan", "key"],
  GITHUB_TOKEN: ["github-models", "key"],
  GEMINI_API_KEY: ["google", "access"],
  DEEPSEEK_API_KEY: ["deepseek", "key"],
  OPENROUTER_API_KEY: ["openrouter", "key"],
};

// 设置环境变量
for (const [envVar, [vendor, field]] of Object.entries(mappings)) {
  const config = auth[vendor];
  if (config && config[field]) {
    process.env[envVar] = config[field];
  }
}

console.log("✓ 环境变量已设置\n");

// 现在运行 bun test
try {
  console.log("=".repeat(60));
  console.log("运行单元测试");
  console.log("=".repeat(60));
  console.log();

  const testOutput = execSync("bun test 2>&1", {
    cwd: process.cwd(),
    encoding: "utf-8",
    maxBuffer: 10 * 1024 * 1024,
    stdio: "pipe",
  });

  console.log(testOutput);
} catch (error: any) {
  console.error("测试执行出错:");
  console.error(error.stdout || error.message);
  process.exit(1);
}
