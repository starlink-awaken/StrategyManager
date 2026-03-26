import * as path from "path";

import { describe, expect, it } from "bun:test";

import { readJSONC } from "../../Tools/FileSystemUtils";

import type { StrategyConfig } from "../../Tools/interfaces";

function loadTemplate(name: string): StrategyConfig {
  return readJSONC(
    path.resolve(process.cwd(), "templates", `${name}.jsonc`),
  ) as StrategyConfig;
}

describe("Template strategy fit", () => {
  it("keeps cost-sensitive and speed-sensitive specialist roles aligned with template intent", () => {
    const cheap = loadTemplate("cheap");
    const fast = loadTemplate("fast");
    const smart = loadTemplate("smart");

    expect(cheap.agents?.momus?.model).toBe("zhipuai-coding-plan/glm-4.7");
    expect(fast.agents?.momus?.model).toBe("zhipuai-coding-plan/glm-4.7-flash");
    expect(smart.agents?.momus?.model).toBe("zhipuai-coding-plan/glm-5");
  });

  it("keeps balanced writing on Claude and multimodal roles on Gemini", () => {
    const balanced = loadTemplate("balanced");

    expect(balanced.categories?.writing?.model).toBe(
      "anthropic/claude-sonnet-4-6",
    );
    expect(balanced.categories?.["visual-engineering"]?.model).toBe(
      "google/antigravity-gemini-2.5-pro",
    );
    expect(balanced.agents?.["multimodal-looker"]?.model).toBe(
      "google/antigravity-gemini-2.5-pro",
    );
  });

  it("keeps quick categories with at least one real fallback after dedupe", () => {
    const balanced = loadTemplate("balanced");
    const cheap = loadTemplate("cheap");
    const fast = loadTemplate("fast");
    const smart = loadTemplate("smart");

    expect(balanced.categories?.quick?.fallback?.length).toBeGreaterThan(0);
    expect(cheap.categories?.quick?.fallback?.length).toBeGreaterThan(0);
    expect(fast.categories?.quick?.fallback?.length).toBeGreaterThan(0);
    expect(smart.categories?.quick?.fallback?.length).toBeGreaterThan(0);
  });
});
