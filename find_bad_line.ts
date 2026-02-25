import * as fs from "fs";

function findBadLine(file: string) {
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    try {
      JSON.parse(line);
    } catch {
      // Not valid JSON line (expected since line is not a full JSON)
    }
    // Check for control chars
    if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(line)) {
      console.log(`${file}: line ${i+1} contains control char:`, line.replace(/[\x00-\x1F\x7F]/g, "\\x" + Buffer.from(line, "utf8").toString("hex")));
    }
  }
}

const files = [
  "templates/strategy-0-super.jsonc",
  "templates/strategy-1-performance.jsonc",
  "templates/strategy-3-economical.jsonc",
  "templates/strategy-5-research.jsonc"
];

for (const file of files) {
  findBadLine(file);
}
