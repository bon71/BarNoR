/**
 * StorageRepository実装
 * MMKVを使用したローカルストレージ操作
 */

import {
  IStorageRepository,
  ScanHistoryItem,
} from '@/domain/repositories/IStorageRepository';
import {Package, PackageType, LibraryType} from '@/domain/entities/Package';
import {MMKVStorage} from '@/data/datasources/MMKVStorage';
import {STORAGE_KEYS} from '@/config/constants';

interface PackageData {
  id: string;
  name: string;
  type: string;
  libraryType?: string; // 追加（オプショナル：マイグレーション対応）
  databaseId: string;
  propertyMapping: Record<string, string>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export class StorageRepository implements IStorageRepository {
  constructor(private readonly storage: MMKVStorage) {}

  /**
   * Notion Integration Tokenを保存
   */
  async saveNotionToken(token: string): Promise<void> {
    this.storage.set(STORAGE_KEYS.NOTION_TOKEN, token);
  }

  /**
   * Notion Integration Tokenを取得
   */
  async getNotionToken(): Promise<string | null> {
    const token = this.storage.get(STORAGE_KEYS.NOTION_TOKEN);
    return token || null;
  }

  /**
   * Notion Integration Tokenを削除
   */
  async deleteNotionToken(): Promise<void> {
    this.storage.delete(STORAGE_KEYS.NOTION_TOKEN);
  }

  /**
   * パッケージ一覧を保存
   */
  async savePackages(packages: Package[]): Promise<void> {
    const packageData: PackageData[] = packages.map(pkg => ({
      id: pkg.id,
      name: pkg.name,
      type: pkg.type,
      libraryType: pkg.libraryType, // 追加
      databaseId: pkg.databaseId,
      propertyMapping: pkg.propertyMapping,
      isActive: pkg.isActive,
      createdAt: pkg.createdAt.toISOString(),
      updatedAt: pkg.updatedAt.toISOString(),
    }));

    this.storage.setObject(STORAGE_KEYS.PACKAGES, packageData);
  }

  /**
   * パッケージ一覧を取得
   */
  async getPackages(): Promise<Package[]> {
    const packageData =
      this.storage.getObject<PackageData[]>(STORAGE_KEYS.PACKAGES);

    if (!packageData) {
      return [];
    }

    return packageData.map(
      data =>
        new Package({
          id: data.id,
          name: data.name,
          type: data.type as PackageType,
          libraryType: data.libraryType as LibraryType | undefined, // 追加
          databaseId: data.databaseId,
          propertyMapping: data.propertyMapping,
          isActive: data.isActive,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
        }),
    );
  }

  /**
   * スキャン履歴を保存
   */
  async saveScanHistory(history: ScanHistoryItem[]): Promise<void> {
    this.storage.setObject(STORAGE_KEYS.SCAN_HISTORY, history);
  }

  /**
   * スキャン履歴を取得
   */
  async getScanHistory(): Promise<ScanHistoryItem[]> {
    const history =
      this.storage.getObject<ScanHistoryItem[]>(STORAGE_KEYS.SCAN_HISTORY);
    return history || [];
  }

  /**
   * スキャン履歴をクリア
   */
  async clearScanHistory(): Promise<void> {
    this.storage.delete(STORAGE_KEYS.SCAN_HISTORY);
  }
}
