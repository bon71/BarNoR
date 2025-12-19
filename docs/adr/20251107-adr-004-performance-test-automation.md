# ADR-004: パフォーマンステスト自動化の導入

**日付**: 2025-11-07

**ステータス**: 承認済み

---

## コンテキスト（Context）

### 背景

Phase4最終レビューにおいて、以下のパフォーマンス関連課題が確認されました：

- **測定データの不足**: ビルド時間、テスト実行時間などのメトリクスが未記録
- **パフォーマンス劣化の検知困難**: 変更による影響が可視化されていない
- **CI/CD統合の欠如**: 自動化されたパフォーマンス監視が未実装
- **ベンチマークの不在**: 目標値との比較ができない
- **継続的改善の困難**: データベースがないため改善の効果測定が不可能

### 要件

- **自動測定**: 手動実行ではなく自動化されたメトリクス収集
- **包括的メトリクス**: ビルド、テスト、コード品質の総合測定
- **レポート生成**: 人間が読みやすいドキュメント形式での出力
- **CI/CD統合可能**: GitHub Actions等での実行を想定
- **低オーバーヘッド**: 測定自体が開発を遅らせない
- **トレンド分析**: 時系列での変化を追跡可能

### 制約条件

- React Native環境での実行
- Node.js 20+ 環境
- 既存のテストインフラ（Jest）の活用
- 追加の重い依存関係を避ける

---

## 決定（Decision）

### 採用するアプローチ

**カスタム Node.js スクリプト（performance-test.mjs）**によるパフォーマンステスト自動化を実装する。

### 測定対象メトリクス

1. **ビルドパフォーマンス**:
   - TypeScriptビルド時間（`tsc --noEmit`）
   - テスト実行時間（`jest --coverage`）

2. **コードメトリクス**:
   - ソースコードサイズ
   - TypeScriptファイル数
   - テストファイル数

3. **依存関係**:
   - 本番依存関係数
   - 開発依存関係数

4. **テストカバレッジ**:
   - ステートメント・ブランチ・関数・行のカバレッジ

### 実装内容

```javascript
// scripts/performance-test.mjs
- TypeScriptビルド時間測定
- テスト実行時間測定
- バンドルサイズ推定
- 依存関係数カウント
- ファイル数カウント
- カバレッジ統計読み込み
```

### 実行方法

```bash
# パッケージスクリプトとして登録
npm run test:perf

# CI/CDでの実行
node scripts/performance-test.mjs
```

### 理由

1. **ゼロ追加依存**: 既存のNode.js APIのみで実装可能
2. **軽量**: 実行時間4秒程度で完了
3. **カスタマイズ性**: プロジェクト固有のメトリクスを柔軟に追加
4. **CI/CD統合容易**: シンプルなNode.jsスクリプトで統合が簡単
5. **保守性**: TypeScriptプロジェクトの標準的な測定方法

---

## 代替案（Alternatives）

### 代替案1: Lighthouse CI

**概要**:
- Google製のパフォーマンス測定ツール
- Web アプリケーション向け

**利点**:
- 包括的なパフォーマンス測定
- 標準化された指標
- CI/CD統合機能

**欠点**:
- React Native非対応（Web専用）
- 重い依存関係
- モバイルアプリには不向き

**不採用の理由**:
- React Nativeアプリに適用できない
- Web向けの指標が不要

### 代替案2: Perfume.js

**概要**:
- ランタイムパフォーマンス測定ライブラリ
- リアルユーザーメトリクス収集

**利点**:
- リアルタイムパフォーマンス測定
- ユーザー体験の可視化
- 詳細な指標

**欠点**:
- React Native対応が限定的
- ランタイム測定が主（ビルド時ではない）
- プロダクション環境が必要

**不採用の理由**:
- ビルド時のメトリクスが主目的
- React Native環境での動作が不確実

### 代替案3: Jest Performance Plugin

**概要**:
- Jest テスト実行時のパフォーマンス測定
- プラグインベース

**利点**:
- Jest統合
- テスト実行時間の詳細分析
- セットアップが簡単

**欠点**:
- テストパフォーマンスのみ（ビルド時間等は測定不可）
- カスタムメトリクスの追加が困難
- レポート機能が弱い

**不採用の理由**:
- テスト以外のメトリクス（ビルド時間、コードサイズ）も測定したい
- カスタマイズ性が低い

### 代替案4: 手動測定

**概要**:
- 都度手動でメトリクスを測定・記録

**利点**:
- 追加ツール不要
- 柔軟性が高い

**欠点**:
- 人的エラーが発生しやすい
- 継続性が保証されない
- 時間がかかる
- トレンド分析が困難

**不採用の理由**:
- 自動化が必須要件
- 継続的測定が不可能

---

## 影響（Consequences）

### ポジティブな影響

- **パフォーマンス可視化**: ビルド時間1.8秒、テスト時間4.0秒を定量測定
- **劣化の早期発見**: 変更によるパフォーマンス影響を即座に検知
- **データドリブンな改善**: 測定データに基づく最適化が可能
- **CI/CD統合準備**: 自動化基盤が整った
- **ドキュメント化**: performance-report.mdで結果を記録

### ネガティブな影響

- **メンテナンスコスト**: スクリプトの保守が必要
- **測定時間**: 約5秒の追加時間（TypeScript + テスト実行）
- **カバレッジ依存**: jestが生成するcoverage-summary.jsonに依存

### トレードオフ

- **専用ツール vs カスタムスクリプト**: 専用ツールの豊富な機能を犠牲に、シンプルさとカスタマイズ性を優先
- **詳細度 vs シンプルさ**: より詳細な測定（メモリ使用量等）を犠牲に、必要十分な指標に絞る
- **リアルタイム vs バッチ**: リアルタイム監視を犠牲に、CI/CD統合可能なバッチ処理を優先

### 影響を受けるコンポーネント/レイヤー

- **CI/CDパイプライン**: パフォーマンステストステップの追加
- **開発ワークフロー**: `npm run test:perf` の定期実行
- **ドキュメント**: performance-report.mdの定期更新
- **Jest設定**: coverageReportersに json-summary追加

---

## 実装（Implementation）

### 実装の詳細

#### 1. パフォーマンステストスクリプト

```javascript
// scripts/performance-test.mjs
import {execSync} from 'child_process';
import {readFileSync, statSync, readdirSync} from 'fs';

// TypeScriptビルド時間測定
const tscStartTime = Date.now();
execSync('npx tsc --noEmit');
const tscDuration = Date.now() - tscStartTime;

// テスト実行時間測定
const testStartTime = Date.now();
execSync('npm test -- --coverage --silent');
const testDuration = Date.now() - testStartTime;

// カバレッジデータ読み込み
const coverageData = JSON.parse(
  readFileSync('coverage/coverage-summary.json')
);
```

#### 2. package.json統合

```json
{
  "scripts": {
    "test:perf": "node scripts/performance-test.mjs"
  }
}
```

#### 3. Jest設定拡張

```javascript
// jest.config.js
module.exports = {
  coverageReporters: ['json', 'lcov', 'text', 'clover', 'json-summary'],
  // json-summary追加でcoverage-summary.json生成
};
```

#### 4. レポートドキュメント

```markdown
// docs/testing/performance-report.md
- パフォーマンス指標
- レイヤー別カバレッジ分析
- 推奨事項
- ベンチマーク比較
```

### 測定結果（2025-11-07時点）

| 指標 | 測定値 | 評価 |
|------|--------|------|
| TypeScriptビルド時間 | 1,787ms | ✅ 良好 |
| テスト実行時間 | 4,031ms | ✅ 良好 |
| ソースコードサイズ | 384.75 KB | ✅ 良好 |
| 本番依存関係 | 12個 | ✅ 優秀 |
| テストカバレッジ | 47.12% | ⚠️ 要改善 |

### CI/CD統合案

```yaml
# .github/workflows/performance.yml (提案)
name: Performance Test

on:
  pull_request:
  push:
    branches: [main, develop]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:perf
      - uses: actions/upload-artifact@v3
        with:
          name: performance-report
          path: coverage/
```

---

## 関連情報（Related）

### 関連ADR

- ADR-002: Clean Architectureの採用
- ADR-003: Zustand状態管理の採用

### 関連ドキュメント

- [パフォーマンステストレポート](../testing/performance-report.md)
- [Phase4最終レビューレポート](../phase4-final-review-report.md)
- [CHANGELOG](../../CHANGELOG.md)

### 参考資料

- [Node.js Performance Hooks](https://nodejs.org/api/perf_hooks.html)
- [Jest Coverage Configuration](https://jestjs.io/docs/configuration#coveragereporters-arraystring--string-options)

---

## 備考（Notes）

### 成功の指標

- ✅ スクリプト実装完了（731d586）
- ✅ パフォーマンスレポート作成
- ✅ package.jsonスクリプト登録
- ✅ Jest設定拡張（json-summaryレポーター追加）
- ⏳ CI/CD統合（未実装）

### 今後の検討事項

- **トレンド追跡**: 過去のメトリクスをデータベース化
- **アラート機能**: 閾値を超えた際の通知
- **メモリプロファイリング**: メモリ使用量の測定追加
- **バンドルサイズ分析**: Metro Bundlerの詳細分析
- **GitHub Actions統合**: PR作成時の自動パフォーマンスチェック

### 測定頻度の推奨

- **開発中**: 大きな変更前後
- **プルリクエスト**: 自動実行（CI/CD統合後）
- **定期実行**: 週次でのトレンド確認
- **リリース前**: 必須実行

### パフォーマンス目標値

| 指標 | 目標値 | 現状 | ステータス |
|------|--------|------|-----------|
| TypeScriptビルド | <3秒 | 1.8秒 | ✅ 達成 |
| テスト実行 | <5秒 | 4.0秒 | ✅ 達成 |
| テストカバレッジ | 80% | 47.12% | ⚠️ 未達 |
| 本番依存関係 | <15個 | 12個 | ✅ 達成 |

---

**作成者**: Claude Code
**レビュー者**: bon71 (Project Owner)
**承認日**: 2025-11-07
**実装コミット**: 731d586
