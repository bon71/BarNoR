/**
 * APIクライアント共通ラッパ
 */

import {withRetryAndTimeout, RetryOptions} from '@/utils/retry';
import {generateRequestId} from '@/utils/csrfProtection';
import {fetchWithCertificatePinning} from '@/utils/certificatePinning';
import {env} from '@/config/env';

export interface ApiFetchOptions {
  retry?: RetryOptions;
  timeoutMs?: number;
}

type MetricsHandler = (entry: {
  url: string;
  method?: string;
  status: number;
  durationMs: number;
}) => void;

let metricsHandler: MetricsHandler | null = null;

export function setApiMetricsHandler(handler: MetricsHandler | null) {
  metricsHandler = handler;
}

/**
 * リトライ＋タイムアウト付きfetch
 */
export async function apiFetch(
  url: string,
  init?: RequestInit,
  options: ApiFetchOptions = {},
): Promise<Response> {
  // URLのバリデーション
  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    throw new Error(`Invalid URL: URL is required and must be a non-empty string. Received: ${JSON.stringify(url)}`);
  }

  // URLが有効な形式か確認
  let urlObj: URL;
  try {
    urlObj = new URL(url);
  } catch (urlError) {
    throw new Error(`Invalid URL format: ${url}. Error: ${urlError instanceof Error ? urlError.message : String(urlError)}`);
  }
  // urlObjは使用しないが、URL検証のために必要
  void urlObj;

  const {retry = {maxRetries: 2, delayMs: 500}, timeoutMs = 15000} = options;
  const startedAt = Date.now();

  // CSRF対策: リクエストIDを生成してヘッダーに追加
  const requestId = generateRequestId();
  const enhancedInit: RequestInit | undefined = init ? {
    ...init,
    headers: {
      ...(init.headers || {}),
      'X-Request-ID': requestId,
      'X-Request-Timestamp': String(startedAt),
    },
  } : {
    headers: {
      'X-Request-ID': requestId,
      'X-Request-Timestamp': String(startedAt),
    },
  };

  // 証明書ピニングを使用（本番環境のみ）
  const fetchFn = env.isProduction
    ? () => fetchWithCertificatePinning(url, enhancedInit)
    : () => fetch(url, enhancedInit);

  const fn = fetchFn;
  return withRetryAndTimeout(fn, retry, timeoutMs).then(response => {
    const duration = Date.now() - startedAt;
    const method = (init && (init as any).method) || 'GET';
    if (metricsHandler) {
      metricsHandler({
        url,
        method,
        status: (response as any).status,
        durationMs: duration,
      });
    } else {
      const isDev = (typeof __DEV__ !== 'undefined' && __DEV__) || process.env.NODE_ENV !== 'production';
      if (isDev) {
        // デフォルトの軽量ログ（開発時のみ）

        console.debug(`[api] ${method} ${url} -> ${(response as any).status} (${duration}ms)`);
      }
    }
    return response;
  });
}

/**
 * response.ok を保証し、エラー時は詳細つきでErrorを投げる
 */
export async function ensureOk(response: Response): Promise<void> {
  if (response.ok) return;
  try {
    const data = await (response as any).json?.();
    if (data && typeof data.status === 'number' && data.message) {
      // Notion API 互換のメッセージ形式
      throw new Error(`Notion API error: ${data.status} - ${data.message}`);
    }
    const message = data?.message || (response as any).statusText || 'HTTP error';
    throw new Error(`HTTP ${response.status}: ${message}`);
  } catch (err) {
    // tryブロック内でスローされたErrorはそのまま再スロー
    if (err instanceof Error && err.message.startsWith('Notion API error:')) {
      throw err;
    }
    if (err instanceof Error && err.message.startsWith('HTTP')) {
      throw err;
    }
    // JSONパースエラーなど、それ以外の場合のみstatusTextを使用
    throw new Error(`HTTP ${response.status}: ${(response as any).statusText || 'Unknown error'}`);
  }
}


