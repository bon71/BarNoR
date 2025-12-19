/**
 * OpenBDAPIのテスト
 */

import {OpenBDAPI, OpenBDResponse} from '@/data/datasources/OpenBDAPI';

// fetchのモック
global.fetch = jest.fn();

describe('OpenBDAPI', () => {
  let api: OpenBDAPI;

  beforeEach(() => {
    jest.clearAllMocks();
    api = new OpenBDAPI('https://api.openbd.jp/v1');
  });

  describe('fetchByISBN', () => {
    it('ISBNから書籍情報を取得できる', async () => {
      // Arrange
      const isbn = '9784062938426';
      const mockResponse: OpenBDResponse[] = [
        {
          summary: {
            isbn: '9784062938426',
            title: 'サピエンス全史',
            author: 'ユヴァル・ノア・ハラリ',
            publisher: '河出書房新社',
          },
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      // Act
      const result = await api.fetchByISBN(isbn);

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openbd.jp/v1/get?isbn=9784062938426',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Request-ID': expect.any(String),
            'X-Request-Timestamp': expect.any(String),
          }),
        }),
      );
      expect(result).toEqual(mockResponse[0]);
    });

    it('書籍が見つからない場合はnullを返す', async () => {
      // Arrange
      const isbn = '9999999999999';
      const mockResponse: (OpenBDResponse | null)[] = [null];

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      // Act
      const result = await api.fetchByISBN(isbn);

      // Assert
      expect(result).toBeNull();
    });

    it('APIレスポンスが空配列の場合はnullを返す', async () => {
      // Arrange
      const isbn = '9999999999999';
      const mockResponse: (OpenBDResponse | null)[] = [];

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      // Act
      const result = await api.fetchByISBN(isbn);

      // Assert
      expect(result).toBeNull();
    });

    it('APIエラー時はエラーをスローする', async () => {
      // Arrange
      const isbn = '9784062938426';

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      // Act & Assert
      await expect(api.fetchByISBN(isbn)).rejects.toThrow(
        'OpenBD API error: 500',
      );
    });

    it('ネットワークエラー時はエラーをスローする', async () => {
      // Arrange
      const isbn = '9784062938426';
      const error = new Error('Network error');

      (global.fetch as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(api.fetchByISBN(isbn)).rejects.toThrow('Network error');
    }, 20000); // タイムアウトを20秒に延長

    it('デフォルトbaseUrlを使用できる', async () => {
      // Arrange
      const apiWithDefaultUrl = new OpenBDAPI();
      const isbn = '9784062938426';
      const mockResponse: OpenBDResponse[] = [
        {
          summary: {
            isbn: '9784062938426',
            title: 'サピエンス全史',
          },
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      // Act
      await apiWithDefaultUrl.fetchByISBN(isbn);

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/get?isbn=9784062938426'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Request-ID': expect.any(String),
            'X-Request-Timestamp': expect.any(String),
          }),
        }),
      );
    });
  });
});
