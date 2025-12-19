# 技術構成まとめ

## 技術スタック
- フロントエンド/ランタイム: React 18.3.1, React Native 0.81.0, Hermes, TypeScript 5.8.3
- ナビゲーション/UI基盤:
  - @react-navigation/native ^7.1.18
  - @react-navigation/native-stack ^7.6.1
  - @react-navigation/bottom-tabs ^7.5.0 (4タブ: ホーム/履歴/パッケージ/設定)
  - react-native-screens ^4.18.0
  - react-native-safe-area-context ^5.6.1
  - react-native-gesture-handler ^2.29.0
- カメラ/スキャン: react-native-vision-camera ^4.7.2
- 状態管理: Zustand ^5.0.8（src/presentation/stores/*）
- データ永続化: MMKV 2.12.2（react-native-mmkv）
- アーキテクチャ: クリーンアーキテクチャ（Presentation / Domain / Data / Infrastructure）
- ビルド/開発:
  - Metro Bundler（@react-native/metro-config 0.81.0）
  - Babel（@babel/core ^7.25.2、module-resolver で @ -> src）
  - Jest ^29.6.3 + @testing-library/react-native ^13.3.3
  - CocoaPods(iOS)、Gradle(Android)
- エイリアス設定: tsconfig.json の paths と babel.config.js の module-resolver
- Node.js: >=20

## ディレクトリと役割
- src/presentation: 画面・コンポーネント・ナビゲーション・ストア・ViewModel
- src/domain: エンティティ・リポジトリInterface・ユースケース
- src/data: リポジトリ実装・データソース（Notion/OpenBD/MMKV）
- src/infrastructure: カメラ・ネットワーク・セキュリティ・ストレージ等の実装
- src/config: 環境・定数・テーマ

## 実行時アーキテクチャ（Mermaid）
```mermaid
graph TD
  subgraph Presentation
    RNApp[App.tsx<br/>GestureHandlerRootView + SafeAreaProvider]
    RootNav[RootNavigator]
    Screens[各 Screens/Components]
    Stores[Zustand Stores]
    VM[ViewModels]
    Scanner[BarcodeScanner (VisionCamera)]
  end

  subgraph Domain
    UseCases[UseCases]
    RepoIF[Repository Interfaces]
    Entities[Entities]
  end

  subgraph Data
    RepoImpl[Repositories Impl<br/>Notion/BookInfo/Storage]
    DSNotion[NotionAPI DataSource]
    DSOpenBD[OpenBDAPI DataSource]
    DSStorage[MMKV Storage]
  end

  subgraph Infrastructure
    Camera[VisionCamera]
    Network[Network/HTTP]
    MMKV[MMKV Engine]
    Security[Security utils]
  end

  subgraph External
    Notion[Notion API]
    OpenBD[openBD API]
  end

  RNApp --> RootNav --> Screens
  Screens -->|UIイベント| VM --> Stores
  VM --> UseCases --> RepoIF
  RepoIF --> RepoImpl
  RepoImpl --> DSNotion --> Network --> Notion
  RepoImpl --> DSOpenBD --> Network --> OpenBD
  RepoImpl --> DSStorage --> MMKV
  Scanner --> Camera
  Screens -.表示/入力.-> Scanner

  classDef group fill:#0b5cff0d,stroke:#0b5cff,stroke-dasharray:3 3,color:#111
  class Presentation,Domain,Data,Infrastructure,External group
```

## ビルド/開発パス（Mermaid）
```mermaid
flowchart LR
  TS[TypeScript 源コード<br/>@エイリアス] --> Babel[Babel(module-resolver)]
  Babel --> Metro[Metro Bundler]
  Metro --> Hermes[Hermes JS Engine]
  Hermes --> iOS[iOS(.xcworkspace / CocoaPods)]
  Hermes --> Android[Android(Gradle)]
  Test[Jest + @testing-library/react-native] --> TS
```











