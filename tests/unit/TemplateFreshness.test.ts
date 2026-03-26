import * as path from "path";

import { describe, expect, it } from "bun:test";

import { readJSONC } from "../../Tools/FileSystemUtils";
import { StrategyValidator } from "../../Tools/Validator";

import type { StrategyConfig } from "../../Tools/interfaces";

const SMART_TEMPLATE_PATH = path.resolve(process.cwd(), "templates", "smart.jsonc");

describe("Template model freshness", () => {
  it("uses the replacement GLM model in smart template", () => {
    const smartTemplate = readJSONC(SMART_TEMPLATE_PATH) as StrategyConfig;

    expect(smartTemplate.agents?.momus?.model).toBe(
      "zhipuai-coding-plan/glm-5",
    );
    expect(smartTemplate.lsp?.provider_quotas?.["bailian-coding-plan"]).toBeUndefined();
  });

  it("accepts the replacement GLM model without availability warnings", () => {
    const validator = new StrategyValidator();
    const config: StrategyConfig = {
      description: "Template freshness validation",
      agents: {
        momus: {
          model: "zhipuai-coding-plan/glm-5",
        },
      },
    };

    const result = validator.validate(config, "smart");
    const modelWarnings = result.warnings.filter(
      (warning) =>
        warning.field === "agents.momus.model" &&
        warning.message.includes("可能不可用或已过时"),
    );

    expect(modelWarnings).toHaveLength(0);
  });
});
