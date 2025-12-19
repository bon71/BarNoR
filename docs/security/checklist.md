# セキュリティチェックリスト

## コードセキュリティ（必須）

- [x] 入力値検証・サニタイゼーション実装（`src/utils/sanitization.ts`, `src/utils/validation.ts`）
- [x] SQL インジェクション対策（`docs/security/sql-injection-prevention.md`, Notion APIリクエスト構築の安全性確保）
- [x] XSS（クロスサイトスクリプティング）対策（`docs/security/xss-prevention.md`, `src/utils/xssPrevention.ts`）
- [x] CSRF（クロスサイトリクエストフォージェリ）対策（`src/utils/csrfProtection.ts`, APIクライアントへの統合）
- [x] 認証・認可の適切な実装（トークン検証強化、403エラー処理追加）

## データ保護（必須）

- [x] 個人情報・機密データの暗号化（MMKVストレージで暗号化）
- [x] APIキー・シークレットの適切な管理（MMKVストレージに暗号化して保存）
- [x] データベースアクセス制御（Notion APIでの認可チェック実装）
- [x] ログ・バックアップのセキュリティ（ログマスキング、環境別ログレベル設定）
- [x] GDPR・プライバシー規制の準拠（全データ削除機能実装）

## 機密情報管理

### 開発環境での管理方法

- `.env` ファイル使用（.gitignore に追加）
- 環境変数での設定
- ローカル設定ファイル（暗号化）

### 禁止事項

- コードへの直接埋め込み
- Git履歴への含有
- 平文での保存・送信
- 不適切な共有・公開

## サプライチェーン攻撃対策（必須）

### npm依存関係のセキュリティ

- [x] `package-lock.json` をコミット（依存関係の固定）
- [x] `.npmrc` ファイルでnpm設定を明示的に設定
- [x] CI/CDで `npm ci` を使用（package-lock.jsonを厳密に使用）
- [x] CI/CDで `npm audit` を実行（moderate以上の脆弱性でビルド失敗）
- [x] Dependabotを有効化（依存関係の自動更新）
- [x] GitHub Dependabot Security Updatesを有効化（セキュリティアップデートの自動PR）

### 実装済み対策

1. **`.npmrc` 設定**
   - `audit=true`: セキュリティ監査を有効化
   - `audit-level=moderate`: moderate以上の脆弱性を検出
   - `package-lock=true`: package-lock.jsonの使用を強制

2. **CI/CD設定**
   - `.github/workflows/ci.yml` の `security` ジョブで `npm audit` を実行
   - moderate以上の脆弱性がある場合はビルドを失敗させる（`continue-on-error` を削除）

3. **Dependabot設定**
   - `.github/dependabot.yml` で週次で依存関係をチェック
   - GitHub Settings > Security > Dependabot > Dependabot security updates を有効化推奨

### 確認方法

```bash
# ローカルで脆弱性をチェック
npm audit --audit-level=moderate

# package-lock.jsonの整合性を確認
npm ci
```

## アプリケーションセキュリティ（必須）

### 機密情報のログ出力対策

- [x] ログマスキング機能を実装（`src/utils/logMasking.ts`）
- [x] 機密情報（APIキー、トークン）をログに出力する際にマスク処理を実装
- [x] 本番環境ではログレベルを`ERROR`のみに設定（`src/infrastructure/logging/Logger.ts`で実装）

### iOS App Transport Security設定

- [x] Info.plistにセキュリティ設定のコメントを追加
- [x] 本番環境では`NSAllowsArbitraryLoads`を`false`に設定（`scripts/configure-ats.sh`で自動切り替え）
- [x] 必要なAPIドメインのみを`NSExceptionDomains`で許可

### 暗号化キー管理

- [x] 本番環境では`react-native-keychain`を使用してキーチェーンに保存（`src/infrastructure/security/EncryptionKeyManager.ts`）
- [x] 固定キーの使用を避け、デバイス固有のキーを生成（`react-native-device-info`を使用）
- [x] 開発環境では固定キーを使用（パフォーマンスとデバッグのため）

### 環境変数管理

- [x] `.env.example`ファイルを作成（テンプレート）
- [x] `.env`ファイルは`.gitignore`に追加済み
- [x] 環境変数のバリデーションを実装（`src/config/envValidator.ts`）

### 証明書ピニング（オプション・将来の拡張）

- [x] HTTPS通信の証明書ピニングの骨組み実装（`react-native-ssl-pinning`を使用、`src/utils/certificatePinning.ts`）
- [x] APIクライアントへの統合準備（`src/utils/apiClient.ts`で本番環境のみ有効化する準備）
- [x] **判断**: 現時点では実装を見送る（詳細は`docs/security/certificate-pinning-decision.md`を参照）

#### 実装判断の理由

##### 現時点での判断

実装を見送る

##### 理由

1. **コスト対効果が低い**: 個人利用アプリでは、証明書ピニングのメリットが限定的。既存のセキュリティ対策（ATS、HTTPS強制）で基本的な保護は確保されている。

2. **リスクが低い**: 個人利用アプリで大規模な攻撃対象になりにくく、Notion Tokenは端末内に暗号化保存されている。

3. **メンテナンス負担**: 証明書更新時の緊急対応が必要で、小規模プロジェクトでは継続的な監視が困難。

**実装を検討すべき条件:**

- ユーザー規模の拡大（企業利用や大規模ユーザーベースへの展開）
- セキュリティ要件の強化（金融機関や医療機関での利用）
- セキュリティ監査の要求（外部監査で証明書ピニングが要求される）
- 競合アプリとの差別化（セキュリティを主要な訴求ポイントとする場合）

**現在の状態:**

- `src/utils/certificatePinning.ts`は維持（将来の実装に備える）
- 証明書ハッシュは設定しない（空の配列のまま）
- 本番環境でも証明書ピニングは無効化されたまま（証明書ハッシュが設定されていないため）

## ファイル作成時の注意

ファイル作成時に、そのファイルがGithubに挙げられるべきではないと判断した場合には、**必ず .gitignore に指定すること**
