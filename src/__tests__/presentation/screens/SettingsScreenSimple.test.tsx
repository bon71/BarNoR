/**
 * SettingsScreenSimple テスト
 */

import React from 'react';
import {render, fireEvent, waitFor, act} from '@testing-library/react-native';
import * as useToastStore from '@/presentation/stores/useToastStore';

jest.mock('@/presentation/stores/useConfigStore');

jest.mock('@/data/datasources/MMKVStorage', () => ({
  MMKVStorage: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('@/data/datasources/NotionAPI', () => ({
  NotionAPI: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('@/infrastructure/security/EncryptionKeyManager', () => ({
  getEncryptionKey: jest.fn().mockReturnValue('test-key'),
}));

// SimplifiedConfigRepository のモックでは、グローバルスコープのモック関数を使用
jest.mock('@/data/repositories/SimplifiedConfigRepository', () => {
  // ここでモック関数を新規作成し、グローバルスコープの関数にデリゲート
  const saveConfig = jest.fn();
  const loadConfig = jest.fn();
  const deleteConfig = jest.fn();
  const validateConfig = jest.fn();

  return {
    SimplifiedConfigRepository: jest.fn().mockImplementation(() => ({
      saveConfig,
      loadConfig,
      deleteConfig,
      validateConfig,
    })),
    __esModule: true,
    // テストから参照できるようにエクスポート
    _mockFunctions: {
      saveConfig,
      loadConfig,
      deleteConfig,
      validateConfig,
    },
  };
});

jest.mock('@/data/repositories/NotionRepository', () => {
  const listDatabases = jest.fn();
  const getDatabaseProperties = jest.fn();

  return {
    NotionRepository: jest.fn().mockImplementation(() => ({
      listDatabases,
      getDatabaseProperties,
    })),
    __esModule: true,
    _mockFunctions: {
      listDatabases,
      getDatabaseProperties,
    },
  };
});

// ViewModelProviderをモック
jest.mock('@/presentation/providers/ViewModelProvider', () => {
  const configRepoMocks = (require('@/data/repositories/SimplifiedConfigRepository') as any)._mockFunctions;
  return {
    simplifiedConfigRepository: {
      loadConfig: configRepoMocks.loadConfig,
      saveConfig: configRepoMocks.saveConfig,
      deleteConfig: configRepoMocks.deleteConfig,
      validateConfig: configRepoMocks.validateConfig,
    },
    storageRepository: {
      clearScanHistory: jest.fn(),
      deleteNotionToken: jest.fn(),
    },
  };
});

// Import after mocks
import {SettingsScreenSimple} from '@/presentation/screens/SettingsScreenSimple';
import {useConfigStore} from '@/presentation/stores/useConfigStore';
import * as SimplifiedConfigRepositoryModule from '@/data/repositories/SimplifiedConfigRepository';
import * as NotionRepositoryModule from '@/data/repositories/NotionRepository';

jest.mock('@/presentation/stores/useToastStore', () => ({
  showSuccessToast: jest.fn(),
  showErrorToast: jest.fn(),
}));
jest.mock('@/presentation/hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      primary: '#37352F',
      background: '#FFFFFF',
      textPrimary: '#37352F',
      textSecondary: '#787774',
      error: '#E03E3E',
    },
  }),
}));

jest.mock('@/presentation/hooks/useTranslation', () => ({
  useTranslation: jest.fn(() => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'settings:completed': '設定完了',
        'settings:settingsSaved': '設定を保存しました',
        'settings:languageSettings': '言語設定',
        'settings:languageJapanese': '日本語',
        'settings:languageEnglish': 'English',
        'settings:title': '設定',
        'settings:notionIntegrationSetup': 'Notion連携設定',
        'settings:enterNotionToken': 'Notion Integration Tokenを入力してください',
        'settings:notionTokenLabel': 'Notion Token',
        'settings:notionTokenPlaceholder': 'ntn_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        'settings:howToCreateIntegration': '📖 連携の作成方法を見る',
        'settings:connectNotion': 'Notionに接続',
        'settings:connectionFailed': '接続失敗',
        'settings:databaseListFetchFailed': 'データベース一覧の取得に失敗しました',
        'settings:notionConnectionFailed': 'Notionへの接続に失敗しました。\nTokenを確認してください。',
        'settings:resetToken': 'Tokenをリセット',
        'settings:resetTokenConfirmTitle': 'Tokenをリセット',
        'settings:resetTokenConfirmMessage': '設定をリセットして最初からやり直しますか？',
        'settings:reset': 'リセット',
        'settings:databaseSelection': 'データベース選択',
        'settings:selectNotionDatabase': 'ライブラリデータとして登録するNotionデータベースを選択してください',
        'settings:databaseLabel': 'データベース',
        'settings:databaseIdLabel': 'ID:',
        'settings:changeDatabase': '← データベースを変更',
        'settings:propertyMapping': 'プロパティマッピング',
        'settings:selectNotionProperties': 'Notionデータベースのプロパティを選択してください',
        'settings:isbnProperty': 'ISBN → Notionプロパティ',
        'settings:titleProperty': 'タイトル → Notionプロパティ',
        'settings:authorProperty': '著者名 → Notionプロパティ',
        'settings:imageUrlProperty': '書影URL → Notionプロパティ',
        'settings:refreshProperties': 'プロパティを再取得',
        'settings:noPropertiesFound': '対応するプロパティが見つかりません',
        'settings:propertyTypeLabel': '型:',
        'settings:saveSettings': '設定を保存',
        'settings:inputError': '入力エラー',
        'settings:completedSubtitle': '以下の設定でアプリを使用できます',
        'settings:configured': '設定済み',
        'settings:changeSettings': '設定を変更',
        'settings:databasesFound': '{{count}}件のデータベースが見つかりました',
        'settings:propertiesFetchFailed': 'プロパティの取得に失敗しました',
        'common:save': '保存',
        'common:cancel': 'キャンセル',
        'common:ok': 'OK',
        'common:error': 'エラー',
        'common:success': '成功',
        'common:back': '戻る',
        'common:edit': '編集',
        'common:delete': '削除',
        'common:add': '追加',
        'common:loading': '読み込み中...',
        'common:retry': '再試行',
        'common:close': '閉じる',
        'common:search': '検索',
      };
      return translations[key] || key;
    },
    i18n: {
      language: 'ja',
      changeLanguage: jest.fn(),
    },
  })),
}));

jest.mock('@/presentation/stores/useLanguageStore', () => ({
  useLanguageStore: jest.fn(() => ({
    language: 'ja',
    setLanguage: jest.fn(),
    initializeLanguage: jest.fn(),
  })),
}));

const mockUseConfigStore = useConfigStore as jest.MockedFunction<typeof useConfigStore>;
const mockSetConfig = jest.fn();

// Get the actual mock functions from the mocked modules
const configRepoMocks = (SimplifiedConfigRepositoryModule as any)._mockFunctions;
const notionRepoMocks = (NotionRepositoryModule as any)._mockFunctions;

describe('SettingsScreenSimple', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Reset mock implementations
    configRepoMocks.saveConfig.mockReset();
    configRepoMocks.loadConfig.mockReset();
    configRepoMocks.deleteConfig.mockReset();
    configRepoMocks.validateConfig.mockReset();
    notionRepoMocks.listDatabases.mockReset();
    notionRepoMocks.getDatabaseProperties.mockReset();

    mockUseConfigStore.mockReturnValue({
      config: null,
      isConfigured: false,
      setConfig: mockSetConfig,
      updateToken: jest.fn(),
      updateDatabaseId: jest.fn(),
      updatePropertyMapping: jest.fn(),
      resetConfig: jest.fn(),
      checkIfConfigured: jest.fn(() => false),
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('初期状態で入力フォームが表示される', async () => {
    configRepoMocks.loadConfig.mockResolvedValue(null);

    const {getByTestId} = render(<SettingsScreenSimple />);

    // タイマーを実行してloadConfigが呼ばれるのを待つ
    await act(async () => {
      jest.advanceTimersByTime(200);
      await Promise.resolve(); // 非同期処理を待つ
    });

    await waitFor(() => {
      expect(configRepoMocks.loadConfig).toHaveBeenCalled();
    }, {timeout: 3000});

    await waitFor(() => {
      expect(getByTestId('notion-token-input')).toBeTruthy();
    });
  });

  it('保存されている設定が初期表示される', async () => {
    const savedConfig = {
      notionToken: 'secret_test123',
      databaseId: '12345678-1234-1234-1234-123456789012',
      propertyMapping: {
        title: 'タイトル',
        author: '著者名',
        isbn: 'ISBN',
        imageUrl: '書影',
      },
    };

    configRepoMocks.loadConfig.mockResolvedValue(savedConfig);
    notionRepoMocks.listDatabases.mockResolvedValue([
      {id: savedConfig.databaseId, title: 'テストDB'},
    ]);
    notionRepoMocks.getDatabaseProperties.mockResolvedValue([
      {id: 'prop1', name: 'タイトル', type: 'title'},
    ]);
    mockUseConfigStore.mockReturnValue({
      config: savedConfig,
      isConfigured: true,
      setConfig: mockSetConfig,
      updateToken: jest.fn(),
      updateDatabaseId: jest.fn(),
      updatePropertyMapping: jest.fn(),
      resetConfig: jest.fn(),
      checkIfConfigured: jest.fn(() => true),
    });

    const {getByText} = render(<SettingsScreenSimple />);

    // タイマーを実行してloadConfigが呼ばれるのを待つ
    await act(async () => {
      jest.advanceTimersByTime(200);
      await Promise.resolve(); // 非同期処理を待つ
    });

    await waitFor(() => {
      expect(configRepoMocks.loadConfig).toHaveBeenCalled();
    }, {timeout: 3000});

    // 完了画面が表示されることを確認（設定済みの場合は完了画面から開始）
    await waitFor(() => {
      expect(getByText('設定完了')).toBeTruthy();
      expect(getByText(/テストDB/)).toBeTruthy();
    });
  });

  it('入力値の変更が反映される', async () => {
    configRepoMocks.loadConfig.mockResolvedValue(null);

    const {getByTestId} = render(<SettingsScreenSimple />);

    // タイマーを実行してloadConfigが呼ばれるのを待つ
    await act(async () => {
      jest.advanceTimersByTime(200);
      await Promise.resolve(); // 非同期処理を待つ
    });

    await waitFor(() => {
      expect(configRepoMocks.loadConfig).toHaveBeenCalled();
    }, {timeout: 3000});

    await waitFor(() => {
      const tokenInput = getByTestId('notion-token-input');
      fireEvent.changeText(tokenInput, 'secret_new_token');
      expect(tokenInput.props.value).toBe('secret_new_token');
    });
  });

  it('バリデーションエラー時は保存できない', async () => {
    configRepoMocks.loadConfig.mockResolvedValue(null);
    configRepoMocks.validateConfig.mockReturnValue({
      isValid: false,
      errors: ['データベースIDが入力されていません'],
    });
    notionRepoMocks.listDatabases.mockResolvedValue([
      {id: 'db1', title: 'テストDB1'},
    ]);
    notionRepoMocks.getDatabaseProperties.mockResolvedValue([
      {id: 'prop1', name: 'タイトル', type: 'title'},
    ]);

    const {getByTestId, findByTestId} = render(<SettingsScreenSimple />);

    // タイマーを実行してloadConfigが呼ばれるのを待つ
    await act(async () => {
      jest.advanceTimersByTime(200);
      await Promise.resolve(); // 非同期処理を待つ
    });

    await waitFor(() => {
      expect(configRepoMocks.loadConfig).toHaveBeenCalled();
    }, {timeout: 3000});

    // Token入力
    const tokenInput = await findByTestId('notion-token-input');
    fireEvent.changeText(tokenInput, 'secret_test');

    // 接続してデータベース選択画面へ
    const connectButton = getByTestId('connect-notion-button');
    fireEvent.press(connectButton);

    await waitFor(() => {
      expect(notionRepoMocks.listDatabases).toHaveBeenCalled();
    });

    // データベースを選択してプロパティマッピング画面へ
    const dbRadio = await findByTestId('database-radio-db1');
    fireEvent.press(dbRadio);

    // プロパティ取得を待つ
    await waitFor(() => {
      expect(notionRepoMocks.getDatabaseProperties).toHaveBeenCalled();
    });

    // 保存ボタンを押す
    const saveButton = await findByTestId('save-config-button');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(configRepoMocks.validateConfig).toHaveBeenCalled();
      expect(mockSetConfig).not.toHaveBeenCalled();
    });
  });

  it('正しい入力で保存できる', async () => {
    configRepoMocks.loadConfig.mockResolvedValue(null);
    configRepoMocks.validateConfig.mockReturnValue({
      isValid: true,
      errors: [],
    });
    configRepoMocks.saveConfig.mockResolvedValue(undefined);
    notionRepoMocks.listDatabases.mockResolvedValue([
      {id: 'db1', title: 'テストDB1'},
    ]);
    notionRepoMocks.getDatabaseProperties.mockResolvedValue([
      {id: 'prop1', name: 'タイトル', type: 'title'},
      {id: 'prop2', name: '著者名', type: 'rich_text'},
      {id: 'prop3', name: 'ISBN', type: 'rich_text'},
      {id: 'prop4', name: '書影', type: 'url'},
    ]);

    const {getByTestId, findByTestId} = render(<SettingsScreenSimple />);

    // タイマーを実行してloadConfigが呼ばれるのを待つ
    await act(async () => {
      jest.advanceTimersByTime(200);
      await Promise.resolve(); // 非同期処理を待つ
    });

    await waitFor(() => {
      expect(configRepoMocks.loadConfig).toHaveBeenCalled();
    }, {timeout: 3000});

    // Step 1: Token入力
    const tokenInput = await findByTestId('notion-token-input');
    fireEvent.changeText(tokenInput, 'secret_test123');

    // Step 2: 接続ボタンを押してデータベース選択画面へ
    const connectButton = getByTestId('connect-notion-button');
    fireEvent.press(connectButton);

    await waitFor(() => {
      expect(notionRepoMocks.listDatabases).toHaveBeenCalledWith('secret_test123');
    });

    // Step 3: データベースを選択（プロパティマッピング画面へ）
    await waitFor(() => {
      const dbRadio = getByTestId('database-radio-db1');
      fireEvent.press(dbRadio);
    });

    // プロパティ取得を待つ
    await waitFor(() => {
      expect(notionRepoMocks.getDatabaseProperties).toHaveBeenCalledWith('secret_test123', 'db1');
    });

    // Step 4: 保存ボタンを押す
    await waitFor(() => {
      const saveButton = getByTestId('save-config-button');
      fireEvent.press(saveButton);
    });

    await waitFor(() => {
      expect(configRepoMocks.validateConfig).toHaveBeenCalled();
      expect(configRepoMocks.saveConfig).toHaveBeenCalled();
      expect(mockSetConfig).toHaveBeenCalled();
      expect(useToastStore.showSuccessToast).toHaveBeenCalledWith('alerts:settingsSaved');
    });
  });

  it('接続テストが動作する', async () => {
    configRepoMocks.loadConfig.mockResolvedValue(null);
    notionRepoMocks.listDatabases.mockResolvedValue([
      {id: 'db1', title: 'テストDB1'},
      {id: 'db2', title: 'テストDB2'},
    ]);

    const {getByTestId} = render(<SettingsScreenSimple />);

    // タイマーを実行してloadConfigが呼ばれるのを待つ
    await act(async () => {
      jest.advanceTimersByTime(200);
      await Promise.resolve(); // 非同期処理を待つ
    });

    await waitFor(() => {
      expect(configRepoMocks.loadConfig).toHaveBeenCalled();
    }, {timeout: 3000});

    const tokenInput = await waitFor(() => getByTestId('notion-token-input'));
    const connectButton = getByTestId('connect-notion-button');

    fireEvent.changeText(tokenInput, 'secret_test123');
    fireEvent.press(connectButton);

    await waitFor(() => {
      expect(notionRepoMocks.listDatabases).toHaveBeenCalledWith('secret_test123');
    });
  });

  it('useTranslationが呼ばれ、翻訳キーが使用される', async () => {
    const {useTranslation} = require('@/presentation/hooks/useTranslation');
    const mockT = jest.fn((key: string) => key);
    (useTranslation as jest.Mock).mockReturnValue({
      t: mockT,
      i18n: {
        language: 'ja',
        changeLanguage: jest.fn(),
      },
    });

    configRepoMocks.loadConfig.mockResolvedValue(null);

    render(<SettingsScreenSimple />);

    // タイマーを実行してloadConfigが呼ばれるのを待つ
    await act(async () => {
      jest.advanceTimersByTime(200);
      await Promise.resolve(); // 非同期処理を待つ
    });

    await waitFor(() => {
      expect(configRepoMocks.loadConfig).toHaveBeenCalled();
    }, {timeout: 3000});

    expect(useTranslation).toHaveBeenCalled();
  });

  // TODO: 言語切り替えUIの実装後に有効化
  it.skip('言語切り替えUIが表示される（設定完了時）', async () => {
    const {useLanguageStore} = require('@/presentation/stores/useLanguageStore');
    const mockSetLanguage = jest.fn();
    (useLanguageStore as jest.Mock).mockReturnValue({
      language: 'ja',
      setLanguage: mockSetLanguage,
      initializeLanguage: jest.fn(),
    });

    const savedConfig = {
      notionToken: 'secret_test123',
      databaseId: '12345678-1234-1234-1234-123456789012',
      propertyMapping: {
        title: 'タイトル',
        author: '著者名',
        isbn: 'ISBN',
        imageUrl: '書影',
      },
    };

    configRepoMocks.loadConfig.mockResolvedValue(savedConfig);
    notionRepoMocks.listDatabases.mockResolvedValue([
      {id: savedConfig.databaseId, title: 'テストDB'},
    ]);
    notionRepoMocks.getDatabaseProperties.mockResolvedValue([
      {id: 'prop1', name: 'タイトル', type: 'title'},
    ]);
    mockUseConfigStore.mockReturnValue({
      config: savedConfig,
      isConfigured: true,
      setConfig: mockSetConfig,
      updateToken: jest.fn(),
      updateDatabaseId: jest.fn(),
      updatePropertyMapping: jest.fn(),
      resetConfig: jest.fn(),
      checkIfConfigured: jest.fn(() => true),
    });

    const {getByText} = render(<SettingsScreenSimple />);

    await waitFor(() => {
      expect(configRepoMocks.loadConfig).toHaveBeenCalled();
    });

    // 言語設定セクションが表示されることを確認
    await waitFor(() => {
      expect(getByText(/言語設定/)).toBeTruthy();
    });
  });
});

