/**
 * apiClient テスト
 */

import {apiFetch, ensureOk, setApiMetricsHandler} from '@/utils/apiClient';

// fetchとretryのモック
global.fetch = jest.fn();
jest.mock('@/utils/retry', () => ({
  withRetryAndTimeout: jest.fn(),
}));

import {withRetryAndTimeout} from '@/utils/retry';

describe('apiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setApiMetricsHandler(null);
  });

  describe('apiFetch', () => {
    it('正常なリクエストを処理できる', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
      } as Response;

      (withRetryAndTimeout as jest.Mock).mockResolvedValue(mockResponse);

      const result = await apiFetch('https://api.example.com/data');

      expect(withRetryAndTimeout).toHaveBeenCalled();
      expect(result).toBe(mockResponse);
    });

    it('URLが空文字列の場合はエラーをスローする', async () => {
      await expect(apiFetch('')).rejects.toThrow('Invalid URL');
    });

    it('URLがnullの場合はエラーをスローする', async () => {
      await expect(apiFetch(null as any)).rejects.toThrow('Invalid URL');
    });

    it('無効なURL形式の場合はエラーをスローする', async () => {
      await expect(apiFetch('not-a-valid-url')).rejects.toThrow('Invalid URL format');
    });

    it('initオプションを指定できる', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
      } as Response;

      (withRetryAndTimeout as jest.Mock).mockResolvedValue(mockResponse);

      const init = {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
      };

      await apiFetch('https://api.example.com/data', init);

      expect(withRetryAndTimeout).toHaveBeenCalled();
    });

    it('カスタムリトライオプションを指定できる', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
      } as Response;

      (withRetryAndTimeout as jest.Mock).mockResolvedValue(mockResponse);

      await apiFetch('https://api.example.com/data', undefined, {
        retry: {maxRetries: 5, delayMs: 1000},
        timeoutMs: 30000,
      });

      expect(withRetryAndTimeout).toHaveBeenCalledWith(
        expect.any(Function),
        {maxRetries: 5, delayMs: 1000},
        30000,
      );
    });

    it('メトリクスハンドラーが設定されている場合は呼び出される', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
      } as Response;

      const mockMetricsHandler = jest.fn();
      setApiMetricsHandler(mockMetricsHandler);

      (withRetryAndTimeout as jest.Mock).mockResolvedValue(mockResponse);

      await apiFetch('https://api.example.com/data');

      expect(mockMetricsHandler).toHaveBeenCalledWith({
        url: 'https://api.example.com/data',
        method: 'GET',
        status: 200,
        durationMs: expect.any(Number),
      });
    });

    it('開発環境ではデフォルトログが出力される', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
      } as Response;

      const consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
      (withRetryAndTimeout as jest.Mock).mockResolvedValue(mockResponse);

      await apiFetch('https://api.example.com/data');

      expect(consoleDebugSpy).toHaveBeenCalled();
      consoleDebugSpy.mockRestore();
    });
  });

  describe('ensureOk', () => {
    it('response.okがtrueの場合は何もしない', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
      } as Response;

      await expect(ensureOk(mockResponse)).resolves.toBeUndefined();
    });

    it('response.okがfalseでNotion API形式のエラーレスポンスの場合はエラーをスローする', async () => {
      // json()が成功してdata.statusとdata.messageが存在する場合
      const mockJson = jest.fn().mockResolvedValue({
        status: 404,
        message: 'Not found',
      });
      const mockResponse: any = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: mockJson,
      };

      // data.statusとdata.messageが存在する場合、Notion API形式のエラーになる
      await expect(ensureOk(mockResponse)).rejects.toThrow('Notion API error: 404 - Not found');
      expect(mockJson).toHaveBeenCalled();
    });

    it('response.okがfalseで通常のエラーレスポンスの場合はエラーをスローする', async () => {
      const mockJson = jest.fn().mockResolvedValue({
        message: 'Server error',
      });
      const mockResponse: any = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: mockJson,
      };

      // data.messageが存在するが、data.statusが存在しない場合は通常のエラー
      await expect(ensureOk(mockResponse)).rejects.toThrow('HTTP 500: Server error');
      expect(mockJson).toHaveBeenCalled();
    });

    it('JSONパースに失敗した場合はstatusTextを使用する', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: jest.fn().mockRejectedValue(new Error('Parse error')),
      } as any;

      await expect(ensureOk(mockResponse)).rejects.toThrow('HTTP 500: Internal Server Error');
    });

    it('json()が存在しない場合はstatusTextを使用する', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as any;
      // jsonプロパティを削除
      delete mockResponse.json;

      await expect(ensureOk(mockResponse)).rejects.toThrow('HTTP 500: Internal Server Error');
    });

    it('statusTextが空文字列でdata.messageもない場合はデフォルトメッセージを使用する', async () => {
      const mockJson = jest.fn().mockResolvedValue({}); // messageプロパティがない
      const mockResponse: any = {
        ok: false,
        status: 500,
        statusText: '',
        json: mockJson,
      };

      // tryブロック内でdata?.message || statusText || 'HTTP error'が評価される
      // data.messageがundefined、statusTextが''なので、'HTTP error'が使用される
      await expect(ensureOk(mockResponse)).rejects.toThrow('HTTP 500: HTTP error');
    });
  });

  describe('setApiMetricsHandler', () => {
    it('メトリクスハンドラーを設定できる', () => {
      const handler = jest.fn();
      setApiMetricsHandler(handler);

      expect(() => setApiMetricsHandler(handler)).not.toThrow();
    });

    it('メトリクスハンドラーをnullに設定できる', () => {
      expect(() => setApiMetricsHandler(null)).not.toThrow();
    });
  });
});

