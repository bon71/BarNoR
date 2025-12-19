# エラーハンドリング強化とパッケージ編集機能完了報告書

## 📅 実施日時

**作業日**: 2025年10月28日

## 📝 やったこと

### 1. エラーハンドリング強化

#### 1.1 リトライユーティリティの作成

**ファイル**: `src/utils/retry.ts`

**実装した機能**:
- **withRetry()**: 指数バックオフ付きリトライ機能
  - デフォルト: 最大3回リトライ、初回待機1000ms、バックオフ係数2倍
  - カスタマイズ可能なリトライ条件
  - ネットワークエラー・タイムアウト・5xxエラーを自動検出
- **withTimeout()**: タイムアウト機能
  - Promise.race()を使用した実装
  - 指定時間を超えるとタイムアウトエラー
- **withRetryAndTimeout()**: リトライ+タイムアウト組み合わせ
  - デフォルトタイムアウト: 30秒

**実装コード例**:
```typescript
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxRetries = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    shouldRetry = defaultShouldRetry,
  } = options;

  let lastError: Error | null = null;
  let currentDelay = delayMs;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // 最後の試行の場合はエラーをスロー
      if (attempt === maxRetries) {
        throw lastError;
      }

      // リトライすべきエラーかチェック
      if (!shouldRetry(lastError)) {
        throw lastError;
      }

      // リトライ前に待機
      await delay(currentDelay);

      // 次のリトライの待機時間を増やす（Exponential Backoff）
      currentDelay *= backoffMultiplier;
    }
  }

  throw lastError || new Error('Unknown error');
}
```

#### 1.2 エラーメッセージ一元管理システムの作成

**ファイル**: `src/utils/errorMessages.ts`

**実装した機能**:
- **ErrorType enum**: 15種類のエラータイプを定義
  - ネットワークエラー (NETWORK_ERROR, TIMEOUT_ERROR, SERVER_ERROR)
  - 認証エラー (AUTH_INVALID_TOKEN, AUTH_TOKEN_EXPIRED, AUTH_UNAUTHORIZED)
  - データベースエラー (DATABASE_NOT_FOUND, DATABASE_ACCESS_DENIED)
  - パッケージエラー (PACKAGE_NOT_FOUND, PACKAGE_ALREADY_EXISTS, PACKAGE_INVALID_MAPPING)
  - スキャンエラー (SCAN_BARCODE_NOT_FOUND, SCAN_API_ERROR)
  - ストレージエラー (STORAGE_READ_ERROR, STORAGE_WRITE_ERROR)
  - 汎用エラー (UNKNOWN_ERROR)

- **ErrorMessage interface**: エラーメッセージ構造
  ```typescript
  interface ErrorMessage {
    title: string;          // エラータイトル
    message: string;        // エラーメッセージ
    suggestedAction?: string; // 推奨アクション
  }
  ```

- **ユーザーフレンドリーな日本語メッセージ**: 全エラーに対応
  ```typescript
  [ErrorType.NETWORK_ERROR]: {
    title: 'ネットワークエラー',
    message: 'インターネット接続を確認してください',
    suggestedAction: 'Wi-Fiまたはモバイルデータ接続を確認して、再試行してください',
  }
  ```

- **getUserFriendlyErrorMessage()**: エラーからメッセージを生成
  - エラーメッセージからエラータイプを自動推測
  - 該当するユーザーフレンドリーなメッセージを返す

- **formatErrorMessage()**: エラーメッセージをフォーマット
  - メッセージ + 推奨アクションを結合

#### 1.3 PackageViewModelへのエラーハンドリング統合

**ファイル**: `src/presentation/viewmodels/PackageViewModel.ts`

**更新したメソッド**:

1. **fetchNotionDatabases()**: データベース一覧取得
```typescript
async fetchNotionDatabases(): Promise<{
  success: boolean;
  databases?: Array<{id: string; title: string; description?: string}>;
  error?: string;
}> {
  try {
    const token = useAuthStore.getState().notionToken;
    if (!token) {
      return {success: false, error: '認証されていません'};
    }

    // リトライ＋タイムアウト付きでデータベース一覧を取得
    const databases = await withRetryAndTimeout(
      () => this.notionRepository.listDatabases(token),
      {maxRetries: 3, delayMs: 1000},
      10000, // 10秒タイムアウト
    );

    return {
      success: true,
      databases: databases.map(db => ({
        id: db.id,
        title: db.title,
        description: db.description,
      })),
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    const friendlyError = getUserFriendlyErrorMessage(err);
    return {success: false, error: formatErrorMessage(friendlyError)};
  }
}
```

2. **fetchDatabaseProperties()**: プロパティ一覧取得
   - 同様のリトライ+タイムアウトパターンを適用
   - ユーザーフレンドリーなエラーメッセージを返す

3. **createPackage()**: パッケージ作成
```typescript
catch (error) {
  const err = error instanceof Error ? error : new Error(String(error));
  const friendlyError = getUserFriendlyErrorMessage(err);
  const errorMessage = formatErrorMessage(friendlyError);
  setError(errorMessage);
  return {
    success: false,
    error: errorMessage,
  };
}
```

4. **activatePackage()**: パッケージ有効化
   - エラーメッセージをユーザーフレンドリーに変換

5. **deletePackage()**: パッケージ削除
   - エラーメッセージをユーザーフレンドリーに変換

### 2. パッケージ編集機能の完全実装

#### 2.1 updatePackageメソッドの追加

**ファイル**: `src/presentation/viewmodels/PackageViewModel.ts`

**新規追加したメソッド**:
```typescript
/**
 * パッケージを更新
 */
async updatePackage(
  packageId: string,
  name: string,
  description: string,
  databaseId: string,
  propertyMapping: Record<string, string>,
): Promise<{success: boolean; error?: string}> {
  const {packages, updatePackage, setError} = usePackageStore.getState();

  try {
    setError(null);

    // 既存のパッケージを取得
    const existingPackage = packages.find(pkg => pkg.id === packageId);
    if (!existingPackage) {
      return {
        success: false,
        error: 'パッケージが見つかりません',
      };
    }

    // 更新されたパッケージを作成
    const updatedPkg = new Package({
      id: existingPackage.id,
      name,
      description,
      type: existingPackage.type,
      databaseId,
      propertyMapping,
      isActive: existingPackage.isActive,
      createdAt: existingPackage.createdAt,
      updatedAt: new Date(),
    });

    // ストレージに保存
    const updatedPackages = packages.map(pkg =>
      pkg.id === packageId ? updatedPkg : pkg,
    );
    await this.storageRepository.savePackages(updatedPackages);

    // ストアを更新
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
```

**実装の特徴**:
- 既存パッケージの存在確認
- createdAt・isActive・typeは保持、その他を更新
- updatedAtを現在時刻に更新
- ストレージとストアの両方を更新
- エラーハンドリングをユーザーフレンドリーに

#### 2.2 PackageFormScreenの編集モード完全対応

**ファイル**: `src/presentation/screens/PackageFormScreen.tsx`

**更新した部分**:
```typescript
const handleSave = async () => {
  // バリデーション処理...

  setIsLoading(true);
  try {
    let result;
    if (mode === 'edit' && existingPackage) {
      // 編集モード：既存パッケージを更新
      result = await packageViewModel.updatePackage(
        existingPackage.id,
        name,
        description,
        selectedDatabaseId,
        propertyMapping,
      );
    } else {
      // 作成モード：新規パッケージを作成
      result = await packageViewModel.createPackage(
        name,
        description,
        selectedDatabaseId,
        propertyMapping,
      );
    }

    if (result.success) {
      Alert.alert(
        '成功',
        mode === 'create'
          ? 'パッケージを作成しました'
          : 'パッケージを更新しました',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } else {
      Alert.alert('エラー', result.error || '保存に失敗しました');
    }
  } catch (error) {
    console.error('Failed to save package:', error);
    Alert.alert('エラー', '保存中にエラーが発生しました');
  } finally {
    setIsLoading(false);
  }
};
```

**実装の特徴**:
- modeとexistingPackageの有無で分岐
- 編集時はupdatePackage()を呼び出し
- 作成時はcreatePackage()を呼び出し
- 成功メッセージもモードに応じて変更

## ✅ 確認方法

### TypeScript型チェック
```bash
cd /Users/bon/dev/NotionBarcodeReader
npx tsc --noEmit
```

**結果**: ✅ エラー0件

### ESLint
```bash
cd /Users/bon/dev/NotionBarcodeReader
npx eslint src/ --ext .ts,.tsx
```

**結果**: ✅ エラー0件（警告9件は意図的なテストパターン）

### テスト実行
```bash
cd /Users/bon/dev/NotionBarcodeReader
npm test
```

**結果**:
- ✅ テストスイート: 12件すべて成功
- ✅ テスト数: 102件すべて成功
- ✅ 実行時間: 0.844秒

## 📁 作成・修正したファイル一覧

### 新規作成（2ファイル）
```
src/utils/retry.ts
src/utils/errorMessages.ts
```

### 修正（2ファイル）
```
src/presentation/viewmodels/PackageViewModel.ts
src/presentation/screens/PackageFormScreen.tsx
```

### ドキュメント（1ファイル）
```
docs/completion-report-error-handling-edit-feature.md
```

**合計**: 5ファイル

## 🎯 実装されている機能

### ✅ 完成済み

1. **リトライ機能**
   - 指数バックオフ付き自動リトライ
   - カスタマイズ可能なリトライ条件
   - タイムアウト機能統合

2. **エラーメッセージ一元管理**
   - 15種類のエラータイプ定義
   - ユーザーフレンドリーな日本語メッセージ
   - 推奨アクションの提示
   - エラータイプの自動推測

3. **PackageViewModelのエラーハンドリング強化**
   - すべてのネットワーク処理にリトライ機能適用
   - すべてのエラーメッセージをユーザーフレンドリーに変換
   - 一貫したエラーハンドリングパターン

4. **パッケージ編集機能**
   - updatePackage()メソッドの実装
   - PackageFormScreenの編集モード完全対応
   - 既存データの保持と更新の適切な処理
   - 作成と編集の明確な分岐処理

## 📊 アーキテクチャ構成

### エラーハンドリングフロー
```
UI Layer (Screen)
  ↓ ユーザーアクション
ViewModel Layer
  ↓ withRetryAndTimeout()でラップ
Repository Layer
  ↓ API呼び出し
  ↓ エラー発生
  ↓ リトライ（最大3回）
  ↓ 失敗した場合
detectErrorType() でエラータイプ推測
  ↓
getUserFriendlyErrorMessage() でメッセージ取得
  ↓
formatErrorMessage() でフォーマット
  ↓
UI Layer に返却
  ↓ Alert表示
ユーザーに通知
```

### パッケージ編集フロー
```
PackageListScreen
  ↓ 編集ボタン押下
PackageFormScreen (mode: 'edit', package: existingPackage)
  ↓ 既存データをstateに読み込み
  ↓ ユーザーが編集
  ↓ 保存ボタン押下
PackageViewModel.updatePackage()
  ↓ 既存パッケージを取得
  ↓ 新しいパッケージオブジェクト作成
  ↓ ストレージに保存
  ↓ ストアを更新
PackageListScreen
  ↓ 一覧が更新される
```

## 💡 備考・注意事項

### 実装の特徴

1. **一貫したエラーハンドリングパターン**
   - すべてのエラーを統一的に処理
   - ユーザーフレンドリーなメッセージで統一
   - 推奨アクションを必ず提示

2. **ネットワーク信頼性の向上**
   - 指数バックオフによる賢いリトライ
   - タイムアウトによる無限待機の防止
   - ネットワークエラーの自動検出と対応

3. **保守性の向上**
   - エラーメッセージの一元管理
   - 新しいエラータイプの追加が容易
   - リトライロジックの再利用可能

4. **ユーザー体験の向上**
   - わかりやすい日本語エラーメッセージ
   - 具体的な対処方法の提示
   - 一時的なエラーからの自動回復

### 技術的な決定事項

1. **指数バックオフの採用**
   - 初回: 1秒待機
   - 2回目: 2秒待機
   - 3回目: 4秒待機
   - → サーバー負荷を抑えつつリトライ

2. **エラーメッセージの日本語化**
   - ターゲットユーザーが日本語ネイティブ
   - 技術的な詳細を隠蔽
   - 行動を促す表現を使用

3. **PackageViewModelの一貫性**
   - すべてのメソッドが{success, error}形式を返す
   - エラーハンドリングパターンを統一
   - テストしやすい設計

### 今後の拡張ポイント

1. **エラーログの記録**
   - エラー発生時にログを保存
   - ユーザーからのフィードバック機能
   - エラー頻度の分析

2. **オフライン対応**
   - ネットワークエラー時のキャッシュ利用
   - オフライン操作のキューイング
   - 再接続時の自動同期

3. **エラーメッセージのカスタマイズ**
   - ユーザーレベルに応じたメッセージ
   - コンテキストに応じた詳細度調整
   - 多言語対応

4. **リトライ戦略の最適化**
   - エラータイプに応じたリトライ回数調整
   - サーキットブレーカーパターンの導入
   - リトライ統計の収集と分析

### 既知の制限事項

1. **リトライ対象エラーの固定**
   - 現在はネットワークエラー・タイムアウト・5xxエラーのみ
   - 4xxエラーは即座に失敗（リトライしない）
   - → 将来的にはより細かい制御が必要

2. **エラーメッセージの推測精度**
   - エラーメッセージの文字列から推測
   - 完全に正確ではない可能性
   - → より構造化されたエラー情報が望ましい

3. **タイムアウト時間の固定**
   - 現在は一律30秒（カスタマイズ可能だが）
   - 操作内容に応じた最適化が必要
   - → プロファイリングに基づく調整が今後必要

## 🔗 関連ドキュメント

- [パッケージ管理UI実装完了報告書](./completion-report-package-management.md)
- [Phase2完了報告書](./completion-report-phase2.md)
- [ViewModel-UI統合完了報告書](./completion-report-viewmodel-integration.md)

---

**作成日**: 2025年10月28日
**プロジェクト**: NotionBarcodeReader
**実装フェーズ**: エラーハンドリング強化・パッケージ編集機能実装
**次のフェーズ**: 実機テスト・UI/UXの最終調整
