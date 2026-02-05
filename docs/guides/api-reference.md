# API 参考（精简版）

仅保留核心入口与常用函数。

---

## 核心入口

`Tools/ManageStrategies.ts`

- listStrategies()
- switchStrategy(name)
- compareStrategies(a, b)
- exportStrategy(name, path)
- importStrategy(name, path)
- validateStrategy(config)
- recommendStrategySmart(input)
- generateDynamicStrategy(options)

---

## 使用同步

`Tools/UsageSync/`

- UsageSyncCoordinator
- 各提供商 Sync

---

## 成本报告

`Tools/CostReport.ts`

- CostReport

---

## 示例

```ts
import { recommendStrategySmart } from "./Tools/ManageStrategies";

const rec = recommendStrategySmart({
  description: "日常开发",
  priority: "balanced",
});

console.log(rec?.strategyName);
```
