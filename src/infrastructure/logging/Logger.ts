/**
 * シンプルなロガー
 * レベル別に出力を制御し、将来の外部送信連携に備える
 */

import {env} from '@/config/env';
import {maskSensitiveData} from '@/utils/logMasking';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export class Logger {
  private static instance: Logger;
  // 本番環境ではERRORのみ、開発環境ではDEBUGから出力
  private level: LogLevel = env.isProduction ? LogLevel.ERROR : LogLevel.DEBUG;

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      // 機密情報をマスク
      const maskedArgs = args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
          return maskSensitiveData(arg as Record<string, unknown>);
        }
        return arg;
      });
      console.log(`[DEBUG] ${message}`, ...maskedArgs);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      // 機密情報をマスク
      const maskedArgs = args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
          return maskSensitiveData(arg as Record<string, unknown>);
        }
        return arg;
      });
      console.log(`[INFO] ${message}`, ...maskedArgs);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      // 機密情報をマスク
      const maskedArgs = args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
          return maskSensitiveData(arg as Record<string, unknown>);
        }
        return arg;
      });
      console.warn(`[WARN] ${message}`, ...maskedArgs);
    }
  }

  error(message: string, error?: Error, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      // 機密情報をマスク
      const maskedArgs = args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
          return maskSensitiveData(arg as Record<string, unknown>);
        }
        return arg;
      });
      console.error(`[ERROR] ${message}`, error, ...maskedArgs);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }
}


