/**
 * SimplifiedConfigRepository テスト
 */

import {SimplifiedConfigRepository} from '@/data/repositories/SimplifiedConfigRepository';
import {MMKVStorage} from '@/data/datasources/MMKVStorage';
import {SimplifiedConfig} from '@/domain/entities/SimplifiedConfig';

jest.mock('@/data/datasources/MMKVStorage');

describe('SimplifiedConfigRepository', () => {
  let repository: SimplifiedConfigRepository;
  let mockStorage: jest.Mocked<MMKVStorage>;

  beforeEach(() => {
    mockStorage = {
      setObject: jest.fn(),
      getObject: jest.fn(),
      delete: jest.fn(),
    } as any;

    repository = new SimplifiedConfigRepository(mockStorage);
  });

  describe('saveConfig', () => {
    it('設定を正常に保存できる', async () => {
      const config: SimplifiedConfig = {
        notionToken: 'secret_test123',
        databaseId: '12345678-1234-1234-1234-123456789012',
        propertyMapping: {
          title: 'タイトル',
          author: '著者名',
          isbn: 'ISBN',
          imageUrl: '書影',
        },
      };

      await repository.saveConfig(config);

      // サニタイズされた設定が保存されることを確認
      expect(mockStorage.setObject).toHaveBeenCalledWith(
        'simplified_config',
        expect.objectContaining({
          notionToken: 'secret_test123',
          databaseId: expect.stringMatching(/^[0-9a-f]{32}$/), // ハイフンなしUUID
          propertyMapping: expect.objectContaining({
            title: 'タイトル',
            author: '著者名',
            isbn: 'ISBN',
            imageUrl: '書影',
          }),
        }),
      );
    });
  });

  describe('loadConfig', () => {
    it('設定を正常に読み込める', async () => {
      const config: SimplifiedConfig = {
        notionToken: 'secret_test123',
        databaseId: '12345678-1234-1234-1234-123456789012',
        propertyMapping: {
          title: 'タイトル',
          author: '著者名',
          isbn: 'ISBN',
          imageUrl: '書影',
        },
      };

      (mockStorage.getObject as jest.Mock).mockReturnValue(config);

      const result = await repository.loadConfig();

      expect(result).toEqual(config);
      expect(mockStorage.getObject).toHaveBeenCalledWith('simplified_config');
    });

    it('設定がない場合はnullを返す', async () => {
      (mockStorage.getObject as jest.Mock).mockReturnValue(null);

      const result = await repository.loadConfig();

      expect(result).toBeNull();
    });

    it('設定がundefinedの場合はnullを返す', async () => {
      (mockStorage.getObject as jest.Mock).mockReturnValue(undefined);

      const result = await repository.loadConfig();

      expect(result).toBeNull();
    });
  });

  describe('deleteConfig', () => {
    it('設定を削除できる', async () => {
      await repository.deleteConfig();

      expect(mockStorage.delete).toHaveBeenCalledWith('simplified_config');
    });
  });

  describe('validateConfig', () => {
    it('正しい設定はバリデーション通過', () => {
      const config: SimplifiedConfig = {
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
      const config: SimplifiedConfig = {
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
      const config: SimplifiedConfig = {
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
      expect(result.errors).toContain('データベースIDの形式が正しくありません（UUID形式）');
    });

    it('プロパティマッピング不完全時はエラー', () => {
      const config: SimplifiedConfig = {
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
      expect(result.errors).toContain('タイトルプロパティ名が入力されていません');
      expect(result.errors).toContain('ISBNプロパティ名が入力されていません');
    });
  });
});

