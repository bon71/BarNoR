# React Native New Architecture 移行計画書

## 目次
1. [概要](#概要)
2. [New Architectureとは](#new-architectureとは)
3. [移行の必要性とタイムライン](#移行の必要性とタイムライン)
4. [解決方法](#解決方法)
5. [メリット](#メリット)
6. [デメリット](#デメリット)
7. [推奨移行スケジュール](#推奨移行スケジュール)
8. [影響範囲と対応](#影響範囲と対応)
9. [参考資料](#参考資料)

---

## 概要

React Native 0.81.0（現在のバージョン）は**Legacy Architecture**を使用しており、将来的に廃止されることが公式に発表されています。本ドキュメントでは、1〜2年の運用を想定した場合の**New Architecture移行計画**をまとめます。

### 現在の状況
- **React Native**: 0.81.0（Legacy Architecture）
- **React**: 19.1.0
- **使用ライブラリ**: 6つのネイティブモジュール
- **アーキテクチャ**: MVVM + Clean Architecture

---

## New Architectureとは

### 主要コンポーネント

#### 1. **Fabric（新レンダラー）**
- JavaScriptとネイティブ間の**同期実行**を実現
- マルチスレッド対応
- React 18の完全サポート（Suspense、Transitions、自動バッチング）

#### 2. **TurboModules（新ネイティブモジュールシステム）**
- **遅延ロード**：必要なモジュールのみを動的にロード
- **型安全性**：JavaScript ↔ Native間の型チェック
- C++で実装され、iOS/Android間でコード共有

#### 3. **Codegen（コード自動生成）**
- TypeScriptの型定義から自動的にネイティブコードを生成
- 型安全なJavaScript ↔ Nativeインターフェース

### 従来（Legacy）との違い

| 項目 | Legacy Architecture | New Architecture |
|------|---------------------|------------------|
| JS ↔ Native通信 | ブリッジ（非同期・JSON） | 直接呼び出し（同期・型安全） |
| レンダリング | シングルスレッド | マルチスレッド |
| モジュールロード | 起動時に全ロード | 必要時に遅延ロード |
| 型安全性 | なし | TypeScript型から自動生成 |
| React 18サポート | 部分的 | 完全対応 |

---

## 移行の必要性とタイムライン

### React Nativeの公式スケジュール

| バージョン | リリース時期 | New Architecture状態 | Legacy Architecture |
|-----------|-------------|---------------------|---------------------|
| 0.76 | 2024年10月 | デフォルト有効 | サポート継続 |
| 0.81 | 2025年（現在） | オプション | **現在のバージョン** |
| 0.82 | 2025年後半（予定） | 強制有効 | **削除される可能性** |

### 移行の緊急度

#### 短期（〜6ヶ月）
- **緊急度**: 低
- **理由**: Legacy Architectureは現在も安定動作
- **推奨**: 現状維持

#### 中期（6ヶ月〜1年）
- **緊急度**: 中
- **理由**: React Native 0.82リリース後はサポート終了の可能性
- **推奨**: 移行計画の開始

#### 長期（1年〜2年）
- **緊急度**: 高
- **理由**: Legacyサポート完全終了、新機能が利用不可
- **推奨**: **移行必須**

---

## 解決方法

### 選択肢1: React Native 0.76+へのアップグレード（推奨）

#### 概要
React Native 0.76以降にアップグレードし、New Architectureを有効化。

#### 実施手順

**Phase 1: 準備（1週間）**
```bash
# 1. 依存関係の互換性確認
npx react-native-community/upgrade-helper compare 0.81.0 0.76.0

# 2. ライブラリ互換性チェック
# https://reactnative.directory/ で各ライブラリを確認
```

**Phase 2: アップグレード（2〜3週間）**
```bash
# 1. React Nativeアップグレード
npm install react-native@0.76.0

# 2. 依存関係の更新
npm install react@^18.3.0  # React 18が推奨
npm install

# 3. ネイティブコードの再構築
cd ios && pod install
cd android && ./gradlew clean
```

**Phase 3: New Architecture有効化（1週間）**

**iOS（ios/Podfile）:**
```ruby
# New Architectureを有効化
ENV['RCT_NEW_ARCH_ENABLED'] = '1'
```

**Android（android/gradle.properties）:**
```properties
newArchEnabled=true
```

**Phase 4: テストと検証（2〜3週間）**
- 全機能の動作確認
- パフォーマンステスト
- UIの一貫性チェック
- カメラ機能の動作確認（react-native-vision-camera）

#### 影響を受けるライブラリと対応

| ライブラリ | New Architecture対応 | 対応内容 |
|-----------|---------------------|---------|
| @react-navigation/\* | ✅ 完全対応 | 変更不要 |
| react-native-gesture-handler | ✅ 完全対応 | 変更不要 |
| react-native-screens | ✅ 完全対応 | 変更不要 |
| react-native-safe-area-context | ✅ 完全対応 | 変更不要 |
| react-native-mmkv | ✅ 完全対応 | 変更不要 |
| react-native-vision-camera | ✅ 完全対応 | 変更不要 |
| zustand | ✅ 完全対応（JS only） | 変更不要 |

**結論**: すべてのライブラリがNew Architecture対応済み ✅

---

### 選択肢2: 現状維持（非推奨）

#### 概要
React Native 0.81.0のまま、Legacy Architectureを継続使用。

#### リスク
- ⚠️ セキュリティパッチが提供されなくなる
- ⚠️ 新機能（React 18完全対応など）が使えない
- ⚠️ 将来的に強制移行が必要
- ⚠️ 技術的負債の蓄積

#### 推奨期限
**2025年末まで**（React Native 0.82リリース後は移行必須）

---

## メリット

### 1. **パフォーマンス向上**

#### 起動時間の短縮
- **TurboModules遅延ロード**: 必要なモジュールのみロード
- **実測改善**: 起動時間が15〜30%短縮（Shopifyの事例）

#### レンダリング性能の向上
- **同期レンダリング**: ジャンクやちらつきの削減
- **マルチスレッド**: 60fps維持が容易に

### 2. **開発体験の向上**

#### 型安全性
```typescript
// Codegen自動生成により、型エラーがコンパイル時に検出
interface TurboModuleSpec extends TurboModule {
  getString(key: string): string;  // 型安全
}
```

#### デバッグの容易さ
- スタックトレースの改善
- エラーメッセージの明確化

### 3. **React 18の完全対応**

```typescript
// Suspenseの利用が可能に
<Suspense fallback={<Loading />}>
  <AsyncComponent />
</Suspense>

// Transitionsによる優先度制御
startTransition(() => {
  setSearchQuery(value);
});
```

### 4. **将来性**

- React Nativeの最新機能が利用可能
- 長期的なサポートとセキュリティアップデート
- コミュニティエコシステムとの整合性

### 5. **クロスプラットフォーム開発の改善**

- C++による共通実装でiOS/Android間のコード重複削減
- プラットフォーム固有のバグが減少

---

## デメリット

### 1. **移行コスト**

#### 開発工数
- **見積もり**: 6〜8週間（フルタイム1名換算）
  - 準備・調査: 1週間
  - アップグレード実装: 2〜3週間
  - New Architecture有効化: 1週間
  - テスト・検証: 2〜3週間
  - バグ修正・調整: 1週間

#### リソース
- React Native経験者が必要
- iOS/Android両方のネイティブ知識が望ましい

### 2. **一時的な不安定性**

#### 移行中のリスク
- 新しいバグの混入可能性
- パフォーマンス一時低下の可能性
- ライブラリ互換性の問題

#### 対策
- 段階的なロールアウト（Feature Flag使用）
- 十分なテスト期間の確保
- ロールバック計画の準備

### 3. **学習コスト**

#### 新しい概念の理解
- Fabricレンダラーの動作原理
- TurboModulesの実装方法
- Codegenの使用方法

#### 対策
- 公式ドキュメントの熟読
- コミュニティの事例研究
- 段階的な導入

### 4. **ツールチェーンの変更**

#### ビルドプロセスの複雑化
- Codegenの追加ステップ
- ネイティブビルドの変更

#### 対策
- CI/CDパイプラインの更新
- ビルドスクリプトの調整

---

## 推奨移行スケジュール

### 🎯 1年〜2年運用を想定した移行計画

#### タイムライン

```
2025年
├── Q1 (1-3月) - 現状維持 + 調査
│   ├── Week 1-4: New Architecture情報収集
│   ├── Week 5-8: ライブラリ互換性確認
│   └── Week 9-12: 移行計画書作成
│
├── Q2 (4-6月) - 準備期間
│   ├── Week 13-16: 開発環境セットアップ
│   ├── Week 17-20: テスト環境構築
│   └── Week 21-24: 移行スクリプト作成
│
├── Q3 (7-9月) - 移行実施 ⭐ 推奨時期
│   ├── Week 25-28: React Native 0.76+アップグレード
│   ├── Week 29-32: New Architecture有効化
│   └── Week 33-36: 統合テスト
│
└── Q4 (10-12月) - 本番リリース
    ├── Week 37-40: ベータテスト
    ├── Week 41-44: 段階的ロールアウト
    └── Week 45-48: 全ユーザーへの展開

2026年
└── Q1以降 - 安定運用
    ├── Legacy Architectureサポート終了に備える
    └── 新機能開発に専念
```

### 📅 マイルストーン

| マイルストーン | 期限 | 成果物 |
|--------------|------|--------|
| 移行判断 | 2025年3月末 | 移行Go/No-Go決定 |
| 準備完了 | 2025年6月末 | 開発・テスト環境構築 |
| **移行完了** | **2025年9月末** | **New Architecture動作確認** |
| 本番リリース | 2025年12月末 | 全ユーザーへ展開 |

### ⚠️ 重要な判断ポイント

#### 2025年3月時点での判断基準
- React Native 0.82のリリース状況
- Legacyサポート終了時期の公式アナウンス
- プロジェクトの開発リソース状況

#### 移行を延期できる条件
- ✅ React Native 0.82がLegacy Architectureをサポート
- ✅ セキュリティパッチが継続提供
- ✅ 使用ライブラリがLegacyで動作

#### 移行を前倒しすべき条件
- ⚠️ Legacy Architectureの廃止アナウンス
- ⚠️ 重大なセキュリティ脆弱性の発見
- ⚠️ 使用ライブラリのLegacyサポート終了

---

## 影響範囲と対応

### 📱 本プロジェクトへの影響

#### 変更が必要な箇所

**ほぼなし** - すべてのライブラリがNew Architecture対応済み

#### 注意が必要な箇所

1. **react-native-vision-camera（カメラ機能）**
   - New Architecture対応済みだが、動作確認が重要
   - テストケース: バーコードスキャン機能

2. **MVVM Architecture**
   - ViewModelやStoreの動作確認
   - Zustand（状態管理）の動作検証

3. **パフォーマンス要件**
   - カメラプレビューの60fps維持
   - スキャン→Notion送信のレスポンス時間

### 🧪 テスト計画

#### 必須テスト項目

```typescript
// 1. カメラ機能
✅ バーコードスキャン動作
✅ カメラプレビュー表示
✅ パフォーマンス（60fps維持）

// 2. Notion連携
✅ データベース書き込み
✅ エラーハンドリング
✅ オフライン時の挙動

// 3. ナビゲーション
✅ 画面遷移
✅ タブナビゲーション
✅ モーダル表示

// 4. 状態管理
✅ Zustand Store動作
✅ 永続化（MMKV）
✅ データ整合性
```

#### パフォーマンステスト

```bash
# 起動時間計測
npm run ios:release
# → Xcodeで起動時間を計測

# メモリ使用量
# → Instruments（iOS）/ Profiler（Android）で確認

# レンダリング性能
# → Flipperでフレームレート確認
```

---

## 参考資料

### 公式ドキュメント
- [The New Architecture is Here | React Native](https://reactnative.dev/blog/2024/10/23/the-new-architecture-is-here)
- [New Architecture - React Native](https://reactnative.dev/docs/new-architecture-intro)
- [Migrating to the New Architecture - React Native](https://reactnative.dev/docs/new-architecture-app-intro)

### ライブラリ互換性
- [React Native Directory](https://reactnative.directory/) - ライブラリの対応状況確認

### 事例研究
- [Shopify's New Architecture Migration](https://shopify.engineering/react-native-new-architecture) - 大規模アプリの移行事例

### ツール
- [Upgrade Helper](https://react-native-community.github.io/upgrade-helper/) - バージョンアップ差分確認

---

## まとめ

### ✅ 推奨アプローチ

**2025年Q3（7〜9月）にNew Architectureへ移行**

#### 理由
1. ✅ すべてのライブラリが対応済み
2. ✅ React Native 0.82リリース前に余裕を持って移行
3. ✅ 1〜2年の運用期間を安全に確保
4. ✅ パフォーマンス向上とReact 18機能が利用可能

#### 移行の総合評価

| 評価項目 | スコア | 備考 |
|---------|--------|------|
| 技術的実現可能性 | ⭐⭐⭐⭐⭐ | ライブラリ対応完了 |
| ビジネス価値 | ⭐⭐⭐⭐☆ | パフォーマンス向上 |
| 開発コスト | ⭐⭐⭐☆☆ | 6〜8週間の工数 |
| リスク | ⭐⭐☆☆☆ | 低リスク |
| 緊急度（2025年内） | ⭐⭐⭐⭐☆ | 高い |

### 🚀 Next Actions

1. **2025年3月**: 移行Go/No-Go判断
2. **2025年Q2**: 移行準備（環境構築・テスト計画）
3. **2025年Q3**: 移行実施
4. **2025年Q4**: 本番リリース

---

## 移行試行レポート（2025-11-04）

### 実施内容

**目的**: React Native 0.76への移行とNew Architecture有効化の実現可能性確認

**実施手順**:
1. ロールバックポイント作成（`stable-before-new-arch`タグ）
2. 新ブランチ作成（`feat/new-architecture-migration`）
3. React Native 0.81.0 → 0.76.9へのダウングレード
4. New Architecture有効化（`RCT_NEW_ARCH_ENABLED=1`）
5. iOS podのインストールと確認

### 判明した技術的制約

#### 1. **React バージョンの不整合**

**問題**:
- React Native 0.81.0はReact 19.1.0で動作（現在の安定構成）
- React Native 0.76.9はReact 18.2.0を要求
- React 19.1.0 → 18.2.0へのダウングレードが必要

**影響**:
```json
// 現在の動作構成
"react": "19.1.0",
"react-native": "0.81.0"

// 0.76への移行時
"react": "18.2.0",  // ダウングレード
"react-native": "0.76.9"
```

#### 2. **AppDelegateの破壊的変更**

**問題**:
- React Native 0.76ではAppDelegateのAPIが変更
- `bundleURL()`メソッドが廃止
- `initialProps`プロパティが必須化

**ビルドエラー**:
```
error: value of type 'RCTAppDelegate' has no member 'bundleURL'
```

#### 3. **後方互換性の課題**

**根本原因**:
- React Native 0.81.0はReact 19サポート（最新）
- React Native 0.76.9はReact 18のみサポート（旧版）
- **バージョンアップではなくダウングレードが必要**

### 結論と推奨事項

#### ❌ React Native 0.76への移行は非推奨

**理由**:
1. **Reactの後方互換性**: React 19 → 18へのダウングレードは本末転倒
2. **既存の安定性**: React 19.1.0 + React Native 0.81.0は動作確認済み
3. **移行コスト**: AppDelegate書き換えなど大幅な修正が必要

#### ✅ 推奨アプローチの変更

**新しい推奨方針**:

**Option A: React Native 0.81.0を維持（短期〜中期）**
```markdown
- 現状: React 19.1.0 + React Native 0.81.0 (Legacy Architecture)
- 期間: 2025年末まで
- メリット: 安定動作、React 19の最新機能利用可能
- リスク: Legacy Architecture警告は出るが動作に問題なし
```

**Option B: React Native 0.82+を待つ（推奨）**
```markdown
- 時期: 2025年後半〜2026年初頭
- 期待: React 19対応 + New Architecture
- 利点: React 19との互換性を保ちながら移行可能
- 移行時期: React Native 0.82安定版リリース後
```

### ロールバック結果

✅ **ロールバック成功**
- `git checkout stable-before-new-arch`で元の安定状態に復帰
- `git reset --hard da0cff1`で完全にクリーンな状態に
- 移行ブランチ（`feat/new-architecture-migration`）は削除済み

### 更新された移行スケジュール

```
2025年
├── Q1-Q2 - 現状維持（React 19.1.0 + RN 0.81.0）
│   └── Legacy Architecture継続（安定動作）
│
├── Q3-Q4 - React Native 0.82リリース待機
│   ├── React Native 0.82の動向監視
│   ├── React 19対応状況の確認
│   └── 移行計画の再評価
│
2026年
└── Q1以降 - React Native 0.82+への移行
    ├── React 19互換性を保ちながら移行
    └── New Architecture有効化
```

### 教訓

1. **バージョンアップの方向性**: 常に最新への移行を想定すべき（ダウングレードは避ける）
2. **互換性の事前確認**: React/React Nativeの依存関係を詳細に調査
3. **ロールバック計画**: 必須（今回の試行で有効性を確認）
4. **公式リリース待機**: React 19対応版のリリースを待つのが最適解

---

**Document Version**: 1.1
**Last Updated**: 2025-11-04 (移行試行レポート追加)
**Author**: Claude Code
**Status**: Migration Attempted - Rollback Completed
