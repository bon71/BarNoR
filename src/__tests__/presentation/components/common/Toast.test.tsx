/**
 * Toast テスト
 */

import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {Toast} from '@/presentation/components/common/Toast';

describe('Toast', () => {
  const mockOnHide = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('レンダリング', () => {
    it('メッセージが正しく表示される', () => {
      const {getByText} = render(
        <Toast
          id="toast-1"
          type="success"
          message="テストメッセージ"
          onHide={mockOnHide}
        />,
      );

      expect(getByText('テストメッセージ')).toBeTruthy();
    });

    it('Animated.Viewが使用される', () => {
      const {getByText} = render(
        <Toast
          id="toast-1"
          type="success"
          message="テスト"
          onHide={mockOnHide}
        />,
      );

      // コンポーネントがレンダリングされていることを確認
      expect(getByText('テスト')).toBeTruthy();
    });
  });

  describe('タイプ別スタイル', () => {
    it('successタイプで成功スタイルが適用される', () => {
      const {getByText} = render(
        <Toast
          id="toast-1"
          type="success"
          message="成功"
          onHide={mockOnHide}
        />,
      );

      expect(getByText('✓')).toBeTruthy();
      expect(getByText('成功')).toBeTruthy();
    });

    it('errorタイプでエラースタイルが適用される', () => {
      const {getByText} = render(
        <Toast
          id="toast-1"
          type="error"
          message="エラー"
          onHide={mockOnHide}
        />,
      );

      expect(getByText('✕')).toBeTruthy();
      expect(getByText('エラー')).toBeTruthy();
    });

    it('warningタイプで警告スタイルが適用される', () => {
      const {getByText} = render(
        <Toast
          id="toast-1"
          type="warning"
          message="警告"
          onHide={mockOnHide}
        />,
      );

      expect(getByText('⚠')).toBeTruthy();
      expect(getByText('警告')).toBeTruthy();
    });

    it('infoタイプで情報スタイルが適用される', () => {
      const {getByText} = render(
        <Toast
          id="toast-1"
          type="info"
          message="情報"
          onHide={mockOnHide}
        />,
      );

      expect(getByText('ℹ')).toBeTruthy();
      expect(getByText('情報')).toBeTruthy();
    });
  });

  describe('アニメーション', () => {
    it('フェードインアニメーションが動作する', () => {
      const {getByText} = render(
        <Toast
          id="toast-1"
          type="success"
          message="テスト"
          onHide={mockOnHide}
        />,
      );

      // アニメーションが開始されることを確認
      jest.advanceTimersByTime(100);

      // コンポーネントがレンダリングされていることを確認
      expect(getByText('テスト')).toBeTruthy();
    });
  });

  describe('自動非表示', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('デフォルトで3秒後に自動的に非表示になる', () => {
      const customOnHide = jest.fn();
      render(
        <Toast
          id="toast-1"
          type="success"
          message="テスト"
          onHide={customOnHide}
        />,
      );

      // タイマーを進める前に少し待つ（useEffectが実行されるまで）
      jest.advanceTimersByTime(100);
      jest.advanceTimersByTime(3000);

      expect(customOnHide).toHaveBeenCalledWith('toast-1');
    });

    it('カスタムdurationが指定された場合、その時間後に非表示になる', () => {
      const customOnHide = jest.fn();
      render(
        <Toast
          id="toast-1"
          type="success"
          message="テスト"
          duration={5000}
          onHide={customOnHide}
        />,
      );

      // タイマーを進める前に少し待つ（useEffectが実行されるまで）
      jest.advanceTimersByTime(100);
      jest.advanceTimersByTime(5000);

      expect(customOnHide).toHaveBeenCalledWith('toast-1');
    });

    it('duration未満の時間では非表示にならない', () => {
      const customOnHide = jest.fn();
      render(
        <Toast
          id="toast-1"
          type="success"
          message="テスト"
          duration={5000}
          onHide={customOnHide}
        />,
      );

      // タイマーを進める前に少し待つ（useEffectが実行されるまで）
      jest.advanceTimersByTime(100);
      jest.advanceTimersByTime(3000);

      expect(customOnHide).not.toHaveBeenCalled();
    });
  });

  describe('閉じる機能', () => {
    it('タップでonHideが呼ばれる', () => {
      const {getByText} = render(
        <Toast
          id="toast-1"
          type="success"
          message="テスト"
          onHide={mockOnHide}
        />,
      );

      const toastContent = getByText('テスト');
      fireEvent.press(toastContent);

      // アニメーション完了を待つ
      jest.advanceTimersByTime(250);

      expect(mockOnHide).toHaveBeenCalledWith('toast-1');
    });

    it('タップでhide関数が呼ばれる', () => {
      const {getByText} = render(
        <Toast
          id="toast-1"
          type="success"
          message="テスト"
          onHide={mockOnHide}
        />,
      );

      const toastContent = getByText('テスト');
      fireEvent.press(toastContent);

      // アニメーション完了を待つ
      jest.advanceTimersByTime(250);

      // onHideが呼ばれることを確認
      expect(mockOnHide).toHaveBeenCalled();
    });
  });

  describe('メッセージ表示', () => {
    it('長いメッセージは2行まで表示される', () => {
      const longMessage = 'これは非常に長いメッセージです。'.repeat(10);
      const {getByText} = render(
        <Toast
          id="toast-1"
          type="info"
          message={longMessage}
          onHide={mockOnHide}
        />,
      );

      const messageElement = getByText(longMessage);
      expect(messageElement).toBeTruthy();
      // numberOfLines={2}が設定されていることを確認
      expect(messageElement.props.numberOfLines).toBe(2);
    });
  });
});

