/**
 * 証明書ピニングユーティリティ
 * HTTPS通信の証明書を固定して、中間者攻撃を防ぐ
 *
 * 注意: 証明書ピニングは本番環境でのみ有効化することを推奨
 * 開発環境では証明書の更新頻度が高いため、証明書ピニングを無効化することを推奨
 *
 * 実装判断:
 * 現時点では証明書ハッシュを設定せず、実装を見送っています。
 * 詳細は docs/security/certificate-pinning-decision.md を参照してください。
 *
 * 将来の実装時:
 * 1. 証明書取得スクリプト（scripts/get-certificate-hash.sh）を実行
 * 2. 取得したハッシュを CERTIFICATE_PINS に設定
 * 3. 本番環境で有効化
 */

// react-native-ssl-pinningは型定義がないため、anyを使用
// 実際の使用時は適切な型定義を追加すること

/**
 * 証明書ピニング設定
 * 各APIの証明書ハッシュを設定
 *
 * 現時点では実装を見送っているため、空の配列のままです。
 * 将来の実装時は、証明書取得スクリプトで取得したハッシュを設定してください。
 *
 * 証明書の取得方法:
 * 1. scripts/get-certificate-hash.sh を実行（作成予定）
 * 2. 出力されたハッシュをここに設定
 * 3. 複数の証明書（中間証明書を含む）を設定することを推奨
 */
const CERTIFICATE_PINS: Record<string, string[]> = {
  'api.notion.com': [
    // Notion APIの証明書ピン（SHA256ハッシュ）
    // 実装判断により、現時点では設定を見送っています
    // 詳細: docs/security/certificate-pinning-decision.md
    // 例: 'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
  ],
  'api.openbd.jp': [
    // OpenBD APIの証明書ピン
    // 実装判断により、現時点では設定を見送っています
    // 詳細: docs/security/certificate-pinning-decision.md
    // 例: 'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=',
  ],
};

/**
 * 証明書ピニング付きfetch
 * @param url リクエストURL
 * @param init リクエストオプション
 * @returns Response
 */
export async function fetchWithCertificatePinning(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  try {
    // URLからホスト名を抽出
    const hostname = new URL(url).hostname;

    // 証明書ピンが設定されている場合は使用
    if (CERTIFICATE_PINS[hostname] && CERTIFICATE_PINS[hostname].length > 0) {
      // react-native-ssl-pinningを使用
      // 注意: 実際の実装では、react-native-ssl-pinningのAPIに合わせて調整が必要
      // 現在は実装の骨組みのみ提供
      const SslPinning = require('react-native-ssl-pinning');

      const method = (init?.method as string) || 'GET';
      const headers = init?.headers as Record<string, string> || {};
      const body = init?.body as string;

      const response = await SslPinning.fetch(url, {
        method,
        headers,
        body,
        sslPinning: {
          certs: CERTIFICATE_PINS[hostname],
        },
        timeoutInterval: 10000,
      });

      // Responseオブジェクトに変換
      return new Response(response.bodyString, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    }

    // 証明書ピンが設定されていない場合は通常のfetchを使用
    // 現時点では実装を見送っているため、証明書ハッシュは設定されていません
    // 詳細: docs/security/certificate-pinning-decision.md
    // 注意: 本番環境ではすべてのAPIに証明書ピンを設定することを推奨（将来の実装時）
    const isProduction = typeof __DEV__ === 'undefined' || !__DEV__;
    if (isProduction) {
      console.warn(`[CertificatePinning] No certificate pin configured for ${hostname}. Using standard HTTPS.`);
    }
    return await global.fetch(url, init);
  } catch (error) {
    console.error('[CertificatePinning] Error:', error);
    // エラー時は通常のfetchにフォールバック
    return await global.fetch(url, init);
  }
}

/**
 * 証明書ピンを設定
 * @param hostname ホスト名
 * @param pins 証明書ピンの配列（SHA256ハッシュ）
 */
export function setCertificatePins(hostname: string, pins: string[]): void {
  CERTIFICATE_PINS[hostname] = pins;
}

/**
 * 証明書ピンを取得
 * @param hostname ホスト名
 * @returns 証明書ピンの配列
 */
export function getCertificatePins(hostname: string): string[] {
  return CERTIFICATE_PINS[hostname] || [];
}

