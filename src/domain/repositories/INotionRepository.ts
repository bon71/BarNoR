/**
 * Notionリポジトリのインターフェース
 */

import {ScannedItem} from '@/domain/entities/ScannedItem';
import {Package} from '@/domain/entities/Package';
import {SimplifiedConfig} from '@/domain/entities/SimplifiedConfig';

export interface NotionDatabase {
  id: string;
  title: string;
  description?: string;
  properties?: Record<string, any>;
}

export interface NotionProperty {
  id: string;
  name: string;
  type: string;
}

export interface SaveResult {
  success: boolean;
  pageId?: string;
  error?: string;
}

export interface NotionPage {
  id: string;
  properties: Record<string, any>;
  createdTime: string;
  lastEditedTime: string;
}

export interface QueryDatabaseResult {
  pages: NotionPage[];
  hasMore: boolean;
}

export interface INotionRepository {
  /**
   * Integration Tokenの検証
   * @param token - Notion Integration Token
   * @returns 有効な場合true
   */
  validateToken(token: string): Promise<boolean>;

  /**
   * アクセス可能なデータベース一覧を取得
   * @param token - Notion Integration Token
   * @returns データベース一覧
   */
  listDatabases(token: string): Promise<NotionDatabase[]>;

  /**
   * データベースの詳細を取得
   * @param token - Notion Integration Token
   * @param databaseId - データベースID
   * @returns データベース詳細
   */
  getDatabase(
    token: string,
    databaseId: string,
  ): Promise<NotionDatabase>;

  /**
   * データベースのプロパティ一覧を取得
   * @param token - Notion Integration Token
   * @param databaseId - データベースID
   * @returns プロパティ一覧
   */
  getDatabaseProperties(
    token: string,
    databaseId: string,
  ): Promise<NotionProperty[]>;

  /**
   * Notionにアイテムを保存
   * @param token - Notion Integration Token
   * @param pkg - パッケージ
   * @param item - スキャンされたアイテム
   * @returns 保存結果
   */
  saveItem(
    token: string,
    pkg: Package,
    item: ScannedItem,
  ): Promise<SaveResult>;

  /**
   * Notionにアイテムを保存（SimplifiedConfig使用）
   * @param config - 簡素化された設定
   * @param item - スキャンされたアイテム
   * @returns 保存結果
   */
  saveItemWithConfig(
    config: SimplifiedConfig,
    item: ScannedItem,
  ): Promise<SaveResult>;

  /**
   * データベースのページをクエリ（プレビュー用）
   * @param token - Notion Integration Token
   * @param databaseId - データベースID
   * @param pageSize - 取得するページ数（デフォルト: 5）
   * @returns クエリ結果
   */
  queryDatabasePages(
    token: string,
    databaseId: string,
    pageSize?: number,
  ): Promise<QueryDatabaseResult>;
}
