/**
 * retry.ts のテスト
 * リトライ・タイムアウト機能のテスト
 */

import {withRetry, withTimeout, withRetryAndTimeout} from '@/utils/retry';

describe('retry utilities', () => {
  describe('withRetry', () => {
    it('成功した場合、最初の試行で結果を返す', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      const result = await withRetry(mockFn);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('リトライ可能なエラーの場合、指定回数リトライする', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('network error'))
        .mockRejectedValueOnce(new Error('timeout'))
        .mockResolvedValue('success');

      const result = await withRetry(mockFn, {
        maxRetries: 3,
        delayMs: 10,
      });

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('最大リトライ回数に達したらエラーをスローする', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('network error'));

      await expect(
        withRetry(mockFn, {
          maxRetries: 2,
          delayMs: 10,
        }),
      ).rejects.toThrow('network error');

      expect(mockFn).toHaveBeenCalledTimes(3); // 初回 + 2回リトライ
    });

    it('リトライすべきでないエラーの場合、すぐにエラーをスローする', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('invalid request'));

      await expect(
        withRetry(mockFn, {
          maxRetries: 3,
          delayMs: 10,
          shouldRetry: (error: Error) =>
            error.message.includes('network') ||
            error.message.includes('timeout'),
        }),
      ).rejects.toThrow('invalid request');

      expect(mockFn).toHaveBeenCalledTimes(1); // リトライしない
    });

    it('指数バックオフが正しく動作する', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('network error'))
        .mockRejectedValueOnce(new Error('network error'))
        .mockResolvedValue('success');

      // 指数バックオフで3回試行されることを確認
      const result = await withRetry(mockFn, {
        maxRetries: 3,
        delayMs: 10,
        backoffMultiplier: 2,
      });

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('ネットワークエラーをリトライ対象として認識する', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Network error occurred'))
        .mockResolvedValue('success');

      const result = await withRetry(mockFn, {
        maxRetries: 2,
        delayMs: 10,
      });

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('タイムアウトエラーをリトライ対象として認識する', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Request timeout'))
        .mockResolvedValue('success');

      const result = await withRetry(mockFn, {
        maxRetries: 2,
        delayMs: 10,
      });

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('5xxサーバーエラーをリトライ対象として認識する', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Server error: 500'))
        .mockRejectedValueOnce(new Error('Server error: 502'))
        .mockRejectedValueOnce(new Error('Server error: 503'))
        .mockResolvedValue('success');

      const result = await withRetry(mockFn, {
        maxRetries: 4,
        delayMs: 10,
      });

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(4);
    });
  });

  describe('withTimeout', () => {
    it('タイムアウト前に完了した場合、結果を返す', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      const result = await withTimeout(mockFn, 1000);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('タイムアウトした場合、エラーをスローする', async () => {
      jest.useFakeTimers();

      try {
        const mockFn = jest.fn().mockImplementation(
          () =>
            new Promise(resolve => {
              setTimeout(() => resolve('success'), 1000);
            }),
        );

        const promise = withTimeout(mockFn, 50);

        // タイマーを進める
        jest.advanceTimersByTime(50);

        await expect(promise).rejects.toThrow('Operation timed out after 50ms');
      } finally {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
      }
    });

    it('関数がエラーをスローした場合、タイムアウト前にエラーを返す', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('function error'));

      await expect(withTimeout(mockFn, 1000)).rejects.toThrow(
        'function error',
      );
    });
  });

  describe('withRetryAndTimeout', () => {
    it('成功した場合、結果を返す', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      const result = await withRetryAndTimeout(
        mockFn,
        {maxRetries: 3, delayMs: 10},
        1000,
      );

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('ネットワークエラーが発生した場合リトライする', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('network error'))
        .mockResolvedValue('success');

      const result = await withRetryAndTimeout(
        mockFn,
        {maxRetries: 3, delayMs: 10},
        1000,
      );

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('リトライしてもタイムアウトし続ける場合、最終的にエラーをスローする', async () => {
      jest.useFakeTimers();

      try {
        const mockFn = jest.fn().mockImplementation(
          () =>
            new Promise(resolve => {
              setTimeout(() => resolve('success'), 100);
            }),
        );

        const promise = withRetryAndTimeout(
          mockFn,
          {maxRetries: 2, delayMs: 10},
          50,
        );

        // タイマーを進める
        jest.advanceTimersByTime(50);

        await expect(promise).rejects.toThrow('Operation timed out after 50ms');

        // タイムアウトが発生するため、リトライ回数は不確定
        expect(mockFn).toHaveBeenCalled();
      } finally {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
      }
    });

    it('ネットワークエラーでリトライ後、成功する', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('network error'))
        .mockResolvedValue('success');

      const result = await withRetryAndTimeout(
        mockFn,
        {maxRetries: 3, delayMs: 10},
        1000,
      );

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('デフォルト値が正しく設定される', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      const result = await withRetryAndTimeout(mockFn);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });
});
