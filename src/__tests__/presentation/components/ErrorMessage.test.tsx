/**
 * ErrorMessage コンポーネント テスト
 */

import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {ErrorMessage} from '@/presentation/components/common/ErrorMessage';

describe('ErrorMessage', () => {
  describe('基本的なレンダリング', () => {
    it('正しくレンダリングされる', () => {
      const {getByTestId} = render(
        <ErrorMessage testID="test-error" message="An error occurred" />
      );

      expect(getByTestId('test-error')).toBeTruthy();
    });

    it('エラーメッセージが表示される', () => {
      const {getByText} = render(
        <ErrorMessage message="Network error" />
      );

      expect(getByText('Network error')).toBeTruthy();
    });

    it('エラーアイコンが表示される', () => {
      const {getByText} = render(
        <ErrorMessage message="Error" />
      );

      expect(getByText('⚠️')).toBeTruthy();
    });
  });

  describe('メッセージ', () => {
    it('短いメッセージが表示される', () => {
      const {getByText} = render(
        <ErrorMessage message="Error" />
      );

      expect(getByText('Error')).toBeTruthy();
    });

    it('長いメッセージが表示される', () => {
      const longMessage = 'データの取得に失敗しました。ネットワーク接続を確認して、もう一度お試しください。';
      const {getByText} = render(
        <ErrorMessage message={longMessage} />
      );

      expect(getByText(longMessage)).toBeTruthy();
    });

    it('複数行のメッセージが表示される', () => {
      const multilineMessage = 'エラーが発生しました\n再度お試しください';
      const {getByText} = render(
        <ErrorMessage message={multilineMessage} />
      );

      expect(getByText(multilineMessage)).toBeTruthy();
    });

    it('特殊文字を含むメッセージが表示される', () => {
      const specialMessage = 'Error: Failed to fetch data (code: 404) ⚠️';
      const {getByText} = render(
        <ErrorMessage message={specialMessage} />
      );

      expect(getByText(specialMessage)).toBeTruthy();
    });
  });

  describe('リトライボタン', () => {
    it('onRetryがある場合、リトライボタンが表示される', () => {
      const handleRetry = jest.fn();
      const {getByText} = render(
        <ErrorMessage message="Error" onRetry={handleRetry} />
      );

      expect(getByText('再試行')).toBeTruthy();
    });

    it('onRetryがない場合、リトライボタンは表示されない', () => {
      const {queryByText} = render(
        <ErrorMessage message="Error" />
      );

      expect(queryByText('再試行')).toBeNull();
    });

    it('リトライボタンをタップするとonRetryが呼ばれる', () => {
      const handleRetry = jest.fn();
      const {getByText} = render(
        <ErrorMessage message="Error" onRetry={handleRetry} />
      );

      const retryButton = getByText('再試行');
      fireEvent.press(retryButton);

      expect(handleRetry).toHaveBeenCalledTimes(1);
    });

    it('リトライボタンを複数回タップできる', () => {
      const handleRetry = jest.fn();
      const {getByText} = render(
        <ErrorMessage message="Error" onRetry={handleRetry} />
      );

      const retryButton = getByText('再試行');
      fireEvent.press(retryButton);
      fireEvent.press(retryButton);
      fireEvent.press(retryButton);

      expect(handleRetry).toHaveBeenCalledTimes(3);
    });
  });

  describe('スタイル', () => {
    it('containerスタイルが適用される', () => {
      const {getByTestId} = render(
        <ErrorMessage testID="test-error" message="Error" />
      );

      const container = getByTestId('test-error');
      const styles = container.props.style;

      expect(styles.flex).toBe(1);
      expect(styles.justifyContent).toBe('center');
      expect(styles.alignItems).toBe('center');
    });

    it('エラーメッセージにエラー色が適用される', () => {
      const {getByText} = render(
        <ErrorMessage message="Error occurred" />
      );

      const messageText = getByText('Error occurred');
      const styles = messageText.props.style;

      expect(styles.color).toBe('#E03E3E'); // error色
      expect(styles.textAlign).toBe('center');
    });

    it('エラーアイコンのフォントサイズが適用される', () => {
      const {getByText} = render(
        <ErrorMessage message="Error" />
      );

      const icon = getByText('⚠️');
      const styles = icon.props.style;

      expect(styles.fontSize).toBe(48);
    });

    it('リトライボタンのスタイルが適用される', () => {
      const {getByText} = render(
        <ErrorMessage message="Error" onRetry={() => {}} />
      );

      const retryText = getByText('再試行');
      const styles = retryText.props.style;

      expect(styles.color).toBe('#FFFFFF'); // white色
      expect(styles.fontWeight).toBe('600');
    });
  });

  describe('エッジケース', () => {
    it('testIDなしでもレンダリングされる', () => {
      const {getByText} = render(
        <ErrorMessage message="Error" />
      );

      expect(getByText('Error')).toBeTruthy();
    });

    it('空文字列のメッセージでもレンダリングされる', () => {
      const {getByText} = render(
        <ErrorMessage message="" />
      );

      // 空文字列でもTextコンポーネントは存在する
      expect(getByText('')).toBeTruthy();
    });

    it('messageとonRetryの両方が適用される', () => {
      const handleRetry = jest.fn();
      const {getByText} = render(
        <ErrorMessage message="Network error" onRetry={handleRetry} />
      );

      expect(getByText('Network error')).toBeTruthy();
      expect(getByText('再試行')).toBeTruthy();

      const retryButton = getByText('再試行');
      fireEvent.press(retryButton);

      expect(handleRetry).toHaveBeenCalled();
    });

    it('onRetryが空の関数でも動作する', () => {
      const {getByText} = render(
        <ErrorMessage message="Error" onRetry={() => {}} />
      );

      const retryButton = getByText('再試行');
      fireEvent.press(retryButton);

      // エラーが発生しないことを確認
      expect(retryButton).toBeTruthy();
    });
  });

  describe('アクセシビリティ', () => {
    it('エラーメッセージが読み上げ可能', () => {
      const {getByText} = render(
        <ErrorMessage message="データの読み込みに失敗しました" />
      );

      const message = getByText('データの読み込みに失敗しました');
      expect(message).toBeTruthy();
    });

    it('リトライボタンが機能する', () => {
      const handleRetry = jest.fn();
      const {getByText} = render(
        <ErrorMessage message="Error" onRetry={handleRetry} />
      );

      const retryButton = getByText('再試行');
      fireEvent.press(retryButton);

      expect(handleRetry).toHaveBeenCalled();
      expect(retryButton).toBeTruthy();
    });
  });
});
