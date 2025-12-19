# トラブルシューティング・エラーハンドリング

## よくある問題と解決策

### ClaudeCode出力品質問題

**症状**: 期待通りのコードが生成されない

**解決策**:
- 段階的タスク分割（1つずつ実装）
- 参考実装・サンプルコードの提供
- 具体的な期待結果の明示
- レビュー・フィードバックサイクル

### 技術的問題・バグ

**症状**: 実装したコードが動作しない

**解決策**:
- エラーログ・スタックトレースの確認
- 段階的デバッグ・動作確認（playwright使用）
- ライブラリドキュメント・事例の確認
- 環境・設定の再確認・初期化

## 環境設定関連

### ポート競合

すでにポートが使用されている場合（例: 3000番や8000番など）、起動に失敗することがあります。その場合は、別のポート番号をインクリメントして使用してください（例: 3000番が使用されていたら3001番を使う）

## デバッグ・ログ管理のベストプラクティス

```typescript
// デバッグログの標準化例
const debug = {
  info: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[INFO] ${message}`, data);
    }
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data);
  },
  error: (message: string, error?: Error) => {
    console.error(`[ERROR] ${message}`, error);
  }
};
```
