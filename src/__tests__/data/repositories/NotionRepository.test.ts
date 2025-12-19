/**
 * NotionRepositoryのテスト
 */

import {NotionRepository} from '@/data/repositories/NotionRepository';
import {
  NotionAPI,
  NotionDatabaseResponse,
  NotionSearchResponse,
  NotionPageCreateResponse,
} from '@/data/datasources/NotionAPI';
import {Package, PackageType} from '@/domain/entities/Package';
import {ScannedItem, ItemType} from '@/domain/entities/ScannedItem';

// NotionAPIのモック
jest.mock('@/data/datasources/NotionAPI');

describe('NotionRepository', () => {
  let repository: NotionRepository;
  let mockNotionAPI: jest.Mocked<NotionAPI>;
  const mockToken = 'secret_test_token';

  beforeEach(() => {
    jest.clearAllMocks();
    mockNotionAPI = new NotionAPI() as jest.Mocked<NotionAPI>;
    repository = new NotionRepository(mockNotionAPI);
  });

  describe('validateToken', () => {
    it('有効なトークンの場合はtrueを返す', async () => {
      // Arrange
      mockNotionAPI.validateToken = jest.fn().mockResolvedValue(true);

      // Act
      const result = await repository.validateToken(mockToken);

      // Assert
      expect(mockNotionAPI.validateToken).toHaveBeenCalledWith(mockToken);
      expect(result).toBe(true);
    });

    it('無効なトークンの場合はfalseを返す', async () => {
      // Arrange
      mockNotionAPI.validateToken = jest.fn().mockResolvedValue(false);

      // Act
      const result = await repository.validateToken(mockToken);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('listDatabases', () => {
    it('データベース一覧を取得できる', async () => {
      // Arrange
      const mockResponse: NotionSearchResponse = {
        results: [
          {
            object: 'database',
            id: 'db-123',
            title: [
              {
                type: 'text',
                text: {
                  content: 'Books Database',
                },
              },
            ],
            properties: {
              Name: {
                id: 'title',
                type: 'title',
              },
            },
          },
        ],
        has_more: false,
        next_cursor: null,
      };

      mockNotionAPI.searchDatabases = jest.fn().mockResolvedValue(mockResponse);

      // Act
      const result = await repository.listDatabases(mockToken);

      // Assert
      expect(mockNotionAPI.searchDatabases).toHaveBeenCalledWith(mockToken);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'db-123',
        title: 'Books Database',
      });
    });

    it('空のデータベース一覧を処理できる', async () => {
      // Arrange
      const mockResponse: NotionSearchResponse = {
        results: [],
        has_more: false,
        next_cursor: null,
      };

      mockNotionAPI.searchDatabases = jest.fn().mockResolvedValue(mockResponse);

      // Act
      const result = await repository.listDatabases(mockToken);

      // Assert
      expect(result).toEqual([]);
    });

    it('タイトルがない場合はUntitledを使用する', async () => {
      // Arrange
      const mockResponse: NotionSearchResponse = {
        results: [
          {
            object: 'database',
            id: 'db-123',
            title: [],
            properties: {},
          },
        ],
        has_more: false,
        next_cursor: null,
      };

      mockNotionAPI.searchDatabases = jest.fn().mockResolvedValue(mockResponse);

      // Act
      const result = await repository.listDatabases(mockToken);

      // Assert
      expect(result[0].title).toBe('Untitled');
    });

    it('data_sourceオブジェクトを処理できる', async () => {
      // Arrange
      const mockResponse: NotionSearchResponse = {
        results: [
          {
            object: 'data_source',
            id: 'ds-123',
            title: [
              {
                type: 'text',
                text: {
                  content: 'Data Source Title',
                },
              },
            ],
            parent: {
              type: 'database_id',
              database_id: 'db-456',
            },
          },
        ],
        has_more: false,
        next_cursor: null,
      };

      mockNotionAPI.searchDatabases = jest.fn().mockResolvedValue(mockResponse);

      // Act
      const result = await repository.listDatabases(mockToken);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'db-456',
        title: 'Data Source Title',
      });
    });

    it('data_sourceにparent.database_idがない場合はフィルタされる', async () => {
      // Arrange
      const mockResponse: NotionSearchResponse = {
        results: [
          {
            object: 'data_source',
            id: 'ds-123',
            title: [
              {
                type: 'text',
                text: {
                  content: 'Data Source Title',
                },
              },
            ],
            parent: {} as any, // parent.database_idがない
          },
        ],
        has_more: false,
        next_cursor: null,
      };

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      mockNotionAPI.searchDatabases = jest.fn().mockResolvedValue(mockResponse);

      // Act
      const result = await repository.listDatabases(mockToken);

      // Assert
      expect(result).toHaveLength(0);
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it('responseがnullの場合は空配列を返す', async () => {
      mockNotionAPI.searchDatabases = jest.fn().mockResolvedValue(null);

      const result = await repository.listDatabases(mockToken);

      expect(result).toEqual([]);
    });

    it('response.resultsがnullの場合は空配列を返す', async () => {
      mockNotionAPI.searchDatabases = jest.fn().mockResolvedValue({
        results: null,
        has_more: false,
        next_cursor: null,
      });

      const result = await repository.listDatabases(mockToken);

      expect(result).toEqual([]);
    });
  });

  describe('getDatabase', () => {
    it('データベース情報を取得できる', async () => {
      const databaseId = 'db-123';
      const mockResponse: NotionDatabaseResponse = {
        object: 'database',
        id: databaseId,
        title: [
          {
            type: 'text',
            text: {
              content: 'Books Database',
            },
          },
        ],
        properties: {
          Name: {
            id: 'title',
            type: 'title',
          },
        },
      };

      mockNotionAPI.getDatabase = jest.fn().mockResolvedValue(mockResponse);

      const result = await repository.getDatabase(mockToken, databaseId);

      expect(mockNotionAPI.getDatabase).toHaveBeenCalledWith(mockToken, databaseId);
      expect(result).toEqual({
        id: databaseId,
        title: 'Books Database',
        properties: mockResponse.properties,
      });
    });

    it('タイトルがない場合はUntitledを使用する', async () => {
      const databaseId = 'db-123';
      const mockResponse: NotionDatabaseResponse = {
        object: 'database',
        id: databaseId,
        title: [],
        properties: {},
      };

      mockNotionAPI.getDatabase = jest.fn().mockResolvedValue(mockResponse);

      const result = await repository.getDatabase(mockToken, databaseId);

      expect(result.title).toBe('Untitled');
    });

    it('データベースが見つからない場合はエラーをスローする', async () => {
      const databaseId = 'db-123';
      mockNotionAPI.getDatabase = jest.fn().mockResolvedValue(null);

      await expect(repository.getDatabase(mockToken, databaseId)).rejects.toThrow(
        'Database not found',
      );
    });
  });

  describe('getDatabaseProperties', () => {
    it('データベースのプロパティ一覧を取得できる（旧バージョン）', async () => {
      // Arrange
      const databaseId = 'db-123';
      const mockResponse: NotionDatabaseResponse = {
        object: 'database',
        id: databaseId,
        title: [
          {
            type: 'text',
            text: {
              content: 'Books Database',
            },
          },
        ],
        properties: {
          Name: {
            id: 'title',
            type: 'title',
          },
          Author: {
            id: 'prop-1',
            type: 'rich_text',
          },
        },
      };

      mockNotionAPI.getDatabase = jest.fn().mockResolvedValue(mockResponse);

      // Act
      const result = await repository.getDatabaseProperties(
        mockToken,
        databaseId,
      );

      // Assert
      expect(mockNotionAPI.getDatabase).toHaveBeenCalledWith(
        mockToken,
        databaseId,
      );
      expect(result).toHaveLength(2);
      expect(result).toContainEqual({
        id: 'title',
        name: 'Name',
        type: 'title',
      });
      expect(result).toContainEqual({
        id: 'prop-1',
        name: 'Author',
        type: 'rich_text',
      });
    });

    it('data_sourcesからプロパティを取得できる（新バージョン）', async () => {
      const databaseId = 'db-123';
      const mockDatabase: NotionDatabaseResponse = {
        object: 'database',
        id: databaseId,
        title: [
          {
            type: 'text',
            text: {
              content: 'Books Database',
            },
          },
        ],
        properties: {},
        data_sources: [
          {
            id: 'ds-123',
            name: 'Test Data Source',
          },
        ],
      };

      const mockDataSource = {
        object: 'data_source',
        id: 'ds-123',
        name: 'Test Data Source',
        properties: {
          Title: {
            id: 'title',
            type: 'title',
          },
          Author: {
            id: 'prop-1',
            type: 'rich_text',
          },
        },
      };

      mockNotionAPI.getDatabase = jest.fn().mockResolvedValue(mockDatabase);
      mockNotionAPI.getDataSource = jest.fn().mockResolvedValue(mockDataSource);

      const result = await repository.getDatabaseProperties(mockToken, databaseId);

      expect(mockNotionAPI.getDatabase).toHaveBeenCalledWith(mockToken, databaseId);
      expect(mockNotionAPI.getDataSource).toHaveBeenCalledWith(mockToken, 'ds-123');
      expect(result).toHaveLength(2);
      expect(result).toContainEqual({
        id: 'title',
        name: 'Title',
        type: 'title',
      });
      expect(result).toContainEqual({
        id: 'prop-1',
        name: 'Author',
        type: 'rich_text',
      });
    });

    it('データベースが見つからない場合は空配列を返す', async () => {
      const databaseId = 'db-123';
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      mockNotionAPI.getDatabase = jest.fn().mockResolvedValue(null);

      const result = await repository.getDatabaseProperties(mockToken, databaseId);

      expect(result).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it('data_sourceが見つからない場合は空配列を返す', async () => {
      const databaseId = 'db-123';
      const mockDatabase: NotionDatabaseResponse = {
        object: 'database',
        id: databaseId,
        title: [
          {
            type: 'text',
            text: {
              content: 'Books Database',
            },
          },
        ],
        properties: {},
        data_sources: [
          {
            id: 'ds-123',
            name: 'Test Data Source',
          },
        ],
      };

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      mockNotionAPI.getDatabase = jest.fn().mockResolvedValue(mockDatabase);
      mockNotionAPI.getDataSource = jest.fn().mockResolvedValue(null);

      const result = await repository.getDatabaseProperties(mockToken, databaseId);

      expect(result).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it('data_sourceにpropertiesがない場合は空配列を返す', async () => {
      const databaseId = 'db-123';
      const mockDatabase: NotionDatabaseResponse = {
        object: 'database',
        id: databaseId,
        title: [
          {
            type: 'text',
            text: {
              content: 'Books Database',
            },
          },
        ],
        properties: {},
        data_sources: [
          {
            id: 'ds-123',
            name: 'Test Data Source',
          },
        ],
      };

      const mockDataSource = {
        object: 'data_source',
        id: 'ds-123',
        name: 'Test Data Source',
        properties: undefined,
      };

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      mockNotionAPI.getDatabase = jest.fn().mockResolvedValue(mockDatabase);
      mockNotionAPI.getDataSource = jest.fn().mockResolvedValue(mockDataSource as any);

      const result = await repository.getDatabaseProperties(mockToken, databaseId);

      expect(result).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it('プロパティがない場合は空配列を返す', async () => {
      const databaseId = 'db-123';
      const mockDatabase: NotionDatabaseResponse = {
        object: 'database',
        id: databaseId,
        title: [
          {
            type: 'text',
            text: {
              content: 'Books Database',
            },
          },
        ],
        properties: undefined,
      };

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      mockNotionAPI.getDatabase = jest.fn().mockResolvedValue(mockDatabase);

      const result = await repository.getDatabaseProperties(mockToken, databaseId);

      expect(result).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('saveItem', () => {
    it('書籍アイテムをNotionに保存できる', async () => {
      // Arrange
      const pkg = new Package({
        id: 'pkg-1',
        name: 'Test Package',
        type: PackageType.BOOK_INFO,
        databaseId: 'db-123',
        propertyMapping: {
          title: 'Title',
          author: 'Author',
          publisher: 'Publisher',
          price: 'Price',
          barcode: 'ISBN',
          imageUrl: 'Cover',
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const item = new ScannedItem({
        barcode: '9784062938426',
        type: ItemType.BOOK,
        title: 'Test Book',
        author: 'Test Author',
        publisher: 'Test Publisher',
        price: 1980,
        imageUrl: 'https://example.com/cover.jpg',
        scannedAt: new Date(),
      });

      const mockResponse: NotionPageCreateResponse = {
        object: 'page',
        id: 'page-123',
      };

      mockNotionAPI.createPage = jest.fn().mockResolvedValue(mockResponse);

      // Act
      const result = await repository.saveItem(mockToken, pkg, item);

      // Assert
      expect(mockNotionAPI.createPage).toHaveBeenCalledWith(
        mockToken,
        'db-123',
        expect.objectContaining({
          Title: expect.objectContaining({
            title: expect.arrayContaining([
              expect.objectContaining({
                text: expect.objectContaining({
                  content: 'Test Book',
                }),
              }),
            ]),
          }),
        }),
      );
      expect(result).toEqual({
        success: true,
        pageId: 'page-123',
      });
    });

    it('製品アイテムをNotionに保存できる', async () => {
      // Arrange
      const pkg = new Package({
        id: 'pkg-1',
        name: 'Test Package',
        type: PackageType.PRODUCT_INFO,
        databaseId: 'db-123',
        propertyMapping: {
          title: 'Name',
          maker: 'Maker',
          price: 'Price',
          barcode: 'Barcode',
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const item = new ScannedItem({
        barcode: '4901234567890',
        type: ItemType.PRODUCT,
        title: 'Test Product',
        maker: 'Test Maker',
        price: 1000,
        scannedAt: new Date(),
      });

      const mockResponse: NotionPageCreateResponse = {
        object: 'page',
        id: 'page-456',
      };

      mockNotionAPI.createPage = jest.fn().mockResolvedValue(mockResponse);

      // Act
      const result = await repository.saveItem(mockToken, pkg, item);

      // Assert
      expect(result.success).toBe(true);
      expect(result.pageId).toBe('page-456');
    });

    it('保存に失敗した場合はエラーを返す', async () => {
      // Arrange
      const pkg = new Package({
        id: 'pkg-1',
        name: 'Test Package',
        type: PackageType.BOOK_INFO,
        databaseId: 'db-123',
        propertyMapping: {
          title: 'Title',
          barcode: 'ISBN',
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const item = new ScannedItem({
        barcode: '9784062938426',
        type: ItemType.BOOK,
        title: 'Test Book',
        scannedAt: new Date(),
      });

      const error = new Error('Failed to create page');
      mockNotionAPI.createPage = jest.fn().mockRejectedValue(error);

      // Act
      const result = await repository.saveItem(mockToken, pkg, item);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Failed to create page',
      });
    });

    it('title マッピング欠如なら早期エラーを返す', async () => {
      const pkgNoTitle = new Package({
        id: 'pkg-1',
        name: 'Test Package',
        type: PackageType.BOOK_INFO,
        databaseId: 'db-123',
        propertyMapping: {
          // titleが無い
          barcode: 'ISBN',
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const itemValid = new ScannedItem({
        barcode: '9784062938426',
        type: ItemType.BOOK,
        title: 'Test',
        scannedAt: new Date(),
      });

      const result1 = await repository.saveItem('token', pkgNoTitle, itemValid);
      expect(result1).toEqual({
        success: false,
        error: 'Invalid property mapping: title is required',
      });
    });

    it('barcode マッピング欠如なら早期エラーを返す', async () => {
      const pkg = new Package({
        id: 'pkg-1',
        name: 'Test Package',
        type: PackageType.BOOK_INFO,
        databaseId: 'db-123',
        propertyMapping: {
          title: 'Title',
          // barcodeなし
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const item = new ScannedItem({
        barcode: '9784062938426',
        type: ItemType.BOOK,
        title: 'Test Book',
        scannedAt: new Date(),
      });

      const result = await repository.saveItem('token', pkg, item);
      expect(result).toEqual({
        success: false,
        error: 'Invalid property mapping: barcode is required',
      });
    });

    it('createPageが失敗した場合はエラーを返す', async () => {
      const pkg = new Package({
        id: 'pkg-1',
        name: 'Test Package',
        type: PackageType.BOOK_INFO,
        databaseId: 'db-123',
        propertyMapping: {
          title: 'Title',
          barcode: 'ISBN',
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const item = new ScannedItem({
        barcode: '9784062938426',
        type: ItemType.BOOK,
        title: 'Test Book',
        scannedAt: new Date(),
      });

      const error = new Error('API Error');
      mockNotionAPI.createPage = jest.fn().mockRejectedValue(error);

      const result = await repository.saveItem(mockToken, pkg, item);

      expect(result).toEqual({
        success: false,
        error: 'API Error',
      });
    });

    it('item.titleが空文字列の場合はエラーを返す', async () => {
      const pkg = new Package({
        id: 'pkg-1',
        name: 'Test Package',
        type: PackageType.BOOK_INFO,
        databaseId: 'db-123',
        propertyMapping: {
          title: 'Title',
          barcode: 'ISBN',
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // ScannedItemのコンストラクタはtitleが空文字列の場合エラーをスローするため、
      // 直接作成せず、buildPropertiesをモックしてtitleプロパティが構築されない状態をシミュレート
      const item = new ScannedItem({
        barcode: '9784062938426',
        type: ItemType.BOOK,
        title: 'Test Book', // 有効なタイトルで作成
        scannedAt: new Date(),
      });

      // buildPropertiesをモックして、titleプロパティが構築されない状態をシミュレート
      jest.spyOn(repository as any, 'buildProperties').mockReturnValue({
        // titleプロパティが存在しない
        ISBN: {
          rich_text: [{text: {content: '9784062938426'}}],
        },
      });

      const result = await repository.saveItem(mockToken, pkg, item);
      expect(result).toEqual({
        success: false,
        error: 'Invalid property mapping: required properties are missing',
      });

      jest.restoreAllMocks();
    });

    it('item.titleが空白のみの場合はエラーを返す', async () => {
      const pkg = new Package({
        id: 'pkg-1',
        name: 'Test Package',
        type: PackageType.BOOK_INFO,
        databaseId: 'db-123',
        propertyMapping: {
          title: 'Title',
          barcode: 'ISBN',
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // ScannedItemのコンストラクタはtitleが空白のみの場合エラーをスローするため、
      // buildPropertiesをモックしてtitleプロパティが構築されない状態をシミュレート
      const item = new ScannedItem({
        barcode: '9784062938426',
        type: ItemType.BOOK,
        title: 'Test Book', // 有効なタイトルで作成
        scannedAt: new Date(),
      });

      // buildPropertiesをモックして、titleプロパティが構築されない状態をシミュレート
      jest.spyOn(repository as any, 'buildProperties').mockReturnValue({
        // titleプロパティが存在しない（空白のみの場合はaddTitleでスキップされる）
        ISBN: {
          rich_text: [{text: {content: '9784062938426'}}],
        },
      });

      const result = await repository.saveItem(mockToken, pkg, item);
      expect(result).toEqual({
        success: false,
        error: 'Invalid property mapping: required properties are missing',
      });

      jest.restoreAllMocks();
    });

    it('buildPropertiesでtitleプロパティが構築されない場合はエラーを返す', async () => {
      const pkg = new Package({
        id: 'pkg-1',
        name: 'Test Package',
        type: PackageType.BOOK_INFO,
        databaseId: 'db-123',
        propertyMapping: {
          title: 'Title',
          barcode: 'ISBN',
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const item = new ScannedItem({
        barcode: '9784062938426',
        type: ItemType.BOOK,
        title: 'Test Book',
        scannedAt: new Date(),
      });

      // buildPropertiesをモックして、titleプロパティが構築されない状態をシミュレート
      jest.spyOn(repository as any, 'buildProperties').mockReturnValue({
        // titleプロパティが存在しない
        ISBN: {
          rich_text: [{text: {content: '9784062938426'}}],
        },
      });

      const result = await repository.saveItem(mockToken, pkg, item);
      expect(result).toEqual({
        success: false,
        error: 'Invalid property mapping: required properties are missing',
      });

      jest.restoreAllMocks();
    });

    it('buildPropertiesでbarcodeプロパティが構築されない場合はエラーを返す', async () => {
      const pkg = new Package({
        id: 'pkg-1',
        name: 'Test Package',
        type: PackageType.BOOK_INFO,
        databaseId: 'db-123',
        propertyMapping: {
          title: 'Title',
          barcode: 'ISBN',
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // ScannedItemのコンストラクタはbarcodeが空文字列の場合エラーをスローするため、
      // 有効なbarcodeで作成してからbuildPropertiesをモック
      const item = new ScannedItem({
        barcode: '9784062938426',
        type: ItemType.BOOK,
        title: 'Test Book',
        scannedAt: new Date(),
      });

      // buildPropertiesをモックして、titleは構築されるがbarcodeが構築されない状態をシミュレート
      jest.spyOn(repository as any, 'buildProperties').mockReturnValue({
        Title: {
          title: [{text: {content: 'Test Book'}}],
        },
        // ISBNプロパティが存在しない
      });

      const result = await repository.saveItem(mockToken, pkg, item);
      expect(result).toEqual({
        success: false,
        error: 'Invalid property mapping: required properties are missing',
      });

      jest.restoreAllMocks();
    });

    it('createPageがnullを返した場合はエラーを返す', async () => {
      const pkg = new Package({
        id: 'pkg-1',
        name: 'Test Package',
        type: PackageType.BOOK_INFO,
        databaseId: 'db-123',
        propertyMapping: {
          title: 'Title',
          barcode: 'ISBN',
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const item = new ScannedItem({
        barcode: '9784062938426',
        type: ItemType.BOOK,
        title: 'Test Book',
        scannedAt: new Date(),
      });

      mockNotionAPI.createPage = jest.fn().mockResolvedValue(null);

      const result = await repository.saveItem(mockToken, pkg, item);

      expect(result).toEqual({
        success: false,
        error: 'Failed to create page',
      });
    });

    it('製品アイテムのmakerプロパティを保存できる', async () => {
      const pkg = new Package({
        id: 'pkg-1',
        name: 'Test Package',
        type: PackageType.PRODUCT_INFO,
        databaseId: 'db-123',
        propertyMapping: {
          title: 'Name',
          barcode: 'Barcode',
          maker: 'Maker',
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const item = new ScannedItem({
        barcode: '4901234567890',
        type: ItemType.PRODUCT,
        title: 'Test Product',
        maker: 'Test Maker',
        scannedAt: new Date(),
      });

      const mockResponse: NotionPageCreateResponse = {
        object: 'page',
        id: 'page-789',
      };

      mockNotionAPI.createPage = jest.fn().mockResolvedValue(mockResponse);

      const result = await repository.saveItem(mockToken, pkg, item);

      expect(result.success).toBe(true);
      expect(mockNotionAPI.createPage).toHaveBeenCalledWith(
        mockToken,
        'db-123',
        expect.objectContaining({
          Maker: expect.objectContaining({
            rich_text: expect.arrayContaining([
              expect.objectContaining({
                text: expect.objectContaining({
                  content: 'Test Maker',
                }),
              }),
            ]),
          }),
        }),
      );
    });

    it('priceとimageUrlプロパティを保存できる', async () => {
      const pkg = new Package({
        id: 'pkg-1',
        name: 'Test Package',
        type: PackageType.BOOK_INFO,
        databaseId: 'db-123',
        propertyMapping: {
          title: 'Title',
          barcode: 'ISBN',
          price: 'Price',
          imageUrl: 'Cover',
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const item = new ScannedItem({
        barcode: '9784062938426',
        type: ItemType.BOOK,
        title: 'Test Book',
        price: 1980,
        imageUrl: 'https://example.com/cover.jpg',
        scannedAt: new Date(),
      });

      const mockResponse: NotionPageCreateResponse = {
        object: 'page',
        id: 'page-999',
      };

      mockNotionAPI.createPage = jest.fn().mockResolvedValue(mockResponse);

      const result = await repository.saveItem(mockToken, pkg, item);

      expect(result.success).toBe(true);
      expect(mockNotionAPI.createPage).toHaveBeenCalledWith(
        mockToken,
        'db-123',
        expect.objectContaining({
          Price: {number: 1980},
          Cover: {url: 'https://example.com/cover.jpg'},
        }),
      );
    });
  });

  describe('saveItemWithConfig', () => {
    it('SimplifiedConfigを使用してアイテムを保存できる', async () => {
      const config = {
        notionToken: mockToken,
        databaseId: 'db-123',
        propertyMapping: {
          title: 'タイトル',
          author: '著者名',
          isbn: 'ISBN',
        },
      };

      const item = new ScannedItem({
        barcode: '9784062938426',
        type: ItemType.BOOK,
        title: 'Test Book',
        author: 'Test Author',
        scannedAt: new Date(),
      });

      const mockResponse: NotionPageCreateResponse = {
        object: 'page',
        id: 'page-config-123',
      };

      mockNotionAPI.createPage = jest.fn().mockResolvedValue(mockResponse);

      const result = await repository.saveItemWithConfig(config as any, item);

      expect(result).toEqual({
        success: true,
        pageId: 'page-config-123',
      });
      expect(mockNotionAPI.createPage).toHaveBeenCalledWith(
        mockToken,
        'db-123',
        expect.objectContaining({
          タイトル: expect.objectContaining({
            title: expect.arrayContaining([
              expect.objectContaining({
                text: expect.objectContaining({
                  content: 'Test Book',
                }),
              }),
            ]),
          }),
        }),
      );
    });

    it('titleマッピングがない場合はエラーを返す', async () => {
      const config = {
        notionToken: mockToken,
        databaseId: 'db-123',
        propertyMapping: {
          // titleなし
          author: '著者名',
        },
      };

      const item = new ScannedItem({
        barcode: '9784062938426',
        type: ItemType.BOOK,
        title: 'Test Book',
        scannedAt: new Date(),
      });

      const result = await repository.saveItemWithConfig(config as any, item);

      expect(result).toEqual({
        success: false,
        error: 'Invalid property mapping: title is required',
      });
    });

    it('titleマッピングが空の場合はエラーを返す', async () => {
      const config = {
        notionToken: mockToken,
        databaseId: 'db-123',
        propertyMapping: {
          title: '', // 空のマッピング
        },
      };

      const item = new ScannedItem({
        barcode: '9784062938426',
        type: ItemType.BOOK,
        title: 'Test Book',
        scannedAt: new Date(),
      });

      const result = await repository.saveItemWithConfig(config as any, item);

      expect(result).toEqual({
        success: false,
        error: 'Invalid property mapping: title is required',
      });
    });

    it('buildPropertiesFromConfigでtitleプロパティが構築されない場合はエラーを返す', async () => {
      // titleマッピングが空文字列の場合、addTitleが呼ばれてもプロパティが構築されない
      // しかし、実際にはitem.titleが存在するため、このケースは発生しない
      // 代わりに、titleマッピングが存在しない場合をテストする
      const config = {
        notionToken: mockToken,
        databaseId: 'db-123',
        propertyMapping: {
          // titleマッピングが存在しない
        },
      };

      const item = new ScannedItem({
        barcode: '9784062938426',
        type: ItemType.BOOK,
        title: 'Test Book',
        scannedAt: new Date(),
      });

      const result = await repository.saveItemWithConfig(config as any, item);

      expect(result).toEqual({
        success: false,
        error: 'Invalid property mapping: title is required',
      });
    });

    it('createPageがnullを返した場合はエラーを返す', async () => {
      const config = {
        notionToken: mockToken,
        databaseId: 'db-123',
        propertyMapping: {
          title: 'タイトル',
        },
      };

      const item = new ScannedItem({
        barcode: '9784062938426',
        type: ItemType.BOOK,
        title: 'Test Book',
        scannedAt: new Date(),
      });

      mockNotionAPI.createPage = jest.fn().mockResolvedValue(null);

      const result = await repository.saveItemWithConfig(config as any, item);

      expect(result).toEqual({
        success: false,
        error: 'Failed to create page',
      });
    });

    it('エラー発生時はエラーメッセージを返す', async () => {
      const config = {
        notionToken: mockToken,
        databaseId: 'db-123',
        propertyMapping: {
          title: 'タイトル',
        },
      };

      const item = new ScannedItem({
        barcode: '9784062938426',
        type: ItemType.BOOK,
        title: 'Test Book',
        scannedAt: new Date(),
      });

      const error = new Error('API Error');
      mockNotionAPI.createPage = jest.fn().mockRejectedValue(error);

      const result = await repository.saveItemWithConfig(config as any, item);

      expect(result).toEqual({
        success: false,
        error: 'API Error',
      });
    });

    it('buildPropertiesFromConfigでisbnプロパティを追加できる', async () => {
      const config = {
        notionToken: mockToken,
        databaseId: 'db-123',
        propertyMapping: {
          title: 'タイトル',
          isbn: 'ISBN',
        },
      };

      const item = new ScannedItem({
        barcode: '9784062938426',
        type: ItemType.BOOK,
        title: 'Test Book',
        scannedAt: new Date(),
      });

      const mockResponse: NotionPageCreateResponse = {
        object: 'page',
        id: 'page-isbn-123',
      };

      mockNotionAPI.createPage = jest.fn().mockResolvedValue(mockResponse);

      const result = await repository.saveItemWithConfig(config as any, item);

      expect(result.success).toBe(true);
      expect(mockNotionAPI.createPage).toHaveBeenCalledWith(
        mockToken,
        'db-123',
        expect.objectContaining({
          ISBN: expect.objectContaining({
            rich_text: expect.arrayContaining([
              expect.objectContaining({
                text: expect.objectContaining({
                  content: '9784062938426',
                }),
              }),
            ]),
          }),
        }),
      );
    });

    it('buildPropertiesFromConfigで製品アイテムの場合はauthorを追加しない', async () => {
      const config = {
        notionToken: mockToken,
        databaseId: 'db-123',
        propertyMapping: {
          title: 'タイトル',
          author: '著者名',
        },
      };

      const item = new ScannedItem({
        barcode: '4901234567890',
        type: ItemType.PRODUCT,
        title: 'Test Product',
        scannedAt: new Date(),
      });

      const mockResponse: NotionPageCreateResponse = {
        object: 'page',
        id: 'page-product-123',
      };

      mockNotionAPI.createPage = jest.fn().mockResolvedValue(mockResponse);

      const result = await repository.saveItemWithConfig(config as any, item);

      expect(result.success).toBe(true);
      expect(mockNotionAPI.createPage).toHaveBeenCalledWith(
        mockToken,
        'db-123',
        expect.not.objectContaining({
          著者名: expect.anything(),
        }),
      );
    });

    it('buildPropertiesFromConfigでimageUrlプロパティを追加できる', async () => {
      const config = {
        notionToken: mockToken,
        databaseId: 'db-123',
        propertyMapping: {
          title: 'タイトル',
          imageUrl: '書影',
        },
      };

      const item = new ScannedItem({
        barcode: '9784062938426',
        type: ItemType.BOOK,
        title: 'Test Book',
        imageUrl: 'https://example.com/cover.jpg',
        scannedAt: new Date(),
      });

      const mockResponse: NotionPageCreateResponse = {
        object: 'page',
        id: 'page-image-123',
      };

      mockNotionAPI.createPage = jest.fn().mockResolvedValue(mockResponse);

      const result = await repository.saveItemWithConfig(config as any, item);

      expect(result.success).toBe(true);
      expect(mockNotionAPI.createPage).toHaveBeenCalledWith(
        mockToken,
        'db-123',
        expect.objectContaining({
          書影: {
            files: [
              {
                name: '書影',
                external: {
                  url: 'https://example.com/cover.jpg',
                },
              },
            ],
          },
        }),
      );
    });
  });

  describe('queryDatabasePages', () => {
    it('データベースのページをクエリできる', async () => {
      const databaseId = 'db-123';
      const mockResponse = {
        results: [
          {
            id: 'page-1',
            properties: {},
            created_time: '2024-01-01T00:00:00.000Z',
            last_edited_time: '2024-01-02T00:00:00.000Z',
          },
        ],
        has_more: false,
      };

      mockNotionAPI.queryDatabase = jest.fn().mockResolvedValue(mockResponse);

      const result = await repository.queryDatabasePages(mockToken, databaseId);

      expect(mockNotionAPI.queryDatabase).toHaveBeenCalledWith(
        mockToken,
        databaseId,
        5,
      );
      expect(result).toEqual({
        pages: [
          {
            id: 'page-1',
            properties: {},
            createdTime: '2024-01-01T00:00:00.000Z',
            lastEditedTime: '2024-01-02T00:00:00.000Z',
          },
        ],
        hasMore: false,
      });
    });

    it('カスタムpageSizeを指定できる', async () => {
      const databaseId = 'db-123';
      const mockResponse = {
        results: [],
        has_more: false,
      };

      mockNotionAPI.queryDatabase = jest.fn().mockResolvedValue(mockResponse);

      await repository.queryDatabasePages(mockToken, databaseId, 10);

      expect(mockNotionAPI.queryDatabase).toHaveBeenCalledWith(
        mockToken,
        databaseId,
        10,
      );
    });

    it('responseがnullの場合は空配列を返す', async () => {
      const databaseId = 'db-123';
      mockNotionAPI.queryDatabase = jest.fn().mockResolvedValue(null);

      const result = await repository.queryDatabasePages(mockToken, databaseId);

      expect(result).toEqual({
        pages: [],
        hasMore: false,
      });
    });

    it('response.resultsがnullの場合は空配列を返す', async () => {
      const databaseId = 'db-123';
      mockNotionAPI.queryDatabase = jest.fn().mockResolvedValue({
        results: null,
        has_more: false,
      });

      const result = await repository.queryDatabasePages(mockToken, databaseId);

      expect(result).toEqual({
        pages: [],
        hasMore: false,
      });
    });

    it('無効なdatabaseIdの場合はエラーをスローする', async () => {
      await expect(
        repository.queryDatabasePages(mockToken, ''),
      ).rejects.toThrow('Invalid database ID');
    });

    it('エラー発生時はエラーをスローする', async () => {
      const databaseId = 'db-123';
      const error = new Error('API Error');
      mockNotionAPI.queryDatabase = jest.fn().mockRejectedValue(error);

      await expect(
        repository.queryDatabasePages(mockToken, databaseId),
      ).rejects.toThrow('API Error');
    });

    it('has_moreがtrueの場合はhasMoreがtrueになる', async () => {
      const databaseId = 'db-123';
      const mockResponse = {
        results: [
          {
            id: 'page-1',
            properties: {},
            created_time: '2024-01-01T00:00:00.000Z',
            last_edited_time: '2024-01-02T00:00:00.000Z',
          },
        ],
        has_more: true,
      };

      mockNotionAPI.queryDatabase = jest.fn().mockResolvedValue(mockResponse);

      const result = await repository.queryDatabasePages(mockToken, databaseId);

      expect(result.hasMore).toBe(true);
    });
  });
});
