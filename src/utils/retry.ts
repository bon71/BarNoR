/**
 * リトライユーティリティ
 * ネットワークエラー時の自動リトライ機能
 */

export interface RetryOptions {
  maxRetries?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: Error) => boolean;
}

/**
 * デフォルトのリトライ判定関数
 * ネットワークエラーやタイムアウトの場合にリトライする
 */
const defaultShouldRetry = (error: Error): boolean => {
  const message = error.message.toLowerCase();

  // ネットワークエラー
  if (message.includes('network')) return true;
  if (message.includes('timeout')) return true;
  if (message.includes('fetch')) return true;

  // HTTP エラー
  if (message.includes('500')) return true;
  if (message.includes('502')) return true;
  if (message.includes('503')) return true;
  if (message.includes('504')) return true;

  return false;
};

/**
 * 指定した関数を自動リトライ付きで実行
 *
 * @param fn - 実行する非同期関数
 * @param options - リトライオプション
 * @returns 実行結果
 *
 * @example
 * const result = await withRetry(
 *   () => fetch('https://api.example.com/data'),
 *   { maxRetries: 3, delayMs: 1000 }
 * );
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxRetries = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    shouldRetry = defaultShouldRetry,
  } = options;

  let lastError: Error | null = null;
  let currentDelay = delayMs;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // 最後の試行の場合はエラーをスロー
      if (attempt === maxRetries) {
        throw lastError;
      }

      // リトライすべきエラーかチェック
      if (!shouldRetry(lastError)) {
        throw lastError;
      }

      // リトライ前に待機
      console.log(
        `Retry attempt ${attempt + 1}/${maxRetries} after ${currentDelay}ms`,
      );
      await delay(currentDelay);

      // 次のリトライの待機時間を増やす（Exponential Backoff）
      currentDelay *= backoffMultiplier;
    }
  }

  // 通常ここには到達しないが、TypeScriptの型チェックのため
  throw lastError || new Error('Unknown error');
}

/**
 * 指定時間待機する
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => {
    const timer = setTimeout(resolve, ms);
    // Node.js環境では.unref()を呼び出してタイマーがプロセスの終了を妨げないようにする
    // React Native環境では unref は存在しないため型チェックを実施
    if (timer && typeof (timer as any).unref === 'function') {
      (timer as any).unref();
    }
  });
}

/**
 * タイムアウト付きで関数を実行
 *
 * @param fn - 実行する非同期関数
 * @param timeoutMs - タイムアウト時間（ミリ秒）
 * @returns 実行結果
 *
 * @example
 * const result = await withTimeout(
 *   () => fetch('https://api.example.com/data'),
 *   5000
 * );
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<never>((_, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`Operation timed out after ${timeoutMs}ms`)),
        timeoutMs,
      );
      // Node.js環境では.unref()を呼び出してタイマーがプロセスの終了を妨げないようにする
      // React Native環境では unref は存在しないため型チェックを実施
      if (timer && typeof (timer as any).unref === 'function') {
        (timer as any).unref();
      }
    }),
  ]);
}

/**
 * リトライ＋タイムアウト付きで関数を実行
 *
 * @param fn - 実行する非同期関数
 * @param retryOptions - リトライオプション
 * @param timeoutMs - タイムアウト時間（ミリ秒）
 * @returns 実行結果
 *
 * @example
 * const result = await withRetryAndTimeout(
 *   () => fetch('https://api.example.com/data'),
 *   { maxRetries: 3, delayMs: 1000 },
 *   5000
 * );
 */
export async function withRetryAndTimeout<T>(
  fn: () => Promise<T>,
  retryOptions: RetryOptions = {},
  timeoutMs: number = 30000,
): Promise<T> {
  return withRetry(() => withTimeout(fn, timeoutMs), retryOptions);
}
