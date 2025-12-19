/**
 * XSS対策ユーティリティ
 * WebView使用時や将来の拡張に備えたXSS対策関数
 */

import {escapeHtml} from './sanitization';
import {isValidUrl} from './validation';

/**
 * HTMLコンテンツのサニタイゼーション
 * WebViewに表示するHTMLコンテンツを安全に処理
 * @param html HTMLコンテンツ
 * @returns サニタイズされたHTMLコンテンツ
 */
export function sanitizeHtml(html: string): string {
  if (typeof html !== 'string') {
    return '';
  }

  // HTMLエスケープ処理
  return escapeHtml(html);
}

/**
 * URL検証関数
 * リンククリック時に使用するURLを検証
 * @param url 検証するURL
 * @returns 有効なURLかどうか
 */
export function validateUrlForNavigation(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // URL形式の検証
  if (!isValidUrl(url)) {
    return false;
  }

  // javascript:やdata:などの危険なプロトコルをブロック
  const lowerUrl = url.toLowerCase().trim();
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  if (dangerousProtocols.some(protocol => lowerUrl.startsWith(protocol))) {
    return false;
  }

  return true;
}

/**
 * 安全な文字列表示ヘルパー
 * React NativeのTextコンポーネントで安全に表示するためのヘルパー
 * @param text 表示するテキスト
 * @returns 安全に表示可能なテキスト
 */
export function safeText(text: string | null | undefined): string {
  if (text === null || text === undefined) {
    return '';
  }

  if (typeof text !== 'string') {
    return String(text);
  }

  // React NativeのTextコンポーネントは自動的にエスケープ処理を行うため、
  // 基本的にはそのまま返す
  // ただし、制御文字などは除去
  return text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
}

