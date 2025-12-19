/**
 * ストレージリポジトリのインターフェース
 * ローカルストレージ（MMKV）への永続化を抽象化
 */

import {Package} from '@/domain/entities/Package';

export interface ScanHistoryItem {
  id: string;
  barcode: string;
  title: string;
  type: 'book' | 'product';
  status: 'pending' | 'sent' | 'error' | 'unsent';
  scannedAt: Date;
  sentAt?: Date;
  errorMessage?: string;
}

export interface IStorageRepository {
  /**
   * Notion Integration Tokenを保存
   * @param token - Integration Token（暗号化して保存）
   */
  saveNotionToken(token: string): Promise<void>;

  /**
   * Notion Integration Tokenを取得
   * @returns 保存されたトークン、存在しない場合はnull
   */
  getNotionToken(): Promise<string | null>;

  /**
   * Notion Integration Tokenを削除
   */
  deleteNotionToken(): Promise<void>;

  /**
   * パッケージを保存
   * @param packages - パッケージ一覧
   */
  savePackages(packages: Package[]): Promise<void>;

  /**
   * パッケージ一覧を取得
   * @returns 保存されたパッケージ一覧
   */
  getPackages(): Promise<Package[]>;

  /**
   * スキャン履歴を保存
   * @param history - スキャン履歴（最大20件）
   */
  saveScanHistory(history: ScanHistoryItem[]): Promise<void>;

  /**
   * スキャン履歴を取得
   * @returns スキャン履歴一覧
   */
  getScanHistory(): Promise<ScanHistoryItem[]>;

  /**
   * スキャン履歴をクリア
   */
  clearScanHistory(): Promise<void>;
}
