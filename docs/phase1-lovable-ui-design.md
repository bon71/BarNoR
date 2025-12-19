# Notion連携バーコードリーダーアプリ - UIプロトタイプ作成

## プロジェクト概要
Notionユーザー向け無料バーコードリーダーアプリのUIデザインプロトタイプを作成します。
最終的にはReact Nativeで実装しますが、まずはWebベースでUIフローとデザインシステムを確立します。

## 技術スタック
- React 18+
- TypeScript 5.x
- Tailwind CSS（モバイルファーストデザイン）
- React Router（画面遷移）

## デザイン要件

### 1. カラーパレット
```typescript
const theme = {
  primary: '#2563eb', // Blue-600（Notion風）
  secondary: '#6b7280', // Gray-500
  success: '#10b981', // Green-500
  error: '#ef4444', // Red-500
  warning: '#f59e0b', // Amber-500
  background: '#ffffff',
  backgroundSecondary: '#f9fafb',
  text: '#111827',
  textSecondary: '#6b7280',
  border: '#e5e7eb'
};
```

### 2. タイポグラフィ
- 見出し: SF Pro Display（iOS標準）をWebフォントで代用
- 本文: SF Pro Text（-apple-system, BlinkMacSystemFontで代用）
- Dynamic Type対応を想定したレスポンシブサイズ

### 3. 主要画面（合計8画面）

#### A. 認証・設定フロー（3画面）
1. **Welcome Screen**
   - アプリ紹介
   - 主要機能の説明（3つのポイント）
   - "Notionと連携" ボタン

2. **Notion Integration Screen**
   - Internal Integration Token入力フォーム
   - セキュア入力（パスワード形式）
   - 接続テストボタン
   - ヘルプリンク（Notion設定ガイド）

3. **Package Setup Screen**
   - パッケージタイプ選択（BookInfo / ProductInfo）
   - データベース選択ドロップダウン
   - プロパティマッピング設定
   - 保存ボタン

#### B. スキャンフロー（2画面）
4. **Scanner Screen**
   - カメラビューポート（プレースホルダー）
   - スキャンターゲット枠
   - トーチ（ライト）トグル
   - スキャン履歴ボタン
   - 設定ボタン

5. **Scan Result Screen**
   - 取得した情報のプレビュー
   - タイトル、著者/商品名、価格、画像
   - 送信先パッケージ選択
   - "Notionに保存" ボタン
   - "再スキャン" ボタン

#### C. 履歴・管理フロー（3画面）
6. **History Screen**
   - スキャン履歴リスト（最大20件）
   - ステータスバッジ（pending/sent/error/unsent）
   - 再送信ボタン
   - 削除ボタン
   - フィルタ（ステータス別）

7. **Settings Screen**
   - Notion設定管理
   - パッケージ一覧
   - サブスクリプション状態
   - アプリ情報（バージョン等）

8. **Subscription Screen**
   - 無料版（2DB）vs 有料版（10DB）の比較
   - 価格表示（$1.99/月）
   - 購入ボタン
   - リストアボタン

### 4. 共通コンポーネント

#### Button
```tsx
<Button 
  variant="primary" | "secondary" | "danger"
  size="sm" | "md" | "lg"
  disabled={boolean}
  loading={boolean}
  onPress={() => {}}
>
  Button Text
</Button>
```

#### Card
```tsx
<Card
  title="Card Title"
  subtitle="Optional subtitle"
  status="pending" | "sent" | "error"
  onPress={() => {}}
>
  <CardContent />
</Card>
```

#### Input
```tsx
<Input
  label="Label"
  placeholder="Placeholder"
  value={value}
  onChange={(value) => {}}
  error="Error message"
  secure={boolean}
  disabled={boolean}
/>
```

#### Badge
```tsx
<Badge
  variant="success" | "error" | "warning" | "info"
  size="sm" | "md"
>
  Badge Text
</Badge>
```

### 5. デザインシステムのルール

#### 間隔（Spacing）
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px

#### ボーダー半径（Border Radius）
- sm: 4px
- md: 8px
- lg: 12px
- xl: 16px

#### シャドウ（Shadow）
```css
shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05)
shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1)
shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1)
```

### 6. インタラクション

#### フィードバック
- ボタンタップ: Scale 0.95 + 透明度80%
- カード選択: Border色変更 + 軽いシャドウ
- ローディング: スピナー + 半透明オーバーレイ

#### アニメーション
- 画面遷移: Slide（300ms ease-out）
- モーダル: Fade + Scale（200ms ease-out）
- リスト項目: Fade In（150ms stagger）

### 7. レスポンシブ対応
- iPhone SE（375px）〜 iPad Pro（1024px）
- Safe Area対応（ノッチ、ホームインジケーター）
- 横画面対応（Scanner Screenのみ）

## 成果物
1. 8つの画面のインタラクティブプロトタイプ
2. 共通コンポーネントライブラリ
3. デザインシステムドキュメント（色、タイポグラフィ、間隔）
4. 画面遷移フロー図

## 制約事項
- iOSデザインガイドラインに準拠
- アクセシビリティ（コントラスト比4.5:1以上）
- タッチターゲット最小44x44px
- モバイルファーストデザイン

## 次のステップ
このプロトタイプをベースに、React Nativeで実装します。
デザイントークンとコンポーネントAPIはそのまま移植可能な設計にしてください。
