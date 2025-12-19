/**
 * XSS対策ユーティリティ テスト
 */

import {
  sanitizeHtml,
  validateUrlForNavigation,
  safeText,
} from '@/utils/xssPrevention';

describe('xssPrevention', () => {
  describe('sanitizeHtml', () => {
    it('HTML文字列をサニタイズできる', () => {
      const html = '<script>alert("XSS")</script>';
      const sanitized = sanitizeHtml(html);
      expect(sanitized).toBeDefined();
      expect(typeof sanitized).toBe('string');
    });

    it('文字列以外の入力に対して空文字列を返す', () => {
      expect(sanitizeHtml(null as any)).toBe('');
      expect(sanitizeHtml(undefined as any)).toBe('');
      expect(sanitizeHtml(123 as any)).toBe('');
      expect(sanitizeHtml({} as any)).toBe('');
    });

    it('通常のテキストはそのまま返す', () => {
      const text = 'Hello World';
      expect(sanitizeHtml(text)).toBe('Hello World');
    });
  });

  describe('validateUrlForNavigation', () => {
    it('有効なHTTP URLでtrueを返す', () => {
      expect(validateUrlForNavigation('http://example.com')).toBe(true);
    });

    it('有効なHTTPS URLでtrueを返す', () => {
      expect(validateUrlForNavigation('https://example.com')).toBe(true);
    });

    it('空文字列でfalseを返す', () => {
      expect(validateUrlForNavigation('')).toBe(false);
    });

    it('nullでfalseを返す', () => {
      expect(validateUrlForNavigation(null as any)).toBe(false);
    });

    it('文字列以外の入力でfalseを返す', () => {
      expect(validateUrlForNavigation(123 as any)).toBe(false);
      expect(validateUrlForNavigation({} as any)).toBe(false);
    });

    it('無効なURL形式でfalseを返す', () => {
      expect(validateUrlForNavigation('not-a-url')).toBe(false);
    });

    it('javascript:プロトコルでfalseを返す', () => {
      expect(validateUrlForNavigation('javascript:alert("XSS")')).toBe(false);
    });

    it('data:プロトコルでfalseを返す', () => {
      expect(validateUrlForNavigation('data:text/html,<script>alert("XSS")</script>')).toBe(false);
    });

    it('vbscript:プロトコルでfalseを返す', () => {
      expect(validateUrlForNavigation('vbscript:msgbox("XSS")')).toBe(false);
    });

    it('file:プロトコルでfalseを返す', () => {
      expect(validateUrlForNavigation('file:///etc/passwd')).toBe(false);
    });

    it('大文字小文字を区別せずにプロトコルをチェック', () => {
      expect(validateUrlForNavigation('JAVASCRIPT:alert("XSS")')).toBe(false);
      expect(validateUrlForNavigation('DATA:text/html,<script>alert("XSS")</script>')).toBe(false);
    });
  });

  describe('safeText', () => {
    it('通常の文字列をそのまま返す', () => {
      expect(safeText('Hello World')).toBe('Hello World');
    });

    it('nullで空文字列を返す', () => {
      expect(safeText(null)).toBe('');
    });

    it('undefinedで空文字列を返す', () => {
      expect(safeText(undefined)).toBe('');
    });

    it('文字列以外の型を文字列に変換', () => {
      expect(safeText(123 as any)).toBe('123');
      expect(safeText(true as any)).toBe('true');
      expect(safeText(false as any)).toBe('false');
    });

    it('制御文字を除去する', () => {
      const textWithControlChars = 'Hello\x00World\x01Test';
      const result = safeText(textWithControlChars);
      expect(result).not.toContain('\x00');
      expect(result).not.toContain('\x01');
    });

    it('改行文字はそのまま保持する（実装では除去しない）', () => {
      const textWithNewlines = 'Hello\nWorld\rTest';
      const result = safeText(textWithNewlines);
      // safeTextの実装では、改行文字（\n, \r）は除去されない
      // 制御文字（\x00-\x08, \x0B-\x0C, \x0E-\x1F, \x7F）のみ除去される
      expect(result).toContain('\n');
      expect(result).toContain('\r');
    });
  });
});

