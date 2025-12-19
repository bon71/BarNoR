/**
 * @format
 */

import React from 'react';
import {render} from '@testing-library/react-native';
import App from '../App';

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native').View;
  return {
    GestureHandlerRootView: View,
  };
});

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const View = require('react-native').View;
  return {
    SafeAreaProvider: ({children}: {children: React.ReactNode}) => children,
    SafeAreaView: View,
  };
});

// Mock React Navigation
jest.mock('@react-navigation/native', () => {
  return {
    NavigationContainer: ({children}: {children: React.ReactNode}) => children,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
    }),
  };
});

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({children}: {children: React.ReactNode}) => children,
    Screen: () => null,
  }),
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({children}: {children: React.ReactNode}) => children,
    Screen: () => null,
  }),
}));

// Mock Vision Camera
jest.mock('react-native-vision-camera', () => ({
  Camera: () => null,
  useCameraDevice: jest.fn(() => null),
  useCameraPermission: jest.fn(() => ({
    hasPermission: false,
    requestPermission: jest.fn(),
  })),
  useCodeScanner: jest.fn(() => ({})),
}));

// Mock Zustand stores
jest.mock('@/presentation/stores/useThemeStore', () => ({
  useThemeStore: jest.fn(() => ({
    mode: 'light',
    initializeMode: jest.fn(),
  })),
}));

jest.mock('@/presentation/stores/useScanStore', () => ({
  useScanStore: jest.fn(() => ({
    scanHistory: [],
    isLoading: false,
    error: null,
  })),
}));

jest.mock('@/presentation/stores/useConfigStore', () => ({
  useConfigStore: jest.fn(() => ({
    config: {
      notionToken: '',
      databaseId: '',
      propertyMapping: {
        isbn: 'ISBN',
        title: 'タイトル',
        author: '著者名',
        imageUrl: '書影',
      },
    },
    isConfigured: false,
    setConfig: jest.fn(),
  })),
}));

jest.mock('@/presentation/stores/useLanguageStore', () => {
  const mockStore = {
    language: 'ja',
    setLanguage: jest.fn(),
    initializeLanguage: jest.fn(() => Promise.resolve()),
  };
  const mockUseLanguageStore = Object.assign(jest.fn(() => mockStore), {
    getState: jest.fn(() => mockStore),
  });
  return {
    useLanguageStore: mockUseLanguageStore,
  };
});

jest.mock('@/config/i18n', () => ({
  initI18n: jest.fn(),
  changeLanguage: jest.fn(),
  default: {
    t: jest.fn((key: string) => key),
    language: 'ja',
    isInitialized: true,
  },
}));

jest.mock('react-i18next', () => ({
  I18nextProvider: ({children}: {children: React.ReactNode}) => children,
  useTranslation: jest.fn(() => ({
    t: (key: string) => key,
    i18n: {
      language: 'ja',
      changeLanguage: jest.fn(),
      isInitialized: true,
    },
  })),
}));

test('renders correctly', async () => {
  const {toJSON} = render(<App />);
  expect(toJSON()).toBeTruthy();
});

test('言語設定が初期化される', async () => {
  const {useLanguageStore} = require('@/presentation/stores/useLanguageStore');
  const mockInitializeLanguage = jest.fn(() => Promise.resolve());

  (useLanguageStore as jest.Mock).mockReturnValue({
    language: 'ja',
    setLanguage: jest.fn(),
    initializeLanguage: mockInitializeLanguage,
  });

  render(<App />);

  await new Promise(resolve => setTimeout(resolve, 200));

  // 言語設定の初期化が呼ばれることを確認
  expect(mockInitializeLanguage).toHaveBeenCalled();
  // Note: initI18nはindex.jsで呼ばれるため、App.tsx内では呼ばれない
});

test('useLanguageStoreが呼ばれる', async () => {
  const {useLanguageStore} = require('@/presentation/stores/useLanguageStore');
  const mockInitializeLanguage = jest.fn(() => Promise.resolve());

  (useLanguageStore as jest.Mock).mockReturnValue({
    language: 'ja',
    setLanguage: jest.fn(),
    initializeLanguage: mockInitializeLanguage,
  });

  render(<App />);

  await new Promise(resolve => setTimeout(resolve, 200));

  expect(useLanguageStore).toHaveBeenCalled();
});
