/**
 * P1 深度功能复核脚本
 *
 * 验证所有 P1 功能的可用性和完整性
 */

import * as fs from "fs";
import * as path from "path";

// 颜色输出
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

interface ReviewResult {
  category: string;
  items: {
    name: string;
    status: "pass" | "fail" | "warn" | "skip";
    message: string;
    details?: string;
  }[];
}

const results: ReviewResult[] = [];

function log(color: string, message: string) {
  console.log(`${color}${message}${colors.reset}`);
}

function section(title: string) {
  console.log("\n" + "=".repeat(80));
  log(colors.cyan, `  ${title}`);
  console.log("=".repeat(80));
}

function item(
  status: "pass" | "fail" | "warn" | "skip",
  name: string,
  message: string,
  details?: string,
) {
  const icons = {
    pass: "✅",
    fail: "❌",
    warn: "⚠️ ",
    skip: "⏭️ ",
  };

  const statusColors = {
    pass: colors.green,
    fail: colors.red,
    warn: colors.yellow,
    skip: colors.gray,
  };

  log(statusColors[status], `  ${icons[status]} ${name}: ${message}`);
  if (details) {
    log(colors.gray, `     ${details}`);
  }

  return { status, name, message, details };
}

// ============================================================================
// 第1部分: 文件结构检查
// ============================================================================

section("1. 文件结构验证");

const requiredFiles = [
  "Tools/UsageSync/index.ts",
  "Tools/UsageSync/interfaces.ts",
  "Tools/UsageSync/CLI.ts",
  "Tools/UsageSync/CostCalculator.ts",
  "Tools/UsageSync/Validator.ts",
  "Tools/UsageSync/SourceTagger.ts",
  "Tools/UsageSync/AnthropicSync.ts",
  "Tools/UsageSync/OpenAISync.ts",
  "Tools/UsageSync/ZhiPuSync.ts",
  "Tools/UsageSync/GitHubSync.ts",
  "Tools/UsageSync/GeminiSync.ts",
  "Tools/UsageSync/LocalStatsSync.ts",
  "Tools/CostReport.ts",
  "Tools/ManageStrategies.ts",
  "Tests/UsageSync.test.ts",
  "Tests/DataProcessing.test.ts",
  "docs/guides/API_REFERENCE.md",
  "docs/guides/BEST_PRACTICES.md",
  "docs/guides/CONFIGURATION.md",
  "docs/guides/TROUBLESHOOTING.md",
  "docs/guides/FAQ.md",
  "docs/guides/INDEX.md",
];

let fileCheckResults: ReviewResult = {
  category: "文件结构",
  items: [],
};

for (const file of requiredFiles) {
  const filePath = path.join(process.cwd(), file);
  const exists = fs.existsSync(filePath);

  fileCheckResults.items.push(
    item(
      exists ? "pass" : "fail",
      `${path.basename(file)}`,
      exists ? "存在" : "缺失",
      file,
    ),
  );
}

results.push(fileCheckResults);

// ============================================================================
// 第2部分: 代码完整性检查
// ============================================================================

section("2. 核心模块完整性检查");

let codeCheckResults: ReviewResult = {
  category: "代码完整性",
  items: [],
};

// 检查 UsageSync 接口实现
const syncModules = [
  "AnthropicSync",
  "OpenAISync",
  "ZhiPuSync",
  "GitHubSync",
  "GeminiSync",
  "DeepSeekSync",
  "SiliconFlowSync",
];

for (const module of syncModules) {
  const filePath = path.join(
    process.cwd(),
    module === "DeepSeekSync" || module === "SiliconFlowSync"
      ? "Tools/UsageSync/LocalStatsSync.ts"
      : `Tools/UsageSync/${module}.ts`,
  );

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const hasProvider = content.includes("provider =");
    const hasAccuracy = content.includes("accuracy =");
    const hasFetchUsage = content.includes("fetchUsage");
    const hasHealthCheck = content.includes("healthCheck");

    const allChecks =
      hasProvider && hasAccuracy && hasFetchUsage && hasHealthCheck;

    codeCheckResults.items.push(
      item(
        allChecks ? "pass" : "warn",
        module,
        allChecks ? "接口完整" : "缺少部分方法",
        `provider=${hasProvider}, accuracy=${hasAccuracy}, fetchUsage=${hasFetchUsage}, healthCheck=${hasHealthCheck}`,
      ),
    );
  } catch (e: any) {
    codeCheckResults.items.push(
      item("fail", module, "读取文件失败", e.message),
    );
  }
}

// 检查 CostCalculator
try {
  const content = fs.readFileSync(
    path.join(process.cwd(), "Tools/UsageSync/CostCalculator.ts"),
    "utf-8",
  );
  const hasPricing = content.includes("PRICING");
  const hasCalculateCost = content.includes("calculateCost");
  const hasGenerateReport = content.includes("generateCostReport");

  codeCheckResults.items.push(
    item(
      hasPricing && hasCalculateCost && hasGenerateReport ? "pass" : "warn",
      "CostCalculator",
      "成本计算模块",
      `pricing=${hasPricing}, calculateCost=${hasCalculateCost}, generateReport=${hasGenerateReport}`,
    ),
  );
} catch (e: any) {
  codeCheckResults.items.push(
    item("fail", "CostCalculator", "读取失败", e.message),
  );
}

// 检查 Validator
try {
  const content = fs.readFileSync(
    path.join(process.cwd(), "Tools/UsageSync/Validator.ts"),
    "utf-8",
  );
  const hasValidateUsageData = content.includes("validateUsageData");
  const hasDetectDuplicates = content.includes("detectDuplicates");
  const hasDetectAnomalies = content.includes("detectAnomalies");

  codeCheckResults.items.push(
    item(
      hasValidateUsageData && hasDetectDuplicates ? "pass" : "warn",
      "Validator",
      "数据验证模块",
      `validateUsageData=${hasValidateUsageData}, detectDuplicates=${hasDetectDuplicates}, detectAnomalies=${hasDetectAnomalies}`,
    ),
  );
} catch (e: any) {
  codeCheckResults.items.push(item("fail", "Validator", "读取失败", e.message));
}

// 检查 CLI
try {
  const content = fs.readFileSync(
    path.join(process.cwd(), "Tools/UsageSync/CLI.ts"),
    "utf-8",
  );
  const hasSync = content.includes("sync");
  const hasReport = content.includes("report");
  const hasConfig = content.includes("config");
  const hasHealth = content.includes("health");

  codeCheckResults.items.push(
    item(
      hasSync && hasReport && hasConfig && hasHealth ? "pass" : "warn",
      "UsageSyncCLI",
      "CLI 命令工具",
      `sync=${hasSync}, report=${hasReport}, config=${hasConfig}, health=${hasHealth}`,
    ),
  );
} catch (e: any) {
  codeCheckResults.items.push(
    item("fail", "UsageSyncCLI", "读取失败", e.message),
  );
}

results.push(codeCheckResults);

// ============================================================================
// 第3部分: 测试覆盖检查
// ============================================================================

section("3. 测试覆盖检查");

let testCheckResults: ReviewResult = {
  category: "测试覆盖",
  items: [],
};

const testFiles = [
  "tests/UsageSync.test.ts",
  "tests/DataProcessing.test.ts",
  "tests/CLI.test.ts",
];

for (const file of testFiles) {
  const filePath = path.join(process.cwd(), file);
  if (!fs.existsSync(filePath)) {
    testCheckResults.items.push(
      item("warn", path.basename(file), "测试文件不存在"),
    );
    continue;
  }

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const testCount =
      (content.match(/test\(/g) || []).length +
      (content.match(/it\(/g) || []).length;
    const hasDescribe = content.includes("describe");

    testCheckResults.items.push(
      item(
        testCount > 0 && hasDescribe ? "pass" : "warn",
        path.basename(file),
        testCount > 0 ? `包含 ${testCount} 个测试` : "测试数为 0",
        `${hasDescribe ? "有 describe 块" : "缺少 describe"}`,
      ),
    );
  } catch (e: any) {
    testCheckResults.items.push(
      item("fail", path.basename(file), "读取失败", e.message),
    );
  }
}

results.push(testCheckResults);

// ============================================================================
// 第4部分: 文档完整性检查
// ============================================================================

section("4. 文档完整性检查");

let docCheckResults: ReviewResult = {
  category: "文档",
  items: [],
};

const docs = [
  { file: "docs/guides/API_REFERENCE.md", minLines: 500 },
  { file: "docs/guides/BEST_PRACTICES.md", minLines: 400 },
  { file: "docs/guides/CONFIGURATION.md", minLines: 300 },
  { file: "docs/guides/TROUBLESHOOTING.md", minLines: 300 },
  { file: "docs/guides/FAQ.md", minLines: 200 },
  { file: "docs/guides/INDEX.md", minLines: 100 },
];

for (const doc of docs) {
  const filePath = path.join(process.cwd(), doc.file);
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n").length;
    const hasHeadings = content.includes("#");
    const hasCodeBlocks = content.includes("```");

    docCheckResults.items.push(
      item(
        lines >= doc.minLines ? "pass" : "warn",
        path.basename(doc.file),
        `${lines} 行 (要求 >= ${doc.minLines})`,
        `headings=${hasHeadings}, codeblocks=${hasCodeBlocks}`,
      ),
    );
  } catch (e: any) {
    docCheckResults.items.push(
      item("fail", path.basename(doc.file), "文件缺失或读取失败"),
    );
  }
}

results.push(docCheckResults);

// ============================================================================
// 第5部分: 依赖检查
// ============================================================================

section("5. 依赖和环境检查");

let depCheckResults: ReviewResult = {
  category: "依赖",
  items: [],
};

try {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "package.json"), "utf-8"),
  );

  const requiredDeps = ["chalk", "commander", "fast-glob", "json5"];
  const requiredDevDeps = ["typescript", "@types/node"];

  for (const dep of requiredDeps) {
    const exists = !!packageJson.dependencies[dep];
    depCheckResults.items.push(
      item(
        exists ? "pass" : "fail",
        dep,
        exists ? `v${packageJson.dependencies[dep]}` : "缺失",
      ),
    );
  }

  for (const dep of requiredDevDeps) {
    const exists = !!packageJson.devDependencies[dep];
    depCheckResults.items.push(
      item(
        exists ? "pass" : "fail",
        dep,
        exists ? `v${packageJson.devDependencies[dep]}` : "缺失",
        "(dev)",
      ),
    );
  }
} catch (e: any) {
  depCheckResults.items.push(
    item("fail", "package.json", "读取或解析失败", e.message),
  );
}

results.push(depCheckResults);

// ============================================================================
// 第6部分: 架构一致性检查
// ============================================================================

section("6. 架构和一致性检查");

let archCheckResults: ReviewResult = {
  category: "架构一致性",
  items: [],
};

// 检查接口实现一致性
const interfaceFile = path.join(process.cwd(), "Tools/UsageSync/interfaces.ts");
try {
  const interfaceContent = fs.readFileSync(interfaceFile, "utf-8");
  const hasUsageSyncInterface = interfaceContent.includes(
    "interface UsageSync",
  );
  const hasUsageDataInterface = interfaceContent.includes(
    "interface UsageData",
  );
  const hasSyncResultInterface = interfaceContent.includes(
    "interface SyncResult",
  );

  archCheckResults.items.push(
    item(
      hasUsageSyncInterface && hasUsageDataInterface && hasSyncResultInterface
        ? "pass"
        : "fail",
      "Interface 定义",
      "接口定义完整",
      `UsageSync=${hasUsageSyncInterface}, UsageData=${hasUsageDataInterface}, SyncResult=${hasSyncResultInterface}`,
    ),
  );

  // 验证各模块是否实现 UsageSync 接口
  const allImplements = [
    "Anthropic",
    "OpenAI",
    "ZhiPu",
    "GitHub",
    "Gemini",
  ].every((module) => {
    const syncFile = path.join(
      process.cwd(),
      module === "Anthropic"
        ? "Tools/UsageSync/AnthropicSync.ts"
        : module === "OpenAI"
          ? "Tools/UsageSync/OpenAISync.ts"
          : module === "ZhiPu"
            ? "Tools/UsageSync/ZhiPuSync.ts"
            : module === "GitHub"
              ? "Tools/UsageSync/GitHubSync.ts"
              : "Tools/UsageSync/GeminiSync.ts",
    );

    try {
      const content = fs.readFileSync(syncFile, "utf-8");
      return content.includes("implements UsageSync");
    } catch {
      return false;
    }
  });

  archCheckResults.items.push(
    item(
      allImplements ? "pass" : "warn",
      "UsageSync 实现",
      allImplements ? "所有模块正确实现接口" : "部分模块缺少接口实现",
    ),
  );
} catch (e: any) {
  archCheckResults.items.push(
    item("fail", "Interface 检查", "读取或验证失败", e.message),
  );
}

results.push(archCheckResults);

// ============================================================================
// 生成总结报告
// ============================================================================

section("总结报告");

let totalItems = 0;
let passCount = 0;
let failCount = 0;
let warnCount = 0;
let skipCount = 0;

for (const result of results) {
  for (const item of result.items) {
    totalItems++;
    if (item.status === "pass") passCount++;
    if (item.status === "fail") failCount++;
    if (item.status === "warn") warnCount++;
    if (item.status === "skip") skipCount++;
  }
}

console.log("\n📊 复核统计:\n");
log(colors.green, `  ✅ 通过: ${passCount}/${totalItems}`);
log(colors.red, `  ❌ 失败: ${failCount}/${totalItems}`);
log(colors.yellow, `  ⚠️  警告: ${warnCount}/${totalItems}`);
log(colors.gray, `  ⏭️  跳过: ${skipCount}/${totalItems}`);

const successRate = ((passCount / totalItems) * 100).toFixed(1);
log(colors.cyan, `\n  成功率: ${successRate}%\n`);

// 根据成功率给出建议
if (parseFloat(successRate) === 100) {
  log(colors.green, "✅ 所有功能检查通过！P1 已完全就绪。\n");
} else if (parseFloat(successRate) >= 90) {
  log(colors.yellow, "⚠️  大部分功能正常，但存在一些非关键问题。\n");
} else if (parseFloat(successRate) >= 70) {
  log(colors.yellow, "⚠️  存在一些问题需要修复。\n");
} else {
  log(colors.red, "❌ 存在严重问题，需要立即修复。\n");
}

// 输出详细报告
console.log("📋 详细报告:\n");

for (const category of results) {
  log(colors.blue, `\n${category.category}:`);
  let categoryPass = 0;
  let categoryTotal = 0;

  for (const result of category.items) {
    categoryTotal++;
    if (result.status === "pass") categoryPass++;
  }

  log(colors.gray, `  ${categoryPass}/${categoryTotal} 通过\n`);
}

log(colors.cyan, "\n✨ 复核完成！");
log(colors.gray, "更多详情请查看 docs/reports/P1_REVIEW.md\n");
