/**
 * モジュール検証ユーティリティ
 * 重要なモジュールが正しくロードされているかを検証する
 */

/**
 * Reactモジュールが正しくロードされているかを検証
 * @throws Error Reactモジュールが正しくロードされていない場合
 */
export function validateReactModule(): void {
  try {

    const React = require('react');

    if (!React) {
      throw new Error('React module is undefined');
    }

    if (!React.createElement) {
      throw new Error('React.createElement is undefined');
    }

    if (!React.Component) {
      throw new Error('React.Component is undefined');
    }

    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('[ModuleValidation] React module validated successfully');
    }
  } catch (error) {
    const errorMessage = `React module validation failed: ${
      error instanceof Error ? error.message : String(error)
    }`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
}

/**
 * React Nativeモジュールが正しくロードされているかを検証
 * @throws Error React Nativeモジュールが正しくロードされていない場合
 */
export function validateReactNativeModule(): void {
  try {

    const ReactNative = require('react-native');

    if (!ReactNative) {
      throw new Error('React Native module is undefined');
    }

    if (!ReactNative.AppRegistry) {
      throw new Error('React Native AppRegistry is undefined');
    }

    if (!ReactNative.View) {
      throw new Error('React Native View is undefined');
    }

    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log(
        '[ModuleValidation] React Native module validated successfully',
      );
    }
  } catch (error) {
    const errorMessage = `React Native module validation failed: ${
      error instanceof Error ? error.message : String(error)
    }`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
}

/**
 * すべての重要なモジュールを検証
 * アプリ起動時に実行することを推奨
 */
export function validateCriticalModules(): void {
  const isDev = typeof __DEV__ !== 'undefined' && __DEV__;
  if (isDev) {
    console.log('[ModuleValidation] Starting critical modules validation...');
  }

  validateReactModule();
  validateReactNativeModule();

  if (isDev) {
    console.log('[ModuleValidation] All critical modules validated successfully');
  }
}
