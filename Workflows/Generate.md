# 动态策略生成工作流

## 目的

描述 StrategyManager 中的动态策略生成（generateDynamicStrategy）流程，根据使用场景、优先级、配额状态动态生成优化的策略配置。

## 触发条件

- 用户请求：显式调用生成命令（例如：`/strategies generate "日常开发"）
- 推荐系统：智能推荐时自动生成
- 配额压力：检测到某提供商配额紧张时自动生成替代策略
- 场景切换：用户在不同工作场景间切换时

## 输入数据

- **场景描述**（description）: 当前使用场景或上下文（如"日常开发"、"深度研究"）
- **优先级**（priority）: 可选的优先级（quality/cost/speed/balanced）
- **配额状态**（quotaStatus）: 各厂商的配额使用情况
- **保留天数**（retentionDays）: 动态策略的保留时间（默认 7 天）
- **是否保存**（save）: 是否保存到文件系统（默认 true）

## 输出

- **动态策略名称**（name）: 格式为 `strategy-generated-{场景}-{时间戳}`
- **配置对象**（config）: 完整的策略配置
- **基础模板**（baseTemplate）: 使用的基础模板名称
- **文件路径**（filePath）: 保存的文件路径（如果保存）

## 执行步骤

### 1. 场景识别与模板选择

- 解析输入描述，识别场景类型（education/health/finance/coding/research/creative/daily 等）
- 根据场景类型从 SCENARIO_TEMPLATE_MAP 选择合适的基础模板
- 加载基础模板配置

### 2. 配额感知优化

- 分析当前各提供商的配额使用情况
- 识别配额紧张的提供商（使用率 ≥ 80%）
- 为受限提供商的模型选择替代方案：
  - **quality 优先**: claude-sonnet → gpt-5.2-codex → glm-4.7
  - **cost 优先**: glm-4.7 → gemini-flash → claude-haiku
  - **speed 优先**: gemini-flash → claude-haiku → gpt-5.2-codex
  - **balanced**: 综合考虑，优先使用高额度资源

### 3. 参数调优

根据场景类型调整 agent 参数：

- **temperature**:
  - 编码/研究/金融: 0.2-0.25（精确）
  - 创意/写作/多媒体: 0.6-0.75（创新）
  - 日常/工具: 0.3（平衡）
- **maxTokens**:
  - 研究: 7000（深度）
  - 编码/金融: 4500-5000（中等）
  - 日常: 3000-3500（轻量）

### 4. 元数据更新

- 更新 description：添加"动态生成"标记
- 设置 metadata.updated 为当前日期
- 设置 metadata.use_case 为场景类型
- 标记 metadata.optimization 为 "dynamic-generated"

### 5. 验证与保存

- 使用 validateStrategy() 验证生成的配置
- 清理超过保留期的旧动态策略
- 如果 save=true，保存到 ~/.config/opencode/dynamic-strategies/
- 返回动态策略结果

## 实现参考

**核心函数**（Tools/ManageStrategies.ts）:

```typescript
// 主生成函数
export function generateDynamicStrategy(
  options: DynamicStrategyOptions,
): DynamicStrategyResult | null;

// 配额感知模型选择
function selectFallbackModel(
  priority: Priority,
  quotaStatus?: QuotaStatus[],
): string | null;

// Agent 模型优化
function optimizeAgentModels(
  config: StrategyConfig,
  priority: Priority,
  quotaStatus?: QuotaStatus[],
): void;

// 参数调优
function tuneAgentParameters(
  config: StrategyConfig,
  scenarioType: ScenarioType,
): void;

// 清理旧策略
export function cleanupDynamicStrategies(retentionDays: number = 7): number;

// 固化动态策略
export function saveDynamicStrategyAs(
  dynamicName: string,
  targetName: string,
): boolean;
```

## 使用示例

```bash
# 生成日常开发策略
/strategies generate "日常开发" --priority balanced

# 生成深度研究策略（含配额感知）
/strategies generate "深度研究" --priority quality --with-usage-sync

# 列出包含动态策略的所有策略
/strategies list --include-dynamic

# 将动态策略固化为永久策略
/strategies save-dynamic strategy-generated-coding-202602051430 my-custom-strategy
```

## 验证方法

### 单元验证

1. **场景识别测试**
   - 输入: "日常开发" → 识别为 `coding` 场景
   - 输入: "深度研究" → 识别为 `research` 场景
   - 输入: "创意写作" → 识别为 `creative` 场景

2. **配额感知测试**
   - 模拟 Anthropic 配额紧张（80%）
   - 验证 claude 模型被替换为 gpt 或 glm
   - 验证替换后的策略仍通过验证

3. **参数调优测试**
   - coding 场景: temperature=0.2, maxTokens=5000
   - creative 场景: temperature=0.75, maxTokens=5000
   - daily 场景: temperature=0.3, maxTokens=3500

4. **清理测试**
   - 创建 10 天前的动态策略
   - 调用 cleanupDynamicStrategies(7)
   - 验证旧策略被删除

### 集成验证

1. 生成策略并切换使用
2. 验证生成的策略配置正确
3. 验证可以正常工作
4. 验证自动清理功能

## 注意事项

1. **配额同步**: 建议在生成前同步配额状态（`--with-usage-sync`）
2. **模板依赖**: 确保基础模板文件存在且有效
3. **自动清理**: 默认 7 天清理，可通过 retentionDays 调整
4. **固化建议**: 满意的动态策略应及时固化为永久策略
5. **验证必需**: 所有生成的策略必须通过 schema 验证

## 相关约定

- 动态策略命名: `strategy-generated-{场景}-{时间戳}`
- 存储位置: `~/.config/opencode/dynamic-strategies/`
- 自动清理: 默认保留 7 天
- 场景映射: 参考 SCENARIO_TEMPLATE_MAP 常量
- 模型回退: 参考 MODEL_FALLBACKS 常量

## 发现与改进

- **发现**: 配额感知能够有效避免在高负载时段使用受限资源
- **建议**: 可以增加更多场景类型的模板映射
- **优化**: 可以根据历史使用数据动态调整参数调优规则
- **扩展**: 可以支持多模板融合生成
