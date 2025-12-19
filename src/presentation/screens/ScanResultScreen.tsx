/**
 * スキャン結果画面
 * スキャンされたアイテムの詳細表示と編集、Notionへの保存
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Vibration,
  Image,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {Button, Card, Input, LoadingIndicator} from '@/presentation/components/common';
import {spacing, typography} from '@/config/theme';
import {useTheme} from '@/presentation/hooks/useTheme';
import {useTranslation} from '@/presentation/hooks/useTranslation';
import {ScannedItem, ItemType} from '@/domain/entities/ScannedItem';
import {scanViewModel} from '@/presentation/providers/ViewModelProvider';
import {
  showSuccessToast,
  showErrorToast,
} from '@/presentation/stores/useToastStore';
import {RootStackParamList} from '@/presentation/navigation/types';
import {useScanStore} from '@/presentation/stores/useScanStore';
import {useConfigStore} from '@/presentation/stores/useConfigStore';
import {useFadeIn} from '@/presentation/animations/FadeIn';
import {TouchableOpacity} from 'react-native';
import {formatDate} from '@/utils/formatters';

type ScanResultScreenRouteProp = RouteProp<RootStackParamList, 'ScanResult'>;

export const ScanResultScreen: React.FC = () => {
  const {colors} = useTheme();
  const {t} = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<ScanResultScreenRouteProp>();
  const {currentScannedItem} = useScanStore();
  const {config} = useConfigStore();
  const [isSaving, setIsSaving] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const fadeAnim = useFadeIn(280);

  // Route paramsまたはstoreからitemを取得
  const initialItem =
    (route.params as any)?.item || currentScannedItem;

  // 画像の読み込み状態を管理（遅延読み込み）
  useEffect(() => {
    if (initialItem?.barcode) {
      setImageLoading(true);
      setImageError(false);
    }
  }, [initialItem?.barcode]);

  // 編集可能なフィールド（hooks は常に呼ばれる必要がある）
  const [title, setTitle] = useState(initialItem?.title || '');
  const [author, setAuthor] = useState(initialItem?.author || '');
  const [publisher, setPublisher] = useState(initialItem?.publisher || '');
  const [maker, setMaker] = useState(initialItem?.maker || '');
  const [price, setPrice] = useState(initialItem?.price?.toString() || '');

  // initialItemが変更されたときにstateを更新
  useEffect(() => {
    if (initialItem) {
      setTitle(initialItem.title || '');
      setAuthor(initialItem.author || '');
      setPublisher(initialItem.publisher || '');
      setMaker(initialItem.maker || '');
      setPrice(initialItem.price?.toString() || '');
    }
  }, [initialItem]);

  // itemがない場合は戻る（hooks の後にチェック）
  React.useEffect(() => {
    if (!initialItem) {
      navigation.goBack();
    }
  }, [initialItem, navigation]);

  if (!initialItem) {
    return null;
  }

  // 設定未完了時のエラー表示
  if (!config) {
    return (
      <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.title, {color: colors.error}]}>
            {t('scanResult:configNotFound')}
          </Text>
          <TouchableOpacity
            style={styles.goToSettingsButton}
            onPress={() => (navigation as any).navigate('Main', {screen: 'Settings'})}>
            <Text style={styles.goToSettingsText}>{t('scanResult:goToSettings')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  /**
   * バリデーション
   */
  const validate = (): boolean => {
    // タイトルのバリデーション
    const {sanitizeString} = require('@/utils/sanitization');
    const sanitizedTitle = sanitizeString(title || '');
    if (!sanitizedTitle || sanitizedTitle.length === 0) {
      showErrorToast(t('scanResult:titleRequired'));
      return false;
    }

    // 価格のバリデーション
    if (price && price.trim().length > 0) {
      const {validateNumber} = require('@/utils/validation');
      const priceValidation = validateNumber(price, {
        min: 0,
        allowDecimal: true,
        allowNegative: false,
      });
      if (!priceValidation.isValid) {
        showErrorToast(priceValidation.error || t('scanResult:priceValidationError'));
        return false;
      }
    }

    return true;
  };

  /**
   * Notionに保存
   */
  const handleSave = async () => {
    console.log('[ScanResultScreen] handleSave called');

    if (!validate()) {
      console.log('[ScanResultScreen] Validation failed');
      return;
    }

    console.log('[ScanResultScreen] Setting isSaving=true');
    setIsSaving(true);
    try {
      // 編集内容でScannedItemを再構築
      const priceNum = price && price.trim().length > 0 ? Number(price.trim()) : undefined;
      const editedItem = new ScannedItem({
        barcode: initialItem.barcode,
        type: initialItem.type,
        title: title.trim(),
        author: author.trim() || undefined,
        publisher: publisher.trim() || undefined,
        maker: maker.trim() || undefined,
        price: priceNum,
        imageUrl: initialItem.imageUrl,
        scannedAt: initialItem.scannedAt,
      });

      console.log('[ScanResultScreen] Edited item:', {
        barcode: editedItem.barcode,
        title: editedItem.title,
        author: editedItem.author,
        imageUrl: editedItem.imageUrl,
      });

      // Notionに保存
      console.log('[ScanResultScreen] Calling saveToNotion');
      const result = await scanViewModel.saveToNotion(editedItem);
      console.log('[ScanResultScreen] saveToNotion result:', result);

      if (result.success) {
        console.log('[ScanResultScreen] Save successful');
        // 保存成功時のフィードバック
        Vibration.vibrate(200); // 200msのバイブレーション
        showSuccessToast(t('scanResult:saveSuccess'));
        navigation.goBack();
      } else {
        console.error('[ScanResultScreen] Save failed:', result.error);
        showErrorToast(result.error || t('scanResult:saveError'));
      }
    } catch (error) {
      console.error('[ScanResultScreen] Exception in handleSave:', error);
      showErrorToast(t('scanResult:saveErrorGeneric'));
    } finally {
      console.log('[ScanResultScreen] Setting isSaving=false');
      setIsSaving(false);
    }
  };

  /**
   * キャンセル
   */
  const handleCancel = () => {
    navigation.goBack();
  };

  const isBook = initialItem.type === ItemType.BOOK;

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]} testID="scan-result-screen">
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <Animated.View style={{opacity: fadeAnim}}>
            <Card testID="scan-result-card">
            {/* 書影（国立国会図書館形式）- 遅延読み込みとエラーハンドリング */}
            <View style={[styles.imageContainer, {backgroundColor: colors.backgroundSecondary}]}>
              {imageLoading && !imageError && (
                <View style={styles.imagePlaceholder}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              )}
              {!imageError && (
                <Image
                  source={{uri: `https://ndlsearch.ndl.go.jp/thumbnail/${initialItem.barcode}.jpg`}}
                  style={[styles.bookImage, imageLoading && styles.imageHidden]}
                  resizeMode="contain"
                  testID="book-image"
                  onLoadStart={() => setImageLoading(true)}
                  onLoadEnd={() => setImageLoading(false)}
                  onError={() => {
                    setImageError(true);
                    setImageLoading(false);
                  }}
                />
              )}
              {imageError && (
                <View style={styles.imagePlaceholder}>
                  <Text style={[styles.imageErrorText, {color: colors.textSecondary}]}>
                    {t('scanResult:imageLoadError')}
                  </Text>
                </View>
              )}
            </View>

            {/* アイテムタイプ（読み取り専用） */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, {color: colors.textSecondary}]}>{t('scanResult:typeLabel')}</Text>
              <Input
                value={isBook ? t('scanResult:typeBook') : t('scanResult:typeProduct')}
                editable={false}
                style={[styles.disabledInput, {backgroundColor: colors.background, color: colors.textSecondary}]}
                testID="item-type-input"
              />
            </View>

            {/* バーコード（読み取り専用） */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, {color: colors.textSecondary}]}>{t('scanResult:barcodeLabel')}</Text>
              <Input
                value={initialItem.barcode}
                editable={false}
                style={[styles.disabledInput, {backgroundColor: colors.background, color: colors.textSecondary}]}
                testID="barcode-input"
              />
            </View>

            {/* スキャン日時（読み取り専用） */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, {color: colors.textSecondary}]}>{t('scanResult:scannedAtLabel')}</Text>
              <Input
                value={formatDate(initialItem.scannedAt)}
                editable={false}
                style={[styles.disabledInput, {backgroundColor: colors.background, color: colors.textSecondary}]}
                testID="scanned-at-input"
              />
            </View>

            {/* 書影URL（読み取り専用） */}
            {initialItem.imageUrl && (
              <View style={styles.fieldContainer}>
                <Text style={[styles.label, {color: colors.textSecondary}]}>{t('scanResult:imageUrlLabel')}</Text>
                <Input
                  value={initialItem.imageUrl}
                  editable={false}
                  style={[styles.disabledInput, {backgroundColor: colors.background, color: colors.textSecondary}]}
                  testID="image-url-input"
                  multiline
                />
              </View>
            )}

            {/* タイトル */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, {color: colors.textSecondary}]}>
                {t('scanResult:titleLabel')} <Text style={[styles.required, {color: colors.error}]}>*</Text>
              </Text>
              <Input
                value={title}
                onChangeText={setTitle}
                placeholder={t('scanResult:titlePlaceholder')}
                multiline
                testID="title-input"
              />
            </View>

            {/* 書籍の場合 */}
            {isBook && (
              <>
                {/* 著者 */}
                <View style={styles.fieldContainer}>
                  <Text style={[styles.label, {color: colors.textSecondary}]}>{t('scanResult:authorLabel')}</Text>
                  <Input
                    value={author}
                    onChangeText={setAuthor}
                    placeholder={t('scanResult:authorPlaceholder')}
                    testID="author-input"
                  />
                </View>

                {/* 出版社 */}
                <View style={styles.fieldContainer}>
                  <Text style={[styles.label, {color: colors.textSecondary}]}>{t('scanResult:publisherLabel')}</Text>
                  <Input
                    value={publisher}
                    onChangeText={setPublisher}
                    placeholder={t('scanResult:publisherPlaceholder')}
                    testID="publisher-input"
                  />
                </View>
              </>
            )}

            {/* 商品の場合 */}
            {!isBook && (
              <View style={styles.fieldContainer}>
                <Text style={[styles.label, {color: colors.textSecondary}]}>{t('scanResult:makerLabel')}</Text>
                <Input
                  value={maker}
                  onChangeText={setMaker}
                  placeholder={t('scanResult:makerPlaceholder')}
                  testID="maker-input"
                />
              </View>
            )}

            {/* 価格（書籍・商品共通） */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, {color: colors.textSecondary}]}>{t('scanResult:priceLabel')}</Text>
              <Input
                value={price}
                onChangeText={setPrice}
                placeholder={t('scanResult:pricePlaceholder')}
                keyboardType="numeric"
                testID="price-input"
              />
            </View>

              {/* アクションボタン */}
              {isSaving ? (
                <View style={styles.savingContainer}>
                  <LoadingIndicator message={t('scanResult:savingToNotion')} size="small" testID="saving-indicator" />
                </View>
              ) : (
                <View style={styles.actions}>
                  <Button
                    title={t('scanResult:saveToNotion')}
                    onPress={handleSave}
                    loading={false}
                    disabled={isSaving}
                    style={styles.saveButton}
                    testID="save-button"
                  />
                  <Button
                    title={t('common:cancel')}
                    onPress={handleCancel}
                    variant="secondary"
                    disabled={isSaving}
                    testID="cancel-button"
                  />
                </View>
              )}
            </Card>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    marginBottom: spacing.lg,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderRadius: 8,
    padding: spacing.md,
  },
  bookImage: {
    width: 200,
    height: 280,
    borderRadius: 4,
  },
  imageHidden: {
    opacity: 0,
    position: 'absolute',
  },
  imagePlaceholder: {
    width: 200,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
  },
  imageErrorText: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    padding: spacing.md,
  },
  fieldContainer: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  required: {
  },
  disabledInput: {
  },
  actions: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  saveButton: {
    marginBottom: spacing.sm,
  },
  savingContainer: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  goToSettingsButton: {
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: spacing.md,
    minWidth: 200,
  },
  goToSettingsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
