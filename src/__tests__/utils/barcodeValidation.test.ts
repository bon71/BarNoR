/**
 * barcodeValidation テスト
 */

import {
  isISBN13,
  isISBN10,
  isISBN,
  selectBestBarcode,
} from '@/utils/barcodeValidation';

describe('barcodeValidation', () => {
  describe('isISBN13', () => {
    it('978で始まる13桁の数字をISBN-13として認識する', () => {
      expect(isISBN13('9784873117324')).toBe(true);
      expect(isISBN13('978-4-87311-732-4')).toBe(true);
    });

    it('979で始まる13桁の数字をISBN-13として認識する', () => {
      expect(isISBN13('9791234567890')).toBe(true);
      expect(isISBN13('979-1-23456-789-0')).toBe(true);
    });

    it('13桁未満の数字をISBN-13として認識しない', () => {
      expect(isISBN13('978487311732')).toBe(false);
      expect(isISBN13('123456789012')).toBe(false);
    });

    it('13桁を超える数字をISBN-13として認識しない', () => {
      expect(isISBN13('97848731173245')).toBe(false);
    });

    it('978/979以外で始まる13桁の数字をISBN-13として認識しない', () => {
      expect(isISBN13('1234567890123')).toBe(false);
    });

    it('数字以外の文字を含む場合はISBN-13として認識しない', () => {
      expect(isISBN13('978487311732a')).toBe(false);
      expect(isISBN13('abc')).toBe(false);
    });
  });

  describe('isISBN10', () => {
    it('10桁の数字をISBN-10として認識する', () => {
      expect(isISBN10('4873117324')).toBe(true);
      expect(isISBN10('4-87311-732-4')).toBe(true);
    });

    it('最後の桁がXの10桁をISBN-10として認識する', () => {
      expect(isISBN10('012345678X')).toBe(true);
      expect(isISBN10('0-123-45678-X')).toBe(true);
    });

    it('10桁未満の数字をISBN-10として認識しない', () => {
      expect(isISBN10('487311732')).toBe(false);
      expect(isISBN10('123456789')).toBe(false);
    });

    it('10桁を超える数字をISBN-10として認識しない', () => {
      expect(isISBN10('48731173245')).toBe(false);
    });

    it('最後の桁以外にXを含む場合はISBN-10として認識しない', () => {
      expect(isISBN10('X873117324')).toBe(false);
      expect(isISBN10('487311732X')).toBe(true); // 最後の桁がXの場合は有効なISBN-10
    });

    it('数字以外の文字を含む場合はISBN-10として認識しない', () => {
      expect(isISBN10('487311732a')).toBe(false);
      expect(isISBN10('abc')).toBe(false);
    });
  });

  describe('isISBN', () => {
    it('ISBN-13をISBNとして認識する', () => {
      expect(isISBN('9784873117324')).toBe(true);
      expect(isISBN('9791234567890')).toBe(true);
    });

    it('ISBN-10をISBNとして認識する', () => {
      expect(isISBN('4873117324')).toBe(true);
      expect(isISBN('012345678X')).toBe(true);
    });

    it('ISBNでないバーコードをISBNとして認識しない', () => {
      expect(isISBN('1234567890123')).toBe(false);
      expect(isISBN('123456789')).toBe(false);
      expect(isISBN('abc')).toBe(false);
    });
  });

  describe('selectBestBarcode', () => {
    it('空の配列の場合はnullを返す', () => {
      expect(selectBestBarcode([])).toBe(null);
    });

    it('ISBN-13を含む場合はISBN-13を優先して返す', () => {
      const barcodes = ['1234567890123', '9784873117324', '4873117324'];
      expect(selectBestBarcode(barcodes)).toBe('9784873117324');
    });

    it('ISBN-13がなくISBN-10を含む場合はISBN-10を返す', () => {
      const barcodes = ['1234567890123', '4873117324', '9999999999'];
      expect(selectBestBarcode(barcodes)).toBe('4873117324');
    });

    it('ISBNが含まれない場合は最初のバーコードを返す', () => {
      // 9999999999はISBN-10として認識されるため、ISBNでないバーコードを使用
      const barcodes = ['1234567890123', '123456789', 'abc123'];
      expect(selectBestBarcode(barcodes)).toBe('1234567890123');
    });

    it('単一のISBN-13を返す', () => {
      expect(selectBestBarcode(['9784873117324'])).toBe('9784873117324');
    });

    it('単一のISBN-10を返す', () => {
      expect(selectBestBarcode(['4873117324'])).toBe('4873117324');
    });

    it('単一の非ISBNバーコードを返す', () => {
      expect(selectBestBarcode(['1234567890123'])).toBe('1234567890123');
    });

    it('複数のISBN-13がある場合は最初のISBN-13を返す', () => {
      const barcodes = ['9784873117324', '9791234567890'];
      expect(selectBestBarcode(barcodes)).toBe('9784873117324');
    });

    it('複数のISBN-10がある場合は最初のISBN-10を返す', () => {
      const barcodes = ['4873117324', '012345678X'];
      expect(selectBestBarcode(barcodes)).toBe('4873117324');
    });
  });
});

