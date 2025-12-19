/**
 * @format
 */
import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// i18nを最初に初期化（アプリ登録前に実行）
import { initI18n } from './src/config/i18n';
initI18n();

// アプリ登録を最優先で実行（メインスレッドをブロックしない）
AppRegistry.registerComponent(appName, () => App);

// 初期化処理を非同期で実行（メインスレッドをブロックしない）
// requestIdleCallbackが利用可能な場合はそれを使用、そうでなければsetTimeoutを使用
const scheduleAsyncInit = (callback) => {
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(callback, { timeout: 1000 });
  } else {
    // React NativeではrequestIdleCallbackが利用できないため、setTimeoutを使用
    setTimeout(callback, 0);
  }
};

scheduleAsyncInit(() => {
  // グローバルエラーハンドラーのセットアップ（非同期）
  try {
    const { setupGlobalErrorHandler } = require('./src/utils/errorHandler');
    setupGlobalErrorHandler();
  } catch (error) {
    // エラーハンドラーのセットアップに失敗してもアプリは起動可能
    const isDev = typeof __DEV__ !== 'undefined' && __DEV__;
    if (isDev) {
      console.warn('Failed to setup global error handler:', error);
    }
  }

  // 重要なモジュールの検証を実行（開発環境のみ、さらに遅延）
  const isDev = typeof __DEV__ !== 'undefined' && __DEV__;
  if (isDev) {
    // モジュール検証はさらに遅延させて、アプリ起動に影響しないようにする
    setTimeout(() => {
      try {
        const { validateCriticalModules } = require('./src/utils/moduleValidation');
        validateCriticalModules();
      } catch (error) {
        // 検証に失敗した場合でもアプリを起動（エラーバウンダリーがキャッチする）
        console.warn('Critical module validation failed:', error);
      }
    }, 100);
  }
});
