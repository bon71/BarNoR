/**
 * useTheme hook テスト
 */

import {renderHook} from '@testing-library/react-native';
import {useTheme} from '@/presentation/hooks/useTheme';
import {useThemeStore} from '@/presentation/stores/useThemeStore';
import {lightColors, darkColors} from '@/config/theme';

jest.mock('@/presentation/stores/useThemeStore');

const mockUseThemeStore = useThemeStore as jest.MockedFunction<
  typeof useThemeStore
>;

describe('useTheme', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ライトモードの場合、lightColorsを返す', () => {
    mockUseThemeStore.mockReturnValue('light' as any);

    const {result} = renderHook(() => useTheme());

    expect(result.current.mode).toBe('light');
    expect(result.current.colors).toBeDefined();
    // lightColorsが返されることを確認（具体的な値はtheme.tsに依存）
    expect(result.current.colors.background).toBe(lightColors.background);
    expect(result.current.colors.textPrimary).toBe(lightColors.textPrimary);
  });

  it('ダークモードの場合、darkColorsを返す', () => {
    mockUseThemeStore.mockReturnValue('dark' as any);

    const {result} = renderHook(() => useTheme());

    expect(result.current.mode).toBe('dark');
    expect(result.current.colors).toBeDefined();
    // darkColorsが返されることを確認（具体的な値はtheme.tsに依存）
    expect(result.current.colors.background).toBe(darkColors.background);
    expect(result.current.colors.textPrimary).toBe(darkColors.textPrimary);
  });

  it('spacing、borderRadius、typography、shadowsが返される', () => {
    mockUseThemeStore.mockReturnValue('light' as any);

    const {result} = renderHook(() => useTheme());

    expect(result.current.spacing).toBeDefined();
    expect(result.current.borderRadius).toBeDefined();
    expect(result.current.typography).toBeDefined();
    expect(result.current.shadows).toBeDefined();
  });

  it('modeが変更された場合、colorsが再計算される', () => {
    mockUseThemeStore.mockReturnValue('light' as any);

    const {result, rerender} = renderHook(() => useTheme());

    const lightColors = result.current.colors;

    mockUseThemeStore.mockReturnValue('dark' as any);
    rerender({});

    const darkColors = result.current.colors;
    // colorsが変更されていることを確認（useMemoの動作確認）
    expect(darkColors).not.toBe(lightColors);
  });
});

