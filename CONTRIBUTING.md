# Contributing to StrategyManager

Thank you for your interest in contributing to StrategyManager! This document provides guidelines for contributing to this project.

## 🎯 Project Overview

StrategyManager is an OpenCode Skill for managing AI model configuration lifecycle. It helps users:

- Switch between different AI strategy configurations
- Validate and optimize strategy settings
- Track strategy usage history
- Get intelligent recommendations

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) v1.0.0 or higher
- Basic understanding of TypeScript
- Familiarity with OpenCode Skill architecture

### Development Setup

```bash
# Clone the repository
git clone https://github.com/starlink-awaken/StrategyManager.git
cd StrategyManager

# Install dependencies
bun install

# Run type checking
bun run type-check

# Run tests
bun test

# Run tests with coverage
bun run test:coverage
```

## 📝 Development Guidelines

### Code Style

- Follow TypeScript best practices
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions focused and single-purpose

### Testing

- Write tests for new features
- Maintain test coverage above 90%
- Test file naming: `*.test.ts`
- Use descriptive test names

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new recommendation algorithm
fix: correct validation logic for categories
docs: update README with new examples
test: add tests for PathManager
chore: update dependencies
```

### Project Structure

```
StrategyManager/
├── SKILL.md              # Skill definition (required)
├── Tools/                # Core implementation
│   ├── ManageStrategies.ts
│   ├── Recommender.ts
│   ├── Validator.ts
│   └── PathManager.ts
├── Workflows/            # Workflow definitions
├── templates/            # Strategy templates
├── tests/                # Test files
├── scripts/              # Utility scripts
└── docs/                 # Documentation
```

## 🔄 Contribution Workflow

1. **Fork & Clone**

   ```bash
   git clone https://github.com/YOUR_USERNAME/StrategyManager.git
   ```

2. **Create a Feature Branch**

   ```bash
   git checkout -b feat/your-feature-name
   ```

3. **Make Changes**
   - Write code
   - Add tests
   - Update documentation

4. **Run Validation**

   ```bash
   bun run type-check
   bun test
   ```

5. **Commit Changes**

   ```bash
   git add .
   git commit -m "feat: description of your changes"
   ```

6. **Push & Create PR**
   ```bash
   git push origin feat/your-feature-name
   ```
   Then create a Pull Request on GitHub

## 🐛 Reporting Issues

When reporting issues, please include:

- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Bun version)
- Relevant logs or error messages

## 💡 Feature Requests

We welcome feature suggestions! Please:

1. Check existing issues first
2. Describe the use case
3. Explain why it's valuable
4. Provide examples if possible

## 📚 Documentation

- Update relevant docs when changing functionality
- Add examples for new features
- Keep README.md current
- Update CHANGELOG.md for notable changes

## ✅ Code Review Process

Pull requests will be reviewed for:

- Code quality and style
- Test coverage
- Documentation completeness
- Compatibility with existing features
- Performance implications

## 🎓 Learning Resources

- [OpenCode Documentation](https://github.com/oraios/opencode)
- [Bun Documentation](https://bun.sh/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 📧 Contact

- GitHub Issues: For bugs and features
- Discussions: For questions and ideas

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project (see LICENSE file).

---

Thank you for contributing to StrategyManager! 🎉
