/**
 * errorMessages.ts のテスト
 * エラーメッセージ一元管理のテスト
 */

import {
  ErrorType,
  getErrorMessage,
  detectErrorType,
  getUserFriendlyErrorMessage,
  formatErrorMessage,
} from '@/utils/errorMessages';
import i18n from 'i18next';

jest.mock('i18next', () => ({
  t: jest.fn((...args: any[]) => {
    const key = typeof args[0] === 'string' ? args[0] : args[0][0];
    return key;
  }),
  isInitialized: false,
  language: 'ja',
}));

const mockI18n = i18n as jest.Mocked<typeof i18n>;

describe('errorMessages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockI18n.isInitialized = false;
    mockI18n.t.mockImplementation((...args: any[]) => {
      const key = typeof args[0] === 'string' ? args[0] : args[0][0];
      return key;
    });
  });

  describe('getErrorMessage', () => {
    it('ネットワークエラーのメッセージを返す', () => {
      const message = getErrorMessage(ErrorType.NETWORK_ERROR);

      expect(message.title).toBe('ネットワークエラー');
      expect(message.message).toBe('インターネット接続を確認してください');
      expect(message.suggestedAction).toBeDefined();
    });

    it('タイムアウトエラーのメッセージを返す', () => {
      const message = getErrorMessage(ErrorType.TIMEOUT_ERROR);

      expect(message.title).toBe('タイムアウト');
      expect(message.message).toBe('接続がタイムアウトしました');
    });

    it('認証エラーのメッセージを返す', () => {
      const message = getErrorMessage(ErrorType.AUTH_INVALID_TOKEN);

      expect(message.title).toBe('認証エラー');
      expect(message.message).toBe('Notion Integration Tokenが無効です');
    });

    it('データベースエラーのメッセージを返す', () => {
      const message = getErrorMessage(ErrorType.DATABASE_NOT_FOUND);

      expect(message.title).toBe('データベースが見つかりません');
      expect(message.message).toBe(
        '指定されたNotionデータベースが見つかりません',
      );
    });

    it('パッケージエラーのメッセージを返す', () => {
      const message = getErrorMessage(ErrorType.PACKAGE_NOT_FOUND);

      expect(message.title).toBe('パッケージが見つかりません');
      expect(message.message).toBe('指定されたパッケージが見つかりません');
    });

    it('スキャンエラーのメッセージを返す', () => {
      const message = getErrorMessage(ErrorType.SCAN_BARCODE_NOT_FOUND);

      expect(message.title).toBe('書籍情報が見つかりません');
      expect(message.message).toBe(
        'スキャンしたバーコードの情報が見つかりませんでした',
      );
    });

    it('ストレージエラーのメッセージを返す', () => {
      const message = getErrorMessage(ErrorType.STORAGE_READ_ERROR);

      expect(message.title).toBe('データ読み込みエラー');
      expect(message.message).toBe('ローカルデータの読み込みに失敗しました');
    });

    it('未知のエラーのメッセージを返す', () => {
      const message = getErrorMessage(ErrorType.UNKNOWN_ERROR);

      expect(message.title).toBe('予期しないエラー');
      expect(message.message).toBe('予期しないエラーが発生しました');
    });

    describe('i18nextが初期化済みの場合', () => {
      beforeEach(() => {
        mockI18n.isInitialized = true;
        mockI18n.t.mockImplementation((...args: any[]) => {
          const key = typeof args[0] === 'string' ? args[0] : args[0][0];
          // 翻訳キーを返す（実際の翻訳はモック）
          const translations: Record<string, string> = {
            'errors:networkError': 'ネットワークエラー',
            'errors:networkErrorMessage': 'インターネット接続を確認してください',
            'errors:networkErrorAction': 'Wi-Fiまたはモバイルデータ接続を確認して、再試行してください',
            'errors:timeout': 'タイムアウト',
            'errors:timeoutMessage': '接続がタイムアウトしました',
            'errors:timeoutAction': '時間をおいて再試行してください',
            'errors:authInvalidToken': '認証エラー',
            'errors:authInvalidTokenMessage': 'Notion Integration Tokenが無効です',
            'errors:unknownError': '予期しないエラー',
            'errors:unknownErrorMessage': '予期しないエラーが発生しました',
            'common:error': 'エラー',
          };
          return translations[key] || key;
        });
      });

      it('i18nextが初期化済みの場合、翻訳キーを使用する', () => {
        const message = getErrorMessage(ErrorType.NETWORK_ERROR);

        expect(mockI18n.t).toHaveBeenCalledWith('errors:networkError');
        expect(message.title).toBe('ネットワークエラー');
        expect(message.message).toBe('インターネット接続を確認してください');
      });

      it('翻訳キーが存在しない場合、フォールバックメッセージを使用する', () => {
        mockI18n.t.mockReturnValue(''); // 空文字列を返す（翻訳が見つからない）

        const message = getErrorMessage(ErrorType.NETWORK_ERROR);

        // フォールバックメッセージが使用される
        expect(message.title).toBeDefined();
        expect(message.message).toBeDefined();
      });
    });

    describe('i18nextが未初期化の場合', () => {
      beforeEach(() => {
        mockI18n.isInitialized = false;
      });

      it('i18nextが未初期化の場合、フォールバックメッセージを使用する', () => {
        const message = getErrorMessage(ErrorType.NETWORK_ERROR);

        expect(message.title).toBe('ネットワークエラー');
        expect(message.message).toBe('インターネット接続を確認してください');
        expect(mockI18n.t).not.toHaveBeenCalled();
      });
    });
  });

  describe('detectErrorType', () => {
    it('ネットワークエラーを検出する', () => {
      const error = new Error('Network connection failed');
      const type = detectErrorType(error);

      expect(type).toBe(ErrorType.NETWORK_ERROR);
    });

    it('タイムアウトエラーを検出する', () => {
      const error = new Error('Request timeout after 30s');
      const type = detectErrorType(error);

      expect(type).toBe(ErrorType.TIMEOUT_ERROR);
    });

    it('500エラーを検出する', () => {
      const error = new Error('Server error: 500');
      const type = detectErrorType(error);

      expect(type).toBe(ErrorType.SERVER_ERROR);
    });

    it('502エラーを検出する', () => {
      const error = new Error('Bad Gateway 502');
      const type = detectErrorType(error);

      expect(type).toBe(ErrorType.SERVER_ERROR);
    });

    it('503エラーを検出する', () => {
      const error = new Error('Service Unavailable 503');
      const type = detectErrorType(error);

      expect(type).toBe(ErrorType.SERVER_ERROR);
    });

    it('無効なトークンエラーを検出する', () => {
      const error = new Error('Invalid token provided');
      const type = detectErrorType(error);

      expect(type).toBe(ErrorType.AUTH_INVALID_TOKEN);
    });

    it('401認証エラーを検出する', () => {
      const error = new Error('Unauthorized 401');
      const type = detectErrorType(error);

      expect(type).toBe(ErrorType.AUTH_UNAUTHORIZED);
    });

    it('unauthorizedエラーを検出する', () => {
      const error = new Error('User is unauthorized');
      const type = detectErrorType(error);

      expect(type).toBe(ErrorType.AUTH_UNAUTHORIZED);
    });

    it('404データベース未検出エラーを検出する', () => {
      const error = new Error('Database not found (404)');
      const type = detectErrorType(error);

      expect(type).toBe(ErrorType.DATABASE_NOT_FOUND);
    });

    it('403アクセス拒否エラーを検出する', () => {
      const error = new Error('Access denied 403');
      const type = detectErrorType(error);

      expect(type).toBe(ErrorType.DATABASE_ACCESS_DENIED);
    });

    it('バーコード未検出エラーを検出する', () => {
      const error = new Error('Book not found for barcode 1234567890');
      const type = detectErrorType(error);

      expect(type).toBe(ErrorType.SCAN_BARCODE_NOT_FOUND);
    });

    it('ストレージ読み込みエラーを検出する', () => {
      const error = new Error('Failed to read from storage');
      const type = detectErrorType(error);

      expect(type).toBe(ErrorType.STORAGE_READ_ERROR);
    });

    it('ストレージ書き込みエラーを検出する', () => {
      const error = new Error('Failed to write to storage');
      const type = detectErrorType(error);

      expect(type).toBe(ErrorType.STORAGE_WRITE_ERROR);
    });

    it('未知のエラーの場合はUNKNOWN_ERRORを返す', () => {
      const error = new Error('Some random error');
      const type = detectErrorType(error);

      expect(type).toBe(ErrorType.UNKNOWN_ERROR);
    });

    it('大文字小文字を区別せずに検出する', () => {
      const error = new Error('NETWORK ERROR OCCURRED');
      const type = detectErrorType(error);

      expect(type).toBe(ErrorType.NETWORK_ERROR);
    });
  });

  describe('getUserFriendlyErrorMessage', () => {
    it('Errorオブジェクトからユーザーフレンドリーなメッセージを生成する', () => {
      const error = new Error('Network connection failed');
      const message = getUserFriendlyErrorMessage(error);

      expect(message.title).toBe('ネットワークエラー');
      expect(message.message).toBe('インターネット接続を確認してください');
      expect(message.suggestedAction).toBeDefined();
    });

    it('文字列エラーからメッセージを生成する', () => {
      mockI18n.isInitialized = false;
      const message = getUserFriendlyErrorMessage('カスタムエラーメッセージ');

      expect(message.title).toBe('エラー');
      expect(message.message).toBe('カスタムエラーメッセージ');
      expect(message.suggestedAction).toBeUndefined();
    });

    it('i18nextが初期化済みの場合、文字列エラーのタイトルも翻訳される', () => {
      mockI18n.isInitialized = true;
      mockI18n.t.mockImplementation((...args: any[]) => {
        const key = typeof args[0] === 'string' ? args[0] : args[0][0];
        if (key === 'common:error') return 'エラー';
        return key;
      });

      const message = getUserFriendlyErrorMessage('カスタムエラーメッセージ');

      expect(mockI18n.t).toHaveBeenCalledWith('common:error');
      expect(message.title).toBe('エラー');
      expect(message.message).toBe('カスタムエラーメッセージ');
    });

    it('タイムアウトエラーからメッセージを生成する', () => {
      const error = new Error('timeout occurred');
      const message = getUserFriendlyErrorMessage(error);

      expect(message.title).toBe('タイムアウト');
      expect(message.message).toBe('接続がタイムアウトしました');
    });

    it('認証エラーからメッセージを生成する', () => {
      const error = new Error('Invalid token provided');
      const message = getUserFriendlyErrorMessage(error);

      expect(message.title).toBe('認証エラー');
      expect(message.message).toBe('Notion Integration Tokenが無効です');
    });

    it('複数のエラーパターンを正しく処理する', () => {
      const errors = [
        {error: new Error('Network failed'), expectedTitle: 'ネットワークエラー'},
        {error: new Error('timeout occurred'), expectedTitle: 'タイムアウト'},
        {error: new Error('500 Internal Server Error'), expectedTitle: 'サーバーエラー'},
        {error: new Error('Database not found'), expectedTitle: 'データベースが見つかりません'},
      ];

      errors.forEach(({error, expectedTitle}) => {
        const message = getUserFriendlyErrorMessage(error);
        expect(message.title).toBe(expectedTitle);
      });
    });
  });

  describe('formatErrorMessage', () => {
    it('メッセージのみをフォーマットする', () => {
      const errorMessage = {
        title: 'エラー',
        message: 'エラーが発生しました',
      };

      const formatted = formatErrorMessage(errorMessage);

      expect(formatted).toBe('エラーが発生しました');
    });

    it('メッセージと推奨アクションをフォーマットする', () => {
      const errorMessage = {
        title: 'ネットワークエラー',
        message: 'インターネット接続を確認してください',
        suggestedAction: 'Wi-Fiまたはモバイルデータ接続を確認して、再試行してください',
      };

      const formatted = formatErrorMessage(errorMessage);

      expect(formatted).toBe(
        'インターネット接続を確認してください\n\nWi-Fiまたはモバイルデータ接続を確認して、再試行してください',
      );
    });

    it('推奨アクションがない場合、メッセージのみを返す', () => {
      const errorMessage = {
        title: 'エラー',
        message: 'エラーが発生しました',
        suggestedAction: undefined,
      };

      const formatted = formatErrorMessage(errorMessage);

      expect(formatted).toBe('エラーが発生しました');
    });

    it('全てのエラータイプでフォーマットが正しく動作する', () => {
      const errorTypes = [
        ErrorType.NETWORK_ERROR,
        ErrorType.TIMEOUT_ERROR,
        ErrorType.SERVER_ERROR,
        ErrorType.AUTH_INVALID_TOKEN,
        ErrorType.DATABASE_NOT_FOUND,
        ErrorType.PACKAGE_NOT_FOUND,
        ErrorType.SCAN_BARCODE_NOT_FOUND,
        ErrorType.STORAGE_READ_ERROR,
      ];

      errorTypes.forEach(errorType => {
        const errorMessage = getErrorMessage(errorType);
        const formatted = formatErrorMessage(errorMessage);

        expect(formatted).toContain(errorMessage.message);
        if (errorMessage.suggestedAction) {
          expect(formatted).toContain(errorMessage.suggestedAction);
        }
      });
    });
  });

  describe('統合テスト', () => {
    it('エラー検出からフォーマットまでの完全なフローが動作する', () => {
      const error = new Error('Network connection failed');

      // ステップ1: エラータイプを検出
      const errorType = detectErrorType(error);
      expect(errorType).toBe(ErrorType.NETWORK_ERROR);

      // ステップ2: エラーメッセージを取得
      const errorMessage = getErrorMessage(errorType);
      expect(errorMessage.title).toBe('ネットワークエラー');

      // ステップ3: フォーマット
      const formatted = formatErrorMessage(errorMessage);
      expect(formatted).toContain('インターネット接続を確認してください');
    });

    it('getUserFriendlyErrorMessageとformatErrorMessageの組み合わせ', () => {
      const error = new Error('Request timeout after 30s');

      const friendlyMessage = getUserFriendlyErrorMessage(error);
      const formatted = formatErrorMessage(friendlyMessage);

      expect(formatted).toContain('接続がタイムアウトしました');
      expect(formatted).toContain('時間をおいて再試行してください');
    });

    it('複雑なエラーメッセージからも正しく情報を抽出する', () => {
      const error = new Error(
        'API Error: Request failed with status 503 - Service Temporarily Unavailable',
      );

      const friendlyMessage = getUserFriendlyErrorMessage(error);
      const formatted = formatErrorMessage(friendlyMessage);

      expect(friendlyMessage.title).toBe('サーバーエラー');
      expect(formatted).toContain('サーバーで問題が発生しています');
    });
  });
});
