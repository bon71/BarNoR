/**
 * データベースプレビューモーダル
 * Notionデータベースのサンプルデータを表示
 */

import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {Button, LoadingIndicator} from '@/presentation/components/common';
import {colors, spacing, typography} from '@/config/theme';
import {useTranslation} from '@/presentation/hooks/useTranslation';
// Phase A: packageViewModel削除により一時的に無効化（Phase BでSimplifiedConfig対応予定）
// import {packageViewModel} from '@/presentation/providers/ViewModelProvider';
import {NotionPage} from '@/domain/repositories/INotionRepository';

interface DatabasePreviewModalProps {
  visible: boolean;
  databaseId: string;
  databaseName: string;
  onClose: () => void;
}

// テスト用にエクスポート
export const extractPropertyValue = (property: any): string => {
  if (!property) return '-';

  try {
    // プロパティタイプに応じて値を抽出
    switch (property.type) {
      case 'title':
        return property.title?.map((t: any) => t.plain_text).join('') || '-';
      case 'rich_text':
        return property.rich_text?.map((t: any) => t.plain_text).join('') || '-';
      case 'number':
        return property.number?.toString() || '-';
      case 'select':
        return property.select?.name || '-';
      case 'multi_select':
        return property.multi_select?.map((s: any) => s.name).join(', ') || '-';
      case 'date':
        return property.date?.start || '-';
      case 'checkbox':
        return property.checkbox ? '✓' : '×';
      case 'url':
        return property.url || '-';
      case 'email':
        return property.email || '-';
      case 'phone_number':
        return property.phone_number || '-';
      default:
        return `[${property.type}]`;
    }
  } catch (error) {
    console.error('Failed to extract property value:', error);
    return '-';
  }
};

export const DatabasePreviewModal: React.FC<DatabasePreviewModalProps> = ({
  visible,
  databaseId,
  databaseName,
  onClose,
}) => {
  const {t} = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [pages, setPages] = useState<NotionPage[]>([]);
  const [hasMore, setHasMore] = useState(false);

  const loadPreview = useCallback(async () => {
    setIsLoading(true);
    try {
      // Phase A: packageViewModel削除により一時的に無効化（Phase BでSimplifiedConfig対応予定）
      // const result = await packageViewModel.previewDatabase(databaseId);
      // if (result.success && result.pages) {
      //   setPages(result.pages);
      //   setHasMore(result.hasMore || false);
      // } else {
      //   Alert.alert('エラー', result.error || 'プレビューの読み込みに失敗しました');
      //   setPages([]);
      // }
      Alert.alert(t('alerts:previewInfo'), t('alerts:previewPhaseB'));
      setPages([]);
      setHasMore(false);
    } catch (error) {
      console.error('Failed to load preview:', error);
      Alert.alert(t('alerts:error'), t('alerts:previewLoadError'));
      setPages([]);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (visible && databaseId) {
      // マウントされている場合のみloadPreviewを実行
      if (isMounted) {
        loadPreview();
      }
    }

    return () => {
      // クリーンアップ: アンマウント時にフラグを更新
      isMounted = false;
    };
  }, [visible, databaseId, loadPreview]);

  const renderPropertyRow = (name: string, property: any) => (
    <View key={name} style={styles.propertyRow}>
      <Text style={styles.propertyName}>{name}</Text>
      <Text style={styles.propertyValue} numberOfLines={2}>
        {extractPropertyValue(property)}
      </Text>
      <Text style={styles.propertyType}>{property?.type || '-'}</Text>
    </View>
  );

  const renderPage = (page: NotionPage, index: number) => {
    const propertyEntries = Object.entries(page.properties || {});

    return (
      <View key={page.id} style={styles.pageCard}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>ページ {index + 1}</Text>
          <Text style={styles.pageId} numberOfLines={1}>
            ID: {page.id}
          </Text>
        </View>
        <View style={styles.propertiesContainer}>
          <View style={styles.propertyHeaderRow}>
            <Text style={styles.propertyHeaderName}>プロパティ名</Text>
            <Text style={styles.propertyHeaderValue}>値</Text>
            <Text style={styles.propertyHeaderType}>タイプ</Text>
          </View>
          {propertyEntries.map(([name, property]) =>
            renderPropertyRow(name, property),
          )}
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View style={styles.container} testID="database-preview-modal">
        <View style={styles.header}>
          <View>
            <Text style={styles.title} testID="database-preview-title">データベースプレビュー</Text>
            <Text style={styles.databaseName} testID="database-preview-name">{databaseName}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton} testID="database-preview-close">
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <LoadingIndicator message="プレビューを読み込み中..." testID="database-preview-loading" />
          </View>
        ) : pages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText} testID="database-preview-empty">
              このデータベースにはページがありません
            </Text>
            <Button
              title="再読み込み"
              onPress={loadPreview}
              variant="secondary"
              size="small"
              testID="database-preview-reload"
            />
          </View>
        ) : (
          <ScrollView style={styles.scrollView} testID="database-preview-list">
            <Text style={styles.infoText} testID="database-preview-info">
              最初の{pages.length}ページを表示しています
              {hasMore && ' （さらにページがあります）'}
            </Text>
            {pages.map((page, index) => renderPage(page, index))}
          </ScrollView>
        )}

        <View style={styles.footer}>
          <Button title="閉じる" onPress={onClose} variant="secondary" testID="database-preview-close-button" />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  databaseName: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  emptyText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    padding: spacing.md,
    backgroundColor: colors.primary + '10',
    margin: spacing.md,
    borderRadius: 8,
  },
  pageCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  pageHeader: {
    padding: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pageTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  pageId: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  propertiesContainer: {
    padding: spacing.sm,
  },
  propertyHeaderRow: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.background,
    borderRadius: 4,
    marginBottom: spacing.xs,
  },
  propertyHeaderName: {
    flex: 2,
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  propertyHeaderValue: {
    flex: 3,
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  propertyHeaderType: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'right',
  },
  propertyRow: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '40',
  },
  propertyName: {
    flex: 2,
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  propertyValue: {
    flex: 3,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    paddingRight: spacing.sm,
  },
  propertyType: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'right',
    fontFamily: 'monospace',
  },
  footer: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
