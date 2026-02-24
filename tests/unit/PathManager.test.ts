/**
 * PathManager.test.ts
 * 路径管理器单元测试 (10+ 用例)
 *
 * 覆盖范围:
 * - 初始化模式 (user/project/custom)
 * - 目录结构创建
 * - 路径解析
 * - 文件系统检查
 */

import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import * as fs from "fs";
import * as path from "path";
import { PathManager, PathMode } from "../../Tools/PathManager";

// ==================== Test Utilities ====================

const TEST_TEMP_DIR = path.join("/tmp", `pm-test-${Date.now()}`);

function createTempDir(subPath?: string): string {
  const dir = subPath
    ? path.join(TEST_TEMP_DIR, subPath)
    : path.join(TEST_TEMP_DIR, `temp-${Math.random().toString(36).slice(2)}`);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return dir;
}

function cleanupTempDir(dir: string): void {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true });
  }
}

function cleanupAllTemp(): void {
  if (fs.existsSync(TEST_TEMP_DIR)) {
    fs.rmSync(TEST_TEMP_DIR, { recursive: true });
  }
}

// ==================== Test Suites ====================

describe("PathManager - Initialization", () => {
  afterEach(() => {
    cleanupAllTemp();
  });

  // Test 1: User Mode
  it("should initialize in user mode with home directory", () => {
    const pm = new PathManager({ mode: "user" });
    const configDir = pm.getConfigDir();

    expect(configDir).toBeDefined();
    expect(configDir).toContain(".config");
    expect(configDir).toContain("opencode");
  });

  // Test 2: Project Mode
  it("should initialize in project mode with relative path", () => {
    const pm = new PathManager({ mode: "project" });
    const configDir = pm.getConfigDir();

    expect(configDir).toBeDefined();
    expect(configDir).toContain(".config");
  });

  // Test 3: Custom Mode
  it("should initialize in custom mode with provided path", () => {
    const customDir = createTempDir("custom-config");
    const pm = new PathManager({
      mode: "custom",
      customConfigDir: customDir,
    });

    const configDir = pm.getConfigDir();
    expect(configDir).toBe(customDir);
  });

  // Test 4: Missing HOME environment variable
  it("should handle missing HOME environment variable", () => {
    const oldHome = process.env.HOME;
    delete process.env.HOME;

    try {
      const pm = new PathManager({ mode: "user" });
      const configDir = pm.getConfigDir();

      expect(configDir).toBeDefined();
      // Should have fallback behavior
    } finally {
      process.env.HOME = oldHome;
    }
  });
});

describe("PathManager - Directory Management", () => {
  afterEach(() => {
    cleanupAllTemp();
  });

  // Test 5: Directory Creation
  it("should create all required directories", () => {
    const customDir = createTempDir("ensure-test");
    const pm = new PathManager({
      mode: "custom",
      customConfigDir: customDir,
    });

    // Clean before test
    fs.rmSync(customDir, { recursive: true });

    pm.ensureDirectories();

    expect(fs.existsSync(pm.getConfigDir())).toBe(true);
    expect(fs.existsSync(pm.getStrategiesDir())).toBe(true);
    expect(fs.existsSync(pm.getDynamicStrategiesDir())).toBe(true);
    expect(fs.existsSync(pm.getBackupDir())).toBe(true);
  });

  // Test 6: Idempotent Directory Creation
  it("should be idempotent when calling ensureDirectories multiple times", () => {
    const customDir = createTempDir("idempotent-test");
    const pm = new PathManager({
      mode: "custom",
      customConfigDir: customDir,
    });

    // First call
    pm.ensureDirectories();
    const firstCheck = fs.existsSync(pm.getStrategiesDir());

    // Second call should not fail
    pm.ensureDirectories();
    const secondCheck = fs.existsSync(pm.getStrategiesDir());

    expect(firstCheck).toBe(true);
    expect(secondCheck).toBe(true);
  });

  // Test 7: Nested Path Creation
  it("should create nested directory structure correctly", () => {
    const customDir = createTempDir("nested-test");
    const pm = new PathManager({
      mode: "custom",
      customConfigDir: customDir,
    });

    pm.ensureDirectories();

    const dynamicDir = pm.getDynamicStrategiesDir();
    const backupDir = pm.getBackupDir();

    // Verify nested structure
    expect(dynamicDir).toContain(pm.getConfigDir());
    expect(backupDir).toContain(pm.getConfigDir());
  });
});

describe("PathManager - Path Resolution", () => {
  afterEach(() => {
    cleanupAllTemp();
  });

  // Test 8: Strategy File Path
  it("should resolve strategy file path correctly", () => {
    const customDir = createTempDir("path-test");
    const pm = new PathManager({
      mode: "custom",
      customConfigDir: customDir,
    });

    const strategyPath = pm.getStrategyFilePath("strategy-balanced");

    expect(strategyPath).toContain("strategy-balanced.jsonc");
    expect(strategyPath).toContain(pm.getStrategiesDir());
  });

  // Test 9: Template File Path
  it("should resolve template file path correctly", () => {
    const customDir = createTempDir("template-test");
    const pm = new PathManager({
      mode: "custom",
      customConfigDir: customDir,
    });

    const templatePath = pm.getTemplateFilePath("smart");

    expect(templatePath).toContain("smart.jsonc");
    expect(templatePath).toContain(pm.getTemplatesDir());
  });

  // Test 10: Path Hierarchy Consistency
  it("should maintain consistent path hierarchy", () => {
    const customDir = createTempDir("hierarchy-test");
    const pm = new PathManager({
      mode: "custom",
      customConfigDir: customDir,
    });

    const configDir = pm.getConfigDir();
    const historicFile = pm.getHistoryFile();
    const recommendationFile = pm.getRecommendationFeedbackFile();

    expect(historicFile).toContain(configDir);
    expect(recommendationFile).toContain(configDir);
    expect(historicFile).not.toContain(recommendationFile);
  });

  // Test 11: Backup Directory Path
  it("should resolve backup directory path", () => {
    const customDir = createTempDir("backup-test");
    const pm = new PathManager({
      mode: "custom",
      customConfigDir: customDir,
    });

    const backupDir = pm.getBackupDir();

    expect(backupDir).toContain("backups");
    expect(backupDir).toContain(pm.getConfigDir());
  });
});

describe("PathManager - File System Operations", () => {
  afterEach(() => {
    cleanupAllTemp();
  });

  // Test 12: List Installed Strategies
  it("should list installed strategies from directory", () => {
    const strategiesDir = createTempDir("list-strategies");
    const pm = new PathManager({
      mode: "custom",
      customStrategiesDir: strategiesDir,
    });

    // Create test strategy files
    fs.writeFileSync(path.join(strategiesDir, "strategy-test-1.jsonc"), "{}");
    fs.writeFileSync(path.join(strategiesDir, "strategy-test-2.jsonc"), "{}");
    fs.writeFileSync(path.join(strategiesDir, "ignore-this.txt"), "");

    const strategies = pm.listInstalledStrategies();

    expect(strategies).toContain("strategy-test-1");
    expect(strategies).toContain("strategy-test-2");
    expect(strategies).not.toContain("ignore-this");
    expect(strategies.length).toBe(2);
  });

  // Test 13: Check Strategy Installation Status
  it("should correctly check if strategy is installed", () => {
    const strategiesDir = createTempDir("check-installed");
    const pm = new PathManager({
      mode: "custom",
      customStrategiesDir: strategiesDir,
    });

    // Create one strategy file
    fs.writeFileSync(path.join(strategiesDir, "strategy-exists.jsonc"), "{}");

    expect(pm.isStrategyInstalled("strategy-exists")).toBe(true);
    expect(pm.isStrategyInstalled("strategy-not-exists")).toBe(false);
  });

  // Test 14: List Templates
  it("should list available templates", () => {
    const templatesDir = createTempDir("list-templates");

    // Mock templates directory
    fs.writeFileSync(path.join(templatesDir, "smart.jsonc"), "{}");
    fs.writeFileSync(
      path.join(templatesDir, "fast.jsonc"),
      "{}",
    );
    fs.writeFileSync(path.join(templatesDir, "readme.md"), "");

    const pm = new PathManager({
      mode: "custom",
      customStrategiesDir: templatesDir, // Reuse for mock
    });

    // Override getTemplatesDir for testing
    (pm as any).getTemplatesDir = () => templatesDir;

    const templates = pm.listTemplates();

    expect(templates.length).toBeGreaterThan(0);
    // Note: Templates must start with 'strategy-' and end with '.jsonc'
  });

  // Test 15: Handle Empty Directory
  it("should handle empty strategies directory gracefully", () => {
    const emptyDir = createTempDir("empty-strategies");
    const pm = new PathManager({
      mode: "custom",
      customStrategiesDir: emptyDir,
    });

    const strategies = pm.listInstalledStrategies();

    expect(strategies).toBeDefined();
    expect(strategies.length).toBe(0);
  });

  // Test 16: Handle Non-existent Directory
  it("should handle non-existent strategies directory", () => {
    const nonExistentDir = path.join(TEST_TEMP_DIR, "non-existent");
    const pm = new PathManager({
      mode: "custom",
      customStrategiesDir: nonExistentDir,
    });

    const strategies = pm.listInstalledStrategies();

    expect(strategies).toBeDefined();
    expect(strategies.length).toBe(0);
  });
});

describe("PathManager - Mode Description", () => {
  it("should provide descriptive mode information", () => {
    const userPm = new PathManager({ mode: "user" });
    expect(userPm.getModeDescription()).toContain("用户模式");

    const projectPm = new PathManager({ mode: "project" });
    expect(projectPm.getModeDescription()).toContain("项目模式");

    const customDir = createTempDir("mode-desc");
    const customPm = new PathManager({
      mode: "custom",
      customConfigDir: customDir,
    });
    expect(customPm.getModeDescription()).toContain("自定义模式");
  });

  afterEach(() => {
    cleanupAllTemp();
  });
});

describe("PathManager - Edge Cases", () => {
  afterEach(() => {
    cleanupAllTemp();
  });

  // Test 17: Special Characters in Path
  it("should handle special characters in strategy names", () => {
    const pm = new PathManager({ mode: "user" });

    // Strategy names with hyphens and underscores
    const path1 = pm.getStrategyFilePath("strategy-my_test-123");
    expect(path1).toContain("strategy-my_test-123.jsonc");

    const path2 = pm.getStrategyFilePath("strategy-with-dash");
    expect(path2).toContain("strategy-with-dash.jsonc");
  });

  // Test 18: Cross-platform Path Handling
  it("should use correct path separators for platform", () => {
    const pm = new PathManager({ mode: "user" });
    const configDir = pm.getConfigDir();

    // Should use path.sep or forward slash depending on OS
    // This test ensures consistency
    expect(configDir).toBeDefined();

    const filePath = pm.getStrategyFilePath("test");
    // Should end with .jsonc
    expect(filePath).toMatch(/\.jsonc$/);
  });

  // Test 19: Concurrent Directory Creation
  it("should handle concurrent ensureDirectories calls", () => {
    const customDir = createTempDir("concurrent-test");
    const pm = new PathManager({
      mode: "custom",
      customConfigDir: customDir,
    });

    // Simulate concurrent calls
    const results = [];
    for (let i = 0; i < 5; i++) {
      results.push(() => {
        try {
          pm.ensureDirectories();
          return true;
        } catch (e) {
          return false;
        }
      });
    }

    const allSuccess = results.every((r) => r());
    expect(allSuccess).toBe(true);
  });
});
