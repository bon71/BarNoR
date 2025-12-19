# テストカバレッジ向上タスク - AI Agent依頼プロンプト集

## 現状
- **全体カバレッジ**: 59.62% (目標: 80%)
- **Phase 1完了**: 失敗テスト修正完了（447テスト全パス）
- **Phase 2進行中**: 重要スクリーンのテスト追加

---

## Agent 1: PropertyMappingScreen テスト作成

### タスク概要
PropertyMappingScreenの包括的なテストファイルを作成し、カバレッジを5.26%から80%以上に向上させる。

### プロンプト
```
PropertyMappingScreenの包括的なテストファイルを作成してください。

## ファイルパス
- **プロダクションコード**: `/Users/bon/dev/NotionBarcodeReader/src/presentation/screens/PropertyMappingScreen.tsx`
- **テストファイル作成先**: `/Users/bon/dev/NotionBarcodeReader/src/__tests__/presentation/screens/PropertyMappingScreen.test.tsx`

## 参考ファイル
- `/Users/bon/dev/NotionBarcodeReader/src/__tests__/presentation/screens/PackageFormScreen.test.tsx`（モック構造の参考）
- `/Users/bon/dev/NotionBarcodeReader/src/__tests__/presentation/screens/HomeScreen.test.tsx`（Zustandセレクター対応の参考）

## テスト要件

### 1. レンダリング
- 初期表示時に正常にレンダリングされる
- タイトル「プロパティマッピング」が表示される
- 全8フィールド（title, author, publisher, price, barcode, isbn, publishedDate, imageUrl）が表示される

### 2. プロパティ読み込み
- 初期表示時に`packageViewModel.fetchDatabaseProperties`が呼ばれる
- ローディング中は`LoadingIndicator`が表示される
- プロパティ取得成功時、プロパティ一覧が表示される
- プロパティ取得失敗時、Alertが表示される

### 3. マッピング選択機能
- 未選択状態では「Notionプロパティを選択」ボタンが表示される
- ボタン押下で選択肢リストが展開される
- プロパティ選択で選択肢リストが閉じる
- 選択済みプロパティ名とタイプが表示される

### 4. マッピング変更・クリア
- 「変更」ボタン押下で選択肢リストが再表示される
- 「解除」ボタン押下でマッピングがクリアされる（任意フィールドのみ）
- 必須フィールド(title, barcode)には「解除」ボタンが表示されない

### 5. バリデーション
- 必須フィールド(title, barcode)未設定時、保存時にAlertが表示される
- Alertメッセージに未設定フィールド名が含まれる
- 必須フィールド横に「*」マークが表示される

### 6. 保存処理
- すべての必須フィールド設定済みの場合、`onSave`コールバックが呼ばれる
- `onSave`にマッピングオブジェクトが渡される
- 保存後、`navigation.goBack()`が呼ばれる

### 7. キャンセル
- キャンセルボタン押下で`navigation.goBack()`が呼ばれる

### 8. 既存マッピングの表示
- route.params.currentMappingが渡された場合、既存マッピングが表示される

## モック要件

### useTheme
```typescript
mockUseTheme.mockReturnValue({
  colors: { /* 標準カラーセット */ },
  spacing: {xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48},
  // ... 他のテーマプロパティ
});
```

### packageViewModel
```typescript
(packageViewModel as any).fetchDatabaseProperties = jest.fn();
```

### Alert
```typescript
jest.spyOn(Alert, 'alert');
```

### コンポーネント
```typescript
jest.mock('@/presentation/components/common', () => ({
  Button: /* TouchableOpacityベースのモック */,
  Card: /* Viewベースのモック */,
  LoadingIndicator: /* テキスト表示のモック */,
}));
```

## 期待テスト数
最低20テスト以上

## 実行確認
テスト作成後、以下を実行して全テストがパスすることを確認：
```bash
npm test -- PropertyMappingScreen.test.tsx
```
```

---

## Agent 2: DatabaseSettingsScreen テスト作成

### タスク概要
DatabaseSettingsScreenの包括的なテストファイルを作成し、カバレッジを0%から80%以上に向上させる。

### プロンプト
```
DatabaseSettingsScreenの包括的なテストファイルを作成してください。

## ファイルパス
- **プロダクションコード**: `/Users/bon/dev/NotionBarcodeReader/src/presentation/screens/DatabaseSettingsScreen.tsx`
- **テストファイル作成先**: `/Users/bon/dev/NotionBarcodeReader/src/__tests__/presentation/screens/DatabaseSettingsScreen.test.tsx`

## 参考ファイル
- `/Users/bon/dev/NotionBarcodeReader/src/__tests__/presentation/screens/SettingsScreen.test.tsx`
- `/Users/bon/dev/NotionBarcodeReader/src/__tests__/presentation/screens/PackageFormScreen.test.tsx`

## 手順

### 1. プロダクションコード確認
まず`DatabaseSettingsScreen.tsx`を読み込んで、機能を理解する：
```typescript
// 期待される機能例
- データベースID入力フィールド
- アクティブパッケージへのDB設定
- 保存・キャンセルボタン
- バリデーション
```

### 2. テスト設計
プロダクションコードの機能に基づいて以下をテスト：

#### レンダリング
- 初期表示時に正常にレンダリングされる
- タイトルが表示される
- 入力フィールドが表示される

#### 入力処理
- データベースID入力ができる
- 入力値が反映される

#### バリデーション
- 空のDB ID保存時にエラーアラートが表示される
- 不正な形式のDB ID時にエラーアラートが表示される（該当する場合）

#### 保存処理
- 正しいDB ID保存時、ViewModelまたはStoreが呼ばれる
- 保存成功時、成功アラートが表示される
- 保存後、前画面に戻る

#### その他
- キャンセルボタン押下で前画面に戻る

### 3. モック設定
```typescript
jest.mock('@/presentation/hooks/useTheme');
jest.mock('@/presentation/stores/usePackageStore'); // 該当する場合
jest.spyOn(Alert, 'alert');
```

## 期待テスト数
最低15テスト以上

## 実行確認
```bash
npm test -- DatabaseSettingsScreen.test.tsx
```
```

---

## Agent 3: PackageViewModel 完全テスト

### タスク概要
PackageViewModelの未カバー機能のテストを追加し、カバレッジを70.89%から90%以上に向上させる。

### プロンプト
```
PackageViewModelの未カバー機能のテストを追加してください。

## ファイルパス
- **プロダクションコード**: `/Users/bon/dev/NotionBarcodeReader/src/presentation/viewmodels/PackageViewModel.ts`
- **既存テストファイル**: `/Users/bon/dev/NotionBarcodeReader/src/__tests__/presentation/viewmodels/PackageViewModel.test.ts`

## 現状
- **現在カバレッジ**: 70.89%
- **未カバー範囲**: Line 179, 302-417

## タスク

### 1. 未カバー範囲の確認
```bash
npm test -- PackageViewModel.test.ts --coverage --collectCoverageFrom='src/presentation/viewmodels/PackageViewModel.ts'
```

プロダクションコードのLine 179, 302-417を確認し、未テストの機能を特定する。

### 2. 追加テスト作成

#### 想定される未カバー機能
- `importPackages`: JSONからパッケージインポート
- `exportPackages`: パッケージをJSON形式でエクスポート
- エラーハンドリング分岐
- エッジケース（空配列、不正データ等）

#### テストケース例
```typescript
describe('importPackages', () => {
  it('正しいJSON形式でパッケージをインポートできる', async () => {
    const json = JSON.stringify([
      {id: 'pkg1', name: 'テスト', databaseId: 'db1', propertyMapping: {}}
    ]);
    const result = await viewModel.importPackages(json);
    expect(result.success).toBe(true);
  });

  it('不正なJSON形式でエラーが返る', async () => {
    const result = await viewModel.importPackages('invalid json');
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });
});

describe('exportPackages', () => {
  it('全パッケージをJSON形式でエクスポートできる', async () => {
    const result = await viewModel.exportPackages();
    expect(result.success).toBe(true);
    expect(result.data).toBeTruthy();
    expect(() => JSON.parse(result.data!)).not.toThrow();
  });
});
```

### 3. 既存テストファイルに追加
既存の`PackageViewModel.test.ts`に新しいdescribeブロックを追加する形で実装。

### 4. カバレッジ確認
```bash
npm test -- PackageViewModel.test.ts --coverage --collectCoverageFrom='src/presentation/viewmodels/PackageViewModel.ts'
```

90%以上を目指す。

## 期待追加テスト数
最低10テスト以上
```

---

## Agent 4: useToastStore テスト追加

### タスク概要
useToastStoreの未カバー機能のテストを追加し、カバレッジを35.29%から80%以上に向上させる。

### プロンプト
```
useToastStoreの包括的なテストを作成してください。

## ファイルパス
- **プロダクションコード**: `/Users/bon/dev/NotionBarcodeReader/src/presentation/stores/useToastStore.ts`
- **テストファイル作成先**: `/Users/bon/dev/NotionBarcodeReader/src/__tests__/presentation/stores/useToastStore.test.ts`

## 参考ファイル
- `/Users/bon/dev/NotionBarcodeReader/src/__tests__/presentation/stores/useScanStore.test.ts`
- `/Users/bon/dev/NotionBarcodeReader/src/__tests__/presentation/stores/usePackageStore.test.ts`

## 現状
- **現在カバレッジ**: 35.29%
- **未カバー範囲**: Line 27-40, 46, 54, 62, 70

## テスト要件

### 1. Zustand Store構造
```typescript
import {renderHook, act} from '@testing-library/react-native';
import {useToastStore, showSuccessToast, showErrorToast, showInfoToast, showWarningToast} from '@/presentation/stores/useToastStore';

describe('useToastStore', () => {
  beforeEach(() => {
    // ストアをリセット
    const {result} = renderHook(() => useToastStore());
    act(() => {
      result.current.hideToast();
    });
  });
});
```

### 2. テストケース

#### 初期状態
- `visible`がfalse
- `message`が空文字列
- `type`が'info'

#### showSuccessToast
- メッセージが設定される
- `type`が'success'になる
- `visible`がtrueになる

#### showErrorToast
- メッセージが設定される
- `type`が'error'になる
- `visible`がtrueになる

#### showWarningToast
- メッセージが設定される
- `type`が'warning'になる
- `visible`がtrueになる

#### showInfoToast
- メッセージが設定される
- `type`が'info'になる
- `visible`がtrueになる

#### hideToast
- `visible`がfalseになる
- メッセージがクリアされる

#### 自動非表示
- トースト表示後、3秒で自動的に非表示になる（setTimeoutのテスト）

### 3. タイマーのモック
```typescript
jest.useFakeTimers();

it('3秒後に自動的に非表示になる', () => {
  const {result} = renderHook(() => useToastStore());

  act(() => {
    showSuccessToast('テスト');
  });

  expect(result.current.visible).toBe(true);

  act(() => {
    jest.advanceTimersByTime(3000);
  });

  expect(result.current.visible).toBe(false);
});
```

## 期待テスト数
最低15テスト以上

## 実行確認
```bash
npm test -- useToastStore.test.ts
```
```

---

## Agent 5: ErrorBoundary テスト追加

### タスク概要
ErrorBoundaryコンポーネントのテストを追加し、カバレッジを53.33%から80%以上に向上させる。

### プロンプト
```
ErrorBoundaryコンポーネントのテストを作成してください。

## ファイルパス
- **プロダクションコード**: `/Users/bon/dev/NotionBarcodeReader/src/presentation/components/common/ErrorBoundary.tsx`
- **テストファイル作成先**: `/Users/bon/dev/NotionBarcodeReader/src/__tests__/presentation/components/common/ErrorBoundary.test.tsx`

## 現状
- **現在カバレッジ**: 53.33%
- **未カバー範囲**: Line 33-43, 52, 65-70

## テスト要件

### 1. ErrorBoundaryのテスト方法
React ErrorBoundaryはclass componentのため、特殊なテスト手法が必要：

```typescript
import React from 'react';
import {render} from '@testing-library/react-native';
import {Text} from 'react-native';
import {ErrorBoundary} from '@/presentation/components/common/ErrorBoundary';

// エラーを投げるコンポーネント
const ThrowError = ({shouldThrow}: {shouldThrow: boolean}) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <Text>正常表示</Text>;
};

describe('ErrorBoundary', () => {
  // console.errorをモック（エラーログを抑制）
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });
});
```

### 2. テストケース

#### 正常動作
- エラーが発生しない場合、子コンポーネントが表示される

#### エラーキャッチ
- 子コンポーネントでエラー発生時、エラー画面が表示される
- エラーメッセージが表示される
- エラースタックが表示される（開発モード）

#### リトライ機能
- 「再試行」ボタンが表示される
- 「再試行」ボタン押下で`componentDidCatch`がリセットされる
- リトライ後、エラーが解消されれば正常表示される

#### エラーログ
- `console.error`が呼ばれる
- エラー情報がログに記録される

### 3. テスト例
```typescript
it('エラー発生時、エラー画面が表示される', () => {
  const {getByText, queryByText} = render(
    <ErrorBoundary>
      <ThrowError shouldThrow={true} />
    </ErrorBoundary>
  );

  expect(queryByText('正常表示')).toBeNull();
  expect(getByText(/エラーが発生しました/)).toBeTruthy();
  expect(console.error).toHaveBeenCalled();
});

it('エラーがない場合、子コンポーネントが表示される', () => {
  const {getByText} = render(
    <ErrorBoundary>
      <ThrowError shouldThrow={false} />
    </ErrorBoundary>
  );

  expect(getByText('正常表示')).toBeTruthy();
});
```

## 期待テスト数
最低10テスト以上

## 実行確認
```bash
npm test -- ErrorBoundary.test.tsx
```
```

---

## Agent 6: Toast関連コンポーネント テスト追加

### タスク概要
ToastコンポーネントとToastContainerコンポーネントのテストを作成し、カバレッジを向上させる。

### プロンプト
```
Toast関連コンポーネントのテストを作成してください。

## ファイルパス
- **Toast**: `/Users/bon/dev/NotionBarcodeReader/src/presentation/components/common/Toast.tsx`
- **ToastContainer**: `/Users/bon/dev/NotionBarcodeReader/src/presentation/components/common/ToastContainer.tsx`
- **テスト作成先**:
  - `/Users/bon/dev/NotionBarcodeReader/src/__tests__/presentation/components/common/Toast.test.tsx`
  - `/Users/bon/dev/NotionBarcodeReader/src/__tests__/presentation/components/common/ToastContainer.test.tsx`

## 現状カバレッジ
- **Toast**: 7.14%
- **ToastContainer**: 28.57%

## Toast.tsx テスト要件

### 1. レンダリング
- `visible=true`の場合、Toastが表示される
- `visible=false`の場合、Toastが非表示になる
- メッセージが正しく表示される

### 2. タイプ別スタイル
- `type='success'`で成功スタイルが適用される
- `type='error'`でエラースタイルが適用される
- `type='warning'`で警告スタイルが適用される
- `type='info'`で情報スタイルが適用される

### 3. アニメーション
- フェードイン・フェードアウトアニメーションが動作する
- Animated.Viewが使用される

### 4. 閉じる機能
- 閉じるボタンが表示される
- 閉じるボタン押下で`onClose`が呼ばれる

### テスト例
```typescript
import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {Toast} from '@/presentation/components/common/Toast';

describe('Toast', () => {
  it('visible=trueの場合、メッセージが表示される', () => {
    const {getByText} = render(
      <Toast visible={true} message="テストメッセージ" type="success" onClose={jest.fn()} />
    );
    expect(getByText('テストメッセージ')).toBeTruthy();
  });

  it('閉じるボタン押下でonCloseが呼ばれる', () => {
    const onClose = jest.fn();
    const {getByTestId} = render(
      <Toast visible={true} message="テスト" type="info" onClose={onClose} />
    );

    fireEvent.press(getByTestId('toast-close-button'));
    expect(onClose).toHaveBeenCalled();
  });
});
```

## ToastContainer.tsx テスト要件

### 1. ストア連携
- `useToastStore`から状態を取得する
- トースト表示時、Toastコンポーネントが表示される
- トースト非表示時、Toastコンポーネントが非表示になる

### 2. 閉じる処理
- Toast閉じる時、`hideToast`が呼ばれる

### テスト例
```typescript
import React from 'react';
import {render} from '@testing-library/react-native';
import {ToastContainer} from '@/presentation/components/common/ToastContainer';
import {useToastStore} from '@/presentation/stores/useToastStore';

jest.mock('@/presentation/stores/useToastStore');

describe('ToastContainer', () => {
  it('トースト表示状態の場合、Toastが表示される', () => {
    (useToastStore as jest.Mock).mockReturnValue({
      visible: true,
      message: 'テスト',
      type: 'success',
      hideToast: jest.fn(),
    });

    const {getByText} = render(<ToastContainer />);
    expect(getByText('テスト')).toBeTruthy();
  });
});
```

## 期待テスト数
- Toast: 最低10テスト
- ToastContainer: 最低5テスト

## 実行確認
```bash
npm test -- Toast.test.tsx
npm test -- ToastContainer.test.tsx
```
```

---

## タスク実行順序（推奨）

### 優先度1（並列実行可能）
1. **Agent 1**: PropertyMappingScreen テスト（カバレッジ向上幅大）
2. **Agent 2**: DatabaseSettingsScreen テスト（カバレッジ向上幅大）

### 優先度2（並列実行可能）
3. **Agent 4**: useToastStore テスト（依存少ない）
5. **Agent 5**: ErrorBoundary テスト（依存少ない）

### 優先度3（並列実行可能）
4. **Agent 3**: PackageViewModel テスト（複雑度高い）
6. **Agent 6**: Toast関連テスト（ToastStoreに依存）

---

## 全タスク完了後の確認

### カバレッジ確認
```bash
npm test -- --coverage --testPathIgnorePatterns=e2e
```

### 期待結果
- **全体カバレッジ**: 80%以上
- **全テスト**: 500テスト以上パス
- **失敗テスト**: 0件

### コミット
```bash
git add -A
git commit -m "test: Phase 2 & 3 完了 - 重要スクリーンとコンポーネントの完全テストカバー"
git push
```

---

## 注意事項

1. **モック実装統一**: すべてのテストで同じモックパターンを使用
2. **Zustandセレクター対応**: `mockImplementation`を使用してセレクター関数をサポート
3. **テストは仕様**: プロダクションコードに合わせてテストを修正しない
4. **防御的プログラミング**: テスト失敗時はプロダクションコードを修正
5. **コミット前確認**: 必ず全テストを実行して全パスを確認

---

## 問題発生時の対処

### テスト失敗時
1. エラーメッセージを確認
2. プロダクションコードの実装を確認
3. テストの期待値が正しいか確認
4. モック実装が正しいか確認

### カバレッジが上がらない時
1. 未カバー行を特定: `--coverage --collectCoverageFrom='対象ファイル'`
2. 未カバー分岐を特定: ブランチカバレッジを確認
3. エッジケースを追加: エラーハンドリング、空データ等

### モック問題
1. Zustandセレクター: `mockImplementation`を使用
2. 非同期処理: `waitFor`を使用
3. タイマー: `jest.useFakeTimers()`を使用
