/**
 * FileSystemUtils.ts
 * 文件系统操作工具
 */

import * as fs from "fs";

/**
 * 读取 JSONC 文件（支持注释）
 */
export function readJSONC(filePath: string): any {
  const content = fs.readFileSync(filePath, "utf-8");
  const hasComments = /^\s*\/\/|\/\*/m.test(content);

  if (!hasComments) {
    return JSON.parse(content);
  }

  let result = content;
  result = result.replace(/\/\*[\s\S]*?\*\//g, "");

  const lines = result.split("\n");
  const processedLines: string[] = [];

  for (const line of lines) {
    let processedLine = "";
    let inString = false;
    let escapeNext = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (escapeNext) {
        processedLine += char;
        escapeNext = false;
        continue;
      }

      if (char === "\\") {
        processedLine += char;
        escapeNext = true;
        continue;
      }

      if (char === '"' || char === "'" || char === "`") {
        inString = !inString;
        processedLine += char;
        continue;
      }

      if (
        !inString &&
        char === "/" &&
        i + 1 < line.length &&
        line[i + 1] === "/"
      ) {
        break;
      }

      processedLine += char;
    }

    processedLines.push(processedLine);
  }

  let jsonContent = processedLines.join("\n");
  jsonContent = jsonContent.replace(/,(\s*[}\]])/g, "$1");

  return JSON.parse(jsonContent);
}

/**
 * 写入 JSONC 文件
 */
export function writeJSONC(filePath: string, data: any): void {
  const jsonContent = JSON.stringify(data, null, 2);
  fs.writeFileSync(filePath, jsonContent, "utf-8");
}

/**
 * 检查文件是否存在
 */
export function fileExists(filePath: string): boolean {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}
