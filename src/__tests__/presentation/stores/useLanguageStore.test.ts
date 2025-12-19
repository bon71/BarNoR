/**
 * useLanguageStore テスト
 */

import {renderHook, act} from '@testing-library/react-native';
import {useLanguageStore, storage} from '@/presentation/stores/useLanguageStore';

// MMKVStorageとEncryptionKeyManagerをモック
jest.mock('@/data/datasources/MMKVStorage');
jest.mock('@/infrastructure/security/EncryptionKeyManager', () => ({
  getEncryptionKey: jest.fn(() => Promise.resolve('test-key')),
  getEncryptionKeySync: jest.fn(() => 'test-key'),
  validateEncryptionKey: jest.fn((key: string) => key.length >= 16),
}));

describe('useLanguageStore', () => {
  let mockGet: jest.SpyInstance;
  let mockSet: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    // storageのメソッドをスパイ
    mockGet = jest.spyOn(storage, 'get');
    mockSet = jest.spyOn(storage, 'set');

    // ストアをリセット
    useLanguageStore.setState({
      language: 'ja',
    });
  });

  afterEach(() => {
    mockGet.mockRestore();
    mockSet.mockRestore();
  });

  describe('初期状態', () => {
    it('初期状態ではlanguageがjaである', () => {
      const {result} = renderHook(() => useLanguageStore());

      expect(result.current.language).toBe('ja');
    });
  });

  describe('setLanguage', () => {
    it('言語を変更できる', () => {
      const {result} = renderHook(() => useLanguageStore());

      act(() => {
        result.current.setLanguage('en');
      });

      expect(result.current.language).toBe('en');
    });

    it('言語変更時にストレージに保存される', () => {
      const {result} = renderHook(() => useLanguageStore());

      act(() => {
        result.current.setLanguage('en');
      });

      expect(mockSet).toHaveBeenCalledWith('app_language', 'en');
    });

    it('jaからenに変更できる', () => {
      const {result} = renderHook(() => useLanguageStore());

      act(() => {
        result.current.setLanguage('ja');
      });
      expect(result.current.language).toBe('ja');

      act(() => {
        result.current.setLanguage('en');
      });
      expect(result.current.language).toBe('en');
    });

    it('ストレージエラー時も言語は変更される', () => {
      mockSet.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const {result} = renderHook(() => useLanguageStore());

      act(() => {
        result.current.setLanguage('en');
      });

      // エラーでも状態は更新される
      expect(result.current.language).toBe('en');
    });
  });

  describe('initializeLanguage', () => {
    it('保存された言語を読み込める', async () => {
      mockGet.mockReturnValue('en');

      const {result} = renderHook(() => useLanguageStore());

      await act(async () => {
        await result.current.initializeLanguage();
      });

      expect(result.current.language).toBe('en');
      expect(mockGet).toHaveBeenCalledWith('app_language');
    });

    it('保存された言語がjaの場合、jaを読み込む', async () => {
      mockGet.mockReturnValue('ja');

      const {result} = renderHook(() => useLanguageStore());

      await act(async () => {
        await result.current.initializeLanguage();
      });

      expect(result.current.language).toBe('ja');
    });

    it('保存された言語が無効な場合、デフォルトのjaを返す', async () => {
      mockGet.mockReturnValue('fr'); // サポートされていない言語

      const {result} = renderHook(() => useLanguageStore());

      await act(async () => {
        await result.current.initializeLanguage();
      });

      expect(result.current.language).toBe('ja');
    });

    it('ストレージに保存されていない場合、デフォルトのjaを返す', async () => {
      mockGet.mockReturnValue(undefined);

      const {result} = renderHook(() => useLanguageStore());

      await act(async () => {
        await result.current.initializeLanguage();
      });

      expect(result.current.language).toBe('ja');
    });

    it('ストレージ読み込みエラー時、デフォルトのjaを返す', async () => {
      mockGet.mockImplementation(() => {
        throw new Error('Storage read error');
      });

      const {result} = renderHook(() => useLanguageStore());

      await act(async () => {
        await result.current.initializeLanguage();
      });

      expect(result.current.language).toBe('ja');
    });
  });

  describe('統合テスト', () => {
    it('言語を変更してから初期化すると、変更された言語が読み込まれる', async () => {
      const {result} = renderHook(() => useLanguageStore());

      // 言語を変更
      act(() => {
        result.current.setLanguage('en');
      });

      expect(result.current.language).toBe('en');

      // ストレージから読み込む
      mockGet.mockReturnValue('en');
      await act(async () => {
        await result.current.initializeLanguage();
      });

      expect(result.current.language).toBe('en');
    });
  });
});

