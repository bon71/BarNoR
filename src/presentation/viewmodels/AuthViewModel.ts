/**
 * 認証ViewModel
 * Notion Integration Token管理のビジネスロジック
 */

import {INotionRepository} from '@/domain/repositories/INotionRepository';
import {IStorageRepository} from '@/domain/repositories/IStorageRepository';
import {useAuthStore} from '@/presentation/stores/useAuthStore';
import {
  getUserFriendlyErrorMessage,
  formatErrorMessage,
  getErrorMessage,
  ErrorType,
} from '@/utils/errorMessages';
import {isValidNotionToken} from '@/utils/validation';

export class AuthViewModel {
  constructor(
    private readonly notionRepository: INotionRepository,
    private readonly storageRepository: IStorageRepository,
  ) {}

  /**
   * アプリ起動時にトークンを読み込む
   */
  async loadToken(): Promise<void> {
    try {
      const token = await this.storageRepository.getNotionToken();
      if (token) {
        // トークンの有効性を検証
        const isValid = await this.notionRepository.validateToken(token);
        if (isValid) {
          useAuthStore.getState().setNotionToken(token);
        } else {
          // 無効なトークンは削除
          await this.storageRepository.deleteNotionToken();
        }
      }
    } catch (error) {
      console.error('Failed to load token:', error);
      throw error;
    }
  }

  /**
   * Notion Integration Tokenを保存
   */
  async saveToken(token: string): Promise<{success: boolean; error?: string}> {
    try {
      // トークンの形式検証（先に実施）
      if (!isValidNotionToken(token)) {
        const friendly = getErrorMessage(ErrorType.AUTH_INVALID_TOKEN);
        return {success: false, error: formatErrorMessage(friendly)};
      }

      // トークンの有効性を検証（API呼び出し）
      const isValid = await this.notionRepository.validateToken(token);
      if (!isValid) {
        const friendly = getErrorMessage(ErrorType.AUTH_INVALID_TOKEN);
        return {success: false, error: formatErrorMessage(friendly)};
      }

      // トークンを保存
      await this.storageRepository.saveNotionToken(token);
      useAuthStore.getState().setNotionToken(token);

      return {success: true};
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      const friendly = getUserFriendlyErrorMessage(err);
      return {success: false, error: formatErrorMessage(friendly)};
    }
  }

  /**
   * ログアウト（トークンを削除）
   */
  async logout(): Promise<void> {
    try {
      await this.storageRepository.deleteNotionToken();
      useAuthStore.getState().clearNotionToken();
    } catch (error) {
      console.error('Failed to logout:', error);
      throw error;
    }
  }

  /**
   * 現在の認証状態を取得
   */
  isAuthenticated(): boolean {
    return useAuthStore.getState().isAuthenticated;
  }

  /**
   * 現在のトークンを取得
   */
  getToken(): string | null {
    return useAuthStore.getState().notionToken;
  }

  /**
   * 利用可能なデータベース一覧を取得
   */
  async getDatabases(): Promise<{
    success: boolean;
    databases?: Array<{id: string; name: string}>;
    error?: string;
  }> {
    try {
      const token = this.getToken();
      if (!token) {
        return {
          success: false,
          error: 'Notionトークンが設定されていません',
        };
      }

      const databases = await this.notionRepository.listDatabases(token);

      // NotionDatabaseをUIで使う形式に変換
      const formattedDatabases = databases.map(db => ({
        id: db.id,
        name: db.title,
      }));

      return {success: true, databases: formattedDatabases};
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      const friendly = getUserFriendlyErrorMessage(err);
      return {success: false, error: formatErrorMessage(friendly)};
    }
  }
}
