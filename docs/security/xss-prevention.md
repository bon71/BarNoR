# XSS（クロスサイトスクリプティング）対策

## 概要

React NativeアプリケーションにおけるXSS対策について説明します。

## React Nativeの自動XSS対策

React Nativeは、デフォルトでXSS攻撃に対する保護を提供しています：

1. **Textコンポーネント**: 自動的にHTMLエスケープ処理が行われます
2. **JSX式**: 自動的にエスケープ処理が行われます
3. **文字列の直接表示**: 安全に表示されます

### 安全な表示方法

```typescript
// ✅ 安全: Textコンポーネントで直接表示
<Text>{userInput}</Text>

// ✅ 安全: 変数を直接表示
<Text>{title}</Text>

// ❌ 危険: HTMLを直接レンダリング（React Nativeでは基本的に不可能）
// React NativeにはdangerouslySetInnerHTMLのような機能はない
```

## WebView使用時の注意事項

WebViewを使用する場合は、追加の対策が必要です：

### HTMLコンテンツのサニタイゼーション

```typescript
import {escapeHtml} from '@/utils/sanitization';

// WebViewに表示するHTMLコンテンツをサニタイズ
const sanitizedHtml = escapeHtml(userInput);
```

### URL検証

```typescript
import {isValidUrl} from '@/utils/validation';

// リンククリック時のURL検証
if (isValidUrl(url)) {
  Linking.openURL(url);
} else {
  console.error('Invalid URL:', url);
}
```

## 実装済み対策

### ユーティリティ関数

- `src/utils/sanitization.ts`: HTMLエスケープ関数
- `src/utils/validation.ts`: URL検証関数

### 使用例

```typescript
import {escapeHtml} from '@/utils/sanitization';
import {isValidUrl} from '@/utils/validation';

// HTMLエスケープ
const safeHtml = escapeHtml('<script>alert("XSS")</script>');

// URL検証
if (isValidUrl(userProvidedUrl)) {
  // 安全にURLを使用
}
```

## ベストプラクティス

1. **Textコンポーネントを使用**: React NativeのTextコンポーネントは自動的にエスケープ処理を行います
2. **WebView使用時は注意**: HTMLコンテンツを表示する場合は、必ずサニタイゼーションを実施
3. **URL検証**: ユーザー入力のURLを使用する場合は、必ず検証を実施
4. **外部ライブラリの確認**: 使用するライブラリがXSS対策を実装しているか確認

## 参考資料

- [React Native Security](https://reactnative.dev/docs/security)
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)

