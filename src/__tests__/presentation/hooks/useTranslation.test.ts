/**
 * useTranslation hook テスト
 */

import {renderHook} from '@testing-library/react-native';
import {useTranslation} from '@/presentation/hooks/useTranslation';
import {useTranslation as useI18nTranslation} from 'react-i18next';

jest.mock('react-i18next');

const mockUseI18nTranslation = useI18nTranslation as jest.MockedFunction<
  typeof useI18nTranslation
>;

describe('useTranslation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('t関数が正しく動作する', () => {
    const mockT = jest.fn((key: string) => `translated:${key}`) as any;
    mockUseI18nTranslation.mockReturnValue({
      t: mockT,
      i18n: {
        language: 'ja',
        changeLanguage: jest.fn(),
        isInitialized: true,
      } as any,
    } as any);

    const {result} = renderHook(() => useTranslation());

    result.current.t('common:save');
    // キー変換により 'common:save' → 'common.save' になる
    expect(mockT).toHaveBeenCalledWith('common.save', undefined);
  });

  it('t関数がオプション付きで動作する', () => {
    const mockT = jest.fn((key: string, options?: any) => {
      if (options && options.count) {
        return `translated:${key}:${options.count}`;
      }
      return `translated:${key}`;
    }) as any;
    mockUseI18nTranslation.mockReturnValue({
      t: mockT,
      i18n: {
        language: 'ja',
        changeLanguage: jest.fn(),
        isInitialized: true,
      } as any,
    } as any);

    const {result} = renderHook(() => useTranslation());

    result.current.t('alerts:databasesFound', {count: 5});
    // キー変換により 'alerts:databasesFound' → 'alerts.databasesFound' になる
    expect(mockT).toHaveBeenCalledWith('alerts.databasesFound', {count: 5});
  });

  it('currentLanguageが正しく取得できる', () => {
    mockUseI18nTranslation.mockReturnValue({
      t: jest.fn() as any,
      i18n: {
        language: 'en',
        changeLanguage: jest.fn(),
        isInitialized: true,
      } as any,
    } as any);

    const {result} = renderHook(() => useTranslation());

    expect(result.current.currentLanguage).toBe('en');
  });

  it('i18nオブジェクトが返される', () => {
    const mockI18n = {
      language: 'ja',
      changeLanguage: jest.fn(),
      isInitialized: true,
    };
    mockUseI18nTranslation.mockReturnValue({
      t: jest.fn() as any,
      i18n: mockI18n as any,
    } as any);

    const {result} = renderHook(() => useTranslation());

    expect(result.current.i18n).toBe(mockI18n);
  });

  it('言語が変更されるとcurrentLanguageも更新される', () => {
    mockUseI18nTranslation.mockReturnValue({
      t: jest.fn() as any,
      i18n: {
        language: 'ja',
        changeLanguage: jest.fn(),
        isInitialized: true,
      } as any,
    } as any);

    const {result, rerender} = renderHook(() => useTranslation());

    expect(result.current.currentLanguage).toBe('ja');

    mockUseI18nTranslation.mockReturnValue({
      t: jest.fn() as any,
      i18n: {
        language: 'en',
        changeLanguage: jest.fn(),
        isInitialized: true,
      } as any,
    } as any);

    rerender({});

    expect(result.current.currentLanguage).toBe('en');
  });
});

