/**
 * useToastStore テスト
 */

import {useToastStore, showSuccessToast, showErrorToast, showWarningToast, showInfoToast} from '@/presentation/stores/useToastStore';

describe('useToastStore', () => {
  beforeEach(() => {
    // 各テスト前にストアをリセット
    useToastStore.setState({
      toasts: [],
    });
  });

  describe('初期状態', () => {
    it('初期状態が正しく設定されている', () => {
      const state = useToastStore.getState();

      expect(state.toasts).toEqual([]);
    });
  });

  describe('showToast', () => {
    it('トーストを追加できる', () => {
      const state = useToastStore.getState();

      state.showToast({
        type: 'success',
        message: 'テストメッセージ',
      });

      const newState = useToastStore.getState();
      expect(newState.toasts).toHaveLength(1);
      expect(newState.toasts[0].type).toBe('success');
      expect(newState.toasts[0].message).toBe('テストメッセージ');
      expect(newState.toasts[0].id).toBeDefined();
    });

    it('複数のトーストを追加できる', () => {
      const state = useToastStore.getState();

      state.showToast({
        type: 'success',
        message: 'メッセージ1',
      });

      state.showToast({
        type: 'error',
        message: 'メッセージ2',
      });

      const newState = useToastStore.getState();
      expect(newState.toasts).toHaveLength(2);
      expect(newState.toasts[0].type).toBe('success');
      expect(newState.toasts[1].type).toBe('error');
    });

    it('durationを指定できる', () => {
      const state = useToastStore.getState();

      state.showToast({
        type: 'info',
        message: 'テスト',
        duration: 5000,
      });

      const newState = useToastStore.getState();
      expect(newState.toasts[0].duration).toBe(5000);
    });

    it('各トーストに一意のIDが割り当てられる', () => {
      const state = useToastStore.getState();

      state.showToast({
        type: 'success',
        message: 'メッセージ1',
      });

      state.showToast({
        type: 'success',
        message: 'メッセージ2',
      });

      const newState = useToastStore.getState();
      expect(newState.toasts[0].id).not.toBe(newState.toasts[1].id);
    });
  });

  describe('hideToast', () => {
    it('指定したIDのトーストを削除できる', () => {
      const state = useToastStore.getState();

      state.showToast({
        type: 'success',
        message: 'メッセージ1',
      });

      state.showToast({
        type: 'error',
        message: 'メッセージ2',
      });

      const currentState = useToastStore.getState();
      const toastId = currentState.toasts[0].id;

      state.hideToast(toastId);

      const newState = useToastStore.getState();
      expect(newState.toasts).toHaveLength(1);
      expect(newState.toasts[0].message).toBe('メッセージ2');
    });

    it('存在しないIDを指定してもエラーにならない', () => {
      const state = useToastStore.getState();

      state.showToast({
        type: 'success',
        message: 'メッセージ1',
      });

      state.hideToast('non-existent-id');

      const newState = useToastStore.getState();
      expect(newState.toasts).toHaveLength(1);
    });

    it('全てのトーストを削除できる', () => {
      const state = useToastStore.getState();

      state.showToast({
        type: 'success',
        message: 'メッセージ1',
      });

      state.showToast({
        type: 'error',
        message: 'メッセージ2',
      });

      const currentState = useToastStore.getState();
      currentState.toasts.forEach(toast => {
        state.hideToast(toast.id);
      });

      const newState = useToastStore.getState();
      expect(newState.toasts).toHaveLength(0);
    });
  });

  describe('clearAllToasts', () => {
    it('全てのトーストをクリアできる', () => {
      const state = useToastStore.getState();

      state.showToast({
        type: 'success',
        message: 'メッセージ1',
      });

      state.showToast({
        type: 'error',
        message: 'メッセージ2',
      });

      state.showToast({
        type: 'warning',
        message: 'メッセージ3',
      });

      expect(useToastStore.getState().toasts).toHaveLength(3);

      state.clearAllToasts();

      const newState = useToastStore.getState();
      expect(newState.toasts).toEqual([]);
      expect(newState.toasts).toHaveLength(0);
    });

    it('トーストが空の場合でもエラーにならない', () => {
      const state = useToastStore.getState();

      state.clearAllToasts();

      const newState = useToastStore.getState();
      expect(newState.toasts).toEqual([]);
    });
  });

  describe('showSuccessToast', () => {
    it('成功トーストを表示できる', () => {
      showSuccessToast('成功しました');

      const state = useToastStore.getState();
      expect(state.toasts).toHaveLength(1);
      expect(state.toasts[0].type).toBe('success');
      expect(state.toasts[0].message).toBe('成功しました');
    });

    it('durationを指定できる', () => {
      showSuccessToast('成功しました', 5000);

      const state = useToastStore.getState();
      expect(state.toasts[0].duration).toBe(5000);
    });
  });

  describe('showErrorToast', () => {
    it('エラートーストを表示できる', () => {
      showErrorToast('エラーが発生しました');

      const state = useToastStore.getState();
      expect(state.toasts).toHaveLength(1);
      expect(state.toasts[0].type).toBe('error');
      expect(state.toasts[0].message).toBe('エラーが発生しました');
    });

    it('durationを指定できる', () => {
      showErrorToast('エラーが発生しました', 6000);

      const state = useToastStore.getState();
      expect(state.toasts[0].duration).toBe(6000);
    });
  });

  describe('showWarningToast', () => {
    it('警告トーストを表示できる', () => {
      showWarningToast('警告メッセージ');

      const state = useToastStore.getState();
      expect(state.toasts).toHaveLength(1);
      expect(state.toasts[0].type).toBe('warning');
      expect(state.toasts[0].message).toBe('警告メッセージ');
    });

    it('durationを指定できる', () => {
      showWarningToast('警告メッセージ', 4000);

      const state = useToastStore.getState();
      expect(state.toasts[0].duration).toBe(4000);
    });
  });

  describe('showInfoToast', () => {
    it('情報トーストを表示できる', () => {
      showInfoToast('情報メッセージ');

      const state = useToastStore.getState();
      expect(state.toasts).toHaveLength(1);
      expect(state.toasts[0].type).toBe('info');
      expect(state.toasts[0].message).toBe('情報メッセージ');
    });

    it('durationを指定できる', () => {
      showInfoToast('情報メッセージ', 3500);

      const state = useToastStore.getState();
      expect(state.toasts[0].duration).toBe(3500);
    });
  });

  describe('統合テスト', () => {
    it('複数のヘルパー関数を組み合わせて使用できる', () => {
      showSuccessToast('成功');
      showErrorToast('エラー');
      showWarningToast('警告');
      showInfoToast('情報');

      const state = useToastStore.getState();
      expect(state.toasts).toHaveLength(4);
      expect(state.toasts[0].type).toBe('success');
      expect(state.toasts[1].type).toBe('error');
      expect(state.toasts[2].type).toBe('warning');
      expect(state.toasts[3].type).toBe('info');
    });

    it('トーストを追加・削除・クリアの一連の流れが動作する', () => {
      showSuccessToast('メッセージ1');
      showErrorToast('メッセージ2');

      let state = useToastStore.getState();
      expect(state.toasts).toHaveLength(2);

      const toastId = state.toasts[0].id;
      state.hideToast(toastId);

      state = useToastStore.getState();
      expect(state.toasts).toHaveLength(1);

      state.clearAllToasts();

      state = useToastStore.getState();
      expect(state.toasts).toHaveLength(0);
    });
  });
});


