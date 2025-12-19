# Notion連携バーコードリーダーアプリ - AI開発指示書セット

## 📋 概要

このドキュメントセットは、Notion連携バーコードリーダーアプリを複数のAIツールを使って段階的に開発するための指示書です。

## 🎯 開発フロー

```
Lovable.dev → ClaudeCode → Cursor → ClaudeCode
(UIデザイン)  (メイン実装)  (補完)    (最終レビュー)
```

## 📁 ドキュメント構成

| ファイル名 | フェーズ | 対象ツール | 役割 |
|-----------|---------|-----------|------|
| `phase1-lovable-ui-design.md` | Phase 1 | Lovable.dev | UIプロトタイプ作成 |
| `phase2-claudecode-main-implementation.md` | Phase 2 | ClaudeCode | メイン実装（TDD + Clean Architecture） |
| `phase3-cursor-refactoring.md` | Phase 3 | Cursor | 補完実装とリファクタリング |
| `phase4-claudecode-final-review.md` | Phase 4 | ClaudeCode | 最終レビューと統合テスト |

## 🎨 Phase 1: Lovable.dev - UIデザイン

**目的**: モバイルUIのプロトタイプを作成し、デザインシステムを確立

**成果物**:
- 8画面のインタラクティブプロトタイプ
- 共通コンポーネントライブラリ
- デザインシステムドキュメント

**期間**: 1週間

[詳細はこちら](./phase1-lovable-ui-design.md)

---

## 💻 Phase 2: ClaudeCode - メイン実装

**目的**: React NativeでTDD + Clean Architectureに基づいた本格実装

**開発原則**:
- Test-Driven Development（Red-Green-Refactor）
- Clean Architecture（依存性の逆転）
- 変更容易性の確保

**成果物**:
- 完全に動作するReact Nativeアプリ
- ユニットテスト（カバレッジ80%以上）
- 統合テスト
- Clean Architectureドキュメント

**期間**: 8週間（Week 1-2: 基盤構築、Week 3-10: 各層実装）

[詳細はこちら](./phase2-claudecode-main-implementation.md)

---

## 🔧 Phase 3: Cursor - 補完実装

**目的**: コード品質向上とユーザー体験の最適化

**作業内容**:
- パフォーマンス最適化（useMemo、useCallback）
- エラーハンドリング強化
- アクセシビリティ改善
- ログとモニタリング
- UI/UXの微調整
- テストカバレッジ拡充
- ドキュメント整備

**成果物**:
- リファクタリング完了したコードベース
- テストカバレッジ85%以上
- アクセシビリティスコア100%
- 更新されたドキュメント

**期間**: 2週間

[詳細はこちら](./phase3-cursor-refactoring.md)

---

## ✅ Phase 4: ClaudeCode - 最終レビュー

**目的**: リリース前の最終品質チェックと統合テスト

**レビュー観点**:
1. アーキテクチャの整合性
2. テストカバレッジ
3. コード品質
4. パフォーマンス
5. セキュリティ
6. ドキュメント

**成果物**:
- 完全にテストされたアプリ
- TestFlightビルド
- 最終レビューレポート
- リリースノート

**期間**: 1週間

[詳細はこちら](./phase4-claudecode-final-review.md)

---

## 🏗️ プロジェクト全体像

### 技術スタック
- **フレームワーク**: React Native 0.72+
- **言語**: TypeScript 5.x（Strict Mode）
- **アーキテクチャ**: Clean Architecture + MVVM
- **テスト**: Jest、@testing-library/react-native
- **カメラ**: react-native-vision-camera
- **ストレージ**: react-native-mmkv（暗号化）
- **Notion SDK**: @notionhq/client
- **IAP**: react-native-purchases（RevenueCat）

### ディレクトリ構造
```
src/
├── domain/           # ビジネスロジック（エンティティ、ユースケース）
├── data/             # リポジトリ実装
├── infrastructure/   # 外部依存（カメラ、API、ストレージ）
└── presentation/     # UI（画面、コンポーネント、ViewModel）
```

### 主要機能（MVP）
1. バーコードスキャン（JAN/EAN/CODE系）
2. 書籍情報取得（openBD API）
3. 商品情報取得（楽天API）
4. Notion連携（認証、DB操作、ページ作成）
5. パッケージシステム（BookInfo、ProductInfo）
6. スキャン履歴管理（最大20件）
7. オフライン対応とバックグラウンド送信
8. In-App Purchase（無料2DB/有料10DB）

---

## 📅 開発スケジュール

| フェーズ | 期間 | 主要タスク |
|---------|------|-----------|
| Phase 1 | Week 1 | UIデザインプロトタイプ |
| Phase 2 | Week 2-3 | 基盤構築 + ドメイン層 |
| Phase 2 | Week 4-5 | データ層実装 |
| Phase 2 | Week 6-7 | インフラ層実装 |
| Phase 2 | Week 8-9 | プレゼンテーション層実装 |
| Phase 3 | Week 10-11 | リファクタリング + 最適化 |
| Phase 4 | Week 12 | 最終レビュー + TestFlight |

**合計**: 約3ヶ月（12週間）

---

## 🎯 成功基準

### MVP成功基準
- ✅ リリース完了（2025年1月中旬）
- ✅ 自己利用で週3回以上
- ✅ テスター10名での検証
- ✅ クラッシュ率 <1%
- ✅ スキャン成功率 >90%

### 定性的基準
- ✅ 自己効率向上を実感
- ✅ 使いやすさのポジティブフィードバック
- ✅ 重大バグなし

---

## 📖 使い方

### 各フェーズでの指示の出し方

#### 1. Lovable.devで作業する場合
```
phase1-lovable-ui-design.md の内容をコピーして、Lovable.devに貼り付け
```

#### 2. ClaudeCodeで作業する場合（Phase 2）
```bash
# ターミナルでClaudeCodeを起動
claude-code

# phase2-claudecode-main-implementation.md の内容を参照しながら指示
```

#### 3. Cursorで作業する場合
```
phase3-cursor-refactoring.md の内容をCursorのAIチャットに貼り付け
```

#### 4. ClaudeCodeで最終レビュー（Phase 4）
```bash
# phase4-claudecode-final-review.md の内容に従ってレビュー実施
```

---

## 🔑 重要な原則

### 1. TDD（Test-Driven Development）
```
Red → Green → Refactor
```
テストを先に書き、最小限の実装でパスさせ、その後リファクタリング

### 2. Clean Architecture
```
外側 → 内側への依存
presentation → domain → data → infrastructure
```
ビジネスロジック（domain）を中心に、外部依存を抽象化

### 3. 変更容易性
- 単一責任の原則
- 依存性の逆転
- インターフェースによる抽象化
- テスト可能な設計

---

## 📝 注意事項

### セキュリティ
- Integration Token、APIキーは必ず暗号化
- 全通信HTTPS
- 最小権限原則

### パフォーマンス
- スキャン→表示: 2秒以内
- API応答: openBD/楽天3秒以内、Notion5秒以内
- 起動: コールド3秒、ホット1秒

### 制約事項
- MVP: iOS/iPadOS 14+のみ
- Internal Integrationのみ（Public Integrationは6ヶ月後）
- 予算: Apple Developer年会費のみ（$99/年）

---

## 🚀 次のステップ

1. **Phase 1開始**: `phase1-lovable-ui-design.md` をLovable.devで実行
2. **定期レビュー**: 各フェーズ終了時に成果物を確認
3. **継続的改善**: ユーザーフィードバックを元に改善

---

## 📞 サポート

質問や問題が発生した場合:
1. 各フェーズの詳細ドキュメントを確認
2. 開発原則（TDD、Clean Architecture）に立ち返る
3. MVPスコープを再確認

---

**プロジェクト成功を祈ります！🎉**
