/**
 * スキャン履歴管理ストア
 * バーコードスキャン履歴とスキャン結果の管理
 */

import {create} from 'zustand';
import {ScannedItem} from '@/domain/entities/ScannedItem';
import {ScanHistoryItem} from '@/domain/repositories/IStorageRepository';

interface ScanState {
  // State
  scanHistory: ScanHistoryItem[];
  currentScannedItem: ScannedItem | null;
  isScanning: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setScanHistory: (history: ScanHistoryItem[]) => void;
  addToHistory: (item: ScanHistoryItem) => void;
  updateHistoryItem: (itemId: string, updates: Partial<ScanHistoryItem>) => void;
  clearHistory: () => void;
  setCurrentScannedItem: (item: ScannedItem | null) => void;
  setIsScanning: (isScanning: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useScanStore = create<ScanState>((set) => ({
  // Initial State
  scanHistory: [],
  currentScannedItem: null,
  isScanning: false,
  isLoading: false,
  error: null,

  // Actions
  setScanHistory: (history: ScanHistoryItem[]) =>
    set({
      scanHistory: history,
    }),

  addToHistory: (item: ScanHistoryItem) =>
    set((state) => ({
      scanHistory: [item, ...state.scanHistory].slice(0, 10), // 最大10件（メモリ効率化）
    })),

  updateHistoryItem: (itemId: string, updates: Partial<ScanHistoryItem>) =>
    set((state) => ({
      scanHistory: state.scanHistory.map(item =>
        item.id === itemId ? {...item, ...updates} : item
      ),
    })),

  clearHistory: () =>
    set({
      scanHistory: [],
    }),

  setCurrentScannedItem: (item: ScannedItem | null) =>
    set({
      currentScannedItem: item,
    }),

  setIsScanning: (isScanning: boolean) =>
    set({
      isScanning,
    }),

  setLoading: (isLoading: boolean) =>
    set({
      isLoading,
    }),

  setError: (error: string | null) =>
    set({
      error,
    }),

  clearError: () =>
    set({
      error: null,
    }),
}));
