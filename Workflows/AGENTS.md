# WORKFLOWS DOMAIN

**Purpose:** Skill workflow definitions for strategy management operations

## OVERVIEW
Markdown-based workflow routing: each file = one skill operation trigger

## STRUCTURE
```
Workflows/
├── Compare.md       # Diff strategies
├── Export.md        # Export to JSON/JSONC
├── Import.md        # Import strategies
├── List.md          # List available strategies
├── Recommend.md     # Context-based recommendations
├── Switch.md        # Switch strategies with backup
├── Fix.md           # Auto-fix common issues
├── Validate.md      # Schema validation
└── History.md       # History tracking/rollback
```

## WHERE TO LOOK

| Operation | File | Trigger Phrases |
|-----------|------|----------------|
| Compare strategies | Compare.md | "compare strategies" |
| Export strategy | Export.md | "export strategy" |
| Import strategy | Import.md | "import strategy" |
| List strategies | List.md | "list strategies" |
| Get recommendations | Recommend.md | "recommend strategy" |
| Switch strategy | Switch.md | "switch strategy" |
| Fix strategies | Fix.md | "fix strategies" |
| Validate strategy | Validate.md | "validate strategy" |
| History/rollback | History.md | "strategy history", "rollback" |

## CONVENTIONS

**File Naming:**
- TitleCase (Switch.md, not switch.md)
- Verb-based (action focus)

**Content Pattern:**
- Trigger examples at top
- Step-by-step procedures
- Option flags documentation

**Routing:**
- SKILL.md maps phrases to these files
- No executable code here (implementation in Tools/ManageStrategies.ts)

## ANTI-PATTERNS

- Don't add code examples (implementation only in Tools/)
- Don't duplicate SKILL.md routing info
- Don't include build commands (Skill runs .ts directly, no compilation needed)
