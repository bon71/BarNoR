/**
 * 環境変数設定
 *
 * 注意: 本番環境では.envファイルから読み込むこと
 * API キーなどの機密情報は必ず暗号化して保存すること
 */

// __DEV__の安全なチェック
const isDev = typeof __DEV__ !== 'undefined' && __DEV__;

export const env = {
  // アプリ環境
  isDevelopment: isDev,
  isProduction: !isDev,

  // API設定
  openBdApiUrl: 'https://api.openbd.jp/v1',
  rakutenApiUrl: 'https://app.rakuten.co.jp/services/api',
  notionApiUrl: 'https://api.notion.com/v1',
  notionApiVersion: '2022-06-28',

  // RevenueCat設定（本番環境で設定）
  revenueCatApiKey: isDev
    ? 'test_key'
    : '', // 本番環境では環境変数から取得

  // ログレベル
  logLevel: isDev ? 'debug' : 'error',
} as const;

export type Env = typeof env;

// 環境変数のバリデーション（開発環境では警告のみ、本番環境ではエラー）
if (typeof __DEV__ !== 'undefined') {
  try {
    const {validateEnv} = require('./envValidator');
    const validation = validateEnv();
    if (validation.warnings.length > 0) {
      console.warn('[Env] Validation warnings:', validation.warnings);
    }
    if (!validation.isValid && !isDev) {
      // 本番環境ではエラーをスロー
      const {validateEnvOrThrow} = require('./envValidator');
      validateEnvOrThrow();
    }
  } catch (error) {
    // バリデーション失敗時は警告のみ（アプリの起動を妨げない）
    console.warn('[Env] Validation failed:', error);
  }
}
