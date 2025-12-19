# CI/CD Pipeline 設定ドキュメント

## 📋 概要

NotionBarcodeReaderプロジェクトのCI/CDパイプライン設定について説明します。

## 🏗️ 構成要素

### 1. GitHub Actions ワークフロー

#### 1.1 メインCIワークフロー (`.github/workflows/ci.yml`)

**トリガー:**
- `main`, `develop`, `fix/**`, `feature/**` ブランチへのpush
- `main`, `develop` ブランチへのPR

**ジョブ構成:**

##### Test and Lint
- Node.js 18.x と 20.x のマトリックスビルド
- TypeScript型チェック
- ESLint実行
- Jest テスト実行（カバレッジ付き）
- Codecovへのカバレッジアップロード
- カバレッジレポートのアーティファクト保存（30日間）

##### Build iOS
- macOS環境でのiOSビルド検証
- CocoaPods依存関係のキャッシュ
- Xcode ビルド（Dry Run）

##### Security
- npm audit実行
- TruffleHogによるシークレット検出

**主な特徴:**
- 依存関係のキャッシュによる高速化
- 複数Node.jsバージョンでのテスト
- セキュリティスキャンの自動化

#### 1.2 PR専用チェックワークフロー (`.github/workflows/pr-check.yml`)

**トリガー:**
- PRの `opened`, `synchronize`, `reopened` イベント

**機能:**
- コミットメッセージフォーマット検証
- TypeScript型チェック
- 変更ファイルのみのテスト実行（高速化）
- カバレッジ閾値チェック（50%以上）
- PRへのカバレッジレポートコメント自動投稿
- ファイル変更に基づく自動ラベリング

**主な特徴:**
- 変更差分のみをテストする効率的な設計
- リアルタイムフィードバックの提供
- PRへの自動コメント機能

### 2. Dependabot設定 (`.github/dependabot.yml`)

**自動更新対象:**

1. **npm依存関係**
   - 毎週月曜日 09:00 (JST)
   - 最大10個のPRを同時作成
   - コミットプレフィックス: `chore(deps)`

2. **GitHub Actions**
   - 毎週月曜日 09:00 (JST)
   - 最大5個のPRを同時作成
   - コミットプレフィックス: `chore(ci)`

3. **CocoaPods (iOS)**
   - 毎週月曜日 09:00 (JST)
   - 最大5個のPRを同時作成
   - コミットプレフィックス: `chore(deps-ios)`

**主な特徴:**
- 自動レビュアー割り当て
- 自動ラベル付与
- バージョニング戦略の統一

### 3. PRテンプレート (`.github/PULL_REQUEST_TEMPLATE.md`)

**セクション構成:**
- 📝 変更内容
- 🎯 変更の目的
- 📋 変更の種類
- 🧪 テスト
- 📊 カバレッジ
- 📸 スクリーンショット
- ✅ チェックリスト
- 📝 レビュー観点
- 🔗 関連情報
- 🤖 AI生成コードの明示

**主な特徴:**
- 日英バイリンガル対応
- 包括的なチェックリスト
- AI生成コードの明示フィールド

### 4. Issueテンプレート

#### 4.1 バグ報告 (`.github/ISSUE_TEMPLATE/bug_report.md`)

**必須情報:**
- 環境情報（OS、デバイス、バージョン）
- 再現手順
- 期待される動作 vs 実際の動作
- エラーログ
- 影響範囲の評価

#### 4.2 機能リクエスト (`.github/ISSUE_TEMPLATE/feature_request.md`)

**必須情報:**
- 機能の概要
- 解決したい課題
- 提案する解決策
- 期待される効果
- 実装の複雑度推定
- 優先度評価

#### 4.3 テンプレート設定 (`.github/ISSUE_TEMPLATE/config.yml`)

- ブランクIssueの有効化
- ドキュメント・ディスカッションへのリンク

### 5. 自動ラベリング設定 (`.github/labeler.yml`)

**ラベル分類:**
- `documentation`: ドキュメント変更
- `tests`: テスト関連
- `infrastructure`: インフラ・CI/CD
- `presentation`: プレゼンテーション層
- `domain`: ドメイン層
- `data`: データ層
- `config`: 設定ファイル
- `ios`: iOS関連
- `android`: Android関連
- `dependencies`: 依存関係

## 🔄 ワークフロー実行フロー

### 通常の開発フロー

```
1. ブランチ作成（feature/xxx または fix/xxx）
   ↓
2. コード変更・コミット
   ↓
3. Push時にメインCIワークフロー実行
   - TypeScript型チェック
   - ESLint
   - テスト実行
   - カバレッジ測定
   ↓
4. PR作成
   ↓
5. PR専用チェックワークフロー実行
   - 変更ファイルのみテスト
   - カバレッジ閾値チェック
   - PRへの自動コメント
   - 自動ラベリング
   ↓
6. レビュー・承認
   ↓
7. マージ
   ↓
8. mainブランチでフルCIワークフロー実行
```

### Dependabotフロー

```
毎週月曜日 09:00 (JST)
   ↓
1. 依存関係の更新チェック
   ↓
2. 更新が必要な依存関係ごとにPR自動作成
   ↓
3. CIワークフロー自動実行
   ↓
4. レビュー・承認（手動）
   ↓
5. マージ（手動または自動）
```

## 📊 カバレッジ管理

### カバレッジ目標

- **全体カバレッジ**: 50%以上（PR閾値）
- **新規コード**: 80%以上（推奨）

### カバレッジレポート

- **Codecov**: カバレッジの可視化・トレンド分析
- **Artifacts**: GitHub Actions上で30日間保存
- **PRコメント**: 自動的にカバレッジ情報を投稿

## 🔐 セキュリティ

### 自動セキュリティチェック

1. **npm audit**: 既知の脆弱性スキャン
2. **TruffleHog**: シークレット・認証情報の検出
3. **Dependabot**: セキュリティアップデートの自動PR

### セキュリティポリシー

- 中レベル以上の脆弱性を検出
- 検出時はワークフローを失敗させず、警告として通知
- Dependabotが自動的にセキュリティパッチPRを作成

## 🚀 最適化

### ビルド高速化

1. **依存関係キャッシュ**
   - npm: `package-lock.json`ベース
   - CocoaPods: `Podfile.lock`ベース

2. **並列実行**
   - マトリックスビルド（Node.js 18.x, 20.x）
   - 独立したジョブの並列実行

3. **変更差分テスト**
   - PRでは変更ファイルのみテスト
   - `--changedSince` オプションの活用

## 📝 コミットメッセージ規約

### フォーマット

```
<type>: <subject>

<body>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Type一覧

- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント
- `style`: コードスタイル
- `refactor`: リファクタリング
- `test`: テスト
- `chore`: その他
- `perf`: パフォーマンス改善

## 🔧 トラブルシューティング

### よくある問題

#### 1. CIワークフローが失敗する

**原因:**
- TypeScript型エラー
- ESLint警告・エラー
- テスト失敗
- カバレッジ閾値未達

**対処法:**
- ローカルで `npm run type-check` を実行
- `npm run lint` でESLintエラーを確認
- `npm test` でテストを実行
- `npm test -- --coverage` でカバレッジ確認

#### 2. iOSビルドが失敗する

**原因:**
- CocoaPods依存関係の問題
- Xcode設定の問題

**対処法:**
- `cd ios && bundle exec pod install` を実行
- Podfile.lockが最新か確認
- `ios/Pods` ディレクトリを削除して再インストール

#### 3. Dependabot PRが大量に作成される

**原因:**
- 長期間更新していない依存関係

**対処法:**
- `open-pull-requests-limit` を調整
- 優先度の高いPRから順にマージ
- 一時的にDependabotを無効化

## 📚 参考資料

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [Codecov Documentation](https://docs.codecov.com/)
- [React Native CI/CD Best Practices](https://reactnative.dev/docs/testing-overview)

## 🔄 今後の改善予定

- [ ] E2Eテストの追加（Detox or Playwright）
- [ ] パフォーマンステストの自動化
- [ ] デプロイワークフローの追加（TestFlight, Google Play）
- [ ] カスタムGitHub Action の作成
- [ ] コードカバレッジバッジの追加

---

**最終更新**: 2025-01-07
**作成者**: Claude Code
