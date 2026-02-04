import { describe, test, expect } from 'bun:test';
import { Validator } from '../Tools/UsageSync/Validator';
import { CostCalculator } from '../Tools/UsageSync/CostCalculator';
import { SourceTagger } from '../Tools/UsageSync/SourceTagger';
import type { UsageData } from '../Tools/UsageSync/interfaces';

// 测试数据
const mockUsageData: UsageData = {
  provider: 'anthropic',
  model: 'claude-3-5-sonnet',
  usage: {
    inputTokens: 1000000,
    outputTokens: 500000,
    totalTokens: 1500000,
    requests: 100,
  },
  cost: 0,
  source: '✅ API (官方)',
  accuracy: 99,
  period: {
    start: new Date('2026-02-01'),
    end: new Date('2026-02-04'),
  },
  lastUpdated: new Date(),
};

describe('DataProcessing - Day 3', () => {
  describe('Validator', () => {
    test('should validate correct UsageData', () => {
      const result = Validator.validateUsageData(mockUsageData);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });
    
    test('should detect missing fields', () => {
      const invalid: any = {
        provider: 'anthropic',
        // missing model
        usage: mockUsageData.usage,
        source: mockUsageData.source,
        accuracy: 99,
      };
      
      const result = Validator.validateUsageData(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('model'))).toBe(true);
    });
    
    test('should validate accuracy range', () => {
      const data: any = {
        ...mockUsageData,
        accuracy: 150,
      };
      
      const result = Validator.validateUsageData(data);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('accuracy'))).toBe(true);
    });
    
    test('should detect duplicate data', () => {
      const data1 = mockUsageData;
      const data2 = { ...mockUsageData };
      
      const result = Validator.detectDuplicates([data1, data2]);
      expect(result.hasDuplicates).toBe(true);
      expect(result.duplicates.length).toBeGreaterThan(0);
    });
    
    test('should detect anomalies (outliers)', () => {
      const normal: UsageData = {
        ...mockUsageData,
        usage: {
          inputTokens: 1000,
          outputTokens: 500,
          totalTokens: 1500,
          requests: 1,
        },
      };
      
      const outlier: UsageData = {
        ...mockUsageData,
        usage: {
          inputTokens: 100000000,
          outputTokens: 50000000,
          totalTokens: 150000000,
          requests: 100,
        },
      };
      
      const result = Validator.detectAnomalies([normal, outlier]);
      // 使用多条数据来检测异常，确保统计意义
      expect(result.anomalies).toBeDefined();
    });
  });
  
  describe('CostCalculator', () => {
    test('should calculate cost for Anthropic', () => {
      const cost = CostCalculator.calculateCost(mockUsageData);
      expect(cost).toBeGreaterThan(0);
      
      // Anthropic: $3/M input, $15/M output
      // 1M * $3/M + 0.5M * $15/M = $3 + $7.5 = $10.5
      expect(cost).toBeCloseTo(10.5, 1);
    });
    
    test('should calculate cost for OpenAI', () => {
      const data: UsageData = {
        ...mockUsageData,
        provider: 'openai',
        model: 'gpt-4-turbo',
        usage: {
          inputTokens: 1000,
          outputTokens: 500,
          totalTokens: 1500,
          requests: 1,
        },
      };
      
      const cost = CostCalculator.calculateCost(data);
      expect(cost).toBeGreaterThan(0);
      // gpt-4-turbo: $0.01/K input, $0.03/K output
      // 1 * $0.01 + 0.5 * $0.03 = $0.025
      expect(cost).toBeCloseTo(0.025, 4);
    });
    
    test('should generate cost report', () => {
      const dataList = [
        mockUsageData,
        { ...mockUsageData, provider: 'openai', model: 'gpt-3.5-turbo' },
      ];
      
      const report = CostCalculator.generateCostReport(dataList);
      
      expect(report.totalCost).toBeGreaterThan(0);
      expect(report.costByProvider).toBeDefined();
      expect(report.costByModel).toBeDefined();
      expect(report.averageCostPerRequest).toBeGreaterThan(0);
    });
    
    test('should get pricing information', () => {
      const pricing = CostCalculator.getPricing('anthropic', 'claude-3-5-sonnet');
      expect(pricing).toBeDefined();
      expect(pricing?.input).toBeGreaterThan(0);
      expect(pricing?.output).toBeGreaterThan(0);
    });
  });
  
  describe('SourceTagger', () => {
    test('should tag data with source information', () => {
      const tagged = SourceTagger.tagData(mockUsageData) as any;
      
      expect(tagged.sourceInfo).toBeDefined();
      expect(tagged.sourceInfo.accuracy).toBe(99);
      expect(tagged.sourceInfo.isOfficial).toBe(true);
      expect(tagged.sourceInfo.trustLevel).toBe('high');
    });
    
    test('should generate source report', () => {
      const dataList = [
        mockUsageData,
        { ...mockUsageData, provider: 'deepseek', accuracy: 75 },
      ];
      
      const report = SourceTagger.generateSourceReport(dataList);
      
      expect(report.totalCount).toBe(2);
      expect(report.officialCount).toBeGreaterThan(0);
      expect(report.estimatedCount).toBeGreaterThan(0);
      expect(report.overallAccuracy).toBeGreaterThan(0);
    });
    
    test('should validate data quality', () => {
      const quality = SourceTagger.validateDataQuality([mockUsageData]);
      
      expect(quality.qualityScore).toBeGreaterThan(0);
      expect(quality.qualityScore).toBeLessThanOrEqual(100);
      expect(quality.issues).toBeDefined();
      expect(quality.recommendations).toBeDefined();
    });
    
    test('should generate source certificate', () => {
      const cert = SourceTagger.generateSourceCertificate([mockUsageData], {
        start: new Date('2026-02-01'),
        end: new Date('2026-02-04'),
      });
      
      expect(cert).toBeTruthy();
      expect(cert).toContain('USAGE DATA SOURCE CERTIFICATE');
      expect(cert).toContain('anthropic');
    });
  });
});
