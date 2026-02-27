# StrategyManager Project Context

## Project Overview

**StrategyManager** is a TypeScript-based AI model configuration lifecycle management tool, designed specifically as an OpenCode/Claude Code Skill. It provides comprehensive strategy lifecycle management functionalities, including template management, smart recommendation, cost optimization, history tracking, and dynamic strategy generation.

The project relies on the Bun runtime and operates mainly through its core CLI tool (`Tools/ManageStrategies.ts`) and associated markdown-based workflows (`Workflows/`).

### Key Characteristics
- **Environment**: TypeScript, Bun (runtime and test runner).
- **Core Purpose**: Manage `oh-my-opencode` configurations, ensuring strategies match user scenarios (e.g., balanced, creative, research, performance) and maintaining cost awareness.
- **Constraints**: 
  - All configurations and updates must strictly adhere to the `oh-my-opencode` schema.
  - Forward compatibility and alignment with official schema is prioritized over custom additions.
  - Changes must be synchronized across `scripts/`, `docs/`, `templates/`, `Workflows/`, and `Tools/`.

## Building and Running

The project uses `bun` for package management, script execution, and testing.

### Key Commands

- **Install Dependencies**:
  ```bash
  bun install
  ```
- **Run the CLI Tool** (Main entry point):
  ```bash
  bun run Tools/ManageStrategies.ts [command]
  ```
  *Examples*: `list`, `switch <strategy>`, `recommend <scenario>`, `compare <str1> <str2>`, `cost-report`
- **Type Checking**:
  ```bash
  bun run type-check
  ```
- **Testing**:
  ```bash
  bun test           # Run all tests
  bun run test:watch # Run tests in watch mode
  bun run test:unit  # Run unit tests only
  bun run test:coverage # Generate coverage report
  ```
- **Install & Setup Integration**:
  ```bash
  bash scripts/install.sh
  bash scripts/setup-opencode-integration.sh
  ```

## Development Conventions

- **Code Style**: Written in TypeScript. Strict typing and validation are emphasized (as seen in `tests/unit/Validator.test.ts`). Formatting rules are specified in `.prettierrc.json` and `.editorconfig`.
- **Testing Practices**: Heavy reliance on unit tests using Bun's native test runner (`bun test`). All new features or configuration updates should be accompanied by corresponding tests in the `tests/` directory.
- **Workflow Driven**: Operations are often tied to specific markdown files in the `Workflows/` directory (e.g., `Compare.md`, `CostReport.md`, `Switch.md`). Modifications to commands often require parallel updates to these workflow documents.
- **Data Formats**: Configuration files are largely stored in JSON/JSONC format (e.g., `templates/*.jsonc`). Parsing and validation (handled by `json5` and custom Validator classes) must gracefully manage comments and schema compliance.
- **Output Styling**: The CLI uses `chalk` to output color-coded responses (Green: success, Red: error, Yellow: warning, Blue: info) for a better user experience. Code outputs should follow this convention.

## Key Directories
- `Tools/`: Contains the main TypeScript logic and CLI entry points (e.g., `ManageStrategies.ts`, `Recommender.ts`, `Validator.ts`).
- `templates/`: Houses the foundational JSONC templates for different strategy presets (`smart.jsonc`, `fast.jsonc`, `balanced.jsonc`, etc.).
- `Workflows/`: Contains Markdown definitions mapping to specific skill functionalities and processes.
- `tests/`: Extensive testing suite (unit and integration tests) using Bun.
- `scripts/`: Shell scripts for installation, setup, and verification.
- `docs/`: Comprehensive project documentation, architectural guidelines, and reports.
