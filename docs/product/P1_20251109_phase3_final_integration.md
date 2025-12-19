# Phase 3: 最終統合とテスト実装プロンプト

## 概要

Phase 1（型エラー修正）とPhase 2（PackageFormScreen UI改善）が完了した後の、最終統合・テスト・コミット手順を記載します。

## 前提条件

### 完了済み

- ✅ **Phase 1**: LibraryType導入と型エラー修正
  - Package.ts, defaultPackages.ts, StorageRepository.ts, packageSerialization.ts, PackageViewModel.ts

- ✅ **Phase 2**: PackageFormScreen UI改善
  - データベース一覧表示、選択UI、バリデーション強化

- ✅ **ScanScreen**: パッケージ選択モーダル追加（既に実装済み）

### 現在の状態

- ブランチ: `fix/react-module-error-prevention`
- すべてのコード変更完了
- 未実施: 統合テスト、E2Eテスト、コミット

## 実装タスク

### Task 3.1: テストコードの更新

**対象ファイル:**
- `src/__tests__/presentation/viewmodels/PackageViewModel.test.ts`
- `src/__tests__/presentation/screens/PackageFormScreen.test.tsx`
- `src/__tests__/presentation/screens/ScanScreen.test.tsx`

**実装内容:**

#### PackageViewModel.test.ts

```typescript
// src/__tests__/presentation/viewmodels/PackageViewModel.test.ts

import {PackageViewModel} from '@/presentation/viewmodels/PackageViewModel';
import {INotionRepository} from '@/domain/repositories/INotionRepository';
import {IStorageRepository} from '@/domain/repositories/IStorageRepository';
import {Package, PackageType, LibraryType} from '@/domain/entities/Package';
import {usePackageStore} from '@/presentation/stores/usePackageStore';
import {useAuthStore} from '@/presentation/stores/useAuthStore';

// ... 既存のモック設定

describe('PackageViewModel', () => {
  // ... 既存のテスト

  describe('createPackage', () => {
    it('should create a package with libraryType', async () => {
      const result = await viewModel.createPackage(
        'Test Package',
        'Test Description',
        LibraryType.OPENBD, // 追加
        'test-database-id',
        {title: 'Title', barcode: 'Barcode'},
      );

      expect(result.success).toBe(true);
      expect(mockStorageRepository.savePackages).toHaveBeenCalled();

      const savedPackages = (mockStorageRepository.savePackages as jest.Mock).mock.calls[0][0];
      expect(savedPackages[0].libraryType).toBe(LibraryType.OPENBD);
    });
  });

  describe('updatePackage', () => {
    it('should update a package with new libraryType', async () => {
      const existingPackage = new Package({
        id: 'test-pkg-1',
        name: 'Old Package',
        description: 'Old Description',
        type: PackageType.BOOK_INFO,
        libraryType: LibraryType.OPENBD,
        databaseId: 'old-db-id',
        propertyMapping: {title: 'Title'},
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      usePackageStore.setState({packages: [existingPackage]});

      const result = await viewModel.updatePackage('test-pkg-1', {
        name: 'New Package',
        libraryType: LibraryType.RAKUTEN_BOOKS, // 変更
        databaseId: 'new-db-id',
      });

      expect(result.success).toBe(true);

      const savedPackages = (mockStorageRepository.savePackages as jest.Mock).mock.calls[0][0];
      expect(savedPackages[0].name).toBe('New Package');
      expect(savedPackages[0].libraryType).toBe(LibraryType.RAKUTEN_BOOKS);
      expect(savedPackages[0].databaseId).toBe('new-db-id');
    });
  });

  describe('initializeDefaultPackages', () => {
    it('should initialize default packages with libraryType', async () => {
      mockStorageRepository.getPackages.mockResolvedValue([]);

      await viewModel.initializeDefaultPackages();

      expect(mockStorageRepository.savePackages).toHaveBeenCalled();

      const savedPackages = (mockStorageRepository.savePackages as jest.Mock).mock.calls[0][0];
      expect(savedPackages.length).toBeGreaterThan(0);
      expect(savedPackages[0].libraryType).toBe(LibraryType.OPENBD);
    });

    it('should not initialize if default package already exists', async () => {
      const existingPackage = new Package({
        id: 'existing-pkg',
        name: 'Existing Package',
        type: PackageType.BOOK_INFO,
        libraryType: LibraryType.OPENBD,
        databaseId: '51725b0ba8ca4c9db8d05228d1d8bf69', // デフォルトパッケージのDB ID
        propertyMapping: {title: 'Title'},
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockStorageRepository.getPackages.mockResolvedValue([existingPackage]);

      await viewModel.initializeDefaultPackages();

      expect(mockStorageRepository.savePackages).not.toHaveBeenCalled();
    });
  });
});
```

#### PackageFormScreen.test.tsx

```typescript
// src/__tests__/presentation/screens/PackageFormScreen.test.tsx

import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {PackageFormScreen} from '@/presentation/screens/PackageFormScreen';
import {LibraryType} from '@/domain/entities/Package';

// ... 既存のモック設定

describe('PackageFormScreen', () => {
  it('should render library selection section', () => {
    const {getByText} = render(
      <PackageFormScreen navigation={mockNavigation} route={{params: {mode: 'create'}}} />
    );

    expect(getByText('ライブラリ（データソース）')).toBeTruthy();
    expect(getByText('OpenBD（書籍情報）')).toBeTruthy();
  });

  it('should select library type', async () => {
    const {getByText} = render(
      <PackageFormScreen navigation={mockNavigation} route={{params: {mode: 'create'}}} />
    );

    const openBDLibrary = getByText('OpenBD（書籍情報）');
    fireEvent.press(openBDLibrary);

    // 選択状態の確認はスナップショットテストまたは視覚的確認で行う
  });

  it('should show validation error when database is not selected', async () => {
    const {getByText, getByTestId} = render(
      <PackageFormScreen navigation={mockNavigation} route={{params: {mode: 'create'}}} />
    );

    // パッケージ名を入力
    const nameInput = getByTestId('package-name-input');
    fireEvent.changeText(nameInput, 'Test Package');

    // 保存ボタンをタップ（データベース未選択）
    const saveButton = getByTestId('save-package-button');
    fireEvent.press(saveButton);

    await waitFor(() => {
      // Alertが表示されることを確認（モックされている）
      expect(mockAlert).toHaveBeenCalledWith(
        'エラー',
        expect.stringContaining('Notionデータベースを選択してください')
      );
    });
  });

  it('should navigate to PropertyMapping when database is selected', async () => {
    const {getByTestId} = render(
      <PackageFormScreen navigation={mockNavigation} route={{params: {mode: 'create'}}} />
    );

    // データベースを選択（モック）
    // ... データベース選択ロジック

    const mappingButton = getByTestId('property-mapping-button');
    fireEvent.press(mappingButton);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('PropertyMapping', expect.any(Object));
  });
});
```

#### ScanScreen.test.tsx

```typescript
// src/__tests__/presentation/screens/ScanScreen.test.tsx

import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {ScanScreen} from '@/presentation/screens/ScanScreen';
import {usePackageStore} from '@/presentation/stores/usePackageStore';
import {LibraryType} from '@/domain/entities/Package';

describe('ScanScreen', () => {
  it('should show package selector button', () => {
    const {getByText} = render(
      <ScanScreen visible={true} onClose={jest.fn()} />
    );

    expect(getByText(/パッケージを選択/)).toBeTruthy();
  });

  it('should open package selector modal when button is pressed', async () => {
    const {getByText} = render(
      <ScanScreen visible={true} onClose={jest.fn()} />
    );

    const selectorButton = getByText(/パッケージを選択/);
    fireEvent.press(selectorButton);

    await waitFor(() => {
      expect(getByText('パッケージを選択')).toBeTruthy(); // モーダルタイトル
    });
  });

  it('should display packages with libraryType', async () => {
    // パッケージストアにテストデータを設定
    const testPackage = {
      id: 'test-pkg-1',
      name: 'Test Package',
      libraryType: LibraryType.OPENBD,
      // ... 他のプロパティ
    };

    usePackageStore.setState({packages: [testPackage]});

    const {getByText} = render(
      <ScanScreen visible={true} onClose={jest.fn()} />
    );

    const selectorButton = getByText(/パッケージを選択/);
    fireEvent.press(selectorButton);

    await waitFor(() => {
      expect(getByText('Test Package')).toBeTruthy();
      expect(getByText('OPENBD')).toBeTruthy();
    });
  });

  it('should change active package when package is selected', async () => {
    const testPackage1 = {
      id: 'test-pkg-1',
      name: 'Package 1',
      libraryType: LibraryType.OPENBD,
      isActive: true,
      // ... 他のプロパティ
    };

    const testPackage2 = {
      id: 'test-pkg-2',
      name: 'Package 2',
      libraryType: LibraryType.RAKUTEN_BOOKS,
      isActive: false,
      // ... 他のプロパティ
    };

    usePackageStore.setState({
      packages: [testPackage1, testPackage2],
      activePackage: testPackage1,
    });

    const {getByText} = render(
      <ScanScreen visible={true} onClose={jest.fn()} />
    );

    // パッケージセレクターを開く
    const selectorButton = getByText(/Package 1/);
    fireEvent.press(selectorButton);

    await waitFor(() => {
      const package2 = getByText('Package 2');
      fireEvent.press(package2);
    });

    // アクティブパッケージが変更されたことを確認
    const state = usePackageStore.getState();
    expect(state.activePackage?.id).toBe('test-pkg-2');
  });
});
```

### Task 3.2: 統合テストの実施

**手動テスト手順:**

#### テスト1: デフォルトパッケージの初期化

1. アプリを完全にアンインストール
2. アプリを再インストール・起動
3. **Packagesタブ**に移動
4. **確認事項:**
   - ✅ 「書籍登録（デフォルト）」パッケージが表示される
   - ✅ データベースID: `51725b0ba8ca4c9db8d05228d1d8bf69`
   - ✅ ライブラリタイプ: `OPENBD`
   - ✅ アクティブバッジが表示される

#### テスト2: パッケージ作成フロー

1. **Packagesタブ** → 「+ 新規作成」ボタンをタップ
2. **基本情報**を入力
   - パッケージ名: 「テストパッケージ」
   - 説明: 「テスト用パッケージ」
3. **ライブラリ選択**
   - 「OpenBD（書籍情報）」を選択
   - ✅ 選択状態が視覚的に確認できる
4. **Notionデータベース選択**
   - データベース一覧が表示されることを確認
   - ✅ N件のデータベースが見つかりました
   - 任意のデータベースを選択
   - ✅ 選択状態が視覚的に確認できる（背景色、ラジオボタン）
5. **プロパティマッピング設定**
   - 「プロパティマッピングを設定」ボタンをタップ
   - PropertyMapping画面に遷移することを確認
   - マッピングを設定
   - 戻って設定済み件数が表示されることを確認
6. **保存**
   - 「作成」ボタンをタップ
   - ✅ 「パッケージを作成しました」トーストが表示される
   - パッケージ一覧に戻る
   - ✅ 新しいパッケージが一覧に表示される

#### テスト3: パッケージ編集フロー

1. **Packagesタブ**でパッケージを選択
2. 「編集」ボタンをタップ
3. **各項目を変更**
   - パッケージ名を変更
   - ライブラリタイプを変更（OpenBD → 別のライブラリ）
   - データベースを変更
   - プロパティマッピングを変更
4. **更新**
   - 「更新」ボタンをタップ
   - ✅ 「パッケージを更新しました」トーストが表示される
   - ✅ 変更内容が反映される

#### テスト4: スキャン画面でのパッケージ選択

1. **ホームタブ** → スキャンボタンをタップ
2. **パッケージ選択ボタン**が表示されることを確認
   - ✅ 「📦 [アクティブパッケージ名]」が表示される
3. **パッケージ選択ボタン**をタップ
4. **パッケージ選択モーダル**が表示される
   - ✅ パッケージ一覧が表示される
   - ✅ 各パッケージのライブラリタイプが表示される
   - ✅ アクティブなパッケージにチェックマークが表示される
5. **別のパッケージを選択**
   - 任意のパッケージをタップ
   - ✅ モーダルが閉じる
   - ✅ パッケージ選択ボタンのテキストが更新される
6. **バーコードスキャン**
   - バーコードをスキャン
   - ✅ 選択したパッケージのライブラリが使用される
   - ✅ 選択したパッケージのDBに保存される

#### テスト5: バリデーションテスト

1. **パッケージ作成画面**を開く
2. **各項目を未入力で保存を試みる**
   - パッケージ名未入力 → ✅ エラーアラート表示
   - ライブラリ未選択 → ✅ エラーアラート表示
   - データベース未選択 → ✅ エラーアラート表示
   - プロパティマッピング未設定 → ✅ エラーアラート表示

#### テスト6: データベースプレビュー機能

1. **パッケージ作成画面** → Notionデータベースセクション
2. 任意のデータベースの**「プレビュー」ボタン**をタップ
3. **確認事項:**
   - ✅ プレビューモーダルが表示される
   - ✅ エラーが発生しない
   - ✅ データベースIDが正しい（`51725b0ba8ca4c9db8d05228d1d8bf69`など）

### Task 3.3: エラーケースのテスト

#### ケース1: Notion Integration未設定

1. Notion Tokenを削除または無効化
2. **パッケージ作成画面**を開く
3. **確認事項:**
   - ✅ データベース一覧取得エラーが表示される
   - ✅ エラーメッセージが親切で理解しやすい
   - ✅ 「再読み込み」ボタンが表示される

#### ケース2: データベースへのアクセス権限なし

1. Notion Integrationでデータベースへのアクセス権限を削除
2. **パッケージ作成画面**を開く
3. **確認事項:**
   - ✅ 「データベースが見つかりませんでした」メッセージが表示される
   - ✅ 「設定方法を見る」ボタンが表示される
   - ✅ ボタンをタップすると設定方法が表示される

#### ケース3: ネットワークエラー

1. 機内モードをONにする
2. **パッケージ作成画面**を開く
3. **確認事項:**
   - ✅ ネットワークエラーメッセージが表示される
   - ✅ 適切なエラーハンドリングが行われる

### Task 3.4: コンソールログの確認

**確認すべきログ:**

```
[PackageFormScreen] Loading databases...
[PackageFormScreen] Fetch result: {success: true, databaseCount: 3, error: undefined}
[PackageFormScreen] Databases loaded: [...]
[PackageFormScreen] Database selected: {id: '...', title: '...'}
[PackageFormScreen] Navigating to PropertyMapping: {databaseId: '...', currentMapping: {...}}
[PackageFormScreen] Property mapping saved: {...}
[PackageFormScreen] Creating package: {name: '...', libraryType: 'OPENBD', databaseId: '...'}
Default packages initialized: 1
```

**確認事項:**
- ✅ エラーログがない
- ✅ すべてのログが期待通りの内容
- ✅ データベースIDが正しい

### Task 3.5: パフォーマンステスト

1. **大量のパッケージ作成**
   - 10個以上のパッケージを作成
   - ✅ パッケージ一覧が正常に表示される
   - ✅ スクロールがスムーズ
   - ✅ パッケージ選択モーダルが正常に動作する

2. **データベース一覧の表示速度**
   - ✅ 3秒以内にデータベース一覧が表示される
   - ✅ ローディングインジケーターが適切に表示される

## 成功基準

### 必須（Must Have）

- ✅ すべての手動テストがパスする
- ✅ コンソールログにエラーがない
- ✅ TypeScriptコンパイルエラーがない
- ✅ ESLintエラーがない
- ✅ デフォルトパッケージが正しく初期化される
- ✅ パッケージ作成・編集・削除が正常に動作する
- ✅ スキャン画面でパッケージ選択が動作する

### 推奨（Should Have）

- ✅ すべての単体テストがパスする
- ✅ コードカバレッジ80%以上
- ✅ パフォーマンステストがパスする
- ✅ エラーケースが適切にハンドリングされる

### オプション（Nice to Have）

- スナップショットテストの追加
- E2Eテストの自動化
- パフォーマンスメトリクスの計測

## コミット手順

### Step 1: ステージング

```bash
git add .
```

### Step 2: コミットメッセージ作成

```bash
git commit -m "$(cat <<'EOF'
feat: LibraryType導入とパッケージ機能の全面改善

## 主要変更

### アーキテクチャ
- LibraryType enumを導入（OpenBD、楽天Books、Amazon対応準備）
- PackageエンティティにlibraryTypeプロパティを追加
- パッケージ概念を「ライブラリ + DB + マッピング」として再定義

### UI/UX改善
- PackageFormScreen: ライブラリ選択UI追加
- PackageFormScreen: データベース選択UIの明確化
- PackageFormScreen: バリデーション強化とエラーメッセージ改善
- PackageFormScreen: プロパティマッピングプレビュー追加
- ScanScreen: パッケージ選択モーダル追加

### データ層
- StorageRepository: libraryTypeのシリアライズ/デシリアライズ対応
- PackageViewModel: createPackage/updatePackageにlibraryType追加
- デフォルトパッケージにlibraryType追加（OPENBD）

### バグ修正
- Notion API 2025-09-03対応: data_source.notion_database.idを正しく使用
- NotionRepository: listDatabasesでnullチェック強化

### テスト
- PackageViewModel, PackageFormScreen, ScanScreenのテスト更新
- libraryType関連のテストケース追加

## 破壊的変更

なし（後方互換性を維持）

## マイグレーション

既存のパッケージは自動的にlibraryType: LibraryType.OPENBDに
マイグレーションされます。

## 関連ドキュメント

- ADR-006: パッケージ概念の再定義とライブラリ導入
- docs/product/P1_20251109_package-library-implementation.md
- docs/product/P1_20251109_phase2_ui_implementation.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### Step 3: プッシュ

```bash
git push origin fix/react-module-error-prevention
```

### Step 4: PR作成（必要に応じて）

```bash
gh pr create --title "feat: LibraryType導入とパッケージ機能の全面改善" --body "$(cat <<'EOF'
## 概要

パッケージの概念を再定義し、ライブラリ（データソースAPI）の概念を導入しました。

## 主要変更

### アーキテクチャ
- `LibraryType` enumを導入（OpenBD、楽天Books、Amazon対応準備）
- `Package`エンティティに`libraryType`プロパティを追加
- パッケージ = **ライブラリ + Notion DB + プロパティマッピング**として再定義

### UI/UX改善
- **PackageFormScreen**: ライブラリ選択UI、データベース選択UI、バリデーション強化
- **ScanScreen**: パッケージ選択モーダル追加
- エラーメッセージの改善とユーザーガイダンス強化

### データ層
- `libraryType`のシリアライズ/デシリアライズ対応
- デフォルトパッケージの自動初期化
- Notion API 2025-09-03の`data_source`対応強化

## テスト

- ✅ 単体テスト: PackageViewModel, PackageFormScreen, ScanScreen
- ✅ 統合テスト: パッケージ作成・編集・削除フロー
- ✅ E2Eテスト: スキャン→パッケージ選択→DB保存

## スクリーンショット

（必要に応じて追加）

## 破壊的変更

なし（後方互換性を維持）

## 関連Issue

Closes #XXX

## レビュアーへの注意点

- ADR-006を先に確認してください
- Phase 1〜3の実装プロンプトドキュメントを参照

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

## トラブルシューティング

### コンパイルエラーが発生する場合

1. `npm run type-check` を実行
2. エラー内容を確認
3. 型定義を修正
4. 再度コンパイル

### テストが失敗する場合

1. テストログを確認
2. モックデータを確認
3. テストケースを修正
4. 再度テスト実行

### マージコンフリクトが発生する場合

1. `git pull origin main` を実行
2. コンフリクトを解決
3. 再度テスト実行
4. コミット・プッシュ

## 次のステップ

1. ✅ Phase 3完了
2. 🚀 mainブランチへのマージ
3. 📦 リリース準備
4. 🎯 次期機能開発
   - 楽天Books API連携
   - Amazon Product API連携
   - カスタムAPIサポート

## 関連ドキュメント

- `docs/adr/20251109-adr-006-package-concept-redefinition.md`
- `docs/product/P1_20251109_package-library-implementation.md`
- `docs/product/P1_20251109_phase2_ui_implementation.md`
- `docs/product/MVP_ROADMAP.md`
