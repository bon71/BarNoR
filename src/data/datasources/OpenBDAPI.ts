/**
 * OpenBD API クライアント
 * 書籍情報を取得するための外部API
 */

import {env} from '@/config/env';
import {apiFetch} from '@/utils/apiClient';
import {withRetryAndTimeout} from '@/utils/retry';
import {USER_FRIENDLY_ERRORS} from '@/utils/errorMessages';

export interface OpenBDResponse {
  onix?: {
    DescriptiveDetail?: {
      TitleDetail?: {
        TitleElement?: Array<{
          TitleText?: {
            content?: string;
          };
        }>;
      };
      Contributor?: Array<{
        PersonName?: {
          content?: string;
        };
      }>;
    };
    PublishingDetail?: {
      Imprint?: {
        ImprintName?: string;
      };
    };
    ProductSupply?: {
      SupplyDetail?: {
        Price?: Array<{
          PriceType?: string;
          CurrencyCode?: string;
          PriceAmount?: string;
        }>;
      };
    };
  };
  summary?: {
    isbn?: string;
    title?: string;
    author?: string;
    publisher?: string;
    pubdate?: string;
    cover?: string;
    price?: string;
  };
}

export class OpenBDAPI {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || env.openBdApiUrl;
  }

  /**
   * ISBNから書籍情報を取得
   * タイムアウトとリトライ機能付き
   * @param isbn - ISBNコード
   * @returns 書籍情報、見つからない場合はnull
   */
  async fetchByISBN(isbn: string): Promise<OpenBDResponse | null> {
    try {
      const response = await withRetryAndTimeout(
        async () => {
          return await apiFetch(`${this.baseUrl}/get?isbn=${isbn}`);
        },
        {
          maxRetries: 3,
          delayMs: 1000,
          backoffMultiplier: 2,
        },
        5000, // 5秒タイムアウト
      );

      if (!response.ok) {
        throw new Error(`OpenBD API error: ${response.status}`);
      }

      const data = await response.json() as (OpenBDResponse | null)[];

      // OpenBDは配列で返すが、単一ISBNの場合は最初の要素を取得
      return data[0] || null;
    } catch (error) {
      console.error('Failed to fetch from OpenBD:', error);
      // タイムアウトエラーの場合はユーザーフレンドリーなメッセージに変換
      if (error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('timed out')) {
          throw new Error(USER_FRIENDLY_ERRORS.OPENBD_TIMEOUT);
        }
        if (error.message.includes('404') || error.message.includes('not found')) {
          throw new Error(USER_FRIENDLY_ERRORS.OPENBD_NOT_FOUND);
        }
      }
      throw error;
    }
  }
}
