/**
 * Notion保存ユースケース
 * スキャンされたアイテムをNotionに保存する
 */

import {INotionRepository, SaveResult} from '@/domain/repositories/INotionRepository';
import {IStorageRepository} from '@/domain/repositories/IStorageRepository';
import {ScannedItem} from '@/domain/entities/ScannedItem';
import {Package} from '@/domain/entities/Package';

export class SaveToNotionUseCase {
  constructor(
    private readonly notionRepository: INotionRepository,
    private readonly storageRepository: IStorageRepository,
  ) {}

  /**
   * Notionにアイテムを保存
   * @param item - スキャンされたアイテム
   * @param pkg - パッケージ
   * @returns 保存結果
   */
  async execute(item: ScannedItem, pkg: Package): Promise<SaveResult> {
    // パッケージがアクティブかチェック
    if (!pkg.isActive) {
      throw new Error('Package is not active');
    }

    // Notion Integration Tokenを取得
    const token = await this.storageRepository.getNotionToken();
    if (!token) {
      throw new Error('Notion token not found');
    }

    // Notionに保存
    const result = await this.notionRepository.saveItem(token, pkg, item);

    return result;
  }
}
