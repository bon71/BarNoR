/**
 * 入力値検証ユーティリティ
 * 各種入力値の形式検証を行う関数群
 */

import {sanitizeUuid, sanitizeNumberString, sanitizePropertyName} from './sanitization';

/**
 * ISBN形式の検証
 * ISBN-10、ISBN-13、EAN-13をサポート
 * @param isbn 検証するISBN文字列
 * @returns 有効なISBNかどうか
 */
export function isValidIsbn(isbn: string): boolean {
  if (!isbn || typeof isbn !== 'string') {
    return false;
  }

  // ハイフンとスペースを除去
  const cleaned = isbn.replace(/[-\s]/g, '');

  // ISBN-10（10桁）
  if (cleaned.length === 10) {
    return /^[0-9]{9}[0-9X]$/i.test(cleaned);
  }

  // ISBN-13/EAN-13（13桁）
  if (cleaned.length === 13) {
    return /^[0-9]{13}$/.test(cleaned);
  }

  return false;
}

/**
 * ISBN形式の正規化
 * @param isbn 正規化するISBN文字列
 * @returns 正規化されたISBN文字列（ハイフンなし）
 */
export function normalizeIsbn(isbn: string): string {
  if (!isbn || typeof isbn !== 'string') {
    return '';
  }

  // ハイフンとスペースを除去して大文字化
  return isbn.replace(/[-\s]/g, '').toUpperCase();
}

/**
 * Database ID形式の検証
 * NotionのデータベースIDは32文字のハイフンなしUUIDまたは36文字のハイフンありUUID
 * @param databaseId 検証するDatabase ID文字列
 * @returns 有効なDatabase IDかどうか
 */
export function isValidDatabaseId(databaseId: string): boolean {
  if (!databaseId || typeof databaseId !== 'string') {
    return false;
  }

  const trimmed = databaseId.trim();

  // 32文字のハイフンなしUUID
  const uuidPatternWithoutHyphens = /^[0-9a-f]{32}$/i;
  if (uuidPatternWithoutHyphens.test(trimmed)) {
    return true;
  }

  // 36文字のハイフンありUUID
  const uuidPatternWithHyphens = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidPatternWithHyphens.test(trimmed)) {
    return true;
  }

  return false;
}

/**
 * Database IDの正規化
 * @param databaseId 正規化するDatabase ID文字列
 * @returns 正規化されたDatabase ID文字列（ハイフンなし、小文字）
 */
export function normalizeDatabaseId(databaseId: string): string {
  if (!databaseId || typeof databaseId !== 'string') {
    return '';
  }

  return sanitizeUuid(databaseId);
}

/**
 * Property Mapping名の検証
 * @param propertyName 検証するプロパティ名
 * @returns 有効なプロパティ名かどうか
 */
export function isValidPropertyName(propertyName: string): boolean {
  if (!propertyName || typeof propertyName !== 'string') {
    return false;
  }

  const trimmed = propertyName.trim();

  // 空文字列は無効
  if (trimmed.length === 0) {
    return false;
  }

  // 最大長チェック（100文字）
  if (trimmed.length > 100) {
    return false;
  }

  // 制御文字が含まれていないかチェック
  if (/[\x00-\x1F\x7F]/.test(trimmed)) {
    return false;
  }

  return true;
}

/**
 * Property Mapping名の正規化
 * @param propertyName 正規化するプロパティ名
 * @returns 正規化されたプロパティ名
 */
export function normalizePropertyName(propertyName: string): string {
  if (!propertyName || typeof propertyName !== 'string') {
    return '';
  }

  return sanitizePropertyName(propertyName);
}

/**
 * 数値入力の検証
 * @param value 検証する値（文字列または数値）
 * @param options 検証オプション
 * @returns 検証結果
 */
export interface NumberValidationOptions {
  min?: number;
  max?: number;
  allowDecimal?: boolean;
  allowNegative?: boolean;
  required?: boolean;
}

export function validateNumber(
  value: string | number | null | undefined,
  options: NumberValidationOptions = {},
): {isValid: boolean; error?: string; normalized?: number} {
  const {
    min,
    max,
    allowDecimal = true,
    allowNegative = false,
    required = false,
  } = options;

  // 必須チェック
  if (value === null || value === undefined || value === '') {
    if (required) {
      return {isValid: false, error: '数値が入力されていません'};
    }
    return {isValid: true};
  }

  // 文字列の場合は先に負の値チェック（サニタイズ前に）
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!allowNegative && trimmed.startsWith('-')) {
      return {isValid: false, error: '負の値は許可されていません'};
    }
  }

  // 文字列の場合はサニタイズ
  let sanitized: string;
  let num: number;
  if (typeof value === 'string') {
    sanitized = sanitizeNumberString(value, allowDecimal, allowNegative);
    // 数値に変換
    num = allowDecimal ? parseFloat(sanitized) : parseInt(sanitized, 10);
  } else {
    num = typeof value === 'number' ? value : parseFloat(String(value));
    // 数値の場合も負の値チェック
    if (!allowNegative && num < 0) {
      return {isValid: false, error: '負の値は許可されていません'};
    }
  }

  // NaNチェック
  if (isNaN(num)) {
    return {isValid: false, error: '有効な数値ではありません'};
  }

  // 最小値チェック
  if (min !== undefined && num < min) {
    return {isValid: false, error: `最小値は${min}です`};
  }

  // 最大値チェック
  if (max !== undefined && num > max) {
    return {isValid: false, error: `最大値は${max}です`};
  }

  return {isValid: true, normalized: num};
}

/**
 * Notion Token形式の検証
 * @param token 検証するToken文字列
 * @returns 有効なTokenかどうか
 */
export function isValidNotionToken(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }

  const trimmed = token.trim();

  // Notion Integration Tokenは通常 "secret_" または "ntn_" で始まる
  if (!trimmed.startsWith('secret_') && !trimmed.startsWith('ntn_')) {
    return false;
  }

  // 最小長チェック（プレフィックス + 最低限の長さ）
  // secret_ は7文字、ntn_ は4文字なので、最低でも15文字程度は必要
  if (trimmed.length < 15) {
    return false;
  }

  return true;
}

/**
 * URL形式の検証
 * @param url 検証するURL文字列
 * @returns 有効なURLかどうか
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const parsed = new URL(url);
    // httpまたはhttpsのみを許可
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

