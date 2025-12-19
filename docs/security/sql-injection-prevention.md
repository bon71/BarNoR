# SQLインジェクション対策

## 概要

React NativeアプリケーションにおけるSQLインジェクション対策について説明します。

## React NativeアプリでのSQLインジェクションリスク

React Nativeアプリケーションでは、通常のSQLデータベースを直接使用することはありませんが、以下のような場面で注意が必要です：

1. **Notion APIへのリクエスト構築**: クエリパラメータの構築
2. **外部APIへのリクエスト**: URLパラメータやリクエストボディの構築
3. **将来の拡張**: SQLiteなどのローカルデータベースを使用する場合

## Notion APIへのリクエスト構築時のベストプラクティス

### JSON.stringifyの使用

Notion APIへのリクエストは、JSON形式で送信されます。`JSON.stringify`を使用することで、自動的にエスケープ処理が行われます：

```typescript
// ✅ 安全: JSON.stringifyを使用
const requestBody = {
  parent: {
    database_id: databaseId,
  },
  properties: {
    title: {
      title: [{text: {content: title}}],
    },
  },
};
const body = JSON.stringify(requestBody);

// ❌ 危険: 文字列連結でJSONを構築（使用していない）
const body = `{"parent":{"database_id":"${databaseId}"}}`; // NG!
```

### パラメータの型チェック

リクエストボディを構築する際は、必ず型チェックを実施：

```typescript
// ✅ 安全: 型チェックを実施
if (typeof databaseId !== 'string' || databaseId.trim().length === 0) {
  throw new Error('Invalid database ID');
}

// ✅ 安全: UUID形式の検証
const {isValidDatabaseId} = require('@/utils/validation');
if (!isValidDatabaseId(databaseId)) {
  throw new Error('Invalid database ID format');
}
```

## 実装済み対策

### NotionAPIクラスでの対策

`src/data/datasources/NotionAPI.ts`では、以下の対策を実装：

1. **JSON.stringifyの使用**: すべてのリクエストボディは`JSON.stringify`で構築
2. **パラメータの型チェック**: リクエスト前にパラメータの型と形式を検証
3. **Database IDの正規化**: UUID形式の検証と正規化

### 使用例

```typescript
// Database IDの検証と正規化
const {isValidDatabaseId, normalizeDatabaseId} = require('@/utils/validation');
if (!isValidDatabaseId(databaseId)) {
  throw new Error('Invalid database ID format');
}
const normalizedDatabaseId = normalizeDatabaseId(databaseId);

// JSON.stringifyで安全にリクエストボディを構築
const requestBody = {
  parent: {
    database_id: normalizedDatabaseId,
  },
  properties: sanitizedProperties,
};
const body = JSON.stringify(requestBody);
```

## 将来の拡張時の注意事項

SQLiteなどのローカルデータベースを使用する場合は、以下の対策を実施：

1. **プリペアドステートメントの使用**: パラメータ化クエリを使用
2. **入力値のサニタイゼーション**: すべての入力値をサニタイズ
3. **最小権限の原則**: データベースアクセス権限を最小限に

## 参考資料

- [OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [Notion API Security](https://developers.notion.com/reference/security)

