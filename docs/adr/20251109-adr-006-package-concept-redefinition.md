# ADR-006: パッケージ概念の再定義とライブラリ導入

## Status

採用済み (2025-11-09)

## Context

### 背景

当初、パッケージは「Notionデータベースへの保存設定」として設計されていたが、実際のユースケースを考慮すると、以下の問題が明らかになった：

1. **ライブラリ（データ取得元API）の概念が不明確**
   - 現在は `PackageType.BOOK_INFO` という列挙型で表現されているが、これは本来「どのAPIからデータを取得するか」を表すべき
   - OpenBD API、楽天Books API、Amazon Product APIなど、複数のデータソースを扱う可能性がある

2. **パッケージの役割が曖昧**
   - パッケージがデータ取得とNotion保存の両方を担当しており、責務が混在
   - ユーザーが「どのAPIを使うか」と「どのNotion DBに保存するか」を別々に理解できない

3. **スキャン画面でパッケージを選択できない**
   - 現在はアクティブなパッケージのみが使用される
   - 状況に応じて異なるパッケージ（異なるライブラリ＋DB）を使い分けたい

### 要求される変更

1. パッケージの概念を明確化
2. ライブラリ（データソースAPI）の概念を導入
3. スキャン画面でパッケージを選択可能にする
4. Notion DB選択UIを改善

## Decision

### パッケージの新定義

**パッケージ = ライブラリ（データソースAPI） + Notionデータベース + プロパティマッピング**

- **ライブラリ**: データを取得するAPIの種類（OpenBD、楽天Books、Amazon、etc.）
- **Notionデータベース**: 保存先のNotion DB
- **プロパティマッピング**: スキャンアイテムのフィールドとNotionプロパティの対応関係

### アーキテクチャ変更

#### 1. ライブラリ（Library）エンティティの導入

```typescript
export enum LibraryType {
  OPENBD = 'OPENBD',           // OpenBD API（書籍）
  RAKUTEN_BOOKS = 'RAKUTEN_BOOKS', // 楽天Books API
  AMAZON = 'AMAZON',           // Amazon Product API
  CUSTOM = 'CUSTOM',           // カスタムAPI
}

export interface Library {
  type: LibraryType;
  name: string;
  description: string;
  apiEndpoint?: string;        // カスタムAPIの場合
  supportedItemTypes: ItemType[]; // サポートするアイテムタイプ
}
```

#### 2. Packageエンティティの拡張

```typescript
export interface Package {
  id: string;
  name: string;
  description?: string;

  // ライブラリ（データソース）
  libraryType: LibraryType;

  // Notion保存先
  databaseId: string;
  propertyMapping: Record<string, string>;

  // メタデータ
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 3. UI/UX の変更

##### パッケージ作成フロー
1. **ライブラリ選択** → どのAPIからデータを取得するか
2. **Notion DB選択** → どのDBに保存するか（一覧から選択）
3. **プロパティマッピング** → フィールド対応を設定

##### スキャン画面
- パッケージ選択ドロップダウン/モーダルを追加
- 選択されたパッケージのライブラリを使用してバーコードスキャン
- 選択されたパッケージのDBに保存

### データフロー

```
バーコードスキャン
  ↓
パッケージ選択（ユーザー操作）
  ↓
ライブラリ（API）からデータ取得
  ↓
プロパティマッピング適用
  ↓
Notion DBに保存
```

## Consequences

### 利点（Positive）

1. **責務の分離**
   - ライブラリ = データ取得
   - パッケージ = ライブラリ + DB + マッピング
   - 各概念が明確になり、理解しやすい

2. **拡張性の向上**
   - 新しいライブラリ（API）を簡単に追加可能
   - 同じライブラリを複数のDBに保存するパッケージを作成可能
   - ライブラリごとの設定を一元管理

3. **ユーザビリティの向上**
   - スキャン時にパッケージを選択できる
   - 状況に応じてライブラリとDBを切り替え可能
   - パッケージの概念が直感的

4. **将来の機能拡張**
   - プラグインシステムへの移行が容易
   - カスタムAPIライブラリのサポート
   - ライブラリごとのレート制限・キャッシュ管理

### 欠点（Negative）

1. **既存データの移行**
   - 既存のパッケージデータに `libraryType` を追加する必要がある
   - デフォルトパッケージの定義を更新

2. **実装コストの増加**
   - ライブラリ概念の導入により、コード変更箇所が増える
   - UIに新しい選択ステップを追加

3. **複雑性の若干の増加**
   - パッケージ作成フローが3ステップになる（従来は2ステップ）
   - ただし、各ステップは明確で理解しやすい

### 影響を受けるコンポーネント

#### エンティティ・ドメインレイヤー
- `Package.ts`: `libraryType` プロパティ追加
- `Library.ts`: 新規エンティティ作成（オプション）

#### UseCaseレイヤー
- `FetchBookInfoUseCase.ts`: ライブラリタイプに基づいてAPI選択
- 将来: `FetchProductInfoUseCase.ts` など

#### プレゼンテーションレイヤー
- `PackageFormScreen.tsx`: Notion DB一覧表示、ライブラリ選択UI追加
- `ScanScreen.tsx`: パッケージ選択UI追加
- `PackageViewModel.ts`: ライブラリ管理ロジック追加

#### データレイヤー
- `StorageRepository.ts`: パッケージデータのマイグレーション
- `defaultPackages.ts`: `libraryType` 追加

### マイグレーション戦略

1. **後方互換性の維持**
   - 既存のパッケージデータに `libraryType: LibraryType.OPENBD` をデフォルト設定
   - `PackageType` は当面残し、段階的に `LibraryType` へ移行

2. **段階的導入**
   - Phase 1: ライブラリ概念導入、デフォルトはOPENBD
   - Phase 2: UI改善（DB選択、パッケージ選択）
   - Phase 3: 複数ライブラリサポート（楽天、Amazon）

## Implementation

### 優先度: P1（高優先度）

### 実装順序

1. **ADR作成**（完了）
2. **LibraryType enum定義**
3. **Package エンティティ拡張**（`libraryType` 追加）
4. **PackageFormScreen改善**（Notion DB選択UI）
5. **ScanScreen改善**（パッケージ選択UI）
6. **デフォルトパッケージ更新**
7. **テスト・動作確認**
8. **コミット・プッシュ**

### 関連ドキュメント

- ADR-002: Clean Architecture採用
- ADR-005: Notion API 2025-09-03対応
- `docs/architecture-summary.md`: アーキテクチャ概要

## Notes

この変更により、アプリケーションの柔軟性と拡張性が大幅に向上する。特に、将来的にプラグインシステムを導入する際の基盤となる重要な設計決定である。
