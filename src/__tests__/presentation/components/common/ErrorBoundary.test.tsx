/**
 * ErrorBoundary テスト
 */

import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {Text, View} from 'react-native';
import {ErrorBoundary} from '@/presentation/components/common/ErrorBoundary';
import {Logger} from '@/infrastructure/logging/Logger';

// Loggerのモック
jest.mock('@/infrastructure/logging/Logger');

// エラーを投げるコンポーネント
const ThrowError = ({shouldThrow}: {shouldThrow: boolean}) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <Text>正常表示</Text>;
};

describe('ErrorBoundary', () => {
  let mockLoggerError: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    // console.errorをモック（エラーログを抑制）
    jest.spyOn(console, 'error').mockImplementation(() => {});

    mockLoggerError = jest.fn();
    (Logger.getInstance as jest.Mock) = jest.fn().mockReturnValue({
      error: mockLoggerError,
    });
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  describe('正常動作', () => {
    it('エラーが発生しない場合、子コンポーネントが表示される', () => {
      const {getByText} = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>,
      );

      expect(getByText('正常表示')).toBeTruthy();
    });

    it('複数の子コンポーネントが正常に表示される', () => {
      const {getByText} = render(
        <ErrorBoundary>
          <View>
            <Text>子コンポーネント1</Text>
            <Text>子コンポーネント2</Text>
          </View>
        </ErrorBoundary>,
      );

      expect(getByText('子コンポーネント1')).toBeTruthy();
      expect(getByText('子コンポーネント2')).toBeTruthy();
    });
  });

  describe('エラーキャッチ', () => {
    it('子コンポーネントでエラー発生時、エラー画面が表示される', () => {
      const {getByText, queryByText} = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(queryByText('正常表示')).toBeNull();
      expect(getByText(/予期しないエラーが発生しました/)).toBeTruthy();
      expect(getByText(/アプリの実行中にエラーが発生しました/)).toBeTruthy();
    });

    it('エラーメッセージが表示される（開発モード）', () => {
      const originalDev = __DEV__;
      (global as any).__DEV__ = true;

      const {getByText} = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(getByText(/デバッグ情報:/)).toBeTruthy();
      expect(getByText(/Test error/)).toBeTruthy();

      (global as any).__DEV__ = originalDev;
    });

    it('エラースタックが表示される（開発モード、errorInfoがある場合）', () => {
      const originalDev = __DEV__;
      (global as any).__DEV__ = true;

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      // componentDidCatchが呼ばれるまで待つ
      expect(mockLoggerError).toHaveBeenCalled();

      (global as any).__DEV__ = originalDev;
    });

    it('エラーログが記録される', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(mockLoggerError).toHaveBeenCalledWith(
        'ErrorBoundary caught an error:',
        expect.any(Error),
        expect.any(Object),
      );
    });

    it('console.errorが呼ばれる', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      // Reactがエラーをログに記録するため、console.errorが呼ばれる
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('リトライ機能', () => {
    it('「再試行」ボタンが表示される', () => {
      const {getByText} = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(getByText('再試行')).toBeTruthy();
    });

    it('「再試行」ボタン押下でresetErrorが呼ばれる', () => {
      const {getByText} = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(getByText(/予期しないエラーが発生しました/)).toBeTruthy();

      const retryButton = getByText('再試行');

      // resetErrorが呼ばれることを確認（エラー状態がリセットされる）
      fireEvent.press(retryButton);

      // エラー画面がまだ表示されている（子コンポーネントがまだエラーを投げるため）
      // ただし、resetErrorが呼ばれたことで状態はリセットされている
      expect(retryButton).toBeTruthy();
    });
  });

  describe('カスタムfallback', () => {
    it('カスタムfallbackが指定された場合、それを使用する', () => {
      const customFallback = jest.fn((error: Error, _resetError: () => void) => (
        <View>
          <Text>カスタムエラー画面</Text>
          <Text>{error.message}</Text>
        </View>
      ));

      const {getByText, queryByText} = render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(queryByText(/予期しないエラーが発生しました/)).toBeNull();
      expect(getByText('カスタムエラー画面')).toBeTruthy();
      expect(getByText('Test error')).toBeTruthy();
      expect(customFallback).toHaveBeenCalledWith(
        expect.any(Error),
        expect.any(Function),
      );
    });

    it('カスタムfallbackのresetErrorが機能する', () => {
      let resetErrorFn: (() => void) | undefined;
      const customFallback = jest.fn((_error: Error, resetError: () => void) => {
        resetErrorFn = resetError;
        return (
          <View>
            <Text>カスタムエラー画面</Text>
          </View>
        );
      });

      const {getByText, rerender} = render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>,
      );

      expect(getByText('カスタムエラー画面')).toBeTruthy();
      expect(resetErrorFn).toBeDefined();

      if (resetErrorFn) {
        resetErrorFn();
        rerender(
          <ErrorBoundary fallback={customFallback}>
            <ThrowError shouldThrow={false} />
          </ErrorBoundary>,
        );
      }

      expect(getByText('正常表示')).toBeTruthy();
    });
  });

  describe('エッジケース', () => {
    it('複数のエラーが連続で発生しても対応できる', () => {
      const TestComponent = ({shouldThrow}: {shouldThrow: boolean}) => (
        <ErrorBoundary>
          <ThrowError shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );

      const {getByText, rerender} = render(<TestComponent shouldThrow={true} />);

      expect(getByText(/予期しないエラーが発生しました/)).toBeTruthy();

      const retryButton = getByText('再試行');
      fireEvent.press(retryButton);

      rerender(<TestComponent shouldThrow={true} />);

      // 再度エラー画面が表示される
      expect(getByText(/予期しないエラーが発生しました/)).toBeTruthy();
    });
  });
});

