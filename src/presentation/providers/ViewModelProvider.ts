/**
 * ViewModel Provider
 * 依存性注入コンテナ - シングルトンインスタンスを提供（遅延初期化）
 */

import {OpenBDAPI} from '@/data/datasources/OpenBDAPI';
import {NotionAPI} from '@/data/datasources/NotionAPI';
import {MMKVStorage} from '@/data/datasources/MMKVStorage';
import {BookInfoRepository} from '@/data/repositories/BookInfoRepository';
import {NotionRepository} from '@/data/repositories/NotionRepository';
import {StorageRepository} from '@/data/repositories/StorageRepository';
import {SimplifiedConfigRepository} from '@/data/repositories/SimplifiedConfigRepository';
import {FetchBookInfoUseCase} from '@/domain/usecases/FetchBookInfoUseCase';
import {AuthViewModel} from '@/presentation/viewmodels/AuthViewModel';
import {ScanViewModel} from '@/presentation/viewmodels/ScanViewModel';

/**
 * 遅延初期化用の変数
 */
let _openBDAPI: OpenBDAPI | null = null;
let _notionAPI: NotionAPI | null = null;
let _mmkvStorage: MMKVStorage | null = null;
let _bookInfoRepository: BookInfoRepository | null = null;
let _notionRepository: NotionRepository | null = null;
let _storageRepository: StorageRepository | null = null;
let _simplifiedConfigRepository: SimplifiedConfigRepository | null = null;
let _fetchBookInfoUseCase: FetchBookInfoUseCase | null = null;
let _authViewModel: AuthViewModel | null = null;
let _scanViewModel: ScanViewModel | null = null;

/**
 * インスタンスを初期化（遅延初期化）
 */
function initializeInstances(): void {
  if (_mmkvStorage) {
    return; // 既に初期化済み
  }

  // Datasourceのシングルトンインスタンス
  _openBDAPI = new OpenBDAPI();
  _notionAPI = new NotionAPI();
  // 暗号化キーは同期的に取得（後方互換性のため）
  // 本番環境では非同期のgetEncryptionKey()を使用することを推奨
  const {getEncryptionKeySync} = require('@/infrastructure/security/EncryptionKeyManager');
  _mmkvStorage = new MMKVStorage('default', getEncryptionKeySync());

  // Repositoryのシングルトンインスタンス
  _bookInfoRepository = new BookInfoRepository(_openBDAPI);
  _notionRepository = new NotionRepository(_notionAPI);
  _storageRepository = new StorageRepository(_mmkvStorage);
  _simplifiedConfigRepository = new SimplifiedConfigRepository(_mmkvStorage);

  // UseCaseのシングルトンインスタンス
  _fetchBookInfoUseCase = new FetchBookInfoUseCase(_bookInfoRepository);

  // ViewModelのシングルトンインスタンス
  _authViewModel = new AuthViewModel(_notionRepository, _storageRepository);
  _scanViewModel = new ScanViewModel(
    _fetchBookInfoUseCase,
    _notionRepository,
    _simplifiedConfigRepository,
    _storageRepository,
  );
}

/**
 * Repositoryのシングルトンインスタンスをエクスポート（App.tsxで使用）
 * 初回アクセス時に初期化される
 */
export const simplifiedConfigRepository = new Proxy({} as SimplifiedConfigRepository, {
  get(_target, prop) {
    if (!_simplifiedConfigRepository) {
      initializeInstances();
    }
    const value = (_simplifiedConfigRepository as any)[prop];
    // メソッドの場合は this をバインド
    if (typeof value === 'function') {
      return value.bind(_simplifiedConfigRepository);
    }
    return value;
  },
});

export const storageRepository = new Proxy({} as StorageRepository, {
  get(_target, prop) {
    if (!_storageRepository) {
      initializeInstances();
    }
    const value = (_storageRepository as any)[prop];
    // メソッドの場合は this をバインド
    if (typeof value === 'function') {
      return value.bind(_storageRepository);
    }
    return value;
  },
});

/**
 * ViewModelのシングルトンインスタンス（遅延初期化）
 */
export const authViewModel = new Proxy({} as AuthViewModel, {
  get(_target, prop) {
    if (!_authViewModel) {
      initializeInstances();
    }
    const value = (_authViewModel as any)[prop];
    // メソッドの場合は this をバインド
    if (typeof value === 'function') {
      return value.bind(_authViewModel);
    }
    return value;
  },
});

export const scanViewModel = new Proxy({} as ScanViewModel, {
  get(_target, prop) {
    if (!_scanViewModel) {
      initializeInstances();
    }
    const value = (_scanViewModel as any)[prop];
    // メソッドの場合は this をバインド
    if (typeof value === 'function') {
      return value.bind(_scanViewModel);
    }
    return value;
  },
});

/**
 * テスト用: 依存性を注入したカスタムViewModelを作成
 */
export const createAuthViewModel = (
  customNotionRepo?: NotionRepository,
  customStorageRepo?: StorageRepository,
) => {
  initializeInstances();
  return new AuthViewModel(
    customNotionRepo || _notionRepository!,
    customStorageRepo || _storageRepository!,
  );
};

export const createScanViewModel = (
  customFetchBookInfoUseCase?: FetchBookInfoUseCase,
  customNotionRepo?: NotionRepository,
  customConfigRepo?: SimplifiedConfigRepository,
  customStorageRepo?: StorageRepository,
) => {
  initializeInstances();
  return new ScanViewModel(
    customFetchBookInfoUseCase || _fetchBookInfoUseCase!,
    customNotionRepo || _notionRepository!,
    customConfigRepo || _simplifiedConfigRepository!,
    customStorageRepo || _storageRepository!,
  );
};
