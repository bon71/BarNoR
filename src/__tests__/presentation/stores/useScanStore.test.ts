/**
 * useScanStore テスト
 */

import {useScanStore} from '@/presentation/stores/useScanStore';
import {ScannedItem, ItemType} from '@/domain/entities/ScannedItem';
import {ScanHistoryItem} from '@/domain/repositories/IStorageRepository';

describe('useScanStore', () => {
  beforeEach(() => {
    // 各テスト前にストアをリセット
    useScanStore.setState({
      scanHistory: [],
      currentScannedItem: null,
      isScanning: false,
      isLoading: false,
      error: null,
    });
  });

  describe('初期状態', () => {
    it('初期状態が正しく設定されている', () => {
      const state = useScanStore.getState();

      expect(state.scanHistory).toEqual([]);
      expect(state.currentScannedItem).toBeNull();
      expect(state.isScanning).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('setScanHistory', () => {
    it('スキャン履歴を設定できる', () => {
      const history: ScanHistoryItem[] = [
        {
          id: 'scan1',
          barcode: '9784567890123',
          title: 'Book 1',
          type: 'book',
          status: 'sent',
          scannedAt: new Date(),
        },
        {
          id: 'scan2',
          barcode: '9784567890456',
          title: 'Book 2',
          type: 'book',
          status: 'error',
          scannedAt: new Date(),
        },
      ];

      useScanStore.getState().setScanHistory(history);

      const state = useScanStore.getState();
      expect(state.scanHistory).toEqual(history);
      expect(state.scanHistory).toHaveLength(2);
    });
  });

  describe('addToHistory', () => {
    it('履歴にアイテムを追加できる', () => {
      const item: ScanHistoryItem = {
        id: 'scan1',
        barcode: '9784567890123',
        title: 'Test Book',
        type: 'book',
        status: 'sent',
        scannedAt: new Date(),
      };

      useScanStore.getState().addToHistory(item);

      const state = useScanStore.getState();
      expect(state.scanHistory).toHaveLength(1);
      expect(state.scanHistory[0]).toEqual(item);
    });

    it('新しいアイテムが先頭に追加される', () => {
      const item1: ScanHistoryItem = {
        id: 'scan1',
        barcode: '9784567890123',
        title: 'Book 1',
        type: 'book',
        status: 'sent',
        scannedAt: new Date(),
      };

      const item2: ScanHistoryItem = {
        id: 'scan2',
        barcode: '9784567890456',
        title: 'Book 2',
        type: 'book',
        status: 'sent',
        scannedAt: new Date(),
      };

      useScanStore.getState().addToHistory(item1);
      useScanStore.getState().addToHistory(item2);

      const state = useScanStore.getState();
      expect(state.scanHistory[0]).toEqual(item2);
      expect(state.scanHistory[1]).toEqual(item1);
    });

    it('最大10件まで保持される', () => {
      // 11件追加
      for (let i = 1; i <= 11; i++) {
        const item: ScanHistoryItem = {
          id: `scan${i}`,
          barcode: `978456789${String(i).padStart(4, '0')}`,
          title: `Book ${i}`,
          type: 'book',
          status: 'sent',
          scannedAt: new Date(),
        };
        useScanStore.getState().addToHistory(item);
      }

      const state = useScanStore.getState();
      expect(state.scanHistory).toHaveLength(10);
      // 最新の10件が保持される（11が最新、2が最古）
      expect(state.scanHistory[0].id).toBe('scan11');
      expect(state.scanHistory[9].id).toBe('scan2');
    });
  });

  describe('updateHistoryItem', () => {
    it('履歴アイテムを更新できる', () => {
      const item: ScanHistoryItem = {
        id: 'scan1',
        barcode: '9784567890123',
        title: 'Original Title',
        type: 'book',
        status: 'pending',
        scannedAt: new Date(),
      };

      useScanStore.getState().addToHistory(item);
      useScanStore.getState().updateHistoryItem('scan1', {
        status: 'sent',
        title: 'Updated Title',
      });

      const state = useScanStore.getState();
      expect(state.scanHistory[0].status).toBe('sent');
      expect(state.scanHistory[0].title).toBe('Updated Title');
      expect(state.scanHistory[0].barcode).toBe('9784567890123'); // 他のフィールドは保持
    });

    it('部分的な更新ができる', () => {
      const item: ScanHistoryItem = {
        id: 'scan1',
        barcode: '9784567890123',
        title: 'Test Book',
        type: 'book',
        status: 'pending',
        scannedAt: new Date(),
      };

      useScanStore.getState().addToHistory(item);
      useScanStore.getState().updateHistoryItem('scan1', {
        status: 'error',
        errorMessage: 'Test error',
      });

      const state = useScanStore.getState();
      expect(state.scanHistory[0].status).toBe('error');
      expect(state.scanHistory[0].errorMessage).toBe('Test error');
      expect(state.scanHistory[0].title).toBe('Test Book'); // 元の値は保持
    });

    it('存在しないIDの場合、何も変更されない', () => {
      const item: ScanHistoryItem = {
        id: 'scan1',
        barcode: '9784567890123',
        title: 'Test Book',
        type: 'book',
        status: 'sent',
        scannedAt: new Date(),
      };

      useScanStore.getState().addToHistory(item);
      useScanStore.getState().updateHistoryItem('nonexistent', {
        title: 'Should not update',
      });

      const state = useScanStore.getState();
      expect(state.scanHistory[0].title).toBe('Test Book');
    });
  });

  describe('clearHistory', () => {
    it('履歴を全てクリアできる', () => {
      const items: ScanHistoryItem[] = [
        {
          id: 'scan1',
          barcode: '9784567890123',
          title: 'Book 1',
          type: 'book',
          status: 'sent',
          scannedAt: new Date(),
        },
        {
          id: 'scan2',
          barcode: '9784567890456',
          title: 'Book 2',
          type: 'book',
          status: 'sent',
          scannedAt: new Date(),
        },
      ];

      useScanStore.getState().setScanHistory(items);
      expect(useScanStore.getState().scanHistory).toHaveLength(2);

      useScanStore.getState().clearHistory();

      const state = useScanStore.getState();
      expect(state.scanHistory).toEqual([]);
      expect(state.scanHistory).toHaveLength(0);
    });
  });

  describe('setCurrentScannedItem', () => {
    it('現在のスキャンアイテムを設定できる', () => {
      const item = new ScannedItem({
        barcode: '9784567890123',
        type: ItemType.BOOK,
        title: 'Test Book',
        author: 'Test Author',
      });

      useScanStore.getState().setCurrentScannedItem(item);

      const state = useScanStore.getState();
      expect(state.currentScannedItem).toEqual(item);
    });

    it('nullを設定できる', () => {
      const item = new ScannedItem({
        barcode: '9784567890123',
        type: ItemType.BOOK,
        title: 'Test Book',
        author: 'Test Author',
      });

      useScanStore.getState().setCurrentScannedItem(item);
      expect(useScanStore.getState().currentScannedItem).toEqual(item);

      useScanStore.getState().setCurrentScannedItem(null);
      expect(useScanStore.getState().currentScannedItem).toBeNull();
    });
  });

  describe('setIsScanning', () => {
    it('スキャン中状態を設定できる', () => {
      useScanStore.getState().setIsScanning(true);
      expect(useScanStore.getState().isScanning).toBe(true);

      useScanStore.getState().setIsScanning(false);
      expect(useScanStore.getState().isScanning).toBe(false);
    });
  });

  describe('setLoading', () => {
    it('ローディング状態を設定できる', () => {
      useScanStore.getState().setLoading(true);
      expect(useScanStore.getState().isLoading).toBe(true);

      useScanStore.getState().setLoading(false);
      expect(useScanStore.getState().isLoading).toBe(false);
    });
  });

  describe('setError / clearError', () => {
    it('エラーを設定できる', () => {
      useScanStore.getState().setError('Test error');
      expect(useScanStore.getState().error).toBe('Test error');
    });

    it('エラーをクリアできる', () => {
      useScanStore.getState().setError('Test error');
      expect(useScanStore.getState().error).toBe('Test error');

      useScanStore.getState().clearError();
      expect(useScanStore.getState().error).toBeNull();
    });

    it('nullでエラーをクリアできる', () => {
      useScanStore.getState().setError('Test error');
      expect(useScanStore.getState().error).toBe('Test error');

      useScanStore.getState().setError(null);
      expect(useScanStore.getState().error).toBeNull();
    });
  });
});
