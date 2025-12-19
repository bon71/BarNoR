/**
 * ViewModelProvider テスト
 */

import {
  simplifiedConfigRepository,
  authViewModel,
  scanViewModel,
  createAuthViewModel,
  createScanViewModel,
} from '@/presentation/providers/ViewModelProvider';
import {NotionRepository} from '@/data/repositories/NotionRepository';
import {StorageRepository} from '@/data/repositories/StorageRepository';
import {SimplifiedConfigRepository} from '@/data/repositories/SimplifiedConfigRepository';
import {FetchBookInfoUseCase} from '@/domain/usecases/FetchBookInfoUseCase';

// 依存関係のモック
jest.mock('@/data/datasources/OpenBDAPI');
jest.mock('@/data/datasources/NotionAPI');
jest.mock('@/data/datasources/MMKVStorage');
jest.mock('@/data/repositories/BookInfoRepository');
jest.mock('@/data/repositories/NotionRepository');
jest.mock('@/data/repositories/StorageRepository');
jest.mock('@/data/repositories/SimplifiedConfigRepository');
jest.mock('@/domain/usecases/FetchBookInfoUseCase');
jest.mock('@/presentation/viewmodels/AuthViewModel');
jest.mock('@/presentation/viewmodels/ScanViewModel');
jest.mock('@/infrastructure/security/EncryptionKeyManager', () => ({
  getEncryptionKey: jest.fn(() => Promise.resolve('test-key')),
  getEncryptionKeySync: jest.fn(() => 'test-key'),
  validateEncryptionKey: jest.fn((key: string) => key.length >= 16),
}));

describe('ViewModelProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // モジュールをリロードして内部状態をリセット
    jest.resetModules();
  });

  describe('simplifiedConfigRepository', () => {
    it('初回アクセス時に初期化される', () => {
      // プロパティにアクセスすると初期化される
      expect(simplifiedConfigRepository).toBeDefined();
    });

    it('2回目のアクセスでも同じインスタンスを返す', () => {
      const repo1 = simplifiedConfigRepository;
      const repo2 = simplifiedConfigRepository;
      expect(repo1).toBe(repo2);
    });
  });

  describe('authViewModel', () => {
    it('初回アクセス時に初期化される', () => {
      expect(authViewModel).toBeDefined();
    });

    it('2回目のアクセスでも同じインスタンスを返す', () => {
      const vm1 = authViewModel;
      const vm2 = authViewModel;
      expect(vm1).toBe(vm2);
    });
  });

  describe('scanViewModel', () => {
    it('初回アクセス時に初期化される', () => {
      expect(scanViewModel).toBeDefined();
    });

    it('2回目のアクセスでも同じインスタンスを返す', () => {
      const vm1 = scanViewModel;
      const vm2 = scanViewModel;
      expect(vm1).toBe(vm2);
    });
  });

  describe('createAuthViewModel', () => {
    it('カスタムリポジトリを指定できる', () => {
      const customNotionRepo = {} as NotionRepository;
      const customStorageRepo = {} as StorageRepository;

      const vm = createAuthViewModel(customNotionRepo, customStorageRepo);
      expect(vm).toBeDefined();
    });

    it('カスタムリポジトリを指定しない場合、デフォルトを使用する', () => {
      const vm = createAuthViewModel();
      expect(vm).toBeDefined();
    });
  });

  describe('createScanViewModel', () => {
    it('カスタム依存関係を指定できる', () => {
      const customUseCase = {} as FetchBookInfoUseCase;
      const customNotionRepo = {} as NotionRepository;
      const customConfigRepo = {} as SimplifiedConfigRepository;
      const customStorageRepo = {} as StorageRepository;

      const vm = createScanViewModel(
        customUseCase,
        customNotionRepo,
        customConfigRepo,
        customStorageRepo,
      );
      expect(vm).toBeDefined();
    });

    it('カスタム依存関係を指定しない場合、デフォルトを使用する', () => {
      const vm = createScanViewModel();
      expect(vm).toBeDefined();
    });
  });
});

