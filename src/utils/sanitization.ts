/**
 * サニタイゼーションユーティリティ
 * ユーザー入力や外部データを安全に処理するための関数群
 */

/**
 * HTMLエスケープ関数
 * React Nativeでは基本的に不要だが、WebView使用時や将来の拡張に備えて実装
 * @param str エスケープする文字列
 * @returns エスケープされた文字列
 */
export function escapeHtml(str: string): string {
  if (typeof str !== 'string') {
    return String(str);
  }

  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return str.replace(/[&<>"']/g, (match) => htmlEscapes[match]);
}

/**
 * URLエンコード関数
 * @param str エンコードする文字列
 * @returns エンコードされた文字列
 */
export function encodeUrl(str: string): string {
  if (typeof str !== 'string') {
    return String(str);
  }
  return encodeURIComponent(str);
}

/**
 * URLデコード関数
 * @param str デコードする文字列
 * @returns デコードされた文字列
 */
export function decodeUrl(str: string): string {
  if (typeof str !== 'string') {
    return String(str);
  }
  try {
    return decodeURIComponent(str);
  } catch (error) {
    // デコードに失敗した場合は元の文字列を返す
    return str;
  }
}

/**
 * 特殊文字のサニタイゼーション
 * 制御文字や危険な文字を除去またはエスケープ
 * @param str サニタイズする文字列
 * @param allowNewlines 改行を許可するか（デフォルト: false）
 * @returns サニタイズされた文字列
 */
export function sanitizeString(str: string, allowNewlines: boolean = false): string {
  if (typeof str !== 'string') {
    return String(str);
  }

  // 制御文字を除去（改行はオプションで許可）
  let sanitized = str.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

  if (!allowNewlines) {
    sanitized = sanitized.replace(/[\r\n]/g, '');
  }

  // 先頭・末尾の空白を削除
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * 文字列長制限関数
 * @param str 制限する文字列
 * @param maxLength 最大長
 * @param ellipsis 省略記号（デフォルト: '...'）
 * @returns 制限された文字列
 */
export function limitStringLength(str: string, maxLength: number, ellipsis: string = '...'): string {
  if (typeof str !== 'string') {
    return String(str);
  }

  if (str.length <= maxLength) {
    return str;
  }

  return str.slice(0, maxLength - ellipsis.length) + ellipsis;
}

/**
 * 正規表現パターン検証関数
 * @param str 検証する文字列
 * @param pattern 正規表現パターン
 * @returns パターンに一致するかどうか
 */
export function matchesPattern(str: string, pattern: RegExp | string): boolean {
  if (typeof str !== 'string') {
    return false;
  }

  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
  return regex.test(str);
}

/**
 * 数値文字列のサニタイゼーション
 * 数値として有効な文字のみを抽出
 * @param str サニタイズする文字列
 * @param allowDecimal 小数点を許可するか（デフォルト: true）
 * @param allowNegative 負の値を許可するか（デフォルト: false）
 * @returns サニタイズされた数値文字列
 */
export function sanitizeNumberString(
  str: string,
  allowDecimal: boolean = true,
  allowNegative: boolean = false,
): string {
  if (typeof str !== 'string') {
    return '';
  }

  let sanitized = str.trim();

  // 負の値を許可する場合、先頭のマイナス記号を許可
  const hasNegative = sanitized.startsWith('-');
  if (hasNegative && allowNegative) {
    // マイナス記号を除いて数値部分をサニタイズ
    const numericPart = sanitized.slice(1).replace(/[^0-9.]/g, '');
    sanitized = '-' + numericPart;
  } else if (hasNegative && !allowNegative) {
    // 負の値を許可しない場合はマイナス記号を除去
    sanitized = sanitized.replace(/[^0-9.]/g, '');
  } else {
    // マイナス記号がない場合は通常通り
    sanitized = sanitized.replace(/[^0-9.]/g, '');
  }

  // 小数点を許可しない場合、小数点を除去
  if (!allowDecimal) {
    sanitized = sanitized.replace(/\./g, '');
  } else {
    // 小数点が複数ある場合は最初の1つだけを残す
    // 負の値の場合はマイナス記号を考慮
    const isNegative = sanitized.startsWith('-');
    const numericPart = isNegative ? sanitized.slice(1) : sanitized;
    const parts = numericPart.split('.');
    if (parts.length > 2) {
      const fixedNumeric = parts[0] + '.' + parts.slice(1).join('');
      sanitized = isNegative ? '-' + fixedNumeric : fixedNumeric;
    }
  }

  return sanitized;
}

/**
 * UUID形式のサニタイゼーション
 * UUID形式の文字列を正規化（ハイフンの除去、小文字化）
 * @param str サニタイズする文字列
 * @returns 正規化されたUUID文字列（ハイフンなし）
 */
export function sanitizeUuid(str: string): string {
  if (typeof str !== 'string') {
    return '';
  }

  // 36文字のハイフンありUUID形式を許可
  const uuidPatternWithHyphens = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidPatternWithHyphens.test(str)) {
    // ハイフンを除去して小文字化
    return str.replace(/-/g, '').toLowerCase();
  }

  // 32文字のハイフンなしUUID形式を許可
  const normalized = str.replace(/-/g, '').toLowerCase();
  if (/^[0-9a-f]{32}$/.test(normalized)) {
    return normalized;
  }

  return '';
}

/**
 * プロパティ名のサニタイゼーション
 * Notionプロパティ名として使用可能な文字のみを許可
 * @param str サニタイズする文字列
 * @returns サニタイズされたプロパティ名
 */
export function sanitizePropertyName(str: string): string {
  if (typeof str !== 'string') {
    return '';
  }

  // 先頭・末尾の空白を削除
  let sanitized = str.trim();

  // 制御文字を除去
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

  // 最大長制限（Notionのプロパティ名は最大100文字程度）
  sanitized = limitStringLength(sanitized, 100, '');

  return sanitized;
}

