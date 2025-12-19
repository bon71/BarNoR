/**
 * FetchBookInfoUseCase のテスト
 */

import {FetchBookInfoUseCase} from '@/domain/usecases/FetchBookInfoUseCase';
import {IBookInfoRepository} from '@/domain/repositories/IBookInfoRepository';
import {ScannedItem, ItemType} from '@/domain/entities/ScannedItem';

describe('FetchBookInfoUseCase', () => {
  let mockRepository: jest.Mocked<IBookInfoRepository>;
  let useCase: FetchBookInfoUseCase;

  beforeEach(() => {
    mockRepository = {
      fetchByISBN: jest.fn(),
      toScannedItem: jest.fn(),
    } as any;
    useCase = new FetchBookInfoUseCase(mockRepository);
  });

  describe('execute()', () => {
    test('書籍情報を正常に取得できる', async () => {
      const mockBookInfo = {
        isbn: '9784798121963',
        title: 'ドメイン駆動設計',
        author: 'エリック・エヴァンス',
        publisher: '翔泳社',
        price: 5060,
        coverUrl: 'https://example.com/cover.jpg',
      };

      const expectedItem = new ScannedItem({
        barcode: '9784798121963',
        type: ItemType.BOOK,
        title: 'ドメイン駆動設計',
        author: 'エリック・エヴァンス',
        publisher: '翔泳社',
        price: 5060,
        imageUrl: 'https://example.com/cover.jpg',
      });

      mockRepository.fetchByISBN.mockResolvedValue(mockBookInfo);
      mockRepository.toScannedItem.mockReturnValue(expectedItem);

      const result = await useCase.execute('9784798121963');

      expect(result).toEqual(expectedItem);
      expect(mockRepository.fetchByISBN).toHaveBeenCalledWith('9784798121963');
      expect(mockRepository.toScannedItem).toHaveBeenCalledWith(
        mockBookInfo,
        '9784798121963',
      );
    });

    test('書籍が見つからない場合はnullを返す（ISBNを正規化）', async () => {
      mockRepository.fetchByISBN.mockResolvedValue(null);

      const result = await useCase.execute('invalid-isbn');

      expect(result).toBeNull();
      expect(mockRepository.fetchByISBN).toHaveBeenCalledWith('');
      expect(mockRepository.toScannedItem).not.toHaveBeenCalled();
    });

    test('ISBNが無効な場合はエラーをスローする', async () => {
      await expect(useCase.execute('')).rejects.toThrow('ISBN is required');
      expect(mockRepository.fetchByISBN).not.toHaveBeenCalled();
    });

    test('リポジトリでエラーが発生した場合は伝播する', async () => {
      const error = new Error('API Error');
      mockRepository.fetchByISBN.mockRejectedValue(error);

      await expect(useCase.execute('9784798121963')).rejects.toThrow(
        'API Error',
      );
    });

    test('ハイフン付きISBNを正規化して問い合わせる', async () => {
      const mockBookInfo = {
        isbn: '9784798121963',
        title: 'DDD',
      } as any;

      const expectedItem = new ScannedItem({
        barcode: '9784798121963',
        type: ItemType.BOOK,
        title: 'DDD',
      });

      mockRepository.fetchByISBN.mockResolvedValue(mockBookInfo);
      mockRepository.toScannedItem.mockReturnValue(expectedItem);

      const result = await useCase.execute('978-4798-121963');

      expect(mockRepository.fetchByISBN).toHaveBeenCalledWith('9784798121963');
      expect(mockRepository.toScannedItem).toHaveBeenCalledWith(
        mockBookInfo,
        '9784798121963',
      );
      expect(result).toEqual(expectedItem);
    });
  });
});
