/**
 * トースト状態管理ストア
 * トーストメッセージの表示・非表示を管理
 */

import {create} from 'zustand';
import {ToastType} from '@/presentation/components/common/Toast';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastState {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
  hideToast: (id: string) => void;
  clearAllToasts: () => void;
}

export const useToastStore = create<ToastState>(set => ({
  toasts: [],

  showToast: toast => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    set(state => ({
      toasts: [...state.toasts, {...toast, id}],
    }));
  },

  hideToast: id => {
    set(state => ({
      toasts: state.toasts.filter(toast => toast.id !== id),
    }));
  },

  clearAllToasts: () => {
    set({toasts: []});
  },
}));

// ヘルパー関数
export const showSuccessToast = (message: string, duration?: number) => {
  useToastStore.getState().showToast({
    type: 'success',
    message,
    duration,
  });
};

export const showErrorToast = (message: string, duration?: number) => {
  useToastStore.getState().showToast({
    type: 'error',
    message,
    duration,
  });
};

export const showWarningToast = (message: string, duration?: number) => {
  useToastStore.getState().showToast({
    type: 'warning',
    message,
    duration,
  });
};

export const showInfoToast = (message: string, duration?: number) => {
  useToastStore.getState().showToast({
    type: 'info',
    message,
    duration,
  });
};
