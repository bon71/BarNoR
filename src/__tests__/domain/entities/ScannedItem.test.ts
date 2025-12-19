/**
 * ScannedItem エンティティのテスト
 * TDD: Red-Green-Refactor
 */

import { ScannedItem, ItemType } from '@/domain/entities/ScannedItem';

describe('ScannedItem Entity', () => {
  describe('書籍情報の作成', () => {
    test('有効な書籍情報でScannedItemを作成できる', () => {
      const item = new ScannedItem({
        barcode: '9784798121963',
        type: ItemType.BOOK,
        title: 'ドメイン駆動設計',
        author: 'エリック・エヴァンス',
        publisher: '翔泳社',
        price: 5060,
        imageUrl: 'https://example.com/cover.jpg',
      });

      expect(item.barcode).toBe('9784798121963');
      expect(item.type).toBe(ItemType.BOOK);
      expect(item.title).toBe('ドメイン駆動設計');
      expect(item.author).toBe('エリック・エヴァンス');
      expect(item.publisher).toBe('翔泳社');
      expect(item.price).toBe(5060);
      expect(item.imageUrl).toBe('https://example.com/cover.jpg');
      expect(item.scannedAt).toBeInstanceOf(Date);
    });
  });

  describe('商品情報の作成', () => {
    test('有効な商品情報でScannedItemを作成できる', () => {
      const item = new ScannedItem({
        barcode: '4902370515428',
        type: ItemType.PRODUCT,
        title: 'キットカット',
        maker: 'ネスレ',
        price: 200,
      });

      expect(item.barcode).toBe('4902370515428');
      expect(item.type).toBe(ItemType.PRODUCT);
      expect(item.title).toBe('キットカット');
      expect(item.maker).toBe('ネスレ');
      expect(item.price).toBe(200);
    });
  });

  describe('バーコードのバリデーション', () => {
    test('バーコードが短すぎる場合はエラーをスローする', () => {
      expect(() => {
        new ScannedItem({
          barcode: '123',
          type: ItemType.BOOK,
          title: 'Test Book',
        });
      }).toThrow('Invalid barcode format: barcode must be 8-14 digits');
    });

    test('バーコードが長すぎる場合はエラーをスローする', () => {
      expect(() => {
        new ScannedItem({
          barcode: '123456789012345',
          type: ItemType.BOOK,
          title: 'Test Book',
        });
      }).toThrow('Invalid barcode format: barcode must be 8-14 digits');
    });

    test('バーコードに数字以外が含まれる場合はエラーをスローする', () => {
      expect(() => {
        new ScannedItem({
          barcode: '123abc7890',
          type: ItemType.BOOK,
          title: 'Test Book',
        });
      }).toThrow('Invalid barcode format: barcode must contain only digits');
    });
  });

  describe('タイトルのバリデーション', () => {
    test('タイトルが空の場合はエラーをスローする', () => {
      expect(() => {
        new ScannedItem({
          barcode: '9784798121963',
          type: ItemType.BOOK,
          title: '',
        });
      }).toThrow('Title is required');
    });

    test('タイトルがnullの場合はエラーをスローする', () => {
      expect(() => {
        new ScannedItem({
          barcode: '9784798121963',
          type: ItemType.BOOK,
          title: null as any,
        });
      }).toThrow('Title is required');
    });
  });

  describe('価格のバリデーション', () => {
    test('価格が負の値の場合はエラーをスローする', () => {
      expect(() => {
        new ScannedItem({
          barcode: '9784798121963',
          type: ItemType.BOOK,
          title: 'Test Book',
          price: -100,
        });
      }).toThrow('Price must be non-negative');
    });

    test('価格が0の場合は許可される', () => {
      const item = new ScannedItem({
        barcode: '9784798121963',
        type: ItemType.BOOK,
        title: 'Test Book',
        price: 0,
      });

      expect(item.price).toBe(0);
    });
  });

  describe('getDisplayInfo()', () => {
    test('書籍情報の表示用テキストを取得できる', () => {
      const item = new ScannedItem({
        barcode: '9784798121963',
        type: ItemType.BOOK,
        title: 'ドメイン駆動設計',
        author: 'エリック・エヴァンス',
        publisher: '翔泳社',
        price: 5060,
      });

      const displayInfo = item.getDisplayInfo();

      expect(displayInfo).toContain('ドメイン駆動設計');
      expect(displayInfo).toContain('エリック・エヴァンス');
      expect(displayInfo).toContain('翔泳社');
      expect(displayInfo).toContain('¥5,060');
    });

    test('書籍情報でauthorがない場合の表示用テキストを取得できる', () => {
      const item = new ScannedItem({
        barcode: '9784798121963',
        type: ItemType.BOOK,
        title: 'ドメイン駆動設計',
        publisher: '翔泳社',
      });

      const displayInfo = item.getDisplayInfo();

      expect(displayInfo).toContain('ドメイン駆動設計');
      expect(displayInfo).toContain('翔泳社');
      expect(displayInfo).not.toContain('著:');
    });

    test('書籍情報でpublisherがない場合の表示用テキストを取得できる', () => {
      const item = new ScannedItem({
        barcode: '9784798121963',
        type: ItemType.BOOK,
        title: 'ドメイン駆動設計',
        author: 'エリック・エヴァンス',
      });

      const displayInfo = item.getDisplayInfo();

      expect(displayInfo).toContain('ドメイン駆動設計');
      expect(displayInfo).toContain('エリック・エヴァンス');
      expect(displayInfo).not.toContain('出版:');
    });

    test('書籍情報でauthorもpublisherもない場合の表示用テキストを取得できる', () => {
      const item = new ScannedItem({
        barcode: '9784798121963',
        type: ItemType.BOOK,
        title: 'ドメイン駆動設計',
      });

      const displayInfo = item.getDisplayInfo();

      expect(displayInfo).toBe('ドメイン駆動設計');
    });

    test('商品情報の表示用テキストを取得できる', () => {
      const item = new ScannedItem({
        barcode: '4902370515428',
        type: ItemType.PRODUCT,
        title: 'キットカット',
        maker: 'ネスレ',
        price: 200,
      });

      const displayInfo = item.getDisplayInfo();

      expect(displayInfo).toContain('キットカット');
      expect(displayInfo).toContain('ネスレ');
      expect(displayInfo).toContain('¥200');
    });

    test('商品情報でmakerがない場合の表示用テキストを取得できる', () => {
      const item = new ScannedItem({
        barcode: '4902370515428',
        type: ItemType.PRODUCT,
        title: 'キットカット',
      });

      const displayInfo = item.getDisplayInfo();

      expect(displayInfo).toBe('キットカット');
      expect(displayInfo).not.toContain('メーカー:');
    });

    test('価格がない場合の表示用テキストを取得できる', () => {
      const item = new ScannedItem({
        barcode: '9784798121963',
        type: ItemType.BOOK,
        title: 'ドメイン駆動設計',
        author: 'エリック・エヴァンス',
      });

      const displayInfo = item.getDisplayInfo();

      expect(displayInfo).toContain('ドメイン駆動設計');
      expect(displayInfo).toContain('エリック・エヴァンス');
      expect(displayInfo).not.toContain('¥');
    });

    test('価格が0の場合の表示用テキストを取得できる', () => {
      const item = new ScannedItem({
        barcode: '9784798121963',
        type: ItemType.BOOK,
        title: 'ドメイン駆動設計',
        price: 0,
      });

      const displayInfo = item.getDisplayInfo();

      expect(displayInfo).toContain('¥0');
    });
  });

  describe('isBook()', () => {
    test('書籍の場合trueを返す', () => {
      const item = new ScannedItem({
        barcode: '9784798121963',
        type: ItemType.BOOK,
        title: 'Test Book',
      });

      expect(item.isBook()).toBe(true);
      expect(item.isProduct()).toBe(false);
    });
  });

  describe('isProduct()', () => {
    test('商品の場合trueを返す', () => {
      const item = new ScannedItem({
        barcode: '4902370515428',
        type: ItemType.PRODUCT,
        title: 'Test Product',
      });

      expect(item.isProduct()).toBe(true);
      expect(item.isBook()).toBe(false);
    });
  });

  describe('equals()', () => {
    test('同じバーコードとタイプの場合はtrueを返す', () => {
      const item1 = new ScannedItem({
        barcode: '9784798121963',
        type: ItemType.BOOK,
        title: 'Book 1',
      });

      const item2 = new ScannedItem({
        barcode: '9784798121963',
        type: ItemType.BOOK,
        title: 'Book 2',
      });

      expect(item1.equals(item2)).toBe(true);
    });

    test('異なるバーコードの場合はfalseを返す', () => {
      const item1 = new ScannedItem({
        barcode: '9784798121963',
        type: ItemType.BOOK,
        title: 'Book 1',
      });

      const item2 = new ScannedItem({
        barcode: '9784798121964',
        type: ItemType.BOOK,
        title: 'Book 2',
      });

      expect(item1.equals(item2)).toBe(false);
    });

    test('異なるタイプの場合はfalseを返す', () => {
      const item1 = new ScannedItem({
        barcode: '9784798121963',
        type: ItemType.BOOK,
        title: 'Book 1',
      });

      const item2 = new ScannedItem({
        barcode: '9784798121963',
        type: ItemType.PRODUCT,
        title: 'Product 1',
      });

      expect(item1.equals(item2)).toBe(false);
    });
  });

  describe('タイトルのバリデーション（空白のみ）', () => {
    test('タイトルが空白のみの場合はエラーをスローする', () => {
      expect(() => {
        new ScannedItem({
          barcode: '9784798121963',
          type: ItemType.BOOK,
          title: '   ',
        });
      }).toThrow('Title is required');
    });
  });

  describe('バーコードのバリデーション（境界値）', () => {
    test('バーコードが8桁の場合は許可される', () => {
      const item = new ScannedItem({
        barcode: '12345678',
        type: ItemType.BOOK,
        title: 'Test Book',
      });

      expect(item.barcode).toBe('12345678');
    });

    test('バーコードが14桁の場合は許可される', () => {
      const item = new ScannedItem({
        barcode: '12345678901234',
        type: ItemType.BOOK,
        title: 'Test Book',
      });

      expect(item.barcode).toBe('12345678901234');
    });
  });
});
