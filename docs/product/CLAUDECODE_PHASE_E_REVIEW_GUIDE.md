# ClaudeCode レビューガイド - Phase E: コードレビュー・品質チェック

**Phase**: E（ClaudeCodeによるコードレビュー・品質保証）
**所要時間**: 2-3時間
**目的**: Cursorが実装したコードの品質・一貫性・セキュリティを検証し、MVPリリースに向けた最終確認を行う

**前提条件**:
- Phase A完了（不要機能削除済み）
- Phase B完了（SimplifiedConfig実装済み）
- Phase C完了（スキャンフロー簡素化済み）
- Phase D完了（テスト更新済み）

---

## 📋 レビュー概要

ClaudeCodeが実施するレビューは以下の6つのカテゴリに分かれます：

1. **アーキテクチャ一貫性チェック**
2. **型安全性・TypeScript品質チェック**
3. **エラーハンドリング・バリデーションチェック**
4. **UX/UI品質チェック**
5. **テストカバレッジ・品質チェック**
6. **セキュリティ・機密情報チェック**

---

## 🎯 レビュー手順

### ステップ1: アーキテクチャ一貫性チェック

#### 1.1 Clean Architecture準拠確認

**確認項目**:
- [ ] Presentation層がDomain層に依存している
- [ ] Data層がDomain層に依存している
- [ ] Domain層が他層に依存していない（独立性）
- [ ] Infrastructure層が適切に分離されている

**確認方法**:

```bash
# 依存関係の逆転がないか確認（Domain層がPresentationやDataをimportしていないか）
grep -r "from '@/presentation" src/domain/
grep -r "from '@/data" src/domain/
grep -r "from '@/infrastructure" src/domain/

# 期待される結果: マッチなし（0件）
```

**レビューポイント**:

```typescript
// ❌ NG例: Domain層がPresentation層に依存
// src/domain/entities/SimplifiedConfig.ts
import {useConfigStore} from '@/presentation/stores/useConfigStore'; // NG!

// ✅ OK例: Domain層は独立
// src/domain/entities/SimplifiedConfig.ts
export interface SimplifiedConfig {
  notionToken: string;
  databaseId: string;
  propertyMapping: PropertyMapping;
}
```

---

#### 1.2 責務分離の確認

**確認項目**:
- [ ] ViewModelがビジネスロジックを担当
- [ ] Screenがプレゼンテーション（UI）のみを担当
- [ ] Repositoryがデータアクセスのみを担当
- [ ] Entityがビジネスルール・不変条件のみを担当

**確認方法**:

**SimplifiedConfigRepository.ts**:
```typescript
// ✅ OK: データアクセスのみ
class SimplifiedConfigRepository {
  async save(config: SimplifiedConfig): Promise<void> {
    this.storage.set('simplified_config', JSON.stringify(config));
  }

  async load(): Promise<SimplifiedConfig | null> {
    const data = this.storage.getString('simplified_config');
    return data ? JSON.parse(data) : null;
  }
}

// ❌ NG: ビジネスロジックが混入
class SimplifiedConfigRepository {
  async save(config: SimplifiedConfig): Promise<void> {
    // NG: バリデーションはViewModelの責務
    if (!config.notionToken) {
      throw new Error('Token required');
    }
    this.storage.set('simplified_config', JSON.stringify(config));
  }
}
```

**SettingsScreenSimple.tsx**:
```typescript
// ✅ OK: UIのみ、ロジックはViewModelへ
const SettingsScreenSimple = () => {
  const {config, setConfig} = useConfigStore();
  const [localConfig, setLocalConfig] = useState(config);

  const handleSave = async () => {
    // バリデーションはRepositoryかViewModelで行う
    await configRepository.save(localConfig);
    setConfig(localConfig);
  };

  return <View>...</View>;
};

// ❌ NG: ビジネスロジックが混入
const SettingsScreenSimple = () => {
  const handleSave = async () => {
    // NG: UUIDバリデーションはRepositoryの責務
    const uuidPattern = /^[0-9a-f]{32}$/;
    if (!uuidPattern.test(localConfig.databaseId)) {
      Alert.alert('Error', 'Invalid Database ID');
      return;
    }
    await configRepository.save(localConfig);
  };
};
```

---

#### 1.3 SimplifiedConfig設計の妥当性確認

**確認項目**:
- [ ] SimplifiedConfigが必要最小限のプロパティのみを持つ
- [ ] propertyMappingが固定（isbn, title, author, imageUrl）
- [ ] Notion API 2025-09-03対応
- [ ] 後方互換性を考慮した設計

**確認方法**:

**src/domain/entities/SimplifiedConfig.ts**:
```typescript
// ✅ OK: 必要最小限、明確な型定義
export interface SimplifiedConfig {
  notionToken: string;
  databaseId: string;
  propertyMapping: {
    isbn: string;
    title: string;
    author: string;
    imageUrl: string;
  };
}

// ❌ NG: 不要なプロパティ
export interface SimplifiedConfig {
  notionToken: string;
  databaseId: string;
  packageName?: string; // NG: Package概念は削除されたはず
  libraryType?: LibraryType; // NG: OpenBD固定なので不要
  propertyMapping: PropertyMapping;
}
```

---

### ステップ2: 型安全性・TypeScript品質チェック

#### 2.1 TypeScriptエラーゼロ確認

```bash
npx tsc --noEmit
```

**期待される結果**: エラー0件

**よくあるエラーと対処法**:

```typescript
// エラー例1: 暗黙的なany
// ❌ NG
const handleChange = (value) => { // Parameter 'value' implicitly has an 'any' type
  setLocalConfig({...localConfig, notionToken: value});
};

// ✅ OK
const handleChange = (value: string) => {
  setLocalConfig({...localConfig, notionToken: value});
};

// エラー例2: null/undefinedチェック不足
// ❌ NG
const propertyMapping = config.propertyMapping; // 'config' is possibly 'null'

// ✅ OK
const propertyMapping = config?.propertyMapping;
if (!config) {
  return <ErrorView />;
}
```

---

#### 2.2 型定義の適切性確認

**確認項目**:
- [ ] すべての関数に型注釈がある
- [ ] any型が使われていない（やむを得ない場合のみ許容）
- [ ] Optional型（?）が適切に使われている
- [ ] Union型が適切に使われている

**確認方法**:

```bash
# any型の使用箇所を検索
grep -r ": any" src/ --include="*.ts" --include="*.tsx"

# 期待される結果: 最小限（テストモックのみ許容）
```

**レビューポイント**:

```typescript
// ✅ OK: 明確な型定義
interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

function validateConfig(config: SimplifiedConfig): ValidationResult {
  const errors: string[] = [];
  // ...
  return {isValid: errors.length === 0, errors};
}

// ❌ NG: any型使用
function validateConfig(config: any): any { // NG!
  // ...
}
```

---

#### 2.3 null/undefined安全性確認

**確認項目**:
- [ ] strictNullChecksが有効
- [ ] null/undefinedチェックが適切
- [ ] Optional Chaining（?.）の適切な使用
- [ ] Nullish Coalescing（??）の適切な使用

**確認方法**:

```typescript
// ✅ OK: 適切なnullチェック
const ScanScreen = () => {
  const {config} = useConfigStore();

  if (!config) {
    return (
      <View>
        <Text>設定が完了していません</Text>
      </View>
    );
  }

  // ここではconfigは非nullが保証される
  return <Scanner enabled={true} />;
};

// ❌ NG: nullチェック不足
const ScanScreen = () => {
  const {config} = useConfigStore();

  // configがnullの可能性があるのにそのまま使用
  return <Text>{config.databaseId}</Text>; // NG!
};
```

---

### ステップ3: エラーハンドリング・バリデーションチェック

#### 3.1 設定バリデーションの確認

**確認項目**:
- [ ] Notion Token必須チェック
- [ ] Database ID形式チェック（UUID形式）
- [ ] Property Mapping全項目入力チェック
- [ ] エラーメッセージが明確

**確認方法**:

**src/data/repositories/SimplifiedConfigRepository.ts**:
```typescript
// ✅ OK: 包括的なバリデーション
validateConfig(config: SimplifiedConfig): ValidationResult {
  const errors: string[] = [];

  // Notion Token検証
  if (!config.notionToken || config.notionToken.trim() === '') {
    errors.push('Notion Tokenが入力されていません');
  }

  // Database ID形式検証（UUID）
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const dbIdNormalized = config.databaseId.replace(/-/g, '');
  if (!uuidPattern.test(config.databaseId) && dbIdNormalized.length !== 32) {
    errors.push('データベースIDの形式が正しくありません');
  }

  // Property Mapping検証
  const {title, author, isbn, imageUrl} = config.propertyMapping;
  if (!title || !author || !isbn || !imageUrl) {
    errors.push('すべてのプロパティマッピングを入力してください');
  }

  return {isValid: errors.length === 0, errors};
}

// ❌ NG: 不完全なバリデーション
validateConfig(config: SimplifiedConfig): ValidationResult {
  // Tokenのチェックのみ（不十分）
  if (!config.notionToken) {
    return {isValid: false, errors: ['Token required']};
  }
  return {isValid: true, errors: []};
}
```

---

#### 3.2 スキャン処理のエラーハンドリング確認

**確認項目**:
- [ ] 設定未完了時のエラー処理
- [ ] ISBN形式不正時のエラー処理
- [ ] 書籍情報取得失敗時のエラー処理
- [ ] Notion保存失敗時のエラー処理
- [ ] ユーザーフレンドリーなエラーメッセージ

**確認方法**:

**src/presentation/viewmodels/ScanViewModel.ts**:
```typescript
// ✅ OK: 包括的なエラーハンドリング
async handleBarcodeScanned(barcode: string): Promise<ScanResult> {
  try {
    // 設定読み込み
    await this.loadConfig();
    if (!this.config) {
      throw new Error(ERROR_MESSAGES.CONFIG_NOT_FOUND);
    }

    // ISBNバリデーション
    const isbn = this.validateAndExtractISBN(barcode);
    if (!isbn) {
      throw new Error(ERROR_MESSAGES.SCAN_INVALID_BARCODE);
    }

    // 書籍情報取得
    const bookData = await this.openBDAPI.fetchByISBN(isbn);
    if (!bookData) {
      throw new Error(
        ERROR_MESSAGES.SCAN_BOOK_NOT_FOUND.replace('{isbn}', isbn)
      );
    }

    // Notion保存
    const page = await this.notionRepository.createPage(
      this.config.databaseId,
      this.mapToNotionProperties(bookData, this.config.propertyMapping),
    );

    return {success: true, bookData, notionPage: page};

  } catch (error) {
    console.error('[ScanViewModel] スキャンエラー:', error);
    throw error; // 上位でキャッチして適切に表示
  }
}

// ❌ NG: エラーハンドリング不足
async handleBarcodeScanned(barcode: string): Promise<ScanResult> {
  // try-catchなし、nullチェックなし
  const bookData = await this.openBDAPI.fetchByISBN(barcode);
  const page = await this.notionRepository.createPage(
    this.config.databaseId, // configがnullの可能性
    properties,
  );
  return {success: true, bookData, notionPage: page};
}
```

---

#### 3.3 エラーメッセージの統一性確認

**確認項目**:
- [ ] errorMessages.tsでエラーメッセージを一元管理
- [ ] ユーザーフレンドリーな日本語メッセージ
- [ ] 具体的な解決策を提示
- [ ] 技術的詳細は含まない（ユーザー向け）

**確認方法**:

**src/utils/errorMessages.ts**:
```typescript
// ✅ OK: 一元管理、明確なメッセージ
export const ERROR_MESSAGES = {
  CONFIG_NOT_FOUND: '設定が見つかりません。設定画面から必要な情報を入力してください。',
  CONFIG_NOTION_TOKEN_REQUIRED: 'Notion Tokenが入力されていません',
  CONFIG_DATABASE_ID_INVALID: 'データベースIDの形式が正しくありません',
  SCAN_BOOK_NOT_FOUND: '書籍情報が見つかりませんでした（ISBN: {isbn}）',
  SCAN_INVALID_BARCODE: 'バーコードの形式が正しくありません',
} as const;

// ❌ NG: ハードコード、技術的すぎる
throw new Error('Config is null or undefined'); // NG: 英語、技術的
throw new Error('Failed to fetch'); // NG: 抽象的すぎる
```

---

### ステップ4: UX/UI品質チェック

#### 4.1 設定画面のUX確認

**確認項目**:
- [ ] 入力フォームが明確でわかりやすい
- [ ] プレースホルダーが適切
- [ ] バリデーションエラーが即座に表示される
- [ ] 保存成功時のフィードバックがある
- [ ] データベースプレビュー機能が動作する

**確認方法**:

**src/presentation/screens/SettingsScreenSimple.tsx**:
```typescript
// ✅ OK: 明確なラベル、プレースホルダー、エラー表示
<View>
  <Text style={styles.label}>Notion Integration Token</Text>
  <TextInput
    placeholder="secret_xxxxx..."
    value={localConfig.notionToken}
    onChangeText={(value) => setLocalConfig({...localConfig, notionToken: value})}
    secureTextEntry={true} // トークンはマスク表示
  />
  {validationErrors.notionToken && (
    <Text style={styles.errorText}>{validationErrors.notionToken}</Text>
  )}
</View>

<TouchableOpacity onPress={handleSave} style={styles.saveButton}>
  <Text style={styles.saveButtonText}>保存</Text>
</TouchableOpacity>

{saveSuccess && (
  <Text style={styles.successText}>✓ 設定を保存しました</Text>
)}
```

---

#### 4.2 スキャン画面のUX確認

**確認項目**:
- [ ] 設定未完了時のエラーが目立つ
- [ ] 「設定画面へ」ボタンがわかりやすい
- [ ] スキャン無効化が視覚的に明確
- [ ] スキャン成功時のフィードバックがある

**確認方法**:

**src/presentation/screens/ScanScreen.tsx**:
```typescript
// ✅ OK: 明確なエラー表示、ナビゲーション誘導
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

<BarcodeScanner
  enabled={!configError}
  onBarcodeScanned={handleBarcodeScanned}
  style={[
    styles.scanner,
    configError && styles.scannerDisabled, // 視覚的に無効化を示す
  ]}
/>
```

**スタイル確認**:
```typescript
// ✅ OK: 視認性の高いエラー表示
configErrorContainer: {
  backgroundColor: '#FEF2F2', // 薄い赤背景
  padding: 16,
  borderRadius: 8,
  margin: 16,
  borderWidth: 1,
  borderColor: '#FCA5A5', // 赤ボーダー
},
configErrorText: {
  color: '#DC2626', // 濃い赤文字
  fontSize: 14,
  marginBottom: 8,
},
```

---

#### 4.3 スキャン結果画面のUX確認

**確認項目**:
- [ ] 書籍情報が読みやすく表示される
- [ ] プロパティマッピングが確認できる
- [ ] Notion DBへのリンクが動作する
- [ ] 次のアクションが明確（再スキャン、ホームに戻る等）

---

### ステップ5: テストカバレッジ・品質チェック

#### 5.1 テスト実行確認

```bash
# 全テスト実行
npm test

# 期待される結果
# Test Suites: すべて通過
# Tests: すべて通過
```

**確認項目**:
- [ ] Test Suites: 0 failed
- [ ] Tests: 0 failed
- [ ] 実行時間: 妥当な範囲（数分以内）

---

#### 5.2 カバレッジ確認

```bash
npm test -- --coverage
```

**期待されるカバレッジ**:
- [ ] Statements: 80%以上
- [ ] Branches: 75%以上
- [ ] Functions: 80%以上
- [ ] Lines: 80%以上

**重点チェック対象**:
- SimplifiedConfigRepository: 90%以上
- ScanViewModel: 85%以上
- SettingsScreenSimple: 80%以上

**カバレッジ不足時の対処法**:

```bash
# カバレッジ詳細レポート確認
npm test -- --coverage --coverageReporters=html
open coverage/index.html

# 未カバーの行を特定し、テストを追加
```

---

#### 5.3 テスト品質の確認

**確認項目**:
- [ ] 正常系・異常系の両方をテスト
- [ ] エッジケース（境界値）のテスト
- [ ] モックが適切に使用されている
- [ ] テストが独立している（順序依存なし）

**レビューポイント**:

```typescript
// ✅ OK: 正常系・異常系・エッジケースをカバー
describe('validateConfig', () => {
  it('正しい設定はバリデーション通過', () => { /* ... */ });
  it('Notion Token未入力時はエラー', () => { /* ... */ });
  it('Database ID形式不正時はエラー', () => { /* ... */ });
  it('Database IDのハイフンあり/なし両対応', () => { /* ... */ });
  it('プロパティマッピング不完全時はエラー', () => { /* ... */ });
});

// ❌ NG: 正常系のみ
describe('validateConfig', () => {
  it('正しい設定はバリデーション通過', () => { /* ... */ });
  // 異常系テストなし
});
```

---

### ステップ6: セキュリティ・機密情報チェック

#### 6.1 機密情報の保護確認

**確認項目**:
- [ ] Notion Tokenがログ出力されていない
- [ ] Tokenが平文でコミットされていない
- [ ] .gitignoreに機密ファイルが追加されている
- [ ] セキュアストレージ（MMKV）が使用されている

**確認方法**:

```bash
# ログ出力でTokenが露出していないか確認
grep -r "console.log.*notionToken" src/
grep -r "console.log.*config" src/

# 期待される結果: マッチなし、またはマスク処理済み
```

**レビューポイント**:

```typescript
// ✅ OK: Tokenをマスク表示
console.log('[Config] Loaded config:', {
  ...config,
  notionToken: config.notionToken.slice(0, 7) + '***', // マスク
});

// ❌ NG: Tokenを平文でログ出力
console.log('[Config] Loaded config:', config); // NG!
```

---

#### 6.2 入力値サニタイゼーション確認

**確認項目**:
- [ ] Database IDのサニタイゼーション（ハイフン除去、小文字化）
- [ ] Property Mappingのtrim処理
- [ ] XSS対策（React Nativeは自動対応だが念のため確認）

**確認方法**:

```typescript
// ✅ OK: 入力値の正規化
validateConfig(config: SimplifiedConfig): ValidationResult {
  // Database IDを正規化（ハイフン除去、小文字化）
  const dbIdNormalized = config.databaseId
    .replace(/-/g, '')
    .toLowerCase();

  // プロパティ名のtrim
  const {title, author, isbn, imageUrl} = config.propertyMapping;
  if (!title.trim() || !author.trim()) {
    errors.push('プロパティマッピングを入力してください');
  }
}
```

---

## ✅ 完了確認チェックリスト

Phase E完了後、以下を確認してください：

### 1. アーキテクチャ

- [ ] Clean Architecture準拠確認済み
- [ ] 責務分離確認済み
- [ ] SimplifiedConfig設計の妥当性確認済み

### 2. 型安全性

- [ ] TypeScriptエラー 0件確認済み
- [ ] 型定義の適切性確認済み
- [ ] null/undefined安全性確認済み

### 3. エラーハンドリング

- [ ] 設定バリデーション確認済み
- [ ] スキャン処理のエラーハンドリング確認済み
- [ ] エラーメッセージの統一性確認済み

### 4. UX/UI

- [ ] 設定画面のUX確認済み
- [ ] スキャン画面のUX確認済み
- [ ] スキャン結果画面のUX確認済み

### 5. テスト

- [ ] テスト実行確認済み（全通過）
- [ ] カバレッジ確認済み（80%以上）
- [ ] テスト品質確認済み

### 6. セキュリティ

- [ ] 機密情報の保護確認済み
- [ ] 入力値サニタイゼーション確認済み

---

## 📊 レビュー結果レポート作成

Phase Eレビュー完了後、以下の形式でレポートを作成してください：

**ファイル**: `docs/product/PHASE_E_REVIEW_RESULT.md`

```markdown
# Phase E レビュー結果レポート

**レビュー日**: YYYY-MM-DD
**レビュー担当**: ClaudeCode

---

## 📊 総合評価

- **アーキテクチャ**: ✅ 合格 / ⚠️ 要改善 / ❌ 不合格
- **型安全性**: ✅ 合格 / ⚠️ 要改善 / ❌ 不合格
- **エラーハンドリング**: ✅ 合格 / ⚠️ 要改善 / ❌ 不合格
- **UX/UI**: ✅ 合格 / ⚠️ 要改善 / ❌ 不合格
- **テスト**: ✅ 合格 / ⚠️ 要改善 / ❌ 不合格
- **セキュリティ**: ✅ 合格 / ⚠️ 要改善 / ❌ 不合格

**総合判定**: ✅ MVPリリース可 / ⚠️ 修正後リリース可 / ❌ 再実装必要

---

## 🔍 詳細レビュー結果

### 1. アーキテクチャ一貫性

**結果**: ✅ 合格

**確認項目**:
- ✅ Clean Architecture準拠
- ✅ 責務分離適切
- ✅ SimplifiedConfig設計妥当

**指摘事項**: なし

---

### 2. 型安全性

**結果**: ✅ 合格

**確認項目**:
- ✅ TypeScriptエラー 0件
- ✅ 型定義適切
- ✅ null/undefined安全

**指摘事項**: なし

---

### 3. エラーハンドリング

**結果**: ⚠️ 要改善

**確認項目**:
- ✅ 設定バリデーション適切
- ⚠️ Notion APIエラー時のリトライ処理なし
- ✅ エラーメッセージ統一

**指摘事項**:
1. Notion API呼び出し時のリトライ処理追加を推奨（Post-MVP可）

---

### 4. UX/UI

**結果**: ✅ 合格

**確認項目**:
- ✅ 設定画面UX良好
- ✅ スキャン画面UX良好
- ✅ エラー表示明確

**指摘事項**: なし

---

### 5. テスト

**結果**: ✅ 合格

**確認項目**:
- ✅ 全テスト通過
- ✅ カバレッジ 85%達成
- ✅ テスト品質良好

**指摘事項**: なし

---

### 6. セキュリティ

**結果**: ✅ 合格

**確認項目**:
- ✅ Tokenマスク処理適切
- ✅ セキュアストレージ使用
- ✅ 入力値サニタイゼーション適切

**指摘事項**: なし

---

## 📝 推奨改善項目（Post-MVP）

1. Notion APIエラー時のリトライ処理追加
2. データベースプレビューのローディング表示改善
3. スキャン履歴のエクスポート機能追加

---

## ✅ MVP リリース判定

**判定**: ✅ MVPリリース可

**理由**:
- 必須機能すべて実装済み
- 品質基準（型安全性、テスト、セキュリティ）すべて達成
- UX/UI品質良好
- 指摘事項はPost-MVP対応で問題なし

**次のステップ**: 実機テスト（Phase F）に進んでください
```

---

## 📞 Phase E完了報告

Phase Eレビュー完了後、以下を確認してClaudeCodeに報告してください：

### 1. レビュー完了確認

- [ ] 全6カテゴリのレビュー実施済み
- [ ] レビュー結果レポート作成済み
- [ ] 総合判定完了済み

### 2. 品質基準達成確認

- [ ] TypeScriptエラー 0件
- [ ] テスト全通過
- [ ] カバレッジ 80%以上
- [ ] セキュリティチェック完了

### 3. MVP リリース可否判定

- [ ] MVPリリース可 / 要修正 / 再実装必要

---

**Phase E完了後、実機テスト（Phase F）に進んでください。**
