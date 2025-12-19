/**
 * useThemeStore テスト
 */

import {useThemeStore} from '@/presentation/stores/useThemeStore';
import {MMKVStorage} from '@/data/datasources/MMKVStorage';

// MMKVStorageのモック
jest.mock('@/data/datasources/MMKVStorage');

const mockMMKVStorage = MMKVStorage as jest.Mocked<typeof MMKVStorage>;

describe('useThemeStore', () => {
  let mockGetInstance: jest.Mock;
  let mockSetItem: jest.Mock;
  let mockGetItem: jest.Mock;

  beforeEach(() => {
    // モックインスタンスをリセット
    mockSetItem = jest.fn();
    mockGetItem = jest.fn();
    mockGetInstance = jest.fn(() => ({
      setItem: mockSetItem,
      getItem: mockGetItem,
      removeItem: jest.fn(),
      clear: jest.fn(),
    }));

    mockMMKVStorage.getInstance = mockGetInstance;

    // ストアをリセット
    useThemeStore.setState({
      mode: 'light',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('初期状態', () => {
    it('初期状態がlightである', () => {
      const state = useThemeStore.getState();
      expect(state.mode).toBe('light');
    });
  });

  describe('setMode', () => {
    it('モードを設定できる', () => {
      useThemeStore.getState().setMode('dark');

      const state = useThemeStore.getState();
      expect(state.mode).toBe('dark');
    });

    it('lightからdarkに変更できる', () => {
      useThemeStore.getState().setMode('light');
      expect(useThemeStore.getState().mode).toBe('light');

      useThemeStore.getState().setMode('dark');
      expect(useThemeStore.getState().mode).toBe('dark');
    });

    it('設定時にストレージに保存される', () => {
      useThemeStore.getState().setMode('dark');

      expect(mockGetInstance).toHaveBeenCalled();
      expect(mockSetItem).toHaveBeenCalledWith('app_theme_mode', 'dark');
    });

    it('ストレージエラー時もモードは変更される', () => {
      mockSetItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      useThemeStore.getState().setMode('dark');

      const state = useThemeStore.getState();
      expect(state.mode).toBe('dark'); // エラーでも状態は更新される
    });
  });

  describe('toggleMode', () => {
    it('lightからdarkに切り替えられる', () => {
      useThemeStore.setState({mode: 'light'});

      useThemeStore.getState().toggleMode();

      const state = useThemeStore.getState();
      expect(state.mode).toBe('dark');
    });

    it('darkからlightに切り替えられる', () => {
      useThemeStore.setState({mode: 'dark'});

      useThemeStore.getState().toggleMode();

      const state = useThemeStore.getState();
      expect(state.mode).toBe('light');
    });

    it('toggleでストレージに保存される', () => {
      useThemeStore.setState({mode: 'light'});

      useThemeStore.getState().toggleMode();

      expect(mockSetItem).toHaveBeenCalledWith('app_theme_mode', 'dark');
    });

    it('複数回toggleできる', () => {
      useThemeStore.setState({mode: 'light'});

      useThemeStore.getState().toggleMode();
      expect(useThemeStore.getState().mode).toBe('dark');

      useThemeStore.getState().toggleMode();
      expect(useThemeStore.getState().mode).toBe('light');

      useThemeStore.getState().toggleMode();
      expect(useThemeStore.getState().mode).toBe('dark');
    });
  });

  describe('initializeMode', () => {
    it('保存されたlightモードを読み込める', async () => {
      mockGetItem.mockReturnValue('light');

      await useThemeStore.getState().initializeMode();

      const state = useThemeStore.getState();
      expect(state.mode).toBe('light');
      expect(mockGetItem).toHaveBeenCalledWith('app_theme_mode');
    });

    it('保存されたdarkモードを読み込める', async () => {
      mockGetItem.mockReturnValue('dark');

      await useThemeStore.getState().initializeMode();

      const state = useThemeStore.getState();
      expect(state.mode).toBe('dark');
      expect(mockGetItem).toHaveBeenCalledWith('app_theme_mode');
    });

    it('保存されたモードがない場合、システム設定を反映する', async () => {
      mockGetItem.mockReturnValue(null);
      const {Appearance} = require('react-native');
      const originalGetColorScheme = Appearance.getColorScheme;
      
      // システム設定がdarkの場合
      Appearance.getColorScheme = jest.fn(() => 'dark');
      await useThemeStore.getState().initializeMode();
      expect(useThemeStore.getState().mode).toBe('dark');

      // システム設定がlightの場合
      Appearance.getColorScheme = jest.fn(() => 'light');
      await useThemeStore.getState().initializeMode();
      expect(useThemeStore.getState().mode).toBe('light');

      // システム設定がnullの場合
      Appearance.getColorScheme = jest.fn(() => null);
      await useThemeStore.getState().initializeMode();
      expect(useThemeStore.getState().mode).toBe('light'); // デフォルトはlight

      Appearance.getColorScheme = originalGetColorScheme;
    });

    it('不正な値の場合、システム設定を反映する', async () => {
      mockGetItem.mockReturnValue('invalid_mode');
      const {Appearance} = require('react-native');
      const originalGetColorScheme = Appearance.getColorScheme;
      
      // システム設定がdarkの場合
      Appearance.getColorScheme = jest.fn(() => 'dark');
      await useThemeStore.getState().initializeMode();
      expect(useThemeStore.getState().mode).toBe('dark');

      Appearance.getColorScheme = originalGetColorScheme;
    });

    it('ストレージエラー時もクラッシュしない', async () => {
      mockGetItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const {Appearance} = require('react-native');
      const originalGetColorScheme = Appearance.getColorScheme;
      Appearance.getColorScheme = jest.fn(() => 'dark');

      await expect(
        useThemeStore.getState().initializeMode()
      ).resolves.not.toThrow();

      const state = useThemeStore.getState();
      expect(state.mode).toBe('dark'); // システム設定を反映

      Appearance.getColorScheme = originalGetColorScheme;
    });
  });
});
