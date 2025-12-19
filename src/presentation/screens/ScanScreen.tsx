/**
 * スキャン画面
 * バーコードスキャナーを表示し、スキャン結果を処理
 */

import React, {useState, useEffect, useCallback, lazy, Suspense} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  SafeAreaView,
  Vibration,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Button, Card} from '@/presentation/components/common';
import {spacing, typography} from '@/config/theme';
import {useTheme} from '@/presentation/hooks/useTheme';
import {useTranslation} from '@/presentation/hooks/useTranslation';
import {useScanStore} from '@/presentation/stores/useScanStore';
import {useConfigStore} from '@/presentation/stores/useConfigStore';
import {scanViewModel} from '@/presentation/providers/ViewModelProvider';
import {RootStackParamList} from '@/presentation/navigation/types';
import {showErrorToast} from '@/presentation/stores/useToastStore';
import {SkeletonScreen, SkeletonItem} from '@/presentation/components/common/Skeleton';

// カメラ関連のモジュールを遅延読み込み（起動時の読み込みを回避）
const BarcodeScanner = lazy(() =>
  import('@/presentation/components/scanner/BarcodeScanner').then(module => ({
    default: module.BarcodeScanner,
  }))
);

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ScanScreenProps {
  visible: boolean;
  onClose: () => void;
}

export const ScanScreen: React.FC<ScanScreenProps> = ({
  visible,
  onClose,
}) => {
  const {colors} = useTheme();
  const {t} = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const [showScanner, setShowScanner] = useState(true);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showLoadingMessage, setShowLoadingMessage] = useState(false);
  const isLoading = useScanStore(state => state.isLoading);
  const error = useScanStore(state => state.error);
  const {config} = useConfigStore();
  const [configError, setConfigError] = useState<string | null>(null);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      setShowScanner(true);
    }
  }, [visible]);

  // クリーンアップ: タイムアウトをクリア
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // 設定チェック
    if (!config || !config.notionToken || !config.databaseId) {
      setConfigError(t('scan:configNotComplete'));
    } else {
      setConfigError(null);
    }
  }, [config, t]);

  const handleBarcodeScanned = useCallback(async (barcode: string) => {
    // スキャナーは表示したまま、処理中フラグを立てる
    setIsProcessing(true);

    // 500ms後もデータ取得が完了していなければローディングメッセージ表示
    const loadingTimer = setTimeout(() => {
      setShowLoadingMessage(true);
    }, 500);

    try {
      // ViewModelを使ってバーコード情報を取得
      const result = await scanViewModel.scanBarcode(barcode);

      // タイマーをクリア
      clearTimeout(loadingTimer);
      setShowLoadingMessage(false);

      if (result.success && result.item) {
        // スキャン成功時のフィードバック
        Vibration.vibrate(200);

        // 成功メッセージを表示
        setShowSuccessMessage(true);

        // 500ms後に結果画面に遷移（1.5秒→0.5秒に短縮）
        timeoutRef.current = setTimeout(() => {
          setShowSuccessMessage(false);
          setIsProcessing(false);
          onClose(); // モーダルを閉じる
          navigation.navigate('ScanResult', {item: result.item});
        }, 500);
      } else {
        // エラーの場合
        setIsProcessing(false);
        setShowScanner(false); // エラー時のみスキャナーを非表示
      }
    } catch (err) {
      // 予期しないエラー
      clearTimeout(loadingTimer);
      setShowLoadingMessage(false);
      setIsProcessing(false);
      console.error('Unexpected error during barcode scan:', err);
      showErrorToast(t('scan:scanError'));
      setShowScanner(true);
    }
  }, [navigation, onClose]);

  const handleClose = useCallback(() => {
    setShowScanner(false);
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}>
      {showScanner ? (
        <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
          {configError && (
            <View style={styles.configErrorContainer}>
              <Text style={styles.configErrorText}>⚠️ {configError}</Text>
              <TouchableOpacity
                style={styles.goToSettingsButton}
                onPress={() => {
                  onClose();
                  // BottomTabNavigatorのSettingsタブに遷移
                  (navigation as any).navigate('Main', {screen: 'Settings'});
                }}>
                <Text style={styles.goToSettingsText}>{t('scan:goToSettings')}</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.scannerContainer}>
            {/* バーコードスキャナー（遅延読み込み） */}
            <Suspense
              fallback={
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={[styles.loadingText, {color: colors.textSecondary}]}>
                    {t('scan:preparingCameraMessage')}
                  </Text>
                </View>
              }>
              <BarcodeScanner
                enabled={!configError && !isProcessing}
                onBarcodeScanned={handleBarcodeScanned}
                onClose={handleClose}
              />
            </Suspense>

            {/* データ取得中メッセージ（500ms以上かかる場合のみ表示） */}
            {showLoadingMessage && (
              <View style={styles.loadingMessageContainer}>
                <View style={styles.loadingMessageBox}>
                  <Text style={styles.loadingMessageText}>{t('scan:loadingData')}</Text>
                </View>
              </View>
            )}

            {/* スキャン成功メッセージ */}
            {showSuccessMessage && (
              <View style={styles.successMessageContainer}>
                <View style={styles.successMessageBox}>
                  <Text style={styles.successMessageText}>{t('scan:scanSuccessMessage')}</Text>
                </View>
              </View>
            )}
          </View>
        </SafeAreaView>
      ) : (
        <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]} testID="scan-screen">
          <View style={styles.content}>
            {isLoading ? (
              <SkeletonScreen>
                <SkeletonItem width="100%" height={60} />
                <SkeletonItem width="80%" height={20} style={styles.skeletonItem1} />
                <SkeletonItem width="60%" height={20} style={styles.skeletonItem2} />
              </SkeletonScreen>
            ) : error ? (
              <Card>
                <Text style={[styles.errorTitle, {color: colors.error}]} testID="scan-error-title">{t('scan:error')}</Text>
                <Text style={[styles.errorText, {color: colors.textSecondary}]}>{error}</Text>
                <Text style={[styles.hintText, {color: colors.textTertiary}]}>
                  {t('scan:isbnBarcodeHint')}
                </Text>
                <Button
                  title={t('scan:rescan')}
                  onPress={() => setShowScanner(true)}
                  style={styles.button}
                  testID="rescan-button"
                />
                <Button
                  title={t('common:close')}
                  onPress={handleClose}
                  variant="secondary"
                  style={styles.button}
                  testID="close-button"
                />
              </Card>
            ) : null}
          </View>
        </SafeAreaView>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  button: {
    marginTop: spacing.md,
  },
  errorTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: typography.fontSize.md,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  hintText: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.md,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  configErrorContainer: {
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 8,
    margin: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  configErrorText: {
    color: '#DC2626',
    fontSize: 14,
    marginBottom: 8,
  },
  goToSettingsButton: {
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  goToSettingsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  scannerContainer: {
    flex: 1,
  },
  skeletonItem1: {
    marginTop: 10,
  },
  skeletonItem2: {
    marginTop: 5,
  },
  successMessageContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successMessageBox: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  successMessageText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  loadingMessageContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingMessageBox: {
    backgroundColor: 'rgba(59, 130, 246, 0.9)', // 青色（データ取得中を示す）
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingMessageText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000', // カメラ画面の背景色
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
  },
});
