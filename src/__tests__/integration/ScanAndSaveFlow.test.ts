/**
 * 統合テスト: スキャン→保存フロー
 * バーコードスキャンから書籍情報取得、Notion保存までの一連のフローをテスト
 */

import {FetchBookInfoUseCase} from '@/domain/usecases/FetchBookInfoUseCase';
import {SaveToNotionUseCase} from '@/domain/usecases/SaveToNotionUseCase';
import {ScannedItem, ItemType} from '@/domain/entities/ScannedItem';
import {Package, PackageType} from '@/domain/entities/Package';
import {IBookInfoRepository} from '@/domain/repositories/IBookInfoRepository';
import {INotionRepository} from '@/domain/repositories/INotionRepository';
import {IStorageRepository} from '@/domain/repositories/IStorageRepository';

describe('Scan and Save Flow (Integration)', () => {
  let mockBookInfoRepository: jest.Mocked<IBookInfoRepository>;
  let mockNotionRepository: jest.Mocked<INotionRepository>;
  let mockStorageRepository: jest.Mocked<IStorageRepository>;
  let fetchBookInfoUseCase: FetchBookInfoUseCase;
  let saveToNotionUseCase: SaveToNotionUseCase;

  const testPackage = new Package({
    id: 'test-package-id',
    name: 'テストパッケージ',
    description: 'テスト用のパッケージ',
    type: PackageType.BOOK_INFO,
    databaseId: 'test-database-id',
    isActive: true,
    propertyMapping: {
      title: 'タイトル',
      author: '著者',
      publisher: '出版社',
      barcode: 'バーコード',
    },
  });

  beforeEach(() => {
    // Mock repositories
    mockBookInfoRepository = {
      fetchByISBN: jest.fn(),
      toScannedItem: jest.fn((data, barcode) => {
        return new ScannedItem({
          barcode,
          type: ItemType.BOOK,
          title: data.title,
          author: data.author,
          publisher: data.publisher,
          price: data.price,
        });
      }),
    } as any;

    mockNotionRepository = {
      saveItem: jest.fn(),
      fetchDatabaseProperties: jest.fn(),
      testConnection: jest.fn(),
    } as any;

    mockStorageRepository = {
      getNotionToken: jest.fn(),
      saveNotionToken: jest.fn(),
      getActivePackage: jest.fn(),
      saveActivePackage: jest.fn(),
      getPackages: jest.fn(),
      savePackages: jest.fn(),
      getScanHistory: jest.fn(),
      saveScanHistory: jest.fn(),
      clearScanHistory: jest.fn(),
    } as any;

    // Initialize use cases
    fetchBookInfoUseCase = new FetchBookInfoUseCase(mockBookInfoRepository);
    saveToNotionUseCase = new SaveToNotionUseCase(
      mockNotionRepository,
      mockStorageRepository,
    );
  });

  describe('正常フロー', () => {
    it('バーコードスキャン→書籍情報取得→Notion保存の完全なフローが成功する', async () => {
      // 1. バーコード: ISBN-13
      const barcode = '9784798171234';

      // 2. 書籍情報を取得
      const mockBookInfoData = {
        isbn: barcode,
        title: 'Clean Architecture',
        author: 'Robert C. Martin',
        publisher: '翔泳社',
        price: 3080,
      };

      mockBookInfoRepository.fetchByISBN.mockResolvedValue(mockBookInfoData);

      const scannedItem = await fetchBookInfoUseCase.execute(barcode);

      expect(scannedItem).toBeDefined();
      expect(scannedItem?.barcode).toBe(barcode);
      expect(scannedItem?.title).toBe('Clean Architecture');
      expect(scannedItem?.author).toBe('Robert C. Martin');
      expect(mockBookInfoRepository.fetchByISBN).toHaveBeenCalledWith(barcode);

      // 3. Notionに保存
      mockStorageRepository.getNotionToken.mockResolvedValue(
        'secret_test_token',
      );
      mockNotionRepository.saveItem.mockResolvedValue({
        success: true,
        pageId: 'notion-page-id-123',
      });

      const saveResult = await saveToNotionUseCase.execute(
        scannedItem!,
        testPackage,
      );

      expect(saveResult.success).toBe(true);
      expect(saveResult.pageId).toBe('notion-page-id-123');
      expect(mockNotionRepository.saveItem).toHaveBeenCalledWith(
        'secret_test_token',
        testPackage,
        scannedItem,
      );
    });

    it('商品バーコード（JAN）のスキャン→保存フローが成功する', async () => {
      const barcode = '4567890123456';

      const mockBookInfoData = {
        isbn: barcode,
        title: 'テスト商品',
        price: 1500,
      };

      mockBookInfoRepository.fetchByISBN.mockResolvedValue(mockBookInfoData);

      const scannedItem = await fetchBookInfoUseCase.execute(barcode);

      expect(scannedItem).toBeDefined();
      expect(scannedItem?.type).toBe(ItemType.BOOK);

      mockStorageRepository.getNotionToken.mockResolvedValue(
        'secret_test_token',
      );
      mockNotionRepository.saveItem.mockResolvedValue({
        success: true,
        pageId: 'notion-page-id-456',
      });

      const saveResult = await saveToNotionUseCase.execute(
        scannedItem!,
        testPackage,
      );

      expect(saveResult.success).toBe(true);
    });
  });

  describe('エラーハンドリング', () => {
    it('書籍情報が見つからない場合、適切なエラーが返される', async () => {
      const barcode = '9999999999999';

      mockBookInfoRepository.fetchByISBN.mockResolvedValue(null);

      const scannedItem = await fetchBookInfoUseCase.execute(barcode);

      expect(scannedItem).toBeNull();
      expect(mockBookInfoRepository.fetchByISBN).toHaveBeenCalledWith(barcode);
    });

    it('Notion APIエラー時、適切なエラーメッセージが返される', async () => {
      const scannedItem = new ScannedItem({
        barcode: '9784798171234',
        type: ItemType.BOOK,
        title: 'Test Book',
      });

      mockStorageRepository.getNotionToken.mockResolvedValue(
        'secret_test_token',
      );
      mockNotionRepository.saveItem.mockResolvedValue({
        success: false,
        error: 'Notion API error: Invalid database ID',
      });

      const saveResult = await saveToNotionUseCase.execute(
        scannedItem,
        testPackage,
      );

      expect(saveResult.success).toBe(false);
      expect(saveResult.error).toContain('Notion API error');
    });

    it('Notion Tokenが未設定の場合、エラーが発生する', async () => {
      const scannedItem = new ScannedItem({
        barcode: '9784798171234',
        type: ItemType.BOOK,
        title: 'Test Book',
      });

      mockStorageRepository.getNotionToken.mockResolvedValue(null);

      await expect(
        saveToNotionUseCase.execute(scannedItem, testPackage),
      ).rejects.toThrow('Notion token not found');
    });

    it('パッケージが非アクティブの場合、エラーが発生する', async () => {
      const scannedItem = new ScannedItem({
        barcode: '9784798171234',
        type: ItemType.BOOK,
        title: 'Test Book',
      });

      const inactivePackage = new Package({
        ...testPackage,
        isActive: false,
      });

      mockStorageRepository.getNotionToken.mockResolvedValue(
        'secret_test_token',
      );

      await expect(
        saveToNotionUseCase.execute(scannedItem, inactivePackage),
      ).rejects.toThrow('Package is not active');
    });
  });

  describe('複数アイテムの連続スキャン', () => {
    it('複数のアイテムを連続してスキャン・保存できる', async () => {
      const barcodes = [
        '9784798171234',
        '9784798171235',
        '9784798171236',
      ];

      for (const barcode of barcodes) {
        const mockBookInfoData = {
          isbn: barcode,
          title: `Book ${barcode}`,
        };

        mockBookInfoRepository.fetchByISBN.mockResolvedValue(mockBookInfoData);
        mockStorageRepository.getNotionToken.mockResolvedValue(
          'secret_test_token',
        );
        mockNotionRepository.saveItem.mockResolvedValue({
          success: true,
          pageId: `page-${barcode}`,
        });

        const scannedItem = await fetchBookInfoUseCase.execute(barcode);
        const saveResult = await saveToNotionUseCase.execute(
          scannedItem!,
          testPackage,
        );

        expect(saveResult.success).toBe(true);
      }

      expect(mockBookInfoRepository.fetchByISBN).toHaveBeenCalledTimes(3);
      expect(mockNotionRepository.saveItem).toHaveBeenCalledTimes(3);
    });
  });

  describe('再試行ロジック', () => {
    it('一時的なネットワークエラー後、再試行が成功する', async () => {
      const barcode = '9784798171234';
      const mockBookInfoData = {
        isbn: barcode,
        title: 'Test Book',
      };

      // 最初の試行: 失敗
      mockBookInfoRepository.fetchByISBN
        .mockRejectedValueOnce(new Error('Network error'))
        // 2回目の試行: 成功
        .mockResolvedValueOnce(mockBookInfoData);

      // 最初の試行は失敗
      await expect(fetchBookInfoUseCase.execute(barcode)).rejects.toThrow(
        'Network error',
      );

      // 再試行は成功
      const scannedItem = await fetchBookInfoUseCase.execute(barcode);
      expect(scannedItem).toBeDefined();
      expect(scannedItem?.title).toBe('Test Book');
    });
  });

  describe('データ整合性', () => {
    it('スキャンしたバーコードと保存されたバーコードが一致する', async () => {
      const barcode = '9784798171234';
      const mockBookInfoData = {
        isbn: barcode,
        title: 'Test Book',
      };

      mockBookInfoRepository.fetchByISBN.mockResolvedValue(mockBookInfoData);
      mockStorageRepository.getNotionToken.mockResolvedValue(
        'secret_test_token',
      );

      let capturedItem: ScannedItem | undefined;
      mockNotionRepository.saveItem.mockImplementation(
        async (_token, _pkg, item) => {
          capturedItem = item;
          return {success: true, pageId: 'test-page-id'};
        },
      );

      const scannedItem = await fetchBookInfoUseCase.execute(barcode);
      await saveToNotionUseCase.execute(scannedItem!, testPackage);

      expect(capturedItem).toBeDefined();
      expect(capturedItem?.barcode).toBe(barcode);
      expect(capturedItem?.title).toBe('Test Book');
    });
  });
});
