/**
 * MMKVStorageのテスト
 */

import {MMKVStorage} from '@/data/datasources/MMKVStorage';
import {MMKV} from 'react-native-mmkv';

// MMKVは既にjest.setup.jsでモック済み

describe('MMKVStorage', () => {
  let storage: MMKVStorage;
  let mockMMKV: jest.Mocked<MMKV>;

  beforeEach(() => {
    jest.clearAllMocks();
    storage = new MMKVStorage('test-storage', 'test-key');
    // MMKVコンストラクタから返されるインスタンスを取得
    mockMMKV = (storage as any).storage as jest.Mocked<MMKV>;
  });

  describe('文字列操作', () => {
    it('文字列を保存できる', () => {
      // Arrange
      const key = 'test-key';
      const value = 'test-value';

      // Act
      storage.set(key, value);

      // Assert
      expect(mockMMKV.set).toHaveBeenCalledWith(key, value);
    });

    it('文字列を取得できる', () => {
      // Arrange
      const key = 'test-key';
      const value = 'test-value';
      mockMMKV.getString = jest.fn().mockReturnValue(value);

      // Act
      const result = storage.get(key);

      // Assert
      expect(mockMMKV.getString).toHaveBeenCalledWith(key);
      expect(result).toBe(value);
    });
  });

  describe('数値操作', () => {
    it('数値を保存できる', () => {
      // Arrange
      const key = 'test-number';
      const value = 42;

      // Act
      storage.setNumber(key, value);

      // Assert
      expect(mockMMKV.set).toHaveBeenCalledWith(key, value);
    });

    it('数値を取得できる', () => {
      // Arrange
      const key = 'test-number';
      const value = 42;
      mockMMKV.getNumber = jest.fn().mockReturnValue(value);

      // Act
      const result = storage.getNumber(key);

      // Assert
      expect(mockMMKV.getNumber).toHaveBeenCalledWith(key);
      expect(result).toBe(value);
    });
  });

  describe('真偽値操作', () => {
    it('真偽値を保存できる', () => {
      // Arrange
      const key = 'test-boolean';
      const value = true;

      // Act
      storage.setBoolean(key, value);

      // Assert
      expect(mockMMKV.set).toHaveBeenCalledWith(key, value);
    });

    it('真偽値を取得できる', () => {
      // Arrange
      const key = 'test-boolean';
      const value = true;
      mockMMKV.getBoolean = jest.fn().mockReturnValue(value);

      // Act
      const result = storage.getBoolean(key);

      // Assert
      expect(mockMMKV.getBoolean).toHaveBeenCalledWith(key);
      expect(result).toBe(value);
    });
  });

  describe('オブジェクト操作', () => {
    it('オブジェクトを保存できる', () => {
      // Arrange
      const key = 'test-object';
      const value = {name: 'Test', age: 30};

      // Act
      storage.setObject(key, value);

      // Assert
      expect(mockMMKV.set).toHaveBeenCalledWith(
        key,
        JSON.stringify(value),
      );
    });

    it('オブジェクトを取得できる', () => {
      // Arrange
      const key = 'test-object';
      const value = {name: 'Test', age: 30};
      mockMMKV.getString = jest.fn().mockReturnValue(JSON.stringify(value));

      // Act
      const result = storage.getObject(key);

      // Assert
      expect(mockMMKV.getString).toHaveBeenCalledWith(key);
      expect(result).toEqual(value);
    });

    it('データが存在しない場合はundefinedを返す', () => {
      // Arrange
      const key = 'non-existent';
      mockMMKV.getString = jest.fn().mockReturnValue(undefined);

      // Act
      const result = storage.getObject(key);

      // Assert
      expect(result).toBeUndefined();
    });

    it('JSONパースに失敗した場合はundefinedを返す', () => {
      // Arrange
      const key = 'invalid-json';
      mockMMKV.getString = jest.fn().mockReturnValue('invalid json');
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      const result = storage.getObject(key);

      // Assert
      expect(result).toBeUndefined();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('削除・クリア操作', () => {
    it('キーを削除できる', () => {
      // Arrange
      const key = 'test-key';

      // Act
      storage.delete(key);

      // Assert
      expect(mockMMKV.delete).toHaveBeenCalledWith(key);
    });

    it('全てのデータをクリアできる', () => {
      // Act
      storage.clearAll();

      // Assert
      expect(mockMMKV.clearAll).toHaveBeenCalled();
    });
  });

  describe('その他の操作', () => {
    it('全てのキーを取得できる', () => {
      // Arrange
      const keys = ['key1', 'key2', 'key3'];
      mockMMKV.getAllKeys = jest.fn().mockReturnValue(keys);

      // Act
      const result = storage.getAllKeys();

      // Assert
      expect(mockMMKV.getAllKeys).toHaveBeenCalled();
      expect(result).toEqual(keys);
    });

    it('キーが存在するか確認できる', () => {
      // Arrange
      const key = 'test-key';
      mockMMKV.contains = jest.fn().mockReturnValue(true);

      // Act
      const result = storage.contains(key);

      // Assert
      expect(mockMMKV.contains).toHaveBeenCalledWith(key);
      expect(result).toBe(true);
    });
  });

  describe('IStorageRepositoryインターフェース互換メソッド', () => {
    it('setItemで文字列を保存できる', () => {
      const key = 'test-key';
      const value = 'test-value';

      storage.setItem(key, value);

      expect(mockMMKV.set).toHaveBeenCalledWith(key, value);
    });

    it('getItemで文字列を取得できる', () => {
      const key = 'test-key';
      const value = 'test-value';
      mockMMKV.getString = jest.fn().mockReturnValue(value);

      const result = storage.getItem(key);

      expect(result).toBe(value);
    });

    it('getItemでデータが存在しない場合はnullを返す', () => {
      const key = 'non-existent';
      mockMMKV.getString = jest.fn().mockReturnValue(undefined);

      const result = storage.getItem(key);

      expect(result).toBeNull();
    });

    it('removeItemでキーを削除できる', () => {
      const key = 'test-key';

      storage.removeItem(key);

      expect(mockMMKV.delete).toHaveBeenCalledWith(key);
    });

    it('clearで全てのデータをクリアできる', () => {
      storage.clear();

      expect(mockMMKV.clearAll).toHaveBeenCalled();
    });
  });

  describe('getInstance', () => {
    it('シングルトンインスタンスを返す', () => {
      const instance1 = MMKVStorage.getInstance();
      const instance2 = MMKVStorage.getInstance();

      expect(instance1).toBe(instance2);
    });
  });
});
