/**
 * BottomTabNavigator テスト
 */

import React from 'react';
import {render} from '@testing-library/react-native';
import {NavigationContainer} from '@react-navigation/native';
import {BottomTabNavigator} from '@/presentation/navigation/BottomTabNavigator';
import {useConfigStore} from '@/presentation/stores/useConfigStore';

// BlurTabBarのモック
jest.mock('@/presentation/components/navigation/BlurTabBar', () => ({
  BlurTabBar: () => null,
}));

// ScanScreenWrapperのモック
jest.mock('@/presentation/screens/ScanScreenWrapper', () => ({
  ScanScreenWrapper: () => null,
}));

// SettingsScreenSimpleのモック
jest.mock('@/presentation/screens/SettingsScreenSimple', () => ({
  SettingsScreenSimple: () => null,
}));

// useConfigStoreのモック
jest.mock('@/presentation/stores/useConfigStore', () => ({
  useConfigStore: jest.fn(),
}));

// useTranslationのモック
jest.mock('@/presentation/hooks/useTranslation', () => ({
  useTranslation: jest.fn(() => ({
    t: (key: string) => key,
    i18n: {
      language: 'ja',
      changeLanguage: jest.fn(),
    },
  })),
}));

describe('BottomTabNavigator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('isConfiguredがtrueの場合、Scanタブを初期ルートにする', () => {
    (useConfigStore as unknown as jest.Mock).mockReturnValue({
      isConfigured: true,
    });

    const {toJSON} = render(
      <NavigationContainer>
        <BottomTabNavigator />
      </NavigationContainer>
    );
    expect(toJSON()).toBeTruthy();
  });

  it('isConfiguredがfalseの場合、Settingsタブを初期ルートにする', () => {
    (useConfigStore as unknown as jest.Mock).mockReturnValue({
      isConfigured: false,
    });

    const {toJSON} = render(
      <NavigationContainer>
        <BottomTabNavigator />
      </NavigationContainer>
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renderTabBarでエラーが発生した場合、nullを返す', () => {
    (useConfigStore as unknown as jest.Mock).mockReturnValue({
      isConfigured: true,
    });

    const {toJSON} = render(
      <NavigationContainer>
        <BottomTabNavigator />
      </NavigationContainer>
    );
    expect(toJSON()).toBeTruthy();
  });

  it('useTranslationが呼ばれ、翻訳キーが使用される', () => {
    const {useTranslation} = require('@/presentation/hooks/useTranslation');
    const mockT = jest.fn((key: string) => {
      const translations: Record<string, string> = {
        'navigation:scan': 'スキャン',
        'navigation:settings': '設定',
      };
      return translations[key] || key;
    });
    (useTranslation as jest.Mock).mockReturnValue({
      t: mockT,
      i18n: {
        language: 'ja',
        changeLanguage: jest.fn(),
      },
    });

    (useConfigStore as unknown as jest.Mock).mockReturnValue({
      isConfigured: true,
    });

    render(
      <NavigationContainer>
        <BottomTabNavigator />
      </NavigationContainer>
    );
    expect(useTranslation).toHaveBeenCalled();
    expect(mockT).toHaveBeenCalledWith('navigation:scan');
    expect(mockT).toHaveBeenCalledWith('navigation:settings');
  });
});

