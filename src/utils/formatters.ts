/**
 * フォーマッター
 * 日付・数値（価格等）のロケール対応フォーマット
 */

import {format} from 'date-fns';
import {ja, enUS} from 'date-fns/locale';
import i18n from 'i18next';

/**
 * 日付をフォーマット
 * @param date フォーマットする日付
 * @param formatStr フォーマット文字列（デフォルト: 'PPP' = "January 15, 2025" または "2025年1月15日"）
 * @returns フォーマットされた日付文字列
 */
export function formatDate(date: Date, formatStr: string = 'PPP'): string {
  const locale = i18n.language === 'ja' ? ja : enUS;
  return format(date, formatStr, {locale});
}

/**
 * 価格をフォーマット
 * @param amount 金額
 * @param currency 通貨コード（デフォルト: 'JPY'）
 * @returns フォーマットされた価格文字列
 */
export function formatPrice(amount: number, currency: string = 'JPY'): string {
  const locale = i18n.language === 'ja' ? 'ja-JP' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

