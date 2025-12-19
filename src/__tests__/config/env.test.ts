/**
 * env.ts テスト
 */

import {env} from '@/config/env';

describe('env', () => {
  it('環境変数が正しく設定されている', () => {
    expect(env.openBdApiUrl).toBe('https://api.openbd.jp/v1');
    expect(env.rakutenApiUrl).toBe('https://app.rakuten.co.jp/services/api');
    expect(env.notionApiUrl).toBe('https://api.notion.com/v1');
    expect(env.notionApiVersion).toBe('2022-06-28');
  });

  it('isDevelopmentとisProductionが正しく設定されている', () => {
    expect(typeof env.isDevelopment).toBe('boolean');
    expect(typeof env.isProduction).toBe('boolean');
    expect(env.isDevelopment).toBe(!env.isProduction);
  });

  it('revenueCatApiKeyが設定されている', () => {
    expect(typeof env.revenueCatApiKey).toBe('string');
  });

  it('logLevelが設定されている', () => {
    expect(['debug', 'error']).toContain(env.logLevel);
  });

  it('開発環境ではrevenueCatApiKeyがtest_keyである', () => {
    if (env.isDevelopment) {
      expect(env.revenueCatApiKey).toBe('test_key');
    }
  });

  it('開発環境ではlogLevelがdebugである', () => {
    if (env.isDevelopment) {
      expect(env.logLevel).toBe('debug');
    }
  });

  it('本番環境ではlogLevelがerrorである', () => {
    if (env.isProduction) {
      expect(env.logLevel).toBe('error');
    }
  });

  it('本番環境ではrevenueCatApiKeyが空文字列である', () => {
    if (env.isProduction) {
      expect(env.revenueCatApiKey).toBe('');
    }
  });

  describe('__DEV__の値に応じたブランチカバレッジ', () => {
    const originalDev = __DEV__;

    afterEach(() => {
      (globalThis as any).__DEV__ = originalDev;
    });

    it('__DEV__がtrueの場合、revenueCatApiKeyはtest_keyである', () => {
      (globalThis as any).__DEV__ = true;
      // モジュールを再読み込みしてenvを再評価
      jest.resetModules();
      const {env: envDev} = require('@/config/env');
      expect(envDev.revenueCatApiKey).toBe('test_key');
    });

    it('__DEV__がfalseの場合、revenueCatApiKeyは空文字列である', () => {
      (globalThis as any).__DEV__ = false;
      jest.resetModules();
      const {env: envProd} = require('@/config/env');
      expect(envProd.revenueCatApiKey).toBe('');
    });

    it('__DEV__がtrueの場合、logLevelはdebugである', () => {
      (globalThis as any).__DEV__ = true;
      jest.resetModules();
      const {env: envDev} = require('@/config/env');
      expect(envDev.logLevel).toBe('debug');
    });

    it('__DEV__がfalseの場合、logLevelはerrorである', () => {
      (globalThis as any).__DEV__ = false;
      jest.resetModules();
      const {env: envProd} = require('@/config/env');
      expect(envProd.logLevel).toBe('error');
    });
  });
});

