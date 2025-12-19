/**
 * Packageエンティティのシリアライズ/デシリアライズユーティリティ
 * React Navigationのパラメータとして渡す際に使用
 */

import {Package, PackageType, LibraryType} from '@/domain/entities/Package';

/**
 * Packageをシリアライズ可能な形式に変換（Dateを文字列に変換）
 */
export interface SerializablePackage {
  id: string;
  name: string;
  description?: string;
  type: PackageType;
  libraryType: LibraryType; // 追加
  databaseId: string;
  propertyMapping: Record<string, string>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Packageエンティティをシリアライズ可能な形式に変換
 */
export function serializePackage(pkg: Package): SerializablePackage {
  return {
    id: pkg.id,
    name: pkg.name,
    description: pkg.description,
    type: pkg.type,
    libraryType: pkg.libraryType, // 追加
    databaseId: pkg.databaseId,
    propertyMapping: pkg.propertyMapping,
    isActive: pkg.isActive,
    createdAt: pkg.createdAt.toISOString(),
    updatedAt: pkg.updatedAt.toISOString(),
  };
}

/**
 * シリアライズされたPackageからPackageエンティティを再構築
 */
export function deserializePackage(data: SerializablePackage): Package {
  return new Package({
    id: data.id,
    name: data.name,
    description: data.description,
    type: data.type,
    libraryType: data.libraryType, // 追加
    databaseId: data.databaseId,
    propertyMapping: data.propertyMapping,
    isActive: data.isActive,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
  });
}

