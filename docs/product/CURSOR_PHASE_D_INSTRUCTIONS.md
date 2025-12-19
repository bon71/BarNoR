# Cursor実装指示 - Phase D: テスト更新

**Phase**: D（テスト更新）
**所要時間**: 2-3時間
**目的**: 削除した機能のテストを削除し、変更した機能のテストを更新し、新機能のテストを追加する

**前提条件**:
- Phase A完了（不要機能削除済み）
- Phase B完了（SimplifiedConfig実装済み）
- Phase C完了（スキャンフロー簡素化済み）

---

## 📋 タスク概要

テスト関連の作業を以下の3つに分けて実施します：

1. **削除**: 不要になったテストファイルの削除
2. **更新**: 既存テストの修正（Package → SimplifiedConfig対応）
3. **追加**: 新機能のテスト追加（SimplifiedConfig、SettingsScreenSimple）

---

## 🎯 実装手順

### ステップ1: 不要テストファイルの削除

以下のテストファイルを**完全削除**してください：

#### 1.1 削除対象ファイル一覧

```bash
# 画面コンポーネントのテスト（7ファイル）
src/__tests__/presentation/screens/HomeScreen.test.tsx
src/__tests__/presentation/screens/HistoryScreen.test.tsx
src/__tests__/presentation/screens/PackageManagementScreen.test.tsx
src/__tests__/presentation/screens/PackageFormScreen.test.tsx
src/__tests__/presentation/screens/PropertyMappingScreen.test.tsx
src/__tests__/presentation/screens/PackageListScreen.test.tsx
src/__tests__/presentation/screens/DatabaseSettingsScreen.test.tsx

# ViewModelのテスト（1ファイル）
src/__tests__/presentation/viewmodels/PackageViewModel.test.ts

# Storeのテスト（1ファイル）
src/__tests__/presentation/stores/usePackageStore.test.ts

# E2Eテスト（1ファイル）
e2e/app.test.ts
```

#### 1.2 削除コマンド

```bash
# 画面テスト削除
rm src/__tests__/presentation/screens/HomeScreen.test.tsx
rm src/__tests__/presentation/screens/HistoryScreen.test.tsx
rm src/__tests__/presentation/screens/PackageManagementScreen.test.tsx
rm src/__tests__/presentation/screens/PackageFormScreen.test.tsx
rm src/__tests__/presentation/screens/PropertyMappingScreen.test.tsx
rm src/__tests__/presentation/screens/PackageListScreen.test.tsx
rm src/__tests__/presentation/screens/DatabaseSettingsScreen.test.tsx

# ViewModel/Storeテスト削除
rm src/__tests__/presentation/viewmodels/PackageViewModel.test.ts
rm src/__tests__/presentation/stores/usePackageStore.test.ts

# E2Eテスト削除
rm e2e/app.test.ts
```

#### 1.3 削除確認

```bash
# 削除されたことを確認
ls src/__tests__/presentation/screens/PackageFormScreen.test.tsx 2>/dev/null && echo "❌ 削除されていません" || echo "✅ 削除済み"
ls src/__tests__/presentation/viewmodels/PackageViewModel.test.ts 2>/dev/null && echo "❌ 削除されていません" || echo "✅ 削除済み"
ls src/__tests__/presentation/stores/usePackageStore.test.ts 2>/dev/null && echo "❌ 削除されていません" || echo "✅ 削除済み"
ls e2e/app.test.ts 2>/dev/null && echo "❌ 削除されていません" || echo "✅ 削除済み"
```

---

### ステップ2: 既存テストの更新

#### 2.1 ScanScreen.test.tsx の更新

**ファイル**: `src/__tests__/presentation/screens/ScanScreen.test.tsx`

**変更内容**:

##### import更新

**削除**:
```typescript
// 削除
import {usePackageStore} from '@/presentation/stores/usePackageStore';
```

**追加**:
```typescript
// 追加
import {useConfigStore} from '@/presentation/stores/useConfigStore';
```

##### モック更新

**削除**:
```typescript
// 削除
jest.mock('@/presentation/stores/usePackageStore');
const mockUsePackageStore = usePackageStore as jest.MockedFunction<typeof usePackageStore>;
```

**追加**:
```typescript
// 追加
jest.mock('@/presentation/stores/useConfigStore');
const mockUseConfigStore = useConfigStore as jest.MockedFunction<typeof useConfigStore>;
```

##### テストケース更新

**削除するテスト**:
```typescript
// 削除
describe('パッケージ選択', () => {
  it('パッケージ選択ボタンが表示される', () => {
    // ...
  });

  it('パッケージ選択モーダルが開く', () => {
    // ...
  });
});
```

**追加するテスト**:
```typescript
describe('設定チェック', () => {
  it('設定未完了時にエラーメッセージが表示される', () => {
    // 設定なしでレンダリング
    mockUseConfigStore.mockReturnValue({
      config: null,
      setConfig: jest.fn(),
      clearConfig: jest.fn(),
    });

    const {getByText} = render(<ScanScreen />);

    expect(getByText(/設定が完了していません/)).toBeTruthy();
    expect(getByText('設定画面へ')).toBeTruthy();
  });

  it('設定完了時にエラーメッセージが表示されない', () => {
    // 設定ありでレンダリング
    mockUseConfigStore.mockReturnValue({
      config: {
        notionToken: 'secret_test123',
        databaseId: '12345678-1234-1234-1234-123456789012',
        propertyMapping: {
          title: 'タイトル',
          author: '著者名',
          isbn: 'ISBN',
          imageUrl: '書影',
        },
      },
      setConfig: jest.fn(),
      clearConfig: jest.fn(),
    });

    const {queryByText} = render(<ScanScreen />);

    expect(queryByText(/設定が完了していません/)).toBeNull();
  });

  it('設定画面へボタンタップで設定画面に遷移', () => {
    mockUseConfigStore.mockReturnValue({
      config: null,
      setConfig: jest.fn(),
      clearConfig: jest.fn(),
    });

    const mockNavigate = jest.fn();
    (useNavigation as jest.Mock).mockReturnValue({
      navigate: mockNavigate,
    });

    const {getByText} = render(<ScanScreen />);

    fireEvent.press(getByText('設定画面へ'));

    expect(mockNavigate).toHaveBeenCalledWith('Settings');
  });
});

describe('スキャン無効化', () => {
  it('設定未完了時はスキャンが無効化される', () => {
    mockUseConfigStore.mockReturnValue({
      config: null,
      setConfig: jest.fn(),
      clearConfig: jest.fn(),
    });

    const {UNSAFE_getByType} = render(<ScanScreen />);
    const scanner = UNSAFE_getByType(BarcodeScanner);

    expect(scanner.props.enabled).toBe(false);
  });

  it('設定完了時はスキャンが有効化される', () => {
    mockUseConfigStore.mockReturnValue({
      config: {
        notionToken: 'secret_test123',
        databaseId: '12345678-1234-1234-1234-123456789012',
        propertyMapping: {
          title: 'タイトル',
          author: '著者名',
          isbn: 'ISBN',
          imageUrl: '書影',
        },
      },
      setConfig: jest.fn(),
      clearConfig: jest.fn(),
    });

    const {UNSAFE_getByType} = render(<ScanScreen />);
    const scanner = UNSAFE_getByType(BarcodeScanner);

    expect(scanner.props.enabled).toBe(true);
  });
});
```

---

#### 2.2 ScanResultScreen.test.tsx の更新

**ファイル**: `src/__tests__/presentation/screens/ScanResultScreen.test.tsx`

**変更内容**:

##### import更新

**削除**:
```typescript
// 削除
import {usePackageStore} from '@/presentation/stores/usePackageStore';
```

**追加**:
```typescript
// 追加
import {useConfigStore} from '@/presentation/stores/useConfigStore';
```

##### モック更新

**削除**:
```typescript
// 削除
jest.mock('@/presentation/stores/usePackageStore');
const mockUsePackageStore = usePackageStore as jest.MockedFunction<typeof usePackageStore>;
```

**追加**:
```typescript
// 追加
jest.mock('@/presentation/stores/useConfigStore');
const mockUseConfigStore = useConfigStore as jest.MockedFunction<typeof useConfigStore>;
```

##### テストケース更新

**追加するテスト**:
```typescript
describe('設定チェック', () => {
  it('設定未完了時にエラーメッセージが表示される', () => {
    mockUseConfigStore.mockReturnValue({
      config: null,
      setConfig: jest.fn(),
      clearConfig: jest.fn(),
    });

    const {getByText} = render(
      <ScanResultScreen route={mockRoute} navigation={mockNavigation} />
    );

    expect(getByText(/設定が見つかりません/)).toBeTruthy();
    expect(getByText('設定画面へ')).toBeTruthy();
  });

  it('設定完了時に結果が表示される', () => {
    mockUseConfigStore.mockReturnValue({
      config: {
        notionToken: 'secret_test123',
        databaseId: '12345678-1234-1234-1234-123456789012',
        propertyMapping: {
          title: 'タイトル',
          author: '著者名',
          isbn: 'ISBN',
          imageUrl: '書影',
        },
      },
      setConfig: jest.fn(),
      clearConfig: jest.fn(),
    });

    const {getByText} = render(
      <ScanResultScreen route={mockRoute} navigation={mockNavigation} />
    );

    expect(getByText('書籍情報')).toBeTruthy();
    expect(getByText('プロパティマッピング')).toBeTruthy();
  });
});

describe('プロパティマッピング表示', () => {
  it('固定設定のプロパティマッピングが表示される', () => {
    mockUseConfigStore.mockReturnValue({
      config: {
        notionToken: 'secret_test123',
        databaseId: '12345678-1234-1234-1234-123456789012',
        propertyMapping: {
          title: 'タイトル',
          author: '著者名',
          isbn: 'ISBN',
          imageUrl: '書影',
        },
      },
      setConfig: jest.fn(),
      clearConfig: jest.fn(),
    });

    const {getByText} = render(
      <ScanResultScreen route={mockRoute} navigation={mockNavigation} />
    );

    expect(getByText('タイトル')).toBeTruthy();
    expect(getByText('著者名')).toBeTruthy();
    expect(getByText('ISBN')).toBeTruthy();
    expect(getByText('書影')).toBeTruthy();
  });
});
```

---

#### 2.3 ScanViewModel.test.ts の更新

**ファイル**: `src/__tests__/presentation/viewmodels/ScanViewModel.test.ts`

**変更内容**:

##### import更新

**削除**:
```typescript
// 削除
import {StorageRepository} from '@/data/repositories/StorageRepository';
```

**追加**:
```typescript
// 追加
import {SimplifiedConfigRepository} from '@/data/repositories/SimplifiedConfigRepository';
```

##### モック更新

**削除**:
```typescript
// 削除
const mockStorageRepository = {
  savePackages: jest.fn(),
  loadPackages: jest.fn(),
} as unknown as StorageRepository;
```

**追加**:
```typescript
// 追加
const mockConfigRepository = {
  save: jest.fn(),
  load: jest.fn(),
  clear: jest.fn(),
  validateConfig: jest.fn(),
} as unknown as SimplifiedConfigRepository;
```

##### ScanViewModel初期化の更新

**変更前**:
```typescript
const scanViewModel = new ScanViewModel(
  mockNotionRepository,
  mockOpenBDAPI,
  mockStorageRepository,
);
```

**変更後**:
```typescript
const scanViewModel = new ScanViewModel(
  mockNotionRepository,
  mockOpenBDAPI,
  mockConfigRepository,
);
```

##### テストケース更新

**削除するテスト**:
```typescript
// 削除
describe('パッケージ管理', () => {
  it('アクティブパッケージが設定されていない場合はエラー', async () => {
    // ...
  });
});
```

**追加するテスト**:
```typescript
describe('設定読み込み', () => {
  it('設定が正常に読み込まれる', async () => {
    const mockConfig = {
      notionToken: 'secret_test123',
      databaseId: '12345678-1234-1234-1234-123456789012',
      propertyMapping: {
        title: 'タイトル',
        author: '著者名',
        isbn: 'ISBN',
        imageUrl: '書影',
      },
    };

    mockConfigRepository.load.mockResolvedValue(mockConfig);
    mockConfigRepository.validateConfig.mockReturnValue({
      isValid: true,
      errors: [],
    });

    await scanViewModel.loadConfig();

    expect(mockConfigRepository.load).toHaveBeenCalled();
    expect(mockConfigRepository.validateConfig).toHaveBeenCalledWith(mockConfig);
  });

  it('設定が見つからない場合はエラー', async () => {
    mockConfigRepository.load.mockResolvedValue(null);

    await expect(scanViewModel.loadConfig()).rejects.toThrow(
      '設定が見つかりません'
    );
  });

  it('設定のバリデーションエラー時はエラー', async () => {
    const mockConfig = {
      notionToken: '',
      databaseId: 'invalid',
      propertyMapping: {
        title: '',
        author: '',
        isbn: '',
        imageUrl: '',
      },
    };

    mockConfigRepository.load.mockResolvedValue(mockConfig);
    mockConfigRepository.validateConfig.mockReturnValue({
      isValid: false,
      errors: ['Notion Tokenが入力されていません', 'データベースIDの形式が正しくありません'],
    });

    await expect(scanViewModel.loadConfig()).rejects.toThrow('設定エラー');
  });
});

describe('バーコードスキャン', () => {
  beforeEach(() => {
    // 設定をモック
    const mockConfig = {
      notionToken: 'secret_test123',
      databaseId: '12345678-1234-1234-1234-123456789012',
      propertyMapping: {
        title: 'タイトル',
        author: '著者名',
        isbn: 'ISBN',
        imageUrl: '書影',
      },
    };

    mockConfigRepository.load.mockResolvedValue(mockConfig);
    mockConfigRepository.validateConfig.mockReturnValue({
      isValid: true,
      errors: [],
    });
  });

  it('設定読み込み後、正常にスキャン処理が実行される', async () => {
    const mockBookData = {
      isbn: '9784123456789',
      title: 'テスト書籍',
      author: 'テスト著者',
      imageUrl: 'https://example.com/image.jpg',
    };

    const mockNotionPage = {
      id: 'page123',
      url: 'https://notion.so/page123',
    };

    mockOpenBDAPI.fetchByISBN.mockResolvedValue(mockBookData);
    mockNotionRepository.createPage.mockResolvedValue(mockNotionPage);

    const result = await scanViewModel.handleBarcodeScanned('9784123456789');

    expect(mockConfigRepository.load).toHaveBeenCalled();
    expect(mockOpenBDAPI.fetchByISBN).toHaveBeenCalledWith('9784123456789');
    expect(mockNotionRepository.createPage).toHaveBeenCalledWith(
      '12345678-1234-1234-1234-123456789012',
      expect.any(Object),
    );
    expect(result.success).toBe(true);
    expect(result.bookData).toEqual(mockBookData);
  });

  it('設定未完了時はエラー', async () => {
    mockConfigRepository.load.mockResolvedValue(null);

    await expect(
      scanViewModel.handleBarcodeScanned('9784123456789')
    ).rejects.toThrow('設定が見つかりません');
  });
});
```

---

### ステップ3: 新機能のテスト追加

#### 3.1 SimplifiedConfigRepository.test.ts の作成

**ファイル**: `src/__tests__/data/repositories/SimplifiedConfigRepository.test.ts`

**新規作成**:

```typescript
import {SimplifiedConfigRepository} from '@/data/repositories/SimplifiedConfigRepository';
import {MMKV} from 'react-native-mmkv';

jest.mock('react-native-mmkv');

describe('SimplifiedConfigRepository', () => {
  let repository: SimplifiedConfigRepository;
  let mockStorage: jest.Mocked<MMKV>;

  beforeEach(() => {
    mockStorage = {
      getString: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    } as any;

    repository = new SimplifiedConfigRepository(mockStorage);
  });

  describe('save', () => {
    it('設定を正常に保存できる', async () => {
      const config = {
        notionToken: 'secret_test123',
        databaseId: '12345678-1234-1234-1234-123456789012',
        propertyMapping: {
          title: 'タイトル',
          author: '著者名',
          isbn: 'ISBN',
          imageUrl: '書影',
        },
      };

      await repository.save(config);

      expect(mockStorage.set).toHaveBeenCalledWith(
        'simplified_config',
        JSON.stringify(config),
      );
    });
  });

  describe('load', () => {
    it('設定を正常に読み込める', async () => {
      const config = {
        notionToken: 'secret_test123',
        databaseId: '12345678-1234-1234-1234-123456789012',
        propertyMapping: {
          title: 'タイトル',
          author: '著者名',
          isbn: 'ISBN',
          imageUrl: '書影',
        },
      };

      mockStorage.getString.mockReturnValue(JSON.stringify(config));

      const result = await repository.load();

      expect(result).toEqual(config);
      expect(mockStorage.getString).toHaveBeenCalledWith('simplified_config');
    });

    it('設定がない場合はnullを返す', async () => {
      mockStorage.getString.mockReturnValue(undefined);

      const result = await repository.load();

      expect(result).toBeNull();
    });

    it('無効なJSON形式の場合はnullを返す', async () => {
      mockStorage.getString.mockReturnValue('invalid json');

      const result = await repository.load();

      expect(result).toBeNull();
    });
  });

  describe('clear', () => {
    it('設定を削除できる', async () => {
      await repository.clear();

      expect(mockStorage.delete).toHaveBeenCalledWith('simplified_config');
    });
  });

  describe('validateConfig', () => {
    it('正しい設定はバリデーション通過', () => {
      const config = {
        notionToken: 'secret_test123',
        databaseId: '123456781234123412341234567890ab',
        propertyMapping: {
          title: 'タイトル',
          author: '著者名',
          isbn: 'ISBN',
          imageUrl: '書影',
        },
      };

      const result = repository.validateConfig(config);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('Notion Token未入力時はエラー', () => {
      const config = {
        notionToken: '',
        databaseId: '123456781234123412341234567890ab',
        propertyMapping: {
          title: 'タイトル',
          author: '著者名',
          isbn: 'ISBN',
          imageUrl: '書影',
        },
      };

      const result = repository.validateConfig(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Notion Tokenが入力されていません');
    });

    it('Database ID形式不正時はエラー', () => {
      const config = {
        notionToken: 'secret_test123',
        databaseId: 'invalid',
        propertyMapping: {
          title: 'タイトル',
          author: '著者名',
          isbn: 'ISBN',
          imageUrl: '書影',
        },
      };

      const result = repository.validateConfig(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('データベースIDの形式が正しくありません');
    });

    it('プロパティマッピング不完全時はエラー', () => {
      const config = {
        notionToken: 'secret_test123',
        databaseId: '123456781234123412341234567890ab',
        propertyMapping: {
          title: '',
          author: '著者名',
          isbn: '',
          imageUrl: '書影',
        },
      };

      const result = repository.validateConfig(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('すべてのプロパティマッピングを入力してください');
    });
  });
});
```

---

#### 3.2 useConfigStore.test.ts の作成

**ファイル**: `src/__tests__/presentation/stores/useConfigStore.test.ts`

**新規作成**:

```typescript
import {renderHook, act} from '@testing-library/react-hooks';
import {useConfigStore} from '@/presentation/stores/useConfigStore';

describe('useConfigStore', () => {
  beforeEach(() => {
    // ストアをリセット
    const {result} = renderHook(() => useConfigStore());
    act(() => {
      result.current.clearConfig();
    });
  });

  it('初期状態ではconfigがnull', () => {
    const {result} = renderHook(() => useConfigStore());

    expect(result.current.config).toBeNull();
  });

  it('setConfigで設定を保存できる', () => {
    const {result} = renderHook(() => useConfigStore());

    const config = {
      notionToken: 'secret_test123',
      databaseId: '12345678-1234-1234-1234-123456789012',
      propertyMapping: {
        title: 'タイトル',
        author: '著者名',
        isbn: 'ISBN',
        imageUrl: '書影',
      },
    };

    act(() => {
      result.current.setConfig(config);
    });

    expect(result.current.config).toEqual(config);
  });

  it('clearConfigで設定をクリアできる', () => {
    const {result} = renderHook(() => useConfigStore());

    const config = {
      notionToken: 'secret_test123',
      databaseId: '12345678-1234-1234-1234-123456789012',
      propertyMapping: {
        title: 'タイトル',
        author: '著者名',
        isbn: 'ISBN',
        imageUrl: '書影',
      },
    };

    act(() => {
      result.current.setConfig(config);
    });

    expect(result.current.config).toEqual(config);

    act(() => {
      result.current.clearConfig();
    });

    expect(result.current.config).toBeNull();
  });
});
```

---

#### 3.3 SettingsScreenSimple.test.tsx の作成

**ファイル**: `src/__tests__/presentation/screens/SettingsScreenSimple.test.tsx`

**新規作成**:

```typescript
import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {SettingsScreenSimple} from '@/presentation/screens/SettingsScreenSimple';
import {useConfigStore} from '@/presentation/stores/useConfigStore';
import {NotionRepository} from '@/data/repositories/NotionRepository';

jest.mock('@/presentation/stores/useConfigStore');
jest.mock('@/data/repositories/NotionRepository');

describe('SettingsScreenSimple', () => {
  let mockSetConfig: jest.Mock;
  let mockClearConfig: jest.Mock;

  beforeEach(() => {
    mockSetConfig = jest.fn();
    mockClearConfig = jest.fn();

    (useConfigStore as jest.Mock).mockReturnValue({
      config: null,
      setConfig: mockSetConfig,
      clearConfig: mockClearConfig,
    });
  });

  it('初期状態で入力フォームが表示される', () => {
    const {getByPlaceholderText} = render(<SettingsScreenSimple />);

    expect(getByPlaceholderText('secret_xxxxx...')).toBeTruthy();
    expect(getByPlaceholderText('12345678-1234-1234-1234-123456789012')).toBeTruthy();
    expect(getByPlaceholderText('例: タイトル')).toBeTruthy();
  });

  it('保存されている設定が初期表示される', () => {
    (useConfigStore as jest.Mock).mockReturnValue({
      config: {
        notionToken: 'secret_test123',
        databaseId: '12345678-1234-1234-1234-123456789012',
        propertyMapping: {
          title: 'タイトル',
          author: '著者名',
          isbn: 'ISBN',
          imageUrl: '書影',
        },
      },
      setConfig: mockSetConfig,
      clearConfig: mockClearConfig,
    });

    const {getByDisplayValue} = render(<SettingsScreenSimple />);

    expect(getByDisplayValue('secret_test123')).toBeTruthy();
    expect(getByDisplayValue('12345678-1234-1234-1234-123456789012')).toBeTruthy();
    expect(getByDisplayValue('タイトル')).toBeTruthy();
  });

  it('入力値の変更が反映される', () => {
    const {getByPlaceholderText} = render(<SettingsScreenSimple />);

    const tokenInput = getByPlaceholderText('secret_xxxxx...');

    fireEvent.changeText(tokenInput, 'secret_new_token');

    expect(tokenInput.props.value).toBe('secret_new_token');
  });

  it('バリデーションエラー時は保存できない', async () => {
    const {getByText, getByPlaceholderText} = render(<SettingsScreenSimple />);

    // Notion Tokenだけ入力（他は空）
    fireEvent.changeText(getByPlaceholderText('secret_xxxxx...'), 'secret_test');

    fireEvent.press(getByText('保存'));

    await waitFor(() => {
      expect(getByText(/データベースIDが入力されていません/)).toBeTruthy();
    });

    expect(mockSetConfig).not.toHaveBeenCalled();
  });

  it('正しい入力で保存できる', async () => {
    const {getByText, getByPlaceholderText} = render(<SettingsScreenSimple />);

    fireEvent.changeText(getByPlaceholderText('secret_xxxxx...'), 'secret_test123');
    fireEvent.changeText(
      getByPlaceholderText('12345678-1234-1234-1234-123456789012'),
      '123456781234123412341234567890ab',
    );
    fireEvent.changeText(getByPlaceholderText('例: タイトル'), 'タイトル');
    fireEvent.changeText(getByPlaceholderText('例: 著者名'), '著者名');
    fireEvent.changeText(getByPlaceholderText('例: ISBN'), 'ISBN');
    fireEvent.changeText(getByPlaceholderText('例: 書影URL'), '書影');

    fireEvent.press(getByText('保存'));

    await waitFor(() => {
      expect(mockSetConfig).toHaveBeenCalledWith({
        notionToken: 'secret_test123',
        databaseId: '123456781234123412341234567890ab',
        propertyMapping: {
          title: 'タイトル',
          author: '著者名',
          isbn: 'ISBN',
          imageUrl: '書影',
        },
      });
    });
  });

  it('データベースプレビュー機能が動作する', async () => {
    const mockDatabases = [
      {id: 'db1', title: 'テストDB1'},
      {id: 'db2', title: 'テストDB2'},
    ];

    (NotionRepository.prototype.listDatabases as jest.Mock).mockResolvedValue(
      mockDatabases,
    );

    const {getByText, getByPlaceholderText} = render(<SettingsScreenSimple />);

    // Notion Token入力
    fireEvent.changeText(getByPlaceholderText('secret_xxxxx...'), 'secret_test123');

    // プレビューボタンタップ
    fireEvent.press(getByText('プレビュー'));

    await waitFor(() => {
      expect(getByText('テストDB1')).toBeTruthy();
      expect(getByText('テストDB2')).toBeTruthy();
    });
  });

  it('リセットボタンで設定をクリアできる', async () => {
    (useConfigStore as jest.Mock).mockReturnValue({
      config: {
        notionToken: 'secret_test123',
        databaseId: '12345678-1234-1234-1234-123456789012',
        propertyMapping: {
          title: 'タイトル',
          author: '著者名',
          isbn: 'ISBN',
          imageUrl: '書影',
        },
      },
      setConfig: mockSetConfig,
      clearConfig: mockClearConfig,
    });

    const {getByText} = render(<SettingsScreenSimple />);

    fireEvent.press(getByText('リセット'));

    await waitFor(() => {
      expect(mockClearConfig).toHaveBeenCalled();
    });
  });
});
```

---

### ステップ4: テスト実行と確認

#### 4.1 全テスト実行

```bash
npm test
```

**期待される結果**:
- Test Suites: すべて通過
- Tests: すべて通過
- エラー0件

#### 4.2 カバレッジ確認

```bash
npm test -- --coverage
```

**期待されるカバレッジ**:
- Statements: 80%以上
- Branches: 75%以上
- Functions: 80%以上
- Lines: 80%以上

#### 4.3 特定テストの実行

```bash
# SimplifiedConfigRepositoryのテストのみ実行
npm test src/__tests__/data/repositories/SimplifiedConfigRepository.test.ts

# useConfigStoreのテストのみ実行
npm test src/__tests__/presentation/stores/useConfigStore.test.ts

# SettingsScreenSimpleのテストのみ実行
npm test src/__tests__/presentation/screens/SettingsScreenSimple.test.tsx
```

---

## ✅ 完了確認チェックリスト

Phase D完了後、以下を確認してください：

### 1. 削除確認

```bash
# 削除されたファイルを確認
ls src/__tests__/presentation/screens/PackageFormScreen.test.tsx 2>/dev/null && echo "❌" || echo "✅"
ls src/__tests__/presentation/screens/PackageManagementScreen.test.tsx 2>/dev/null && echo "❌" || echo "✅"
ls src/__tests__/presentation/viewmodels/PackageViewModel.test.ts 2>/dev/null && echo "❌" || echo "✅"
ls src/__tests__/presentation/stores/usePackageStore.test.ts 2>/dev/null && echo "❌" || echo "✅"
ls e2e/app.test.ts 2>/dev/null && echo "❌" || echo "✅"
```

**期待される結果**: すべて✅

### 2. 新規ファイル確認

```bash
# 新規作成されたテストファイルを確認
ls src/__tests__/data/repositories/SimplifiedConfigRepository.test.ts && echo "✅" || echo "❌"
ls src/__tests__/presentation/stores/useConfigStore.test.ts && echo "✅" || echo "❌"
ls src/__tests__/presentation/screens/SettingsScreenSimple.test.tsx && echo "✅" || echo "❌"
```

**期待される結果**: すべて✅

### 3. テスト実行確認

```bash
npm test
```

**期待される結果**:
- Test Suites: 全通過（失敗0件）
- Tests: 全通過（失敗0件）

**許容される失敗**: なし（0件であること）

### 4. TypeScriptエラー確認

```bash
npx tsc --noEmit
```

**期待される結果**: エラー0件

### 5. ESLint確認

```bash
npx eslint src/ --ext .ts,.tsx
```

**期待される結果**: エラー0件、警告最小限

---

## 🚨 注意事項

### よくあるエラーと対処法

#### 1. モックエラー

```bash
# 症状
Cannot find module '@/presentation/stores/useConfigStore'

# 原因
jest.mock のパスが間違っている

# 解決策
import パスと jest.mock パスが一致しているか確認
```

#### 2. 型エラー

```bash
# 症状
Type 'jest.Mock' is not assignable to type...

# 原因
モックの型定義が不足

# 解決策
as jest.MockedFunction<typeof XXX> でキャスト
```

#### 3. テストタイムアウト

```bash
# 症状
Exceeded timeout of 5000 ms

# 原因
非同期処理の待機不足

# 解決策
await waitFor(() => { ... }) を使用
```

---

## 📞 Phase D完了報告

Phase D完了後、以下を確認してClaudeCodeに報告してください：

### 1. テスト削除確認

- [ ] 不要テストファイル10件が削除された
- [ ] 削除確認コマンドで全て✅確認済み

### 2. テスト更新確認

- [ ] ScanScreen.test.tsx 更新済み
- [ ] ScanResultScreen.test.tsx 更新済み
- [ ] ScanViewModel.test.ts 更新済み

### 3. テスト追加確認

- [ ] SimplifiedConfigRepository.test.ts 作成済み
- [ ] useConfigStore.test.ts 作成済み
- [ ] SettingsScreenSimple.test.tsx 作成済み

### 4. テスト実行確認

- [ ] `npm test` 全通過確認済み
- [ ] カバレッジ 80%以上確認済み
- [ ] TypeScriptエラー 0件確認済み

### 5. コミット

```bash
git add .
git commit -m "test: Phase D - テスト更新（SimplifiedConfig対応）

変更内容:
- 不要テストファイル削除（10ファイル）
  - Package管理関連画面テスト（7ファイル）
  - PackageViewModel/usePackageStoreテスト（2ファイル）
  - E2Eテスト（1ファイル）

- 既存テスト更新（SimplifiedConfig対応）
  - ScanScreen.test.tsx: 設定チェック・無効化テスト追加
  - ScanResultScreen.test.tsx: 固定設定対応
  - ScanViewModel.test.ts: SimplifiedConfig読み込みテスト

- 新規テスト追加
  - SimplifiedConfigRepository.test.ts: CRUD・バリデーションテスト
  - useConfigStore.test.ts: Zustandストアテスト
  - SettingsScreenSimple.test.tsx: 設定画面UIテスト

テスト結果:
- Test Suites: 全通過
- Tests: 全通過
- Coverage: 80%以上達成

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

**Phase D完了後、ClaudeCodeによるコードレビュー（Phase E）に進んでください。**
