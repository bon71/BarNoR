/**
 * カスタム翻訳フック
 * react-i18nextのuseTranslationをラップし、型安全な翻訳キーを提供
 */

import {useTranslation as useI18nTranslation} from 'react-i18next';

/**
 * 翻訳キーの型定義
 */
export type TranslationKey =
  | `common:${string}`
  | `navigation:${string}`
  | `settings:${string}`
  | `scan:${string}`
  | `scanResult:${string}`
  | `errors:${string}`
  | `alerts:${string}`;

/**
 * useTranslationフックのラッパー
 * 型安全な翻訳キーを使用
 */
export function useTranslation() {
  const {t, i18n} = useI18nTranslation();

  return {
    t: (key: TranslationKey, options?: Record<string, string | number>) => {
      // 'scan:title' を 'scan.title' に変換
      const convertedKey = key.replace(':', '.');
      return t(convertedKey, options);
    },
    i18n,
    currentLanguage: i18n.language,
  };
}

