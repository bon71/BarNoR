/**
 * Package エンティティ
 * Notionデータベースとプロパティマッピングを管理
 */

/**
 * ライブラリタイプ（データソースAPI）
 * パッケージがどのAPIからデータを取得するかを定義
 */
export enum LibraryType {
  OPENBD = 'OPENBD',               // OpenBD API（書籍情報）
  RAKUTEN_BOOKS = 'RAKUTEN_BOOKS', // 楽天Books API
  AMAZON = 'AMAZON',               // Amazon Product API
  CUSTOM = 'CUSTOM',               // カスタムAPI
}

/**
 * @deprecated PackageTypeは非推奨です。LibraryTypeを使用してください。
 * 後方互換性のために残していますが、将来のバージョンで削除されます。
 */
export enum PackageType {
  BOOK_INFO = 'book_info',
  PRODUCT_INFO = 'product_info',
}

export interface PropertyMapping {
  [key: string]: string;
}

export interface PackageProps {
  id: string;
  name: string;
  description?: string;
  type: PackageType; // @deprecated 後方互換性のために残す
  libraryType?: LibraryType; // 新しいライブラリタイプ（オプショナル：マイグレーション対応）
  databaseId: string;
  propertyMapping: PropertyMapping;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Package {
  public readonly id: string;
  public readonly name: string;
  public readonly description?: string;
  public readonly type: PackageType; // @deprecated
  public readonly libraryType: LibraryType; // 新しいライブラリタイプ
  public readonly databaseId: string;
  public readonly propertyMapping: PropertyMapping;
  public readonly isActive: boolean;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(props: PackageProps) {
    // バリデーション
    this.validateName(props.name);
    this.validateDatabaseId(props.databaseId);
    this.validatePropertyMapping(props.propertyMapping);

    // プロパティの設定
    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.type = props.type;

    // libraryTypeのマイグレーション対応: 指定がない場合はtypeから推測
    this.libraryType = props.libraryType || this.inferLibraryTypeFromPackageType(props.type);

    this.databaseId = props.databaseId;
    this.propertyMapping = props.propertyMapping;
    this.isActive = props.isActive;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }

  /**
   * PackageTypeからLibraryTypeを推測（マイグレーション用）
   */
  private inferLibraryTypeFromPackageType(type: PackageType): LibraryType {
    switch (type) {
      case PackageType.BOOK_INFO:
        return LibraryType.OPENBD;
      case PackageType.PRODUCT_INFO:
        return LibraryType.CUSTOM;
      default:
        return LibraryType.OPENBD;
    }
  }

  /**
   * 名前のバリデーション
   */
  private validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Package name is required');
    }
  }

  /**
   * データベースIDのバリデーション
   */
  private validateDatabaseId(databaseId: string): void {
    if (!databaseId || databaseId.trim().length === 0) {
      throw new Error('Database ID is required');
    }
  }

  /**
   * プロパティマッピングのバリデーション
   */
  private validatePropertyMapping(mapping: PropertyMapping): void {
    if (Object.keys(mapping).length === 0) {
      throw new Error('At least one property mapping is required');
    }
  }

  /**
   * BookInfoパッケージかどうかを判定
   */
  public isBookInfoPackage(): boolean {
    return this.type === PackageType.BOOK_INFO;
  }

  /**
   * ProductInfoパッケージかどうかを判定
   */
  public isProductInfoPackage(): boolean {
    return this.type === PackageType.PRODUCT_INFO;
  }

  /**
   * パッケージを有効化（イミュータブル）
   */
  public activate(): Package {
    return new Package({
      ...this,
      isActive: true,
      updatedAt: new Date(),
    });
  }

  /**
   * パッケージを無効化（イミュータブル）
   */
  public deactivate(): Package {
    return new Package({
      ...this,
      isActive: false,
      updatedAt: new Date(),
    });
  }

  /**
   * プロパティマッピングから値を取得
   */
  public getPropertyValue(key: string): string | undefined {
    return this.propertyMapping[key];
  }

  /**
   * プロパティが存在するか確認
   */
  public hasProperty(key: string): boolean {
    return key in this.propertyMapping;
  }

  /**
   * エンティティを比較
   */
  public equals(other: Package): boolean {
    return this.id === other.id;
  }
}
