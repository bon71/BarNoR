/**
 * i18n設定
 * react-i18nextの初期化設定
 */

import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import * as RNLocalize from 'react-native-localize';
import {useLanguageStore} from '@/presentation/stores/useLanguageStore';

// 翻訳リソースをインポート
import jaTranslations from '@/locales/ja.json';
import enTranslations from '@/locales/en.json';

// サポートする言語
export const SUPPORTED_LANGUAGES = ['ja', 'en'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

/**
 * デバイスの言語設定から適切な言語を取得
 */
function getDeviceLanguage(): SupportedLanguage {
  const deviceLanguages = RNLocalize.getLocales();
  const deviceLanguageCode = deviceLanguages[0]?.languageCode || 'ja';

  // サポートされている言語かチェック
  if (SUPPORTED_LANGUAGES.includes(deviceLanguageCode as SupportedLanguage)) {
    return deviceLanguageCode as SupportedLanguage;
  }

  // デフォルトは日本語
  return 'ja';
}

/**
 * i18nを初期化
 */
export function initI18n(): void {
  // 言語ストアから現在の言語を取得（初期化済みの場合）
  const languageStore = useLanguageStore.getState();
  const currentLanguage = languageStore.language || getDeviceLanguage();

  i18n
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v4', // React Native用の互換性設定
      resources: {
        ja: {
          translation: jaTranslations,
        },
        en: {
          translation: enTranslations,
        },
      },
      lng: currentLanguage,
      fallbackLng: 'ja',
      // キー区切り文字を設定（'scan.title'形式をサポート）
      keySeparator: '.',
      nsSeparator: false,
      interpolation: {
        escapeValue: false, // React Nativeでは不要
      },
      react: {
        useSuspense: false, // React NativeではSuspenseを使わない
      },
    });
}

/**
 * 言語を変更
 */
export function changeLanguage(language: SupportedLanguage): void {
  i18n.changeLanguage(language);
  useLanguageStore.getState().setLanguage(language);
}

// デフォルトエクスポート
export default i18n;

