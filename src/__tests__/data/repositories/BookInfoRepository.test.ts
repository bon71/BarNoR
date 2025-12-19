/**
 * BookInfoRepositoryのテスト
 */

import {BookInfoRepository} from '@/data/repositories/BookInfoRepository';
import {OpenBDAPI, OpenBDResponse} from '@/data/datasources/OpenBDAPI';
import {ItemType} from '@/domain/entities/ScannedItem';

// OpenBDAPIのモック
jest.mock('@/data/datasources/OpenBDAPI');

describe('BookInfoRepository', () => {
  let repository: BookInfoRepository;
  let mockOpenBDAPI: jest.Mocked<OpenBDAPI>;

  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();

    // OpenBDAPIのモックインスタンス作成
    mockOpenBDAPI = new OpenBDAPI() as jest.Mocked<OpenBDAPI>;
    repository = new BookInfoRepository(mockOpenBDAPI);
  });

  describe('fetchByISBN', () => {
    it('OpenBD APIから書籍情報を取得できる（summary形式）', async () => {
      // Arrange
      const isbn = '9784062938426';
      const mockResponse: OpenBDResponse = {
        summary: {
          isbn: '9784062938426',
          title: 'サピエンス全史',
          author: 'ユヴァル・ノア・ハラリ',
          publisher: '河出書房新社',
          pubdate: '20160930',
          cover: 'https://cover.openbd.jp/9784062938426.jpg',
          price: '1980',
        },
      };

      mockOpenBDAPI.fetchByISBN = jest.fn().mockResolvedValue(mockResponse);

      // Act
      const result = await repository.fetchByISBN(isbn);

      // Assert
      expect(mockOpenBDAPI.fetchByISBN).toHaveBeenCalledWith(isbn);
      expect(result).toEqual({
        isbn: '9784062938426',
        title: 'サピエンス全史',
        author: 'ユヴァル・ノア・ハラリ',
        publisher: '河出書房新社',
        price: 1980,
        coverUrl: 'https://cover.openbd.jp/9784062938426.jpg',
        publishedDate: '20160930',
      });
    });

    it('OpenBD APIから書籍情報を取得できる（onix形式）', async () => {
      // Arrange
      const isbn = '9784062938426';
      const mockResponse: OpenBDResponse = {
        onix: {
          DescriptiveDetail: {
            TitleDetail: {
              TitleElement: [
                {
                  TitleText: {
                    content: 'サピエンス全史',
                  },
                },
              ],
            },
            Contributor: [
              {
                PersonName: {
                  content: 'ユヴァル・ノア・ハラリ',
                },
              },
            ],
          },
        },
        summary: {
          isbn: '9784062938426',
          title: 'サピエンス全史',
          author: 'ユヴァル・ノア・ハラリ',
          publisher: '河出書房新社',
          pubdate: '20160930',
          cover: 'https://cover.openbd.jp/9784062938426.jpg',
        },
      };

      mockOpenBDAPI.fetchByISBN = jest.fn().mockResolvedValue(mockResponse);

      // Act
      const result = await repository.fetchByISBN(isbn);

      // Assert
      expect(result).toBeTruthy();
      expect(result?.title).toBe('サピエンス全史');
      expect(result?.author).toBe('ユヴァル・ノア・ハラリ');
    });

    it('書籍が見つからない場合はnullを返す', async () => {
      // Arrange
      const isbn = '9999999999999';
      mockOpenBDAPI.fetchByISBN = jest.fn().mockResolvedValue(null);

      // Act
      const result = await repository.fetchByISBN(isbn);

      // Assert
      expect(mockOpenBDAPI.fetchByISBN).toHaveBeenCalledWith(isbn);
      expect(result).toBeNull();
    });

    it('API呼び出しに失敗した場合はエラーをスローする', async () => {
      // Arrange
      const isbn = '9784062938426';
      const error = new Error('Network error');
      mockOpenBDAPI.fetchByISBN = jest.fn().mockRejectedValue(error);

      // Act & Assert
      await expect(repository.fetchByISBN(isbn)).rejects.toThrow('Network error');
    });

    it('priceが文字列の場合は数値に変換する', async () => {
      // Arrange
      const isbn = '9784062938426';
      const mockResponse: OpenBDResponse = {
        summary: {
          isbn: '9784062938426',
          title: 'サピエンス全史',
          price: '1980',
        },
      };

      mockOpenBDAPI.fetchByISBN = jest.fn().mockResolvedValue(mockResponse);

      // Act
      const result = await repository.fetchByISBN(isbn);

      // Assert
      expect(result?.price).toBe(1980);
      expect(typeof result?.price).toBe('number');
    });

    it('priceが不正な文字列の場合はundefinedを返す', async () => {
      // Arrange
      const isbn = '9784062938426';
      const mockResponse: OpenBDResponse = {
        summary: {
          isbn: '9784062938426',
          title: 'サピエンス全史',
          price: 'invalid',
        },
      };

      mockOpenBDAPI.fetchByISBN = jest.fn().mockResolvedValue(mockResponse);

      // Act
      const result = await repository.fetchByISBN(isbn);

      // Assert
      expect(result?.price).toBeUndefined();
    });

    it('summaryがない場合はonixから情報を抽出する', async () => {
      // Arrange
      const isbn = '9784062938426';
      const mockResponse: OpenBDResponse = {
        onix: {
          DescriptiveDetail: {
            TitleDetail: {
              TitleElement: [
                {
                  TitleText: {
                    content: 'サピエンス全史',
                  },
                },
              ],
            },
            Contributor: [
              {
                PersonName: {
                  content: 'ユヴァル・ノア・ハラリ',
                },
              },
            ],
          },
        },
      };

      mockOpenBDAPI.fetchByISBN = jest.fn().mockResolvedValue(mockResponse);

      // Act
      const result = await repository.fetchByISBN(isbn);

      // Assert
      expect(result).toEqual({
        isbn: '',
        title: 'サピエンス全史',
        author: 'ユヴァル・ノア・ハラリ',
      });
    });

    it('onixデータが不完全な場合は空文字を返す', async () => {
      // Arrange
      const isbn = '9784062938426';
      const mockResponse: OpenBDResponse = {
        onix: {},
      };

      mockOpenBDAPI.fetchByISBN = jest.fn().mockResolvedValue(mockResponse);

      // Act
      const result = await repository.fetchByISBN(isbn);

      // Assert
      expect(result).toEqual({
        isbn: '',
        title: '',
        author: undefined,
      });
    });
  });

  describe('toScannedItem', () => {
    it('BookInfoDataをScannedItemに変換できる', () => {
      // Arrange
      const bookInfo = {
        isbn: '9784062938426',
        title: 'サピエンス全史',
        author: 'ユヴァル・ノア・ハラリ',
        publisher: '河出書房新社',
        price: 1980,
        coverUrl: 'https://cover.openbd.jp/9784062938426.jpg',
        publishedDate: '20160930',
      };
      const barcode = '9784062938426';

      // Act
      const result = repository.toScannedItem(bookInfo, barcode);

      // Assert
      expect(result.barcode).toBe(barcode);
      expect(result.type).toBe(ItemType.BOOK);
      expect(result.title).toBe('サピエンス全史');
      expect(result.author).toBe('ユヴァル・ノア・ハラリ');
      expect(result.publisher).toBe('河出書房新社');
      expect(result.price).toBe(1980);
      expect(result.imageUrl).toBe('https://cover.openbd.jp/9784062938426.jpg');
      expect(result.isBook()).toBe(true);
    });

    it('最小限の情報でもScannedItemに変換できる', () => {
      // Arrange
      const bookInfo = {
        isbn: '9784062938426',
        title: 'サピエンス全史',
      };
      const barcode = '9784062938426';

      // Act
      const result = repository.toScannedItem(bookInfo, barcode);

      // Assert
      expect(result.barcode).toBe(barcode);
      expect(result.title).toBe('サピエンス全史');
      expect(result.author).toBeUndefined();
      expect(result.publisher).toBeUndefined();
      expect(result.price).toBeUndefined();
      expect(result.imageUrl).toBeUndefined();
    });
  });
});
