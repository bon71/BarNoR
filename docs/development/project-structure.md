# プロジェクト構造・命名規則

## 📁 標準ディレクトリ構造

```text
project-root/
├── docs/                           # プロジェクトドキュメント
│   ├── README.md                   # ドキュメント概要
│   ├── adr/                        # Architecture Decision Records
│   ├── development/                # 開発者向けドキュメント
│   ├── architecture/               # アーキテクチャ関連
│   ├── product/                    # プロダクト要件・PRP
│   ├── operations/                 # 運用・作業指示
│   ├── security/                   # セキュリティ関連
│   └── testing/                    # テスト関連
├── .github/                        # GitHub設定
│   ├── ISSUE_TEMPLATE/
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── workflows/                  # CI/CD設定
├── src/                            # ソースコード
├── tests/                          # テストコード
├── config/                         # 設定ファイル
└── scripts/                        # ビルド・デプロイスクリプト
```

## 📝 命名規則

このプロジェクトは、Clevique開発環境全体の命名規則に従います。詳細は [開発環境の命名規則](../../../../docs/16-naming-conventions.md) を参照してください。

### ファイル名

- **コンポーネントファイル**: `PascalCase.tsx` (例: `Button.tsx`, `ScanScreen.tsx`)
- **その他ファイル**: `camelCase.ts` (例: `useTheme.ts`, `apiClient.ts`)
- **テストファイル**: `*.test.ts` または `*.test.tsx` (例: `Button.test.tsx`)
- **設定ファイル**: `kebab-case` (例: `babel.config.js`, `tsconfig.json`)
- **ドキュメントファイル**: `kebab-case.md` (例: `api-specification.md`)

### ディレクトリ名

- **形式**: `kebab-case/` (例: `react-native-projects/`, `notion-barcode-reader/`)

### コード内の命名

- **コンポーネント/型**: PascalCase (例: `Button`, `ButtonProps`, `ScanViewModel`)
- **変数/関数**: camelCase (例: `scanViewModel`, `createScanViewModel`)
- **グローバル定数**: SCREAMING_SNAKE_CASE (例: `STORAGE_KEY`, `APP_CONFIG`)
- **Boolean変数**: `is`/`has`/`can` 接頭辞 (例: `isLoading`, `hasPermission`)
- **イベントハンドラ**: `handle` 接頭辞 (例: `handlePress`, `handleSubmit`)
- **コールバックProps**: `on` 接頭辞 (例: `onPress`, `onSubmit`)

### Git ブランチ命名

- **形式**: kebab-case (例: `feature/add-barcode-scanner`, `fix/notion-api-error`)
- `main`: 本番環境用
- `develop`: 開発統合用（使用する場合）
- `feature/[short-description]`: 機能開発用
- `fix/[short-description]`: バグ修正用
- `hotfix/[urgent-fix-description]`: 緊急修正用

### コミットメッセージの Type

- `feat`: 新機能追加
- `fix`: バグ修正
- `docs`: ドキュメント更新
- `style`: コードスタイル調整
- `refactor`: リファクタリング
- `test`: テスト追加・修正
- `chore`: その他の変更
- `perf`: パフォーマンス改善

詳細は [開発環境の命名規則](../../../../docs/16-naming-conventions.md) を参照してください。
