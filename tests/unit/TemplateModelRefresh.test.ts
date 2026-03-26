import * as fs from "fs";
import * as path from "path";

import { describe, expect, it } from "bun:test";

import { StrategyValidator } from "../../Tools/Validator";

import type { StrategyConfig } from "../../Tools/interfaces";

const TEMPLATE_DIR = path.resolve(process.cwd(), "templates");
const TEMPLATE_FILES = ["balanced.jsonc", "cheap.jsonc", "fast.jsonc", "smart.jsonc"];

const DEPRECATED_TEMPLATE_MODELS = [
  "bailian-coding-plan",
  "github-copilot/gpt-5-mini",
  "github-copilot/gpt-4.1",
  "github-copilot/gpt-4o",
  "github-copilot/gpt-5.2-codex",
  "github-copilot/gpt-5.3-codex",
  "openai/gpt-5.2-codex",
  "openai/gpt-5.3-codex",
  "google/antigravity-gemini-3.1-pro",
  "google/antigravity-gemini-3-flash",
];

describe("Template model refresh", () => {
  it("removes unavailable Qwen and older GPT/Gemini IDs from templates", () => {
    for (const fileName of TEMPLATE_FILES) {
      const content = fs.readFileSync(path.join(TEMPLATE_DIR, fileName), "utf-8");

      for (const deprecatedModel of DEPRECATED_TEMPLATE_MODELS) {
        expect(content).not.toContain(deprecatedModel);
      }
    }
  });

  it("accepts refreshed GPT and Gemini model IDs without availability warnings", () => {
    const validator = new StrategyValidator();
    const config: StrategyConfig = {
      description: "Refreshed template validation",
      agents: {
        oracle: { model: "openai/gpt-5.4" },
        planner: { model: "github-copilot/gpt-5.4" },
        worker: { model: "github-copilot/gpt-5.4-mini" },
        multimodal: { model: "google/antigravity-gemini-2.5-pro" },
        explorer: { model: "google/antigravity-gemini-2.5-flash" },
      },
    };

    const result = validator.validate(config);
    const availabilityWarnings = result.warnings.filter((warning) =>
      warning.message.includes("可能不可用或已过时"),
    );

    expect(availabilityWarnings).toHaveLength(0);
  });
});
