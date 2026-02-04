# Feedback Report

When to use
-------------
- 需要查看推荐采纳率、Top 推荐/选择策略统计时使用。
- 适用于：验证推荐有效性、评估策略偏好变化。

Step-by-step
-----------
1. 调用 `generateRecommendationFeedbackReport({ bucket })` 生成统计数据。
   - bucket 可选：`day` | `week` | `month`
2. 使用 `renderRecommendationFeedbackReport()` 输出文本报告，或输出 JSON 供分析。
3. 可选：将报告写入文件以便归档。

Notes on implementation
-----------------------
- 入口命令：`feedback-report`（位于 Tools/ManageStrategies.ts）
- 支持参数：
  - `--bucket day|week|month`
  - `--format text|json`
  - `--output ./report.txt`

Verification
------------
- 当存在推荐反馈记录时，报告应包含：
  - 总推荐次数、采纳次数、采纳率
  - Top 推荐策略 / Top 选择策略
  - 按时间分桶的统计表

Append findings
---------------
- 采纳率可用于判断推荐是否与用户选择一致。
- 时间分桶可观察策略偏好是否随时间变化。