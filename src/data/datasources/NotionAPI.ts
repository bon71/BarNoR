/**
 * Notion API クライアント
 * Notion APIとの通信を担当
 */

import {env} from '@/config/env';
import {apiFetch} from '@/utils/apiClient';
import {USER_FRIENDLY_ERRORS} from '@/utils/errorMessages';

export interface NotionDatabaseResponse {
  object: 'database';
  id: string;
  title: Array<{
    type: 'text';
    text: {
      content: string;
    };
  }>;
  properties?: {
    [key: string]: {
      id: string;
      name?: string;
      type: string;
    };
  };
  data_sources?: Array<{
    id: string;
    name: string;
  }>;
}

export interface NotionDataSourceDetailResponse {
  object: 'data_source';
  id: string;
  name: string;
  properties: {
    [key: string]: {
      id: string;
      name?: string;
      type: string;
    };
  };
}

export interface NotionDataSourceResponse {
  object: 'data_source';
  id: string;
  title: Array<{
    type: 'text';
    text: {
      content: string;
    };
  }>;
  parent: {
    type: 'database_id';
    database_id: string;
  };
}

export interface NotionSearchResponse {
  results: (NotionDatabaseResponse | NotionDataSourceResponse)[];
  has_more: boolean;
  next_cursor: string | null;
}

export interface NotionPageCreateResponse {
  object: 'page';
  id: string;
}

export interface NotionErrorResponse {
  object: 'error';
  status: number;
  code: string;
  message: string;
}

export interface NotionPage {
  object: 'page';
  id: string;
  created_time: string;
  last_edited_time: string;
  properties: Record<string, any>;
}

export interface NotionQueryDatabaseResponse {
  object: 'list';
  results: NotionPage[];
  has_more: boolean;
  next_cursor: string | null;
}

export class NotionAPI {
  private baseUrl: string;
  private version: string;

  constructor(baseUrl?: string, version?: string) {
    this.baseUrl = baseUrl || env.notionApiUrl;
    this.version = version || '2025-09-03';
  }

  /**
   * 共通のヘッダーを生成
   */
  private getHeaders(token: string): Record<string, string> {
    return {
      'Authorization': `Bearer ${token}`,
      'Notion-Version': this.version,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Integration Tokenの検証
   */
  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await apiFetch(`${this.baseUrl}/users/me`, {
        headers: this.getHeaders(token),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to validate Notion token:', error);
      return false;
    }
  }

  /**
   * データベース検索
   */
  async searchDatabases(
    token: string,
  ): Promise<NotionSearchResponse | null> {
    try {
      const response = await apiFetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: this.getHeaders(token),
        body: JSON.stringify({
          filter: {
            value: 'data_source',
            property: 'object',
          },
          page_size: 100,
        }),
      });

      if (!response.ok) {
        const error = await response.json() as NotionErrorResponse;
        console.error('[NotionAPI] Search databases error:', error);
        const friendlyMessage = this.getFriendlyErrorMessage(error);
        throw new Error(friendlyMessage);
      }

      const result = await response.json() as NotionSearchResponse;
      console.log('[NotionAPI] Search databases result:', {
        resultsCount: result.results.length,
        hasMore: result.has_more,
        results: result.results.map(r => ({
          object: r.object,
          id: r.object === 'data_source' ? (r as NotionDataSourceResponse).parent.database_id : r.id,
          title: r.object === 'data_source' || r.object === 'database' ? r.title?.[0]?.text?.content : undefined,
        })),
      });

      return result;
    } catch (error) {
      console.error('Failed to search databases:', error);
      // ネットワークエラーの場合はユーザーフレンドリーなメッセージに変換
      if (error instanceof Error && error.message.includes('network')) {
        throw new Error(USER_FRIENDLY_ERRORS.NOTION_NETWORK_ERROR);
      }
      throw error;
    }
  }

  /**
   * Notion APIエラーをユーザーフレンドリーなメッセージに変換
   */
  private getFriendlyErrorMessage(error: NotionErrorResponse): string {
    switch (error.status) {
      case 401:
        // 認証エラー: トークンが無効または期限切れ
        return USER_FRIENDLY_ERRORS.NOTION_AUTH_FAILED;
      case 403:
        // 認可エラー: アクセス権限がない
        return 'このリソースにアクセスする権限がありません。Notion側でIntegrationの権限を確認してください。';
      case 404:
        return USER_FRIENDLY_ERRORS.NOTION_DB_NOT_FOUND;
      case 429:
        return USER_FRIENDLY_ERRORS.NOTION_RATE_LIMIT;
      default:
        if (error.message.toLowerCase().includes('network')) {
          return USER_FRIENDLY_ERRORS.NOTION_NETWORK_ERROR;
        }
        // 権限エラーの検出（メッセージから）
        if (error.message.toLowerCase().includes('access') || error.message.toLowerCase().includes('permission')) {
          return 'このリソースにアクセスする権限がありません。Notion側でIntegrationの権限を確認してください。';
        }
        return error.message;
    }
  }

  /**
   * データソース詳細を取得（Notion API 2025-09-03）
   */
  async getDataSource(
    token: string,
    dataSourceId: string,
  ): Promise<NotionDataSourceDetailResponse | null> {
    try {
      // dataSourceIdのバリデーション
      if (!dataSourceId || typeof dataSourceId !== 'string' || dataSourceId.trim().length === 0) {
        throw new Error('Invalid data source ID: data source ID is required and must be a non-empty string');
      }

      // URL構築時にスラッシュの重複を防ぐ
      const cleanBaseUrl = this.baseUrl.replace(/\/$/, '');
      const cleanDataSourceId = dataSourceId.trim();
      const url = `${cleanBaseUrl}/data_sources/${cleanDataSourceId}`;

      console.log('[NotionAPI] Getting data source:', {
        url,
        dataSourceId: cleanDataSourceId,
        tokenLength: token?.length,
      });

      const response = await apiFetch(url, {
        headers: this.getHeaders(token),
      });

      console.log('[NotionAPI] Data source response status:', response.status);

      if (!response.ok) {
        const error = await response.json() as NotionErrorResponse;
        console.error('[NotionAPI] Data source error response:', error);
        const friendlyMessage = this.getFriendlyErrorMessage(error);
        throw new Error(friendlyMessage);
      }

      const data = await response.json() as NotionDataSourceDetailResponse;
      console.log('[NotionAPI] Data source response data:', {
        id: data.id,
        object: data.object,
        name: data.name,
        hasProperties: !!data.properties,
        propertiesKeys: data.properties ? Object.keys(data.properties) : [],
        propertiesCount: data.properties ? Object.keys(data.properties).length : 0,
        // 最初の3プロパティのみログ出力（全プロパティは多すぎるため）
        sampleProperties: data.properties ? Object.entries(data.properties).slice(0, 3).map(([name, prop]) => ({
          name,
          type: prop.type,
          id: prop.id,
        })) : [],
      });

      return data;
    } catch (error) {
      console.error('Failed to get data source:', error);
      // ネットワークエラーの場合はユーザーフレンドリーなメッセージに変換
      if (error instanceof Error && error.message.includes('network')) {
        throw new Error(USER_FRIENDLY_ERRORS.NOTION_NETWORK_ERROR);
      }
      // Invalid request URLエラーの場合はより詳細なメッセージを提供
      if (error instanceof Error && error.message.includes('Invalid request URL')) {
        throw new Error(`Invalid request URL: data source ID may be invalid. Data Source ID: "${dataSourceId}"`);
      }
      throw error;
    }
  }

  /**
   * データベース情報を取得
   */
  async getDatabase(
    token: string,
    databaseId: string,
  ): Promise<NotionDatabaseResponse | null> {
    try {
      // databaseIdのバリデーション
      if (!databaseId || typeof databaseId !== 'string' || databaseId.trim().length === 0) {
        throw new Error('Invalid database ID: database ID is required and must be a non-empty string');
      }

      // URL構築時にスラッシュの重複を防ぐ
      const cleanBaseUrl = this.baseUrl.replace(/\/$/, '');
      const cleanDatabaseId = databaseId.trim();
      const url = `${cleanBaseUrl}/databases/${cleanDatabaseId}`;

      console.log('[NotionAPI] Getting database:', {
        url,
        databaseId: cleanDatabaseId,
        tokenLength: token?.length,
      });

      const response = await apiFetch(url, {
        headers: this.getHeaders(token),
      });

      console.log('[NotionAPI] Database response status:', response.status);

      if (!response.ok) {
        const error = await response.json() as NotionErrorResponse;
        console.error('[NotionAPI] Database error response:', error);
        const friendlyMessage = this.getFriendlyErrorMessage(error);
        throw new Error(friendlyMessage);
      }

      const data = await response.json() as NotionDatabaseResponse;
      console.log('[NotionAPI] Database response data:', {
        id: data.id,
        object: data.object,
        hasProperties: !!data.properties,
        propertiesKeys: data.properties ? Object.keys(data.properties) : [],
        propertiesCount: data.properties ? Object.keys(data.properties).length : 0,
        // 最初の3プロパティのみログ出力（全プロパティは多すぎるため）
        sampleProperties: data.properties ? Object.entries(data.properties).slice(0, 3).map(([name, prop]) => ({
          name,
          type: prop.type,
          id: prop.id,
        })) : [],
      });

      return data;
    } catch (error) {
      console.error('Failed to get database:', error);
      // ネットワークエラーの場合はユーザーフレンドリーなメッセージに変換
      if (error instanceof Error && error.message.includes('network')) {
        throw new Error(USER_FRIENDLY_ERRORS.NOTION_NETWORK_ERROR);
      }
      // Invalid request URLエラーの場合はより詳細なメッセージを提供
      if (error instanceof Error && error.message.includes('Invalid request URL')) {
        throw new Error(`Invalid request URL: database ID may be invalid. Database ID: "${databaseId}"`);
      }
      throw error;
    }
  }

  /**
   * ページを作成
   */
  async createPage(
    token: string,
    databaseId: string,
    properties: Record<string, any>,
  ): Promise<NotionPageCreateResponse | null> {
    try {
      console.log('[NotionAPI] createPage called with:', {
        databaseId,
        tokenLength: token?.length,
        propertiesKeys: Object.keys(properties),
      });

      // databaseIdのバリデーションとサニタイゼーション
      if (!databaseId || typeof databaseId !== 'string' || databaseId.trim().length === 0) {
        throw new Error('Invalid database ID: database ID is required and must be a non-empty string');
      }

      // 動的インポートを使用（循環依存を避けるため）
      const validationUtils = require('@/utils/validation');
      if (!validationUtils.isValidDatabaseId(databaseId)) {
        throw new Error('Invalid database ID format: must be a valid UUID');
      }

      // URL構築時にスラッシュの重複を防ぐ
      const cleanBaseUrl = this.baseUrl.replace(/\/$/, '');
      const url = `${cleanBaseUrl}/pages`;

      // Database IDを正規化
      const normalizedDatabaseId = validationUtils.normalizeDatabaseId(databaseId);

      const requestBody = {
        parent: {
          database_id: normalizedDatabaseId,
        },
        properties,
      };

      console.log('[NotionAPI] Request body:', JSON.stringify(requestBody, null, 2));

      const response = await apiFetch(url, {
        method: 'POST',
        headers: this.getHeaders(token),
        body: JSON.stringify(requestBody),
      });

      console.log('[NotionAPI] Response status:', response.status, response.statusText);

      if (!response.ok) {
        const error = await response.json() as NotionErrorResponse;
        console.error('[NotionAPI] Error response:', error);
        const friendlyMessage = this.getFriendlyErrorMessage(error);
        throw new Error(friendlyMessage);
      }

      const result = await response.json() as NotionPageCreateResponse;
      console.log('[NotionAPI] createPage success:', {
        pageId: result.id,
      });
      return result;
    } catch (error) {
      console.error('[NotionAPI] Failed to create page:', error);
      // ネットワークエラーの場合はユーザーフレンドリーなメッセージに変換
      if (error instanceof Error && error.message.includes('network')) {
        throw new Error(USER_FRIENDLY_ERRORS.NOTION_NETWORK_ERROR);
      }
      // Invalid request URLエラーの場合はより詳細なメッセージを提供
      if (error instanceof Error && error.message.includes('Invalid request URL')) {
        throw new Error(`Invalid request URL: database ID may be invalid. Database ID: "${databaseId}"`);
      }
      throw error;
    }
  }

  /**
   * データベースをクエリ
   */
  async queryDatabase(
    token: string,
    databaseId: string,
    pageSize: number = 5,
  ): Promise<NotionQueryDatabaseResponse | null> {
    try {
      // databaseIdのバリデーション
      if (!databaseId || typeof databaseId !== 'string' || databaseId.trim().length === 0) {
        throw new Error('Invalid database ID: database ID is required and must be a non-empty string');
      }

      // baseUrlのバリデーション
      if (!this.baseUrl || typeof this.baseUrl !== 'string' || this.baseUrl.trim().length === 0) {
        throw new Error('Invalid base URL: base URL is required and must be a non-empty string');
      }

      // URL構築時にスラッシュの重複を防ぐ
      const cleanBaseUrl = this.baseUrl.replace(/\/$/, '');
      const cleanDatabaseId = databaseId.trim();
      const url = `${cleanBaseUrl}/databases/${cleanDatabaseId}/query`;

      // URLのバリデーション（開発環境でのみログ出力）
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.debug('[NotionAPI] Query database URL:', url);
        console.debug('[NotionAPI] Base URL:', this.baseUrl);
        console.debug('[NotionAPI] Database ID:', cleanDatabaseId);
      }

      // URLが有効な形式か確認
      try {
        new URL(url);
      } catch (urlError) {
        throw new Error(`Invalid URL format: ${url}. Error: ${urlError instanceof Error ? urlError.message : String(urlError)}`);
      }

      const response = await apiFetch(url, {
        method: 'POST',
        headers: this.getHeaders(token),
        body: JSON.stringify({
          page_size: pageSize,
        }),
      });
      if (!response.ok) {
        const error = await response.json() as NotionErrorResponse;
        const friendlyMessage = this.getFriendlyErrorMessage(error);
        throw new Error(friendlyMessage);
      }

      return await response.json() as NotionQueryDatabaseResponse;
    } catch (error) {
      console.error('Failed to query database:', error);
      // ネットワークエラーの場合はユーザーフレンドリーなメッセージに変換
      if (error instanceof Error && error.message.includes('network')) {
        throw new Error(USER_FRIENDLY_ERRORS.NOTION_NETWORK_ERROR);
      }
      // Invalid request URLエラーの場合はより詳細なメッセージを提供
      if (error instanceof Error && error.message.includes('Invalid request URL')) {
        throw new Error(`Invalid request URL: database ID may be invalid. Database ID: "${databaseId}"`);
      }
      throw error;
    }
  }
}
