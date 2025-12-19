# テストカバレッジレポート

**作成日**: 2025-11-07
**プロジェクト**: NotionBarcodeReader
**テストフレームワーク**: Jest + React Native Testing Library + Detox

---

## 📊 全体カバレッジサマリー

| メトリクス | カバレッジ | 目標 | 状態 |
|-----------|-----------|------|------|
| **Statements** | 56.96% (830/1457) | 80% | ❌ -23.04% |
| **Branches** | 47.20% (414/877) | 80% | ❌ -32.80% |
| **Functions** | 56.47% (218/386) | 80% | ❌ -23.53% |
| **Lines** | 57.08% (798/1398) | 80% | ❌ -22.92% |

**総テスト数**: 462テスト（429パス、33失敗）
**テストスイート**: 33スイート（28パス、5失敗）

---

## 🎯 レイヤー別カバレッジ

### 1. Domain Layer（ドメイン層）

| ファイル | Statements | Branches | Functions | Lines | 状態 |
|---------|-----------|----------|-----------|-------|------|
| **domain/entities** | **96.66%** | **85.71%** | **89.47%** | **96.66%** | ✅ 優秀 |
| Package.ts | 96% | 100% | 90.9% | 96% | ✅ |
| ScannedItem.ts | 97.14% | 78.57% | 87.5% | 97.14% | ✅ |
| **domain/usecases** | **100%** | **100%** | **100%** | **100%** | ✅ 完璧 |
| FetchBookInfoUseCase.ts | 100% | 100% | 100% | 100% | ✅ |
| SaveToNotionUseCase.ts | 100% | 100% | 100% | 100% | ✅ |
| **domain/repositories** | **0%** | **0%** | **0%** | **0%** | ⚠️ インターフェース |

**評価**: ✅ **ドメイン層は非常に良好（96.66%）**
- エンティティとユースケースは十分にテストされている
- リポジトリインターフェースは0%だが、これは型定義のみなので問題なし

---

### 2. Data Layer（データ層）

| ファイル | Statements | Branches | Functions | Lines | 未カバー行 |
|---------|-----------|----------|-----------|-------|-----------|
| **data/datasources** | **80%** | **70.37%** | **77.77%** | **80%** | ✅ 良好 |
| NotionAPI.ts | 80% | 76.92% | 85.71% | 80% | 204-222 |
| OpenBDAPI.ts | 100% | 100% | 100% | 100% | - |
| MMKVStorage.ts | 73.07% | 37.5% | 72.22% | 73.07% | 23-45 |
| **data/repositories** | **79.64%** | **66.29%** | **90.9%** | **83.01%** | ✅ 良好 |
| NotionRepository.ts | 70.51% | 59.42% | 82.35% | 75% | 34,41,64-76,93,134,148,256-283 |
| BookInfoRepository.ts | 100% | 85.71% | 100% | 100% | 72-73 |
| StorageRepository.ts | 100% | 100% | 100% | 100% | - |

**評価**: ✅ **データ層は良好（79.64%）**

**未カバー領域**:
- NotionRepository.ts:
  - エラーハンドリング（L34, L41, L93, L134, L148）
  - データベース詳細取得（L64-76）
  - クエリ機能（L256-283）
- MMKVStorage.ts:
  - エラーケース処理（L23-45）

---

### 3. Presentation Layer（プレゼンテーション層）

#### 3.1 ViewModels

| ファイル | Statements | Branches | Functions | Lines | 状態 |
|---------|-----------|----------|-----------|-------|------|
| **presentation/viewmodels** | **81.49%** | **52.87%** | **85.36%** | **81.08%** | ✅ 良好 |
| ScanViewModel.ts | 98.48% | 73.07% | 100% | 98.46% | ✅ 優秀 |
| AuthViewModel.ts | 92.59% | 87.5% | 100% | 92.59% | ✅ 優秀 |
| PackageViewModel.ts | 70.89% | 37.73% | 76.92% | 70% | ⚠️ 要改善 |

**PackageViewModel の未カバー領域**:
- L179: エラーハンドリング
- L302-417: パッケージ管理機能（追加・編集・削除・インポート・エクスポート）

#### 3.2 Stores（状態管理）

| ファイル | Statements | Branches | Functions | Lines | 状態 |
|---------|-----------|----------|-----------|-------|------|
| **presentation/stores** | **83.33%** | **100%** | **78.26%** | **83.33%** | ✅ 良好 |
| useAuthStore.ts | 100% | 100% | 100% | 100% | ✅ |
| usePackageStore.ts | 100% | 100% | 100% | 100% | ✅ |
| useScanStore.ts | 100% | 100% | 100% | 100% | ✅ |
| useThemeStore.ts | 100% | 100% | 100% | 100% | ✅ |
| useToastStore.ts | 35.29% | 100% | 9.09% | 35.71% | ❌ 未テスト |

**useToastStore の未カバー領域**:
- L27-40: Toast表示関数
- L46, L54, L62, L70: 各種Toast種別

#### 3.3 Screens（画面コンポーネント）

| ファイル | Statements | Branches | Functions | Lines | 状態 |
|---------|-----------|----------|-----------|-------|------|
| **presentation/screens** | **43.79%** | **40.53%** | **40.36%** | **44.51%** | ❌ 低い |
| PackageManagementScreen.tsx | 100% | 92.85% | 100% | 100% | ✅ 完璧 |
| SettingsScreen.tsx | 86% | 72.22% | 100% | 89.58% | ✅ 良好 |
| ScanScreen.tsx | 85.71% | 75% | 50% | 92.3% | ⚠️ 一部失敗 |
| ScanResultScreen.tsx | 86.66% | 70.83% | 100% | 86.66% | ✅ 良好 |
| HistoryScreen.tsx | 72.91% | 83.33% | 90.9% | 72.91% | ⚠️ 良好 |
| HomeScreen.tsx | 58.82% | 0% | 25% | 64.28% | ❌ テスト失敗 |
| DatabaseSettingsScreen.tsx | 0% | 0% | 0% | 0% | ❌ 未テスト |
| PackageFormScreen.tsx | 0% | 0% | 0% | 0% | ❌ 未テスト |
| PackageListScreen.tsx | 0% | 0% | 0% | 0% | ❌ 未テスト |
| PropertyMappingScreen.tsx | 0% | 0% | 0% | 0% | ❌ 未テスト |

#### 3.4 Components（共通コンポーネント）

| ファイル | Statements | Branches | Functions | Lines | 状態 |
|---------|-----------|----------|-----------|-------|------|
| **presentation/components/common** | **26.62%** | **30.7%** | **18.42%** | **27.51%** | ❌ 低い |
| Card.tsx | 100% | 100% | 100% | 100% | ✅ 完璧 |
| ErrorMessage.tsx | 100% | 100% | 100% | 100% | ✅ 完璧 |
| Input.tsx | 100% | 100% | 100% | 100% | ✅ 完璧 |
| LoadingIndicator.tsx | 100% | 100% | 100% | 100% | ✅ 完璧 |
| Button.tsx | 89.47% | 80.76% | 100% | 89.47% | ✅ 良好 |
| BlurView.tsx | 40% | 0% | 0% | 40% | ❌ 低い |
| ToastContainer.tsx | 28.57% | 0% | 0% | 28.57% | ❌ 低い |
| Toast.tsx | 7.14% | 0% | 0% | 7.4% | ❌ ほぼ未テスト |
| DatabasePreviewModal.tsx | 4% | 0% | 0% | 4.34% | ❌ ほぼ未テスト |
| ErrorBoundary.tsx | 0% | 0% | 0% | 0% | ❌ 未テスト |
| Skeleton.tsx | 0% | 0% | 0% | 0% | ❌ 未テスト |

#### 3.5 Navigation

| ファイル | Statements | Branches | Functions | Lines | 状態 |
|---------|-----------|----------|-----------|-------|------|
| BottomTabNavigator.tsx | 0% | 100% | 0% | 0% | ❌ 未テスト |
| RootNavigator.tsx | 0% | 0% | 0% | 0% | ❌ 未テスト |
| BlurTabBar.tsx | 0% | 0% | 0% | 0% | ❌ 未テスト |

#### 3.6 Scanner

| ファイル | Statements | Branches | Functions | Lines | 状態 |
|---------|-----------|----------|-----------|-------|------|
| BarcodeScanner.tsx | 0% | 0% | 0% | 0% | ❌ 未テスト |

---

### 4. Infrastructure Layer（インフラ層）

| ファイル | Statements | Branches | Functions | Lines | 状態 |
|---------|-----------|----------|-----------|-------|------|
| **infrastructure/logging** | **0%** | **0%** | **0%** | **0%** | ❌ 未テスト |
| Logger.ts | 0% | 0% | 0% | 0% | ❌ |
| **infrastructure/security** | **100%** | **100%** | **100%** | **100%** | ✅ 完璧 |
| EncryptionKeyManager.ts | 100% | 100% | 100% | 100% | ✅ |

---

### 5. Utils（ユーティリティ）

| ファイル | Statements | Branches | Functions | Lines | 状態 |
|---------|-----------|----------|-----------|-------|------|
| **utils** | **51.23%** | **53.47%** | **62.96%** | **48.29%** | ❌ 低い |
| errorMessages.ts | 100% | 100% | 100% | 100% | ✅ |
| retry.ts | 92.5% | 82.75% | 100% | 96.66% | ✅ |
| apiClient.ts | 56% | 48% | 66.66% | 54.54% | ⚠️ |
| errorHandler.ts | 0% | 0% | 0% | 0% | ❌ 未テスト |
| moduleValidation.ts | 0% | 0% | 0% | 0% | ❌ 未テスト |

---

### 6. Config（設定）

| ファイル | Statements | Branches | Functions | Lines | 状態 |
|---------|-----------|----------|-----------|-------|------|
| **config** | **70%** | **50%** | **0%** | **77.77%** | ⚠️ |
| constants.ts | 100% | 100% | 100% | 100% | ✅ |
| theme.ts | 100% | 100% | 100% | 100% | ✅ |
| env.ts | 100% | 50% | 100% | 100% | ✅ |
| defaultPackages.ts | 0% | 100% | 0% | 0% | ❌ 未テスト |

---

## ❌ 失敗しているテスト（33件）

### 1. HomeScreen.test.tsx（複数失敗）
**エラー**: `TypeError: scanHistory.slice is not a function`
```typescript
// L65: scanHistory が配列でない
const recentHistory = useMemo(() => scanHistory.slice(0, 10), [scanHistory]);
```
**原因**: モックで scanHistory を配列として提供していない

### 2. SettingsScreen.test.tsx（複数失敗）
**エラー**: `Unable to find an element with text: Token: secret_test_token_12...`
**原因**: maskToken関数の実装変更により、表示テキストが変わった

### 3. ScanScreen.test.tsx（複数失敗）
**エラー**: `Unable to find an element with testID: scan-error-title`
**原因**: エラー状態の表示ロジックが変更されている

### 4. App.test.tsx（テストスイート失敗）
**エラー**: `Cannot find module '@react-navigation/stack'`
**原因**: 依存関係の不足

### 5. Detox E2E Tests（全て失敗）
**エラー**: `DetoxRuntimeError: Detox worker instance has not been installed`
**原因**: Detoxの初期化設定が不完全

---

## 🚨 完全に未テストの領域（0%カバレッジ）

### 高優先度（機能的に重要）

1. **BarcodeScanner.tsx** (0%)
   - カメラアクセス
   - バーコード認識
   - エラーハンドリング

2. **PackageFormScreen.tsx** (0%)
   - パッケージ作成フォーム
   - バリデーション
   - 保存処理

3. **PropertyMappingScreen.tsx** (0%)
   - プロパティマッピング設定
   - データベースフィールド選択

4. **DatabaseSettingsScreen.tsx** (0%)
   - データベースID設定
   - データベース選択UI

5. **PackageListScreen.tsx** (0%)
   - パッケージ一覧表示
   - パッケージ選択

### 中優先度（UI/UX関連）

6. **ErrorBoundary.tsx** (0%)
   - グローバルエラーハンドリング
   - エラー画面表示

7. **Toast.tsx** (7.14%)
   - トースト通知表示
   - アニメーション

8. **DatabasePreviewModal.tsx** (4%)
   - データベースプレビュー
   - モーダル表示

9. **Skeleton.tsx** (0%)
   - ローディングスケルトン
   - プレースホルダー表示

### 低優先度（ナビゲーション・インフラ）

10. **BottomTabNavigator.tsx** (0%)
11. **RootNavigator.tsx** (0%)
12. **BlurTabBar.tsx** (0%)
13. **Logger.ts** (0%)
14. **errorHandler.ts** (0%)
15. **moduleValidation.ts** (0%)
16. **defaultPackages.ts** (0%)

---

## 📈 カバレッジ向上の推奨アクション

### Phase 1: 失敗テストの修正（最優先）

**目標**: 全テストをパスさせる
**期間**: 1-2日

1. ✅ **HomeScreen テストの修正**
   - scanHistory モックを配列として提供
   - レンダリングテストの修正

2. ✅ **SettingsScreen テストの修正**
   - maskToken関数の変更に対応
   - 表示テキストのアサーションを更新

3. ✅ **ScanScreen テストの修正**
   - エラー状態の表示ロジック確認
   - testID の確認・修正

4. ✅ **App.test.tsx の修正**
   - 不要な依存関係の削除
   - またはテストの削除

5. ✅ **Detox E2E テストの設定**
   - Detox初期化の完了
   - または一時的に除外

### Phase 2: 高優先度スクリーンのテスト追加（60%→70%）

**目標**: カバレッジ60% → 70%
**期間**: 3-5日

1. **PackageFormScreen テスト追加**
   - フォーム入力テスト
   - バリデーションテスト
   - 保存処理テスト

2. **PropertyMappingScreen テスト追加**
   - マッピング設定テスト
   - データベースフィールド選択テスト

3. **DatabaseSettingsScreen テスト追加**
   - データベース選択テスト
   - ID設定テスト

### Phase 3: コンポーネントカバレッジ向上（70%→75%）

**目標**: カバレッジ70% → 75%
**期間**: 2-3日

1. **ErrorBoundary テスト追加**
   - エラーキャッチテスト
   - フォールバック表示テスト

2. **Toast関連テスト追加**
   - Toast.tsx テスト
   - ToastContainer.tsx テスト
   - useToastStore テスト

3. **DatabasePreviewModal テスト追加**
   - モーダル表示テスト
   - データプレビューテスト

### Phase 4: ViewModel完全カバー（75%→80%）

**目標**: カバレッジ75% → 80%
**期間**: 2-3日

1. **PackageViewModel 完全テスト**
   - パッケージCRUD操作
   - インポート・エクスポート
   - エラーハンドリング

2. **Navigation テスト追加**
   - BottomTabNavigator
   - RootNavigator
   - BlurTabBar

### Phase 5: インフラ・ユーティリティ（80%+）

**目標**: カバレッジ80%達成
**期間**: 1-2日

1. **errorHandler テスト追加**
2. **moduleValidation テスト追加**
3. **Logger テスト追加**

---

## 🎯 カバレッジ目標ロードマップ

| フェーズ | 目標カバレッジ | 期間 | 優先度 |
|---------|--------------|------|--------|
| Phase 0（現在） | 57.08% | - | - |
| Phase 1 | 60% | 1-2日 | 🔴 最高 |
| Phase 2 | 70% | 3-5日 | 🟠 高 |
| Phase 3 | 75% | 2-3日 | 🟡 中 |
| Phase 4 | 80% | 2-3日 | 🟢 中 |
| Phase 5 | 80%+ | 1-2日 | 🔵 低 |

**合計推定期間**: 9-15日

---

## 📊 カバレッジ品質評価

### ✅ 良好な領域（80%以上）

- **Domain Entities**: 96.66% - 優秀
- **Domain UseCases**: 100% - 完璧
- **Data Sources**: 80% - 良好
- **ViewModels**: 81.49% - 良好
- **Stores**: 83.33% - 良好（ToastStore除く）

### ⚠️ 改善が必要な領域（50-80%）

- **Data Repositories**: 79.64%
- **Screens**: 43.79%
- **Utils**: 51.23%

### ❌ 重点改善が必要な領域（50%未満）

- **Components**: 26.62%
- **Navigation**: 0%
- **Scanner**: 0%
- **Infrastructure Logging**: 0%

---

## 💡 推奨事項

### 即座に対応すべき項目

1. **失敗テストの全修正**（Phase 1）
   - 現在のテストスイートを安定させる
   - CI/CDパイプラインの信頼性向上

2. **重要スクリーンのテスト追加**（Phase 2）
   - PackageFormScreen
   - PropertyMappingScreen
   - DatabaseSettingsScreen

### 中期的に対応すべき項目

3. **コンポーネントテスト拡充**（Phase 3）
   - ErrorBoundary
   - Toast関連
   - Modal系コンポーネント

4. **ViewModel完全カバー**（Phase 4）
   - PackageViewModel の未テスト部分

### 長期的に対応すべき項目

5. **インフラ・ユーティリティテスト**（Phase 5）
   - Logger
   - errorHandler
   - moduleValidation

6. **E2Eテストの充実**
   - Detoxセットアップ完了
   - 主要ユーザーフロー のE2Eテスト

---

## 📝 まとめ

**現状評価**: ⚠️ **改善が必要**

- **強み**: ドメイン層・データ層・ViewModel層は良好
- **弱み**: プレゼンテーション層（特にScreen・Component）のカバレッジが低い
- **リスク**: 33件のテスト失敗により、現在のカバレッジ数値の信頼性が低い

**次のアクション**:
1. 失敗テスト33件の修正（最優先）
2. 重要スクリーンのテスト追加
3. 段階的なカバレッジ向上（60% → 70% → 80%）

**推定工数**: 9-15日で80%カバレッジ達成可能

---

**作成者**: Claude Code
**最終更新**: 2025-11-07
