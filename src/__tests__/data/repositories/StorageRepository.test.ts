/**
 * StorageRepositoryのテスト
 */

import {StorageRepository} from '@/data/repositories/StorageRepository';
import {MMKVStorage} from '@/data/datasources/MMKVStorage';
import {Package, PackageType} from '@/domain/entities/Package';
import {STORAGE_KEYS} from '@/config/constants';

// MMKVStorageのモック
jest.mock('@/data/datasources/MMKVStorage');

describe('StorageRepository', () => {
  let repository: StorageRepository;
  let mockStorage: jest.Mocked<MMKVStorage>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage = new MMKVStorage() as jest.Mocked<MMKVStorage>;
    repository = new StorageRepository(mockStorage);
  });

  describe('Notion Token管理', () => {
    it('Notion Tokenを保存できる', async () => {
      // Arrange
      const token = 'secret_test_token';
      mockStorage.set = jest.fn();

      // Act
      await repository.saveNotionToken(token);

      // Assert
      expect(mockStorage.set).toHaveBeenCalledWith(
        STORAGE_KEYS.NOTION_TOKEN,
        token,
      );
    });

    it('Notion Tokenを取得できる', async () => {
      // Arrange
      const token = 'secret_test_token';
      mockStorage.get = jest.fn().mockReturnValue(token);

      // Act
      const result = await repository.getNotionToken();

      // Assert
      expect(mockStorage.get).toHaveBeenCalledWith(STORAGE_KEYS.NOTION_TOKEN);
      expect(result).toBe(token);
    });

    it('Notion Tokenが存在しない場合はnullを返す', async () => {
      // Arrange
      mockStorage.get = jest.fn().mockReturnValue(undefined);

      // Act
      const result = await repository.getNotionToken();

      // Assert
      expect(result).toBeNull();
    });

    it('Notion Tokenを削除できる', async () => {
      // Arrange
      mockStorage.delete = jest.fn();

      // Act
      await repository.deleteNotionToken();

      // Assert
      expect(mockStorage.delete).toHaveBeenCalledWith(
        STORAGE_KEYS.NOTION_TOKEN,
      );
    });
  });

  describe('Package管理', () => {
    it('Packagesを保存できる', async () => {
      // Arrange
      const packages = [
        new Package({
          id: 'pkg-1',
          name: 'Test Package',
          type: PackageType.BOOK_INFO,
          databaseId: 'db-123',
          propertyMapping: {title: 'Title'},
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];
      mockStorage.setObject = jest.fn();

      // Act
      await repository.savePackages(packages);

      // Assert
      expect(mockStorage.setObject).toHaveBeenCalledWith(
        STORAGE_KEYS.PACKAGES,
        expect.any(Array),
      );
    });

    it('Packagesを取得できる', async () => {
      // Arrange
      const packageData = [
        {
          id: 'pkg-1',
          name: 'Test Package',
          type: 'book_info',
          databaseId: 'db-123',
          propertyMapping: {title: 'Title'},
          isActive: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ];
      mockStorage.getObject = jest.fn().mockReturnValue(packageData);

      // Act
      const result = await repository.getPackages();

      // Assert
      expect(mockStorage.getObject).toHaveBeenCalledWith(
        STORAGE_KEYS.PACKAGES,
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Package);
      expect(result[0].id).toBe('pkg-1');
    });

    it('Packagesが存在しない場合は空配列を返す', async () => {
      // Arrange
      mockStorage.getObject = jest.fn().mockReturnValue(undefined);

      // Act
      const result = await repository.getPackages();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('Scan History管理', () => {
    it('Scan Historyを保存できる', async () => {
      // Arrange
      const history = [
        {
          id: '1',
          barcode: '9784062938426',
          title: 'Test Book',
          type: 'book' as const,
          status: 'pending' as const,
          scannedAt: new Date(),
        },
      ];
      mockStorage.setObject = jest.fn();

      // Act
      await repository.saveScanHistory(history);

      // Assert
      expect(mockStorage.setObject).toHaveBeenCalledWith(
        STORAGE_KEYS.SCAN_HISTORY,
        history,
      );
    });

    it('Scan Historyを取得できる', async () => {
      // Arrange
      const history = [
        {
          id: '1',
          barcode: '9784062938426',
          title: 'Test Book',
          type: 'book' as const,
          status: 'pending' as const,
          scannedAt: new Date('2024-01-01T00:00:00.000Z'),
        },
      ];
      mockStorage.getObject = jest.fn().mockReturnValue(history);

      // Act
      const result = await repository.getScanHistory();

      // Assert
      expect(mockStorage.getObject).toHaveBeenCalledWith(
        STORAGE_KEYS.SCAN_HISTORY,
      );
      expect(result).toEqual(history);
    });

    it('Scan Historyが存在しない場合は空配列を返す', async () => {
      // Arrange
      mockStorage.getObject = jest.fn().mockReturnValue(undefined);

      // Act
      const result = await repository.getScanHistory();

      // Assert
      expect(result).toEqual([]);
    });

    it('Scan Historyをクリアできる', async () => {
      // Arrange
      mockStorage.delete = jest.fn();

      // Act
      await repository.clearScanHistory();

      // Assert
      expect(mockStorage.delete).toHaveBeenCalledWith(
        STORAGE_KEYS.SCAN_HISTORY,
      );
    });
  });
});
