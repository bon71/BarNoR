# パッケージ・ライブラリ機能実装タスク

## 概要

パッケージの概念を再定義し、ライブラリ（データソースAPI）の概念を導入する実装タスク。
ADR-006に基づいて、段階的に実装を進める。

## 前提条件

### 完了済みタスク（ClaudeCodeで実装済み）

1. ✅ ADR-006作成: `docs/adr/20251109-adr-006-package-concept-redefinition.md`
2. ✅ `LibraryType` enum追加: `src/domain/entities/Package.ts`
3. ✅ `Package`エンティティに`libraryType`プロパティ追加
4. ✅ マイグレーション対応ロジック実装（`inferLibraryTypeFromPackageType`）
5. ✅ Notion API 2025-09-03対応: `data_source.notion_database.id`を正しく使用

### 現在の状態

- ブランチ: `fix/react-module-error-prevention`
- コンパイルエラー: LibraryType導入により、いくつかのファイルで型エラーが発生している可能性あり
- 未コミット: LibraryType関連の変更はまだコミットされていない

---

## 実装タスク一覧

### Phase 1: 既存コードの修正とコンパイルエラー解消

#### Task 1.1: 型エラー修正

**対象ファイル:**
- `src/config/defaultPackages.ts`
- `src/data/repositories/StorageRepository.ts`
- `src/presentation/viewmodels/PackageViewModel.ts`
- `src/utils/packageSerialization.ts`

**実装内容:**

```typescript
// src/config/defaultPackages.ts
import {PackageType, PackageProps, LibraryType} from '@/domain/entities/Package';

export const DEFAULT_BOOK_PACKAGE: Omit<
  PackageProps,
  'id' | 'isActive' | 'createdAt' | 'updatedAt'
> = {
  name: '書籍登録（デフォルト）',
  description: 'バーコード（ISBN）をスキャンして書籍情報をNotionに登録します。OpenBD APIから書籍データを自動取得し、書影は国立国会図書館サムネイルAPIから取得します。',
  type: PackageType.BOOK_INFO, // 後方互換性のために残す
  libraryType: LibraryType.OPENBD, // 追加
  databaseId: '51725b0ba8ca4c9db8d05228d1d8bf69',
  propertyMapping: {
    title: 'タイトル',
    author: '著者名',
    isbn: 'ISBN',
    barcode: 'ISBN',
    imageUrl: '書影',
  },
};
```

```typescript
// src/data/repositories/StorageRepository.ts
// PackageData interfaceにlibraryTypeを追加
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

// savePackages メソッド
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

// getPackages メソッド
async getPackages(): Promise<Package[]> {
  const packageData = this.storage.getObject<PackageData[]>(STORAGE_KEYS.PACKAGES);

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
```

```typescript
// src/utils/packageSerialization.ts
import {Package, PackageType, LibraryType} from '@/domain/entities/Package';

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
```

```typescript
// src/presentation/viewmodels/PackageViewModel.ts
// createPackage メソッドを更新
async createPackage(
  name: string,
  description: string,
  libraryType: LibraryType, // パラメータ追加
  databaseId: string,
  propertyMapping: Record<string, string>,
): Promise<{success: boolean; error?: string}> {
  const {addPackage, setError} = usePackageStore.getState();

  try {
    setError(null);

    const pkg = new Package({
      id: `pkg-${Date.now()}`,
      name,
      description,
      type: PackageType.BOOK_INFO, // 後方互換性のために残す
      libraryType, // 追加
      databaseId,
      propertyMapping,
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // ストレージに保存
    const currentPackages = await this.storageRepository.getPackages();
    await this.storageRepository.savePackages([...currentPackages, pkg]);

    // ストアを更新
    addPackage(pkg);

    return {success: true};
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    const friendlyError = getUserFriendlyErrorMessage(err);
    const errorMessage = formatErrorMessage(friendlyError);
    setError(errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// updatePackage メソッドを更新
async updatePackage(
  packageId: string,
  updates: Partial<{
    name: string;
    description: string;
    libraryType: LibraryType; // 追加
    databaseId: string;
    propertyMapping: Record<string, string>;
    isActive: boolean;
  }>,
): Promise<{success: boolean; error?: string}> {
  const {packages, updatePackage, setError} = usePackageStore.getState();

  try {
    setError(null);

    const existingPackage = packages.find(pkg => pkg.id === packageId);
    if (!existingPackage) {
      return {
        success: false,
        error: 'パッケージが見つかりません',
      };
    }

    const updatedPkg = new Package({
      id: existingPackage.id,
      name: updates.name ?? existingPackage.name,
      description: updates.description ?? existingPackage.description,
      type: existingPackage.type,
      libraryType: updates.libraryType ?? existingPackage.libraryType, // 追加
      databaseId: updates.databaseId ?? existingPackage.databaseId,
      propertyMapping: updates.propertyMapping ?? existingPackage.propertyMapping,
      isActive: updates.isActive ?? existingPackage.isActive,
      createdAt: existingPackage.createdAt,
      updatedAt: new Date(),
    });

    const updatedPackages = packages.map(pkg =>
      pkg.id === packageId ? updatedPkg : pkg,
    );
    await this.storageRepository.savePackages(updatedPackages);

    updatePackage(updatedPkg);

    return {success: true};
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    const friendlyError = getUserFriendlyErrorMessage(err);
    const errorMessage = formatErrorMessage(friendlyError);
    setError(errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// initializeDefaultPackages メソッドを更新
async initializeDefaultPackages(): Promise<void> {
  try {
    const existingPackages = await this.storageRepository.getPackages();

    const hasDefaultPackage = existingPackages.some(pkg =>
      DEFAULT_PACKAGES.some(defaultPkg => defaultPkg.databaseId === pkg.databaseId),
    );

    if (hasDefaultPackage) {
      return;
    }

    const defaultPackageEntities = DEFAULT_PACKAGES.map(
      (defaultPkg, index) =>
        new Package({
          id: `default-pkg-${index}`,
          name: defaultPkg.name,
          description: defaultPkg.description,
          type: defaultPkg.type,
          libraryType: defaultPkg.libraryType, // 追加
          databaseId: defaultPkg.databaseId,
          propertyMapping: defaultPkg.propertyMapping,
          isActive: index === 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
    );

    const allPackages = [...defaultPackageEntities, ...existingPackages];
    await this.storageRepository.savePackages(allPackages);

    console.log('Default packages initialized:', defaultPackageEntities.length);
  } catch (error) {
    console.error('Failed to initialize default packages:', error);
  }
}
```

#### Task 1.2: テストコード修正

**対象ファイル:**
- `src/__tests__/presentation/viewmodels/PackageViewModel.test.ts`
- `src/__tests__/presentation/screens/PackageFormScreen.test.tsx`

**実装内容:**
- `LibraryType.OPENBD` を追加してテストデータを更新
- モックデータに `libraryType` プロパティを追加

---

### Phase 2: UI改善（PackageFormScreen）

#### Task 2.1: ライブラリ選択UIの追加

**ファイル:** `src/presentation/screens/PackageFormScreen.tsx`

**実装内容:**

1. **ライブラリ選択セクションの追加**

```tsx
// State追加
const [selectedLibraryType, setSelectedLibraryType] = useState<LibraryType>(
  existingPackage?.libraryType || LibraryType.OPENBD,
);

// ライブラリ定義
const AVAILABLE_LIBRARIES = [
  {
    type: LibraryType.OPENBD,
    name: 'OpenBD（書籍情報）',
    description: 'ISBN書籍情報を取得します（国内書籍対応）',
  },
  {
    type: LibraryType.RAKUTEN_BOOKS,
    name: '楽天Books API',
    description: '楽天Booksから書籍情報を取得します（要APIキー）',
    disabled: true, // 未実装
  },
  {
    type: LibraryType.AMAZON,
    name: 'Amazon Product API',
    description: 'Amazon商品情報を取得します（要APIキー）',
    disabled: true, // 未実装
  },
];

// UI追加（基本情報セクションの後）
<View style={styles.section}>
  <Text style={[styles.sectionTitle, {color: colors.textPrimary}]}>
    ライブラリ（データソース）
  </Text>
  <Card>
    <Text style={[styles.libraryDescription, {color: colors.textSecondary}]}>
      バーコードスキャン時にどのAPIからデータを取得するかを選択してください
    </Text>
    {AVAILABLE_LIBRARIES.map(library => (
      <TouchableOpacity
        key={library.type}
        onPress={() => !library.disabled && setSelectedLibraryType(library.type)}
        style={[
          styles.libraryItem,
          selectedLibraryType === library.type && styles.libraryItemSelected,
          library.disabled && styles.libraryItemDisabled,
        ]}
        disabled={library.disabled}
      >
        <View style={styles.libraryItemContent}>
          <View style={[styles.radioButton, {borderColor: colors.primary}]}>
            {selectedLibraryType === library.type && (
              <View style={[styles.radioButtonInner, {backgroundColor: colors.primary}]} />
            )}
          </View>
          <View style={styles.libraryItemText}>
            <Text style={[styles.libraryItemTitle, {color: colors.textPrimary}]}>
              {library.name}
            </Text>
            <Text style={[styles.libraryItemDescription, {color: colors.textSecondary}]}>
              {library.description}
            </Text>
            {library.disabled && (
              <Text style={[styles.comingSoonText, {color: colors.error}]}>
                Coming Soon
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    ))}
  </Card>
</View>
```

2. **handleSave メソッド更新**

```tsx
const handleSave = async () => {
  // バリデーション...

  setIsLoading(true);
  try {
    let result;
    if (mode === 'edit' && existingPackage) {
      result = await packageViewModel.updatePackage(existingPackage.id, {
        name,
        description,
        libraryType: selectedLibraryType, // 追加
        databaseId: selectedDatabaseId,
        propertyMapping,
      });
      // ...
    } else {
      result = await packageViewModel.createPackage(
        name,
        description,
        selectedLibraryType, // 追加
        selectedDatabaseId,
        propertyMapping,
      );
      // ...
    }
  } catch (error) {
    // ...
  } finally {
    setIsLoading(false);
  }
};
```

3. **スタイル追加**

```tsx
const styles = StyleSheet.create({
  // ... 既存スタイル
  libraryDescription: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.md,
  },
  libraryItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  libraryItemSelected: {
    backgroundColor: '#F0F9FF',
  },
  libraryItemDisabled: {
    opacity: 0.5,
  },
  libraryItemContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  libraryItemText: {
    flex: 1,
  },
  libraryItemTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  libraryItemDescription: {
    fontSize: typography.fontSize.sm,
  },
  comingSoonText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
});
```

---

### Phase 3: UI改善（ScanScreen）

#### Task 3.1: パッケージ選択モーダルの追加

**ファイル:** `src/presentation/screens/ScanScreen.tsx`

**実装内容:**

1. **State追加**

```tsx
import {usePackageStore} from '@/presentation/stores/usePackageStore';

const [showPackageSelector, setShowPackageSelector] = useState(false);
const {packages, activePackage, setActivePackage} = usePackageStore();
```

2. **パッケージ選択ボタン追加**（スキャナーの上部）

```tsx
// BarcodeScanner の前に追加
{!showScanner && (
  <View style={styles.packageSelectorContainer}>
    <TouchableOpacity
      onPress={() => setShowPackageSelector(true)}
      style={[styles.packageSelectorButton, {backgroundColor: colors.primary}]}
    >
      <Text style={styles.packageSelectorButtonText}>
        📦 {activePackage?.name || 'パッケージを選択'}
      </Text>
    </TouchableOpacity>
  </View>
)}
```

3. **パッケージ選択モーダル**

```tsx
<Modal
  visible={showPackageSelector}
  animationType="slide"
  presentationStyle="pageSheet"
  onRequestClose={() => setShowPackageSelector(false)}
>
  <SafeAreaView style={[styles.modalContainer, {backgroundColor: colors.background}]}>
    <View style={styles.modalHeader}>
      <Text style={[styles.modalTitle, {color: colors.textPrimary}]}>
        パッケージを選択
      </Text>
      <TouchableOpacity onPress={() => setShowPackageSelector(false)}>
        <Text style={[styles.modalCloseButton, {color: colors.primary}]}>
          閉じる
        </Text>
      </TouchableOpacity>
    </View>
    <ScrollView contentContainerStyle={styles.modalContent}>
      {packages.map(pkg => (
        <TouchableOpacity
          key={pkg.id}
          onPress={() => {
            setActivePackage(pkg);
            setShowPackageSelector(false);
          }}
          style={[
            styles.packageItem,
            activePackage?.id === pkg.id && styles.packageItemActive,
          ]}
        >
          <View style={styles.packageItemContent}>
            <Text style={[styles.packageItemName, {color: colors.textPrimary}]}>
              {pkg.name}
            </Text>
            <Text style={[styles.packageItemLibrary, {color: colors.textSecondary}]}>
              {pkg.libraryType}
            </Text>
            {pkg.description && (
              <Text style={[styles.packageItemDescription, {color: colors.textSecondary}]}>
                {pkg.description}
              </Text>
            )}
          </View>
          {activePackage?.id === pkg.id && (
            <Text style={[styles.checkmark, {color: colors.primary}]}>✓</Text>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  </SafeAreaView>
</Modal>
```

4. **スタイル追加**

```tsx
const styles = StyleSheet.create({
  // ... 既存スタイル
  packageSelectorContainer: {
    padding: spacing.md,
  },
  packageSelectorButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
  },
  packageSelectorButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
  },
  modalCloseButton: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
  modalContent: {
    padding: spacing.md,
  },
  packageItem: {
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  packageItemActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  packageItemContent: {
    flex: 1,
  },
  packageItemName: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  packageItemLibrary: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'monospace',
    marginBottom: spacing.xs,
  },
  packageItemDescription: {
    fontSize: typography.fontSize.sm,
  },
  checkmark: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
  },
});
```

---

## 実装順序

1. ✅ **Phase 1.1**: 型エラー修正（優先度: 最高）
2. ✅ **Phase 1.2**: テストコード修正
3. **コミット**: `feat: LibraryType導入とPackageエンティティ拡張`
4. **Phase 2.1**: PackageFormScreenにライブラリ選択UI追加
5. **コミット**: `feat: パッケージ作成時にライブラリ選択可能に`
6. **Phase 3.1**: ScanScreenにパッケージ選択モーダル追加
7. **コミット**: `feat: スキャン時にパッケージを選択可能に`
8. **最終テスト**: 全機能の動作確認
9. **PR作成**: mainブランチへのマージ

---

## テスト計画

### 単体テスト
- `Package` エンティティの `libraryType` マイグレーションテスト
- `PackageViewModel` の createPackage/updatePackage テスト
- `StorageRepository` のシリアライズ/デシリアライズテスト

### 統合テスト
- パッケージ作成フロー（ライブラリ選択 → DB選択 → マッピング設定）
- スキャンフロー（パッケージ選択 → バーコードスキャン → DB保存）
- デフォルトパッケージの初期化

### E2Eテスト
1. 新規パッケージ作成
   - ライブラリ選択（OpenBD）
   - Notion DB選択
   - プロパティマッピング設定
   - 保存確認

2. パッケージ切り替え
   - スキャン画面でパッケージ選択モーダル表示
   - パッケージ切り替え
   - 選択されたパッケージが反映されることを確認

3. バーコードスキャン
   - 選択されたパッケージのライブラリでデータ取得
   - 選択されたパッケージのDBに保存

---

## 依存関係

### 必須
- `@/domain/entities/Package`: LibraryType enum
- `@/config/defaultPackages`: デフォルトパッケージ定義
- `@/presentation/stores/usePackageStore`: パッケージストア

### オプション（将来の拡張）
- 楽天Books API連携
- Amazon Product API連携
- カスタムAPI設定

---

## 備考

- 後方互換性を維持するため、`PackageType` は残す（deprecated扱い）
- 既存のパッケージデータは自動的に `LibraryType.OPENBD` にマイグレーションされる
- UI/UXは段階的に改善し、各フェーズでコミット・テストを行う

---

## 関連ドキュメント

- ADR-006: パッケージ概念の再定義とライブラリ導入
- `docs/architecture-summary.md`: アーキテクチャ概要
- `docs/product/MVP_ROADMAP.md`: MVP機能ロードマップ
