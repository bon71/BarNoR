# ADR-002: Clean Architectureの採用

**日付**: 2025-11-07

**ステータス**: 承認済み

---

## コンテキスト（Context）

### 背景

NotionBarcodeReaderは、バーコードスキャンからNotion APIへの登録まで複数の外部サービスと連携する React Nativeアプリケーションです。

プロジェクト初期段階で、以下の課題が想定されました：

- **外部APIの変更**: Notion API、OpenBD API、国立国会図書館APIなど複数の外部APIに依存
- **ビジネスロジックの複雑化**: パッケージ管理、エラーハンドリング、リトライロジックなど
- **テスタビリティ**: 外部依存を持つコードのテストが困難
- **将来の拡張性**: 新しいデータソース追加、新しいスキャンタイプ追加への対応
- **チーム開発**: レイヤーごとの責務が明確でないとコードベースが混乱

### 制約条件

- **React Native環境**: モバイルアプリケーションとしてのパフォーマンス要求
- **TypeScript**: 型安全性を維持したアーキテクチャ
- **単一リポジトリ**: モノリポではなく単一リポジトリでの管理
- **小規模チーム**: 少人数での開発・保守を前提

---

## 決定（Decision）

### 採用するアプローチ

**Clean Architecture（クリーンアーキテクチャ）**をプロジェクトの基本アーキテクチャパターンとして採用する。

### レイヤー構成

```
src/
├── domain/          # ドメイン層（ビジネスロジック）
│   ├── entities/    # エンティティ（ScannedItem, Package等）
│   ├── repositories/ # リポジトリインターフェース
│   └── usecases/    # ユースケース（ビジネスルール）
├── data/            # データ層（データアクセス）
│   ├── datasources/ # データソース（API, Storage）
│   └── repositories/ # リポジトリ実装
├── presentation/    # プレゼンテーション層（UI）
│   ├── screens/     # 画面コンポーネント
│   ├── components/  # 再利用可能コンポーネント
│   ├── viewmodels/  # ViewModel（UI ロジック）
│   ├── stores/      # Zustand ストア
│   └── navigation/  # ナビゲーション
└── infrastructure/  # インフラストラクチャ層（技術詳細）
    ├── camera/      # カメラ実装
    ├── network/     # HTTP クライアント
    └── storage/     # ストレージ実装
```

### 依存関係ルール

- **外側から内側への依存のみ許可**: `Presentation → Domain ← Data`
- **Domain層は完全に独立**: 外部ライブラリ・フレームワークに依存しない
- **Dependency Inversion**: インターフェースを通じた依存性注入

### 理由

1. **ビジネスロジックの保護**: Domain層が外部の変更から隔離される
2. **テスタビリティ**: インターフェースを通じたモック化が容易
3. **保守性**: レイヤーごとの責務が明確で変更箇所が特定しやすい
4. **拡張性**: 新しいデータソースやユースケースの追加が容易
5. **チーム開発**: レイヤーごとに並行開発可能

---

## 代替案（Alternatives）

### 代替案1: MVVMパターン

**概要**:
- Model-View-ViewModelパターン
- Reactコミュニティで広く採用

**利点**:
- シンプルで理解しやすい
- React/React Nativeと相性が良い
- 学習コストが低い

**欠点**:
- ビジネスロジックとデータアクセスの分離が曖昧
- 外部API変更時の影響範囲が大きい
- 大規模化時の保守性に課題

**不採用の理由**:
- 複数の外部API依存がある本プロジェクトでは、より明確な境界が必要
- 将来の拡張性（新しいスキャンタイプ、データソース追加）を考慮

### 代替案2: Feature-Sliced Design

**概要**:
- 機能ごとにコードを分割するアーキテクチャ
- 最近注目されているパターン

**利点**:
- 機能ごとの独立性が高い
- スケーラビリティに優れる
- モジュール化が進む

**欠点**:
- React Nativeでの事例が少ない
- チーム学習コストが高い
- 小〜中規模プロジェクトには過剰

**不採用の理由**:
- プロジェクト規模に対して過剰な複雑性
- TypeScriptでの型定義が複雑化

### 代替案3: フラットな構造

**概要**:
- レイヤー分けせずフラットなディレクトリ構造
- Create React Appのデフォルト構造

**利点**:
- 最もシンプル
- 学習コスト最小
- 初期開発が高速

**欠点**:
- スケールしない
- テストが困難
- ビジネスロジックとUIが混在

**不採用の理由**:
- 外部API依存が多く、テストが重要
- 将来的な機能拡張を見据えた設計が必要

---

## 影響（Consequences）

### ポジティブな影響

- **高いテストカバレッジ達成**: Domain層 90%以上、Data層 85%以上を達成
- **外部API変更への耐性**: データソース層のみの変更で対応可能
- **並行開発の容易性**: レイヤーごとに独立した開発が可能
- **型安全性の向上**: インターフェースを通じた明確な契約
- **ビジネスロジックの再利用**: 他プラットフォーム（Web版等）への展開が容易

### ネガティブな影響

- **初期学習コスト**: Clean Architectureの理解が必要
- **ボイラープレートの増加**: インターフェース定義、実装クラスの増加
- **初期開発速度の低下**: レイヤー間の調整作業が発生
- **ファイル数の増加**: 86ファイル（TypeScript）と多め

### トレードオフ

- **開発速度 vs 保守性**: 初期開発は遅いが、長期的な保守性は高い
- **シンプルさ vs 拡張性**: 構造は複雑だが、機能追加は容易
- **学習コスト vs チーム効率**: 初期学習は必要だが、ルールが明確で協業しやすい

### 影響を受けるコンポーネント/レイヤー

- **全レイヤー**: プロジェクト全体のディレクトリ構造
- **テスト戦略**: レイヤーごとの独立したテストが可能に
- **依存関係管理**: 循環依存の防止（madgeでチェック）
- **新規機能追加**: レイヤーごとの段階的実装が標準化

---

## 実装（Implementation）

### 実装の詳細

1. **Domain層の実装**:
   - エンティティ: `ScannedItem`, `Package` クラス
   - ユースケース: `FetchBookInfoUseCase`, `SaveToNotionUseCase` など
   - リポジトリインターフェース: `INotionRepository`, `IBookInfoRepository` など

2. **Data層の実装**:
   - データソース: `NotionAPI`, `OpenBDAPI`, `MMKVStorage`
   - リポジトリ実装: インターフェースの具象クラス

3. **Presentation層の実装**:
   - ViewModels: ストアとユースケースを橋渡し
   - Stores: Zustand による状態管理
   - Screens/Components: React Native コンポーネント

4. **Infrastructure層の実装**:
   - カメラ、ネットワーク、ストレージなどの技術詳細

### 実装の制約

- **循環依存の禁止**: madge ツールで CI/CD チェック
- **Domain層の外部依存禁止**: React Native ライブラリへの直接依存不可
- **インターフェース経由の依存**: 具象クラスへの直接依存を避ける
- **テストカバレッジ目標**: Domain 80%以上、Data 80%以上

### 検証方法

```bash
# 循環依存チェック
npx madge --circular src/

# Domain層の独立性チェック
npx madge --orphans src/domain/

# TypeScript型チェック
npx tsc --noEmit
```

---

## 関連情報（Related）

### 関連ADR

- ADR-001: React Moduleエラー防止策
- ADR-003: Zustand状態管理の採用（作成予定）
- ADR-004: MMKV永続化ストレージの採用（作成予定）

### 関連ドキュメント

- [アーキテクチャサマリー](../architecture-summary.md)
- [API仕様](../API.md)
- [Phase4最終レビューレポート](../phase4-final-review-report.md)

### 参考資料

- [Clean Architecture (Robert C. Martin)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [React Native + Clean Architecture 事例](https://proandroiddev.com/clean-architecture-in-react-native-a3c-d6c4)

---

## 備考（Notes）

### 成功の指標

- ✅ Domain層カバレッジ 90%以上達成（実績: 90.73%）
- ✅ Data層カバレッジ 85%以上達成（実績: 85.36%）
- ✅ 循環依存ゼロ（実績: 0件）
- ✅ TypeScriptエラーゼロ（実績: 0件）

### 今後の検討事項

- Presentation層のカバレッジ向上（現状19.85% → 目標60%）
- E2Eテストの追加（Detox/Playwright）
- Web版展開時のDomain層再利用性検証

---

**作成者**: Claude Code
**レビュー者**: bon71 (Project Owner)
**承認日**: 2024-10-25 (プロジェクト開始時)
