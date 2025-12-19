# Detox E2Eテストガイド

このガイドでは、NotionBarcodeReaderプロジェクトでDetoxを使用したE2Eテストの実行方法と、新しいテストの書き方について説明します。

## 📋 目次

- [Detoxとは](#detoxとは)
- [セットアップ確認](#セットアップ確認)
- [テストの実行方法](#テストの実行方法)
- [テストの書き方](#テストの書き方)
- [トラブルシューティング](#トラブルシューティング)
- [ベストプラクティス](#ベストプラクティス)

## Detoxとは

DetoxはReact Native向けのE2E（End-to-End）テストフレームワークです。実際のアプリケーションと同様に、ユーザーの操作をシミュレートしてアプリ全体の動作を検証します。

### PlaywrightとDetoxの違い

- **Playwright**: Webアプリケーション向けのE2Eテストフレームワーク
- **Detox**: React Native（iOS/Android）向けのE2Eテストフレームワーク

React Nativeアプリの場合、Detoxを使用する必要があります。

## セットアップ確認

### 1. 依存関係の確認

以下のパッケージがインストールされていることを確認してください：

```bash
npm list detox jest-circus
```

既にインストール済みのはずですが、もしインストールされていない場合：

```bash
npm install --save-dev detox jest-circus
npm install -g detox-cli
```

### 2. 設定ファイルの確認

以下のファイルが存在することを確認：

- `.detoxrc.js` - Detoxのメイン設定
- `e2e/jest.config.js` - E2E用のJest設定
- `e2e/init.ts` - テストのセットアップファイル
- `e2e/app.test.ts` - サンプルテスト

## テストの実行方法

### ステップ1: iOSシミュレータの起動

```bash
# Xcodeでシミュレータを起動するか、コマンドラインで：
open -a Simulator
```

### ステップ2: アプリのビルド

初回またはコード変更後は、テスト用のアプリをビルドする必要があります：

```bash
# Debugビルド（推奨）
detox build --configuration ios.sim.debug

# Releaseビルド（より本番環境に近いテスト）
detox build --configuration ios.sim.release
```

### ステップ3: E2Eテストの実行

```bash
# Debugビルドでテスト実行
detox test --configuration ios.sim.debug

# Releaseビルドでテスト実行
detox test --configuration ios.sim.release

# 特定のテストファイルのみ実行
detox test --configuration ios.sim.debug e2e/app.test.ts

# ログを詳細表示
detox test --configuration ios.sim.debug --loglevel verbose
```

### package.jsonスクリプトへの追加（推奨）

便利なスクリプトを追加することをお勧めします：

```json
{
  "scripts": {
    "e2e:build:ios": "detox build --configuration ios.sim.debug",
    "e2e:test:ios": "detox test --configuration ios.sim.debug",
    "e2e:test:ios:verbose": "detox test --configuration ios.sim.debug --loglevel verbose"
  }
}
```

これにより、以下のように実行できます：

```bash
npm run e2e:build:ios
npm run e2e:test:ios
```

## テストの書き方

### 基本的なテスト構造

```typescript
import {device, element, by, expect as detoxExpect} from 'detox';

describe('機能名テスト', () => {
  beforeAll(async () => {
    // テストスイート開始前の準備
    await device.launchApp({
      permissions: {camera: 'YES'},
    });
  });

  beforeEach(async () => {
    // 各テスト実行前にアプリをリロード
    await device.reloadReactNative();
  });

  it('テストケース説明', async () => {
    // テストコード
    await detoxExpect(element(by.id('home-screen'))).toBeVisible();
  });
});
```

### 要素の選択方法

#### testIDによる選択（推奨）

```typescript
// testID propが設定された要素を取得
await element(by.id('home-screen'));
await element(by.id('scan-button'));
```

画面コンポーネントでは、以下のようにtestIDを設定します：

```tsx
<View testID="home-screen">
  <Button testID="scan-button" title="スキャン" />
</View>
```

#### テキストによる選択

```typescript
// 表示テキストで要素を取得
await element(by.text('ホーム'));
await element(by.text('設定'));
```

#### ラベルによる選択（アクセシビリティラベル）

```typescript
await element(by.label('ホーム画面'));
```

### よく使うアクション

```typescript
// タップ
await element(by.id('scan-button')).tap();

// 長押し
await element(by.id('item-card')).longPress();

// テキスト入力
await element(by.id('token-input')).typeText('secret_token_value');
await element(by.id('token-input')).clearText();
await element(by.id('token-input')).replaceText('new_value');

// スクロール
await element(by.id('recent-history-list')).scroll(200, 'down');
await element(by.id('recent-history-list')).scrollTo('bottom');
await element(by.id('recent-history-list')).scrollTo('top');

// スワイプ
await element(by.id('item-card')).swipe('left');
await element(by.id('item-card')).swipe('right', 'fast', 0.8);
```

### よく使うアサーション

```typescript
// 表示確認
await detoxExpect(element(by.id('home-screen'))).toBeVisible();

// 非表示確認
await detoxExpect(element(by.id('error-message'))).not.toBeVisible();

// 存在確認（DOMに存在するが非表示の可能性）
await detoxExpect(element(by.id('hidden-element'))).toExist();

// テキスト確認
await detoxExpect(element(by.id('home-title'))).toHaveText('Notion Barcode Reader');

// 値確認（Input要素など）
await detoxExpect(element(by.id('token-input'))).toHaveValue('secret_');

// 有効/無効確認
await detoxExpect(element(by.id('scan-button'))).toBeEnabled();
await detoxExpect(element(by.id('scan-button'))).not.toBeEnabled();
```

### 待機処理

```typescript
// 要素が表示されるまで待機（自動で行われる）
await detoxExpect(element(by.id('loading'))).toBeVisible();

// 要素が消えるまで待機
await waitFor(element(by.id('loading'))).not.toBeVisible().withTimeout(5000);

// 明示的な待機（非推奨：できるだけ避ける）
await new Promise(resolve => setTimeout(resolve, 2000));
```

### ナビゲーションのテスト

```typescript
describe('ナビゲーション', () => {
  it('設定画面に遷移できる', async () => {
    // 設定タブをタップ
    await element(by.text('設定')).tap();

    // 設定画面が表示される
    await detoxExpect(element(by.id('settings-screen'))).toBeVisible();
  });

  it('ホーム画面に戻れる', async () => {
    // 設定画面に移動
    await element(by.text('設定')).tap();
    await detoxExpect(element(by.id('settings-screen'))).toBeVisible();

    // ホームタブをタップ
    await element(by.text('ホーム')).tap();

    // ホーム画面が表示される
    await detoxExpect(element(by.id('home-screen'))).toBeVisible();
  });
});
```

### フォーム入力のテスト

```typescript
describe('Notionトークン設定', () => {
  beforeEach(async () => {
    // 設定画面に移動
    await element(by.text('設定')).tap();
    await detoxExpect(element(by.id('settings-screen'))).toBeVisible();
  });

  it('トークンを保存できる', async () => {
    // トークン入力
    await element(by.id('token-input')).typeText('secret_test_token_123');

    // 保存ボタンをタップ
    await element(by.id('save-token-button')).tap();

    // 成功メッセージが表示される（Alertの場合）
    // 注: Alertのテストは特別な方法が必要
  });
});
```

## トラブルシューティング

### 問題1: ビルドが失敗する

#### 解決策

```bash
# キャッシュをクリア
cd ios
rm -rf build
cd ..

# ビルドを再実行
detox build --configuration ios.sim.debug
```

### 問題2: シミュレータが起動しない

#### 解決策

```bash
# 利用可能なシミュレータを確認
xcrun simctl list devices

# .detoxrc.jsで指定したデバイス（iPhone 15）が存在するか確認
# 存在しない場合は、Xcodeで作成するか、.detoxrc.jsを編集
```

### 問題3: テストがタイムアウトする

#### 解決策

```typescript
// タイムアウト時間を延長
await waitFor(element(by.id('loading')))
  .not.toBeVisible()
  .withTimeout(10000); // 10秒に延長

// または jest.config.js で testTimeout を延長
module.exports = {
  testTimeout: 180000, // 3分
};
```

### 問題4: 要素が見つからない

#### 解決策

```typescript
// 1. testIDが正しく設定されているか確認
<View testID="my-element">

// 2. 要素が表示されるまで待機
await waitFor(element(by.id('my-element')))
  .toBeVisible()
  .withTimeout(5000);

// 3. スクロールして要素を表示
await element(by.id('scroll-view')).scroll(200, 'down');
await detoxExpect(element(by.id('my-element'))).toBeVisible();
```

### 問題5: React Native hot reloadが邪魔をする

#### 解決策

E2Eテスト実行時は、Metro bundlerを別ターミナルで起動しておくと安定します：

```bash
# ターミナル1
npm start

# ターミナル2
detox test --configuration ios.sim.debug
```

## ベストプラクティス

### 1. testIDを必ず設定する

```tsx
// Good
<Button testID="scan-button" title="スキャン" />

// Bad (テキストでの選択は言語変更に弱い)
<Button title="スキャン" />
```

### 2. 各テストを独立させる

```typescript
// Good: 各テストが独立している
it('テスト1', async () => {
  await device.reloadReactNative();
  // テストコード
});

it('テスト2', async () => {
  await device.reloadReactNative();
  // テストコード
});

// Bad: テスト1の結果に依存している
it('テスト1', async () => {
  await element(by.id('button')).tap();
});

it('テスト2', async () => {
  // テスト1の実行結果に依存
  await detoxExpect(element(by.id('result'))).toBeVisible();
});
```

### 3. 明示的な待機は避ける

```typescript
// Good: 要素の表示を待機
await waitFor(element(by.id('result')))
  .toBeVisible()
  .withTimeout(5000);

// Bad: 固定時間の待機（不安定）
await new Promise(resolve => setTimeout(resolve, 2000));
```

### 4. テストの説明は日本語でOK

```typescript
// OK: わかりやすい日本語の説明
describe('ホーム画面', () => {
  it('スキャンボタンをタップするとカメラが起動する', async () => {
    // ...
  });
});
```

### 5. よく使う操作をヘルパー関数にする

```typescript
// helpers.ts
export async function navigateToSettings() {
  await element(by.text('設定')).tap();
  await detoxExpect(element(by.id('settings-screen'))).toBeVisible();
}

export async function navigateToHome() {
  await element(by.text('ホーム')).tap();
  await detoxExpect(element(by.id('home-screen'))).toBeVisible();
}

// テストファイル
import {navigateToSettings, navigateToHome} from './helpers';

it('設定からホームに戻れる', async () => {
  await navigateToSettings();
  await navigateToHome();
});
```

## 参考資料

- [Detox公式ドキュメント](https://wix.github.io/Detox/)
- [Detox API Reference](https://wix.github.io/Detox/docs/api/actions)
- [React Native Testing Guide](https://reactnative.dev/docs/testing-overview)

## まとめ

Detoxを使用することで、React Nativeアプリの動作を実際のユーザー操作に近い形で自動テストできます。

### 基本的なワークフロー

1. アプリをビルド: `detox build --configuration ios.sim.debug`
2. テストを実行: `detox test --configuration ios.sim.debug`
3. テストが失敗したら、ログを確認して修正
4. 新しい機能を追加したら、E2Eテストも追加

### テスト作成のポイント

- すべてのインタラクティブ要素にtestIDを設定
- ユーザーの主要な操作フローをテスト
- 各テストは独立して実行可能にする
- 明示的な待機は避け、要素の表示を待機する

Happy Testing! 🎉
