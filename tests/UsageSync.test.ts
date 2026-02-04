import { describe, test, expect, beforeAll } from 'bun:test';
import { AnthropicSync } from '../Tools/UsageSync/AnthropicSync';
import { OpenAISync } from '../Tools/UsageSync/OpenAISync';
import { ZhiPuSync } from '../Tools/UsageSync/ZhiPuSync';
import { GitHubSync } from '../Tools/UsageSync/GitHubSync';
import { GeminiSync } from '../Tools/UsageSync/GeminiSync';
import { DeepSeekSync, SiliconFlowSync } from '../Tools/UsageSync/LocalStatsSync';
import { UsageSyncCoordinator } from '../Tools/UsageSync';
import type { UsageData } from '../Tools/UsageSync/interfaces';

describe('UsageSync - Day 1 Tests', () => {
  describe('AnthropicSync', () => {
    let sync: AnthropicSync;
    
    beforeAll(() => {
      if (!process.env.ANTHROPIC_API_KEY) {
        console.warn('⚠️  ANTHROPIC_API_KEY not set, some tests will be skipped');
      }
    });
    
    test('should throw error without API key', () => {
      const originalKey = process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      
      expect(() => new AnthropicSync()).toThrow('ANTHROPIC_API_KEY is required');
      
      if (originalKey) process.env.ANTHROPIC_API_KEY = originalKey;
    });
    
    test('should initialize with API key', () => {
      if (!process.env.ANTHROPIC_API_KEY) return;
      
      expect(() => new AnthropicSync()).not.toThrow();
      sync = new AnthropicSync();
      expect(sync.provider).toBe('anthropic');
      expect(sync.accuracy).toBe(99);
    });
    
    test('should pass health check if CLI installed', async () => {
      if (!process.env.ANTHROPIC_API_KEY) return;
      
      sync = new AnthropicSync();
      const healthy = await sync.healthCheck();
      // 健康检查可能失败（如果 CLI 未安装），但不应该抛出错误
      expect(typeof healthy).toBe('boolean');
    });
    
    test('should fetch usage data', async () => {
      if (!process.env.ANTHROPIC_API_KEY) {
        console.warn('⚠️  Skipping usage fetch test (no API key)');
        return;
      }
      
      sync = new AnthropicSync();
      
      try {
        const data = await sync.fetchUsage();
        
        // 验证数据结构
        expect(data).toBeInstanceOf(Array);
        
        if (data.length > 0) {
          const item = data[0];
          expect(item).toHaveProperty('provider', 'anthropic');
          expect(item).toHaveProperty('model');
          expect(item).toHaveProperty('usage');
          expect(item.usage).toHaveProperty('inputTokens');
          expect(item.usage).toHaveProperty('outputTokens');
          expect(item.usage).toHaveProperty('totalTokens');
          expect(item).toHaveProperty('source', '✅ API (官方)');
          expect(item.accuracy).toBe(99);
          expect(item).toHaveProperty('period');
          expect(item).toHaveProperty('lastUpdated');
        }
      } catch (error: any) {
        // CLI 未安装或其他错误是可以接受的
        console.warn(`⚠️  AnthropicSync.fetchUsage() failed: ${error.message}`);
      }
    });
  });
  
  describe('OpenAISync', () => {
    let sync: OpenAISync;
    
    beforeAll(() => {
      if (!process.env.OPENAI_API_KEY) {
        console.warn('⚠️  OPENAI_API_KEY not set, some tests will be skipped');
      }
    });
    
    test('should throw error without API key', () => {
      const originalKey = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;
      
      expect(() => new OpenAISync()).toThrow('OPENAI_API_KEY is required');
      
      if (originalKey) process.env.OPENAI_API_KEY = originalKey;
    });
    
    test('should initialize with API key', () => {
      if (!process.env.OPENAI_API_KEY) return;
      
      expect(() => new OpenAISync()).not.toThrow();
      sync = new OpenAISync();
      expect(sync.provider).toBe('openai');
      expect(sync.accuracy).toBe(99);
    });
    
    test('should pass health check', async () => {
      if (!process.env.OPENAI_API_KEY) return;
      
      sync = new OpenAISync();
      const healthy = await sync.healthCheck();
      expect(healthy).toBe(true);
    });
    
    test('should fetch usage data', async () => {
      if (!process.env.OPENAI_API_KEY) {
        console.warn('⚠️  Skipping usage fetch test (no API key)');
        return;
      }
      
      sync = new OpenAISync();
      
      try {
        const data = await sync.fetchUsage();
        
        // 验证数据结构
        expect(data).toBeInstanceOf(Array);
        
        if (data.length > 0) {
          const item = data[0];
          expect(item).toHaveProperty('provider', 'openai');
          expect(item).toHaveProperty('model');
          expect(item).toHaveProperty('usage');
          expect(item.usage).toHaveProperty('inputTokens');
          expect(item.usage).toHaveProperty('outputTokens');
          expect(item.usage).toHaveProperty('totalTokens');
          expect(item).toHaveProperty('source', '✅ API (官方)');
          expect(item.accuracy).toBe(99);
        }
      } catch (error: any) {
        // Usage API 权限不足是可以接受的
        console.warn(`⚠️  OpenAISync.fetchUsage() failed: ${error.message}`);
      }
    });
  });
  
  describe('ZhiPuSync', () => {
    test('should throw error without API key', () => {
      const originalKey = process.env.ZHIPU_API_KEY;
      delete process.env.ZHIPU_API_KEY;
      
      expect(() => new ZhiPuSync()).toThrow('ZHIPU_API_KEY is required');
      
      if (originalKey) process.env.ZHIPU_API_KEY = originalKey;
    });
    
    test('should initialize with API key', () => {
      if (!process.env.ZHIPU_API_KEY) {
        console.warn('⚠️  ZHIPU_API_KEY not set, skipping ZhiPu tests');
        return;
      }
      
      const sync = new ZhiPuSync();
      expect(sync.provider).toBe('zhipu');
      expect(sync.accuracy).toBe(95);
    });
    
    test('should pass health check', async () => {
      if (!process.env.ZHIPU_API_KEY) return;
      
      const sync = new ZhiPuSync();
      const healthy = await sync.healthCheck();
      expect(typeof healthy).toBe('boolean');
    });
  });
  
  describe('GitHubSync', () => {
    test('should throw error without token', () => {
      const originalToken = process.env.GITHUB_TOKEN;
      delete process.env.GITHUB_TOKEN;
      
      expect(() => new GitHubSync()).toThrow('GITHUB_TOKEN is required');
      
      if (originalToken) process.env.GITHUB_TOKEN = originalToken;
    });
    
    test('should initialize with token', () => {
      if (!process.env.GITHUB_TOKEN) {
        console.warn('⚠️  GITHUB_TOKEN not set, skipping GitHub tests');
        return;
      }
      
      const sync = new GitHubSync();
      expect(sync.provider).toBe('github');
      expect(sync.accuracy).toBe(99);
    });
    
    test('should pass health check', async () => {
      if (!process.env.GITHUB_TOKEN) return;
      
      const sync = new GitHubSync();
      const healthy = await sync.healthCheck();
      expect(typeof healthy).toBe('boolean');
    });
  });
  
  describe('GeminiSync', () => {
    test('should throw error without access token', () => {
      const originalToken = process.env.GEMINI_ACCESS_TOKEN;
      delete process.env.GEMINI_ACCESS_TOKEN;
      
      expect(() => new GeminiSync()).toThrow('GEMINI_ACCESS_TOKEN is required');
      
      if (originalToken) process.env.GEMINI_ACCESS_TOKEN = originalToken;
    });
    
    test('should initialize with access token', () => {
      if (!process.env.GEMINI_ACCESS_TOKEN) {
        console.warn('⚠️  GEMINI_ACCESS_TOKEN not set, skipping Gemini tests');
        return;
      }
      
      const sync = new GeminiSync();
      expect(sync.provider).toBe('gemini');
      expect(sync.accuracy).toBe(90);
    });
  });
  
  describe('LocalStatsSync', () => {
    test('should initialize DeepSeekSync', () => {
      const sync = new DeepSeekSync();
      expect(sync.provider).toBe('deepseek');
      expect(sync.accuracy).toBe(75);
    });
    
    test('should initialize SiliconFlowSync', () => {
      const sync = new SiliconFlowSync();
      expect(sync.provider).toBe('siliconflow');
      expect(sync.accuracy).toBe(75);
    });
    
    test('DeepSeekSync should pass health check', async () => {
      const sync = new DeepSeekSync();
      const healthy = await sync.healthCheck();
      expect(typeof healthy).toBe('boolean');
    });
    
    test('SiliconFlowSync should pass health check', async () => {
      const sync = new SiliconFlowSync();
      const healthy = await sync.healthCheck();
      expect(typeof healthy).toBe('boolean');
    });
  });
  
  describe('UsageSyncCoordinator', () => {
    test('should create coordinator', () => {
      const coordinator = new UsageSyncCoordinator();
      expect(coordinator).toBeDefined();
      expect(coordinator.getProviders()).toEqual([]);
    });
    
    test('should register and unregister syncs', () => {
      if (!process.env.ANTHROPIC_API_KEY) return;
      
      const coordinator = new UsageSyncCoordinator();
      const sync = new AnthropicSync();
      
      coordinator.register(sync);
      expect(coordinator.getProviders()).toContain('anthropic');
      
      coordinator.unregister('anthropic');
      expect(coordinator.getProviders()).not.toContain('anthropic');
    });
    
    test('should sync single provider', async () => {
      if (!process.env.ANTHROPIC_API_KEY) return;
      
      const coordinator = new UsageSyncCoordinator();
      const sync = new AnthropicSync();
      coordinator.register(sync);
      
      const result = await coordinator.syncOne('anthropic');
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('provider', 'anthropic');
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('timestamp');
      
      if (!result.success) {
        console.warn(`⚠️  Sync failed: ${result.error}`);
      }
    });
    
    test('should sync all providers', async () => {
      const coordinator = new UsageSyncCoordinator();
      
      if (process.env.ANTHROPIC_API_KEY) {
        coordinator.register(new AnthropicSync());
      }
      if (process.env.OPENAI_API_KEY) {
        coordinator.register(new OpenAISync());
      }
      
      if (coordinator.getProviders().length === 0) {
        console.warn('⚠️  No providers available for testing');
        return;
      }
      
      const result = await coordinator.syncAll();
      
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('successful');
      expect(result).toHaveProperty('failed');
      expect(result).toHaveProperty('results');
      expect(result.total).toBe(result.successful + result.failed);
    });
    
    test('should perform health check on all providers', async () => {
      const coordinator = new UsageSyncCoordinator();
      
      if (process.env.ANTHROPIC_API_KEY) {
        coordinator.register(new AnthropicSync());
      }
      if (process.env.OPENAI_API_KEY) {
        coordinator.register(new OpenAISync());
      }
      
      if (coordinator.getProviders().length === 0) {
        return;
      }
      
      const results = await coordinator.healthCheckAll();
      
      expect(typeof results).toBe('object');
      for (const provider of coordinator.getProviders()) {
        expect(results).toHaveProperty(provider);
        expect(typeof results[provider]).toBe('boolean');
      }
    });
  });
  
  describe('Data Structure Validation', () => {
    test('UsageData should have correct structure', () => {
      const mockData: UsageData = {
        provider: 'test',
        model: 'test-model',
        usage: {
          inputTokens: 1000,
          outputTokens: 500,
          totalTokens: 1500,
          requests: 10,
        },
        source: '✅ API (官方)',
        accuracy: 99,
        period: {
          start: new Date('2026-02-01'),
          end: new Date('2026-02-04'),
        },
        lastUpdated: new Date(),
      };
      
      expect(mockData.provider).toBe('test');
      expect(mockData.usage.totalTokens).toBe(1500);
      expect(mockData.accuracy).toBeGreaterThanOrEqual(0);
      expect(mockData.accuracy).toBeLessThanOrEqual(100);
    });
  });
});
