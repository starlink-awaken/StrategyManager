import * as fs from "fs";
import * as path from "path";

interface AuthConfig {
  openai?: {
    type: string;
    refresh?: string;
    access?: string;
    expires?: number;
  };
  google?: {
    type: string;
    refresh?: string;
    access?: string;
    expires?: number;
    email?: string;
    projectId?: string;
  };
  anthropic?: {
    type: string;
    refresh?: string;
    access?: string;
    expires?: number;
  };
}

async function refreshGoogleToken(
  refreshToken: string,
  projectId: string,
): Promise<{ access: string; expires: number }> {
  console.log("\x1b[36m🔄 刷新 Google OAuth token...\x1b[0m");

  let actualRefreshToken = refreshToken;
  if (refreshToken.includes("|")) {
    actualRefreshToken = refreshToken.split("|")[0];
    console.log(`  \x1b[90mℹ️  检测到复合格式，提取 token 部分\x1b[0m`);
  }

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET || "";

  if (!clientId || !clientSecret) {
    throw new Error(
      "Google OAuth credentials not found. Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET environment variables.",
    );
  }

  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: actualRefreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token refresh failed (${response.status}): ${error}`);
    }

    const data = (await response.json()) as any;
    const expiresIn = data.expires_in || 3600;
    const expiresAt = Date.now() + expiresIn * 1000;

    console.log(`  \x1b[32m✓ 新 access token 获取成功\x1b[0m`);
    console.log(`  \x1b[90m过期时间: ${new Date(expiresAt).toISOString()}\x1b[0m`);
    console.log(`  \x1b[90m有效期: ${expiresIn / 60} 分钟\x1b[0m\n`);

    return {
      access: data.access_token,
      expires: expiresAt,
    };
  } catch (error: any) {
    throw new Error(`Failed to refresh Google token: ${error.message}`);
  }
}

async function refreshOpenAIToken(
  refreshToken: string,
): Promise<{ access: string; expires: number }> {
  console.log("\x1b[36m🔄 刷新 OpenAI OAuth token...\x1b[0m");

  try {
    const response = await fetch("https://auth.openai.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token refresh failed (${response.status}): ${error}`);
    }

    const data = (await response.json()) as any;
    const expiresIn = data.expires_in || 3600;
    const expiresAt = Date.now() + expiresIn * 1000;

    console.log(`  \x1b[32m✓ 新 access token 获取成功\x1b[0m`);
    console.log(`  \x1b[90m过期时间: ${new Date(expiresAt).toISOString()}\x1b[0m`);
    console.log(`  \x1b[90m有效期: ${expiresIn / 60} 分钟\x1b[0m\n`);

    return {
      access: data.access_token,
      expires: expiresAt,
    };
  } catch (error: any) {
    throw new Error(`Failed to refresh OpenAI token: ${error.message}`);
  }
}

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

  console.log("\x1b[36m╔════════════════════════════════════════════════════════╗\x1b[0m");
  console.log("\x1b[36m║              OAuth Token 自动刷新工具                   ║\x1b[0m");
  console.log("\x1b[36m╚════════════════════════════════════════════════════════╝\x1b[0m\n");

  console.log(`\x1b[36m📂 读取配置: ${authPath}\x1b[0m\n`);

  const auth = JSON.parse(fs.readFileSync(authPath, "utf-8")) as AuthConfig;
  let modified = false;

  if (auth.google?.refresh) {
    const now = Date.now();
    const expires = auth.google.expires || 0;
    const isExpired = now >= expires;
    const willExpireSoon = now >= expires - 5 * 60 * 1000;

    console.log("\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m");
    console.log("\x1b[36m🔍 检查 Google (Gemini) Token\x1b[0m\n");
    console.log(`  当前时间: ${new Date(now).toISOString()}`);
    console.log(`  过期时间: ${new Date(expires).toISOString()}`);

    if (isExpired) {
      console.log(`  \x1b[31m状态: 已过期 (${((now - expires) / (24 * 60 * 60 * 1000)).toFixed(1)} 天前)\x1b[0m\n`);
    } else if (willExpireSoon) {
      console.log(`  \x1b[33m状态: 即将过期 (还剩 ${((expires - now) / 60000).toFixed(0)} 分钟)\x1b[0m\n`);
    } else {
      console.log(`  \x1b[32m状态: 有效 (还剩 ${((expires - now) / 60000).toFixed(0)} 分钟)\x1b[0m\n`);
    }

    if (isExpired || willExpireSoon) {
      try {
        const projectId = auth.google.projectId || "";
        const newToken = await refreshGoogleToken(auth.google.refresh, projectId);
        auth.google.access = newToken.access;
        auth.google.expires = newToken.expires;
        modified = true;
      } catch (error: any) {
        console.error(`\x1b[31m✗ Google token 刷新失败: ${error.message}\x1b[0m\n`);
      }
    }
  } else {
    console.log("\x1b[33m⊘ Google 未配置 refresh token\x1b[0m\n");
  }

  if (auth.openai?.refresh) {
    const now = Date.now();
    const expires = auth.openai.expires || 0;
    const isExpired = now >= expires;
    const willExpireSoon = now >= expires - 5 * 60 * 1000;

    console.log("\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m");
    console.log("\x1b[36m🔍 检查 OpenAI Token\x1b[0m\n");
    console.log(`  当前时间: ${new Date(now).toISOString()}`);
    console.log(`  过期时间: ${new Date(expires).toISOString()}`);

    if (isExpired) {
      console.log(`  \x1b[31m状态: 已过期 (${((now - expires) / (24 * 60 * 60 * 1000)).toFixed(1)} 天前)\x1b[0m\n`);
    } else if (willExpireSoon) {
      console.log(`  \x1b[33m状态: 即将过期 (还剩 ${((expires - now) / 60000).toFixed(0)} 分钟)\x1b[0m\n`);
    } else {
      console.log(`  \x1b[32m状态: 有效 (还剩 ${((expires - now) / 60000).toFixed(0)} 分钟)\x1b[0m\n`);
    }

    if (isExpired || willExpireSoon) {
      try {
        const newToken = await refreshOpenAIToken(auth.openai.refresh);
        auth.openai.access = newToken.access;
        auth.openai.expires = newToken.expires;
        modified = true;
      } catch (error: any) {
        console.error(`\x1b[31m✗ OpenAI token 刷新失败: ${error.message}\x1b[0m\n`);
      }
    }
  } else {
    console.log("\x1b[33m⊘ OpenAI 未配置 refresh token\x1b[0m\n");
  }

  if (modified) {
    console.log("\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m");
    console.log("\x1b[36m💾 保存更新后的配置...\x1b[0m\n");

    fs.writeFileSync(authPath, JSON.stringify(auth, null, 2), "utf-8");

    console.log(`\x1b[32m✓ 配置已更新: ${authPath}\x1b[0m\n`);
  } else {
    console.log("\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m");
    console.log("\x1b[32m✓ 所有 token 均有效，无需刷新\x1b[0m\n");
  }
}

main();
