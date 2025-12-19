/**
 * テーマストア - ダークモード状態管理
 */

import {create} from 'zustand';
import {Appearance} from 'react-native';
import {MMKVStorage} from '@/data/datasources/MMKVStorage';

export type ThemeMode = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  initializeMode: () => Promise<void>;
}

const THEME_STORAGE_KEY = 'app_theme_mode';

/**
 * テーマストア
 */
export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'light',

  setMode: (mode: ThemeMode) => {
    set({mode});
    // ストレージに保存
    try {
      MMKVStorage.getInstance().setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Failed to save theme mode:', error);
    }
  },

  toggleMode: () => {
    const currentMode = get().mode;
    const newMode: ThemeMode = currentMode === 'light' ? 'dark' : 'light';
    get().setMode(newMode);
  },

  initializeMode: async () => {
    try {
      const savedMode = MMKVStorage.getInstance().getItem(THEME_STORAGE_KEY) as ThemeMode | null;
      if (savedMode === 'light' || savedMode === 'dark') {
        // 保存されている設定を優先
        set({mode: savedMode});
      } else {
        // 保存されていない場合はシステム設定を反映
        const systemColorScheme = Appearance.getColorScheme();
        const mode: ThemeMode = systemColorScheme === 'dark' ? 'dark' : 'light';
        set({mode});
      }
    } catch (error) {
      console.error('Failed to load theme mode:', error);
      // エラー時はシステム設定にフォールバック
      const systemColorScheme = Appearance.getColorScheme();
      const mode: ThemeMode = systemColorScheme === 'dark' ? 'dark' : 'light';
      set({mode});
    }
  },
}));
