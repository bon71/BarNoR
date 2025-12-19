/**
 * グローバルエラーハンドラー
 * アプリ全体の予期しないエラーをキャッチして記録する
 */
import {Logger} from '@/infrastructure/logging/Logger';

/**
 * エラー情報の型定義
 */
interface ErrorLog {
  timestamp: string;
  message: string;
  stack?: string;
  isFatal: boolean;
}

/**
 * Promise Rejection Event の型定義
 */
interface PromiseRejectionEvent {
  promise: Promise<any>;
  reason: any;
}

/**
 * グローバルエラーハンドラーをセットアップ
 * index.jsの最初期に呼び出すこと
 *
 * React Native 0.81.0+では、ErrorUtilsがエクスポートされていない場合があります。
 * その場合は、ErrorBoundary（App.tsxで実装済み）とPromise rejectionハンドラーでカバーします。
 */
export function setupGlobalErrorHandler(): void {
  let handlerSetupSuccess = false;
  const logger = Logger.getInstance();

  // 1. ErrorUtilsを使ったグローバルエラーハンドラー（利用可能な場合のみ）
  try {
     
    const ReactNative = require('react-native');
    const ErrorUtilsImpl = ReactNative.ErrorUtils;

    if (
      ErrorUtilsImpl &&
      typeof ErrorUtilsImpl.getGlobalHandler === 'function' &&
      typeof ErrorUtilsImpl.setGlobalHandler === 'function'
    ) {
      const defaultErrorHandler = ErrorUtilsImpl.getGlobalHandler();

      ErrorUtilsImpl.setGlobalHandler((error: Error, isFatal?: boolean) => {
        const errorLog: ErrorLog = {
          timestamp: new Date().toISOString(),
          message: error.message,
          stack: error.stack,
          isFatal: isFatal ?? false,
        };

        logger.error('[GlobalErrorHandler]', error, errorLog);

        // 本番環境ではエラートラッキングサービスに送信
        // 例: Sentry.captureException(error, { extra: errorLog });

        if (defaultErrorHandler) {
          defaultErrorHandler(error, isFatal);
        }
      });

      handlerSetupSuccess = true;
      logger.info('[ErrorHandler] ErrorUtils handler setup completed');
    }
  } catch (error) {
    // ErrorUtilsが利用できない場合は静かに続行（警告を出さない）
    logger.info(
      '[ErrorHandler] ErrorUtils not available, using alternative error handling',
    );
  }

  // 2. グローバルエラーイベントハンドラー（代替手段）
  if (!handlerSetupSuccess && typeof (global as any).ErrorUtils === 'object') {
    try {
      const globalErrorUtils = (global as any).ErrorUtils;
      if (typeof globalErrorUtils.setGlobalHandler === 'function') {
        globalErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
          logger.error(
            '[GlobalErrorHandler]',
            error,
            {
              timestamp: new Date().toISOString(),
              message: error.message,
              stack: error.stack,
              isFatal: isFatal ?? false,
            },
          );
        });
        handlerSetupSuccess = true;
        logger.info('[ErrorHandler] Global.ErrorUtils handler setup completed');
      }
    } catch (error) {
      // 代替手段も失敗した場合は静かに続行
    }
  }

  // 3. Promise rejection ハンドラー（常に有効）
  if (global.Promise) {
    const rejectionHandler = (event: PromiseRejectionEvent) => {
      logger.error(
        '[UnhandledPromiseRejection]',
        undefined,
        {
          timestamp: new Date().toISOString(),
          reason: event.reason,
        },
      );

      // 本番環境ではエラートラッキングサービスに送信
      // 例: Sentry.captureException(event.reason);
    };

    if (typeof (global as any).addEventListener === 'function') {
      (global as any).addEventListener(
        'unhandledrejection',
        rejectionHandler as any,
      );
    }

    logger.info('[ErrorHandler] Promise rejection handler setup completed');
  }

  // 4. 最終確認ログ
  if (handlerSetupSuccess) {
    logger.info('[ErrorHandler] ✅ Global error handler setup completed');
  } else {
    logger.info(
      '[ErrorHandler] ℹ️ Using ErrorBoundary + Promise rejection handler (ErrorUtils not available)',
    );
  }
}
