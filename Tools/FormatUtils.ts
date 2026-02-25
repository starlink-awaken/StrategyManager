/**
 * FormatUtils.ts
 * 输出格式化和颜色工具
 */

const COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

/**
 * 为文本添加颜色
 */
export function colorize(text: string, color: keyof typeof COLORS): string {
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

/**
 * 成功消息（绿色 + 勾选标记）
 */
export function success(text: string): void {
  console.log(colorize(`✅ ${text}`, "green"));
}

/**
 * 错误消息（红色 + 叉标记）
 */
export function error(text: string): void {
  console.error(colorize(`❌ ${text}`, "red"));
}

/**
 * 警告消息（黄色 + 警告标记）
 */
export function warning(text: string): void {
  console.warn(colorize(`⚠️  ${text}`, "yellow"));
}

/**
 * 信息消息（蓝色 + 信息标记）
 */
export function info(text: string): void {
  console.log(colorize(`ℹ️  ${text}`, "blue"));
}

/**
 * 格式化表格输出
 */
export function formatTable(headers: string[], rows: string[][]): string {
  const maxWidths = headers.map((header, i) => {
    const columnWidths = rows.map((row) => (row[i] || "").length);
    return Math.max(header.length, ...columnWidths);
  });

  const separator = maxWidths.map((width) => "-".repeat(width + 2)).join("+");

  let result = separator + "\n";
  result +=
    "| " +
    headers.map((header, i) => header.padEnd(maxWidths[i])).join(" | ") +
    " |\n";
  result += separator + "\n";

  for (const row of rows) {
    result +=
      "| " +
      row.map((cell, i) => (cell || "").padEnd(maxWidths[i])).join(" | ") +
      " |\n";
  }

  result += separator;
  return result;
}
