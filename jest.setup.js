// jest.setup.js

// Mock global objects
global.fetch = jest.fn();

// Mock react-native-mmkv
jest.mock('react-native-mmkv', () => {
  return {
    MMKV: jest.fn().mockImplementation(() => ({
      set: jest.fn(),
      getString: jest.fn(),
      getNumber: jest.fn(),
      getBoolean: jest.fn(),
      delete: jest.fn(),
      clearAll: jest.fn(),
      getAllKeys: jest.fn(() => []),
      contains: jest.fn(),
    })),
  };
});

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({
    t: (key: string, options?: Record<string, string | number>) => {
      // オプションがある場合は置換
      if (options) {
        let result = key;
        Object.entries(options).forEach(([k, v]) => {
          result = result.replace(`{{${k}}}`, String(v));
        });
        return result;
      }
      return key;
    },
    i18n: {
      language: 'ja',
      changeLanguage: jest.fn(),
      isInitialized: true,
    },
  })),
  initReactI18next: {
    type: 'languageDetector',
  },
}));

// Mock react-native-localize
jest.mock('react-native-localize', () => ({
  getLocales: jest.fn(() => [{ languageCode: 'ja' }]),
}));

// Mock react-native-device-info
jest.mock('react-native-device-info', () => ({
  getUniqueId: jest.fn(() => Promise.resolve('mock-device-id')),
  // Add other methods used from react-native-device-info if necessary
}));

// Mock react-native-keychain
jest.mock('react-native-keychain', () => ({
  getGenericPassword: jest.fn(),
  setGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
  ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'AccessibleWhenUnlockedThisDeviceOnly' },
}));

// Mock EncryptionKeyManager
jest.mock('@/infrastructure/security/EncryptionKeyManager', () => {
  const mockGetEncryptionKeySync = () => 'NotionBarcodeReader_v1_SecureKey_2024';
  return {
    getEncryptionKey: jest.fn(() => Promise.resolve('NotionBarcodeReader_v1_SecureKey_2024')),
    getEncryptionKeySync: mockGetEncryptionKeySync,
    validateEncryptionKey: jest.fn((key: string) => key.length >= 16),
  };
});

// Mock console methods to avoid noise in tests (optional)
// Uncomment if you want to suppress console messages in tests
// global.console = {
//   ...console,
//   error: jest.fn(),
//   warn: jest.fn(),
// };
