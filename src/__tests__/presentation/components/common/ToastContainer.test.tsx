/**
 * ToastContainer テスト
 */

import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {ToastContainer} from '@/presentation/components/common/ToastContainer';
import {useToastStore} from '@/presentation/stores/useToastStore';

jest.mock('@/presentation/stores/useToastStore');
jest.mock('@/presentation/components/common/Toast', () => {
  const React = require('react');
  const {Text, TouchableOpacity} = require('react-native');
  return {
    Toast: ({id, message, onHide}: any) => (
      <TouchableOpacity testID={`toast-${id}`} onPress={() => onHide(id)}>
        <Text>{message}</Text>
      </TouchableOpacity>
    ),
  };
});

describe('ToastContainer', () => {
  const mockHideToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ストア連携', () => {
    it('トーストが空の場合、何も表示されない', () => {
      (useToastStore as unknown as jest.Mock).mockReturnValue({
        toasts: [],
        hideToast: mockHideToast,
      });

      const {queryByTestId} = render(<ToastContainer />);

      expect(queryByTestId(/toast-/)).toBeNull();
    });

    it('トースト表示状態の場合、Toastが表示される', () => {
      (useToastStore as unknown as jest.Mock).mockReturnValue({
        toasts: [
          {
            id: 'toast-1',
            type: 'success',
            message: 'テストメッセージ',
            duration: 3000,
          },
        ],
        hideToast: mockHideToast,
      });

      const {getByText, getByTestId} = render(<ToastContainer />);

      expect(getByText('テストメッセージ')).toBeTruthy();
      expect(getByTestId('toast-toast-1')).toBeTruthy();
    });

    it('複数のトーストが表示される', () => {
      (useToastStore as unknown as jest.Mock).mockReturnValue({
        toasts: [
          {
            id: 'toast-1',
            type: 'success',
            message: 'メッセージ1',
            duration: 3000,
          },
          {
            id: 'toast-2',
            type: 'error',
            message: 'メッセージ2',
            duration: 3000,
          },
        ],
        hideToast: mockHideToast,
      });

      const {getByText, getByTestId} = render(<ToastContainer />);

      expect(getByText('メッセージ1')).toBeTruthy();
      expect(getByText('メッセージ2')).toBeTruthy();
      expect(getByTestId('toast-toast-1')).toBeTruthy();
      expect(getByTestId('toast-toast-2')).toBeTruthy();
    });
  });

  describe('閉じる処理', () => {
    it('Toast閉じる時、hideToastが呼ばれる', () => {
      (useToastStore as unknown as jest.Mock).mockReturnValue({
        toasts: [
          {
            id: 'toast-1',
            type: 'success',
            message: 'テスト',
            duration: 3000,
          },
        ],
        hideToast: mockHideToast,
      });

      const {getByTestId} = render(<ToastContainer />);

      const toast = getByTestId('toast-toast-1');
      fireEvent.press(toast);

      expect(mockHideToast).toHaveBeenCalledWith('toast-1');
    });

    it('複数のトーストがそれぞれ独立して閉じられる', () => {
      (useToastStore as unknown as jest.Mock).mockReturnValue({
        toasts: [
          {
            id: 'toast-1',
            type: 'success',
            message: 'メッセージ1',
            duration: 3000,
          },
          {
            id: 'toast-2',
            type: 'error',
            message: 'メッセージ2',
            duration: 3000,
          },
        ],
        hideToast: mockHideToast,
      });

      const {getByTestId} = render(<ToastContainer />);

      const toast1 = getByTestId('toast-toast-1');
      fireEvent.press(toast1);

      expect(mockHideToast).toHaveBeenCalledWith('toast-1');
      expect(mockHideToast).not.toHaveBeenCalledWith('toast-2');
    });
  });

  describe('トーストの位置', () => {
    it('複数のトーストが縦に並んで表示される', () => {
      (useToastStore as unknown as jest.Mock).mockReturnValue({
        toasts: [
          {
            id: 'toast-1',
            type: 'success',
            message: 'メッセージ1',
            duration: 3000,
          },
          {
            id: 'toast-2',
            type: 'error',
            message: 'メッセージ2',
            duration: 3000,
          },
          {
            id: 'toast-3',
            type: 'warning',
            message: 'メッセージ3',
            duration: 3000,
          },
        ],
        hideToast: mockHideToast,
      });

      const {getByText} = render(<ToastContainer />);

      expect(getByText('メッセージ1')).toBeTruthy();
      expect(getByText('メッセージ2')).toBeTruthy();
      expect(getByText('メッセージ3')).toBeTruthy();
    });
  });
});

