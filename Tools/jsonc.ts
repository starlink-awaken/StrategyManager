import * as fs from "fs";

export function readJSONC(filePath: string): any {
  const content = fs.readFileSync(filePath, "utf-8");

  const hasComments = /^\s*\/\/|\/\*/m.test(content);

  if (!hasComments) {
    return JSON.parse(content);
  }

  let result = content;

  // Remove block comments /* ... */
  result = result.replace(/\/\*[\s\S]*?\*\//g, "");

  // Remove line comments // (careful not to match inside strings)
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

      // If not in string and encounter //, truncate
      if (!inString && char === "/" && i + 1 < line.length && line[i + 1] === "/") {
        break;
      }

      processedLine += char;
    }

    processedLines.push(processedLine);
  }

  const jsonContent = processedLines.join("\n");

  try {
    // Remove trailing commas before } or ]
    const cleanedTrailing = jsonContent.replace(/,(\s*[}\]])/g, '$1');
    return JSON.parse(cleanedTrailing);
  } catch (err) {
    console.error('JSONC parse failed in file:', filePath);
    const cleanedTrailing = jsonContent.replace(/,(\s*[}\]])/g, '$1');
    // Debug: print error position
    try {
      return JSON.parse(cleanedTrailing);
    } catch (e: any) {
      if (e?.position != null) {
        const pos = e.position as number;
        const start = Math.max(0, pos - 50);
        const end = Math.min(cleanedTrailing.length, pos + 50);
        console.error('JSON error at position', pos, ':', e.message);
        console.error('Context:', cleanedTrailing.slice(start, end));
      }
      throw e;
    }
    console.error(jsonContent.slice(0, 500));
    throw new Error(`Failed to parse JSONC file: ${filePath} - ${err}`);
  }

}

export function writeJSONC(filePath: string, data: any): void {
  const jsonContent = JSON.stringify(data, null, 2);
  fs.writeFileSync(filePath, jsonContent, "utf-8");
}
