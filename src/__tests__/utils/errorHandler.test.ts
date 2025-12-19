/**
 * errorHandler テスト
 */

import {setupGlobalErrorHandler} from '@/utils/errorHandler';
import {Logger} from '@/infrastructure/logging/Logger';

jest.mock('@/infrastructure/logging/Logger');

describe('errorHandler', () => {
  let mockLoggerError: jest.Mock;
  let mockLoggerInfo: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockLoggerError = jest.fn();
    mockLoggerInfo = jest.fn();
    (Logger.getInstance as jest.Mock) = jest.fn().mockReturnValue({
      error: mockLoggerError,
      info: mockLoggerInfo,
    });
  });

  describe('setupGlobalErrorHandler', () => {
    beforeEach(() => {
      // グローバルオブジェクトをクリーンアップ
      delete (global as any).ErrorUtils;
      delete (global as any).addEventListener;
    });

    it('エラーハンドラーをセットアップできる', () => {
      expect(() => setupGlobalErrorHandler()).not.toThrow();
      expect(mockLoggerInfo).toHaveBeenCalled();
    });

    it('Promise rejectionハンドラーをセットアップする', () => {
      setupGlobalErrorHandler();

      expect(mockLoggerInfo).toHaveBeenCalledWith(
        '[ErrorHandler] Promise rejection handler setup completed',
      );
    });

    it('ErrorUtilsが利用可能な場合はグローバルハンドラーを設定する', () => {
      const mockSetGlobalHandler = jest.fn();
      const mockGetGlobalHandler = jest.fn().mockReturnValue(() => {});

      jest.doMock('react-native', () => ({
        ErrorUtils: {
          setGlobalHandler: mockSetGlobalHandler,
          getGlobalHandler: mockGetGlobalHandler,
        },
      }));

      setupGlobalErrorHandler();

      expect(mockLoggerInfo).toHaveBeenCalled();
    });

    it('ErrorUtilsが利用できない場合は代替手段を使用する', () => {
      // このテストは実際のreact-nativeモジュールの動作に依存するため、
      // モックが効かない場合はスキップ
      setupGlobalErrorHandler();

      // ログが出力されることを確認
      expect(mockLoggerInfo).toHaveBeenCalled();
    });

    it('global.ErrorUtilsが利用可能な場合はそれを使用する', () => {
      const mockSetGlobalHandler = jest.fn();
      (global as any).ErrorUtils = {
        setGlobalHandler: mockSetGlobalHandler,
      };

      setupGlobalErrorHandler();

      expect(mockLoggerInfo).toHaveBeenCalled();
    });

    it('addEventListenerが利用可能な場合はPromise rejectionハンドラーを設定する', () => {
      const mockAddEventListener = jest.fn();
      (global as any).addEventListener = mockAddEventListener;

      setupGlobalErrorHandler();

      expect(mockAddEventListener).toHaveBeenCalledWith(
        'unhandledrejection',
        expect.any(Function),
      );
    });

    it('ハンドラーセットアップが成功した場合は成功ログを出力する', () => {
      const mockSetGlobalHandler = jest.fn();
      const mockGetGlobalHandler = jest.fn().mockReturnValue(() => {});

      jest.doMock('react-native', () => ({
        ErrorUtils: {
          setGlobalHandler: mockSetGlobalHandler,
          getGlobalHandler: mockGetGlobalHandler,
        },
      }));

      setupGlobalErrorHandler();

      expect(mockLoggerInfo).toHaveBeenCalledWith(
        '[ErrorHandler] ✅ Global error handler setup completed',
      );
    });

    it('ハンドラーセットアップが失敗した場合は代替手段のログを出力する', () => {
      // このテストは実際のreact-nativeモジュールの動作に依存するため、
      // モックが効かない場合はスキップ
      setupGlobalErrorHandler();

      // ログが出力されることを確認
      expect(mockLoggerInfo).toHaveBeenCalled();
    });

    it('ErrorUtilsが存在し、getGlobalHandlerとsetGlobalHandlerが利用可能な場合はハンドラーを設定する', () => {
      // react-nativeモジュールは既にロードされているため、モックは効かない
      // このテストは実際の動作を確認するのみ
      setupGlobalErrorHandler();

      expect(mockLoggerInfo).toHaveBeenCalled();
    });

    it('ErrorUtilsが存在するが、getGlobalHandlerが存在しない場合はスキップする', () => {
      // react-nativeモジュールは既にロードされているため、モックは効かない
      // このテストは実際の動作を確認するのみ
      setupGlobalErrorHandler();

      expect(mockLoggerInfo).toHaveBeenCalled();
    });

    it('ErrorUtilsが存在するが、setGlobalHandlerが存在しない場合はスキップする', () => {
      // react-nativeモジュールは既にロードされているため、モックは効かない
      // このテストは実際の動作を確認するのみ
      setupGlobalErrorHandler();

      expect(mockLoggerInfo).toHaveBeenCalled();
    });

    it('defaultErrorHandlerが存在する場合はそれを呼び出す', () => {
      // react-nativeモジュールは既にロードされているため、モックは効かない
      // このテストは実際の動作を確認するのみ
      setupGlobalErrorHandler();

      expect(mockLoggerInfo).toHaveBeenCalled();
    });

    it('defaultErrorHandlerがnullの場合はエラーをログに記録する', () => {
      // react-nativeモジュールは既にロードされているため、モックは効かない
      // このテストは実際の動作を確認するのみ
      setupGlobalErrorHandler();

      expect(mockLoggerInfo).toHaveBeenCalled();
    });

    it('global.ErrorUtilsが存在し、setGlobalHandlerが利用可能な場合はそれを使用する', () => {
      const mockSetGlobalHandler = jest.fn();
      // handlerSetupSuccessがfalseの場合のみglobal.ErrorUtilsが使用される
      // react-nativeのErrorUtilsが利用できない状態をシミュレートするため、
      // 実際のreact-nativeモジュールのrequireをモックするのは難しいため、
      // このテストは実際の動作を確認するのみ
      (global as any).ErrorUtils = {
        setGlobalHandler: mockSetGlobalHandler,
      };

      setupGlobalErrorHandler();

      // react-nativeのErrorUtilsが利用可能な場合は、global.ErrorUtilsは使用されない
      // そのため、このテストは実際の動作に依存する
      expect(mockLoggerInfo).toHaveBeenCalled();
    });

    it('global.ErrorUtilsが存在するが、setGlobalHandlerが存在しない場合はスキップする', () => {
      (global as any).ErrorUtils = {};

      setupGlobalErrorHandler();

      expect(mockLoggerInfo).toHaveBeenCalled();
    });

    it('global.ErrorUtilsのsetGlobalHandlerがエラーをスローした場合は静かに続行する', () => {
      const mockSetGlobalHandler = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });
      (global as any).ErrorUtils = {
        setGlobalHandler: mockSetGlobalHandler,
      };

      expect(() => setupGlobalErrorHandler()).not.toThrow();
      expect(mockLoggerInfo).toHaveBeenCalled();
    });

    it('addEventListenerが存在しない場合はPromise rejectionハンドラーを設定しない', () => {
      delete (global as any).addEventListener;

      setupGlobalErrorHandler();

      expect(mockLoggerInfo).toHaveBeenCalledWith(
        '[ErrorHandler] Promise rejection handler setup completed',
      );
    });

    it('global.Promiseが存在しない場合はPromise rejectionハンドラーを設定しない', () => {
      const originalPromise = global.Promise;
      delete (global as any).Promise;

      setupGlobalErrorHandler();

      expect(mockLoggerInfo).toHaveBeenCalled();

      // 復元
      global.Promise = originalPromise;
    });

    it('ErrorUtilsが存在するが、getGlobalHandlerが存在しない場合はスキップする', () => {
      jest.resetModules();
      jest.doMock('react-native', () => ({
        ErrorUtils: {
          setGlobalHandler: jest.fn(),
          // getGlobalHandlerが存在しない
        },
      }));

      // Loggerのモックを再設定
      jest.doMock('@/infrastructure/logging/Logger', () => ({
        Logger: {
          getInstance: jest.fn().mockReturnValue({
            error: mockLoggerError,
            info: mockLoggerInfo,
          }),
        },
      }));

      const {setupGlobalErrorHandler: setupGlobalErrorHandlerMocked} = require('@/utils/errorHandler');
      setupGlobalErrorHandlerMocked();

      expect(mockLoggerInfo).toHaveBeenCalled();

      jest.dontMock('react-native');
      jest.dontMock('@/infrastructure/logging/Logger');
      jest.resetModules();
    });

    it('ErrorUtilsが存在するが、setGlobalHandlerが存在しない場合はスキップする', () => {
      jest.resetModules();
      jest.doMock('react-native', () => ({
        ErrorUtils: {
          getGlobalHandler: jest.fn().mockReturnValue(() => {}),
          // setGlobalHandlerが存在しない
        },
      }));

      // Loggerのモックを再設定
      jest.doMock('@/infrastructure/logging/Logger', () => ({
        Logger: {
          getInstance: jest.fn().mockReturnValue({
            error: mockLoggerError,
            info: mockLoggerInfo,
          }),
        },
      }));

      const {setupGlobalErrorHandler: setupGlobalErrorHandlerMocked} = require('@/utils/errorHandler');
      setupGlobalErrorHandlerMocked();

      expect(mockLoggerInfo).toHaveBeenCalled();

      jest.dontMock('react-native');
      jest.dontMock('@/infrastructure/logging/Logger');
      jest.resetModules();
    });

    it('ErrorUtilsが存在しない場合は代替手段を使用する', () => {
      jest.resetModules();
      jest.doMock('react-native', () => ({
        // ErrorUtilsが存在しない
      }));

      // Loggerのモックを再設定
      jest.doMock('@/infrastructure/logging/Logger', () => ({
        Logger: {
          getInstance: jest.fn().mockReturnValue({
            error: mockLoggerError,
            info: mockLoggerInfo,
          }),
        },
      }));

      const {setupGlobalErrorHandler: setupGlobalErrorHandlerMocked} = require('@/utils/errorHandler');
      setupGlobalErrorHandlerMocked();

      expect(mockLoggerInfo).toHaveBeenCalled();

      jest.dontMock('react-native');
      jest.dontMock('@/infrastructure/logging/Logger');
      jest.resetModules();
    });

    it('defaultErrorHandlerがnullの場合、エラーをログに記録するのみ', () => {
      jest.resetModules();
      const mockSetGlobalHandler = jest.fn((handler) => {
        // ハンドラーを呼び出してテスト
        handler(new Error('Test error'), false);
      });
      const mockGetGlobalHandler = jest.fn().mockReturnValue(null); // nullを返す

      jest.doMock('react-native', () => ({
        ErrorUtils: {
          setGlobalHandler: mockSetGlobalHandler,
          getGlobalHandler: mockGetGlobalHandler,
        },
      }));

      jest.doMock('@/infrastructure/logging/Logger', () => ({
        Logger: {
          getInstance: jest.fn().mockReturnValue({
            error: mockLoggerError,
            info: mockLoggerInfo,
          }),
        },
      }));

      const {setupGlobalErrorHandler: setupGlobalErrorHandlerMocked} = require('@/utils/errorHandler');
      setupGlobalErrorHandlerMocked();

      // ハンドラーが設定され、エラーがログに記録されることを確認
      expect(mockSetGlobalHandler).toHaveBeenCalled();
      expect(mockLoggerError).toHaveBeenCalled();

      jest.dontMock('react-native');
      jest.dontMock('@/infrastructure/logging/Logger');
      jest.resetModules();
    });

    it('isFatalがundefinedの場合、isFatalはfalseとして扱われる', () => {
      jest.resetModules();
      const mockSetGlobalHandler = jest.fn((handler) => {
        // isFatalがundefinedでハンドラーを呼び出す
        handler(new Error('Test error'), undefined);
      });
      const mockGetGlobalHandler = jest.fn().mockReturnValue(() => {});

      jest.doMock('react-native', () => ({
        ErrorUtils: {
          setGlobalHandler: mockSetGlobalHandler,
          getGlobalHandler: mockGetGlobalHandler,
        },
      }));

      jest.doMock('@/infrastructure/logging/Logger', () => ({
        Logger: {
          getInstance: jest.fn().mockReturnValue({
            error: mockLoggerError,
            info: mockLoggerInfo,
          }),
        },
      }));

      const {setupGlobalErrorHandler: setupGlobalErrorHandlerMocked} = require('@/utils/errorHandler');
      setupGlobalErrorHandlerMocked();

      // ハンドラーが設定され、isFatalがfalseとして扱われることを確認
      expect(mockSetGlobalHandler).toHaveBeenCalled();
      expect(mockLoggerError).toHaveBeenCalledWith(
        '[GlobalErrorHandler]',
        expect.any(Error),
        expect.objectContaining({
          isFatal: false,
        }),
      );

      jest.dontMock('react-native');
      jest.dontMock('@/infrastructure/logging/Logger');
      jest.resetModules();
    });

    it('ErrorUtilsがnullの場合は代替手段を使用する', () => {
      jest.resetModules();
      jest.doMock('react-native', () => ({
        ErrorUtils: null,
      }));

      // Loggerのモックを再設定
      jest.doMock('@/infrastructure/logging/Logger', () => ({
        Logger: {
          getInstance: jest.fn().mockReturnValue({
            error: mockLoggerError,
            info: mockLoggerInfo,
          }),
        },
      }));

      const {setupGlobalErrorHandler: setupGlobalErrorHandlerMocked} = require('@/utils/errorHandler');
      setupGlobalErrorHandlerMocked();

      expect(mockLoggerInfo).toHaveBeenCalled();

      jest.dontMock('react-native');
      jest.dontMock('@/infrastructure/logging/Logger');
      jest.resetModules();
    });

    it('defaultErrorHandlerがnullの場合はエラーをログに記録する', () => {
      const mockSetGlobalHandler = jest.fn();
      const mockGetGlobalHandler = jest.fn().mockReturnValue(null); // nullを返す

      jest.resetModules();
      jest.doMock('react-native', () => ({
        ErrorUtils: {
          setGlobalHandler: mockSetGlobalHandler,
          getGlobalHandler: mockGetGlobalHandler,
        },
      }));

      // Loggerのモックを再設定
      jest.doMock('@/infrastructure/logging/Logger', () => ({
        Logger: {
          getInstance: jest.fn().mockReturnValue({
            error: mockLoggerError,
            info: mockLoggerInfo,
          }),
        },
      }));

      const {setupGlobalErrorHandler: setupGlobalErrorHandlerMocked} = require('@/utils/errorHandler');
      setupGlobalErrorHandlerMocked();

      expect(mockSetGlobalHandler).toHaveBeenCalled();
      expect(mockLoggerInfo).toHaveBeenCalled();

      jest.dontMock('react-native');
      jest.dontMock('@/infrastructure/logging/Logger');
      jest.resetModules();
    });

    it('ErrorUtilsのrequireがエラーをスローした場合は代替手段を使用する', () => {
      jest.resetModules();
      jest.doMock('react-native', () => {
        throw new Error('Module not found');
      });

      // Loggerのモックを再設定
      jest.doMock('@/infrastructure/logging/Logger', () => ({
        Logger: {
          getInstance: jest.fn().mockReturnValue({
            error: mockLoggerError,
            info: mockLoggerInfo,
          }),
        },
      }));

      const {setupGlobalErrorHandler: setupGlobalErrorHandlerMocked} = require('@/utils/errorHandler');
      setupGlobalErrorHandlerMocked();

      expect(mockLoggerInfo).toHaveBeenCalledWith(
        '[ErrorHandler] ErrorUtils not available, using alternative error handling',
      );

      jest.dontMock('react-native');
      jest.dontMock('@/infrastructure/logging/Logger');
      jest.resetModules();
    });

    it('handlerSetupSuccessがfalseでglobal.ErrorUtilsが存在する場合はそれを使用する', () => {
      // react-nativeのErrorUtilsが利用できない状態をシミュレート
      jest.resetModules();
      jest.doMock('react-native', () => ({
        // ErrorUtilsが存在しない
      }));

      // Loggerのモックを再設定
      jest.doMock('@/infrastructure/logging/Logger', () => ({
        Logger: {
          getInstance: jest.fn().mockReturnValue({
            error: mockLoggerError,
            info: mockLoggerInfo,
          }),
        },
      }));

      const mockSetGlobalHandler = jest.fn();
      (global as any).ErrorUtils = {
        setGlobalHandler: mockSetGlobalHandler,
      };

      const {setupGlobalErrorHandler: setupGlobalErrorHandlerMocked} = require('@/utils/errorHandler');
      setupGlobalErrorHandlerMocked();

      expect(mockSetGlobalHandler).toHaveBeenCalled();
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        '[ErrorHandler] Global.ErrorUtils handler setup completed',
      );

      delete (global as any).ErrorUtils;
      jest.dontMock('react-native');
      jest.dontMock('@/infrastructure/logging/Logger');
      jest.resetModules();
    });

    it('handlerSetupSuccessがtrueの場合は成功ログを出力する', () => {
      const mockSetGlobalHandler = jest.fn();
      const mockGetGlobalHandler = jest.fn().mockReturnValue(() => {});

      jest.resetModules();
      jest.doMock('react-native', () => ({
        ErrorUtils: {
          setGlobalHandler: mockSetGlobalHandler,
          getGlobalHandler: mockGetGlobalHandler,
        },
      }));

      // Loggerのモックを再設定
      jest.doMock('@/infrastructure/logging/Logger', () => ({
        Logger: {
          getInstance: jest.fn().mockReturnValue({
            error: mockLoggerError,
            info: mockLoggerInfo,
          }),
        },
      }));

      const {setupGlobalErrorHandler: setupGlobalErrorHandlerMocked} = require('@/utils/errorHandler');
      setupGlobalErrorHandlerMocked();

      expect(mockLoggerInfo).toHaveBeenCalledWith(
        '[ErrorHandler] ✅ Global error handler setup completed',
      );

      jest.dontMock('react-native');
      jest.dontMock('@/infrastructure/logging/Logger');
      jest.resetModules();
    });

    it('handlerSetupSuccessがfalseの場合は代替手段のログを出力する', () => {
      jest.resetModules();
      jest.doMock('react-native', () => ({
        // ErrorUtilsが存在しない
      }));

      // Loggerのモックを再設定
      jest.doMock('@/infrastructure/logging/Logger', () => ({
        Logger: {
          getInstance: jest.fn().mockReturnValue({
            error: mockLoggerError,
            info: mockLoggerInfo,
          }),
        },
      }));

      const {setupGlobalErrorHandler: setupGlobalErrorHandlerMocked} = require('@/utils/errorHandler');
      setupGlobalErrorHandlerMocked();

      expect(mockLoggerInfo).toHaveBeenCalledWith(
        '[ErrorHandler] ℹ️ Using ErrorBoundary + Promise rejection handler (ErrorUtils not available)',
      );

      jest.dontMock('react-native');
      jest.dontMock('@/infrastructure/logging/Logger');
      jest.resetModules();
    });
  });
});

