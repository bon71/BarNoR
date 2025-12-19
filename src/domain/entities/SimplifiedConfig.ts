/**
 * 簡素化された設定（MVP版）
 * パッケージ管理を廃止し、固定の図書館DB設定のみ
 */

/**
 * プロパティマッピング
 */
export interface PropertyMapping {
  /**
   * ISBN → Notionプロパティ名
   * 例: "ISBN"
   */
  isbn: string;

  /**
   * タイトル → Notionプロパティ名
   * 例: "タイトル"
   */
  title: string;

  /**
   * 著者 → Notionプロパティ名
   * 例: "著者名"
   */
  author: string;

  /**
   * 書影URL → Notionプロパティ名
   * 例: "書影"
   */
  imageUrl: string;
}

/**
 * 簡素化された設定（MVP版）
 * パッケージ管理を廃止し、固定の図書館DB設定のみ
 */
export interface SimplifiedConfig {
  /**
   * Notion Integration Token
   */
  notionToken: string;

  /**
   * 図書館データベースID（Notion Database UUID）
   */
  databaseId: string;

  /**
   * プロパティマッピング（ISBNバーコード → Notionプロパティ）
   */
  propertyMapping: PropertyMapping;
}

/**
 * 設定の初期値
 */
export const DEFAULT_CONFIG: SimplifiedConfig = {
  notionToken: '',
  databaseId: '',
  propertyMapping: {
    isbn: 'ISBN',
    title: 'タイトル',
    author: '著者名',
    imageUrl: '書影',
  },
};

