# Notion連携バーコードリーダーアプリ - React Native実装（TDD）

## プロジェクト概要
Lovable.devで作成したUIプロトタイプをReact Nativeで実装します。
**Test-Driven Development（TDD）** と **Clean Architecture** を徹底し、変更容易性を最大化します。

## 開発原則

### 1. TDD（Red-Green-Refactor）
```
1. Red: テストを書く（失敗することを確認）
2. Green: 最小限の実装でテストをパスさせる
3. Refactor: コードを改善する（テストは壊さない）
```

### 2. Clean Architecture
```
presentation/     ← UI（画面、コンポーネント）
    ↓ 依存
domain/          ← ビジネスロジック（エンティティ、ユースケース）
    ↓ 依存
data/            ← データ層（リポジトリ実装）
    ↓ 依存
infrastructure/  ← 外部依存（カメラ、API、ストレージ）
```

### 3. 依存性の逆転
- 外部依存は必ずインターフェース（Repository、Gateway）で抽象化
- domain層は他のレイヤーに依存しない
- テスト時はモックで外部依存を差し替え可能

## 技術スタック
- **フレームワーク**: React Native 0.72+
- **言語**: TypeScript 5.x（Strict Mode）
- **カメラ**: react-native-vision-camera、vision-camera-code-scanner
- **ストレージ**: react-native-mmkv（暗号化）
- **Notion SDK**: @notionhq/client
- **IAP**: react-native-purchases（RevenueCat）
- **状態管理**: Zustand
- **テスト**: Jest、@testing-library/react-native
- **リンター**: ESLint、Prettier

## プロジェクト構造

```
src/
├── __tests__/              # テストファイル（ユニット、統合）
│   ├── domain/
│   │   ├── usecases/
│   │   │   ├── ScanBarcodeUseCase.test.ts
│   │   │   ├── SaveToNotionUseCase.test.ts
│   │   │   └── ...
│   │   └── entities/
│   │       ├── ScannedItem.test.ts
│   │       └── ...
│   ├── data/
│   │   └── repositories/
│   │       ├── NotionRepository.test.ts
│   │       └── ...
│   └── presentation/
│       └── screens/
│           └── ScannerScreen.test.tsx
│
├── domain/                 # ドメイン層（ビジネスロジック）
│   ├── entities/          # エンティティ
│   │   ├── ScannedItem.ts
│   │   ├── NotionDatabase.ts
│   │   ├── Package.ts
│   │   └── ScanHistory.ts
│   ├── usecases/          # ユースケース
│   │   ├── ScanBarcodeUseCase.ts
│   │   ├── FetchBookInfoUseCase.ts
│   │   ├── FetchProductInfoUseCase.ts
│   │   ├── SaveToNotionUseCase.ts
│   │   ├── ManagePackageUseCase.ts
│   │   └── ManageScanHistoryUseCase.ts
│   └── repositories/      # リポジトリインターフェース
│       ├── INotionRepository.ts
│       ├── IBookInfoRepository.ts
│       ├── IProductInfoRepository.ts
│       ├── IStorageRepository.ts
│       └── IIAPRepository.ts
│
├── data/                   # データ層（リポジトリ実装）
│   ├── repositories/
│   │   ├── NotionRepository.ts
│   │   ├── BookInfoRepository.ts
│   │   ├── ProductInfoRepository.ts
│   │   ├── StorageRepository.ts
│   │   └── IAPRepository.ts
│   ├── datasources/       # データソース
│   │   ├── NotionAPI.ts
│   │   ├── OpenBDAPI.ts
│   │   ├── RakutenAPI.ts
│   │   └── MMKVStorage.ts
│   └── models/            # DTOモデル
│       ├── NotionPageDTO.ts
│       ├── BookInfoDTO.ts
│       └── ProductInfoDTO.ts
│
├── infrastructure/         # インフラ層（外部依存）
│   ├── camera/
│   │   ├── CameraService.ts
│   │   └── BarcodeScanner.ts
│   ├── storage/
│   │   ├── SecureStorage.ts
│   │   └── EncryptionHelper.ts
│   ├── network/
│   │   ├── HttpClient.ts
│   │   └── RateLimiter.ts
│   └── iap/
│       ├── RevenueCatService.ts
│       └── PurchaseManager.ts
│
├── presentation/           # プレゼンテーション層（UI）
│   ├── screens/           # 画面
│   │   ├── WelcomeScreen.tsx
│   │   ├── NotionIntegrationScreen.tsx
│   │   ├── PackageSetupScreen.tsx
│   │   ├── ScannerScreen.tsx
│   │   ├── ScanResultScreen.tsx
│   │   ├── HistoryScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   └── SubscriptionScreen.tsx
│   ├── components/        # 共通コンポーネント
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   └── LoadingOverlay.tsx
│   ├── navigation/        # ナビゲーション
│   │   ├── RootNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   └── MainNavigator.tsx
│   ├── viewmodels/        # ビューモデル（MVVM）
│   │   ├── ScannerViewModel.ts
│   │   ├── PackageSetupViewModel.ts
│   │   └── HistoryViewModel.ts
│   └── stores/            # Zustand Store
│       ├── authStore.ts
│       ├── packageStore.ts
│       └── historyStore.ts
│
└── config/                # 設定ファイル
    ├── constants.ts
    ├── theme.ts
    └── env.ts
```

## 開発ステップ（TDDサイクル）

### Step 1: ドメイン層のテストと実装

#### 1-1. エンティティ（Red → Green → Refactor）

**Red: テストを書く**
```typescript
// src/__tests__/domain/entities/ScannedItem.test.ts
describe('ScannedItem', () => {
  test('should create a valid scanned item', () => {
    const item = new ScannedItem({
      barcode: '4567890123456',
      type: 'book',
      title: 'ドメイン駆動設計',
      author: 'エリック・エヴァンス',
      scannedAt: new Date(),
    });

    expect(item.barcode).toBe('4567890123456');
    expect(item.type).toBe('book');
    expect(item.title).toBe('ドメイン駆動設計');
  });

  test('should throw error for invalid barcode', () => {
    expect(() => {
      new ScannedItem({
        barcode: '123', // 短すぎる
        type: 'book',
        title: 'Test',
      });
    }).toThrow('Invalid barcode format');
  });
});
```

**Green: 最小限の実装**
```typescript
// src/domain/entities/ScannedItem.ts
export class ScannedItem {
  constructor(
    public readonly barcode: string,
    public readonly type: 'book' | 'product',
    public readonly title: string,
    public readonly author?: string,
    public readonly scannedAt: Date = new Date()
  ) {
    if (barcode.length < 8) {
      throw new Error('Invalid barcode format');
    }
  }
}
```

**Refactor: バリデーション分離**
```typescript
// src/domain/entities/ScannedItem.ts
class BarcodeValidator {
  static validate(barcode: string): void {
    if (barcode.length < 8 || barcode.length > 14) {
      throw new Error('Invalid barcode format');
    }
    if (!/^\d+$/.test(barcode)) {
      throw new Error('Barcode must contain only digits');
    }
  }
}

export class ScannedItem {
  constructor(
    public readonly barcode: string,
    public readonly type: 'book' | 'product',
    public readonly title: string,
    public readonly author?: string,
    public readonly scannedAt: Date = new Date()
  ) {
    BarcodeValidator.validate(barcode);
  }
}
```

#### 1-2. ユースケース（Red → Green → Refactor）

**Red: テストを書く**
```typescript
// src/__tests__/domain/usecases/FetchBookInfoUseCase.test.ts
import { FetchBookInfoUseCase } from '@/domain/usecases/FetchBookInfoUseCase';
import { IBookInfoRepository } from '@/domain/repositories/IBookInfoRepository';

describe('FetchBookInfoUseCase', () => {
  let mockRepository: jest.Mocked<IBookInfoRepository>;
  let useCase: FetchBookInfoUseCase;

  beforeEach(() => {
    mockRepository = {
      fetchByISBN: jest.fn(),
    } as any;
    useCase = new FetchBookInfoUseCase(mockRepository);
  });

  test('should fetch book info successfully', async () => {
    const mockBookInfo = {
      isbn: '9784798121963',
      title: 'ドメイン駆動設計',
      author: 'エリック・エヴァンス',
      publisher: '翔泳社',
      coverUrl: 'https://example.com/cover.jpg',
    };

    mockRepository.fetchByISBN.mockResolvedValue(mockBookInfo);

    const result = await useCase.execute('9784798121963');

    expect(result).toEqual(mockBookInfo);
    expect(mockRepository.fetchByISBN).toHaveBeenCalledWith('9784798121963');
  });

  test('should throw error when book not found', async () => {
    mockRepository.fetchByISBN.mockResolvedValue(null);

    await expect(useCase.execute('invalid')).rejects.toThrow('Book not found');
  });
});
```

**Green: 最小限の実装**
```typescript
// src/domain/usecases/FetchBookInfoUseCase.ts
import { IBookInfoRepository } from '@/domain/repositories/IBookInfoRepository';
import { BookInfo } from '@/domain/entities/BookInfo';

export class FetchBookInfoUseCase {
  constructor(private repository: IBookInfoRepository) {}

  async execute(isbn: string): Promise<BookInfo> {
    const bookInfo = await this.repository.fetchByISBN(isbn);
    if (!bookInfo) {
      throw new Error('Book not found');
    }
    return bookInfo;
  }
}
```

### Step 2: データ層のテストと実装

**Red: リポジトリのテスト**
```typescript
// src/__tests__/data/repositories/BookInfoRepository.test.ts
import { BookInfoRepository } from '@/data/repositories/BookInfoRepository';
import { OpenBDAPI } from '@/data/datasources/OpenBDAPI';

jest.mock('@/data/datasources/OpenBDAPI');

describe('BookInfoRepository', () => {
  let repository: BookInfoRepository;
  let mockAPI: jest.Mocked<OpenBDAPI>;

  beforeEach(() => {
    mockAPI = new OpenBDAPI() as jest.Mocked<OpenBDAPI>;
    repository = new BookInfoRepository(mockAPI);
  });

  test('should fetch book info from OpenBD API', async () => {
    const mockAPIResponse = {
      summary: {
        isbn: '9784798121963',
        title: 'ドメイン駆動設計',
        author: 'エリック・エヴァンス',
        publisher: '翔泳社',
        cover: 'https://example.com/cover.jpg',
      },
    };

    mockAPI.get.mockResolvedValue(mockAPIResponse);

    const result = await repository.fetchByISBN('9784798121963');

    expect(result.title).toBe('ドメイン駆動設計');
    expect(mockAPI.get).toHaveBeenCalledWith('/get?isbn=9784798121963');
  });
});
```

**Green: リポジトリの実装**
```typescript
// src/data/repositories/BookInfoRepository.ts
import { IBookInfoRepository } from '@/domain/repositories/IBookInfoRepository';
import { BookInfo } from '@/domain/entities/BookInfo';
import { OpenBDAPI } from '@/data/datasources/OpenBDAPI';

export class BookInfoRepository implements IBookInfoRepository {
  constructor(private api: OpenBDAPI) {}

  async fetchByISBN(isbn: string): Promise<BookInfo | null> {
    try {
      const response = await this.api.get(`/get?isbn=${isbn}`);
      if (!response || !response.summary) {
        return null;
      }

      return new BookInfo(
        response.summary.isbn,
        response.summary.title,
        response.summary.author,
        response.summary.publisher,
        response.summary.cover
      );
    } catch (error) {
      console.error('Failed to fetch book info:', error);
      return null;
    }
  }
}
```

### Step 3: プレゼンテーション層のテストと実装

**Red: 画面コンポーネントのテスト**
```typescript
// src/__tests__/presentation/screens/ScannerScreen.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ScannerScreen } from '@/presentation/screens/ScannerScreen';
import { ScannerViewModel } from '@/presentation/viewmodels/ScannerViewModel';

jest.mock('@/presentation/viewmodels/ScannerViewModel');

describe('ScannerScreen', () => {
  let mockViewModel: jest.Mocked<ScannerViewModel>;

  beforeEach(() => {
    mockViewModel = {
      startScanning: jest.fn(),
      stopScanning: jest.fn(),
      handleBarcodeScanned: jest.fn(),
      isScanning: false,
      scannedItem: null,
    } as any;
  });

  test('should render scanner view', () => {
    const { getByTestId } = render(
      <ScannerScreen viewModel={mockViewModel} />
    );

    expect(getByTestId('scanner-view')).toBeTruthy();
    expect(getByTestId('torch-button')).toBeTruthy();
  });

  test('should start scanning when component mounts', () => {
    render(<ScannerScreen viewModel={mockViewModel} />);

    expect(mockViewModel.startScanning).toHaveBeenCalled();
  });

  test('should handle barcode scan', async () => {
    mockViewModel.handleBarcodeScanned.mockResolvedValue({
      barcode: '4567890123456',
      title: 'Test Book',
      type: 'book',
    });

    const { getByTestId } = render(
      <ScannerScreen viewModel={mockViewModel} />
    );

    // バーコードスキャンをシミュレート
    fireEvent(getByTestId('scanner-view'), 'onBarcodeScanned', {
      nativeEvent: { barcode: '4567890123456' },
    });

    await waitFor(() => {
      expect(mockViewModel.handleBarcodeScanned).toHaveBeenCalledWith(
        '4567890123456'
      );
    });
  });
});
```

### Step 4: 統合テスト

```typescript
// src/__tests__/integration/ScanAndSaveFlow.test.ts
describe('Scan and Save Flow (Integration)', () => {
  test('should scan barcode, fetch book info, and save to Notion', async () => {
    // 1. バーコードをスキャン
    const scanUseCase = new ScanBarcodeUseCase(mockCameraService);
    const barcode = await scanUseCase.execute();
    expect(barcode).toBe('9784798121963');

    // 2. 書籍情報を取得
    const fetchBookUseCase = new FetchBookInfoUseCase(mockBookRepository);
    const bookInfo = await fetchBookUseCase.execute(barcode);
    expect(bookInfo.title).toBe('ドメイン駆動設計');

    // 3. Notionに保存
    const saveUseCase = new SaveToNotionUseCase(mockNotionRepository);
    const result = await saveUseCase.execute(bookInfo, 'package-id-123');
    expect(result.success).toBe(true);
  });
});
```

## 開発順序（優先度順）

### Week 1-2: 基盤構築 + TDD環境整備
1. ✅ プロジェクトセットアップ（React Native CLI）
2. ✅ TypeScript設定（tsconfig.json、strict mode）
3. ✅ Jest設定（@testing-library/react-native）
4. ✅ ディレクトリ構造作成
5. ✅ 共通インターフェース定義

### Week 3-4: ドメイン層（TDD）
1. ✅ エンティティ: ScannedItem、Package、NotionDatabase
2. ✅ ユースケース: ScanBarcode、FetchBookInfo、SaveToNotion
3. ✅ リポジトリインターフェース定義
4. ✅ ユニットテスト（カバレッジ90%以上）

### Week 5-6: データ層（TDD）
1. ✅ OpenBD API実装 + テスト
2. ✅ Rakuten API実装 + テスト
3. ✅ Notion API実装 + テスト
4. ✅ MMKV Storage実装 + テスト
5. ✅ リポジトリ実装 + テスト

### Week 7-8: インフラ層
1. ✅ カメラサービス（react-native-vision-camera）
2. ✅ バーコードスキャナー（vision-camera-code-scanner）
3. ✅ セキュアストレージ（MMKV + 暗号化）
4. ⏳ RevenueCat SDK統合（IAP機能 - MVP後の拡張機能）

### Week 9-10: プレゼンテーション層（TDD）
1. ✅ ビューモデル実装 + テスト
2. ✅ 各画面コンポーネント + テスト
3. ✅ ナビゲーション設定
4. ✅ Zustand Store設定

### Week 11-12: 統合 & テスト
1. ✅ 統合テスト作成
2. ⏳ E2Eテスト（Detox）（Phase3で実施予定）
3. ⏳ パフォーマンステスト（Phase3で実施予定）
4. ✅ バグ修正とリファクタリング

## コーディング規約

### TypeScript
```typescript
// ✅ Good: 明示的な型定義
interface BookInfo {
  isbn: string;
  title: string;
  author: string;
}

function fetchBook(isbn: string): Promise<BookInfo> {
  // ...
}

// ❌ Bad: any型の使用
function fetchBook(isbn: any): Promise<any> {
  // ...
}
```

### テストのベストプラクティス
```typescript
// ✅ Good: Arrange-Act-Assert パターン
test('should calculate total price', () => {
  // Arrange
  const item = { price: 100, quantity: 2 };
  
  // Act
  const total = calculateTotal(item);
  
  // Assert
  expect(total).toBe(200);
});

// ✅ Good: 説明的なテスト名
test('should throw error when ISBN is invalid', () => {
  // ...
});

// ❌ Bad: 曖昧なテスト名
test('test1', () => {
  // ...
});
```

### Clean Architectureの遵守
```typescript
// ✅ Good: 依存性の逆転
class FetchBookInfoUseCase {
  constructor(private repository: IBookInfoRepository) {} // インターフェースに依存
  
  async execute(isbn: string): Promise<BookInfo> {
    return this.repository.fetchByISBN(isbn);
  }
}

// ❌ Bad: 具体実装に依存
class FetchBookInfoUseCase {
  constructor(private repository: BookInfoRepository) {} // 具体クラスに依存
}
```

## 変更容易性のチェックリスト

### 1. 単一責任の原則
- [ ] 各クラスは1つの責務のみを持つ
- [ ] 変更理由は1つだけ

### 2. 依存性の逆転
- [ ] 抽象（インターフェース）に依存している
- [ ] 具体実装はDIコンテナで注入

### 3. テスト可能性
- [ ] 外部依存をモック化できる
- [ ] ユニットテストが独立している

### 4. 拡張性
- [ ] 新機能追加時に既存コードの変更が最小限
- [ ] プラグインパターンで機能追加可能

## 成果物
1. ✅ 完全に動作するReact Nativeアプリ
2. ✅ ユニットテスト（カバレッジ80%以上）
3. ✅ 統合テスト
4. ✅ Clean Architectureドキュメント
5. ✅ API仕様書（Swagger/OpenAPI）

## Phase2 残タスク

### MVP後の拡張機能（低優先度）
以下の機能はMVP（Minimum Viable Product）には必須ではなく、将来的な拡張機能として残しています。

#### 1. RevenueCat SDK統合（IAP機能）
- **説明**: アプリ内課金機能の実装
- **対象ファイル**:
  - `src/infrastructure/iap/RevenueCatService.ts`
  - `src/infrastructure/iap/PurchaseManager.ts`
  - `src/data/repositories/IAPRepository.ts`
  - `src/domain/repositories/IIAPRepository.ts`
  - `src/presentation/screens/SubscriptionScreen.tsx`
- **実装タイミング**: 収益化が必要になった段階
- **依存ライブラリ**: `react-native-purchases`

#### 2. E2Eテスト（Detox）
- **説明**: エンドツーエンドの自動テスト
- **実装タイミング**: Phase3で実施予定
- **依存ライブラリ**: `detox`

#### 3. パフォーマンステスト
- **説明**: アプリのパフォーマンス計測と最適化
- **実装タイミング**: Phase3で実施予定
- **ツール**: React Native Performance Monitor、Flipper

### 実装優先度
- **P0（必須）**: ✅ 全て完了
- **P1（高）**: ✅ 全て完了
- **P2（中）**: ⏳ E2Eテスト、パフォーマンステスト（Phase3で実施）
- **P3（低）**: ⏳ RevenueCat SDK統合（収益化時に実施）

## 次のステップ
**Phase2のMVP機能は全て完了しました。** 次はPhase3（Cursorでの補完的なリファクタリング）に進みます。
