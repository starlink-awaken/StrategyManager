import * as fs from "fs";
import * as path from "path";

export class ConfigLoader {
  /**
   * 从多个可能的配置文件加载完整配置
   */
  static loadAll(): any {
    const configDir = path.join(process.env.HOME || ".", ".config", "opencode");
    const shareDir = path.join(process.env.HOME || ".", ".local", "share", "opencode");

    const configs = {
      auth: this.loadAuthConfig(shareDir),
      opencode: this.loadOpencodeConfig(configDir),
      antigravity: this.loadAntigravityAccounts(configDir),
    };

    return this.mergeConfigs(configs);
  }

  private static loadAuthConfig(shareDir: string): any {
    const authPath = path.join(shareDir, "auth.json");
    if (fs.existsSync(authPath)) {
      return JSON.parse(fs.readFileSync(authPath, "utf-8"));
    }
    return {};
  }

  private static loadOpencodeConfig(configDir: string): any {
    const configPath = path.join(configDir, "opencode.json");
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, "utf-8"));
    }
    return {};
  }

  private static loadAntigravityAccounts(configDir: string): any {
    const accountsPath = path.join(configDir, "antigravity-accounts.json");
    if (fs.existsSync(accountsPath)) {
      return JSON.parse(fs.readFileSync(accountsPath, "utf-8"));
    }
    return {};
  }

  /**
   * 合并配置，优先级: auth.json > antigravity-accounts.json > opencode.json
   */
  private static mergeConfigs(configs: any): any {
    const merged: any = { ...configs.auth };

    if (configs.antigravity?.accounts) {
      const activeIndex = configs.antigravity.activeIndex ?? 0;
      const activeAccount = configs.antigravity.accounts[activeIndex];

      if (activeAccount) {
        merged.google = merged.google || {};
        merged.google.refresh = activeAccount.refreshToken;
        merged.google.projectId = activeAccount.projectId || activeAccount.managedProjectId;
        merged.google.email = activeAccount.email;
        merged.google.type = "oauth";

        if (activeAccount.refreshToken && activeAccount.projectId) {
          merged.google.refresh = `${activeAccount.refreshToken}|${activeAccount.projectId}`;
        }
      }
    }

    if (configs.opencode?.provider?.["zhipuai-coding-plan"]?.options?.apiKey) {
      merged.zhipu = merged.zhipu || {};
      merged.zhipu.key = configs.opencode.provider["zhipuai-coding-plan"].options.apiKey;
      merged.zhipu.type = "api-key";
    }

    return merged;
  }
}
