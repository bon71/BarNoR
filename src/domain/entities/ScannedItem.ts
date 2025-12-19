/**
 * ScannedItem エンティティ
 * スキャンされたアイテム（書籍または商品）を表現
 */

import {formatPrice} from '@/utils/formatters';

export enum ItemType {
  BOOK = 'book',
  PRODUCT = 'product',
}

export interface ScannedItemProps {
  barcode: string;
  type: ItemType;
  title: string;
  author?: string;
  publisher?: string;
  maker?: string;
  price?: number;
  imageUrl?: string;
  scannedAt?: Date;
}

export class ScannedItem {
  public readonly barcode: string;
  public readonly type: ItemType;
  public readonly title: string;
  public readonly author?: string;
  public readonly publisher?: string;
  public readonly maker?: string;
  public readonly price?: number;
  public readonly imageUrl?: string;
  public readonly scannedAt: Date;

  constructor(props: ScannedItemProps) {
    // バリデーション
    this.validateBarcode(props.barcode);
    this.validateTitle(props.title);
    if (props.price !== undefined) {
      this.validatePrice(props.price);
    }

    // プロパティの設定
    this.barcode = props.barcode;
    this.type = props.type;
    this.title = props.title;
    this.author = props.author;
    this.publisher = props.publisher;
    this.maker = props.maker;
    this.price = props.price;
    this.imageUrl = props.imageUrl;
    this.scannedAt = props.scannedAt || new Date();
  }

  /**
   * バーコードのバリデーション
   * - 長さ: 8-14桁
   * - 文字: 数字のみ
   */
  private validateBarcode(barcode: string): void {
    if (barcode.length < 8 || barcode.length > 14) {
      throw new Error('Invalid barcode format: barcode must be 8-14 digits');
    }

    if (!/^\d+$/.test(barcode)) {
      throw new Error(
        'Invalid barcode format: barcode must contain only digits',
      );
    }
  }

  /**
   * タイトルのバリデーション
   */
  private validateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new Error('Title is required');
    }
  }

  /**
   * 価格のバリデーション
   */
  private validatePrice(price: number): void {
    if (price < 0) {
      throw new Error('Price must be non-negative');
    }
  }

  /**
   * 書籍かどうかを判定
   */
  public isBook(): boolean {
    return this.type === ItemType.BOOK;
  }

  /**
   * 商品かどうかを判定
   */
  public isProduct(): boolean {
    return this.type === ItemType.PRODUCT;
  }

  /**
   * 表示用の情報を取得
   */
  public getDisplayInfo(): string {
    const parts: string[] = [this.title];

    if (this.isBook()) {
      if (this.author) {
        parts.push(`著: ${this.author}`);
      }
      if (this.publisher) {
        parts.push(`出版: ${this.publisher}`);
      }
    } else {
      if (this.maker) {
        parts.push(`メーカー: ${this.maker}`);
      }
    }

    if (this.price !== undefined) {
      parts.push(formatPrice(this.price));
    }

    return parts.join(' | ');
  }

  /**
   * エンティティを比較
   */
  public equals(other: ScannedItem): boolean {
    return this.barcode === other.barcode && this.type === other.type;
  }
}
