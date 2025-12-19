/**
 * 簡素化された設定のリポジトリ
 */

import {SimplifiedConfig} from '@/domain/entities/SimplifiedConfig';
import {MMKVStorage} from '@/data/datasources/MMKVStorage';
import {getEncryptionKeySync} from '@/infrastructure/security/EncryptionKeyManager';
import {
  normalizeDatabaseId,
  normalizePropertyName,
  isValidDatabaseId,
  isValidPropertyName,
} from '@/utils/validation';

const STORAGE_KEY = 'simplified_config';

/**
 * 簡素化された設定のリポジトリ
 */
export class SimplifiedConfigRepository {
  private storage: MMKVStorage;

  constructor(storage?: MMKVStorage) {
    // 既存のMMKVStorageインスタンスを使用、または新規作成
    // 暗号化キーは同期的に取得（後方互換性のため）
    this.storage = storage || new MMKVStorage('default', getEncryptionKeySync());
  }

  /**
   * 設定を保存
   */
  async saveConfig(config: SimplifiedConfig): Promise<void> {
    // サニタイゼーション: Database IDとProperty Mapping名を正規化
    const sanitizedConfig: SimplifiedConfig = {
      ...config,
      databaseId: normalizeDatabaseId(config.databaseId),
      propertyMapping: {
        isbn: normalizePropertyName(config.propertyMapping.isbn),
        title: normalizePropertyName(config.propertyMapping.title),
        author: normalizePropertyName(config.propertyMapping.author),
        imageUrl: normalizePropertyName(config.propertyMapping.imageUrl),
      },
    };

    console.log('[SimplifiedConfigRepository] Saving config:', {
      hasToken: !!sanitizedConfig.notionToken,
      tokenPrefix: sanitizedConfig.notionToken?.substring(0, 10),
      databaseId: sanitizedConfig.databaseId,
      propertyMapping: sanitizedConfig.propertyMapping,
      storageKey: STORAGE_KEY,
    });
    this.storage.setObject(STORAGE_KEY, sanitizedConfig);

    // 保存直後に読み込んで確認
    const saved = this.storage.getObject<SimplifiedConfig>(STORAGE_KEY);
    console.log('[SimplifiedConfigRepository] Verify saved config:', {
      savedSuccessfully: !!saved,
      hasToken: !!saved?.notionToken,
      databaseId: saved?.databaseId,
    });
  }

  /**
   * 設定を読み込み
   */
  async loadConfig(): Promise<SimplifiedConfig | null> {
    console.log('[SimplifiedConfigRepository] Loading config from key:', STORAGE_KEY);
    const config = this.storage.getObject<SimplifiedConfig>(STORAGE_KEY);
    console.log('[SimplifiedConfigRepository] Loaded config:', {
      found: !!config,
      hasToken: !!config?.notionToken,
      tokenPrefix: config?.notionToken?.substring(0, 10),
      databaseId: config?.databaseId,
      propertyMapping: config?.propertyMapping,
    });

    const result = config || null;
    console.log('[SimplifiedConfigRepository] Returning result:', {
      isNull: result === null,
      isUndefined: result === undefined,
      hasToken: !!result?.notionToken,
      databaseId: result?.databaseId,
    });
    return result;
  }

  /**
   * 設定を削除
   */
  async deleteConfig(): Promise<void> {
    this.storage.delete(STORAGE_KEY);
  }

  /**
   * 設定の完全性を検証
   */
  validateConfig(config: SimplifiedConfig): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Token検証
    if (!config.notionToken || config.notionToken.trim() === '') {
      errors.push('Notion Tokenが入力されていません');
    }

    // DatabaseID検証（UUID形式）
    // NotionのデータベースIDは32文字のハイフンなしUUIDまたは36文字のハイフンありUUID
    if (!config.databaseId || config.databaseId.trim() === '') {
      errors.push('データベースIDが入力されていません');
    } else {
      if (!isValidDatabaseId(config.databaseId)) {
        errors.push('データベースIDの形式が正しくありません（UUID形式）');
      }
    }

    // PropertyMapping検証
    if (!config.propertyMapping.isbn || !isValidPropertyName(config.propertyMapping.isbn)) {
      errors.push('ISBNプロパティ名が入力されていません');
    }
    if (!config.propertyMapping.title || !isValidPropertyName(config.propertyMapping.title)) {
      errors.push('タイトルプロパティ名が入力されていません');
    }
    if (!config.propertyMapping.author || !isValidPropertyName(config.propertyMapping.author)) {
      errors.push('著者プロパティ名が入力されていません');
    }
    if (!config.propertyMapping.imageUrl || !isValidPropertyName(config.propertyMapping.imageUrl)) {
      errors.push('書影プロパティ名が入力されていません');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

