/**
 * MMKV暗号化ストレージ
 * React Native MMKVを使用した暗号化されたローカルストレージ
 */

import {MMKV} from 'react-native-mmkv';

export class MMKVStorage {
  private static instance: MMKVStorage;
  private storage: MMKV;

  constructor(storageId?: string, encryptionKey?: string) {
    this.storage = new MMKV({
      id: storageId || 'default',
      encryptionKey: encryptionKey,
    });
  }

  /**
   * シングルトンインスタンスを取得
   */
  static getInstance(): MMKVStorage {
    if (!MMKVStorage.instance) {
      MMKVStorage.instance = new MMKVStorage();
    }
    return MMKVStorage.instance;
  }

  /**
   * IStorageRepositoryインターフェース互換のメソッド
   */
  setItem(key: string, value: string): void {
    this.set(key, value);
  }

  getItem(key: string): string | null {
    return this.get(key) || null;
  }

  removeItem(key: string): void {
    this.delete(key);
  }

  clear(): void {
    this.clearAll();
  }

  /**
   * 文字列を保存
   */
  set(key: string, value: string): void {
    this.storage.set(key, value);
  }

  /**
   * 文字列を取得
   */
  get(key: string): string | undefined {
    return this.storage.getString(key);
  }

  /**
   * 数値を保存
   */
  setNumber(key: string, value: number): void {
    this.storage.set(key, value);
  }

  /**
   * 数値を取得
   */
  getNumber(key: string): number | undefined {
    return this.storage.getNumber(key);
  }

  /**
   * 真偽値を保存
   */
  setBoolean(key: string, value: boolean): void {
    this.storage.set(key, value);
  }

  /**
   * 真偽値を取得
   */
  getBoolean(key: string): boolean | undefined {
    return this.storage.getBoolean(key);
  }

  /**
   * オブジェクトを保存（JSON文字列として）
   */
  setObject<T>(key: string, value: T): void {
    this.storage.set(key, JSON.stringify(value));
  }

  /**
   * オブジェクトを取得（JSON文字列から）
   */
  getObject<T>(key: string): T | undefined {
    const jsonString = this.storage.getString(key);
    if (!jsonString) {
      return undefined;
    }
    try {
      return JSON.parse(jsonString) as T;
    } catch (error) {
      console.error('Failed to parse JSON:', error);
      return undefined;
    }
  }

  /**
   * キーを削除
   */
  delete(key: string): void {
    this.storage.delete(key);
  }

  /**
   * 全てのデータをクリア
   */
  clearAll(): void {
    this.storage.clearAll();
  }

  /**
   * 全てのキーを取得
   */
  getAllKeys(): string[] {
    return this.storage.getAllKeys();
  }

  /**
   * キーが存在するか確認
   */
  contains(key: string): boolean {
    return this.storage.contains(key);
  }
}
