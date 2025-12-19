/**
 * NotionAPIのテスト
 */

import {
  NotionAPI,
  NotionDatabaseResponse,
  NotionSearchResponse,
  NotionPageCreateResponse,
} from '@/data/datasources/NotionAPI';

// fetchのモック
global.fetch = jest.fn();

describe('NotionAPI', () => {
  let api: NotionAPI;
  const mockToken = 'secret_test_token';

  beforeEach(() => {
    jest.clearAllMocks();
    api = new NotionAPI('https://api.notion.com/v1', '2022-06-28');
  });

  describe('validateToken', () => {
    it('有効なトークンの場合はtrueを返す', async () => {
      // Arrange
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
      });

      // Act
      const result = await api.validateToken(mockToken);

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.notion.com/v1/users/me',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`,
            'Notion-Version': '2022-06-28',
          }),
        }),
      );
      expect(result).toBe(true);
    });

    it('無効なトークンの場合はfalseを返す', async () => {
      // Arrange
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
      });

      // Act
      const result = await api.validateToken(mockToken);

      // Assert
      expect(result).toBe(false);
    });

    it('ネットワークエラー時はfalseを返す', async () => {
      // Arrange
      (global.fetch as jest.Mock).mockRejectedValue(
        new Error('Network error'),
      );

      // Act
      const result = await api.validateToken(mockToken);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('searchDatabases', () => {
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
            properties: {},
          },
        ],
        has_more: false,
        next_cursor: null,
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      // Act
      const result = await api.searchDatabases(mockToken);

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.notion.com/v1/search',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`,
          }),
          body: expect.stringContaining('"object"'),
        }),
      );
      expect(result).toEqual(mockResponse);
    });

    it('APIエラー時はエラーをスローする', async () => {
      // Arrange
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({
          object: 'error',
          status: 401,
          code: 'unauthorized',
          message: 'Unauthorized',
        }),
      });

      // Act & Assert
      await expect(api.searchDatabases(mockToken)).rejects.toThrow(
        'Notion認証に失敗しました',
      );
    });
  });

  describe('getDatabase', () => {
    it('データベース情報を取得できる', async () => {
      // Arrange
      const databaseId = '12345678-1234-1234-1234-123456789012'; // Valid UUID format
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

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      // Act
      const result = await api.getDatabase(mockToken, databaseId);

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        `https://api.notion.com/v1/databases/${databaseId}`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`,
          }),
        }),
      );
      expect(result).toEqual(mockResponse);
    });

    it('APIエラー時はエラーをスローする', async () => {
      // Arrange
      const databaseId = '12345678-1234-1234-1234-123456789012'; // Valid UUID format
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({
          object: 'error',
          status: 404,
          code: 'object_not_found',
          message: 'Database not found',
        }),
      });

      // Act & Assert
      await expect(api.getDatabase(mockToken, databaseId)).rejects.toThrow(
        'データベースが見つかりません',
      );
    });
  });

  describe('createPage', () => {
    it('ページを作成できる', async () => {
      // Arrange
      const databaseId = '12345678-1234-1234-1234-123456789012'; // Valid UUID format
      const properties = {
        Name: {
          title: [
            {
              text: {
                content: 'Test Book',
              },
            },
          ],
        },
      };
      const mockResponse: NotionPageCreateResponse = {
        object: 'page',
        id: 'page-123',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      // Act
      const result = await api.createPage(mockToken, databaseId, properties);

      // Assert
      // databaseIdは正規化されてハイフンが削除されるため、正規化後の形式を期待
      const normalizedDatabaseId = databaseId.replace(/-/g, '').toLowerCase();
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.notion.com/v1/pages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`,
          }),
          body: expect.stringContaining(normalizedDatabaseId),
        }),
      );
      expect(result).toEqual(mockResponse);
    });

    it('APIエラー時はエラーをスローする', async () => {
      // Arrange
      const databaseId = '12345678-1234-1234-1234-123456789012'; // Valid UUID format
      const properties = {};
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({
          object: 'error',
          status: 400,
          code: 'validation_error',
          message: 'Invalid properties',
        }),
      });

      // Act & Assert
      await expect(
        api.createPage(mockToken, databaseId, properties),
      ).rejects.toThrow('Invalid properties');
    });
  });

  describe('getDataSource', () => {
    it('データソース詳細を取得できる', async () => {
      const dataSourceId = 'ds-123';
      const mockResponse = {
        object: 'data_source',
        id: dataSourceId,
        name: 'Test Data Source',
        properties: {
          Name: {
            id: 'title',
            type: 'title',
          },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await api.getDataSource(mockToken, dataSourceId);

      expect(global.fetch).toHaveBeenCalledWith(
        `https://api.notion.com/v1/data_sources/${dataSourceId}`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`,
          }),
        }),
      );
      expect(result).toEqual(mockResponse);
    });

    it('無効なデータソースIDの場合はエラーをスローする', async () => {
      await expect(api.getDataSource(mockToken, '')).rejects.toThrow(
        'Invalid data source ID',
      );
    });

    it('APIエラー時はエラーをスローする', async () => {
      const dataSourceId = 'ds-123';
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({
          object: 'error',
          status: 404,
          code: 'object_not_found',
          message: 'Data source not found',
        }),
      });

      await expect(api.getDataSource(mockToken, dataSourceId)).rejects.toThrow();
    });

    it('ネットワークエラー時はユーザーフレンドリーなメッセージをスローする', async () => {
      const dataSourceId = 'ds-123';
      (global.fetch as jest.Mock).mockRejectedValue(
        new Error('network error'),
      );

      await expect(api.getDataSource(mockToken, dataSourceId)).rejects.toThrow(
        'ネットワークエラーが発生しました',
      );
    });
  });

  describe('エラーハンドリング', () => {
    it('validateTokenでネットワークエラー時はユーザーフレンドリーなメッセージを返す', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(
        new Error('network error'),
      );

      const result = await api.validateToken(mockToken);

      expect(result).toBe(false);
    });

    it('searchDatabasesでネットワークエラー時はユーザーフレンドリーなメッセージをスローする', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(
        new Error('network error'),
      );

      await expect(api.searchDatabases(mockToken)).rejects.toThrow(
        'ネットワークエラーが発生しました',
      );
    });

    it('レート制限エラー時は適切なメッセージをスローする', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({
          object: 'error',
          status: 429,
          code: 'rate_limit',
          message: 'Rate limit exceeded',
        }),
      });

      await expect(api.searchDatabases(mockToken)).rejects.toThrow(
        'リクエストが多すぎます',
      );
    });
  });

  describe('queryDatabase', () => {
    it('データベースをクエリできる', async () => {
      const databaseId = '12345678-1234-1234-1234-123456789012'; // Valid UUID format
      const mockResponse = {
        results: [
          {
            object: 'page',
            id: 'page-1',
            created_time: '2024-01-01T00:00:00.000Z',
            last_edited_time: '2024-01-02T00:00:00.000Z',
            properties: {},
          },
        ],
        has_more: false,
        next_cursor: null,
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await api.queryDatabase(mockToken, databaseId);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/databases/12345678-1234-1234-1234-123456789012/query'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`,
          }),
        }),
      );
    });

    it('カスタムpageSizeを指定できる', async () => {
      const databaseId = '12345678-1234-1234-1234-123456789012'; // Valid UUID format
      const mockResponse = {
        results: [],
        has_more: false,
        next_cursor: null,
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await api.queryDatabase(mockToken, databaseId, 10);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.page_size).toBe(10);
    });

    it('無効なdatabaseIdの場合はエラーをスローする', async () => {
      await expect(api.queryDatabase(mockToken, '')).rejects.toThrow(
        'Invalid database ID',
      );
    });

    it('無効なdatabaseId（空白のみ）の場合はエラーをスローする', async () => {
      await expect(api.queryDatabase(mockToken, '   ')).rejects.toThrow(
        'Invalid database ID',
      );
    });

    it('baseUrlが空の場合はデフォルト値が使用される', async () => {
      // baseUrlが空文字列の場合、コンストラクタでデフォルト値（env.notionApiUrl）が使用される
      const apiWithEmptyUrl = new NotionAPI('', '2022-06-28');
      const mockResponse = {
        results: [],
        has_more: false,
        next_cursor: null,
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiWithEmptyUrl.queryDatabase(mockToken, '12345678-1234-1234-1234-123456789012');
      expect(result).toEqual(mockResponse);
    });

    it('baseUrlがnullの場合はデフォルト値が使用される', async () => {
      // baseUrlがnullの場合、コンストラクタでデフォルト値（env.notionApiUrl）が使用される
      const apiWithNullUrl = new NotionAPI(null as any, '2022-06-28');
      const mockResponse = {
        results: [],
        has_more: false,
        next_cursor: null,
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiWithNullUrl.queryDatabase(mockToken, '12345678-1234-1234-1234-123456789012');
      expect(result).toEqual(mockResponse);
    });

    it('無効なURL形式の場合はエラーをスローする', async () => {
      const apiWithInvalidUrl = new NotionAPI('invalid-url', '2022-06-28');
      await expect(
        apiWithInvalidUrl.queryDatabase(mockToken, '12345678-1234-1234-1234-123456789012'),
      ).rejects.toThrow('Invalid URL format');
    });

    it('APIエラー時はエラーをスローする', async () => {
      const databaseId = '12345678-1234-1234-1234-123456789012'; // Valid UUID format
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({
          object: 'error',
          status: 404,
          code: 'object_not_found',
          message: 'Database not found',
        }),
      });

      await expect(api.queryDatabase(mockToken, databaseId)).rejects.toThrow();
    });

    it('ネットワークエラー時はユーザーフレンドリーなメッセージをスローする', async () => {
      const databaseId = '12345678-1234-1234-1234-123456789012'; // Valid UUID format
      (global.fetch as jest.Mock).mockRejectedValue(
        new Error('network error'),
      );

      await expect(api.queryDatabase(mockToken, databaseId)).rejects.toThrow(
        'ネットワークエラーが発生しました',
      );
    });

    it('Invalid request URLエラー時は詳細なメッセージをスローする', async () => {
      const databaseId = '12345678-1234-1234-1234-123456789012'; // Valid UUID format
      (global.fetch as jest.Mock).mockRejectedValue(
        new Error('Invalid request URL'),
      );

      await expect(api.queryDatabase(mockToken, databaseId)).rejects.toThrow(
        'Invalid request URL: database ID may be invalid',
      );
    });

    it('baseUrlがスラッシュで終わる場合は正しく処理される', async () => {
      const apiWithTrailingSlash = new NotionAPI(
        'https://api.notion.com/v1/',
        '2022-06-28',
      );
      const databaseId = '12345678-1234-1234-1234-123456789012'; // Valid UUID format
      const mockResponse = {
        results: [],
        has_more: false,
        next_cursor: null,
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await apiWithTrailingSlash.queryDatabase(mockToken, databaseId);

      expect(global.fetch).toHaveBeenCalledWith(
        `https://api.notion.com/v1/databases/${databaseId}/query`,
        expect.any(Object),
      );
    });
  });
});
