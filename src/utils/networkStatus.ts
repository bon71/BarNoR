/**
 * ネットワーク状態監視ユーティリティ
 * オフライン検知とネットワーク状態の管理
 */

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
}

/**
 * ネットワーク状態を取得
 * React NativeのNetInfoを使用する場合は、この関数を拡張してください
 * 現在はfetchを使用した簡易的なチェックを実装
 */
export async function checkNetworkStatus(): Promise<NetworkState> {
  try {
    // 簡易的なネットワークチェック（実際の実装では@react-native-community/netinfoを使用推奨）
    await fetch('https://www.google.com/favicon.ico', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache',
    });
    return {
      isConnected: true,
      isInternetReachable: true,
      type: 'unknown',
    };
  } catch (error) {
    return {
      isConnected: false,
      isInternetReachable: false,
      type: null,
    };
  }
}

/**
 * ネットワークエラーかどうかを判定
 */
export function isNetworkError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('timeout') ||
    message.includes('connection') ||
    message.includes('offline')
  );
}


