/**
 * moduleValidation テスト
 */

import {
  validateReactModule,
  validateReactNativeModule,
  validateCriticalModules,
} from '@/utils/moduleValidation';

describe('moduleValidation', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('validateReactModule', () => {
    it('Reactモジュールが正しくロードされている場合、エラーを投げない', () => {
      expect(() => validateReactModule()).not.toThrow();
    });

    it('Reactモジュールがundefinedの場合はエラーをスローする', () => {
      // requireをモックする代わりに、jest.doMockを使用
      jest.doMock('react', () => undefined);

      // モジュールを再読み込み
      jest.resetModules();
      const {validateReactModule: validateReactModuleMocked} = require('@/utils/moduleValidation');

      expect(() => validateReactModuleMocked()).toThrow('React module validation failed');

      jest.dontMock('react');
      jest.resetModules();
    });

    it('React.createElementがundefinedの場合はエラーをスローする', () => {
      jest.doMock('react', () => ({
        Component: class {},
      }));

      jest.resetModules();
      const {validateReactModule: validateReactModuleMocked} = require('@/utils/moduleValidation');

      expect(() => validateReactModuleMocked()).toThrow('React.createElement is undefined');

      jest.dontMock('react');
      jest.resetModules();
    });

    it('React.Componentがundefinedの場合はエラーをスローする', () => {
      jest.doMock('react', () => ({
        createElement: jest.fn(),
      }));

      jest.resetModules();
      const {validateReactModule: validateReactModuleMocked} = require('@/utils/moduleValidation');

      expect(() => validateReactModuleMocked()).toThrow('React.Component is undefined');

      jest.dontMock('react');
      jest.resetModules();
    });

    it('requireがエラーをスローした場合はエラーをスローする', () => {
      jest.doMock('react', () => {
        throw new Error('Module not found');
      });

      jest.resetModules();
      const {validateReactModule: validateReactModuleMocked} = require('@/utils/moduleValidation');

      expect(() => validateReactModuleMocked()).toThrow('React module validation failed');

      jest.dontMock('react');
      jest.resetModules();
    });

    it('requireがError以外のエラーをスローした場合もエラーをスローする', () => {
      // jest.doMockはjest.resetModules()の前に呼び出す必要がある
      jest.doMock('react', () => {
        throw 'String error';
      }, {virtual: true});

      jest.resetModules();
      const {validateReactModule: validateReactModuleMocked} = require('@/utils/moduleValidation');

      expect(() => validateReactModuleMocked()).toThrow('React module validation failed');

      jest.dontMock('react');
      jest.resetModules();
    });
  });

  describe('validateReactNativeModule', () => {
    it('React Nativeモジュールが正しくロードされている場合、エラーを投げない', () => {
      expect(() => validateReactNativeModule()).not.toThrow();
    });

    it('React Nativeモジュールがundefinedの場合はエラーをスローする', () => {
      jest.doMock('react-native', () => undefined);

      jest.resetModules();
      const {validateReactNativeModule: validateReactNativeModuleMocked} = require('@/utils/moduleValidation');

      expect(() => validateReactNativeModuleMocked()).toThrow('React Native module validation failed');

      jest.dontMock('react-native');
      jest.resetModules();
    });

    it('ReactNative.AppRegistryがundefinedの場合はエラーをスローする', () => {
      jest.doMock('react-native', () => ({
        View: jest.fn(),
      }));

      jest.resetModules();
      const {validateReactNativeModule: validateReactNativeModuleMocked} = require('@/utils/moduleValidation');

      expect(() => validateReactNativeModuleMocked()).toThrow('React Native AppRegistry is undefined');

      jest.dontMock('react-native');
      jest.resetModules();
    });

    it('ReactNative.Viewがundefinedの場合はエラーをスローする', () => {
      jest.doMock('react-native', () => ({
        AppRegistry: jest.fn(),
      }));

      jest.resetModules();
      const {validateReactNativeModule: validateReactNativeModuleMocked} = require('@/utils/moduleValidation');

      expect(() => validateReactNativeModuleMocked()).toThrow('React Native View is undefined');

      jest.dontMock('react-native');
      jest.resetModules();
    });

    it('requireがエラーをスローした場合はエラーをスローする', () => {
      jest.doMock('react-native', () => {
        throw new Error('Module not found');
      });

      jest.resetModules();
      const {validateReactNativeModule: validateReactNativeModuleMocked} = require('@/utils/moduleValidation');

      expect(() => validateReactNativeModuleMocked()).toThrow('React Native module validation failed');

      jest.dontMock('react-native');
      jest.resetModules();
    });

    it('requireがError以外のエラーをスローした場合もエラーをスローする', () => {
      jest.doMock('react-native', () => {
        throw 'String error';
      });

      jest.resetModules();
      const {validateReactNativeModule: validateReactNativeModuleMocked} = require('@/utils/moduleValidation');

      expect(() => validateReactNativeModuleMocked()).toThrow('React Native module validation failed');

      jest.dontMock('react-native');
      jest.resetModules();
    });
  });

  describe('validateCriticalModules', () => {
    it('すべてのモジュールが正しくロードされている場合、エラーを投げない', () => {
      expect(() => validateCriticalModules()).not.toThrow();
    });

    it('validateReactModuleがエラーをスローした場合はエラーをスローする', () => {
      jest.doMock('react', () => undefined);

      jest.resetModules();
      const {validateCriticalModules: validateCriticalModulesMocked} = require('@/utils/moduleValidation');

      expect(() => validateCriticalModulesMocked()).toThrow('React module validation failed');

      jest.dontMock('react');
      jest.resetModules();
    });

    it('validateReactNativeModuleがエラーをスローした場合はエラーをスローする', () => {
      jest.doMock('react-native', () => undefined);

      jest.resetModules();
      const {validateCriticalModules: validateCriticalModulesMocked} = require('@/utils/moduleValidation');

      expect(() => validateCriticalModulesMocked()).toThrow('React Native module validation failed');

      jest.dontMock('react-native');
      jest.resetModules();
    });
  });
});

