/**
 * defaultPackages テスト
 */

import {
  DEFAULT_BOOK_PACKAGE,
  DEFAULT_PACKAGES,
  isDefaultPackage,
  getDefaultPackageByDatabaseId,
} from '@/config/defaultPackages';
import {PackageType, LibraryType} from '@/domain/entities/Package';

describe('defaultPackages', () => {
  describe('DEFAULT_BOOK_PACKAGE', () => {
    it('正しい構造を持つ', () => {
      expect(DEFAULT_BOOK_PACKAGE).toHaveProperty('name');
      expect(DEFAULT_BOOK_PACKAGE).toHaveProperty('description');
      expect(DEFAULT_BOOK_PACKAGE).toHaveProperty('type');
      expect(DEFAULT_BOOK_PACKAGE).toHaveProperty('libraryType');
      expect(DEFAULT_BOOK_PACKAGE).toHaveProperty('databaseId');
      expect(DEFAULT_BOOK_PACKAGE).toHaveProperty('propertyMapping');
    });

    it('正しい値を持つ', () => {
      expect(DEFAULT_BOOK_PACKAGE.name).toBe('書籍登録（デフォルト）');
      expect(DEFAULT_BOOK_PACKAGE.type).toBe(PackageType.BOOK_INFO);
      expect(DEFAULT_BOOK_PACKAGE.libraryType).toBe(LibraryType.OPENBD);
      expect(DEFAULT_BOOK_PACKAGE.databaseId).toBe('51725b0ba8ca4c9db8d05228d1d8bf69');
    });

    it('プロパティマッピングが正しく設定されている', () => {
      expect(DEFAULT_BOOK_PACKAGE.propertyMapping).toEqual({
        title: 'タイトル',
        author: '著者名',
        isbn: 'ISBN',
        barcode: 'ISBN',
        imageUrl: '書影',
      });
    });
  });

  describe('DEFAULT_PACKAGES', () => {
    it('DEFAULT_BOOK_PACKAGEを含む', () => {
      expect(DEFAULT_PACKAGES).toContainEqual(DEFAULT_BOOK_PACKAGE);
    });

    it('配列である', () => {
      expect(Array.isArray(DEFAULT_PACKAGES)).toBe(true);
    });
  });

  describe('isDefaultPackage', () => {
    it('デフォルトパッケージのdatabaseIdを認識する', () => {
      expect(isDefaultPackage('51725b0ba8ca4c9db8d05228d1d8bf69')).toBe(true);
    });

    it('デフォルトパッケージでないdatabaseIdを認識しない', () => {
      expect(isDefaultPackage('non-default-database-id')).toBe(false);
      expect(isDefaultPackage('')).toBe(false);
    });
  });

  describe('getDefaultPackageByDatabaseId', () => {
    it('デフォルトパッケージのdatabaseIdでパッケージを取得できる', () => {
      const pkg = getDefaultPackageByDatabaseId('51725b0ba8ca4c9db8d05228d1d8bf69');
      expect(pkg).toEqual(DEFAULT_BOOK_PACKAGE);
    });

    it('デフォルトパッケージでないdatabaseIdでundefinedを返す', () => {
      const pkg = getDefaultPackageByDatabaseId('non-default-database-id');
      expect(pkg).toBeUndefined();
    });

    it('空文字列でundefinedを返す', () => {
      const pkg = getDefaultPackageByDatabaseId('');
      expect(pkg).toBeUndefined();
    });
  });
});

