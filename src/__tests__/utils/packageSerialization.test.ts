/**
 * packageSerialization テスト
 */

import {
  serializePackage,
  deserializePackage,
  SerializablePackage,
} from '@/utils/packageSerialization';
import {Package, PackageType, LibraryType} from '@/domain/entities/Package';

describe('packageSerialization', () => {
  const createTestPackage = (): Package => {
    return new Package({
      id: 'test-package-id',
      name: 'テストパッケージ',
      description: 'テスト用のパッケージ',
      type: PackageType.BOOK_INFO,
      libraryType: LibraryType.OPENBD,
      databaseId: 'test-database-id',
      propertyMapping: {
        title: 'タイトル',
        author: '著者名',
      },
      isActive: true,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-02T00:00:00Z'),
    });
  };

  describe('serializePackage', () => {
    it('Packageエンティティをシリアライズ可能な形式に変換する', () => {
      const pkg = createTestPackage();
      const serialized = serializePackage(pkg);

      expect(serialized).toEqual({
        id: 'test-package-id',
        name: 'テストパッケージ',
        description: 'テスト用のパッケージ',
        type: PackageType.BOOK_INFO,
        libraryType: LibraryType.OPENBD,
        databaseId: 'test-database-id',
        propertyMapping: {
          title: 'タイトル',
          author: '著者名',
        },
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      });
    });

    it('DateオブジェクトをISO文字列に変換する', () => {
      const pkg = createTestPackage();
      const serialized = serializePackage(pkg);

      expect(typeof serialized.createdAt).toBe('string');
      expect(typeof serialized.updatedAt).toBe('string');
      expect(serialized.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(serialized.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('descriptionがundefinedの場合もシリアライズできる', () => {
      const pkg = new Package({
        id: 'test-id',
        name: 'テスト',
        type: PackageType.BOOK_INFO,
        libraryType: LibraryType.OPENBD,
        databaseId: 'db-id',
        propertyMapping: {
          title: 'タイトル',
        },
        isActive: true,
      });

      const serialized = serializePackage(pkg);

      expect(serialized.description).toBeUndefined();
    });
  });

  describe('deserializePackage', () => {
    it('シリアライズされたPackageからPackageエンティティを再構築する', () => {
      const serialized: SerializablePackage = {
        id: 'test-package-id',
        name: 'テストパッケージ',
        description: 'テスト用のパッケージ',
        type: PackageType.BOOK_INFO,
        libraryType: LibraryType.OPENBD,
        databaseId: 'test-database-id',
        propertyMapping: {
          title: 'タイトル',
          author: '著者名',
        },
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      };

      const pkg = deserializePackage(serialized);

      expect(pkg).toBeInstanceOf(Package);
      expect(pkg.id).toBe('test-package-id');
      expect(pkg.name).toBe('テストパッケージ');
      expect(pkg.description).toBe('テスト用のパッケージ');
      expect(pkg.type).toBe(PackageType.BOOK_INFO);
      expect(pkg.libraryType).toBe(LibraryType.OPENBD);
      expect(pkg.databaseId).toBe('test-database-id');
      expect(pkg.propertyMapping).toEqual({
        title: 'タイトル',
        author: '著者名',
      });
      expect(pkg.isActive).toBe(true);
      expect(pkg.createdAt).toBeInstanceOf(Date);
      expect(pkg.updatedAt).toBeInstanceOf(Date);
    });

    it('ISO文字列をDateオブジェクトに変換する', () => {
      const serialized: SerializablePackage = {
        id: 'test-id',
        name: 'テスト',
        type: PackageType.BOOK_INFO,
        libraryType: LibraryType.OPENBD,
        databaseId: 'db-id',
        propertyMapping: {
          title: 'タイトル',
        },
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      };

      const pkg = deserializePackage(serialized);

      expect(pkg.createdAt).toEqual(new Date('2024-01-01T00:00:00.000Z'));
      expect(pkg.updatedAt).toEqual(new Date('2024-01-02T00:00:00.000Z'));
    });

    it('descriptionがundefinedの場合もデシリアライズできる', () => {
      const serialized: SerializablePackage = {
        id: 'test-id',
        name: 'テスト',
        type: PackageType.BOOK_INFO,
        libraryType: LibraryType.OPENBD,
        databaseId: 'db-id',
        propertyMapping: {
          title: 'タイトル',
        },
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      };

      const pkg = deserializePackage(serialized);

      expect(pkg.description).toBeUndefined();
    });

    it('シリアライズ→デシリアライズで元のPackageと同等になる', () => {
      const original = createTestPackage();
      const serialized = serializePackage(original);
      const deserialized = deserializePackage(serialized);

      expect(deserialized.id).toBe(original.id);
      expect(deserialized.name).toBe(original.name);
      expect(deserialized.description).toBe(original.description);
      expect(deserialized.type).toBe(original.type);
      expect(deserialized.libraryType).toBe(original.libraryType);
      expect(deserialized.databaseId).toBe(original.databaseId);
      expect(deserialized.propertyMapping).toEqual(original.propertyMapping);
      expect(deserialized.isActive).toBe(original.isActive);
      expect(deserialized.createdAt.getTime()).toBe(original.createdAt.getTime());
      expect(deserialized.updatedAt.getTime()).toBe(original.updatedAt.getTime());
    });
  });
});

