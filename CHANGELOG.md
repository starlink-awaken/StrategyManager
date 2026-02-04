# Changelog

All notable changes to StrategyManager will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2026-02-04

### 🎉 Major Refactoring - Week 1 & 2 Implementation

#### Added - Phase 1: Core Integration

- **PathManager System**: Unified path management for configuration and strategy files
  - Support for user mode (`~/.config/opencode/`)
  - Support for project mode (`./.config/`)
  - Custom path configuration support
- **Installation Scripts**: Automated template installation
  - `scripts/install.sh`: Install strategy templates to user configuration
  - Backup mechanism for existing files
  - Force overwrite option with automatic backup
- **Template System**: Strategy templates separated from user configuration
  - All strategy files moved to `templates/` directory
  - Clear separation between templates and active configurations

#### Added - Phase 2: Feature Enhancements

- **Smart Recommendation System**: Multi-factor scoring algorithm
  - Scenario matching (40% weight)
  - Cost efficiency analysis (30% weight)
  - Quality scoring (20% weight)
  - History preference (10% weight)
  - Context-aware recommendations for 14+ scenarios
- **GitHub Copilot Optimization**: Usage analysis and optimization suggestions
  - Copilot utilization rate analysis
  - Cost-benefit analysis for model selection
  - Automatic optimization configuration generation
- **Enhanced Validation System**: Multi-level validation with auto-fix
  - Error/Warning/Info severity levels
  - Model availability checking
  - Cost reasonableness validation
  - Concurrency configuration validation
  - Auto-fix suggestions with one-click apply

#### Changed

- **Directory Structure**: Major reorganization
  - `strategies/` → `templates/` (strategy templates)
  - `strategies/docs/` → `docs/` (documentation)
  - New `scripts/` directory for utility scripts
  - New `tests/` directory structure (unit/integration/fixtures)
- **Path Management**: All hard-coded paths replaced with PathManager
  - Consistent path resolution across all functions
  - Environment-aware path configuration
  - Automatic directory creation
- **Documentation Structure**: Streamlined and organized
  - `docs/architecture/` - Architecture and design decisions
  - `docs/guides/` - User guides and tutorials
  - `docs/reports/` - Historical reports and analysis
  - Reduced redundancy and improved navigation

#### Fixed

- Path inconsistency issues between code, documentation, and actual configuration
- Strategy file not found errors due to hard-coded paths
- Missing directory creation on first run

### Breaking Changes

⚠️ **Important**: This release includes breaking changes:

1. **Strategy Location**: Active strategy files must be in `~/.config/opencode/strategies/`
   - Migration: Run `bash scripts/install.sh` to install templates
2. **Import Paths**: Code importing ManageStrategies must update imports
   - New: `import { PathManager } from './PathManager'`
3. **API Changes**: Some function signatures updated to support PathManager

### Migration Guide

```bash
# 1. Install strategy templates
bash scripts/install.sh

# 2. List available templates
bun run Tools/ManageStrategies.ts list

# 3. Switch to your preferred strategy
bun run Tools/ManageStrategies.ts switch strategy-2-balanced
```

---

## [2.1.0] - 2026-02-04 (Pre-refactoring)

### Added - Strategy-2-Balanced Optimization

- Scene-based model matching (13 scenarios)
- Enhanced categories: `visual-engineering`, `artistry`, `quick`, `writing`, `deep`
- System prompts for education and health scenarios
- GitHub Copilot free models integration (`gpt-5-mini`)

### Changed

- Improved cost efficiency: ¥400-700/month
- Scene coverage: 43% → 79%
- Quality improvement: +30-60% across scenarios

### Optimization Reports

- See `docs/reports/analysis/OPTIMIZATION_REPORT_BALANCED_2.1.md` for details

---

## [2.0.0] - 2026-02-04 (Pre-refactoring)

### Added - Specialized Strategies

- `strategy-research-thinking.jsonc`: Deep research with Opus 300k thinking tokens
- `strategy-creative-content.jsonc`: Creative writing optimization

### Changed

- Total strategies: 4 → 6 (4 general + 2 specialized)
- Monthly cost range: ¥50-3000 depending on strategy
- Scene coverage: 100% (14/14 scenarios)

### Documentation

- `FINAL_IMPLEMENTATION_REPORT.md`: Complete strategy library report
- `GITHUB_COPILOT_UTILIZATION_ANALYSIS.md`: Copilot usage analysis

---

## [1.0.0] - 2026-02-03 (Initial Release)

### Added - Core Strategies

- `strategy-0-super.jsonc`: Maximum performance (¥2000-3000/month)
- `strategy-1-performance.jsonc`: Performance-focused (¥1000-1500/month)
- `strategy-2-balanced.jsonc`: Cost-efficient balance (¥300-600/month)
- `strategy-3-economical.jsonc`: Budget-friendly (¥50-150/month)

### Features

- Strategy switching with automatic backup
- History tracking and rollback support
- Strategy comparison (diff visualization)
- Configuration validation
- Import/Export functionality
- Basic recommendation system

### Documentation

- `README.md`: Project overview and quick start
- `SKILL.md`: Skill-based workflow routing
- `STRATEGY_PLANNING.md`: Resource analysis and planning
- `USAGE_GUIDE.md`: User guide with scenarios

---

## [0.1.0] - 2026-02-01 (Project Initialization)

### Added

- Initial project structure
- TypeScript configuration
- Bun runtime support
- Basic strategy management functions
- Workflow definitions (Markdown-based)

### Project Foundation

- Skill-based architecture pattern
- SKILL.md → Workflows/\*.md → Tools/ManageStrategies.ts
- JSONC format support with comments
- Color-coded terminal output
