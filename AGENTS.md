# PROJECT KNOWLEDGE BASE

**Generated:** 2026-02-05T00:00:00Z
**Commit:** (current HEAD)
**Branch:** main

## OVERVIEW

Skill-based strategy manager: TypeScript library + markdown workflows for AI strategy lifecycle management with intelligent recommendation, usage sync, and dynamic generation capabilities.

## STRUCTURE

```
./
├── Workflows/    # Markdown workflow definitions (skill execution)
├── Tools/        # TypeScript implementation
│   ├── ManageStrategies.ts    # Core strategy management
│   ├── Recommender.ts         # Smart recommendation engine
│   ├── PathManager.ts         # Path resolution
│   ├── Validator.ts           # Strategy validation
│   ├── CostReport.ts          # Cost analysis
│   ├── ContextEnhancer.ts     # Context enhancement
│   └── UsageSync/             # Multi-platform usage sync
└── templates/    # Strategy template files
```

## WHERE TO LOOK

| Task                    | Location                  | Notes                                                                                                                     |
| ----------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Strategy implementation | Tools/ManageStrategies.ts | All commands in one file                                                                                                  |
| Smart recommendation    | Tools/Recommender.ts      | Quota-aware recommendation engine                                                                                         |
| Usage synchronization   | Tools/UsageSync/          | Multi-platform usage tracking                                                                                             |
| Cost analysis           | Tools/CostReport.ts       | GitHub Copilot optimization                                                                                               |
| Workflow routing        | SKILL.md                  | Maps triggers to Workflows/\*.md                                                                                          |
| Individual workflows    | Workflows/\*.md           | List, Switch, Compare, Export, Import, Validate, Fix, History, Recommend, FeedbackReport, Generate, UsageSync, CostReport |
| Build scripts           | package.json              | bun only                                                                                                                  |
| TypeScript config       | Tools/tsconfig.json       | NOT at repo root                                                                                                          |

## CODE MAP

| Symbol                  | Type     | Location                         | Refs | Role                                     |
| ----------------------- | -------- | -------------------------------- | ---- | ---------------------------------------- |
| ManageStrategies        | class    | Tools/ManageStrategies.ts        | -    | Core CLI/library class                   |
| list                    | method   | Tools/ManageStrategies.ts        | -    | List available strategies (with dynamic) |
| switch                  | method   | Tools/ManageStrategies.ts        | -    | Switch strategies with backup            |
| compare                 | method   | Tools/ManageStrategies.ts        | -    | Diff strategies field-by-field           |
| export                  | method   | Tools/ManageStrategies.ts        | -    | Export to JSON/JSONC                     |
| import                  | method   | Tools/ManageStrategies.ts        | -    | Import with validation                   |
| validate                | method   | Tools/ManageStrategies.ts        | -    | Schema validation                        |
| fix                     | method   | Tools/ManageStrategies.ts        | -    | Auto-fix common issues                   |
| history                 | method   | Tools/ManageStrategies.ts        | -    | History tracking/rollback                |
| recommendStrategySmart  | function | Tools/ManageStrategies.ts        | -    | Quota-aware smart recommendation         |
| generateDynamicStrategy | function | Tools/ManageStrategies.ts        | -    | Dynamic strategy generation              |
| SmartRecommender        | class    | Tools/Recommender.ts             | -    | Multi-factor recommendation engine       |
| UsageSyncCoordinator    | class    | Tools/UsageSync/index.ts         | -    | Coordinates multi-platform sync          |
| AnthropicSync           | class    | Tools/UsageSync/AnthropicSync.ts | -    | Anthropic usage sync                     |
| OpenAISync              | class    | Tools/UsageSync/OpenAISync.ts    | -    | OpenAI usage sync                        |
| GitHubSync              | class    | Tools/UsageSync/GitHubSync.ts    | -    | GitHub Copilot usage sync                |
| GeminiSync              | class    | Tools/UsageSync/GeminiSync.ts    | -    | Gemini usage sync                        |
| ZhiPuSync               | class    | Tools/UsageSync/ZhiPuSync.ts     | -    | ZhiPu usage sync                         |
| CostReport              | class    | Tools/CostReport.ts              | -    | Cost analysis and optimization           |

## CONVENTIONS

**Development Principles:**

- **Schema Compliance**: All features must conform to oh-my-opencode schema constraints
- **Consistency Guarantee**: Any modification must ensure logical consistency across:
  - `scripts/` - Shell scripts and automation
  - `docs/` - Documentation and guides
  - `templates/` - Strategy template files
  - `Workflows/` - Markdown workflow definitions
  - `Tools/` - TypeScript implementation
- **Validation First**: Run type-check, tests, and template validation before committing
- **Documentation Sync**: Update relevant docs when code/behavior changes

**Skill-Based Architecture:**

- Source code in `Tools/` (Skill convention for tool implementations)
- `tsconfig.json` in `Tools/` with root-level inheritance
- Workflows as Markdown files (intent/steps), not executable CI definitions
- Runtime loads `.ts` files directly via Bun (no compilation needed)

**Skill Pattern:**

- SKILL.md is minimal router; logic in Workflows/\*.md
- Workflows describe intent/steps; implementation in Tools/ManageStrategies.ts
- Bun-native TypeScript execution (no dist/ output required)

**Key Features:**

- **Smart Recommendation**: Multi-factor scoring with quota awareness
- **Dynamic Generation**: Scenario-based strategy generation with quota optimization
- **Usage Sync**: Multi-platform usage tracking (Anthropic, OpenAI, GitHub, Gemini, ZhiPu, DeepSeek, SiliconFlow)
- **Cost Analysis**: GitHub Copilot usage optimization
- **Feedback Loop**: Recommendation adoption rate tracking
- **Quota Awareness**: Real-time quota status integration

## ANTI-PATTERNS (THIS PROJECT)

**No Longer Applicable (Fixed):**

- ~~`package.json` main/types point to `dist/`~~ → Now uses source files directly
- ~~Node.js engines~~ → Now requires Bun only
- ~~Missing root tsconfig~~ → Now extends Tools/tsconfig.json
- ~~LSP type errors~~ → Fixed with proper config

**Missing Standards:**

- No tests (no test config, no test scripts)

## UNIQUE STYLES

**Color Output:**

- Green (`success`) = operations completed
- Red (`error`) = failures
- Yellow (`warn`) = warnings/risks
- Blue (`info`) = informational
- Diff: `+` (green = added), `-` (red = removed), `~` (yellow = modified)

**File Paths (convention):**

- Strategy files: `$STRATEGIES_DIR/<name>.jsonc`
- History: `$CONFIG_DIR/strategy-history.json`
- Backups: `$CONFIG_DIR/backups/<name>-<timestamp>.jsonc`

## COMMANDS

```bash
# Install dependencies
bun install

# Type check
bun run type-check

# Run tests
bun test

# Development with watch
bun run dev:watch

# Run (if needed)
bun run Tools/ManageStrategies.ts
```

## NOTES

**Development Guidelines:**

- See [Consistency Checklist](docs/guides/CONSISTENCY_CHECKLIST.md) for change impact analysis
- Run full validation suite before commits: `bun run type-check && bun test && for f in templates/*.jsonc; do bun run Tools/ManageStrategies.ts validate "$f"; done`
- Update CHANGELOG.md for all notable changes
- Mark breaking changes clearly in documentation

**Gotchas:**

- No compilation needed: Bun runs `.ts` files directly
- No CI workflows: This is a local Skill, not a CI-driven project
- LSP requires TypeScript service restart after config changes
- Template validation must pass for all 8 strategy files

**Skill Integration:**

- This is a Bun-based Skill package
- Runtime loads `.ts` files directly (no build step)
- OpenCode uses SKILL.md + Workflows/\*.md routing
