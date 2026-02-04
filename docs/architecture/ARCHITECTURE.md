# StrategyManager Architecture

**Last Updated**: 2026-02-04  
**Version**: 3.0.0

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Pattern](#architecture-pattern)
3. [Core Components](#core-components)
4. [Data Flow](#data-flow)
5. [Design Decisions](#design-decisions)
6. [Extension Points](#extension-points)

---

## Overview

StrategyManager is a skill-based strategy management system for AI model configurations. It follows a lightweight architecture with clear separation of concerns:

- **SKILL.md**: Minimal router (trigger → workflow mapping)
- **Workflows/\*.md**: Intent descriptions and procedures
- **Tools/\*.ts**: Implementation layer
- **templates/\*.jsonc**: Strategy configuration templates

### Key Principles

1. **Single Source of Truth**: Templates in `templates/`, active configs in `~/.config/opencode/strategies/`
2. **Path Independence**: PathManager abstracts all path resolution
3. **Skill-Based Pattern**: Natural language triggers → workflows → implementations
4. **Type Safety**: TypeScript for core logic, with comprehensive interfaces

---

## Architecture Pattern

### Skill-Based Architecture

```
User Request (Natural Language)
    ↓
SKILL.md (Router)
    ↓
Workflows/*.md (Intent & Steps)
    ↓
Tools/ManageStrategies.ts (Implementation)
    ↓
templates/ or ~/.config/opencode/strategies/ (Data)
```

### Directory Structure

```
StrategyManager/
├── SKILL.md                 # Skill router (triggers → workflows)
├── Workflows/               # Workflow definitions
│   ├── List.md
│   ├── Switch.md
│   ├── Compare.md
│   └── ...
├── Tools/                   # Implementation
│   ├── ManageStrategies.ts  # Core logic
│   ├── PathManager.ts       # Path management
│   ├── Recommender.ts       # Smart recommendation
│   └── Validator.ts         # Enhanced validation
├── templates/               # Strategy templates (read-only)
│   ├── strategy-0-super.jsonc
│   ├── strategy-2-balanced.jsonc
│   └── ...
├── scripts/                 # Utility scripts
│   └── install.sh           # Template installation
├── docs/                    # Documentation
│   ├── architecture/
│   ├── guides/
│   └── reports/
└── tests/                   # Test suites
    ├── unit/
    ├── integration/
    └── fixtures/
```

---

## Core Components

### 1. PathManager

**Location**: `Tools/PathManager.ts`

**Responsibility**: Unified path management across different deployment modes

**Modes**:

- `user`: `~/.config/opencode/` (default)
- `project`: `./.config/` (project-local)
- `custom`: User-defined paths

**Key Methods**:

```typescript
getConfigDir(): string          // Configuration directory
getStrategiesDir(): string      // Active strategies directory
getTemplatesDir(): string       // Template directory (project)
getConfigFile(): string         // oh-my-opencode.json path
getHistoryFile(): string        // strategy-history.json path
ensureDirectories(): void       // Create necessary directories
```

**Design Rationale**:

- Eliminates hard-coded paths
- Supports multiple deployment scenarios
- Centralizes directory creation logic
- Enables easy testing with custom paths

---

### 2. Strategy Management (ManageStrategies.ts)

**Location**: `Tools/ManageStrategies.ts`

**Responsibility**: Core strategy operations

**Function Groups**:

#### Installation & Setup

- `installTemplate(templateName)`: Install single template
- `syncAllTemplates(force)`: Sync all templates
- `listTemplates()`: Show available templates

#### Strategy Operations

- `listStrategies()`: Get all installed strategies
- `switchStrategy(name)`: Activate a strategy
- `compareStrategies(name1, name2)`: Diff two strategies
- `validateStrategy(config)`: Validate configuration

#### History & Backup

- `getHistory()`: Retrieve switch history
- `addHistoryEntry(entry)`: Record operation
- `rollbackToHistory(index)`: Revert to previous state
- `cleanOldBackups()`: Manage backup files

#### Import/Export

- `exportStrategy(name, path)`: Export to JSON/JSONC
- `importStrategy(name, path)`: Import with validation

---

### 3. Smart Recommender

**Location**: `Tools/Recommender.ts`

**Responsibility**: Context-aware strategy recommendation

**Algorithm**: Multi-factor scoring

```typescript
Total Score =
  ScenarioMatch × 0.40 +
  CostEfficiency × 0.30 +
  QualityScore × 0.20 +
  HistoryPreference × 0.10
```

**Scenario Mapping**:

```typescript
{
  education: ['balanced', 'creative-content'],
  health: ['balanced', 'research-thinking'],
  finance: ['research-thinking', 'performance'],
  coding: ['balanced', 'performance'],
  research: ['research-thinking', 'performance'],
  creative: ['creative-content', 'balanced'],
  daily: ['balanced', 'economical'],
  writing: ['creative-content', 'balanced']
}
```

**Input Context**:

- Scenario type and priority
- Budget constraints (monthly/current spent)
- Historical usage patterns
- Time context (urgent/deadline)

**Output**:

- Top 3 recommendations
- Detailed reasoning
- Estimated cost
- Pros/cons analysis

---

### 4. Enhanced Validator

**Location**: `Tools/Validator.ts`

**Responsibility**: Multi-level validation with auto-fix

**Validation Layers**:

1. **Schema Validation**: Required fields and structure
2. **Model Availability**: Check if models exist and are accessible
3. **Cost Reasonableness**: Warn if cost exceeds budget
4. **Concurrency Configuration**: Validate rate limits
5. **GitHub Copilot Usage**: Check utilization rate

**Severity Levels**:

- `error`: Must fix (blocks operation)
- `warning`: Should fix (degraded experience)
- `info`: Nice to fix (optimization opportunity)

**Auto-Fix**:

```typescript
interface ValidationError {
  field: string;
  message: string;
  severity: "error" | "warning" | "info";
  fix?: {
    description: string;
    autoFix: () => void; // One-click fix
  };
}
```

---

## Data Flow

### Strategy Switch Flow

```
1. User Request
   switchStrategy('strategy-2-balanced')
        ↓
2. Path Resolution (PathManager)
   - Get strategy file path
   - Verify file exists
        ↓
3. Validation
   - Read JSONC
   - Validate schema
   - Check model availability
        ↓
4. Backup Current (if exists)
   - Copy oh-my-opencode.json → backup
   - Add to history
        ↓
5. Create Symlink
   - ln -sf <strategy-file> oh-my-opencode.json
        ↓
6. Record History
   - Add switch entry
   - Update history.json
        ↓
7. Success Feedback
   - Display confirmation
   - Show strategy details
```

### Recommendation Flow

```
1. User Query (Natural Language)
   "I need a strategy for deep research with tight budget"
        ↓
2. Context Parsing
   - Extract scenario: research
   - Extract priority: cost
   - Extract constraints: budget
        ↓
3. Load All Strategies
   - Read from STRATEGIES_DIR
   - Parse metadata
        ↓
4. Multi-Factor Scoring
   For each strategy:
     - Calculate scenario match
     - Calculate cost efficiency
     - Get quality score
     - Check history preference
     - Compute weighted sum
        ↓
5. Rank & Filter
   - Sort by total score
   - Take top 3
   - Generate reasoning
        ↓
6. Output Recommendations
   - Display ranked list
   - Show reasoning
   - Estimate cost
```

---

## Design Decisions

### 1. Why Skill-Based Architecture?

**Problem**: Traditional CLI/API patterns require memorizing commands and arguments.

**Solution**: Natural language triggers mapped to workflows.

**Benefits**:

- Lower barrier to entry
- Self-documenting (workflows are readable Markdown)
- Easy to extend (add new workflow = add new .md file)

**Trade-offs**:

- Slightly more complex routing
- Natural language ambiguity (mitigated by clear trigger keywords)

---

### 2. Why Separate Templates from Active Configs?

**Problem**: Original design had strategies in project directory, causing confusion about which files are "source of truth."

**Solution**:

- `templates/` = Read-only templates (project source code)
- `~/.config/opencode/strategies/` = Active user configurations

**Benefits**:

- Clear separation of concerns
- Safe to update project (git pull) without affecting user config
- Easy to reset to default (re-install template)
- Supports version control for templates

---

### 3. Why PathManager Instead of Direct path.join()?

**Problem**: Hard-coded paths make testing difficult and don't support multiple deployment scenarios.

**Solution**: PathManager abstraction with mode support.

**Benefits**:

- Testable (use custom paths in tests)
- Flexible (user/project/custom modes)
- Centralized (one place to update paths)
- Safe (automatic directory creation)

---

### 4. Why Multi-Factor Recommendation?

**Problem**: Simple keyword matching is unreliable and doesn't consider trade-offs.

**Solution**: Weighted scoring across multiple dimensions.

**Benefits**:

- More accurate recommendations
- Considers context (budget, urgency, quality needs)
- Learns from history
- Explainable (shows reasoning)

**Trade-offs**:

- More complex implementation
- Requires tuning weights

---

### 5. Why Enhanced Validation with Auto-Fix?

**Problem**: Simple boolean validation (valid/invalid) doesn't help users fix issues.

**Solution**: Multi-level validation with actionable fix suggestions.

**Benefits**:

- Better UX (guides user to fix)
- Reduces support burden
- Catches more issues (warnings/info)
- Educational (explains why something is wrong)

---

## Extension Points

### Adding a New Strategy

1. Create template in `templates/strategy-<name>.jsonc`
2. Document in `docs/guides/USAGE_GUIDE.md`
3. Add scenario mapping in `Recommender.ts` (if specialized)
4. Update `CHANGELOG.md`

### Adding a New Workflow

1. Create `Workflows/<Name>.md` with structure:
   - When to use
   - Step-by-step
   - Notes on implementation
   - Verification
2. Add trigger in `SKILL.md`
3. Implement function in `Tools/ManageStrategies.ts` (if needed)

### Adding a New Validation Rule

1. Add validation function in `Tools/Validator.ts`
2. Call from `validateStrategy()`
3. Provide auto-fix if possible
4. Document in validation error message

### Supporting a New Path Mode

1. Add mode to `PathMode` type in `PathManager.ts`
2. Implement `getConfigDir()` case
3. Document usage in `README.md`

---

## Performance Considerations

### File I/O Optimization

- **Caching**: Strategy configs cached after first read
- **Lazy Loading**: Templates loaded only when needed
- **Batch Operations**: `syncAllTemplates()` batches file copies

### Recommendation Speed

- **Pre-computed Scores**: Quality scores cached
- **Early Exit**: Stop scoring if threshold met
- **Limit Results**: Return top 3 only

### Memory Management

- **History Limit**: Keep last 100 entries (not unbounded)
- **Backup Limit**: Keep last 5 backups (auto-cleanup)
- **Stream Processing**: Large files handled in streams (future)

---

## Security Considerations

### Path Traversal Prevention

```typescript
// Validate all user-provided file paths
if (path.resolve(userPath).startsWith(SAFE_DIR)) {
  // OK to proceed
}
```

### Symlink Validation

```typescript
// Check symlink target before following
if (isSymlink(file)) {
  const target = readSymlink(file);
  // Validate target is within allowed directory
}
```

### JSON Injection Prevention

- Use `JSON.parse()` (not `eval()`)
- Validate against schema before usage
- Sanitize user input in search/filter operations

---

## Future Improvements

### Planned for v3.1

- [ ] Web UI dashboard
- [ ] Strategy diff with visual highlighting
- [ ] A/B testing support (switch between strategies periodically)
- [ ] Cost tracking and budgeting alerts

### Planned for v4.0

- [ ] AI-powered auto-optimization (analyze usage, suggest improvements)
- [ ] Plugin system for custom validators
- [ ] Remote template repository support
- [ ] Team collaboration features (shared strategies)

---

## References

- [Design Decisions](./DECISIONS.md) - Detailed rationale for major choices
- [API Documentation](../API.md) - Complete API reference
- [Contributing Guide](../CONTRIBUTING.md) - How to extend the system
