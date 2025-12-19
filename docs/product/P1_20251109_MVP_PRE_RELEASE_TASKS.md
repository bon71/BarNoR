# MVP リリース前タスク一覧（実機テスト除く）

**作成日**: 2025-11-09
**優先度**: P1（最高優先度）
**目標**: 実機テストを除く、MVPリリースに必要なすべてのタスクを完了させる

---

## 📊 現在の状況

### ✅ 完了済み（約75%）

- バーコードスキャン機能（Vision Camera + Code Scanner）
- 書籍情報取得（OpenBD API）
- Notion API連携（認証・DB操作・ページ作成）
- パッケージ管理UI（一覧・作成・削除）
- LibraryType概念導入（OPENBD, RAKUTEN_BOOKS, AMAZON, CUSTOM）
- パッケージ選択機能（スキャン画面）
- デフォルト書籍登録パッケージ
- スキャン履歴管理・表示
- エラーハンドリング（3層防御戦略）
- 4タブナビゲーション（ホーム/履歴/パッケージ/設定）
- 595件のテスト成功

### ⚠️ 未完了・要修正（約25%）

#### コード品質問題
- **TypeScriptエラー**: 13件のコンパイルエラー
- **テスト失敗**: 36件のテスト失敗（6 test suites failed）
- **未使用import**: 複数ファイルに存在
- **型定義不足**: テストファイルでの型不一致

#### 機能実装不足
- **パッケージ編集機能**: UI存在、更新処理未実装
- **NotionRepository修正**: data_source.notion_database.id 対応が不完全
- **Phase 1-3実装**: Cursorで実装予定のPRPが未実行

#### ドキュメント不足
- README.md が古い
- CHANGELOG.md 未作成
- ユーザー向け使い方ドキュメント未作成

---

## 🎯 MVP定義（再確認）

### MVP成功基準

1. ✅ バーコードスキャン → 書籍情報取得 → Notion保存の基本フローが動作
2. ✅ デフォルト書籍登録パッケージで本が登録できる
3. ⚠️ クラッシュなく起動・操作できる（テスト失敗あり）
4. ✅ Notion認証・トークン保存が機能する
5. ✅ スキャン履歴が正しく表示される
6. ⚠️ パッケージ編集機能（MVP必須か要検討）

### MVP除外機能（Post-MVP）

- 商品情報取得（楽天API）
- In-App Purchase（サブスクリプション）
- オフライン対応とバックグラウンド送信
- 高度なエラーリカバリー

---

## 📋 実機テスト以外の残りタスク

### 🔴 Phase 1: Critical（必須 - 1日）

#### 1.1 TypeScriptエラー修正（13件）

**優先度**: 🔴 最優先（ビルドブロッカー）

##### エラー詳細

1. **ErrorBoundary.test.tsx**
   - `error` 変数未使用（line 196）
   - `never` 型の呼び出しエラー（line 214）

2. **ToastContainer.test.tsx**
   - 型変換エラー 6件（lines 32, 43, 62, 91, 112, 142）
   - `UseBoundStore` から `Mock` への変換失敗

3. **PackageFormScreen.test.tsx**
   - `getByText` 未使用（line 465）

4. **PackageViewModel.test.ts**
   - `NotionPage` 型不一致 2件（lines 1000, 1028）
   - `createdTime`, `lastEditedTime` プロパティ不足

5. **EmptyState.tsx**
   - `TouchableOpacity` 未使用（line 7）

6. **PackageFormScreen.tsx**
   - `Package` 未使用（line 26）

7. **networkStatus.ts**
   - `response` 未使用（line 20）

**実装プロンプト作成**: ✅ 不要（軽微な修正のため直接修正）

**作業内容**:
- 未使用変数の削除
- テストモックの型定義修正
- NotionPage型定義の追加プロパティ対応

**完了条件**: `npx tsc --noEmit` でエラー0件

---

#### 1.2 テスト失敗修正（36件）

**優先度**: 🔴 最優先

##### 失敗テスト分類

1. **PackageFormScreen.test.tsx**（多数）
   - データベース未取得時のエラー表示テスト失敗
   - Alert.alert の呼び出し回数・引数不一致

2. **OpenBDAPI.test.ts**
   - ネットワークエラーテストのタイムアウト（5秒超過）

3. **その他コンポーネントテスト**
   - ToastContainer関連
   - ErrorBoundary関連

**実装プロンプト作成**: ✅ 不要（テスト修正のため直接対応）

**作業内容**:
- Alert.alert のモック検証ロジック修正
- テストタイムアウト設定追加
- 期待値と実際の表示メッセージの整合性確認

**完了条件**: `npm test` で全テスト成功（631 tests passed）

---

#### 1.3 Phase 1-3実装プロンプトの実行（Cursor）

**優先度**: 🟡 高（機能完成のため必須）

**対象ファイル**:
- `docs/product/P1_20251109_package-library-implementation.md` (Phase 1)
- `docs/product/P1_20251109_phase2_ui_implementation.md` (Phase 2)
- `docs/product/P1_20251109_phase3_final_integration.md` (Phase 3)

**実装内容**:
- Phase 1: LibraryType型エラー修正、ストレージ対応、シリアライゼーション
- Phase 2: PackageFormScreen UI改善、ライブラリ選択、DB選択UI
- Phase 3: テスト更新、手動テスト手順、最終統合

**実装方法**:
1. 各PRPファイルをCursorで開く
2. プロンプト内容をCursorに渡して実装
3. 実装完了後、ClaudeCodeでコードレビュー

**完了条件**: 3つのPhaseすべての実装完了、テスト成功

---

#### 1.4 Git コミット整理

**優先度**: 🟡 高

**現状**: 28ファイル修正、9ファイル新規作成（uncommitted）

**作業内容**:
1. LibraryType導入関連の変更をコミット
   - Package.ts, defaultPackages.ts, StorageRepository.ts など
   - ADR-006作成
   - コミットメッセージ: `feat: LibraryType導入とパッケージ概念再定義（ADR-006）`

2. NotionRepository修正をコミット
   - data_source.notion_database.id 対応
   - コミットメッセージ: `fix: Notion API 2025-09-03 data_source対応でDB ID取得修正`

3. UI改善をコミット
   - PackageFormScreen, ScanScreen修正
   - コミットメッセージ: `feat: パッケージ選択UIとライブラリ選択機能追加`

4. テスト追加をコミット
   - 新規テストファイル
   - コミットメッセージ: `test: EmptyState, ToastStore, errorHandler等のテスト追加`

5. PRPドキュメント追加をコミット
   - Phase 1-3プロンプトファイル
   - コミットメッセージ: `docs: LibraryType実装プロンプト（Phase 1-3）作成`

**完了条件**: すべての変更がコミット済み、git status clean

---

### 🟡 Phase 2: Important（重要 - 1-2日）

#### 2.1 パッケージ編集機能の実装判断

**優先度**: 🟡 高（MVP必須か要検討）

**現状**:
- PackageFormScreenに編集モードUIは存在
- `PackageViewModel.updatePackage()` メソッドは存在するが実装不完全
- 編集画面からの保存処理未実装

**判断基準**:
- **MVP必須**: ユーザーがパッケージ設定を修正できることが重要
- **Post-MVP**: パッケージ削除→再作成で代替可能

**実装する場合の作業内容**:
1. PackageViewModel.updatePackage() の完全実装
2. PackageFormScreen の編集保存処理実装
3. テスト追加
4. 実装プロンプト作成（Cursor向け）

**スキップする場合**:
- 編集ボタンを削除または無効化
- ドキュメントに「編集機能はv1.1で実装予定」と記載

**完了条件**: 実装完了 or スキップ決定＋UI調整

---

#### 2.2 エラーハンドリング強化

**優先度**: 🟢 中（UX改善）

**作業内容**:
- Notion API エラー時のメッセージ改善（既存実装の確認）
- OpenBD API タイムアウト時の再試行（既存実装の確認）
- ネットワークエラー時のフォールバック確認
- スキャン失敗時のフィードバック確認

**完了条件**: エラーハンドリングの動作確認完了

---

#### 2.3 UI/UX改善

**優先度**: 🟢 中

**作業内容**:
- ローディング状態の視覚的フィードバック確認（Skeleton実装済み）
- スキャン成功時のフィードバック確認（バイブレーション実装済み）
- エラー表示の確認（Toast実装済み）
- 空状態デザイン確認（EmptyState実装済み）
- アクティブパッケージの強調表示確認

**完了条件**: UI/UX実装の動作確認完了

---

### 🔵 Phase 3: Polish（仕上げ - 1日）

#### 3.1 コード品質最終チェック

**優先度**: 🟡 高

**作業内容**:
- [x] TypeScript型チェック（Phase 1.1で実施）
- [x] テスト全件成功（Phase 1.2で実施）
- [ ] ESLintエラー0件確認
- [ ] 未使用importの削除（tsc --noEmitで検出済み）
- [ ] console.logの削除確認（本番環境）
- [ ] .eslintrc.js 修正のレビュー

**コマンド**:
```bash
npx tsc --noEmit
npm test
npx eslint src/ --max-warnings 0
```

**完了条件**: すべてのチェックでエラー・警告0件

---

#### 3.2 ドキュメント整備

**優先度**: 🟡 高

##### 3.2.1 README.md 更新

**作業内容**:
- プロジェクト概要
- 主要機能リスト
- セットアップ手順（開発者向け）
- 使い方（ユーザー向け基本操作）
- Notion Integration設定方法
- ライセンス情報

**完了条件**: README.md が最新状態

---

##### 3.2.2 CHANGELOG.md 作成

**作業内容**:
- MVP v1.0.0 のリリースノート作成
- 主要機能リスト
- 既知の問題・制限事項
- Post-MVP予定機能

**完了条件**: CHANGELOG.md 作成完了

---

##### 3.2.3 ユーザー向けドキュメント

**ファイル**: `docs/USER_GUIDE.md`

**作業内容**:
- Notion Integration作成手順（スクリーンショット付き）
- データベース作成手順
- アプリ初期設定手順
- バーコードスキャン手順
- パッケージ管理手順
- トラブルシューティング

**完了条件**: USER_GUIDE.md 作成完了

---

##### 3.2.4 既知の問題ドキュメント

**ファイル**: `docs/KNOWN_ISSUES.md`

**作業内容**:
- MVP時点の制限事項リスト
- オフライン非対応
- パッケージ編集機能の状況
- サポート対象デバイス（iOS 13.4+）
- 楽天API未実装

**完了条件**: KNOWN_ISSUES.md 作成完了

---

#### 3.3 最終コミット・プッシュ

**優先度**: 🟡 高

**作業内容**:
1. すべての変更をコミット
2. ブランチ名確認: `fix/react-module-error-prevention`
3. main ブランチへのマージ前確認
4. プッシュ実行

**完了条件**: すべての変更がリモートにプッシュ済み

---

### 🟢 Phase 4: Pre-Release Preparation（リリース準備 - 半日）

#### 4.1 TestFlight準備（実機テスト後）

**優先度**: 🟢 中（実機テスト成功後）

**作業内容**:
- App Store Connect設定確認
- Bundle ID確認: `com.yourcompany.NotionBarcodeReader`
- Team設定確認
- Signing & Capabilities確認
- Archive作成準備（Xcode）

**完了条件**: TestFlightアップロード準備完了

---

#### 4.2 .gitignore 最終確認

**優先度**: 🟢 中

**確認項目**:
- [ ] .env ファイルが除外されているか
- [ ] Notion Integration Token が含まれていないか
- [ ] ビルド成果物が除外されているか（ios/build, android/build）
- [ ] 機密情報が含まれていないか

**完了条件**: .gitignore 確認完了

---

## 📅 推奨実行順序

### Day 1: コード品質修正（6-8時間）

1. ✅ **TypeScriptエラー修正**（1-2時間）
   - 未使用変数削除
   - 型定義修正
   - `npx tsc --noEmit` でエラー0件確認

2. ✅ **テスト失敗修正**（2-3時間）
   - PackageFormScreen.test.tsx 修正
   - OpenBDAPI.test.ts タイムアウト修正
   - `npm test` で全テスト成功確認

3. ✅ **Phase 1-3実装（Cursor）**（2-3時間）
   - Phase 1プロンプト実行
   - Phase 2プロンプト実行
   - Phase 3プロンプト実行
   - ClaudeCodeでコードレビュー

4. ✅ **Gitコミット整理**（30分）
   - 機能ごとにコミット分割
   - コミットメッセージ整形

---

### Day 2: 機能判断・ドキュメント整備（6-8時間）

5. ✅ **パッケージ編集機能の判断**（30分）
   - MVP必須か検討
   - 実装 or スキップ決定

6. ✅ **エラーハンドリング確認**（1時間）
   - 既存実装の動作確認
   - 必要に応じて改善

7. ✅ **UI/UX確認**（1時間）
   - 既存実装の動作確認

8. ✅ **ドキュメント整備**（3-4時間）
   - README.md 更新
   - CHANGELOG.md 作成
   - USER_GUIDE.md 作成
   - KNOWN_ISSUES.md 作成

9. ✅ **最終コード品質チェック**（1時間）
   - ESLint実行
   - 未使用import削除
   - console.log削除

10. ✅ **最終コミット・プッシュ**（30分）

---

### Day 3: 実機テスト準備（2-3時間）

11. ✅ **.gitignore 確認**（15分）
12. ✅ **TestFlight準備**（1-2時間）
13. ✅ **実機テスト環境セットアップ開始**

---

## ✅ Definition of Done（実機テスト前）

以下をすべて満たしたら「実機テスト準備完了」：

- [ ] TypeScriptエラー 0件
- [ ] テスト失敗 0件（631 tests passed）
- [ ] ESLintエラー・警告 0件
- [ ] Phase 1-3実装完了（Cursor）
- [ ] Gitコミット整理完了
- [ ] パッケージ編集機能の判断完了
- [ ] エラーハンドリング確認完了
- [ ] UI/UX確認完了
- [ ] README.md 更新完了
- [ ] CHANGELOG.md 作成完了
- [ ] USER_GUIDE.md 作成完了
- [ ] KNOWN_ISSUES.md 作成完了
- [ ] .gitignore 確認完了
- [ ] すべての変更がプッシュ済み

---

## 🚨 注意事項

### 実装順序の厳守

1. **TypeScriptエラー修正が最優先**
   - ビルドが通らないとテストも実行できない
   - 他の作業をブロックする

2. **テスト修正が2番目**
   - CI/CDでテストが通らないとマージできない
   - コード品質の基準

3. **Phase 1-3実装が3番目**
   - 機能完成のために必須
   - テストが通った状態で実装する

### Cursor実装時の注意

- PRPファイルの指示を一字一句変更せずに実行
- 実装後、必ずClaudeCodeでコードレビュー
- テストを実行して品質確認

### コミット時の注意

- こまめにコミット（機能単位）
- コミットメッセージは明確に
- テストが通った状態でコミット

---

## 📞 次のアクション

**最優先タスク（今すぐ開始）:**

1. **TypeScriptエラー修正** → 13件すべて修正
2. **テスト失敗修正** → 36件すべて修正
3. **Phase 1-3実装（Cursor）** → 3つのPRPファイル実行

**このPRPを完了したら `docs/product/done/` に移動してください。**
