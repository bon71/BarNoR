/**
 * 暗号化キー管理
 * MMKVストレージの暗号化キーを提供
 *
 * 実装:
 * - 本番環境では react-native-keychain を使用してキーチェーンに保存
 * - 初回起動時にランダムなキーを生成して保存
 * - デバイス固有のIDを組み合わせる
 *
 * 注意: react-native-keychainとreact-native-device-infoは
 * テスト環境では動作しないため、動的インポートを使用
 */

const ENCRYPTION_KEY_SERVICE = 'com.bon71.barno.encryption_key';
const ENCRYPTION_KEY_ACCOUNT = 'mmkv_encryption_key';

/**
 * デバイス固有のIDを取得
 */
async function getDeviceId(): Promise<string> {
  try {
    // 動的インポート（テスト環境でのエラーを避けるため）
    const DeviceInfo = require('react-native-device-info');
    // デバイス固有のIDを取得（iOS: identifierForVendor, Android: AndroidId）
    const deviceId = await DeviceInfo.getUniqueId();
    return deviceId;
  } catch (error) {
    console.warn('[EncryptionKeyManager] Failed to get device ID, using fallback:', error);
    // フォールバック: 固定値を使用（開発環境のみ）
    return 'fallback-device-id';
  }
}

/**
 * ランダムなキーを生成
 */
function generateRandomKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = '';
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

/**
 * デバイス固有のキーを生成
 */
async function generateDeviceSpecificKey(): Promise<string> {
  const deviceId = await getDeviceId();
  const randomPart = generateRandomKey();
  // デバイスIDとランダムな部分を組み合わせてキーを生成
  return `${deviceId}_${randomPart}`;
}

/**
 * キーチェーンから暗号化キーを取得
 */
async function getKeyFromKeychain(): Promise<string | null> {
  try {
    // 動的インポート（テスト環境でのエラーを避けるため）
    const Keychain = require('react-native-keychain');
    const credentials = await Keychain.getGenericPassword({
      service: ENCRYPTION_KEY_SERVICE,
    });
    if (credentials && credentials.password) {
      return credentials.password;
    }
    return null;
  } catch (error) {
    console.error('[EncryptionKeyManager] Failed to get key from keychain:', error);
    return null;
  }
}

/**
 * キーチェーンに暗号化キーを保存
 */
async function saveKeyToKeychain(key: string): Promise<boolean> {
  try {
    // 動的インポート（テスト環境でのエラーを避けるため）
    const Keychain = require('react-native-keychain');
    await Keychain.setGenericPassword(ENCRYPTION_KEY_ACCOUNT, key, {
      service: ENCRYPTION_KEY_SERVICE,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    return true;
  } catch (error) {
    console.error('[EncryptionKeyManager] Failed to save key to keychain:', error);
    return false;
  }
}

/**
 * 暗号化キーを取得
 *
 * 実装:
 * 1. キーチェーンから既存のキーを取得を試みる
 * 2. キーが存在しない場合は、デバイス固有のキーを生成して保存
 * 3. 開発環境では固定キーを使用（フォールバック）
 *
 * @returns 暗号化キー（16文字以上の文字列）
 */
export const getEncryptionKey = async (): Promise<string> => {
  const isDev = typeof __DEV__ !== 'undefined' && __DEV__;

  // 開発環境では固定キーを使用（パフォーマンスとデバッグのため）
  if (isDev) {
    return 'NotionBarcodeReader_v1_SecureKey_2024';
  }

  // 本番環境ではキーチェーンから取得または生成
  try {
    // キーチェーンから既存のキーを取得
    let key = await getKeyFromKeychain();

    if (!key) {
      // キーが存在しない場合は新規生成
      console.log('[EncryptionKeyManager] Generating new encryption key');
      key = await generateDeviceSpecificKey();

      // キーチェーンに保存
      const saved = await saveKeyToKeychain(key);
      if (!saved) {
        console.warn('[EncryptionKeyManager] Failed to save key to keychain, using generated key');
      }
    }

    return key;
  } catch (error) {
    console.error('[EncryptionKeyManager] Error getting encryption key:', error);
    // エラー時はフォールバックキーを使用
    return 'NotionBarcodeReader_v1_SecureKey_2024_Fallback';
  }
};

/**
 * 同期的に暗号化キーを取得（後方互換性のため）
 * 注意: 本番環境では非推奨。getEncryptionKey()を使用すること
 */
export const getEncryptionKeySync = (): string => {
  const isDev = typeof __DEV__ !== 'undefined' && __DEV__;
  if (isDev) {
    return 'NotionBarcodeReader_v1_SecureKey_2024';
  }
  // 本番環境では警告を出してフォールバックキーを使用
  console.warn('[EncryptionKeyManager] Using sync method in production is not recommended');
  return 'NotionBarcodeReader_v1_SecureKey_2024_Fallback';
};

/**
 * 暗号化キーの検証
 * キーが要件を満たしているか確認
 */
export const validateEncryptionKey = (key: string): boolean => {
  // MMKVの暗号化キーは最低16文字必要
  return key.length >= 16;
};
