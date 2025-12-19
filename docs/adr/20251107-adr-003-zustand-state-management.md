# ADR-003: Zustand状態管理の採用

**日付**: 2025-11-07

**ステータス**: 承認済み

---

## コンテキスト（Context）

### 背景

React Nativeアプリケーションにおいて、グローバルな状態管理は重要な設計決定の一つです。
NotionBarcodeReaderでは以下の状態を管理する必要があります：

- **スキャン履歴**: バーコードスキャンの履歴データ
- **パッケージ設定**: アクティブなパッケージと全パッケージリスト
- **認証状態**: Notion API トークンの検証状態
- **テーマ設定**: ライト/ダークモードの切り替え
- **トースト通知**: 一時的なユーザーフィードバック

### 要件

- **型安全性**: TypeScript の恩恵を最大限に活用
- **React Hooks互換**: 関数コンポーネントとの統合
- **パフォーマンス**: 不必要な再レンダリングを避ける
- **開発者体験**: シンプルで直感的なAPI
- **バンドルサイズ**: 軽量なライブラリ
- **Clean Architecture互換**: ViewModelパターンとの統合

### 制約条件

- React Native 0.75+ 環境
- TypeScript 5.8+ での型安全性
- iOS/Androidクロスプラットフォーム対応
- 最小限の依存関係

---

## 決定（Decision）

### 採用するアプローチ

**Zustand v5.0.8** をグローバル状態管理ライブラリとして採用する。

### 実装パターン

```typescript
// Store定義例
import {create} from 'zustand';
import {ScannedHistory} from '@/domain/entities/ScannedHistory';

interface ScanState {
  scanHistory: ScannedHistory[];
  isLoading: boolean;
  error: string | null;
  addScanHistory: (item: ScannedHistory) => void;
  updateScanHistory: (id: string, updates: Partial<ScannedHistory>) => void;
  clearError: () => void;
}

export const useScanStore = create<ScanState>((set) => ({
  scanHistory: [],
  isLoading: false,
  error: null,
  addScanHistory: (item) => set((state) => ({
    scanHistory: [item, ...state.scanHistory],
  })),
  updateScanHistory: (id, updates) => set((state) => ({
    scanHistory: state.scanHistory.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    ),
  })),
  clearError: () => set({ error: null }),
}));
```

### 理由

1. **軽量**: わずか1.2kB（gzip圧縮後）でバンドルサイズへの影響が最小
2. **シンプルなAPI**: Redux のような複雑な設定不要
3. **TypeScript完全対応**: 型推論が優秀で型安全性が高い
4. **パフォーマンス**: セレクターベースの効率的な再レンダリング制御
5. **ミドルウェア不要**: 基本機能だけで十分な機能性
6. **ViewModelパターンとの相性**: getState() で外部から状態操作可能

---

## 代替案（Alternatives）

### 代替案1: Redux Toolkit

**概要**:
- Redux の公式推奨ツールキット
- React コミュニティで最も採用されている

**利点**:
- エコシステムが豊富（DevTools、ミドルウェア等）
- 大規模アプリケーションでの実績
- 公式ドキュメントが充実
- RTK Query による API 状態管理

**欠点**:
- バンドルサイズが大きい（~15kB gzipped）
- ボイラープレートが多い（slices、reducers、actions）
- 学習コストが高い
- シンプルな状態管理には過剰

**不採用の理由**:
- 本プロジェクトの規模（86ファイル）に対して過剰
- ViewModelパターンとの統合が複雑
- バンドルサイズの増加が懸念

### 代替案2: Jotai

**概要**:
- Atomic な状態管理
- Recoil に影響を受けたライブラリ

**利点**:
- 非常に軽量（~3kB）
- Bottom-up なアプローチ
- React Suspense 対応
- TypeScript対応

**欠点**:
- Atom の細かい定義が必要
- グローバルストアの概念が弱い
- エコシステムが小さい
- React Native での事例が少ない

**不採用の理由**:
- Clean Architecture の ViewModel パターンと相性が悪い
- グローバルストアが必要な本プロジェクトに不向き
- チーム学習コストが高い

### 代替案3: Context API + useReducer

**概要**:
- React 標準機能のみで実装
- 追加ライブラリ不要

**利点**:
- ゼロ依存
- React標準なので学習コスト低い
- バンドルサイズへの影響なし

**欠点**:
- パフォーマンス最適化が困難
- Provider地獄のリスク
- TypeScript型推論が弱い
- ボイラープレートが多い
- ViewModel からのアクセスが困難

**不採用の理由**:
- 不必要な再レンダリングが発生しやすい
- 複数のコンテキストを跨ぐ状態管理が煩雑
- ViewModelパターンとの統合が難しい

### 代替案4: MobX

**概要**:
- Observable ベースのリアクティブ状態管理
- 変更検知が自動的

**利点**:
- シンプルな API
- ボイラープレート最小
- パフォーマンスが良い
- TypeScript対応

**欠点**:
- デコレーターに依存（Babel設定が複雑）
- デバッグが困難
- ミューテーション前提（Immutableでない）
- React Nativeでの設定が煩雑

**不採用の理由**:
- Clean Architecture の Immutable原則と相性が悪い
- Babel デコレーター設定の複雑さ
- エコシステムの縮小傾向

---

## 影響（Consequences）

### ポジティブな影響

- **バンドルサイズ最小化**: わずか1.2kB の追加で全状態管理を実現
- **開発速度向上**: シンプルなAPIで状態管理コードを高速実装
- **型安全性**: TypeScript完全対応で型エラーゼロ達成に貢献
- **パフォーマンス**: セレクターによる最適化された再レンダリング
- **ViewModelパターン統合**: `getState()` で外部からの状態操作が容易

### ネガティブな影響

- **エコシステムの規模**: Redux と比較して小さい
- **DevToolsの機能**: Redux DevTools ほど高機能ではない
- **学習リソース**: Redux と比較して情報が少ない
- **チーム普及度**: Redux ほど一般的ではない

### トレードオフ

- **シンプルさ vs 機能性**: 高度な機能（Time Travel等）は犠牲にシンプルさを優先
- **バンドルサイズ vs エコシステム**: 軽量さを優先し、エコシステムの豊富さは犠牲
- **学習コスト vs 開発速度**: シンプルなAPIで学習コストを最小化、開発速度を最大化

### 影響を受けるコンポーネント/レイヤー

- **Presentation層**: 全Storeファイル（5ファイル）
- **ViewModels**: ストアとの統合（3ファイル）
- **Screens**: useStoreフックの使用（10ファイル）
- **Components**: 状態の参照（15ファイル）

---

## 実装（Implementation）

### 実装の詳細

#### ストア一覧

```typescript
// src/presentation/stores/
├── useScanStore.ts      # スキャン履歴管理
├── usePackageStore.ts   # パッケージ管理
├── useAuthStore.ts      # 認証状態管理
├── useThemeStore.ts     # テーマ設定管理
└── useToastStore.ts     # トースト通知管理
```

#### ViewModelとの統合

```typescript
// ViewModelからのストア操作
import {useScanStore} from '@/presentation/stores/useScanStore';

class ScanViewModel {
  async scanBarcode(barcode: string) {
    const scanStore = useScanStore.getState();
    scanStore.setLoading(true);
    // ... ビジネスロジック
    scanStore.addScanHistory(newItem);
    scanStore.setLoading(false);
  }
}
```

#### コンポーネントでの使用

```typescript
// セレクターによる最適化
const scanHistory = useScanStore((state) => state.scanHistory);
const addScanHistory = useScanStore((state) => state.addScanHistory);
```

### 実装の制約

- **Immutable更新**: set() 内で必ずイミュータブルな更新を行う
- **セレクター使用**: 不必要な再レンダリング防止のため、必要な状態のみ取得
- **型定義必須**: 全ストアでインターフェース定義を徹底
- **永続化は別レイヤー**: MMKV との連携は ViewModel 経由で行う

### パフォーマンス測定

```bash
# ストアのパフォーマンステスト
npm run test -- stores

# バンドルサイズ確認
npm run test:perf
```

**実績**:
- バンドルサイズ: 本番依存 12個（Zustand含む）
- 状態管理カバレッジ: 25.75%（要改善）
- ストア操作レスポンス: <1ms

---

## 関連情報（Related）

### 関連ADR

- ADR-002: Clean Architectureの採用
- ADR-004: MMKV永続化ストレージの採用（作成予定）

### 関連ドキュメント

- [アーキテクチャサマリー](../architecture-summary.md)
- [パフォーマンステストレポート](../testing/performance-report.md)

### 参考資料

- [Zustand 公式ドキュメント](https://github.com/pmndrs/zustand)
- [React Native + Zustand 事例](https://dev.to/react-native-zustand-examples)

---

## 備考（Notes）

### 成功の指標

- ✅ バンドルサイズ: 本番依存12個（目標: <15個）
- ✅ TypeScript型安全性: エラー0件
- ⚠️ ストアカバレッジ: 25.75%（目標: 70%）

### 今後の検討事項

- **ストアのテストカバレッジ向上**: 25.75% → 70%以上
- **パフォーマンス最適化**: セレクターの最適化
- **永続化ミドルウェア検討**: Zustand middleware の活用
- **DevTools統合**: React DevTools との連携強化

### 移行パス（将来）

Zustand から他のライブラリへの移行が必要になった場合：

1. ストアインターフェースを維持
2. 実装のみを段階的に置き換え
3. ViewModelレイヤーは影響を受けない設計

---

**作成者**: Claude Code
**レビュー者**: bon71 (Project Owner)
**承認日**: 2024-10-25 (プロジェクト開始時)
