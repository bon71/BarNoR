/**
 * BookInfoRepository実装
 * OpenBD APIを使用して書籍情報を取得する
 */

import {
  IBookInfoRepository,
  BookInfoData,
} from '@/domain/repositories/IBookInfoRepository';
import {ScannedItem, ItemType} from '@/domain/entities/ScannedItem';
import {OpenBDAPI, OpenBDResponse} from '@/data/datasources/OpenBDAPI';

export class BookInfoRepository implements IBookInfoRepository {
  constructor(private readonly openBDAPI: OpenBDAPI) {}

  /**
   * ISBNから書籍情報を取得
   * @param isbn - ISBNコード
   * @returns 書籍情報、見つからない場合はnull
   */
  async fetchByISBN(isbn: string): Promise<BookInfoData | null> {
    const response = await this.openBDAPI.fetchByISBN(isbn);

    if (!response) {
      return null;
    }

    return this.convertToBookInfoData(response);
  }

  /**
   * BookInfoDataをScannedItemに変換
   * @param data - 書籍情報
   * @param barcode - バーコード
   * @returns スキャンされたアイテム
   */
  toScannedItem(data: BookInfoData, barcode: string): ScannedItem {
    return new ScannedItem({
      barcode,
      type: ItemType.BOOK,
      title: data.title,
      author: data.author,
      publisher: data.publisher,
      price: data.price,
      imageUrl: data.coverUrl,
      scannedAt: new Date(),
    });
  }

  /**
   * OpenBDResponseをBookInfoDataに変換
   * @param response - OpenBD APIのレスポンス
   * @returns 書籍情報
   */
  private convertToBookInfoData(response: OpenBDResponse): BookInfoData {
    // summary形式を優先的に使用
    const summary = response.summary;

    if (!summary) {
      // summaryがない場合はonixから情報を抽出
      return this.extractFromOnix(response);
    }

    // priceを数値に変換（summary.priceがない場合はonixから取得）
    let price: number | undefined;
    if (summary.price) {
      const parsedPrice = parseInt(summary.price, 10);
      price = !isNaN(parsedPrice) ? parsedPrice : undefined;
    } else {
      // summary.priceがない場合はonixから価格を取得
      price = this.extractPriceFromOnix(response);
    }

    return {
      isbn: summary.isbn || '',
      title: summary.title || '',
      author: summary.author,
      publisher: summary.publisher,
      price,
      coverUrl: summary.cover,
      publishedDate: summary.pubdate,
    };
  }

  /**
   * ONIX形式から書籍情報を抽出
   * @param response - OpenBD APIのレスポンス
   * @returns 書籍情報
   */
  private extractFromOnix(response: OpenBDResponse): BookInfoData {
    const onix = response.onix;
    const descriptive = onix?.DescriptiveDetail;
    const publishing = onix?.PublishingDetail;

    // タイトル取得
    const titleElement = descriptive?.TitleDetail?.TitleElement?.[0];
    const title = titleElement?.TitleText?.content || '';

    // 著者取得
    const contributor = descriptive?.Contributor?.[0];
    const author = contributor?.PersonName?.content;

    // 出版社取得
    const publisher = publishing?.Imprint?.ImprintName;

    // 価格取得
    const price = this.extractPriceFromOnix(response);

    return {
      isbn: '',
      title,
      author,
      publisher,
      price,
    };
  }

  /**
   * ONIX形式から価格を抽出
   * @param response - OpenBD APIのレスポンス
   * @returns 価格（数値）、見つからない場合はundefined
   */
  private extractPriceFromOnix(response: OpenBDResponse): number | undefined {
    const onix = response.onix;
    const supplyDetail = onix?.ProductSupply?.SupplyDetail;
    const prices = supplyDetail?.Price;

    if (!prices || prices.length === 0) {
      return undefined;
    }

    // PriceType "01" (RRP - Recommended Retail Price) を優先的に使用
    // なければ最初の価格を使用
    const price = prices.find(p => p.PriceType === '01') || prices[0];
    const priceAmount = price?.PriceAmount;

    if (!priceAmount) {
      return undefined;
    }

    const parsedPrice = parseInt(priceAmount, 10);
    return !isNaN(parsedPrice) ? parsedPrice : undefined;
  }
}
