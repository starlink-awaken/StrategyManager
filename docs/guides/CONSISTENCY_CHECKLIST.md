# 一致性检查清单

## 📋 目的

确保项目各部分的逻辑一致性，避免因修改某一处而导致其他相关部分失效或混乱。

## ✅ 检查原则

**核心准则**：任何修改和改动，必须保证前后逻辑一致性，确保 `scripts/`、`docs/`、`templates/`、`Workflows/`、`Tools/` 等目录内容同步更新。

---

## 🔍 变更影响分析表

### 1. 修改 TypeScript 类型定义（Tools/*.ts）

| 影响范围 | 需要检查的文件 | 检查项 |
|---------|--------------|--------|
| **Templates** | `templates/*.jsonc` | ✅ 所有策略文件是否包含新增字段？<br>✅ 是否需要提供新字段的默认值示例？<br>✅ 运行 `validate` 命令确认兼容性 |
| **Workflows** | `Workflows/*.md` | ✅ 工作流描述是否提及新字段？<br>✅ 操作步骤是否需要更新？<br>✅ 输出示例是否包含新字段？ |
| **Docs** | `docs/guides/USAGE_GUIDE.md`<br>`README.md` | ✅ 字段说明文档是否需要更新？<br>✅ 示例代码是否仍然有效？<br>✅ API 文档是否需要补充？ |
| **Tests** | `tests/*.test.ts` | ✅ 测试用例是否覆盖新增字段？<br>✅ Mock 数据是否需要更新？<br>✅ 边界条件测试是否充分？ |
| **Scripts** | `scripts/*.sh` | ✅ 脚本是否依赖字段名称？<br>✅ 脚本输出是否需要调整？ |

---

### 2. 修改验证逻辑（Tools/Validator.ts）

| 影响范围 | 需要检查的文件 | 检查项 |
|---------|--------------|--------|
| **Templates** | `templates/*.jsonc` | ✅ 所有模板是否通过新验证规则？<br>✅ 是否有警告或错误需要修复？ |
| **Workflows** | `Workflows/Validate.md`<br>`Workflows/Fix.md` | ✅ 验证流程说明是否需要更新？<br>✅ 错误处理步骤是否仍然有效？<br>✅ Fix 建议是否与代码一致？ |
| **Docs** | `docs/guides/USAGE_GUIDE.md`<br>`docs/architecture/ARCHITECTURE.md` | ✅ 验证层次说明是否需要更新？<br>✅ 错误码文档是否完整？<br>✅ 示例输出是否匹配最新格式？ |
| **Tests** | `tests/ManageStrategies.test.ts` | ✅ 验证测试用例是否覆盖新规则？<br>✅ 预期输出是否需要更新？ |

---

### 3. 添加/修改命令（Tools/ManageStrategies.ts）

| 影响范围 | 需要检查的文件 | 检查项 |
|---------|--------------|--------|
| **Workflows** | `Workflows/*.md` | ✅ 是否需要新建工作流文档？<br>✅ 命令参数说明是否完整？<br>✅ 使用示例是否准确？ |
| **Scripts** | `scripts/strategy-helper.sh`<br>`scripts/install.sh` | ✅ 脚本是否需要集成新命令？<br>✅ 别名是否需要更新？<br>✅ 帮助信息是否完整？ |
| **Docs** | `README.md`<br>`docs/guides/USAGE_GUIDE.md`<br>`SKILL.md` | ✅ 命令列表是否需要更新？<br>✅ 快速开始指南是否包含新命令？<br>✅ Skill 触发词是否需要添加？ |
| **Tests** | `tests/*.test.ts` | ✅ 新命令是否有完整测试覆盖？<br>✅ 成功/失败场景是否都有测试？ |

---

### 4. 修改策略模板（templates/*.jsonc）

| 影响范围 | 需要检查的文件 | 检查项 |
|---------|--------------|--------|
| **Docs** | `README.md` (策略概览表)<br>`docs/guides/USAGE_GUIDE.md`<br>`strategies.md` | ✅ 策略描述是否需要更新？<br>✅ 成本估算是否仍然准确？<br>✅ 适用场景说明是否完整？<br>✅ 策略对比表是否需要调整？ |
| **Tools** | `Tools/Recommender.ts` | ✅ 推荐逻辑是否需要调整？<br>✅ 权重计算是否仍然合理？<br>✅ 策略元数据是否与模板一致？ |
| **Workflows** | `Workflows/List.md`<br>`Workflows/Compare.md`<br>`Workflows/Recommend.md` | ✅ 策略列表输出是否需要更新？<br>✅ 比较示例是否需要调整？<br>✅ 推荐场景是否需要补充？ |
| **Validation** | 运行所有验证命令 | ✅ 是否通过 schema 验证？<br>✅ 是否触发新的警告或错误？ |

---

### 5. 修改工作流文档（Workflows/*.md）

| 影响范围 | 需要检查的文件 | 检查项 |
|---------|--------------|--------|
| **SKILL.md** | `SKILL.md` | ✅ 触发条件是否需要更新？<br>✅ 工作流映射是否正确？<br>✅ 说明是否与工作流内容一致？ |
| **Docs** | `docs/guides/USAGE_GUIDE.md`<br>`README.md` | ✅ 用户指南是否需要同步更新？<br>✅ 示例输出是否与工作流一致？ |
| **Tools** | `Tools/ManageStrategies.ts` | ✅ 工作流描述的功能是否已实现？<br>✅ 参数说明是否与代码一致？<br>✅ 错误处理是否匹配？ |

---

### 6. 修改脚本（scripts/*.sh）

| 影响范围 | 需要检查的文件 | 检查项 |
|---------|--------------|--------|
| **Docs** | `README.md`<br>`docs/guides/USAGE_GUIDE.md` | ✅ 安装说明是否需要更新？<br>✅ 快速开始步骤是否仍然有效？<br>✅ 脚本参数文档是否完整？ |
| **Tools** | `Tools/PathManager.ts` | ✅ 路径定义是否与脚本一致？<br>✅ 环境变量是否同步？ |
| **Tests** | 运行集成测试 | ✅ 脚本是否在各平台正常工作？<br>✅ 错误处理是否健壮？ |

---

### 7. 修改文档（docs/**）

| 影响范围 | 需要检查的文件 | 检查项 |
|---------|--------------|--------|
| **README.md** | `README.md` | ✅ 核心概念是否一致？<br>✅ 链接是否都有效？<br>✅ 版本号是否需要更新？ |
| **CHANGELOG.md** | `CHANGELOG.md` | ✅ 是否记录了重要变更？<br>✅ 版本号是否规范？<br>✅ 破坏性变更是否标注？ |
| **其他文档** | 所有相关 `.md` 文件 | ✅ 交叉引用是否正确？<br>✅ 示例代码是否可运行？<br>✅ 技术细节是否与代码一致？ |

---

## 🔄 标准修改流程

### Step 1: 变更前分析
```bash
# 1. 识别修改的核心文件
# 2. 使用上述表格识别所有受影响的范围
# 3. 列出需要检查/更新的文件清单
```

### Step 2: 实施修改
```bash
# 1. 修改核心逻辑（Tools/*.ts）
# 2. 更新相关测试（tests/*.test.ts）
# 3. 运行测试确保不破坏现有功能
bun test
```

### Step 3: 同步更新
```bash
# 1. 更新模板文件（如需要）
# 2. 更新工作流文档（Workflows/*.md）
# 3. 更新用户指南（docs/guides/*.md）
# 4. 更新 README 和 CHANGELOG
```

### Step 4: 验证一致性
```bash
# 1. 运行类型检查
bun run type-check

# 2. 运行所有测试
bun test

# 3. 验证所有模板
for file in templates/*.jsonc; do
  bun run Tools/ManageStrategies.ts validate "$file"
done

# 4. 检查文档链接
# 5. 手动测试关键流程
```

### Step 5: 文档记录
```bash
# 1. 更新 CHANGELOG.md
# 2. 如有破坏性变更，在 README 中明确说明
# 3. 更新版本号（package.json）
```

---

## 🎯 快速检查命令

### 全面验证
```bash
# 类型检查
bun run type-check

# 测试
bun test

# 验证所有模板
for f in templates/*.jsonc; do echo "=== $f ==="; bun run Tools/ManageStrategies.ts validate "$f"; done

# 检查死链接（需要安装 markdown-link-check）
find . -name "*.md" -not -path "*/node_modules/*" -exec markdown-link-check {} \;
```

### 快速自检清单
- [ ] 代码通过类型检查
- [ ] 所有测试通过
- [ ] 所有模板验证通过
- [ ] 文档与代码一致
- [ ] CHANGELOG 已更新
- [ ] 破坏性变更已标注

---

## 📝 常见一致性问题

### ❌ 问题 1：类型定义更新但模板未更新
**症状**：新增字段后，模板文件没有示例导致用户不知道如何使用

**解决**：至少在一个参考模板中提供新字段的使用示例

---

### ❌ 问题 2：验证逻辑改变但文档未更新
**症状**：用户根据旧文档配置策略，却遇到新的验证错误

**解决**：同步更新 `docs/guides/USAGE_GUIDE.md` 中的验证说明

---

### ❌ 问题 3：命令参数改变但工作流未更新
**症状**：Workflows/*.md 中的示例命令无法执行

**解决**：同步更新工作流中的所有命令示例

---

### ❌ 问题 4：策略模板修改但推荐逻辑未调整
**症状**：推荐系统给出的建议与实际策略内容不符

**解决**：检查 `Tools/Recommender.ts` 中的策略元数据和权重

---

## 🔗 相关文档

- [项目架构](../architecture/ARCHITECTURE.md)
- [使用指南](USAGE_GUIDE.md)
- [开发指南](../../README.md)
- [变更日志](../../CHANGELOG.md)
