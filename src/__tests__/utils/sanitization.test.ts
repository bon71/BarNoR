/**
 * サニタイゼーションユーティリティのテスト
 */

import {
  escapeHtml,
  encodeUrl,
  decodeUrl,
  sanitizeString,
  limitStringLength,
  matchesPattern,
  sanitizeNumberString,
  sanitizeUuid,
  sanitizePropertyName,
} from '@/utils/sanitization';

describe('sanitization', () => {
  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHtml('<script>alert("XSS")</script>')).toBe(
        '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;',
      );
      expect(escapeHtml("It's a test")).toBe('It&#39;s a test');
    });

    it('should handle non-string input', () => {
      expect(escapeHtml(null as any)).toBe('null');
      expect(escapeHtml(123 as any)).toBe('123');
    });
  });

  describe('encodeUrl', () => {
    it('should encode URL special characters', () => {
      expect(encodeUrl('hello world')).toBe('hello%20world');
      expect(encodeUrl('test&value=123')).toBe('test%26value%3D123');
    });
  });

  describe('decodeUrl', () => {
    it('should decode URL encoded strings', () => {
      expect(decodeUrl('hello%20world')).toBe('hello world');
      expect(decodeUrl('test%26value%3D123')).toBe('test&value=123');
    });

    it('should handle invalid encoding gracefully', () => {
      expect(decodeUrl('%invalid')).toBe('%invalid');
    });
  });

  describe('sanitizeString', () => {
    it('should remove control characters', () => {
      expect(sanitizeString('hello\x00world')).toBe('helloworld');
      expect(sanitizeString('test\x1Fstring')).toBe('teststring');
    });

    it('should remove newlines by default', () => {
      expect(sanitizeString('hello\nworld')).toBe('helloworld');
      expect(sanitizeString('hello\r\nworld')).toBe('helloworld');
    });

    it('should allow newlines when specified', () => {
      expect(sanitizeString('hello\nworld', true)).toBe('hello\nworld');
    });

    it('should trim whitespace', () => {
      expect(sanitizeString('  hello world  ')).toBe('hello world');
    });
  });

  describe('limitStringLength', () => {
    it('should truncate long strings', () => {
      expect(limitStringLength('hello world', 5)).toBe('he...');
      expect(limitStringLength('test', 10)).toBe('test');
    });

    it('should use custom ellipsis', () => {
      expect(limitStringLength('hello world', 5, '..')).toBe('hel..');
    });
  });

  describe('matchesPattern', () => {
    it('should match regex patterns', () => {
      expect(matchesPattern('hello123', /^[a-z]+\d+$/)).toBe(true);
      expect(matchesPattern('hello123', /^\d+$/)).toBe(false);
    });

    it('should match string patterns', () => {
      expect(matchesPattern('hello', '^[a-z]+$')).toBe(true);
    });
  });

  describe('sanitizeNumberString', () => {
    it('should extract numeric characters', () => {
      expect(sanitizeNumberString('123abc456')).toBe('123456');
      expect(sanitizeNumberString('12.34')).toBe('12.34');
    });

    it('should handle negative numbers', () => {
      expect(sanitizeNumberString('-123', true, true)).toBe('-123');
      expect(sanitizeNumberString('-123', true, false)).toBe('123');
    });

    it('should remove multiple decimal points', () => {
      expect(sanitizeNumberString('12.34.56')).toBe('12.3456');
    });

    it('should remove decimal points when not allowed', () => {
      expect(sanitizeNumberString('12.34', false)).toBe('1234');
    });
  });

  describe('sanitizeUuid', () => {
    it('should normalize UUID without hyphens', () => {
      expect(sanitizeUuid('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6')).toBe('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6');
    });

    it('should normalize UUID with hyphens', () => {
      // sanitizeUuidはハイフンを除去して32文字の小文字に変換する
      expect(sanitizeUuid('A1B2C3D4-E5F6-A7B8-C9D0-E1F2A3B4C5D6')).toBe(
        'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6',
      );
    });

    it('should return empty string for invalid UUID', () => {
      expect(sanitizeUuid('invalid')).toBe('');
      expect(sanitizeUuid('123')).toBe('');
    });
  });

  describe('sanitizePropertyName', () => {
    it('should sanitize property names', () => {
      expect(sanitizePropertyName('  Hello World  ')).toBe('Hello World');
      expect(sanitizePropertyName('test\x00name')).toBe('testname');
    });

    it('should limit length', () => {
      const longString = 'a'.repeat(150);
      expect(sanitizePropertyName(longString).length).toBe(100);
    });
  });
});

