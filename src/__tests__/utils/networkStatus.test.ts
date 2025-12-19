/**
 * networkStatus テスト
 */

import {checkNetworkStatus, isNetworkError} from '@/utils/networkStatus';

describe('networkStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock) = jest.fn();
  });

  describe('checkNetworkStatus', () => {
    it('ネットワーク接続が成功した場合、isConnected: trueを返す', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
      });

      const result = await checkNetworkStatus();

      expect(result).toEqual({
        isConnected: true,
        isInternetReachable: true,
        type: 'unknown',
      });
      expect(global.fetch).toHaveBeenCalledWith(
        'https://www.google.com/favicon.ico',
        {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-cache',
        },
      );
    });

    it('ネットワーク接続が失敗した場合、isConnected: falseを返す', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await checkNetworkStatus();

      expect(result).toEqual({
        isConnected: false,
        isInternetReachable: false,
        type: null,
      });
    });

    it('タイムアウトエラーの場合、isConnected: falseを返す', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Timeout'));

      const result = await checkNetworkStatus();

      expect(result).toEqual({
        isConnected: false,
        isInternetReachable: false,
        type: null,
      });
    });
  });

  describe('isNetworkError', () => {
    it('ネットワークエラーメッセージを含むエラーを認識する', () => {
      expect(isNetworkError(new Error('Network error'))).toBe(true);
      expect(isNetworkError(new Error('network unavailable'))).toBe(true);
    });

    it('fetchエラーメッセージを含むエラーを認識する', () => {
      expect(isNetworkError(new Error('fetch failed'))).toBe(true);
      expect(isNetworkError(new Error('Fetch error'))).toBe(true);
    });

    it('タイムアウトエラーメッセージを含むエラーを認識する', () => {
      expect(isNetworkError(new Error('timeout occurred'))).toBe(true);
      expect(isNetworkError(new Error('Request timeout'))).toBe(true);
    });

    it('接続エラーメッセージを含むエラーを認識する', () => {
      expect(isNetworkError(new Error('connection refused'))).toBe(true);
      expect(isNetworkError(new Error('Connection failed'))).toBe(true);
    });

    it('オフラインメッセージを含むエラーを認識する', () => {
      expect(isNetworkError(new Error('offline mode'))).toBe(true);
      expect(isNetworkError(new Error('Device is offline'))).toBe(true);
    });

    it('ネットワーク関連のメッセージを含まないエラーを認識しない', () => {
      expect(isNetworkError(new Error('Validation error'))).toBe(false);
      expect(isNetworkError(new Error('Invalid input'))).toBe(false);
      expect(isNetworkError(new Error('Permission denied'))).toBe(false);
    });

    it('空のエラーメッセージを認識しない', () => {
      expect(isNetworkError(new Error(''))).toBe(false);
    });
  });
});

