# Cursor実装指示 - Phase C: スキャンフロー簡素化

**Phase**: C（スキャンフロー簡素化）
**所要時間**: 2-3時間
**目的**: パッケージ選択を削除し、固定設定（SimplifiedConfig）を使ったシンプルなスキャンフローに変更する

**前提条件**:
- Phase A完了（不要機能削除済み）
- Phase B完了（SimplifiedConfig実装済み）

---

## 📋 タスク概要

スキャン関連の画面・ViewModelを、パッケージベースから固定設定（SimplifiedConfig）ベースに変更します：

- ScanViewModelの書き換え（Package → SimplifiedConfig）
- ScanScreenの簡素化（パッケージ選択UI削除）
- ScanResultScreenの更新（固定プロパティマッピング使用）
- 設定未完了時のエラーハンドリング追加

---

## 🎯 実装手順

### ステップ1: ScanViewModel の書き換え

**ファイル**: `src/presentation/viewmodels/ScanViewModel.ts`

**変更内容**:

#### 1.1 import文の変更

**削除するimport**:
```typescript
// 削除
import {Package} from '@/domain/entities/Package';
import {usePackageStore} from '@/presentation/stores/usePackageStore';
```

**追加するimport**:
```typescript
// 追加
import {SimplifiedConfig} from '@/domain/entities/SimplifiedConfig';
import {useConfigStore} from '@/presentation/stores/useConfigStore';
```

#### 1.2 コンストラクタ・プロパティの変更

**変更前**:
```typescript
export class ScanViewModel {
  private activePackage: Package | null = null;

  constructor(
    private notionRepository: NotionRepository,
    private openBDAPI: OpenBDAPI,
    private storageRepository: StorageRepository,
  ) {}
}
```

**変更後**:
```typescript
export class ScanViewModel {
  private config: SimplifiedConfig | null = null;

  constructor(
    private notionRepository: NotionRepository,
    private openBDAPI: OpenBDAPI,
    private configRepository: SimplifiedConfigRepository,
  ) {}
}
```

#### 1.3 設定読み込みメソッドの追加

**追加するメソッド**:
```typescript
/**
 * 設定を読み込む
 */
async loadConfig(): Promise<void> {
  try {
    this.config = await this.configRepository.load();

    if (!this.config) {
      throw new Error('設定が見つかりません。設定画面から必要な情報を入力してください。');
    }

    // バリデーション
    const validation = this.configRepository.validateConfig(this.config);
    if (!validation.isValid) {
      throw new Error(`設定エラー: ${validation.errors.join(', ')}`);
    }

  } catch (error) {
    console.error('[ScanViewModel] 設定読み込みエラー:', error);
    throw error;
  }
}
```

#### 1.4 handleBarcodeScanned メソッドの書き換え

**変更前**:
```typescript
async handleBarcodeScanned(barcode: string): Promise<ScanResult> {
  if (!this.activePackage) {
    throw new Error('パッケージが選択されていません');
  }

  // バーコード処理...
  const bookData = await this.openBDAPI.fetchByISBN(isbn);

  // プロパティマッピング
  const properties = this.mapToNotionProperties(
    bookData,
    this.activePackage.propertyMapping,
  );

  // Notion保存
  const page = await this.notionRepository.createPage(
    this.activePackage.databaseId,
    properties,
  );
}
```

**変更後**:
```typescript
async handleBarcodeScanned(barcode: string): Promise<ScanResult> {
  // 設定読み込み
  await this.loadConfig();

  if (!this.config) {
    throw new Error('設定が見つかりません。設定画面から必要な情報を入力してください。');
  }

  // ISBNバリデーション
  const isbn = this.validateAndExtractISBN(barcode);

  // OpenBD API から書籍情報取得
  const bookData = await this.openBDAPI.fetchByISBN(isbn);

  if (!bookData) {
    throw new Error(`書籍情報が見つかりませんでした（ISBN: ${isbn}）`);
  }

  // プロパティマッピング（固定設定使用）
  const properties = this.mapToNotionProperties(
    bookData,
    this.config.propertyMapping,
  );

  // Notion保存（固定DB使用）
  const page = await this.notionRepository.createPage(
    this.config.databaseId,
    properties,
  );

  // 履歴保存
  await this.saveToHistory({
    barcode,
    timestamp: new Date(),
    bookData,
    notionPageId: page.id,
  });

  return {
    success: true,
    bookData,
    notionPage: page,
  };
}
```

#### 1.5 validateAndExtractISBN メソッド（既存のまま）

このメソッドは変更不要です。ISBNバリデーションロジックをそのまま使用してください。

#### 1.6 mapToNotionProperties メソッド（既存のまま）

このメソッドも変更不要です。PropertyMappingを受け取って変換するロジックはそのまま使用できます。

---

### ステップ2: ScanScreen の簡素化

**ファイル**: `src/presentation/screens/ScanScreen.tsx`

**変更内容**:

#### 2.1 不要なimport削除

**削除するimport**:
```typescript
// 削除
import {usePackageStore} from '@/presentation/stores/usePackageStore';
```

**追加するimport**:
```typescript
// 追加
import {useConfigStore} from '@/presentation/stores/useConfigStore';
```

#### 2.2 不要なstate削除

**削除するstate**:
```typescript
// 削除
const [showPackageSelector, setShowPackageSelector] = useState(false);
const {packages, activePackage, setActivePackage} = usePackageStore();
```

**追加するstate**:
```typescript
// 追加
const {config} = useConfigStore();
const [configError, setConfigError] = useState<string | null>(null);
```

#### 2.3 設定チェック処理の追加

画面表示時に設定の有無をチェックします：

```typescript
useEffect(() => {
  // 設定チェック
  if (!config) {
    setConfigError('設定が完了していません。設定画面から必要な情報を入力してください。');
  } else {
    setConfigError(null);
  }
}, [config]);
```

#### 2.4 パッケージ選択UI削除

**削除するUI**:
```typescript
{/* 削除 */}
<TouchableOpacity
  style={styles.packageButton}
  onPress={() => setShowPackageSelector(true)}>
  <Text>📦 パッケージを選択</Text>
  <Text>{activePackage?.name || '未選択'}</Text>
</TouchableOpacity>

{/* パッケージ選択モーダル */}
<Modal visible={showPackageSelector}>
  {/* ... */}
</Modal>
```

#### 2.5 設定エラー表示の追加

スキャンエリアの上に設定エラーを表示します：

```typescript
{configError && (
  <View style={styles.configErrorContainer}>
    <Text style={styles.configErrorText}>⚠️ {configError}</Text>
    <TouchableOpacity
      style={styles.goToSettingsButton}
      onPress={() => navigation.navigate('Settings')}>
      <Text style={styles.goToSettingsText}>設定画面へ</Text>
    </TouchableOpacity>
  </View>
)}
```

#### 2.6 スキャン無効化処理

設定未完了時はスキャンを無効化：

```typescript
<BarcodeScanner
  enabled={!configError} // 設定エラーがある場合は無効
  onBarcodeScanned={handleBarcodeScanned}
  style={styles.scanner}
/>
```

#### 2.7 スタイル追加

```typescript
const styles = StyleSheet.create({
  // ... 既存スタイル

  configErrorContainer: {
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 8,
    margin: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  configErrorText: {
    color: '#DC2626',
    fontSize: 14,
    marginBottom: 8,
  },
  goToSettingsButton: {
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  goToSettingsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
```

---

### ステップ3: ScanResultScreen の更新

**ファイル**: `src/presentation/screens/ScanResultScreen.tsx`

**変更内容**:

#### 3.1 import変更

**削除**:
```typescript
// 削除
import {usePackageStore} from '@/presentation/stores/usePackageStore';
```

**追加**:
```typescript
// 追加
import {useConfigStore} from '@/presentation/stores/useConfigStore';
```

#### 3.2 プロパティマッピング表示の更新

**変更前**:
```typescript
const {activePackage} = usePackageStore();
const propertyMapping = activePackage?.propertyMapping;
```

**変更後**:
```typescript
const {config} = useConfigStore();
const propertyMapping = config?.propertyMapping;
```

#### 3.3 設定未完了時のエラー表示

```typescript
if (!config) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>
        設定が見つかりません。設定画面から必要な情報を入力してください。
      </Text>
      <TouchableOpacity
        style={styles.goToSettingsButton}
        onPress={() => navigation.navigate('Settings')}>
        <Text style={styles.goToSettingsText}>設定画面へ</Text>
      </TouchableOpacity>
    </View>
  );
}
```

#### 3.4 プロパティマッピング表示（既存UI活用）

既存のプロパティマッピング表示UIはそのまま使えます：

```typescript
<View style={styles.propertyMappingSection}>
  <Text style={styles.sectionTitle}>プロパティマッピング</Text>

  <View style={styles.mappingItem}>
    <Text style={styles.mappingLabel}>タイトル →</Text>
    <Text style={styles.mappingValue}>{propertyMapping.title}</Text>
  </View>

  <View style={styles.mappingItem}>
    <Text style={styles.mappingLabel}>著者名 →</Text>
    <Text style={styles.mappingValue}>{propertyMapping.author}</Text>
  </View>

  <View style={styles.mappingItem}>
    <Text style={styles.mappingLabel}>ISBN →</Text>
    <Text style={styles.mappingValue}>{propertyMapping.isbn}</Text>
  </View>

  <View style={styles.mappingItem}>
    <Text style={styles.mappingLabel}>書影 →</Text>
    <Text style={styles.mappingValue}>{propertyMapping.imageUrl}</Text>
  </View>
</View>
```

---

### ステップ4: ViewModelProvider の更新

**ファイル**: `src/presentation/providers/ViewModelProvider.ts`

**変更内容**:

#### 4.1 import更新

**削除**:
```typescript
// 削除
import {StorageRepository} from '@/data/repositories/StorageRepository';
```

**追加**:
```typescript
// 追加
import {SimplifiedConfigRepository} from '@/data/repositories/SimplifiedConfigRepository';
```

#### 4.2 ScanViewModel初期化の更新

**変更前**:
```typescript
const storageRepository = new StorageRepository(mmkvStorage);

export const scanViewModel = new ScanViewModel(
  notionRepository,
  openBDAPI,
  storageRepository,
);
```

**変更後**:
```typescript
const simplifiedConfigRepository = new SimplifiedConfigRepository(mmkvStorage);

export const scanViewModel = new ScanViewModel(
  notionRepository,
  openBDAPI,
  simplifiedConfigRepository,
);
```

---

### ステップ5: エラーメッセージの統一

**ファイル**: `src/utils/errorMessages.ts`

**追加する定数**:

```typescript
export const ERROR_MESSAGES = {
  // ... 既存メッセージ

  // 設定関連
  CONFIG_NOT_FOUND: '設定が見つかりません。設定画面から必要な情報を入力してください。',
  CONFIG_INVALID: '設定エラー: {errors}',
  CONFIG_NOTION_TOKEN_REQUIRED: 'Notion Tokenが入力されていません',
  CONFIG_DATABASE_ID_REQUIRED: 'データベースIDが入力されていません',
  CONFIG_DATABASE_ID_INVALID: 'データベースIDの形式が正しくありません',
  CONFIG_PROPERTY_MAPPING_INCOMPLETE: 'プロパティマッピングが不完全です',

  // スキャン関連
  SCAN_NO_CONFIG: '設定が完了していません。設定画面から必要な情報を入力してください。',
  SCAN_BOOK_NOT_FOUND: '書籍情報が見つかりませんでした（ISBN: {isbn}）',
  SCAN_INVALID_BARCODE: 'バーコードの形式が正しくありません',
} as const;
```

#### 5.2 ScanViewModelでのエラーメッセージ使用

```typescript
import {ERROR_MESSAGES} from '@/utils/errorMessages';

// 使用例
if (!this.config) {
  throw new Error(ERROR_MESSAGES.CONFIG_NOT_FOUND);
}

if (!bookData) {
  throw new Error(
    ERROR_MESSAGES.SCAN_BOOK_NOT_FOUND.replace('{isbn}', isbn)
  );
}
```

---

## ✅ 完了確認チェックリスト

Phase C完了後、以下を確認してください：

### 1. TypeScriptエラー確認

```bash
npx tsc --noEmit
# エラー0件であることを確認
```

**期待される結果**: エラー0件

### 2. 変更ファイル確認

以下のファイルが変更されていることを確認：

- [ ] `src/presentation/viewmodels/ScanViewModel.ts`
- [ ] `src/presentation/screens/ScanScreen.tsx`
- [ ] `src/presentation/screens/ScanResultScreen.tsx`
- [ ] `src/presentation/providers/ViewModelProvider.ts`
- [ ] `src/utils/errorMessages.ts`

### 3. ビルド確認

```bash
npm run ios
# ビルドが通ることを確認
```

**期待される結果**: ビルド成功

### 4. 動作確認（手動テスト）

#### 4.1 設定未完了時の挙動

- [ ] 設定未完了の状態でスキャン画面を開く
- [ ] 「設定が完了していません」エラーが表示される
- [ ] 「設定画面へ」ボタンが表示される
- [ ] ボタンタップで設定画面に遷移する
- [ ] スキャンが無効化されている（カメラは起動するが読み取り不可）

#### 4.2 設定完了後の挙動

- [ ] 設定画面でNotionToken、DatabaseID、プロパティマッピングを設定
- [ ] 保存後、スキャン画面に戻る
- [ ] エラーメッセージが消える
- [ ] スキャンが有効化される
- [ ] バーコードをスキャンできる
- [ ] 書籍情報が取得される
- [ ] Notionに保存される

#### 4.3 スキャン結果画面

- [ ] スキャン成功後、結果画面に遷移
- [ ] 書籍情報が正しく表示される
- [ ] プロパティマッピングが固定設定で表示される
- [ ] Notion DBへのリンクが正しく動作する

### 5. エラーハンドリング確認

#### 5.1 設定エラー

```bash
# MMKVストレージクリア（設定削除）
# iOS Simulatorの場合
xcrun simctl --set /path/to/simulator erase all

# または、アプリ再インストール
```

- [ ] 設定削除後、スキャン画面でエラー表示される
- [ ] エラーメッセージが適切（「設定が完了していません」）

#### 5.2 書籍情報取得エラー

- [ ] 存在しないISBNをスキャン
- [ ] 「書籍情報が見つかりませんでした」エラーが表示される
- [ ] エラーにISBN番号が含まれる

#### 5.3 Notion保存エラー

- [ ] 無効なNotionTokenで設定
- [ ] スキャン時にNotionエラーが表示される
- [ ] エラーメッセージが適切

---

## 🚨 注意事項

### 削除してはいけないコード

以下のコードは**削除しないでください**（Phase D、実機テストで使用）：

- `validateAndExtractISBN` メソッド（ISBNバリデーション）
- `mapToNotionProperties` メソッド（プロパティマッピング）
- `saveToHistory` メソッド（履歴保存）
- BarcodeScanner コンポーネント本体

### エラーが出た場合

#### 1. import エラー

```bash
# 症状
Cannot find module '@/presentation/stores/useConfigStore'

# 原因
Phase B未完了またはファイルパス間違い

# 解決策
- Phase B完了を確認
- import パスを確認（@/で始まっているか）
```

#### 2. 型エラー

```bash
# 症状
Type 'SimplifiedConfig | null' is not assignable to type 'SimplifiedConfig'

# 原因
null チェック不足

# 解決策
if (!this.config) { throw new Error(...) } を追加
```

#### 3. ビルドエラー

```bash
# 症状
Metro bundler error

# 解決策
npm start -- --reset-cache
```

---

## 📞 Phase C完了報告

Phase C完了後、以下を確認してClaudeCodeに報告してください：

### 1. 変更完了確認

- [ ] すべての対象ファイルが変更された
- [ ] TypeScriptエラー確認済み（0件）
- [ ] ビルド成功確認済み

### 2. 動作確認

- [ ] 設定未完了時のエラー表示確認済み
- [ ] 設定完了後のスキャン動作確認済み
- [ ] 書籍情報取得・Notion保存確認済み

### 3. コミット

```bash
git add .
git commit -m "refactor: Phase C - スキャンフロー簡素化（SimplifiedConfig対応）

変更内容:
- ScanViewModelをSimplifiedConfig対応に書き換え
- ScanScreenからパッケージ選択UI削除
- 設定未完了時のエラーハンドリング追加
- ScanResultScreenを固定設定対応に更新
- ViewModelProviderをSimplifiedConfigRepository使用に変更

MVP価値:
- 固定設定ベースのシンプルなスキャンフロー実現
- 設定→スキャン→Notion保存の一連の流れ完成

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

**Phase C完了後、Phase Dの実装指示（テスト更新）を受け取ってください。**
