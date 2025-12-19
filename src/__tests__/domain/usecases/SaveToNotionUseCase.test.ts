/**
 * SaveToNotionUseCase のテスト
 */

import {SaveToNotionUseCase} from '@/domain/usecases/SaveToNotionUseCase';
import {INotionRepository} from '@/domain/repositories/INotionRepository';
import {IStorageRepository} from '@/domain/repositories/IStorageRepository';
import {ScannedItem, ItemType} from '@/domain/entities/ScannedItem';
import {Package, PackageType} from '@/domain/entities/Package';

describe('SaveToNotionUseCase', () => {
  let mockNotionRepo: jest.Mocked<INotionRepository>;
  let mockStorageRepo: jest.Mocked<IStorageRepository>;
  let useCase: SaveToNotionUseCase;

  beforeEach(() => {
    mockNotionRepo = {
      validateToken: jest.fn(),
      listDatabases: jest.fn(),
      getDatabaseProperties: jest.fn(),
      saveItem: jest.fn(),
    } as any;

    mockStorageRepo = {
      saveNotionToken: jest.fn(),
      getNotionToken: jest.fn(),
      deleteNotionToken: jest.fn(),
      savePackages: jest.fn(),
      getPackages: jest.fn(),
      saveScanHistory: jest.fn(),
      getScanHistory: jest.fn(),
      clearScanHistory: jest.fn(),
    } as any;

    useCase = new SaveToNotionUseCase(mockNotionRepo, mockStorageRepo);
  });

  describe('execute()', () => {
    const mockItem = new ScannedItem({
      barcode: '9784798121963',
      type: ItemType.BOOK,
      title: 'ドメイン駆動設計',
      author: 'エリック・エヴァンス',
      price: 5060,
    });

    const mockPackage = new Package({
      id: 'pkg-001',
      name: '読書管理',
      type: PackageType.BOOK_INFO,
      databaseId: 'db-123',
      propertyMapping: {title: 'タイトル'},
      isActive: true,
    });

    test('Notionに正常に保存できる', async () => {
      const mockToken = 'test-token';
      mockStorageRepo.getNotionToken.mockResolvedValue(mockToken);
      mockNotionRepo.saveItem.mockResolvedValue({
        success: true,
        pageId: 'page-123',
      });

      const result = await useCase.execute(mockItem, mockPackage);

      expect(result.success).toBe(true);
      expect(result.pageId).toBe('page-123');
      expect(mockStorageRepo.getNotionToken).toHaveBeenCalled();
      expect(mockNotionRepo.saveItem).toHaveBeenCalledWith(
        mockToken,
        mockPackage,
        mockItem,
      );
    });

    test('トークンが存在しない場合はエラーをスローする', async () => {
      mockStorageRepo.getNotionToken.mockResolvedValue(null);

      await expect(
        useCase.execute(mockItem, mockPackage),
      ).rejects.toThrow('Notion token not found');

      expect(mockNotionRepo.saveItem).not.toHaveBeenCalled();
    });

    test('パッケージが非アクティブな場合はエラーをスローする', async () => {
      const inactivePackage = new Package({
        ...mockPackage,
        isActive: false,
      });

      await expect(
        useCase.execute(mockItem, inactivePackage),
      ).rejects.toThrow('Package is not active');

      expect(mockNotionRepo.saveItem).not.toHaveBeenCalled();
    });

    test('保存に失敗した場合はエラー情報を返す', async () => {
      const mockToken = 'test-token';
      mockStorageRepo.getNotionToken.mockResolvedValue(mockToken);
      mockNotionRepo.saveItem.mockResolvedValue({
        success: false,
        error: 'Database not found',
      });

      const result = await useCase.execute(mockItem, mockPackage);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database not found');
    });
  });
});
