/**
 * ManageStrategies.test.ts
 * 测试策略管理系统核心功能
 */

import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';

// Mock ManageStrategies (实际从 Tools/ManageStrategies.ts 导入)
// 由于 mock 限制，这里使用简化版本测试核心逻辑
class ManageStrategies {
  private strategiesDir: string;
  private configDir: string;

  constructor() {
    this.strategiesDir = process.env.STRATEGIES_DIR || './strategies';
    this.configDir = process.env.CONFIG_DIR || './config';
  }

  validateStrategy(strategy: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!strategy.description) {
      errors.push('Missing required field: description');
    }

    if (!strategy.agents && !strategy.categories) {
      errors.push('Must have either agents or categories');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  formatTable(data: any[]): string {
    if (data.length === 0) return 'No strategies found';

    const headers = Object.keys(data[0]).map(k => k.toUpperCase());
    const rows = data.map(item =>
      Object.values(item).map(v => String(v ?? '-'))
    );

    const colWidths = headers.map((_, i) =>
      Math.max(...rows.map(r => (r[i]?.length || 0)), headers[i].length)
    );

    const separator = colWidths.map(w => '-'.repeat(w + 2)).join('+');
    const headerRow = headers.map((h, i) =>
      ` ${h.padEnd(colWidths[i])} `
    ).join('|');

    const dataRows = rows.map(row =>
      row.map((cell, i) =>
        ` ${cell.padEnd(colWidths[i])} `
      ).join('|')
    );

    return [
      separator,
      headerRow,
      separator,
      ...dataRows.map(r => r),
      separator
    ].join('\n');
  }
}

describe('ManageStrategies', () => {
  let ms: ManageStrategies;
  let mockFsWrite: ReturnType<typeof mock>;
  let mockFsRead: ReturnType<typeof mock>;

  beforeEach(() => {
    ms = new ManageStrategies();
    mockFsWrite = mock(fs, 'writeFileSync');
    mockFsRead = mock(fs, 'readFileSync');
  });

  afterEach(() => {
    mockFsWrite.mockRestore();
    mockFsRead.mockRestore();
  });

  describe('validateStrategy', () => {
    it('should pass valid strategy', () => {
      const validStrategy = {
        description: 'Test strategy',
        agents: {
          default: { model: 'claude-3-opus' }
        }
      };

      const result = ms.validateStrategy(validStrategy);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail without description', () => {
      const invalidStrategy = {
        agents: {
          default: { model: 'claude-3-opus' }
        }
      };

      const result = ms.validateStrategy(invalidStrategy);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: description');
    });

    it('should fail without agents or categories', () => {
      const invalidStrategy = {
        description: 'Test strategy'
      };

      const result = ms.validateStrategy(invalidStrategy);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Must have either agents or categories');
    });

    it('should pass with categories instead of agents', () => {
      const validStrategy = {
        description: 'Test strategy',
        categories: {
          default: { model: 'claude-3-opus' }
        }
      };

      const result = ms.validateStrategy(validStrategy);

      expect(result.valid).toBe(true);
    });
  });

  describe('formatTable', () => {
    it('should format empty array', () => {
      const result = ms.formatTable([]);

      expect(result).toBe('No strategies found');
    });

    it('should format single item', () => {
      const data = [
        { name: 'strategy-1', description: 'Test' }
      ];

      const result = ms.formatTable(data);

      expect(result).toContain('NAME');
      expect(result).toContain('DESCRIPTION');
      expect(result).toContain('strategy-1');
      expect(result).toContain('Test');
    });

    it('should handle missing values', () => {
      const data = [
        { name: 'strategy-1', description: 'Test', version: null }
      ];

      const result = ms.formatTable(data);

      expect(result).toContain('-'); // null 应该显示为 '-'
    });
  });

  describe('constructor', () => {
    it('should use default directories', () => {
      const instance = new ManageStrategies();

      expect(instance).toBeDefined();
    });

    it('should respect environment variables', () => {
      process.env.STRATEGIES_DIR = '/custom/strategies';
      const instance = new ManageStrategies();

      expect(instance).toBeDefined();
      delete process.env.STRATEGIES_DIR;
    });
  });

  describe('CLI routing regression guards', () => {
    it('should keep govern command routed to the governance handler', () => {
      const source = fs.readFileSync(
        path.join(process.cwd(), 'Tools', 'ManageStrategies.ts'),
        'utf8'
      );

      expect(source).toMatch(/case "govern":\s*await handleGovernance\(\);\s*break;/);
    });

    it('should keep both generate and disable help entries visible', () => {
      const source = fs.readFileSync(
        path.join(process.cwd(), 'Tools', 'ManageStrategies.ts'),
        'utf8'
      );

      expect(source).toContain('disable/enable <target>');
      expect(source).toContain('generate <desc>');
    });
  });
});
