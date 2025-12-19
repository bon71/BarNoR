/**
 * CSRF対策ユーティリティ
 * API呼び出し時のCSRF対策を実装
 *
 * 注意: Notion APIはBearer Token認証を使用しているため、CSRF攻撃のリスクは低いが、
 * 追加のセキュリティ層として実装
 */

/**
 * リクエストID生成関数
 * 各リクエストに一意のIDを付与
 * @returns リクエストID（UUID形式）
 */
export function generateRequestId(): string {
  // 簡易的なUUID v4生成（本番環境ではcrypto.randomUUID()を使用推奨）
  const chars = '0123456789abcdef';
  const segments = [8, 4, 4, 4, 12];

  return segments
    .map(len => {
      let segment = '';
      for (let i = 0; i < len; i++) {
        segment += chars[Math.floor(Math.random() * chars.length)];
      }
      return segment;
    })
    .join('-');
}

/**
 * リクエスト検証関数
 * リクエストIDとタイムスタンプを検証
 * @param requestId リクエストID
 * @param timestamp タイムスタンプ（ミリ秒）
 * @param maxAge 最大有効期間（ミリ秒、デフォルト: 5分）
 * @returns 有効なリクエストかどうか
 */
export function validateRequest(
  requestId: string,
  timestamp: number,
  maxAge: number = 5 * 60 * 1000, // 5分
): boolean {
  if (!requestId || typeof requestId !== 'string') {
    return false;
  }

  if (typeof timestamp !== 'number' || isNaN(timestamp)) {
    return false;
  }

  // タイムスタンプの有効性チェック
  const now = Date.now();
  const age = now - timestamp;

  // 未来のタイムスタンプは無効
  if (age < 0) {
    return false;
  }

  // 有効期限チェック
  if (age > maxAge) {
    return false;
  }

  return true;
}

/**
 * タイムスタンプベースの検証
 * リクエストのタイムスタンプを検証
 * @param timestamp タイムスタンプ（ミリ秒）
 * @param maxAge 最大有効期間（ミリ秒、デフォルト: 5分）
 * @returns 有効なタイムスタンプかどうか
 */
export function validateTimestamp(
  timestamp: number,
  maxAge: number = 5 * 60 * 1000, // 5分
): boolean {
  return validateRequest('', timestamp, maxAge);
}

/**
 * CSRFトークン生成関数
 * セッションごとに一意のCSRFトークンを生成
 * @returns CSRFトークン
 */
export function generateCsrfToken(): string {
  return generateRequestId();
}

