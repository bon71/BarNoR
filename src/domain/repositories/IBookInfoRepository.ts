/**
 * 書籍情報リポジトリのインターフェース
 * ドメイン層が外部APIに依存しないための抽象化
 */

import {ScannedItem} from '@/domain/entities/ScannedItem';

export interface BookInfoData {
  isbn: string;
  title: string;
  author?: string;
  publisher?: string;
  price?: number;
  coverUrl?: string;
  publishedDate?: string;
}

export interface IBookInfoRepository {
  /**
   * ISBNから書籍情報を取得
   * @param isbn - ISBNコード（13桁または10桁）
   * @returns 書籍情報、見つからない場合はnull
   */
  fetchByISBN(isbn: string): Promise<BookInfoData | null>;

  /**
   * 書籍情報をScannedItemに変換
   * @param data - 書籍情報
   * @param barcode - バーコード
   * @returns ScannedItemエンティティ
   */
  toScannedItem(data: BookInfoData, barcode: string): ScannedItem;
}
