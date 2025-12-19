/**
 * 書籍情報取得ユースケース
 * ISBNから書籍情報を取得する
 */

import {IBookInfoRepository} from '@/domain/repositories/IBookInfoRepository';
import {ScannedItem} from '@/domain/entities/ScannedItem';

export class FetchBookInfoUseCase {
  constructor(private readonly repository: IBookInfoRepository) {}

  /**
   * ISBNから書籍情報を取得
   * @param isbn - ISBNコード
   * @returns ScannedItemまたはnull
   */
  async execute(isbn: string): Promise<ScannedItem | null> {
    // ISBNのバリデーション
    if (!isbn || isbn.trim().length === 0) {
      throw new Error('ISBN is required');
    }

    // ISBNの正規化（ハイフンや空白などを除去）
    const normalizedIsbn = isbn.replace(/[^0-9Xx]/g, '');

    // リポジトリから書籍情報を取得
    const bookInfo = await this.repository.fetchByISBN(normalizedIsbn);

    if (!bookInfo) {
      return null;
    }

    // ScannedItemに変換して返す
    return this.repository.toScannedItem(bookInfo, normalizedIsbn);
  }
}
