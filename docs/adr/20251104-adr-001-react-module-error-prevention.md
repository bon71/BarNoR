# ADR-001: Reactモジュールロードエラーの再発防止策

## Status
採用済み (2025-11-04)

## Context

### 発生していた問題
React Nativeアプリで以下のエラーが繰り返し発生していた：

```
TypeError: Cannot read property 'S' of undefined
  at ReactNativeRenderer-dev.js:15169:57

TypeError: Cannot read property 'default' of undefined
  at RendererImplementation.js:49:45
```

### エラーの原因
1. **Metroバンドラーのキャッシュ問題**
   - node_modules/react配下のモジュールが正しくロードされない
   - キャッシュの不整合によりReactモジュールが`undefined`になる

2. **エラーハンドリングの不足**
   - モジュールロード失敗時の検証機構がない
   - エラー発生時のフォールバック処理がない
   - グローバルエラーハンドラーが未設定

3. **開発環境の状態管理**
   - watchman、Metro、iOS buildキャッシュの不整合
   - CocoaPodsの依存関係の問題

## Decision

以下の3層防御戦略を採用：

### 1. 予防層：キャッシュクリア自動化

**実装内容:**
- `scripts/kill-cache-deep.sh` による完全キャッシュクリア
- npm script `kill-cache-deep` でワンコマンド実行

**対象キャッシュ:**
- Metro bundlerプロセス
- watchmanキャッシュ
- Metro一時ファイル
- iOSビルドキャッシュ
- CocoaPods依存関係

**使用方法:**
```bash
npm run kill-cache-deep
```

### 2. 検出層：モジュール検証機構

**実装ファイル:**
- `src/utils/moduleValidation.ts`

**機能:**
- React モジュールの存在確認
- React Native モジュールの存在確認
- 重要APIの存在確認（createElement, Component, AppRegistry, View）
- 開発環境でのログ出力

**起動時検証:**
`index.js` でアプリ起動前にモジュール検証を実行

```javascript
if (__DEV__) {
  const { validateCriticalModules } = require('./src/utils/moduleValidation');
  validateCriticalModules();
}
```

### 3. 保護層：エラーバウンダリー

**実装ファイル:**
- `src/presentation/components/common/ErrorBoundary.tsx`
- `src/utils/errorHandler.ts`

**機能:**

1. **Reactエラーバウンダリー**
   - Reactコンポーネントツリー内のエラーをキャッチ
   - ユーザーフレンドリーなエラー画面表示
   - 開発環境でデバッグ情報表示
   - 再試行機能

2. **グローバルエラーハンドラー**
   - JavaScript実行時エラーのキャッチ
   - Unhandled Promise Rejectionのキャッチ
   - 詳細なエラーログ記録
   - エラートラッキングサービス連携（準備済み）

**適用範囲:**
```tsx
// App.tsx
<ErrorBoundary>
  <GestureHandlerRootView>
    <SafeAreaProvider>
      <RootNavigator />
    </SafeAreaProvider>
  </GestureHandlerRootView>
</ErrorBoundary>
```

## Consequences

### 良い影響

1. **エラーの早期検出**
   - モジュールロード問題を起動直後に検出
   - 開発環境で詳細なログが取得可能
   - 問題の切り分けが容易

2. **ユーザー体験の向上**
   - アプリのクラッシュを防止
   - エラー発生時も適切な画面表示
   - 再試行による自己復旧の可能性

3. **デバッグ効率の向上**
   - エラーログの標準化
   - スタックトレースの完全な記録
   - エラー発生時刻・状況の記録

4. **開発フローの改善**
   - ワンコマンドでの完全キャッシュクリア
   - 環境問題の迅速な解決
   - CI/CDパイプラインへの組み込み可能

### トレードオフ

1. **起動時間の微増**
   - 開発環境でのモジュール検証（1-2ms程度）
   - 本番環境では影響なし

2. **バンドルサイズの微増**
   - ErrorBoundary: 約3KB
   - エラーハンドラー: 約2KB
   - 合計約5KB（gzip後）

3. **メンテナンス対象の増加**
   - エラーハンドリングコードの維持
   - ドキュメントの更新

## Implementation

### 作成・修正ファイル

**新規作成:**
- `src/presentation/components/common/ErrorBoundary.tsx`
- `src/utils/moduleValidation.ts`
- `src/utils/errorHandler.ts`
- `docs/adr/20251104-adr-001-react-module-error-prevention.md`

**修正:**
- `App.tsx` - ErrorBoundaryの適用
- `index.js` - グローバルエラーハンドラー・モジュール検証の初期化

**既存（活用）:**
- `scripts/kill-cache-deep.sh` - 完全キャッシュクリア
- `package.json` - `kill-cache-deep` npm script

### エラー発生時の対応フロー

```
1. エラー発生
   ↓
2. グローバルエラーハンドラーがキャッチ
   ↓
3. エラーログを記録（タイムスタンプ、スタック、致命度）
   ↓
4. ErrorBoundaryがReactツリーのエラーをキャッチ
   ↓
5. ユーザーにエラー画面を表示
   ↓
6. 開発環境：デバッグ情報表示
   ↓
7. ユーザーが再試行可能
```

### 開発者向けガイド

**エラー発生時の対応:**
1. `npm run kill-cache-deep` を実行
2. `npm start -- --reset-cache` でMetro再起動
3. `npm run ios` でアプリ再ビルド

**エラーログの確認:**
- Metro bundlerコンソール
- Xcode Console（iOS）
- Chrome DevTools（デバッグ時）

**エラートラッキング連携（将来）:**
```typescript
// errorHandler.ts または ErrorBoundary.tsx
import * as Sentry from '@sentry/react-native';

Sentry.captureException(error, {
  extra: errorLog,
  tags: { module: 'react-module-load' }
});
```

## Related

- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [React Native Error Handling](https://reactnative.dev/docs/error-handling)
- [Metro Bundler Troubleshooting](https://metrobundler.dev/docs/troubleshooting/)

## Notes

- キャッシュクリアは開発中の問題解決に有効だが、根本的な環境問題がある場合は別途調査が必要
- 本番環境でエラートラッキングサービス（Sentry等）を導入することを推奨
- エラーログは個人情報を含まないように注意
