/**
 * ログマスキングユーティリティのテスト
 */

import {maskSensitiveValue, maskSensitiveData, safeStringify} from '@/utils/logMasking';

describe('logMasking', () => {
  describe('maskSensitiveValue', () => {
    it('should mask a long value', () => {
      const value = 'secret_api_key_1234567890';
      const masked = maskSensitiveValue(value);
      expect(masked).toBe('secret_***');
    });

    it('should mask a short value', () => {
      const value = 'short';
      const masked = maskSensitiveValue(value, 7);
      expect(masked).toBe('***');
    });

    it('should handle null/undefined', () => {
      expect(maskSensitiveValue(null)).toBe('***');
      expect(maskSensitiveValue(undefined)).toBe('***');
    });

    it('should use custom visible length', () => {
      const value = 'secret_api_key_1234567890';
      const masked = maskSensitiveValue(value, 10);
      expect(masked).toBe('secret_api***');
    });
  });

  describe('maskSensitiveData', () => {
    it('should mask sensitive keys', () => {
      const obj = {
        notionToken: 'secret_token_1234567890',
        databaseId: 'abc123',
        propertyMapping: {
          title: 'Title',
        },
      };

      const masked = maskSensitiveData(obj);
      expect(masked.notionToken).toBe('secret_***');
      expect(masked.databaseId).toBe('abc123');
      expect(masked.propertyMapping).toEqual({title: 'Title'});
    });

    it('should mask multiple sensitive keys', () => {
      const obj = {
        apiKey: 'secret_key',
        password: 'secret_password',
        normalField: 'normal_value',
      };

      const masked = maskSensitiveData(obj);
      expect(masked.apiKey).toBe('secret_***');
      expect(masked.password).toBe('secret_***');
      expect(masked.normalField).toBe('normal_value');
    });

    it('should handle nested objects', () => {
      const obj = {
        config: {
          notionToken: 'secret_token',
          databaseId: 'abc123',
        },
      };

      const masked = maskSensitiveData(obj);
      expect((masked.config as any).notionToken).toBe('secret_***');
      expect((masked.config as any).databaseId).toBe('abc123');
    });

    it('should use custom sensitive keys', () => {
      const obj = {
        customSecret: 'secret_value',
        normalField: 'normal_value',
      };

      const masked = maskSensitiveData(obj, ['customSecret']);
      expect(masked.customSecret).toBe('secret_***');
      expect(masked.normalField).toBe('normal_value');
    });
  });

  describe('safeStringify', () => {
    it('should stringify and mask sensitive data', () => {
      const obj = {
        notionToken: 'secret_token',
        databaseId: 'abc123',
      };

      const result = safeStringify(obj);
      expect(result).toContain('secret_***');
      expect(result).toContain('abc123');
      expect(result).not.toContain('secret_token');
    });

    it('should handle non-object values', () => {
      expect(safeStringify('string')).toBe('"string"');
      expect(safeStringify(123)).toBe('123');
      expect(safeStringify(null)).toBe('null');
    });

    it('should handle stringify errors gracefully', () => {
      const circular: any = {};
      circular.self = circular;

      const result = safeStringify(circular);
      expect(result).toBe('[Unable to stringify object]');
    });
  });
});

