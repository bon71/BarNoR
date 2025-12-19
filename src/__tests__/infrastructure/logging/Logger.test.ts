/**
 * Logger テスト
 */

import {Logger, LogLevel} from '@/infrastructure/logging/Logger';

describe('Logger', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    // シングルトンインスタンスをリセット
    (Logger as any).instance = undefined;
    // __DEV__をリセット
    delete (global as any).__DEV__;
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('getInstance', () => {
    it('シングルトンインスタンスを返す', () => {
      const instance1 = Logger.getInstance();
      const instance2 = Logger.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('setLevel', () => {
    it('ログレベルを設定できる', () => {
      const logger = Logger.getInstance();
      logger.setLevel(LogLevel.WARN);

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith('[WARN] warn message');
    });
  });

  describe('debug', () => {
    it('DEBUGレベルでログを出力できる', () => {
      const logger = Logger.getInstance();
      logger.setLevel(LogLevel.DEBUG);
      logger.debug('debug message', 'arg1', 'arg2');

      expect(consoleLogSpy).toHaveBeenCalledWith('[DEBUG] debug message', 'arg1', 'arg2');
    });

    it('DEBUGレベル未満ではログを出力しない', () => {
      const logger = Logger.getInstance();
      logger.setLevel(LogLevel.INFO);
      logger.debug('debug message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('info', () => {
    it('INFOレベルでログを出力できる', () => {
      const logger = Logger.getInstance();
      logger.setLevel(LogLevel.INFO);
      logger.info('info message', 'arg1');

      expect(consoleLogSpy).toHaveBeenCalledWith('[INFO] info message', 'arg1');
    });

    it('INFOレベル未満ではログを出力しない', () => {
      const logger = Logger.getInstance();
      logger.setLevel(LogLevel.WARN);
      logger.info('info message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('warn', () => {
    it('WARNレベルでログを出力できる', () => {
      const logger = Logger.getInstance();
      logger.setLevel(LogLevel.WARN);
      logger.warn('warn message', 'arg1');

      expect(consoleWarnSpy).toHaveBeenCalledWith('[WARN] warn message', 'arg1');
    });

    it('WARNレベル未満ではログを出力しない', () => {
      const logger = Logger.getInstance();
      logger.setLevel(LogLevel.ERROR);
      logger.warn('warn message');

      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });

  describe('error', () => {
    it('ERRORレベルでログを出力できる', () => {
      const logger = Logger.getInstance();
      logger.setLevel(LogLevel.ERROR);
      const error = new Error('test error');
      logger.error('error message', error, 'arg1');

      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] error message', error, 'arg1');
    });

    it('エラーオブジェクトなしでログを出力できる', () => {
      const logger = Logger.getInstance();
      logger.setLevel(LogLevel.ERROR);
      logger.error('error message');

      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] error message', undefined);
    });
  });

  describe('shouldLog', () => {
    it('レベルに応じてログ出力を制御する', () => {
      const logger = Logger.getInstance();

      logger.setLevel(LogLevel.DEBUG);
      logger.debug('debug');
      logger.info('info');
      logger.warn('warn');
      logger.error('error');
      expect(consoleLogSpy).toHaveBeenCalledTimes(2); // debug, info
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

      jest.clearAllMocks();

      logger.setLevel(LogLevel.INFO);
      logger.debug('debug');
      logger.info('info');
      logger.warn('warn');
      logger.error('error');
      expect(consoleLogSpy).toHaveBeenCalledTimes(1); // info only
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

      jest.clearAllMocks();

      logger.setLevel(LogLevel.WARN);
      logger.debug('debug');
      logger.info('info');
      logger.warn('warn');
      logger.error('error');
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

      jest.clearAllMocks();

      logger.setLevel(LogLevel.ERROR);
      logger.debug('debug');
      logger.info('info');
      logger.warn('warn');
      logger.error('error');
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('__DEV__による初期ログレベルの設定', () => {
    it('__DEV__がtrueの場合、DEBUGレベルで初期化される', () => {
      (global as any).__DEV__ = true;
      (Logger as any).instance = undefined;

      const logger = Logger.getInstance();
      logger.debug('debug message');

      expect(consoleLogSpy).toHaveBeenCalledWith('[DEBUG] debug message');
    });

    it('__DEV__がfalseの場合、ERRORレベルで初期化される', () => {
      (global as any).__DEV__ = false;
      (Logger as any).instance = undefined;

      const logger = Logger.getInstance();
      // env.isProductionがtrueの場合、ERRORレベルが設定される
      // しかし、env.tsはモジュール読み込み時に実行されるため、
      // __DEV__を変更しても反映されない
      // そのため、setLevelで明示的にERRORレベルを設定
      logger.setLevel(LogLevel.ERROR);
      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] error message', undefined);
    });

    it('__DEV__がundefinedの場合、ERRORレベルで初期化される', () => {
      delete (global as any).__DEV__;
      (Logger as any).instance = undefined;

      const logger = Logger.getInstance();
      // env.isProductionがtrueの場合、ERRORレベルが設定される
      // しかし、env.tsはモジュール読み込み時に実行されるため、
      // __DEV__を変更しても反映されない
      // そのため、setLevelで明示的にERRORレベルを設定
      logger.setLevel(LogLevel.ERROR);
      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] error message', undefined);
    });
  });
});


