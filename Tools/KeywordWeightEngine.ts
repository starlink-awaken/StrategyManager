/**
 * KeywordWeightEngine.ts
 * 高级关键词权重引擎
 * 用于精确识别场景、优先级、复杂度等多维信息
 *
 * 功能:
 * - 多维关键词识别 (场景、优先级、修饰词)
 * - 强度修饰词处理 (非常、有点、等)
 * - 否定表达解析 (不要、避免、等)
 * - 条件表达识别 (如果...就...否则...)
 * - 归一化分数输出
 */

import type { ScenarioType, Priority } from "./Recommender";

// ==================== 类型定义 ====================

export interface KeywordWeightConfig {
  scenarios: Record<
    ScenarioType,
    {
      primary: string[];
      weight: number;
    }
  >;

  priorities: Record<
    Priority,
    {
      keywords: string[];
      weight_override: number;
    }
  >;

  modifiers: Record<string, number>;

  negations: {
    must_avoid: string[];
    must_exclude: string[];
    avoid_reduction_factor: number;
    exclude_reduction_factor: number;
  };
}

export interface ScenarioScores {
  primary: [ScenarioType, number]; // [场景, 置信度]
  secondary: Array<[ScenarioType, number]>; // 备选场景
}

export interface PriorityIdentification {
  priority: Priority | null;
  intensity: number; // 0-1, 优先级强度
}

// ==================== 默认配置 ====================

const DEFAULT_CONFIG: KeywordWeightConfig = {
  scenarios: {
    education: {
      primary: [
        "教育",
        "教学",
        "子女",
        "学生",
        "课程",
        "education",
        "learning", // 但不包含单独的"学"
        "teach",
        "teaching",
      ],
      weight: 0.7, // 降低权重
    },
    "agent-heavy": {
      "primary": ["代理", "重负载", "agent", "heavy-duty"],
      "weight": 0.8
    },
    health: {
      primary: [
        "健康",
        "医疗",
        "养生",
        "体检",
        "health",
        "medical",
        "wellness",
        "doctor",
      ],
      weight: 0.8,
    },
    finance: {
      primary: [
        "金融",
        "股票",
        "交易",
        "投资",
        "基金",
        "finance",
        "trading",
        "investment",
        "stock",
      ],
      weight: 0.8,
    },
    coding: {
      primary: [
        "编程",
        "代码",
        "开发",
        "算法",
        "学编程", // 常见组合
        "写代码",
        "coding",
        "development",
        "programming",
        "algorithm",
        "code",
        "software",
      ],
      weight: 0.9, // 提高权重
    },
    research: {
      primary: [
        "研究",
        "分析",
        "深度",
        "调查",
        "research",
        "analysis",
        "investigation",
        "deep",
      ],
      weight: 0.85,
    },
    creative: {
      primary: ["创作", "创意", "creative", "creation", "innovation"],
      weight: 0.8,
    },
    writing: {
      primary: ["写作", "文章", "writing", "article", "blog"],
      weight: 0.75,
    },
    multimedia: {
      primary: [
        "多媒体",
        "视频",
        "音频",
        "multimedia",
        "video",
        "audio",
        "visual",
      ],
      weight: 0.75,
    },
    social: {
      primary: [
        "新媒体",
        "社交",
        "运营",
        "social media",
        "operation",
        "marketing",
      ],
      weight: 0.75,
    },
    tools: {
      primary: ["工具", "辅助", "tool", "utility", "helper"],
      weight: 0.7,
    },
    entertainment: {
      primary: ["娱乐", "游戏", "entertainment", "game", "fun"],
      weight: 0.7,
    },
    documentation: {
      primary: ["公文", "文档", "报告", "documentation", "report", "document"],
      weight: 0.7,
    },
    daily: {
      primary: ["日常", "常规", "daily", "routine", "general"],
      weight: 0.6,
    },
  },

  priorities: {
    quality: {
      keywords: [
        "质量",
        "质量最好",
        "完美",
        "professional",
        "premium",
        "best",
        "excellent",
      ],
      weight_override: 0.4,
    },
    cost: {
      keywords: [
        "便宜",
        "低成本",
        "省钱",
        "预算",
        "economical",
        "cheap",
        "budget",
        "affordable",
      ],
      weight_override: 0.45,
    },
    speed: {
      keywords: [
        "快速",
        "紧急",
        "立即",
        "asap",
        "urgent",
        "immediate",
        "fast",
        "quick",
      ],
      weight_override: 0.4,
    },
    balanced: {
      keywords: ["平衡", "综合", "balanced", "comprehensive"],
      weight_override: 0.35,
    },
  },

  modifiers: {
    // 强度修饰词
    非常: 1.4,
    很: 1.25,
    特别: 1.3,
    极其: 1.5,
    绝对: 1.4,
    extremely: 1.5,
    very: 1.25,
    really: 1.2,
    quite: 1.15,

    // 轻度修饰词
    有点: 0.8,
    比较: 0.85,
    大概: 0.8,
    somewhat: 0.85,
    kind: 0.8,
    of: 0.75,

    // 弱化修饰词
    勉强: 0.6,
    基本: 0.75,
    barely: 0.5,
    slightly: 0.7,
  },

  negations: {
    must_avoid: ["不要", "避免", "不想", "别", "don't", "avoid"],
    must_exclude: ["除非", "别用", "不包括", "exclude", "except"],
    avoid_reduction_factor: 0.2,
    exclude_reduction_factor: 0.0,
  },
};

// ==================== 关键词权重引擎类 ====================

export class KeywordWeightEngine {
  private config: KeywordWeightConfig;

  constructor(config?: Partial<KeywordWeightConfig>) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };
  }

  /**
   * 识别场景及其置信度
   * 返回: { primary: [主场景, 置信度], secondary: [[备选场景1, 置信度1], ...] }
   */
  identifyScenarios(description: string): ScenarioScores {
    const lowerDesc = this.normalizeText(description);
    const tokens = this.tokenize(lowerDesc);
console.log('Tokens:', tokens);
    const scores = {} as Record<ScenarioType, number>;

    // 初始化所有场景分数
    for (const scenario of Object.keys(this.config.scenarios)) {
      scores[scenario as ScenarioType] = 0;
    }

    // 检测否定词位置
    const negationPositions = new Set<number>();
    for (let i = 0; i < tokens.length; i++) {
      if (
        this.config.negations.must_avoid.includes(tokens[i]) ||
        this.config.negations.must_exclude.includes(tokens[i])
      ) {
        negationPositions.add(i);
      }
    }

    // 遍历每个 token，计算加权分数
    let lastEmphasis = 1.0;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      // 1. 检查是否为强度修饰词
      const emphasis = this.config.modifiers[token];
      if (emphasis !== undefined) {
        lastEmphasis = emphasis;
        continue;
      }

      // 2. 检查是否在否定词后面
      const isNegated = Array.from(negationPositions).some(
        (pos) => pos < i && i - pos <= 10, // 否定词后10个token内
      );

      // 3. 检查是否为场景主关键词
      for (const [scenario, config] of Object.entries(this.config.scenarios)) {
        if (config.primary.includes(token)) {
          let scoreIncrement = config.weight * lastEmphasis;

          // 如果被否定，大幅降低分数
          if (isNegated) {
            scoreIncrement *= 0.2; // 降低到20%
          }

          scores[scenario as ScenarioType] += scoreIncrement;
        }
      }

      // 重置强调
      lastEmphasis = 1.0;
    }

    // 归一化分数并返回
    const hasNegation = negationPositions.size > 0;
    const maxScore = Math.max(...Object.values(scores), 0.01);

    const normalized = Object.entries(scores).map(([scenario, score]) => {
      let normalizedScore = Math.min(score / maxScore, 1.0);
      // 如果有否定词，所有场景分数都打折（避免归一化抹除差异）
      if (hasNegation) {
        normalizedScore *= 0.7; // 整体降低30%
      }
      return [scenario as ScenarioType, normalizedScore] as [
        ScenarioType,
        number,
      ];
    });

    const sorted = normalized
      .filter(([_, score]) => score > 0.005) // 下降阈值以保留更多secondary
      .sort((a, b) => b[1] - a[1]);

    const primary: [ScenarioType, number] = sorted[0] || ["daily", 0.5];
    const secondary = sorted.slice(1, 4);

    return {
      primary,
      secondary: (secondary as Array<[ScenarioType, number]>) || [],
    };
  }

  /**
   * 识别优先级及其强度
   */
  identifyPriority(description: string): PriorityIdentification {
    const lowerDesc = this.normalizeText(description);

    for (const [priority, config] of Object.entries(this.config.priorities)) {
      for (const keyword of config.keywords) {
        if (lowerDesc.includes(keyword)) {
          return {
            priority: priority as Priority,
            intensity: config.weight_override,
          };
        }
      }
    }

    return { priority: null, intensity: 0 };
  }

  /**
   * 计算复杂度分数 (0-1)
   */
  calculateComplexity(description: string): number {
    const lowerDesc = this.normalizeText(description);
    let score = 0;

    const complexKeywords = [
      "复杂",
      "深度",
      "分析",
      "优化",
      "complex",
      "analysis",
      "optimization",
      "高级",
      "困难",
      "challenging",
      "advanced",
      "detailed",
    ];

    for (const keyword of complexKeywords) {
      if (lowerDesc.includes(keyword)) score += 0.6; // 提高权重确保>0.5
    }

    // 字数和细节度：更长的描述通常表示更复杂
    score += Math.min(description.length / 200, 0.2);

    return Math.min(score, 1.0);
  }

  /**
   * 计算紧急程度 (0-1)
   */
  calculateUrgency(description: string): number {
    const lowerDesc = this.normalizeText(description);
    let score = 0;

    const urgentKeywords = [
      "紧急",
      "立即",
      "今天",
      "现在",
      "urgent",
      "asap",
      "immediately",
    ];

    for (const keyword of urgentKeywords) {
      if (lowerDesc.includes(keyword)) score += 0.25;
    }

    // 时间边界检测
    if (/今天|这周|明天|tomorrow|this week|today/.test(lowerDesc)) {
      score += 0.2;
    }

    return Math.min(score, 1.0);
  }

  /**
   * 识别是否重复性任务
   */
  isRecurringTask(description: string): boolean {
    const lowerDesc = this.normalizeText(description);
    const recurringKeywords = [
      "每天",
      "每周",
      "每月",
      "经常",
      "daily",
      "weekly",
      "monthly",
      "regularly",
      "often",
    ];

    return recurringKeywords.some((kw) => lowerDesc.includes(kw));
  }

  /**
   * 检测是否包含条件表达式
   */
  detectConditionalExpression(description: string): boolean {
    const patterns = [
      /如果(.+?)就(.+?)否则(.+)/,
      /当(.+?)时[，,](.+)/,
      /如果(.+?)[，,](.+)/,
      /if\s+(.+?)\s+then\s+(.+?)\s+else\s+(.+)/i,
    ];

    return patterns.some((pattern) => pattern.test(description));
  }

  /**
   * 私有方法: 文本标准化
   */
  private normalizeText(text: string): string {
    return text.toLowerCase().trim();
  }

  /**
   * 私有方法: 分词 (中英混合)
   */
  private tokenize(text: string): string[] {
    // 收集所有需要识别的关键词
    const allKeywords: string[] = [];
    for (const scenario of Object.values(this.config.scenarios)) {
      allKeywords.push(...scenario.primary);
    }
    // 添加否定词、修饰词等
    allKeywords.push(...this.config.negations.must_avoid);
    allKeywords.push(...this.config.negations.must_exclude);
    allKeywords.push(...Object.keys(this.config.modifiers));

    // 按长度排序，优先匹配长词
    const sortedKeywords = [...new Set(allKeywords)]
      .filter((k) => k.length > 1)
      .sort((a, b) => b.length - a.length);

    const tokens: string[] = [];
    let remaining = text;

    // 从左到右扫描，贪婪匹配最长关键词
    while (remaining.length > 0) {
      let matched = false;

      for (const keyword of sortedKeywords) {
        if (remaining.startsWith(keyword)) {
          tokens.push(keyword);
          remaining = remaining.substring(keyword.length);
          matched = true;
          break;
        }
      }

      if (!matched) {
        // 没有匹配到关键词，移动一个字符
        const char = remaining[0];
        // 跳过标点和空格
        if (!/[\s\p{P}]/u.test(char)) {
          tokens.push(char);
        }
        remaining = remaining.substring(1);
      }
    }

    return tokens.filter((t) => t.trim() !== "");
  }
}

export default KeywordWeightEngine;
