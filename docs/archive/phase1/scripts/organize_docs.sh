#!/bin/bash
# 整理验证文档

cd /Volumes/Model/Workspace/Skills/StrategyManager

# 创建目录
mkdir -p docs/verification

# 移动验证文档
mv 00_完整总结_请先读这个.md docs/verification/ 2>/dev/null
mv 答案_功能都测试了吗.md docs/verification/ 2>/dev/null
mv 快速修复指南_1小时完成.md docs/verification/ 2>/dev/null
mv 文档索引_8份新文档完整列表.md docs/verification/ 2>/dev/null
mv 当前状态_立即查看.md docs/verification/ 2>/dev/null
mv 验证对比_代码审查vs实际测试.md docs/verification/ 2>/dev/null
mv RUN_ACTUAL_TESTS.md docs/verification/ 2>/dev/null

# 移动所有 P1 验证文件
mv P1_*.md docs/verification/ 2>/dev/null
mv P1_*.ts docs/verification/ 2>/dev/null
mv P1_*.txt docs/verification/ 2>/dev/null

# 移动临时脚本
mv extract_auth.py docs/verification/ 2>/dev/null
mv generate_verification_report.py docs/verification/ 2>/dev/null
mv run_all_tests.ts docs/verification/ 2>/dev/null
mv run_tests_with_auth.sh docs/verification/ 2>/dev/null
mv setup_auth.ts docs/verification/ 2>/dev/null
mv verify-p1-4.ts docs/verification/ 2>/dev/null

echo "✅ 文档整理完成"
ls -la docs/verification/
