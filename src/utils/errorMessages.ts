/**
 * エラーメッセージ一元管理
 * ユーザーフレンドリーなエラーメッセージを提供
 * i18nextを使用して多言語対応
 */

import i18n from '@/config/i18n';

export enum ErrorType {
  // ネットワークエラー
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',

  // 認証エラー
  AUTH_INVALID_TOKEN = 'AUTH_INVALID_TOKEN',
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  AUTH_UNAUTHORIZED = 'AUTH_UNAUTHORIZED',

  // データベースエラー
  DATABASE_NOT_FOUND = 'DATABASE_NOT_FOUND',
  DATABASE_ACCESS_DENIED = 'DATABASE_ACCESS_DENIED',

  // パッケージエラー
  PACKAGE_NOT_FOUND = 'PACKAGE_NOT_FOUND',
  PACKAGE_ALREADY_EXISTS = 'PACKAGE_ALREADY_EXISTS',
  PACKAGE_INVALID_MAPPING = 'PACKAGE_INVALID_MAPPING',

  // スキャンエラー
  SCAN_BARCODE_NOT_FOUND = 'SCAN_BARCODE_NOT_FOUND',
  SCAN_API_ERROR = 'SCAN_API_ERROR',
  SCAN_NO_CONFIG = 'SCAN_NO_CONFIG',
  SCAN_BOOK_NOT_FOUND = 'SCAN_BOOK_NOT_FOUND',
  SCAN_INVALID_BARCODE = 'SCAN_INVALID_BARCODE',

  // 設定エラー
  CONFIG_NOT_FOUND = 'CONFIG_NOT_FOUND',
  CONFIG_INVALID = 'CONFIG_INVALID',
  CONFIG_NOTION_TOKEN_REQUIRED = 'CONFIG_NOTION_TOKEN_REQUIRED',
  CONFIG_DATABASE_ID_REQUIRED = 'CONFIG_DATABASE_ID_REQUIRED',
  CONFIG_DATABASE_ID_INVALID = 'CONFIG_DATABASE_ID_INVALID',
  CONFIG_PROPERTY_MAPPING_INCOMPLETE = 'CONFIG_PROPERTY_MAPPING_INCOMPLETE',

  // ストレージエラー
  STORAGE_READ_ERROR = 'STORAGE_READ_ERROR',
  STORAGE_WRITE_ERROR = 'STORAGE_WRITE_ERROR',

  // 汎用エラー
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

interface ErrorMessage {
  title: string;
  message: string;
  suggestedAction?: string;
}

const ERROR_MESSAGES: Record<ErrorType, ErrorMessage> = {
  // ネットワークエラー
  [ErrorType.NETWORK_ERROR]: {
    title: 'ネットワークエラー',
    message: 'インターネット接続を確認してください',
    suggestedAction: 'Wi-Fiまたはモバイルデータ接続を確認して、再試行してください',
  },
  [ErrorType.TIMEOUT_ERROR]: {
    title: 'タイムアウト',
    message: '接続がタイムアウトしました',
    suggestedAction: '時間をおいて再試行してください',
  },
  [ErrorType.SERVER_ERROR]: {
    title: 'サーバーエラー',
    message: 'サーバーで問題が発生しています',
    suggestedAction: 'しばらく時間をおいて再試行してください',
  },

  // 認証エラー
  [ErrorType.AUTH_INVALID_TOKEN]: {
    title: '認証エラー',
    message: 'Notion Integration Tokenが無効です',
    suggestedAction: '正しいトークンを入力してください',
  },
  [ErrorType.AUTH_TOKEN_EXPIRED]: {
    title: '認証期限切れ',
    message: 'Notion Integration Tokenの有効期限が切れています',
    suggestedAction: '再度ログインしてください',
  },
  [ErrorType.AUTH_UNAUTHORIZED]: {
    title: 'アクセス権限なし',
    message: 'このリソースにアクセスする権限がありません',
    suggestedAction: 'Notion側でIntegrationの権限を確認してください',
  },

  // データベースエラー
  [ErrorType.DATABASE_NOT_FOUND]: {
    title: 'データベースが見つかりません',
    message: '指定されたNotionデータベースが見つかりません',
    suggestedAction: 'データベースが削除されていないか、Integrationに共有されているか確認してください',
  },
  [ErrorType.DATABASE_ACCESS_DENIED]: {
    title: 'データベースアクセス拒否',
    message: 'データベースへのアクセスが拒否されました',
    suggestedAction: 'Notion側でデータベースをIntegrationに共有してください',
  },

  // パッケージエラー
  [ErrorType.PACKAGE_NOT_FOUND]: {
    title: 'パッケージが見つかりません',
    message: '指定されたパッケージが見つかりません',
    suggestedAction: 'パッケージ一覧から再度選択してください',
  },
  [ErrorType.PACKAGE_ALREADY_EXISTS]: {
    title: 'パッケージが既に存在します',
    message: '同じ名前のパッケージが既に存在します',
    suggestedAction: '別の名前を使用してください',
  },
  [ErrorType.PACKAGE_INVALID_MAPPING]: {
    title: '無効なプロパティマッピング',
    message: 'プロパティマッピングが正しく設定されていません',
    suggestedAction: '必須フィールド（タイトル、バーコード）のマッピングを設定してください',
  },

  // スキャンエラー
  [ErrorType.SCAN_BARCODE_NOT_FOUND]: {
    title: '書籍情報が見つかりません',
    message: 'スキャンしたバーコードの情報が見つかりませんでした',
    suggestedAction: '別の書籍をスキャンするか、手動で情報を入力してください',
  },
  [ErrorType.SCAN_API_ERROR]: {
    title: '書籍情報取得エラー',
    message: '書籍情報の取得中にエラーが発生しました',
    suggestedAction: '時間をおいて再試行してください',
  },
  [ErrorType.SCAN_NO_CONFIG]: {
    title: '設定が完了していません',
    message: '設定が完了していません。設定画面から必要な情報を入力してください。',
    suggestedAction: '設定画面でNotion Token、データベースID、プロパティマッピングを設定してください',
  },
  [ErrorType.SCAN_BOOK_NOT_FOUND]: {
    title: '書籍情報が見つかりません',
    message: '書籍情報が見つかりませんでした（ISBN: {isbn}）',
    suggestedAction: '別の書籍をスキャンするか、手動で情報を入力してください',
  },
  [ErrorType.SCAN_INVALID_BARCODE]: {
    title: 'バーコードの形式が正しくありません',
    message: 'バーコードの形式が正しくありません',
    suggestedAction: '正しいISBNバーコードをスキャンしてください',
  },

  // 設定エラー
  [ErrorType.CONFIG_NOT_FOUND]: {
    title: '設定が見つかりません',
    message: '設定が見つかりません。設定画面から必要な情報を入力してください。',
    suggestedAction: '設定画面でNotion Token、データベースID、プロパティマッピングを設定してください',
  },
  [ErrorType.CONFIG_INVALID]: {
    title: '設定エラー',
    message: '設定エラー: {errors}',
    suggestedAction: '設定画面で設定を確認してください',
  },
  [ErrorType.CONFIG_NOTION_TOKEN_REQUIRED]: {
    title: 'Notion Tokenが入力されていません',
    message: 'Notion Tokenが入力されていません',
    suggestedAction: '設定画面でNotion Integration Tokenを入力してください',
  },
  [ErrorType.CONFIG_DATABASE_ID_REQUIRED]: {
    title: 'データベースIDが入力されていません',
    message: 'データベースIDが入力されていません',
    suggestedAction: '設定画面でデータベースIDを入力してください',
  },
  [ErrorType.CONFIG_DATABASE_ID_INVALID]: {
    title: 'データベースIDの形式が正しくありません',
    message: 'データベースIDの形式が正しくありません',
    suggestedAction: '正しいUUID形式のデータベースIDを入力してください',
  },
  [ErrorType.CONFIG_PROPERTY_MAPPING_INCOMPLETE]: {
    title: 'プロパティマッピングが不完全です',
    message: 'プロパティマッピングが不完全です',
    suggestedAction: '設定画面で全てのプロパティマッピングを設定してください',
  },

  // ストレージエラー
  [ErrorType.STORAGE_READ_ERROR]: {
    title: 'データ読み込みエラー',
    message: 'ローカルデータの読み込みに失敗しました',
    suggestedAction: 'アプリを再起動してください',
  },
  [ErrorType.STORAGE_WRITE_ERROR]: {
    title: 'データ保存エラー',
    message: 'ローカルデータの保存に失敗しました',
    suggestedAction: 'ストレージの空き容量を確認してください',
  },

  // 汎用エラー
  [ErrorType.UNKNOWN_ERROR]: {
    title: '予期しないエラー',
    message: '予期しないエラーが発生しました',
    suggestedAction: 'アプリを再起動して再試行してください',
  },
};

/**
 * エラーメッセージを取得
 *
 * @param errorType - エラータイプ
 * @returns エラーメッセージ
 */
export function getErrorMessage(errorType: ErrorType): ErrorMessage {
  // i18nextが初期化されていない場合はフォールバック
  if (!i18n.isInitialized) {
    return ERROR_MESSAGES[errorType];
  }

  const errorKeyMap: Record<ErrorType, string> = {
    [ErrorType.NETWORK_ERROR]: 'errors:networkError',
    [ErrorType.TIMEOUT_ERROR]: 'errors:timeout',
    [ErrorType.SERVER_ERROR]: 'errors:serverError',
    [ErrorType.AUTH_INVALID_TOKEN]: 'errors:authInvalidToken',
    [ErrorType.AUTH_TOKEN_EXPIRED]: 'errors:authTokenExpired',
    [ErrorType.AUTH_UNAUTHORIZED]: 'errors:authUnauthorized',
    [ErrorType.DATABASE_NOT_FOUND]: 'errors:databaseNotFound',
    [ErrorType.DATABASE_ACCESS_DENIED]: 'errors:databaseAccessDenied',
    [ErrorType.PACKAGE_NOT_FOUND]: 'errors:scanBarcodeNotFound',
    [ErrorType.PACKAGE_ALREADY_EXISTS]: 'errors:scanBarcodeNotFound',
    [ErrorType.PACKAGE_INVALID_MAPPING]: 'errors:configPropertyMappingIncomplete',
    [ErrorType.SCAN_BARCODE_NOT_FOUND]: 'errors:scanBarcodeNotFound',
    [ErrorType.SCAN_API_ERROR]: 'errors:scanApiError',
    [ErrorType.SCAN_NO_CONFIG]: 'errors:scanNoConfig',
    [ErrorType.SCAN_BOOK_NOT_FOUND]: 'errors:scanBookNotFound',
    [ErrorType.SCAN_INVALID_BARCODE]: 'errors:scanInvalidBarcode',
    [ErrorType.CONFIG_NOT_FOUND]: 'errors:configNotFound',
    [ErrorType.CONFIG_INVALID]: 'errors:configInvalid',
    [ErrorType.CONFIG_NOTION_TOKEN_REQUIRED]: 'errors:configNotionTokenRequired',
    [ErrorType.CONFIG_DATABASE_ID_REQUIRED]: 'errors:configDatabaseIdRequired',
    [ErrorType.CONFIG_DATABASE_ID_INVALID]: 'errors:configDatabaseIdInvalid',
    [ErrorType.CONFIG_PROPERTY_MAPPING_INCOMPLETE]: 'errors:configPropertyMappingIncomplete',
    [ErrorType.STORAGE_READ_ERROR]: 'errors:storageReadError',
    [ErrorType.STORAGE_WRITE_ERROR]: 'errors:storageWriteError',
    [ErrorType.UNKNOWN_ERROR]: 'errors:unknownError',
  };

  const baseKey = errorKeyMap[errorType];
  return {
    title: i18n.t(`${baseKey}`) || ERROR_MESSAGES[errorType].title,
    message: i18n.t(`${baseKey}Message`) || ERROR_MESSAGES[errorType].message,
    suggestedAction: i18n.t(`${baseKey}Action`) || ERROR_MESSAGES[errorType].suggestedAction,
  };
}

/**
 * Errorオブジェクトからエラータイプを推測
 *
 * @param error - Errorオブジェクト
 * @returns 推測されたエラータイプ
 */
export function detectErrorType(error: Error): ErrorType {
  const message = error.message.toLowerCase();

  // ネットワークエラー
  if (message.includes('network')) return ErrorType.NETWORK_ERROR;
  if (message.includes('timeout')) return ErrorType.TIMEOUT_ERROR;
  if (message.includes('500') || message.includes('502') || message.includes('503')) {
    return ErrorType.SERVER_ERROR;
  }

  // 認証エラー
  if (message.includes('invalid') && message.includes('token')) {
    return ErrorType.AUTH_INVALID_TOKEN;
  }
  if (message.includes('unauthorized') || message.includes('401')) {
    return ErrorType.AUTH_UNAUTHORIZED;
  }

  // データベースエラー
  if (message.includes('database not found') || message.includes('404')) {
    return ErrorType.DATABASE_NOT_FOUND;
  }
  if (message.includes('access denied') || message.includes('403')) {
    return ErrorType.DATABASE_ACCESS_DENIED;
  }

  // スキャンエラー
  if (message.includes('book not found') || message.includes('barcode')) {
    return ErrorType.SCAN_BARCODE_NOT_FOUND;
  }

  // ストレージエラー
  if (message.includes('storage') && message.includes('read')) {
    return ErrorType.STORAGE_READ_ERROR;
  }
  if (message.includes('storage') && message.includes('write')) {
    return ErrorType.STORAGE_WRITE_ERROR;
  }

  return ErrorType.UNKNOWN_ERROR;
}

/**
 * エラーからユーザーフレンドリーなメッセージを取得
 *
 * @param error - Errorオブジェクトまたはエラーメッセージ
 * @returns ユーザーフレンドリーなエラーメッセージ
 */
export function getUserFriendlyErrorMessage(
  error: Error | string,
): ErrorMessage {
  if (typeof error === 'string') {
    const errorTitle = i18n.isInitialized ? i18n.t('common:error') : 'エラー';
    return {
      title: errorTitle,
      message: error,
    };
  }

  const errorType = detectErrorType(error);
  return getErrorMessage(errorType);
}

/**
 * エラーメッセージをフォーマット
 *
 * @param errorMessage - エラーメッセージ
 * @returns フォーマットされたメッセージ
 */
export function formatErrorMessage(errorMessage: ErrorMessage): string {
  let formatted = errorMessage.message;

  if (errorMessage.suggestedAction) {
    formatted += `\n\n${errorMessage.suggestedAction}`;
  }

  return formatted;
}

/**
 * Notion APIとOpenBD API専用のユーザーフレンドリーなエラーメッセージ
 */
export const USER_FRIENDLY_ERRORS = {
  NOTION_AUTH_FAILED: 'Notion認証に失敗しました。トークンを確認してください。',
  NOTION_DB_NOT_FOUND:
    'データベースが見つかりません。データベースIDを確認してください。',
  NOTION_NETWORK_ERROR: 'ネットワークエラーが発生しました。接続を確認してください。',
  NOTION_RATE_LIMIT: 'リクエストが多すぎます。しばらく待ってから再試行してください。',
  OPENBD_NOT_FOUND: '書籍情報が見つかりませんでした。',
  OPENBD_TIMEOUT: '書籍情報の取得がタイムアウトしました。',
} as const;
