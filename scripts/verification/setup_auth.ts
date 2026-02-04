import * as fs from "fs";
import * as path from "path";
import * as os from "os";

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

console.log("=".repeat(50));
console.log("设置环境变量");
console.log("=".repeat(50));
console.log();

for (const [envVar, [vendor, field]] of Object.entries(mappings)) {
  const config = auth[vendor];
  if (config && config[field]) {
    process.env[envVar] = config[field];
    console.log(`✓ ${envVar} = ${config[field].substring(0, 20)}...`);
  } else {
    console.log(`✗ ${envVar} not found`);
  }
}

console.log();
console.log("=".repeat(50));
console.log("已配置的凭证统计");
console.log("=".repeat(50));
console.log();

const configured = Object.entries(mappings).filter(
  ([, [vendor, field]]) => auth[vendor]?.[field],
);

console.log(`总配置数: ${configured.length}/${Object.keys(mappings).length}`);
console.log(`已配置: ${configured.map(([k]) => k).join(", ")}`);

const missing = Object.entries(mappings).filter(
  ([, [vendor, field]]) => !auth[vendor]?.[field],
);

if (missing.length > 0) {
  console.log(`缺失: ${missing.map(([k]) => k).join(", ")}`);
}
