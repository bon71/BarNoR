/**
 * ScanViewModel テスト
 */

import {ScanViewModel} from '@/presentation/viewmodels/ScanViewModel';
import {FetchBookInfoUseCase} from '@/domain/usecases/FetchBookInfoUseCase';
import {INotionRepository} from '@/domain/repositories/INotionRepository';
import {SimplifiedConfigRepository} from '@/data/repositories/SimplifiedConfigRepository';
import {IStorageRepository} from '@/domain/repositories/IStorageRepository';
import {ScannedItem, ItemType} from '@/domain/entities/ScannedItem';
import {useScanStore} from '@/presentation/stores/useScanStore';

// モック
jest.mock('@/presentation/stores/useScanStore');

const mockFetchBookInfoUseCase = {
  execute: jest.fn(),
} as unknown as FetchBookInfoUseCase;

const mockNotionRepository: jest.Mocked<INotionRepository> = {
  validateToken: jest.fn(),
  listDatabases: jest.fn(),
  getDatabase: jest.fn(),
  getDatabaseProperties: jest.fn(),
  saveItem: jest.fn(),
  saveItemWithConfig: jest.fn(),
  queryDatabasePages: jest.fn(),
};

const mockConfigRepository: jest.Mocked<SimplifiedConfigRepository> = {
  saveConfig: jest.fn(),
  loadConfig: jest.fn(),
  deleteConfig: jest.fn(),
  validateConfig: jest.fn(),
} as any;

const mockStorageRepository: jest.Mocked<IStorageRepository> = {
  saveNotionToken: jest.fn(),
  getNotionToken: jest.fn(),
  deleteNotionToken: jest.fn(),
  savePackages: jest.fn(),
  getPackages: jest.fn(),
  saveScanHistory: jest.fn(),
  getScanHistory: jest.fn(),
  clearScanHistory: jest.fn(),
};

const mockUseScanStore = useScanStore as jest.MockedFunction<
  typeof useScanStore
>;

describe('ScanViewModel', () => {
  let viewModel: ScanViewModel;
  let mockScanStoreState: any;

  beforeEach(() => {
    viewModel = new ScanViewModel(
      mockFetchBookInfoUseCase,
      mockNotionRepository,
      mockConfigRepository,
      mockStorageRepository,
    );

    // スキャンストアのモック状態
    mockScanStoreState = {
      scanHistory: [],
      currentScannedItem: null,
      isLoading: false,
      error: null,
      setScanHistory: jest.fn(),
      setCurrentScannedItem: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
      addToHistory: jest.fn(),
      updateHistoryItem: jest.fn(),
      clearHistory: jest.fn(),
    };

    (mockUseScanStore as any).getState = jest.fn(() => mockScanStoreState);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('loadScanHistory', () => {
    it('スキャン履歴を正常に読み込む', async () => {
      const mockHistory = [
        {
          id: 'scan1',
          barcode: '9784567890123',
          title: 'テスト書籍1',
          type: 'book' as const,
          status: 'sent' as const,
          scannedAt: new Date(),
        },
      ];

      mockStorageRepository.getScanHistory.mockResolvedValue(mockHistory);

      await viewModel.loadScanHistory();

      expect(mockStorageRepository.getScanHistory).toHaveBeenCalled();
      expect(mockScanStoreState.setError).toHaveBeenCalledWith(null);
      expect(mockScanStoreState.setScanHistory).toHaveBeenCalledWith(
        mockHistory,
      );
    });

    it('履歴読み込みエラー時、エラーを設定する', async () => {
      const error = new Error('Storage error');
      mockStorageRepository.getScanHistory.mockRejectedValue(error);

      await expect(viewModel.loadScanHistory()).rejects.toThrow('Storage error');
      expect(mockScanStoreState.setError).toHaveBeenCalledWith(
        expect.stringContaining('エラー'),
      );
    });
  });

  describe('scanBarcode', () => {
    it('バーコードスキャンが成功する', async () => {
      const mockItem = new ScannedItem({
        barcode: '9784567890123',
        title: 'テスト書籍',
        author: 'テスト著者',
        type: ItemType.BOOK,
      });

      (mockFetchBookInfoUseCase.execute as jest.Mock).mockResolvedValue(
        mockItem,
      );

      const result = await viewModel.scanBarcode('9784567890123');

      expect(mockScanStoreState.setLoading).toHaveBeenCalledWith(true);
      expect(mockScanStoreState.setError).toHaveBeenCalledWith(null);
      expect(mockFetchBookInfoUseCase.execute).toHaveBeenCalledWith(
        '9784567890123',
      );
      expect(mockScanStoreState.setCurrentScannedItem).toHaveBeenCalledWith(
        mockItem,
      );
      expect(result).toEqual({
        success: true,
        item: mockItem,
      });
      expect(mockScanStoreState.setLoading).toHaveBeenCalledWith(false);
    });

    it('書籍が見つからない場合、エラーを返す', async () => {
      (mockFetchBookInfoUseCase.execute as jest.Mock).mockResolvedValue(null);

      const result = await viewModel.scanBarcode('9999999999999');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(mockScanStoreState.setError).toHaveBeenCalled();
    });

    it('スキャンエラー時、エラーを返す', async () => {
      const error = new Error('API error');
      (mockFetchBookInfoUseCase.execute as jest.Mock).mockRejectedValue(error);

      const result = await viewModel.scanBarcode('9784567890123');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(mockScanStoreState.setError).toHaveBeenCalled();
      expect(mockScanStoreState.setLoading).toHaveBeenCalledWith(false);
    });
  });

  describe('loadConfig', () => {
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

      (mockConfigRepository.loadConfig as jest.Mock).mockResolvedValue(mockConfig);
      (mockConfigRepository.validateConfig as jest.Mock).mockReturnValue({
        isValid: true,
        errors: [],
      });

      await viewModel.loadConfig();

      expect(mockConfigRepository.loadConfig).toHaveBeenCalled();
      expect(mockConfigRepository.validateConfig).toHaveBeenCalledWith(mockConfig);
    });

    it('設定が見つからない場合はエラー', async () => {
      (mockConfigRepository.loadConfig as jest.Mock).mockResolvedValue(null);

      await expect(viewModel.loadConfig()).rejects.toThrow(
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

      (mockConfigRepository.loadConfig as jest.Mock).mockResolvedValue(mockConfig);
      (mockConfigRepository.validateConfig as jest.Mock).mockReturnValue({
        isValid: false,
        errors: ['Notion Tokenが入力されていません', 'データベースIDの形式が正しくありません'],
      });

      await expect(viewModel.loadConfig()).rejects.toThrow('設定エラー');
    });
  });

  describe('saveToNotion', () => {
    const mockItem = new ScannedItem({
      barcode: '9784567890123',
      title: 'テスト書籍',
      author: 'テスト著者',
      type: ItemType.BOOK,
    });

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

      (mockConfigRepository.loadConfig as jest.Mock).mockResolvedValue(mockConfig);
      (mockConfigRepository.validateConfig as jest.Mock).mockReturnValue({
        isValid: true,
        errors: [],
      });
    });

    it('設定未完了時、エラーを返す', async () => {
      (mockConfigRepository.loadConfig as jest.Mock).mockResolvedValue(null);

      const result = await viewModel.saveToNotion(mockItem);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      // エラーは getUserFriendlyErrorMessage でフレンドリーなメッセージに変換される
      expect(result.error).toContain('予期しないエラーが発生しました');
      expect(mockScanStoreState.setError).toHaveBeenCalled();
      expect(mockNotionRepository.saveItemWithConfig).not.toHaveBeenCalled();
    });

    it('loadConfig後にthis.configがnullの場合、エラーを返す', async () => {
      // loadConfigが成功するが、this.configがnullになる場合をシミュレート
      // これは実際には起こりにくいが、ブランチカバレッジのためにテスト
      (mockConfigRepository.loadConfig as jest.Mock).mockResolvedValue(null);
      (mockConfigRepository.validateConfig as jest.Mock).mockReturnValue({
        isValid: false,
        errors: [],
      });

      const result = await viewModel.saveToNotion(mockItem);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(mockScanStoreState.setError).toHaveBeenCalled();
      expect(mockNotionRepository.saveItemWithConfig).not.toHaveBeenCalled();
    });

    it('Notionへの保存が成功する', async () => {
      (mockNotionRepository.saveItemWithConfig as jest.Mock).mockResolvedValue({
        success: true,
        pageId: 'page123',
      });

      mockScanStoreState.scanHistory = [];

      const result = await viewModel.saveToNotion(mockItem);

      expect(result.success).toBe(true);
      expect(mockNotionRepository.saveItemWithConfig).toHaveBeenCalled();
      expect(mockStorageRepository.saveScanHistory).toHaveBeenCalled();
    });

    it('Notion保存エラー時、エラーを返す', async () => {
      (mockNotionRepository.saveItemWithConfig as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Notion保存エラー',
      });

      const result = await viewModel.saveToNotion(mockItem);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(mockScanStoreState.setError).toHaveBeenCalled();
    });
  });

  describe('resendHistoryItem', () => {
    beforeEach(() => {
      // 設定をモック（各テストで使用される）
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

      // loadConfigとvalidateConfigをモック
      (mockConfigRepository.loadConfig as jest.Mock).mockResolvedValue(mockConfig);
      (mockConfigRepository.validateConfig as jest.Mock).mockReturnValue({
        isValid: true,
        errors: [],
      });
    });

    it('履歴アイテムの再送信が成功する', async () => {
      const mockHistoryItem = {
        id: 'scan1',
        barcode: '9784567890123',
        title: 'テスト書籍',
        type: ItemType.BOOK,
        status: 'error' as const,
        scannedAt: new Date(),
      };

      const mockItem = new ScannedItem({
        barcode: '9784567890123',
        title: 'テスト書籍',
        author: 'テスト著者',
        type: ItemType.BOOK,
      });

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

      // モックを設定（beforeEachで既に設定されているが、確実に動作するように再設定）
      (mockConfigRepository.loadConfig as jest.Mock).mockResolvedValue(mockConfig);
      (mockConfigRepository.validateConfig as jest.Mock).mockReturnValue({
        isValid: true,
        errors: [],
      });
      (mockFetchBookInfoUseCase.execute as jest.Mock).mockResolvedValue(mockItem);
      (mockNotionRepository.saveItemWithConfig as jest.Mock).mockResolvedValue({
        success: true,
        pageId: 'page123',
      });

      // scanHistoryを設定（モック設定の後に設定）
      mockScanStoreState.scanHistory = [mockHistoryItem];

      const result = await viewModel.resendHistoryItem('scan1');

      expect(result.success).toBe(true);
      expect(mockFetchBookInfoUseCase.execute).toHaveBeenCalledWith('9784567890123');
      expect(mockNotionRepository.saveItemWithConfig).toHaveBeenCalled();
    });

    it('履歴アイテムが見つからない場合、エラーを返す', async () => {
      mockScanStoreState.scanHistory = [];

      const result = await viewModel.resendHistoryItem('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('scanBarcodeが失敗した場合、エラーを返す', async () => {
      const mockHistoryItem = {
        id: 'scan1',
        barcode: '9784567890123',
        title: 'テスト書籍',
        type: ItemType.BOOK,
        status: 'error' as const,
        scannedAt: new Date(),
      };

      mockScanStoreState.scanHistory = [mockHistoryItem];
      (mockFetchBookInfoUseCase.execute as jest.Mock).mockRejectedValue(
        new Error('API error'),
      );

      const result = await viewModel.resendHistoryItem('scan1');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(mockNotionRepository.saveItemWithConfig).not.toHaveBeenCalled();
    });

    it('scanBarcodeがnullを返した場合、エラーを返す', async () => {
      const mockHistoryItem = {
        id: 'scan1',
        barcode: '9784567890123',
        title: 'テスト書籍',
        type: ItemType.BOOK,
        status: 'error' as const,
        scannedAt: new Date(),
      };

      mockScanStoreState.scanHistory = [mockHistoryItem];
      (mockFetchBookInfoUseCase.execute as jest.Mock).mockResolvedValue(null);

      const result = await viewModel.resendHistoryItem('scan1');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(mockNotionRepository.saveItemWithConfig).not.toHaveBeenCalled();
    });
  });

  describe('clearHistory', () => {
    it('履歴をクリアする', async () => {
      await viewModel.clearHistory();

      expect(mockStorageRepository.clearScanHistory).toHaveBeenCalled();
      expect(mockScanStoreState.clearHistory).toHaveBeenCalled();
    });
  });

  describe('getCurrentScannedItem', () => {
    it('現在のスキャンアイテムを取得する', () => {
      const mockItem = new ScannedItem({
        barcode: '9784567890123',
        title: 'テスト書籍',
        author: 'テスト著者',
        type: ItemType.BOOK,
      });

      mockScanStoreState.currentScannedItem = mockItem;

      const result = viewModel.getCurrentScannedItem();

      expect(result).toBe(mockItem);
    });

    it('現在のスキャンアイテムがない場合、nullを返す', () => {
      mockScanStoreState.currentScannedItem = null;

      const result = viewModel.getCurrentScannedItem();

      expect(result).toBeNull();
    });
  });

  describe('getScanHistory', () => {
    it('スキャン履歴を取得する', () => {
      const mockHistory = [
        {
          id: 'scan1',
          barcode: '9784567890123',
          title: 'テスト書籍1',
          type: ItemType.BOOK,
          status: 'sent' as const,
          scannedAt: new Date(),
        },
      ];

      mockScanStoreState.scanHistory = mockHistory;

      const result = viewModel.getScanHistory();

      expect(result).toBe(mockHistory);
    });
  });
});
