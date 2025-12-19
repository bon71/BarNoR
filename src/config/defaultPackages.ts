/**
 * デフォルトパッケージ定義
 * アプリに組み込まれる標準パッケージ
 */

import {PackageType, PackageProps, LibraryType} from '@/domain/entities/Package';

/**
 * デフォルト書籍登録パッケージ
 * OpenBD APIから書籍情報を取得し、Notionの「Library」データベースに登録
 */
export const DEFAULT_BOOK_PACKAGE: Omit<
  PackageProps,
  'id' | 'isActive' | 'createdAt' | 'updatedAt'
> = {
  name: '書籍登録（デフォルト）',
  description:
    'バーコード（ISBN）をスキャンして書籍情報をNotionに登録します。OpenBD APIから書籍データを自動取得し、書影は国立国会図書館サムネイルAPIから取得します。',
  type: PackageType.BOOK_INFO, // 後方互換性のために残す
  libraryType: LibraryType.OPENBD, // 追加
  databaseId: '51725b0ba8ca4c9db8d05228d1d8bf69', // Library データベース
  propertyMapping: {
    // スキャンアイテムのフィールド → Notionプロパティ
    title: 'タイトル', // title型
    author: '著者名', // rich_text型
    isbn: 'ISBN', // rich_text型
    barcode: 'ISBN', // バーコードもISBNに保存
    imageUrl: '書影', // files型
    // 注: publisherとpublishedDateはNotionデータベースに対応プロパティがないため未マッピング
  },
};

/**
 * すべてのデフォルトパッケージ
 */
export const DEFAULT_PACKAGES = [DEFAULT_BOOK_PACKAGE];

/**
 * デフォルトパッケージかどうかを判定
 */
export function isDefaultPackage(databaseId: string): boolean {
  return DEFAULT_PACKAGES.some(pkg => pkg.databaseId === databaseId);
}

/**
 * デフォルトパッケージの取得
 */
export function getDefaultPackageByDatabaseId(
  databaseId: string,
): (typeof DEFAULT_BOOK_PACKAGE) | undefined {
  return DEFAULT_PACKAGES.find(pkg => pkg.databaseId === databaseId);
}
