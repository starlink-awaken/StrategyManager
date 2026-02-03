# 贡献指南

感谢你考虑为 StrategyManager 做出贡献！我们欢迎所有形式的贡献，包括但不限于：

- 🐛 报告 Bug
- 💡 提出新功能建议
- 📝 改进文档
- 🔧 提交代码修复
- ✨ 添加新功能

---

## 📋 行为准则

在参与项目时，请尊重所有贡献者，保持友善和专业的交流态度。我们致力于为所有人提供一个开放和包容的环境。

---

## 🐛 如何报告 Bug

在你创建 Bug 报告之前，请先检查是否已有人报告了相同的问题。

### 创建 Bug 报告

1. 前往 [Issues 页面](https://github.com/starlink-awaken/StrategyManager/issues)
2. 点击 "New Issue"
3. 选择 "Bug Report" 模板
4. 填写以下信息：

   - **标题**: 清晰简短地描述问题
   - **环境信息**:
     - 操作系统
     - Node.js 版本
     - StrategyManager 版本
   - **重现步骤**: 详细描述如何重现这个问题
   - **预期行为**: 你期望发生什么
   - **实际行为**: 实际发生了什么
   - **截图/日志**: 如果适用，添加截图或错误日志
   - **附加信息**: 任何其他有助于解决问题的信息

---

## 💡 如何提出功能建议

我们欢迎功能建议！如果你有好的想法，请：

1. 检查 [Issues](https://github.com/starlink-awaken/StrategyManager/issues) 确保该功能未被建议
2. 创建一个新的 Issue，标题以 `[Feature]` 开头
3. 在描述中包含：

   - **功能描述**: 清晰描述你希望添加的功能
   - **使用场景**: 这个功能解决什么问题
   - **可能的实现**: 如果你已经有实现思路，请分享
   - **替代方案**: 是否有其他方式可以达到相同目的

---

## 🔧 开发流程

### 环境准备

1. **Fork 项目**

   ```bash
   # 在 GitHub 上点击 Fork 按钮
   ```

2. **克隆你的 Fork**

   ```bash
   git clone https://github.com/YOUR_USERNAME/StrategyManager.git
   cd StrategyManager
   ```

3. **添加上游仓库**

   ```bash
   git remote add upstream https://github.com/starlink-awaken/StrategyManager.git
   ```

4. **安装依赖**

   ```bash
   npm install
   # 或
   bun install
   ```

### 创建分支

```bash
# 从 main 分支创建新分支
git checkout -b feature/your-feature-name
# 或
git checkout -b fix/your-bug-fix
```

分支命名约定：

- `feature/` - 新功能
- `fix/` - Bug 修复
- `docs/` - 文档更新
- `refactor/` - 代码重构
- `test/` - 测试相关
- `chore/` - 构建/工具相关

### 代码规范

- **TypeScript**: 使用 TypeScript 编写代码
- **注释**: 为复杂逻辑添加注释
- **命名**: 使用清晰、描述性的变量和函数名
- **格式**: 保持代码格式一致
- **测试**: 为新功能添加测试

### 提交更改

1. **添加文件**

   ```bash
   git add .
   # 或
   git add path/to/specific/file
   ```

2. **创建提交**

   ```bash
   git commit -m "feat: add strategy comparison feature"
   ```

   提交消息格式（遵循 [Conventional Commits](https://www.conventionalcommits.org/)）：

   - `feat:` - 新功能
   - `fix:` - Bug 修复
   - `docs:` - 文档更新
   - `style:` - 代码格式（不影响功能）
   - `refactor:` - 代码重构
   - `test:` - 测试相关
   - `chore:` - 构建/工具相关

   示例：
   ```bash
   feat(comparison): add side-by-side strategy comparison
   fix(import): handle invalid JSON gracefully
   docs(readme): update installation instructions
   ```

3. **推送到你的 Fork**

   ```bash
   git push origin feature/your-feature-name
   ```

### 创建 Pull Request

1. 前往 [Pull Requests 页面](https://github.com/starlink-awaken/StrategyManager/pulls)
2. 点击 "New Pull Request"
3. 选择你的分支
4. 填写 PR 模板：

   - **标题**: 清晰描述更改内容
   - **描述**: 详细说明：
     - 这个 PR 做了什么
     - 为什么需要这些更改
     - 相关 Issue（使用 `Closes #123` 或 `Fixes #123`）
     - 测试情况
     - 截图（如果适用）

5. 等待代码审查

### 更新你的分支

在开发过程中，定期同步上游仓库的更改：

```bash
# 获取上游更改
git fetch upstream

# 合并上游 main 分支
git checkout main
git merge upstream/main

# 推送到你的 Fork
git push origin main

# 将更新合并到你的功能分支
git checkout feature/your-feature-name
git merge main
```

---

## 📝 文档贡献

文档是项目的重要组成部分！你可以：

- 修正拼写和语法错误
- 改进现有文档的清晰度
- 添加使用示例
- 翻译文档

### 文档改进流程

1. 按照上述开发流程创建分支
2. 修改文档文件
3. 提交 PR，标题以 `docs:` 开头

---

## 🧪 测试

如果你添加了新功能或修复了 Bug，请确保：

1. **手动测试**: 验证你的更改在各种场景下正常工作
2. **边界情况**: 测试边界条件和错误情况
3. **向后兼容**: 确保更改不会破坏现有功能

---

## 📧 获取帮助

如果你在贡献过程中遇到问题：

- 查看 [文档](README.md)
- 在 Issue 中提问（标签为 `question`）
- 联系维护者

---

## 🎉 贡献者

感谢所有贡献者！你的名字将出现在 [贡献者列表](https://github.com/starlink-awaken/StrategyManager/graphs/contributors) 中。

---

## 📄 许可证

通过贡献代码，你同意你的贡献将在与项目相同的 [MIT License](LICENSE) 下发布。

---

**再次感谢你的贡献！🙏**
