# PROJECT KNOWLEDGE BASE

**Generated:** 2026-02-03T09:56:00Z
**Commit:** (current HEAD)
**Branch:** main

## OVERVIEW
Skill-based strategy manager: TypeScript library + markdown workflows for AI strategy lifecycle management.

## STRUCTURE
```
./
├── Workflows/    # Markdown workflow definitions (skill execution)
└── Tools/        # Single TypeScript implementation
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Strategy implementation | Tools/ManageStrategies.ts | All commands in one file |
| Workflow routing | SKILL.md | Maps triggers to Workflows/*.md |
| Individual workflows | Workflows/*.md | List, Switch, Compare, Export, Import, Validate, Fix, History, Recommend |
| Build scripts | package.json | tsc only; no bundler |
| TypeScript config | Tools/tsconfig.json | NOT at repo root |

## CODE MAP

| Symbol | Type | Location | Refs | Role |
|--------|------|----------|------|------|
| ManageStrategies | class | Tools/ManageStrategies.ts | - | Core CLI/library class |
| list | method | Tools/ManageStrategies.ts | - | List available strategies |
| switch | method | Tools/ManageStrategies.ts | - | Switch strategies with backup |
| compare | method | Tools/ManageStrategies.ts | - | Diff strategies field-by-field |
| export | method | Tools/ManageStrategies.ts | - | Export to JSON/JSONC |
| import | method | Tools/ManageStrategies.ts | - | Import with validation |
| validate | method | Tools/ManageStrategies.ts | - | Schema validation |
| fix | method | Tools/ManageStrategies.ts | - | Auto-fix common issues |
| history | method | Tools/ManageStrategies.ts | - | History tracking/rollback |
| recommend | method | Tools/ManageStrategies.ts | - | Context-based recommendations |

## CONVENTIONS

**Skill-Based Architecture:**
- Source code in `Tools/` (Skill convention for tool implementations)
- `tsconfig.json` in `Tools/` with root-level inheritance
- Workflows as Markdown files (intent/steps), not executable CI definitions
- Runtime loads `.ts` files directly via Bun (no compilation needed)

**Skill Pattern:**
- SKILL.md is minimal router; logic in Workflows/*.md
- Workflows describe intent/steps; implementation in Tools/ManageStrategies.ts
- Bun-native TypeScript execution (no dist/ output required)

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

**Gotchas:**
- No compilation needed: Bun runs `.ts` files directly
- No CI workflows: This is a local Skill, not a CI-driven project
- No test coverage: Unit tests not yet implemented
- LSP requires TypeScript service restart after config changes

**Skill Integration:**
- This is a Bun-based Skill package
- Runtime loads `.ts` files directly (no build step)
- OpenCode uses SKILL.md + Workflows/*.md routing
