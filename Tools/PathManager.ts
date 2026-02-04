/**
 * PathManager.ts
 * 统一的路径管理系统
 */

import * as path from "path";
import * as fs from "fs";

export type PathMode = "user" | "project" | "custom";

export interface PathConfig {
  mode: PathMode;
  customConfigDir?: string;
  customStrategiesDir?: string;
}

/**
 * 路径管理器类
 * 统一管理配置文件和策略文件的路径
 */
export class PathManager {
  private mode: PathMode;
  private customConfigDir?: string;
  private customStrategiesDir?: string;

  constructor(config: PathConfig = { mode: "user" }) {
    this.mode = config.mode;
    this.customConfigDir = config.customConfigDir;
    this.customStrategiesDir = config.customStrategiesDir;
  }

  /**
   * 获取配置目录路径
   */
  getConfigDir(): string {
    if (this.customConfigDir) {
      return this.customConfigDir;
    }

    switch (this.mode) {
      case "user":
        return path.join(process.env.HOME || "", ".config", "opencode");
      case "project":
        return path.join(__dirname, "../.config");
      default:
        return path.join(process.env.HOME || "", ".config", "opencode");
    }
  }

  /**
   * 获取策略目录路径
   */
  getStrategiesDir(): string {
    if (this.customStrategiesDir) {
      return this.customStrategiesDir;
    }

    return path.join(this.getConfigDir(), "strategies");
  }

  /**
   * 获取模板目录路径（项目自带）
   */
  getTemplatesDir(): string {
    return path.join(__dirname, "../templates");
  }

  /**
   * 获取配置文件路径
   */
  getConfigFile(): string {
    return path.join(this.getConfigDir(), "oh-my-opencode.json");
  }

  /**
   * 获取历史记录文件路径
   */
  getHistoryFile(): string {
    return path.join(this.getConfigDir(), "strategy-history.json");
  }

  /**
   * 获取备份目录路径
   */
  getBackupDir(): string {
    return path.join(this.getConfigDir(), "backups");
  }

  /**
   * 确保目录存在
   */
  ensureDirectories(): void {
    const dirs = [
      this.getConfigDir(),
      this.getStrategiesDir(),
      this.getBackupDir(),
    ];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  /**
   * 获取策略文件完整路径
   */
  getStrategyFilePath(strategyName: string): string {
    return path.join(this.getStrategiesDir(), `${strategyName}.jsonc`);
  }

  /**
   * 获取模板文件完整路径
   */
  getTemplateFilePath(templateName: string): string {
    return path.join(this.getTemplatesDir(), `${templateName}.jsonc`);
  }

  /**
   * 列出所有可用的模板
   */
  listTemplates(): string[] {
    const templatesDir = this.getTemplatesDir();
    if (!fs.existsSync(templatesDir)) {
      return [];
    }

    return fs
      .readdirSync(templatesDir)
      .filter((file) => file.startsWith("strategy-") && file.endsWith(".jsonc"))
      .map((file) => path.basename(file, ".jsonc"));
  }

  /**
   * 列出所有已安装的策略
   */
  listInstalledStrategies(): string[] {
    const strategiesDir = this.getStrategiesDir();
    if (!fs.existsSync(strategiesDir)) {
      return [];
    }

    return fs
      .readdirSync(strategiesDir)
      .filter((file) => file.startsWith("strategy-") && file.endsWith(".jsonc"))
      .map((file) => path.basename(file, ".jsonc"));
  }

  /**
   * 检查策略是否已安装
   */
  isStrategyInstalled(strategyName: string): boolean {
    return fs.existsSync(this.getStrategyFilePath(strategyName));
  }

  /**
   * 获取当前模式描述
   */
  getModeDescription(): string {
    switch (this.mode) {
      case "user":
        return "用户模式（配置在 ~/.config/opencode/）";
      case "project":
        return "项目模式（配置在项目 .config/ 目录）";
      case "custom":
        return `自定义模式（配置在 ${this.customConfigDir}）`;
      default:
        return "未知模式";
    }
  }
}

/**
 * 默认路径管理器实例（用户模式）
 */
export const defaultPathManager = new PathManager({ mode: "user" });
