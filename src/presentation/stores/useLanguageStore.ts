/**
 * 言語設定ストア
 * MMKVで言語設定を永続化
 */

import {create} from 'zustand';
import {MMKVStorage} from '@/data/datasources/MMKVStorage';
import {getEncryptionKeySync} from '@/infrastructure/security/EncryptionKeyManager';

export type Language = 'ja' | 'en';

const LANGUAGE_STORAGE_KEY = 'app_language';
const DEFAULT_LANGUAGE: Language = 'ja';

// MMKVストレージのインスタンス
// テストでモックできるようにエクスポート
// 暗号化キーは同期的に取得（後方互換性のため）
export const storage = new MMKVStorage('default', getEncryptionKeySync());

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
  initializeLanguage: () => Promise<void>;
}

/**
 * 保存された言語設定を読み込む
 */
function loadSavedLanguage(): Language {
  try {
    const saved = storage.get(LANGUAGE_STORAGE_KEY);
    if (saved === 'ja' || saved === 'en') {
      return saved;
    }
  } catch (error) {
    console.error('[useLanguageStore] Failed to load language:', error);
  }
  return DEFAULT_LANGUAGE;
}

/**
 * 言語設定を保存
 */
function saveLanguage(language: Language): void {
  try {
    storage.set(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.error('[useLanguageStore] Failed to save language:', error);
  }
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: DEFAULT_LANGUAGE,

  setLanguage: (language: Language) => {
    set({language});
    saveLanguage(language);
  },

  initializeLanguage: async () => {
    const savedLanguage = loadSavedLanguage();
    set({language: savedLanguage});
  },
}));

