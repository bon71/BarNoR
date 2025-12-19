# 📚 Notion Barcode Reader

**バーコードをスキャンして、書籍・商品情報を自動でNotionに保存するiOSアプリ**

[![React Native](https://img.shields.io/badge/React%20Native-0.75.5-blue.svg)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)
[![iOS](https://img.shields.io/badge/iOS-13.4+-000000.svg)](https://www.apple.com/ios/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## ✨ 主な機能（MVP v1.0 - 図書館DB特化版）

- 📱 **バーコードスキャン**: カメラでISBNバーコードを素早くスキャン
- 📖 **書籍情報自動取得**: OpenBD APIから書籍タイトル・著者・書影を自動取得
- 🗂️ **Notion自動保存**: スキャン結果を指定したNotionデータベースに自動保存
- ⚙️ **シンプル設定**: Notion Token + データベースID + プロパティマッピングのみの簡単設定
- 🗺️ **プロパティマッピング**: スキャンデータとNotionプロパティの柔軟な対応付け
- 🎨 **モダンUI**: Notionライクなモノトーンデザイン + Liquid Glassエフェクト
- 🌙 **ダークモード対応**: ライト/ダークモード自動切り替え

### Post-MVP機能（v1.1以降で追加予定）

- 📦 **パッケージ管理**: 複数のNotionデータベースを「パッケージ」として管理
- 📜 **履歴管理**: スキャン履歴を時系列で表示・確認
- 🏪 **商品情報取得**: 楽天API連携による商品情報取得

---

## 📱 スクリーンショット

*(実機スクリーンショットを追加予定)*

---

## 🏗️ アーキテクチャ

本プロジェクトは **クリーンアーキテクチャ** を採用しています。

```
src/
├── domain/              # ドメイン層（ビジネスロジック）
│   ├── entities/        # エンティティ（Package, ScannedItem）
│   ├── repositories/    # リポジトリインターフェース
│   └── usecases/        # ユースケース
├── data/                # データ層（外部API・ストレージ）
│   ├── datasources/     # データソース（Notion API, OpenBD API, MMKV）
│   └── repositories/    # リポジトリ実装
├── presentation/        # プレゼンテーション層（UI）
│   ├── screens/         # 画面コンポーネント
│   ├── components/      # 共通コンポーネント
│   ├── viewmodels/      # ViewModel（ロジック層）
│   ├── stores/          # 状態管理（Zustand）
│   └── navigation/      # ナビゲーション
├── infrastructure/      # インフラ層（ロギング・セキュリティ）
├── config/              # 設定・定数
└── utils/               # ユーティリティ
```

詳細は [`docs/architecture-summary.md`](docs/architecture-summary.md) を参照。

---

## 🚀 セットアップ手順

### 前提条件

- **macOS** (iOS開発のため)
- **Node.js** 18.0以上
- **Ruby** 2.7以上（CocoaPods用）
- **Xcode** 14.0以上
- **iOS Simulator** または **実機（iPhone/iPad）**
- **Notion Integration Token**（後述）

### 1. リポジトリのクローン

```bash
git clone https://github.com/bon71/NotionBarcodeReader.git
cd NotionBarcodeReader
```

### 2. 依存関係のインストール

```bash
# Node.jsパッケージ
npm install

# CocoaPods（iOS依存関係）
bundle install
bundle exec pod install
```

### 3. Notion Integration Tokenの取得

1. [Notion Integrations](https://www.notion.so/my-integrations) にアクセス
2. **"+ New integration"** をクリック
3. 以下を設定：
   - **Name**: `NotionBarcodeReader`（任意）
   - **Associated workspace**: 使用するワークスペースを選択
   - **Capabilities**:
     - ✅ Read content
     - ✅ Update content
     - ✅ Insert content
4. **Submit** をクリック
5. **Internal Integration Token** をコピー（`secret_...` で始まる文字列）

### 4. Notionデータベースの作成

1. Notionで新しいページを作成
2. **Database - Table** を選択
3. 以下のプロパティを作成：

| プロパティ名 | タイプ | 説明 |
|------------|------|------|
| タイトル | Title | 書籍タイトル（デフォルト） |
| 著者名 | Text | 著者名 |
| ISBN | Text | ISBNコード |
| 書影 | Files & media | 書籍の表紙画像 |
| 出版社 | Text | 出版社名 |
| 発行日 | Date | 発行日 |

4. データベースページの **"..."** メニューから **"Add connections"** → 先ほど作成したIntegrationを選択
5. データベースページのURLから **Database ID** を取得：
   ```
   https://www.notion.so/myworkspace/abc123def456?v=...
                                    ^^^^^^^^^^^^
                                    この部分がDatabase ID
   ```

### 5. アプリの起動

#### iOS Simulator

```bash
npm run ios
```

#### 実機（iPhone/iPad）

1. Xcodeでプロジェクトを開く：
   ```bash
   open ios/NotionBarcodeReader.xcworkspace
   ```

2. **Signing & Capabilities** で以下を設定：
   - **Team**: Apple Developer Accountを選択
   - **Bundle Identifier**: 一意の識別子に変更（例: `com.yourname.notionbarcodereader`）

3. iPhoneをMacに接続し、デバイスを選択

4. **Build** ボタン（▶️）をクリック

詳細は [`docs/20250106_iPhone実機テスト環境セットアップ手順.md`](docs/20250106_iPhone実機テスト環境セットアップ手順.md) を参照。

---

## 📖 使い方（MVP v1.0 - 簡易版）

### 初回セットアップ（3ステップ）

1. **アプリ起動** → **設定タブ** へ移動

2. **Notion Integration Token** を入力
   - [Notion Integrations](https://www.notion.so/my-integrations) で取得
   - **認証テスト** ボタンで接続確認

3. **データベース設定** を入力
   - **データベースID**: NotionデータベースのURL内のID（32文字または36文字のUUID）
   - **プロパティマッピング**:
     - ISBN → Notionプロパティ名（例: "ISBN"）
     - タイトル → Notionプロパティ名（例: "タイトル"）
     - 著者 → Notionプロパティ名（例: "著者名"）
     - 書影URL → Notionプロパティ名（例: "書影"）
   - **保存** ボタンをタップ

### バーコードスキャン（簡単3ステップ）

1. **スキャンタブ** → カメラ起動
   - 初回はカメラ権限を許可

2. 書籍の **ISBNバーコード** をカメラに向ける
   - 自動で書籍情報を取得 → 確認画面が表示

3. **Notionに保存** をタップ
   - 完了！Notionデータベースを確認

### 設定が未完了の場合

- スキャン画面に「**設定が完了していません**」というメッセージが表示されます
- **設定画面へ** ボタンをタップして、セットアップを完了してください

---

## 🧪 テスト

### ユニットテスト実行

```bash
npm test
```

### カバレッジ確認

```bash
npm run test:coverage
```

**現在のカバレッジ**: 73.61% (目標80%)

### E2Eテスト（Detox）

```bash
# iOS Simulatorでビルド
npm run detox:build:ios

# テスト実行
npm run detox:test:ios
```

---

## 📊 技術スタック

| カテゴリ | 技術 | バージョン |
|---------|------|----------|
| **フレームワーク** | React Native | 0.75.5 |
| **言語** | TypeScript | 5.8.3 |
| **状態管理** | Zustand | ^5.0.3 |
| **ナビゲーション** | React Navigation | ^7.0.13 |
| **カメラ** | react-native-vision-camera | ^4.7.3 |
| **バーコード認識** | vision-camera-code-scanner | ^0.2.0 |
| **ストレージ** | react-native-mmkv | ^3.1.0 |
| **API** | Notion SDK | ^2.2.15 |
| **テスト** | Jest + Detox | 29.7.0 + ^20.29.1 |

---

## 🔒 プライバシー・セキュリティ

- **Notion Integration Token** は、端末内に暗号化して保存（MMKV + AES-256-GCM）
- **通信**: HTTPS暗号化通信のみ使用
- **カメラ**: スキャン時のみ使用、画像保存なし
- **データ**: Notion以外への送信なし

詳細は [`docs/PRIVACY_POLICY_ja.md`](docs/PRIVACY_POLICY_ja.md) を参照。

---

## 🐛 トラブルシューティング

### アプリが起動しない

```bash
# キャッシュクリア
npm start -- --reset-cache

# ビルドクリーン
cd ios && xcodebuild clean && cd ..
bundle exec pod install
```

### カメラが起動しない

1. **設定アプリ** → **NotionBarcodeReader** → **カメラ** を許可
2. アプリを再起動

### Notion認証エラー

- Integration Tokenが正しいか確認
- Notionデータベースに Integration が接続されているか確認
- ネットワーク接続を確認

### ビルドエラー

```bash
# iOS依存関係の再インストール
cd ios
rm -rf Pods Podfile.lock
bundle exec pod install
cd ..
```

その他のトラブルシューティングは [`docs/product/P1_MVP_RELEASE_TASKS.md`](docs/product/P1_MVP_RELEASE_TASKS.md) を参照。

---

## 📝 ドキュメント

- [アーキテクチャ概要](docs/architecture-summary.md)
- [MVP リリースタスク](docs/product/P1_MVP_RELEASE_TASKS.md)
- [実機テスト環境セットアップ](docs/20250106_iPhone実機テスト環境セットアップ手順.md)
- [テストカバレッジレポート](docs/testing/test-coverage-report.md)
- [プライバシーポリシー](docs/PRIVACY_POLICY_ja.md)
- [利用規約](docs/TERMS_OF_SERVICE_ja.md)

---

## 🗺️ ロードマップ

### v1.0 (MVP) - 図書館DB特化版（現在開発中）

**MVP簡素化方針**: 最小限の機能に絞り、確実に動作するアプリをリリース

#### Phase A-D: アーキテクチャ簡素化 ✅ **完了**
- [x] 2タブナビゲーション（スキャン/設定のみ）
- [x] 固定DB設定画面（SimplifiedConfig）
- [x] Notion Token入力・認証機能
- [x] 固定データベースID設定
- [x] プロパティマッピング設定
- [x] パッケージ管理機能の削除（複数パッケージ不要）
- [x] 履歴機能の削除（シンプル化）

#### Phase E: 品質チェック・実機テスト ⏳ **準備中**
- [x] TypeScriptエラー 0件
- [ ] テストカバレッジ向上（現在73.61% → 目標80%）
- [ ] ESLint警告 0件
- [ ] 実機テスト完了（カメラ・API・フロー全体）
- [ ] TestFlight公開

#### 実装済みコア機能
- [x] バーコードスキャン機能（Vision Camera + Code Scanner）
- [x] 書籍情報取得（OpenBD API）
- [x] Notion連携・自動保存
- [x] 設定画面（Token + DB ID + Mapping）
- [x] エラーハンドリング（3層防御戦略）

### v1.1 (Post-MVP)

- [ ] パッケージ管理機能の復活（複数パッケージ対応）
- [ ] スキャン履歴表示機能
- [ ] パッケージ編集機能
- [ ] 商品情報取得（楽天API）
- [ ] オフライン対応
- [ ] バックグラウンド送信

### v2.0 (Future)

- [ ] In-App Purchase（サブスクリプション）
- [ ] カスタムプラグインシステム
- [ ] Android対応
- [ ] iPad最適化
- [ ] 複数バーコード一括スキャン

---

## 🤝 コントリビューション

現在、このプロジェクトは個人開発です。フィードバック・バグ報告は [Issues](https://github.com/bon71/NotionBarcodeReader/issues) よりお願いします。

---

## 📄 ライセンス

MIT License

Copyright (c) 2025 bon71

詳細は [LICENSE](LICENSE) を参照。

---

## 🙏 謝辞

このプロジェクトは以下のOSS・APIを使用しています：

- [React Native](https://reactnative.dev/)
- [Notion API](https://developers.notion.com/)
- [OpenBD API](https://openbd.jp/)
- [react-native-vision-camera](https://github.com/mrousavy/react-native-vision-camera)

---

## 📧 お問い合わせ

- **開発者**: bon71
- **GitHub**: [@bon71](https://github.com/bon71)
- **Issues**: [GitHub Issues](https://github.com/bon71/NotionBarcodeReader/issues)

---

**Built with ❤️ using React Native + TypeScript + Notion API**
