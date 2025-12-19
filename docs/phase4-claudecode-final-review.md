# Notion連携バーコードリーダーアプリ - 最終レビューと統合テスト

## 役割
Cursorでの補完実装が完了したコードベースに対して、最終的なコードレビューと統合テストを実施します。

## レビュー観点

### 1. アーキテクチャの整合性

#### Clean Architectureの遵守
- [ ] 依存関係が正しい方向（外側→内側）になっているか
- [ ] domain層が他のレイヤーに依存していないか
- [ ] インターフェースで抽象化されているか

**チェック方法:**
```bash
# 依存関係を視覚化
npx madge --circular --extensions ts,tsx src/

# domain層が他のレイヤーに依存していないことを確認
npx madge --orphans --extensions ts,tsx src/domain/
```

#### レイヤー間の境界
```typescript
// ✅ Good: 依存性の逆転
// domain/usecases/FetchBookInfoUseCase.ts
export class FetchBookInfoUseCase {
  constructor(private repository: IBookInfoRepository) {} // インターフェース
}

// ❌ Bad: 具体実装に依存
export class FetchBookInfoUseCase {
  constructor(private api: OpenBDAPI) {} // 具体クラス
}
```

### 2. テストカバレッジ

#### カバレッジ目標
- 全体: 80%以上
- domain層（ユースケース）: 90%以上
- data層（リポジトリ）: 85%以上
- presentation層: 70%以上

**チェック方法:**
```bash
# テスト実行 + カバレッジレポート
npm run test -- --coverage

# カバレッジが基準を満たしているか確認
cat coverage/coverage-summary.json | jq '.total.lines.pct'
```

#### カバレッジ不足の対応
```typescript
// 未テストのエッジケースを追加
test('should handle empty response from API', async () => {
  mockAPI.get.mockResolvedValue(null);
  
  const result = await repository.fetchByISBN('invalid');
  
  expect(result).toBeNull();
});
```

### 3. コード品質

#### TypeScript Strict Mode
- [ ] `any`型が使われていないか
- [ ] `non-null assertion (!)`が乱用されていないか
- [ ] 型推論が効いているか

**チェック方法:**
```bash
# TypeScriptエラーチェック
npx tsc --noEmit

# ESLintエラーチェック
npx eslint src/ --ext .ts,.tsx
```

#### コードの複雑度
```bash
# 循環的複雑度をチェック
npx complexity-report src/

# 複雑度が10を超える関数をリファクタリング
```

### 4. パフォーマンス

#### バンドルサイズ
```bash
# バンドルサイズを確認
npx react-native-bundle-visualizer

# 大きすぎる依存関係を特定
npx npm ls --depth=0
```

#### メモリリーク
```typescript
// useEffectのクリーンアップを確認
useEffect(() => {
  const subscription = eventEmitter.subscribe(handleEvent);
  
  return () => {
    subscription.unsubscribe(); // ✅ クリーンアップ必須
  };
}, []);
```

### 5. セキュリティ

#### 機密情報の漏洩チェック
```bash
# 環境変数がコードに直接書かれていないか
grep -r "sk-" src/  # Notion Integration Token
grep -r "apiKey" src/

# Git履歴に機密情報がないか
git secrets --scan-history
```

#### 依存関係の脆弱性
```bash
# 既知の脆弱性をチェック
npm audit

# 脆弱性を自動修正
npm audit fix
```

### 6. ドキュメント

#### 必須ドキュメント
- [ ] README.md（セットアップ、ビルド、テスト方法）
- [ ] ARCHITECTURE.md（アーキテクチャ設計）
- [ ] API.md（API仕様）
- [ ] CHANGELOG.md（変更履歴）

#### コメントの品質
```typescript
// ✅ Good: Whyを説明
// Notionのレート制限（3req/s）を守るため、リクエスト間隔を調整
await sleep(350);

// ❌ Bad: Whatを説明（コードを読めば分かる）
// sleepを実行
await sleep(350);
```

## 統合テストシナリオ

### シナリオ1: 書籍スキャン → Notion保存
```typescript
describe('Book Scan to Notion Flow', () => {
  test('should scan book, fetch info, and save to Notion', async () => {
    // 1. カメラ権限を取得
    await grantCameraPermission();

    // 2. スキャナー画面を開く
    const { getByTestId } = render(<ScannerScreen />);
    expect(getByTestId('scanner-view')).toBeTruthy();

    // 3. バーコードをスキャン
    fireEvent(getByTestId('scanner-view'), 'onBarcodeScanned', {
      nativeEvent: { barcode: '9784798121963' },
    });

    // 4. 書籍情報が表示される
    await waitFor(() => {
      expect(getByTestId('scan-result')).toBeTruthy();
      expect(getByTestId('book-title')).toHaveTextContent('ドメイン駆動設計');
    });

    // 5. Notionに保存
    fireEvent.press(getByTestId('save-button'));

    await waitFor(() => {
      expect(getByTestId('success-message')).toBeTruthy();
    });

    // 6. 履歴に追加されている
    const history = await getScanHistory();
    expect(history).toHaveLength(1);
    expect(history[0].status).toBe('sent');
  });
});
```

### シナリオ2: オフライン → オンライン復帰
```typescript
describe('Offline to Online Recovery', () => {
  test('should retry failed requests when network recovers', async () => {
    // 1. オフライン状態でスキャン
    await setNetworkState('offline');
    await scanBarcode('9784798121963');

    // 履歴に"unsent"として保存される
    let history = await getScanHistory();
    expect(history[0].status).toBe('unsent');

    // 2. オンラインに復帰
    await setNetworkState('online');

    // 3. バックグラウンドで自動再送
    await waitFor(() => {
      const updatedHistory = getScanHistory();
      expect(updatedHistory[0].status).toBe('sent');
    }, { timeout: 5000 });
  });
});
```

### シナリオ3: IAP購入フロー
```typescript
describe('In-App Purchase Flow', () => {
  test('should upgrade from free to premium', async () => {
    // 1. 無料版（2DB制限）
    const packages = await getPackages();
    expect(packages).toHaveLength(2);

    // 2. 3つ目のDBを作成しようとするとエラー
    await expect(createPackage('Package 3')).rejects.toThrow(
      'Config limit exceeded'
    );

    // 3. プレミアムを購入
    await purchaseSubscription('premium');

    // 4. 10DBまで作成可能
    await createPackage('Package 3');
    const updatedPackages = await getPackages();
    expect(updatedPackages).toHaveLength(3);
  });
});
```

## パフォーマンステスト

### 起動時間
```typescript
test('should launch within 3 seconds (cold start)', async () => {
  const startTime = Date.now();
  
  await launchApp();
  
  const endTime = Date.now();
  expect(endTime - startTime).toBeLessThan(3000);
});
```

### スキャン応答時間
```typescript
test('should display scan result within 2 seconds', async () => {
  const startTime = Date.now();
  
  await scanBarcode('9784798121963');
  
  await waitFor(() => {
    const endTime = Date.now();
    expect(getByTestId('scan-result')).toBeTruthy();
    expect(endTime - startTime).toBeLessThan(2000);
  });
});
```

## 最終チェックリスト

### コード品質
- [ ] TypeScriptエラー0
- [ ] ESLintエラー0
- [ ] テストカバレッジ80%以上
- [ ] 循環的複雑度 <10

### アーキテクチャ
- [ ] Clean Architecture遵守
- [ ] 依存関係の方向が正しい
- [ ] レイヤー間の境界が明確

### 機能
- [ ] 全機能が動作する
- [ ] エラーハンドリングが適切
- [ ] オフライン対応が機能する
- [ ] IAP購入フローが正常

### パフォーマンス
- [ ] 起動時間 <3秒
- [ ] スキャン応答 <2秒
- [ ] メモリリークなし
- [ ] バンドルサイズ <50MB

### セキュリティ
- [ ] 機密情報の漏洩なし
- [ ] 依存関係に脆弱性なし
- [ ] HTTPS通信のみ

### ドキュメント
- [ ] README完備
- [ ] ARCHITECTURE.md完備
- [ ] API仕様完備
- [ ] コメントが適切

## 承認基準

すべてのチェックリストが✅になったら、以下を実施します：

1. **TestFlightビルド作成**
```bash
cd ios
bundle exec fastlane beta
```

2. **ベータテスター招待**
   - 内部テスター: 5名
   - 外部テスター: 10名

3. **1週間のベータテスト**
   - クラッシュ率 <1%
   - スキャン成功率 >90%
   - ユーザーフィードバック収集

4. **App Store提出**

## 成果物
1. ✅ 完全にテストされたアプリ
2. ✅ TestFlightビルド
3. ✅ 最終レビューレポート
4. ✅ リリースノート

---

**プロジェクト完了！🎉**
