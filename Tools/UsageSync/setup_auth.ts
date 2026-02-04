import * as fs from "fs";
import * as path from "path";
import * as os from "os";

/**
 * 从 opencode auth.json 加载凭证到环境变量
 * 用于 UsageSync 系统
 */
export function loadAuthFromJson(): void {
  const authPath = path.join(os.homedir(), ".local/share/opencode/auth.json");

  if (!fs.existsSync(authPath)) {
    console.warn(`⚠️  auth.json not found at ${authPath}`);
    return;
  }

  try {
    const authData = JSON.parse(fs.readFileSync(authPath, "utf-8"));

    // 映射表: auth.json 字段 → 环境变量名
    const envMapping: Record<string, [string, string]> = {
      ANTHROPIC_API_KEY: ["anthropic", "access"],
      OPENAI_API_KEY: ["openai", "access"],
      ZHIPU_API_KEY: ["zhipuai-coding-plan", "key"],
      GITHUB_TOKEN: ["github-models", "key"],
      GEMINI_API_KEY: ["google", "access"],
      DEEPSEEK_API_KEY: ["deepseek", "key"],
      OPENROUTER_API_KEY: ["openrouter", "key"],
    };

    // 加载凭证到环境变量（不覆盖已存在的）
    let loadedCount = 0;
    for (const [envVar, [vendor, field]] of Object.entries(envMapping)) {
      const config = authData[vendor];
      if (config && config[field] && !process.env[envVar]) {
        process.env[envVar] = config[field];
        loadedCount++;
      }
    }

    if (loadedCount > 0) {
      console.log(`✅ Loaded ${loadedCount} credentials from auth.json`);
    }
  } catch (e) {
    console.error("❌ Failed to load auth.json:", e);
  }
}

// 自动加载（如果作为模块导入）
if (typeof process !== "undefined" && process.env.NODE_ENV !== "test") {
  loadAuthFromJson();
}
