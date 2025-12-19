/**
 * ログマスキングユーティリティ
 * 機密情報（APIキー、トークンなど）をログに出力する際にマスクする
 */

/**
 * 機密情報をマスクする
 * @param value マスクする値
 * @param visibleLength 先頭に表示する文字数（デフォルト: 7）
 * @returns マスクされた文字列（例: "secret_***"）
 */
export function maskSensitiveValue(value: string | undefined | null, visibleLength: number = 7): string {
  if (!value || typeof value !== 'string') {
    return '***';
  }

  if (value.length <= visibleLength) {
    return '***';
  }

  return value.slice(0, visibleLength) + '***';
}

/**
 * オブジェクト内の機密情報をマスクする
 * @param obj マスクするオブジェクト
 * @param sensitiveKeys マスクするキーのリスト（デフォルト: ['token', 'apiKey', 'secret', 'password']）
 * @returns マスクされたオブジェクト
 */
export function maskSensitiveData<T extends Record<string, unknown>>(
  obj: T,
  sensitiveKeys: string[] = ['token', 'apiKey', 'secret', 'password', 'notionToken', 'api_key'],
): Partial<T> {
  const masked: Partial<T> = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveKeys.some(sensitiveKey => lowerKey.includes(sensitiveKey.toLowerCase()));

    if (isSensitive && typeof value === 'string') {
      masked[key as keyof T] = maskSensitiveValue(value) as T[keyof T];
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      masked[key as keyof T] = maskSensitiveData(value as Record<string, unknown>, sensitiveKeys) as T[keyof T];
    } else {
      masked[key as keyof T] = value as T[keyof T] | undefined;
    }
  }

  return masked;
}

/**
 * ログ出力用にオブジェクトを安全にシリアライズする
 * @param obj シリアライズするオブジェクト
 * @returns マスクされたJSON文字列
 */
export function safeStringify(obj: unknown): string {
  try {
    const masked = typeof obj === 'object' && obj !== null && !Array.isArray(obj)
      ? maskSensitiveData(obj as Record<string, unknown>)
      : obj;
    return JSON.stringify(masked, null, 2);
  } catch (error) {
    return '[Unable to stringify object]';
  }
}

