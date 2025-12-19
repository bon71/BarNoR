/**
 * 環境変数のバリデーション
 * アプリ起動時に環境変数の存在と形式を検証
 */

import {env} from './env';

export interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 環境変数のバリデーション
 * @returns バリデーション結果
 */
export function validateEnv(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 本番環境での必須環境変数チェック
  if (env.isProduction) {
    // 本番環境では必須の環境変数をチェック
    // 現在は特に必須の環境変数はないが、将来の拡張に備えて実装
  }

  // API URLの検証
  if (!env.notionApiUrl || !env.notionApiUrl.startsWith('https://')) {
    errors.push('Notion API URL must use HTTPS');
  }

  if (!env.openBdApiUrl || !env.openBdApiUrl.startsWith('https://')) {
    errors.push('OpenBD API URL must use HTTPS');
  }

  // ログレベルの検証
  const validLogLevels = ['debug', 'info', 'warn', 'error'];
  if (!validLogLevels.includes(env.logLevel)) {
    warnings.push(`Invalid log level: ${env.logLevel}. Using default: error`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 環境変数のバリデーションを実行し、エラーがある場合は例外をスロー
 * @throws {Error} バリデーションエラーがある場合
 */
export function validateEnvOrThrow(): void {
  const result = validateEnv();

  if (result.warnings.length > 0) {
    console.warn('[EnvValidator] Warnings:', result.warnings);
  }

  if (!result.isValid) {
    const errorMessage = `Environment validation failed:\n${result.errors.join('\n')}`;
    console.error('[EnvValidator]', errorMessage);
    throw new Error(errorMessage);
  }
}

