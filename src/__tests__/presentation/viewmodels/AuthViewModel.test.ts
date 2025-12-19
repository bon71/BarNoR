/**
 * AuthViewModelのテスト
 */

import {AuthViewModel} from '@/presentation/viewmodels/AuthViewModel';
import {INotionRepository} from '@/domain/repositories/INotionRepository';
import {IStorageRepository} from '@/domain/repositories/IStorageRepository';
import {useAuthStore} from '@/presentation/stores/useAuthStore';

// モックの作成
const mockNotionRepository: jest.Mocked<INotionRepository> = {
  validateToken: jest.fn(),
  listDatabases: jest.fn(),
  getDatabase: jest.fn(),
  getDatabaseProperties: jest.fn(),
  saveItem: jest.fn(),
  saveItemWithConfig: jest.fn(),
  queryDatabasePages: jest.fn(),
};

const mockStorageRepository: jest.Mocked<IStorageRepository> = {
  getNotionToken: jest.fn(),
  saveNotionToken: jest.fn(),
  deleteNotionToken: jest.fn(),
  getPackages: jest.fn(),
  savePackages: jest.fn(),
  getScanHistory: jest.fn(),
  saveScanHistory: jest.fn(),
  clearScanHistory: jest.fn(),
};

describe('AuthViewModel', () => {
  let viewModel: AuthViewModel;

  beforeEach(() => {
    jest.clearAllMocks();
    // ストアをリセット
    useAuthStore.getState().clearNotionToken();
    viewModel = new AuthViewModel(mockNotionRepository, mockStorageRepository);
  });

  describe('loadToken', () => {
    it('有効なトークンを読み込める', async () => {
      // Arrange
      const token = 'valid-token';
      mockStorageRepository.getNotionToken.mockResolvedValue(token);
      mockNotionRepository.validateToken.mockResolvedValue(true);

      // Act
      await viewModel.loadToken();

      // Assert
      expect(mockStorageRepository.getNotionToken).toHaveBeenCalled();
      expect(mockNotionRepository.validateToken).toHaveBeenCalledWith(token);
      expect(useAuthStore.getState().notionToken).toBe(token);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it('トークンが存在しない場合は何もしない', async () => {
      // Arrange
      mockStorageRepository.getNotionToken.mockResolvedValue(null);

      // Act
      await viewModel.loadToken();

      // Assert
      expect(mockNotionRepository.validateToken).not.toHaveBeenCalled();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('無効なトークンは削除される', async () => {
      // Arrange
      const token = 'invalid-token';
      mockStorageRepository.getNotionToken.mockResolvedValue(token);
      mockNotionRepository.validateToken.mockResolvedValue(false);

      // Act
      await viewModel.loadToken();

      // Assert
      expect(mockStorageRepository.deleteNotionToken).toHaveBeenCalled();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('読み込みエラー時は例外をスローする', async () => {
      // Arrange
      const error = new Error('Storage error');
      mockStorageRepository.getNotionToken.mockRejectedValue(error);

      // Act & Assert
      await expect(viewModel.loadToken()).rejects.toThrow('Storage error');
    });
  });

  describe('saveToken', () => {
    it('有効なトークンを保存できる', async () => {
      // Arrange
      const token = 'secret_valid_token_12345'; // isValidNotionTokenの形式チェックを通過する形式
      mockNotionRepository.validateToken.mockResolvedValue(true);

      // Act
      const result = await viewModel.saveToken(token);

      // Assert
      expect(mockNotionRepository.validateToken).toHaveBeenCalledWith(token);
      expect(mockStorageRepository.saveNotionToken).toHaveBeenCalledWith(
        token,
      );
      expect(result.success).toBe(true);
      expect(useAuthStore.getState().notionToken).toBe(token);
    });

    it('無効なトークンは保存されない', async () => {
      // Arrange
      const token = 'secret_invalid_token_12345'; // 形式チェックは通過するが、validateTokenで無効と判定される
      mockNotionRepository.validateToken.mockResolvedValue(false);

      // Act
      const result = await viewModel.saveToken(token);

      // Assert
      expect(mockStorageRepository.saveNotionToken).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.error).toBe(
        'Notion Integration Tokenが無効です\n\n正しいトークンを入力してください',
      );
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('保存エラー時はフレンドリーメッセージを返す', async () => {
      // Arrange
      const token = 'secret_valid_token_12345'; // isValidNotionTokenの形式チェックを通過する形式
      mockNotionRepository.validateToken.mockResolvedValue(true);
      mockStorageRepository.saveNotionToken.mockRejectedValue(
        new Error('Storage write error'), // detectErrorTypeでSTORAGE_WRITE_ERRORと判定されるメッセージ
      );

      // Act
      const result = await viewModel.saveToken(token);

      // Assert
      expect(result.success).toBe(false);
      // detectErrorTypeが'Storage write error'をSTORAGE_WRITE_ERRORと判定するため、
      // ストレージエラーのメッセージが返される
      expect(result.error).toContain('ストレージ');
    });
  });

  describe('logout', () => {
    it('ログアウトできる', async () => {
      // Arrange
      useAuthStore.getState().setNotionToken('test-token');

      // Act
      await viewModel.logout();

      // Assert
      expect(mockStorageRepository.deleteNotionToken).toHaveBeenCalled();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().notionToken).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('認証状態を取得できる', () => {
      // Arrange
      useAuthStore.getState().setNotionToken('test-token');

      // Act
      const result = viewModel.isAuthenticated();

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('getToken', () => {
    it('トークンを取得できる', () => {
      // Arrange
      const token = 'test-token';
      useAuthStore.getState().setNotionToken(token);

      // Act
      const result = viewModel.getToken();

      // Assert
      expect(result).toBe(token);
    });

    it('トークンが存在しない場合はnullを返す', () => {
      // Arrange
      useAuthStore.getState().clearNotionToken();

      // Act
      const result = viewModel.getToken();

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getDatabases', () => {
    it('データベース一覧を取得できる', async () => {
      // Arrange
      const token = 'test-token';
      useAuthStore.getState().setNotionToken(token);
      const mockDatabases = [
        {id: 'db-1', title: 'Database 1'},
        {id: 'db-2', title: 'Database 2'},
      ];
      mockNotionRepository.listDatabases.mockResolvedValue(mockDatabases);

      // Act
      const result = await viewModel.getDatabases();

      // Assert
      expect(result.success).toBe(true);
      expect(result.databases).toEqual([
        {id: 'db-1', name: 'Database 1'},
        {id: 'db-2', name: 'Database 2'},
      ]);
      expect(mockNotionRepository.listDatabases).toHaveBeenCalledWith(token);
    });

    it('トークンが存在しない場合はエラーを返す', async () => {
      // Arrange
      useAuthStore.getState().clearNotionToken();

      // Act
      const result = await viewModel.getDatabases();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Notionトークンが設定されていません');
      expect(mockNotionRepository.listDatabases).not.toHaveBeenCalled();
    });

    it('エラー発生時はフレンドリーメッセージを返す', async () => {
      // Arrange
      const token = 'test-token';
      useAuthStore.getState().setNotionToken(token);
      const error = new Error('Network error');
      mockNotionRepository.listDatabases.mockRejectedValue(error);

      // Act
      const result = await viewModel.getDatabases();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(typeof result.error).toBe('string');
    });

    it('logoutエラー時は例外をスローする', async () => {
      // Arrange
      useAuthStore.getState().setNotionToken('test-token');
      const error = new Error('Storage error');
      mockStorageRepository.deleteNotionToken.mockRejectedValue(error);

      // Act & Assert
      await expect(viewModel.logout()).rejects.toThrow('Storage error');
    });
  });
});
