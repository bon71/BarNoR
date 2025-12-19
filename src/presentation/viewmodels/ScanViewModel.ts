/**
 * スキャンViewModel
 * バーコードスキャンとNotion保存のビジネスロジック
 */

import {FetchBookInfoUseCase} from '@/domain/usecases/FetchBookInfoUseCase';
import {IStorageRepository, ScanHistoryItem} from '@/domain/repositories/IStorageRepository';
import {INotionRepository} from '@/domain/repositories/INotionRepository';
import {SimplifiedConfigRepository} from '@/data/repositories/SimplifiedConfigRepository';
import {SimplifiedConfig} from '@/domain/entities/SimplifiedConfig';
import {ScannedItem} from '@/domain/entities/ScannedItem';
import {useScanStore} from '@/presentation/stores/useScanStore';
import {getUserFriendlyErrorMessage, formatErrorMessage} from '@/utils/errorMessages';

export class ScanViewModel {
  private config: SimplifiedConfig | null = null;

  constructor(
    private readonly fetchBookInfoUseCase: FetchBookInfoUseCase,
    private readonly notionRepository: INotionRepository,
    private readonly configRepository: SimplifiedConfigRepository,
    private readonly storageRepository: IStorageRepository,
  ) {}

  /**
   * 設定を読み込む
   */
  async loadConfig(): Promise<void> {
    try {
      console.log('[ScanViewModel] Loading config...');
      console.log('[ScanViewModel] configRepository instance:', {
        exists: !!this.configRepository,
        type: typeof this.configRepository,
        hasLoadConfig: typeof this.configRepository?.loadConfig === 'function',
      });

      const loadedConfig = await this.configRepository.loadConfig();

      console.log('[ScanViewModel] loadConfig() returned:', {
        isNull: loadedConfig === null,
        isUndefined: loadedConfig === undefined,
        type: typeof loadedConfig,
        hasToken: !!loadedConfig?.notionToken,
        databaseId: loadedConfig?.databaseId,
        actualNotionToken: loadedConfig?.notionToken,
        actualPropertyMapping: loadedConfig?.propertyMapping,
      });

      console.log('[ScanViewModel] Before assignment, this.config is:', this.config);
      this.config = loadedConfig;
      console.log('[ScanViewModel] After assignment, this.config is:', this.config);
      console.log('[ScanViewModel] Are they the same reference?', this.config === loadedConfig);

      console.log('[ScanViewModel] Config loaded:', {
        hasConfig: !!this.config,
        hasToken: !!this.config?.notionToken,
        hasDatabaseId: !!this.config?.databaseId,
        propertyMapping: this.config?.propertyMapping,
        actualNotionToken: this.config?.notionToken,
        actualDatabaseId: this.config?.databaseId,
      });

      if (!this.config) {
        throw new Error('設定が見つかりません。設定画面から必要な情報を入力してください。');
      }

      // バリデーション
      const validation = this.configRepository.validateConfig(this.config);
      if (!validation.isValid) {
        throw new Error(`設定エラー: ${validation.errors.join(', ')}`);
      }
    } catch (error) {
      console.error('[ScanViewModel] 設定読み込みエラー:', error);
      throw error;
    }
  }

  /**
   * スキャン履歴を読み込む
   */
  async loadScanHistory(): Promise<void> {
    const {setScanHistory, setError} = useScanStore.getState();

    try {
      setError(null);
      const history = await this.storageRepository.getScanHistory();
      setScanHistory(history);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      const friendly = getUserFriendlyErrorMessage(err);
      setError(formatErrorMessage(friendly));
      throw error;
    }
  }

  /**
   * バーコードをスキャン
   */
  async scanBarcode(barcode: string): Promise<{
    success: boolean;
    item?: ScannedItem;
    error?: string;
  }> {
    const {setLoading, setError, setCurrentScannedItem} =
      useScanStore.getState();

    try {
      setLoading(true);
      setError(null);

      // 書籍情報を取得
      const scannedItem = await this.fetchBookInfoUseCase.execute(barcode);

      if (!scannedItem) {
        const friendly = getUserFriendlyErrorMessage(new Error('book not found'));
        const message = formatErrorMessage(friendly);
        setError(message);
        return {success: false, error: message};
      }

      setCurrentScannedItem(scannedItem);

      return {
        success: true,
        item: scannedItem,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      const friendly = getUserFriendlyErrorMessage(err);
      const message = formatErrorMessage(friendly);
      setError(message);
      return {success: false, error: message};
    } finally {
      setLoading(false);
    }
  }

  /**
   * スキャンしたアイテムをNotionに保存
   */
  async saveToNotion(item: ScannedItem): Promise<{
    success: boolean;
    error?: string;
  }> {
    const {setLoading, setError} = useScanStore.getState();

    try {
      setLoading(true);
      setError(null);

      // 設定読み込み
      await this.loadConfig();

      if (!this.config) {
        const friendly = getUserFriendlyErrorMessage(
          new Error('設定が見つかりません。設定画面から必要な情報を入力してください。')
        );
        const message = formatErrorMessage(friendly);
        setError(message);
        return {success: false, error: message};
      }

      // Notionに保存
      const result = await this.notionRepository.saveItemWithConfig(
        this.config,
        item,
      );

      if (!result.success) {
        const friendly = getUserFriendlyErrorMessage(
          new Error(result.error || 'Notionへの保存に失敗しました')
        );
        const message = formatErrorMessage(friendly);
        setError(message);
        return {success: false, error: message};
      }

      // 履歴に追加
      const historyItem: ScanHistoryItem = {
        id: `scan-${Date.now()}`,
        barcode: item.barcode,
        title: item.title,
        type: item.isBook() ? 'book' : 'product',
        status: result.success ? 'sent' : 'error',
        scannedAt: new Date(),
        sentAt: result.success ? new Date() : undefined,
        errorMessage: result.error,
      };

      // 履歴を保存
      const currentHistory = useScanStore.getState().scanHistory;
      const updatedHistory = [...currentHistory, historyItem];
      await this.storageRepository.saveScanHistory(updatedHistory);
      useScanStore.getState().setScanHistory(updatedHistory);

      return {success: true};
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      const friendly = getUserFriendlyErrorMessage(err);
      const message = formatErrorMessage(friendly);
      setError(message);
      return {success: false, error: message};
    } finally {
      setLoading(false);
    }
  }

  /**
   * 履歴アイテムを再送信
   */
  async resendHistoryItem(itemId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    const {scanHistory, updateHistoryItem} = useScanStore.getState();
    const historyItem = scanHistory.find(item => item.id === itemId);

    if (!historyItem) {
      const friendly = getUserFriendlyErrorMessage(new Error('history item not found'));
      return {success: false, error: formatErrorMessage(friendly)};
    }

    // バーコードから再度情報を取得して保存
    const scanResult = await this.scanBarcode(historyItem.barcode);

    if (!scanResult.success || !scanResult.item) {
      return {success: false, error: scanResult.error};
    }

    const saveResult = await this.saveToNotion(scanResult.item);

    // 履歴を更新
    updateHistoryItem(itemId, {
      status: saveResult.success ? 'sent' : 'error',
      sentAt: saveResult.success ? new Date() : undefined,
      errorMessage: saveResult.error,
    });

    return saveResult;
  }

  /**
   * スキャン履歴をクリア
   */
  async clearHistory(): Promise<void> {
    const {clearHistory} = useScanStore.getState();

    await this.storageRepository.clearScanHistory();
    clearHistory();
  }

  /**
   * 現在スキャン中のアイテムを取得
   */
  getCurrentScannedItem(): ScannedItem | null {
    return useScanStore.getState().currentScannedItem;
  }

  /**
   * スキャン履歴を取得
   */
  getScanHistory(): ScanHistoryItem[] {
    return useScanStore.getState().scanHistory;
  }
}
