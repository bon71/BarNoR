/**
 * Package エンティティのテスト
 * パッケージ = NotionデータベースとプロパティMappingの組み合わせ
 */

import { Package, PackageType } from '@/domain/entities/Package';

describe('Package Entity', () => {
  describe('BookInfo Package の作成', () => {
    test('有効なBookInfoパッケージを作成できる', () => {
      const pkg = new Package({
        id: 'pkg-001',
        name: '読書管理',
        type: PackageType.BOOK_INFO,
        databaseId: 'db-123',
        propertyMapping: {
          title: 'タイトル',
          author: '著者',
          publisher: '出版社',
          price: '価格',
          imageUrl: '画像URL',
        },
        isActive: true,
      });

      expect(pkg.id).toBe('pkg-001');
      expect(pkg.name).toBe('読書管理');
      expect(pkg.type).toBe(PackageType.BOOK_INFO);
      expect(pkg.databaseId).toBe('db-123');
      expect(pkg.isActive).toBe(true);
      expect(pkg.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('ProductInfo Package の作成', () => {
    test('有効なProductInfoパッケージを作成できる', () => {
      const pkg = new Package({
        id: 'pkg-002',
        name: '商品管理',
        type: PackageType.PRODUCT_INFO,
        databaseId: 'db-456',
        propertyMapping: {
          title: '商品名',
          maker: 'メーカー',
          price: '価格',
        },
        isActive: true,
      });

      expect(pkg.type).toBe(PackageType.PRODUCT_INFO);
      expect(pkg.propertyMapping.maker).toBe('メーカー');
    });
  });

  describe('バリデーション', () => {
    test('nameが空の場合はエラーをスローする', () => {
      expect(() => {
        new Package({
          id: 'pkg-001',
          name: '',
          type: PackageType.BOOK_INFO,
          databaseId: 'db-123',
          propertyMapping: {},
          isActive: true,
        });
      }).toThrow('Package name is required');
    });

    test('databaseIdが空の場合はエラーをスローする', () => {
      expect(() => {
        new Package({
          id: 'pkg-001',
          name: 'Test Package',
          type: PackageType.BOOK_INFO,
          databaseId: '',
          propertyMapping: {},
          isActive: true,
        });
      }).toThrow('Database ID is required');
    });

    test('propertyMappingが空の場合はエラーをスローする', () => {
      expect(() => {
        new Package({
          id: 'pkg-001',
          name: 'Test Package',
          type: PackageType.BOOK_INFO,
          databaseId: 'db-123',
          propertyMapping: {},
          isActive: true,
        });
      }).toThrow('At least one property mapping is required');
    });
  });

  describe('isBookInfoPackage()', () => {
    test('BookInfoパッケージの場合trueを返す', () => {
      const pkg = new Package({
        id: 'pkg-001',
        name: 'Test',
        type: PackageType.BOOK_INFO,
        databaseId: 'db-123',
        propertyMapping: {title: 'タイトル'},
        isActive: true,
      });

      expect(pkg.isBookInfoPackage()).toBe(true);
      expect(pkg.isProductInfoPackage()).toBe(false);
    });
  });

  describe('isProductInfoPackage()', () => {
    test('ProductInfoパッケージの場合trueを返す', () => {
      const pkg = new Package({
        id: 'pkg-002',
        name: 'Test',
        type: PackageType.PRODUCT_INFO,
        databaseId: 'db-456',
        propertyMapping: {title: '商品名'},
        isActive: true,
      });

      expect(pkg.isProductInfoPackage()).toBe(true);
      expect(pkg.isBookInfoPackage()).toBe(false);
    });
  });

  describe('activate() / deactivate()', () => {
    test('パッケージを有効化できる', () => {
      const pkg = new Package({
        id: 'pkg-001',
        name: 'Test',
        type: PackageType.BOOK_INFO,
        databaseId: 'db-123',
        propertyMapping: {title: 'タイトル'},
        isActive: false,
      });

      const activated = pkg.activate();

      expect(activated.isActive).toBe(true);
      expect(pkg.isActive).toBe(false); // 元のオブジェクトは変更されない（イミュータブル）
    });

    test('パッケージを無効化できる', () => {
      const pkg = new Package({
        id: 'pkg-001',
        name: 'Test',
        type: PackageType.BOOK_INFO,
        databaseId: 'db-123',
        propertyMapping: {title: 'タイトル'},
        isActive: true,
      });

      const deactivated = pkg.deactivate();

      expect(deactivated.isActive).toBe(false);
      expect(pkg.isActive).toBe(true);
    });
  });

  describe('getPropertyValue()', () => {
    test('マッピングされたプロパティ値を取得できる', () => {
      const pkg = new Package({
        id: 'pkg-001',
        name: 'Test',
        type: PackageType.BOOK_INFO,
        databaseId: 'db-123',
        propertyMapping: {
          title: 'タイトル',
          author: '著者',
        },
        isActive: true,
      });

      expect(pkg.getPropertyValue('title')).toBe('タイトル');
      expect(pkg.getPropertyValue('author')).toBe('著者');
      expect(pkg.getPropertyValue('publisher')).toBeUndefined();
    });
  });

  describe('hasProperty()', () => {
    test('プロパティが存在するか確認できる', () => {
      const pkg = new Package({
        id: 'pkg-001',
        name: 'Test',
        type: PackageType.BOOK_INFO,
        databaseId: 'db-123',
        propertyMapping: {
          title: 'タイトル',
        },
        isActive: true,
      });

      expect(pkg.hasProperty('title')).toBe(true);
      expect(pkg.hasProperty('author')).toBe(false);
    });
  });
});
