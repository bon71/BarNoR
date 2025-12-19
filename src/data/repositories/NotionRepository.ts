/**
 * NotionRepository実装
 * Notion APIを使用してデータベース操作を行う
 */

import {
  INotionRepository,
  NotionDatabase,
  NotionProperty,
  SaveResult,
  QueryDatabaseResult,
} from '@/domain/repositories/INotionRepository';
import {ScannedItem} from '@/domain/entities/ScannedItem';
import {Package} from '@/domain/entities/Package';
import {SimplifiedConfig} from '@/domain/entities/SimplifiedConfig';
import {NotionAPI} from '@/data/datasources/NotionAPI';

export class NotionRepository implements INotionRepository {
  constructor(private readonly notionAPI: NotionAPI) {}

  /**
   * Integration Tokenの検証
   */
  async validateToken(token: string): Promise<boolean> {
    return await this.notionAPI.validateToken(token);
  }

  /**
   * アクセス可能なデータベース一覧を取得
   */
  async listDatabases(token: string): Promise<NotionDatabase[]> {
    const response = await this.notionAPI.searchDatabases(token);

    if (!response || !response.results) {
      return [];
    }

    return response.results.map(result => {
      // Notion API 2025-09-03対応: data_sourceとdatabaseの両方を処理
      if (result.object === 'data_source') {
        // data_sourceの場合: parent.database_idを使用
        if (!result.parent?.database_id) {
          console.warn('data_source has no parent.database_id:', result);
          return null;
        }
        const title =
          result.title && result.title.length > 0
            ? result.title[0].text.content
            : 'Untitled';
        return {
          id: result.parent.database_id,
          title,
        };
      } else {
        // 従来のdatabaseの場合
        const title =
          result.title.length > 0 ? result.title[0].text.content : 'Untitled';
        return {
          id: result.id,
          title,
        };
      }
    }).filter((db): db is {id: string; title: string} => db !== null);
  }

  /**
   * データベースの詳細を取得
   */
  async getDatabase(
    token: string,
    databaseId: string,
  ): Promise<NotionDatabase> {
    const database = await this.notionAPI.getDatabase(token, databaseId);

    if (!database) {
      throw new Error('Database not found');
    }

    // タイトル取得
    const title =
      database.title && database.title.length > 0
        ? database.title[0].text.content
        : 'Untitled';

    return {
      id: database.id,
      title,
      properties: database.properties,
    };
  }

  /**
   * データベースのプロパティ一覧を取得（Notion API 2025-09-03対応）
   */
  async getDatabaseProperties(
    token: string,
    databaseId: string,
  ): Promise<NotionProperty[]> {
    console.log('[NotionRepository] getDatabaseProperties called with:', {
      databaseId,
      tokenLength: token?.length,
    });

    // 1. データベース情報を取得してdata_sourcesを確認
    const database = await this.notionAPI.getDatabase(token, databaseId);

    console.log('[NotionRepository] getDatabase response:', {
      hasDatabase: !!database,
      hasProperties: !!database?.properties,
      hasDataSources: !!database?.data_sources,
      dataSourcesCount: database?.data_sources?.length || 0,
      propertiesKeys: database?.properties ? Object.keys(database.properties) : [],
    });

    if (!database) {
      console.warn('[NotionRepository] No database found');
      return [];
    }

    // 2. Notion API 2025-09-03: data_sourcesからプロパティ取得
    if (database.data_sources && database.data_sources.length > 0) {
      const dataSourceId = database.data_sources[0].id;
      console.log('[NotionRepository] Fetching properties from data source:', dataSourceId);

      const dataSource = await this.notionAPI.getDataSource(token, dataSourceId);

      if (!dataSource || !dataSource.properties) {
        console.warn('[NotionRepository] No data source or properties found');
        return [];
      }

      const properties = Object.entries(dataSource.properties).map(([name, prop]) => ({
        id: prop.id,
        name,
        type: prop.type,
      }));

      console.log('[NotionRepository] Extracted properties from data source:', properties);
      return properties;
    }

    // 3. 旧バージョン対応: 直接propertiesが存在する場合
    if (database.properties) {
      const properties = Object.entries(database.properties).map(([name, prop]) => ({
        id: prop.id,
        name,
        type: prop.type,
      }));

      console.log('[NotionRepository] Extracted properties from database (legacy):', properties);
      return properties;
    }

    console.warn('[NotionRepository] No properties found in database or data sources');
    return [];
  }

  /**
   * Notionにアイテムを保存
   */
  async saveItem(
    token: string,
    pkg: Package,
    item: ScannedItem,
  ): Promise<SaveResult> {
    try {
      // 必須マッピングの検証（title, barcode）
      if (!pkg.propertyMapping?.title || !item.title?.trim()) {
        return {
          success: false,
          error: 'Invalid property mapping: title is required',
        };
      }
      if (!pkg.propertyMapping?.barcode) {
        return {
          success: false,
          error: 'Invalid property mapping: barcode is required',
        };
      }

      // プロパティマッピングに基づいてNotion用のプロパティを生成
      const properties = this.buildProperties(pkg, item);

      // 念のため必須プロパティが構築されているか検証
      if (
        !properties[pkg.propertyMapping.title] ||
        !properties[pkg.propertyMapping.barcode]
      ) {
        return {
          success: false,
          error: 'Invalid property mapping: required properties are missing',
        };
      }

      // ページを作成
      const response = await this.notionAPI.createPage(
        token,
        pkg.databaseId,
        properties,
      );

      if (!response) {
        return {
          success: false,
          error: 'Failed to create page',
        };
      }

      return {
        success: true,
        pageId: response.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * プロパティマッピングに基づいてNotion用のプロパティを構築
   */
  private buildProperties(
    pkg: Package,
    item: ScannedItem,
  ): Record<string, any> {
    const properties: Record<string, any> = {};

    const isNonEmptyString = (v: unknown): v is string =>
      typeof v === 'string' && v.trim().length > 0;
    const isNumber = (v: unknown): v is number =>
      typeof v === 'number' && Number.isFinite(v);

    const addTitle = (key: string, value: string) => {
      if (!isNonEmptyString(value)) return;
      properties[key] = {
        title: [
          {
            text: {content: value.trim()},
          },
        ],
      };
    };

    const addRichText = (key: string, value?: string) => {
      if (!isNonEmptyString(value)) return;
      properties[key] = {
        rich_text: [
          {
            text: {content: value.trim()},
          },
        ],
      };
    };

    const addNumber = (key: string, value?: number) => {
      if (!isNumber(value)) return;
      properties[key] = {number: value};
    };

    const addUrl = (key: string, value?: string) => {
      if (!isNonEmptyString(value)) return;
      properties[key] = {url: value};
    };

    // title（必須）
    if (pkg.propertyMapping.title) {
      addTitle(pkg.propertyMapping.title, item.title);
    }

    // barcode
    if (pkg.propertyMapping.barcode) {
      addRichText(pkg.propertyMapping.barcode, item.barcode);
    }

    // 書籍
    if (item.isBook()) {
      if (pkg.propertyMapping.author) {
        addRichText(pkg.propertyMapping.author, item.author);
      }
      if (pkg.propertyMapping.publisher) {
        addRichText(pkg.propertyMapping.publisher, item.publisher);
      }
    } else {
      // 製品
      if (pkg.propertyMapping.maker) {
        addRichText(pkg.propertyMapping.maker, item.maker);
      }
    }

    // 共通
    if (pkg.propertyMapping.price) {
      addNumber(pkg.propertyMapping.price, item.price);
    }
    if (pkg.propertyMapping.imageUrl) {
      addUrl(pkg.propertyMapping.imageUrl, item.imageUrl);
    }

    return properties;
  }

  /**
   * Notionにアイテムを保存（SimplifiedConfig使用）
   */
  async saveItemWithConfig(
    config: SimplifiedConfig,
    item: ScannedItem,
  ): Promise<SaveResult> {
    try {
      console.log('[NotionRepository] saveItemWithConfig called with:', {
        databaseId: config.databaseId,
        tokenLength: config.notionToken?.length,
        itemTitle: item.title,
        itemBarcode: item.barcode,
        itemAuthor: item.author,
        itemImageUrl: item.imageUrl,
        propertyMapping: config.propertyMapping,
      });

      // 必須マッピングの検証（title）
      if (!config.propertyMapping?.title || !item.title?.trim()) {
        console.error('[NotionRepository] Validation failed: title is required');
        return {
          success: false,
          error: 'Invalid property mapping: title is required',
        };
      }

      // プロパティマッピングに基づいてNotion用のプロパティを生成
      const properties = this.buildPropertiesFromConfig(config, item);
      console.log('[NotionRepository] Built properties:', JSON.stringify(properties, null, 2));

      // 念のため必須プロパティが構築されているか検証
      if (!properties[config.propertyMapping.title]) {
        console.error('[NotionRepository] Validation failed: required properties are missing');
        return {
          success: false,
          error: 'Invalid property mapping: required properties are missing',
        };
      }

      // ページを作成
      console.log('[NotionRepository] Calling createPage with:', {
        databaseId: config.databaseId,
        propertiesKeys: Object.keys(properties),
      });
      const response = await this.notionAPI.createPage(
        config.notionToken,
        config.databaseId,
        properties,
      );
      console.log('[NotionRepository] createPage response:', {
        hasResponse: !!response,
        responseId: response?.id,
      });

      if (!response) {
        console.error('[NotionRepository] No response from createPage');
        return {
          success: false,
          error: 'Failed to create page',
        };
      }

      console.log('[NotionRepository] Successfully created page:', response.id);
      return {
        success: true,
        pageId: response.id,
      };
    } catch (error) {
      console.error('[NotionRepository] Error in saveItemWithConfig:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * SimplifiedConfigに基づいてNotion用のプロパティを構築
   */
  private buildPropertiesFromConfig(
    config: SimplifiedConfig,
    item: ScannedItem,
  ): Record<string, any> {
    const properties: Record<string, any> = {};

    const isNonEmptyString = (v: unknown): v is string =>
      typeof v === 'string' && v.trim().length > 0;

    const addTitle = (key: string, value: string) => {
      if (!isNonEmptyString(value)) return;
      properties[key] = {
        title: [
          {
            text: {content: value.trim()},
          },
        ],
      };
    };

    const addRichText = (key: string, value?: string) => {
      if (!isNonEmptyString(value)) return;
      properties[key] = {
        rich_text: [
          {
            text: {content: value.trim()},
          },
        ],
      };
    };

    const addFiles = (key: string, value?: string) => {
      if (!isNonEmptyString(value)) return;
      // Notionのfilesタイプは外部URLの場合、external形式で送信
      // 注意: typeフィールドは不要（Notion APIの仕様）
      properties[key] = {
        files: [
          {
            name: '書影',
            external: {
              url: value.trim(),
            },
          },
        ],
      };
    };

    // title（必須）
    if (config.propertyMapping.title) {
      addTitle(config.propertyMapping.title, item.title);
    }

    // ISBN（バーコード）
    if (config.propertyMapping.isbn && item.barcode) {
      addRichText(config.propertyMapping.isbn, item.barcode);
    }

    // 書籍の場合のみ
    if (item.isBook()) {
      // author
      if (config.propertyMapping.author && item.author) {
        addRichText(config.propertyMapping.author, item.author);
      }
    }

    // imageUrl（filesタイプとして処理）
    if (config.propertyMapping.imageUrl && item.imageUrl) {
      addFiles(config.propertyMapping.imageUrl, item.imageUrl);
    }

    return properties;
  }

  /**
   * データベースのページをクエリ（プレビュー用）
   */
  async queryDatabasePages(
    token: string,
    databaseId: string,
    pageSize: number = 5,
  ): Promise<QueryDatabaseResult> {
    try {
      // databaseIdの早期バリデーション
      if (!databaseId || typeof databaseId !== 'string' || databaseId.trim().length === 0) {
        throw new Error('Invalid database ID: database ID is required and must be a non-empty string');
      }

      const response = await this.notionAPI.queryDatabase(
        token,
        databaseId,
        pageSize,
      );

      if (!response || !response.results) {
        return {
          pages: [],
          hasMore: false,
        };
      }

      const pages = response.results.map(page => ({
        id: page.id,
        properties: page.properties,
        createdTime: page.created_time,
        lastEditedTime: page.last_edited_time,
      }));

      return {
        pages,
        hasMore: response.has_more,
      };
    } catch (error) {
      console.error('Failed to query database pages:', error);
      throw error;
    }
  }
}
