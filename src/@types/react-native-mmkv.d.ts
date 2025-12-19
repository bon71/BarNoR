/**
 * react-native-mmkv type augmentation
 * 追加のメソッドを型定義に追加
 */

declare module 'react-native-mmkv' {
  export interface MMKVConfiguration {
    id: string;
    encryptionKey?: string;
  }

  export class MMKV {
    constructor(configuration: MMKVConfiguration);

    set(key: string, value: string | number | boolean): void;
    getString(key: string): string | undefined;
    getNumber(key: string): number | undefined;
    getBoolean(key: string): boolean | undefined;
    delete(key: string): void;
    clearAll(): void;
    getAllKeys(): string[];
    contains(key: string): boolean;
  }
}
