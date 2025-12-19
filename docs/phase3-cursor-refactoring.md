# Notion連携バーコードリーダーアプリ - 補完実装とリファクタリング

## 役割
ClaudeCodeで実装されたコードベースに対して、以下の補完的な作業を行います。

## 作業内容

### 1. コード品質の向上

#### リファクタリング
- 重複コードの削除（DRY原則）
- 複雑な関数の分割（単一責任）
- マジックナンバーの定数化
- 型安全性の向上（any型の撲滅）

#### パフォーマンス最適化
```typescript
// Before: 非効率な再レンダリング
const ScannerScreen = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedItem, setScannedItem] = useState(null);
  
  return <Camera onBarcode={(code) => fetchBookInfo(code)} />;
};

// After: useMemo、useCallback でパフォーマンス最適化
const ScannerScreen = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedItem, setScannedItem] = useState(null);
  
  const handleBarcode = useCallback(async (code: string) => {
    const info = await fetchBookInfo(code);
    setScannedItem(info);
  }, []);
  
  const cameraProps = useMemo(() => ({
    onBarcode: handleBarcode,
  }), [handleBarcode]);
  
  return <Camera {...cameraProps} />;
};
```

### 2. エラーハンドリングの強化

#### エラーバウンダリーの実装
```typescript
// src/presentation/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback: (error: Error) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    // ログサービスに送信（将来的に）
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback(this.state.error!);
    }

    return this.props.children;
  }
}
```

#### グローバルエラーハンドラー
```typescript
// src/infrastructure/error/GlobalErrorHandler.ts
export class GlobalErrorHandler {
  static initialize() {
    // キャッチされなかったPromiseエラー
    global.onunhandledrejection = (event) => {
      console.error('Unhandled Promise Rejection:', event.reason);
      // エラーレポーティングサービスへ送信
    };

    // JavaScriptエラー
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      console.error('Global Error:', error, 'isFatal:', isFatal);
      // エラーレポーティングサービスへ送信
    });
  }
}
```

### 3. アクセシビリティの改善

```typescript
// Before: アクセシビリティ未対応
<TouchableOpacity onPress={handlePress}>
  <Text>スキャン開始</Text>
</TouchableOpacity>

// After: アクセシビリティ対応
<TouchableOpacity 
  onPress={handlePress}
  accessible={true}
  accessibilityLabel="スキャン開始ボタン"
  accessibilityHint="タップするとバーコードスキャンを開始します"
  accessibilityRole="button"
>
  <Text>スキャン開始</Text>
</TouchableOpacity>
```

### 4. ログとモニタリング

```typescript
// src/infrastructure/logging/Logger.ts
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export class Logger {
  private static instance: Logger;
  private level: LogLevel = __DEV__ ? LogLevel.DEBUG : LogLevel.INFO;

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  debug(message: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, error?: Error, ...args: any[]) {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(`[ERROR] ${message}`, error, ...args);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }
}
```

### 5. UI/UXの微調整

#### ローディング状態の改善
```typescript
// Before: シンプルなローディング
{isLoading && <ActivityIndicator />}

// After: スケルトンスクリーン
{isLoading ? (
  <SkeletonScreen>
    <SkeletonItem width="100%" height={60} />
    <SkeletonItem width="80%" height={20} style={{ marginTop: 10 }} />
    <SkeletonItem width="60%" height={20} style={{ marginTop: 5 }} />
  </SkeletonScreen>
) : (
  <ContentView />
)}
```

#### アニメーションの追加
```typescript
// src/presentation/animations/FadeIn.tsx
import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

export const useFadeIn = (duration = 300) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      useNativeDriver: true,
    }).start();
  }, []);

  return opacity;
};

// 使用例
const ScanResultScreen = () => {
  const fadeAnim = useFadeIn();
  
  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <BookInfoCard />
    </Animated.View>
  );
};
```

### 6. テストカバレッジの拡充

#### スナップショットテスト
```typescript
// src/__tests__/presentation/components/Button.test.tsx
import React from 'react';
import renderer from 'react-test-renderer';
import { Button } from '@/presentation/components/Button';

describe('Button Snapshot Tests', () => {
  test('should match snapshot for primary button', () => {
    const tree = renderer
      .create(<Button variant="primary">Click Me</Button>)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  test('should match snapshot for disabled button', () => {
    const tree = renderer
      .create(<Button disabled>Click Me</Button>)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
```

### 7. ドキュメントの整備

#### JSDocコメントの追加
```typescript
/**
 * 書籍情報を取得するユースケース
 * @class FetchBookInfoUseCase
 * @description OpenBD APIを使用して、ISBNから書籍情報を取得します
 */
export class FetchBookInfoUseCase {
  constructor(private repository: IBookInfoRepository) {}

  /**
   * ISBNから書籍情報を取得します
   * @param {string} isbn - 13桁のISBN番号
   * @returns {Promise<BookInfo>} 書籍情報
   * @throws {BookNotFoundError} 書籍が見つからない場合
   * @throws {NetworkError} ネットワークエラーの場合
   * 
   * @example
   * const bookInfo = await useCase.execute('9784798121963');
   * console.log(bookInfo.title); // "ドメイン駆動設計"
   */
  async execute(isbn: string): Promise<BookInfo> {
    // ...
  }
}
```

#### README更新
```markdown
# 開発ガイド

## 新機能の追加方法

1. **ドメイン層から実装**
   - エンティティを定義
   - ユースケースを実装
   - テストを書く

2. **データ層を実装**
   - リポジトリインターフェースを実装
   - APIクライアントを作成
   - テストを書く

3. **プレゼンテーション層を実装**
   - ビューモデルを作成
   - 画面コンポーネントを実装
   - テストを書く

## トラブルシューティング

### カメラが起動しない
- iOS設定でカメラ権限を確認
- `Info.plist`に`NSCameraUsageDescription`があるか確認

### Notion連携が失敗する
- Integration Tokenが正しいか確認
- データベースが共有されているか確認
```

## 重点作業エリア

### 優先度 High
1. ✅ パフォーマンス最適化（useMemo、useCallback）
2. ✅ エラーハンドリング強化
3. ✅ アクセシビリティ改善
4. ✅ ローディング状態の改善

### 優先度 Medium
1. ✅ ログとモニタリング
2. ✅ アニメーション追加
3. ✅ スナップショットテスト

### 優先度 Low
1. ✅ JSDocコメント追加
2. ✅ README更新
3. ✅ 細かいUI調整

## 成果物
1. ✅ リファクタリング完了したコードベース
2. ✅ テストカバレッジ85%以上
3. ✅ アクセシビリティスコア100%
4. ✅ 更新されたドキュメント

## 次のステップ
すべての補完作業が完了したら、ClaudeCodeで最終レビューを実施します。
