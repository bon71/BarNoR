/**
 * 入力値検証ユーティリティのテスト
 */

import {
  isValidIsbn,
  normalizeIsbn,
  isValidDatabaseId,
  normalizeDatabaseId,
  isValidPropertyName,
  normalizePropertyName,
  validateNumber,
  isValidNotionToken,
  isValidUrl,
} from '@/utils/validation';

describe('validation', () => {
  describe('isValidIsbn', () => {
    it('should validate ISBN-10', () => {
      expect(isValidIsbn('0123456789')).toBe(true);
      expect(isValidIsbn('012345678X')).toBe(true);
      expect(isValidIsbn('0-123-45678-9')).toBe(true);
    });

    it('should validate ISBN-13', () => {
      expect(isValidIsbn('9780123456789')).toBe(true);
      expect(isValidIsbn('9790123456789')).toBe(true);
      expect(isValidIsbn('978-0-12-345678-9')).toBe(true);
    });

    it('should reject invalid ISBNs', () => {
      expect(isValidIsbn('123')).toBe(false);
      expect(isValidIsbn('invalid')).toBe(false);
      expect(isValidIsbn('')).toBe(false);
    });
  });

  describe('normalizeIsbn', () => {
    it('should normalize ISBN', () => {
      expect(normalizeIsbn('978-0-12-345678-9')).toBe('9780123456789');
      expect(normalizeIsbn('0-123-45678-X')).toBe('012345678X');
    });
  });

  describe('isValidDatabaseId', () => {
    it('should validate UUID without hyphens', () => {
      expect(isValidDatabaseId('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6')).toBe(true);
    });

    it('should validate UUID with hyphens', () => {
      expect(isValidDatabaseId('a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6')).toBe(true);
    });

    it('should reject invalid database IDs', () => {
      expect(isValidDatabaseId('invalid')).toBe(false);
      expect(isValidDatabaseId('123')).toBe(false);
      expect(isValidDatabaseId('')).toBe(false);
    });
  });

  describe('normalizeDatabaseId', () => {
    it('should normalize database ID', () => {
      expect(normalizeDatabaseId('A1B2C3D4-E5F6-A7B8-C9D0-E1F2A3B4C5D6')).toBe(
        'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6',
      );
    });
  });

  describe('isValidPropertyName', () => {
    it('should validate property names', () => {
      expect(isValidPropertyName('Title')).toBe(true);
      expect(isValidPropertyName('Author Name')).toBe(true);
    });

    it('should reject invalid property names', () => {
      expect(isValidPropertyName('')).toBe(false);
      expect(isValidPropertyName('a'.repeat(101))).toBe(false);
      expect(isValidPropertyName('test\x00name')).toBe(false);
    });
  });

  describe('normalizePropertyName', () => {
    it('should normalize property names', () => {
      expect(normalizePropertyName('  Title  ')).toBe('Title');
      expect(normalizePropertyName('test\x00name')).toBe('testname');
    });
  });

  describe('validateNumber', () => {
    it('should validate valid numbers', () => {
      expect(validateNumber('123')).toEqual({isValid: true, normalized: 123});
      expect(validateNumber('12.34')).toEqual({isValid: true, normalized: 12.34});
    });

    it('should validate with min/max', () => {
      expect(validateNumber('50', {min: 0, max: 100})).toEqual({isValid: true, normalized: 50});
      // 負の値はallowNegativeがfalse（デフォルト）の場合、負の値チェックで先に失敗する
      expect(validateNumber('-10', {min: 0})).toEqual({isValid: false, error: '負の値は許可されていません'});
      expect(validateNumber('150', {max: 100})).toEqual({isValid: false, error: '最大値は100です'});
    });

    it('should handle required option', () => {
      expect(validateNumber('', {required: true})).toEqual({isValid: false, error: '数値が入力されていません'});
      expect(validateNumber('', {required: false})).toEqual({isValid: true});
    });

    it('should handle negative numbers', () => {
      expect(validateNumber('-10', {allowNegative: true})).toEqual({isValid: true, normalized: -10});
      expect(validateNumber('-10', {allowNegative: false})).toEqual({isValid: false, error: '負の値は許可されていません'});
    });
  });

  describe('isValidNotionToken', () => {
    it('should validate Notion tokens', () => {
      expect(isValidNotionToken('secret_abc123def456')).toBe(true);
      expect(isValidNotionToken('ntn_abc123def456')).toBe(true);
    });

    it('should reject invalid tokens', () => {
      expect(isValidNotionToken('invalid')).toBe(false);
      expect(isValidNotionToken('secret_')).toBe(false);
      expect(isValidNotionToken('')).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    it('should validate URLs', () => {
      expect(isValidUrl('https://api.notion.com/v1')).toBe(true);
      expect(isValidUrl('http://example.com')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('ftp://example.com')).toBe(false);
      expect(isValidUrl('')).toBe(false);
    });
  });
});

