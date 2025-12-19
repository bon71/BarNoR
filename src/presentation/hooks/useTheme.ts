/**
 * useTheme hook
 * テーマモード（ライト/ダーク）に応じた色パレットを返す
 */

import {useMemo} from 'react';
import {useThemeStore} from '@/presentation/stores/useThemeStore';
import {
  lightColors,
  darkColors,
  spacing,
  borderRadius,
  typography,
  shadows,
} from '@/config/theme';

export const useTheme = () => {
  const mode = useThemeStore(state => state.mode);

  const colors = useMemo(() => {
    return mode === 'dark' ? darkColors : lightColors;
  }, [mode]);

  return {
    colors,
    spacing,
    borderRadius,
    typography,
    shadows,
    mode,
  };
};
