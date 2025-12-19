/**
 * i18n設定 テスト
 */

import i18n from 'i18next';
import {initI18n, changeLanguage, SUPPORTED_LANGUAGES} from '@/config/i18n';
import {useLanguageStore} from '@/presentation/stores/useLanguageStore';
import * as RNLocalize from 'react-native-localize';

jest.mock('i18next', () => ({
  use: jest.fn().mockReturnThis(),
  init: jest.fn().mockReturnThis(),
  changeLanguage: jest.fn(),
  language: 'ja',
  isInitialized: false,
}));

jest.mock('react-i18next', () => ({
  initReactI18next: {
    type: 'languageDetector',
  },
}));

jest.mock('react-native-localize', () => ({
  getLocales: jest.fn(() => [{ languageCode: 'ja' }]),
}));

jest.mock('@/presentation/stores/useLanguageStore', () => ({
  useLanguageStore: {
    getState: jest.fn(() => ({ language: 'ja' })),
  },
}));

jest.mock('@/locales/ja.json', () => ({
  common: { save: '保存' },
}));

jest.mock('@/locales/en.json', () => ({
  common: { save: 'Save' },
}));

const mockUseLanguageStore = useLanguageStore as jest.Mocked<typeof useLanguageStore>;
const mockI18n = i18n as jest.Mocked<typeof i18n>;
const mockRNLocalize = RNLocalize as jest.Mocked<typeof RNLocalize>;

describe('i18n設定', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockI18n.isInitialized = false;
    mockI18n.language = 'ja';
  });

  describe('SUPPORTED_LANGUAGES', () => {
    it('サポートする言語が正しく定義されている', () => {
      expect(SUPPORTED_LANGUAGES).toEqual(['ja', 'en']);
      expect(SUPPORTED_LANGUAGES.includes('ja')).toBe(true);
      expect(SUPPORTED_LANGUAGES.includes('en')).toBe(true);
    });
  });

  describe('initI18n', () => {
    it('i18nが初期化される', () => {
      mockUseLanguageStore.getState.mockReturnValue({ language: 'ja' } as any);

      initI18n();

      expect(mockI18n.use).toHaveBeenCalled();
      expect(mockI18n.init).toHaveBeenCalled();
    });

    it('言語ストアから言語を取得して初期化する', () => {
      mockUseLanguageStore.getState.mockReturnValue({ language: 'en' } as any);

      initI18n();

      expect(mockI18n.init).toHaveBeenCalledWith(
        expect.objectContaining({
          lng: 'en',
        })
      );
    });

    it('言語ストアが空の場合、デバイス言語を使用する', () => {
      mockUseLanguageStore.getState.mockReturnValue({ language: '' } as any);
      mockRNLocalize.getLocales.mockReturnValue([{ languageCode: 'en' }] as any);

      initI18n();

      expect(mockI18n.init).toHaveBeenCalledWith(
        expect.objectContaining({
          lng: 'en',
        })
      );
    });

    it('デバイス言語がサポートされていない場合、jaを使用する', () => {
      mockUseLanguageStore.getState.mockReturnValue({ language: '' } as any);
      mockRNLocalize.getLocales.mockReturnValue([{ languageCode: 'fr' }] as any);

      initI18n();

      expect(mockI18n.init).toHaveBeenCalledWith(
        expect.objectContaining({
          lng: 'ja',
        })
      );
    });

    it('デバイス言語が取得できない場合、jaを使用する', () => {
      mockUseLanguageStore.getState.mockReturnValue({ language: '' } as any);
      mockRNLocalize.getLocales.mockReturnValue([]);

      initI18n();

      expect(mockI18n.init).toHaveBeenCalledWith(
        expect.objectContaining({
          lng: 'ja',
        })
      );
    });

    it('フォールバック言語がjaに設定される', () => {
      initI18n();

      expect(mockI18n.init).toHaveBeenCalledWith(
        expect.objectContaining({
          fallbackLng: 'ja',
        })
      );
    });

    it('compatibilityJSONがv4に設定される', () => {
      initI18n();

      expect(mockI18n.init).toHaveBeenCalledWith(
        expect.objectContaining({
          compatibilityJSON: 'v4',
        })
      );
    });
  });

  describe('changeLanguage', () => {
    it('言語を変更できる', () => {
      mockUseLanguageStore.getState.mockReturnValue({
        language: 'ja',
        setLanguage: jest.fn(),
      } as any);

      changeLanguage('en');

      expect(mockI18n.changeLanguage).toHaveBeenCalledWith('en');
    });

    it('言語変更時にストアも更新される', () => {
      const mockSetLanguage = jest.fn();
      mockUseLanguageStore.getState.mockReturnValue({
        language: 'ja',
        setLanguage: mockSetLanguage,
      } as any);

      changeLanguage('en');

      expect(mockSetLanguage).toHaveBeenCalledWith('en');
    });

    it('jaからenに変更できる', () => {
      const mockSetLanguage = jest.fn();
      mockUseLanguageStore.getState.mockReturnValue({
        language: 'ja',
        setLanguage: mockSetLanguage,
      } as any);

      changeLanguage('ja');
      expect(mockI18n.changeLanguage).toHaveBeenCalledWith('ja');

      changeLanguage('en');
      expect(mockI18n.changeLanguage).toHaveBeenCalledWith('en');
      expect(mockSetLanguage).toHaveBeenCalledWith('en');
    });
  });
});

