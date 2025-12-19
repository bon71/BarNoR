/**
 * バーコードスキャナーコンポーネント
 * React Native Vision Camera + Code Scanner Plugin
 */

import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';
import {colors, spacing, typography} from '@/config/theme';
import {useTranslation} from '@/presentation/hooks/useTranslation';
import {isISBN} from '@/utils/barcodeValidation';

interface BarcodeScannerProps {
  onBarcodeScanned: (barcode: string) => void;
  onClose: () => void;
  enabled?: boolean;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onBarcodeScanned,
  onClose,
  enabled = true,
}) => {
  const {t} = useTranslation();
  const [isActive, setIsActive] = useState(true);
  const [detectedBarcode, setDetectedBarcode] = useState<string | null>(null);
  const [barcodeType, setBarcodeType] = useState<'isbn' | 'non-isbn' | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const {hasPermission, requestPermission} = useCameraPermission();
  const device = useCameraDevice('back');

  // カメラ権限の確認を遅延実行（コンポーネントマウント直後ではなく、少し遅らせる）
  useEffect(() => {
    // 次のイベントループで実行（UIの表示を優先）
    const timer = setTimeout(() => {
      if (!hasPermission) {
        requestPermission();
      }
      setIsInitialized(true);
    }, 100); // 100ms遅延してメインスレッドをブロックしない

    return () => clearTimeout(timer);
  }, [hasPermission, requestPermission]);

  // カメラリソースのクリーンアップ
  useEffect(() => {
    return () => {
      // コンポーネントのアンマウント時にカメラをクリーンアップ
      setIsActive(false);
    };
  }, []);

  const handleCodeScanned = useCallback(
    (codes: Array<{value?: string | null}>) => {
      if (!isActive || !enabled || codes.length === 0) {
        return;
      }

      const validCodes = codes.filter(code => code.value).map(code => code.value!);

      if (validCodes.length === 0) {
        return;
      }

      // ISBN-13/10を優先的に選択
      const isbnCode = validCodes.find(isISBN);

      if (isbnCode) {
        // ISBNが見つかった場合は即座に処理
        setBarcodeType('isbn');
        setDetectedBarcode(isbnCode);
        setIsActive(false);
        onBarcodeScanned(isbnCode);
      } else {
        // 非ISBNの場合は状態のみ更新してスキャン継続
        setBarcodeType('non-isbn');
        setDetectedBarcode(validCodes[0]);
        // isActiveはtrueのまま維持してスキャン継続
      }
    },
    [isActive, enabled, onBarcodeScanned],
  );

  const codeScanner = useCodeScanner({
    codeTypes: [
      'ean-13',
      'ean-8',
      'upc-a',
      'upc-e',
      'code-128',
      'code-39',
      'qr',
    ],
    onCodeScanned: handleCodeScanned,
  });

  const handleRequestPermission = useCallback(async () => {
    const granted = await requestPermission();
    if (!granted) {
      Alert.alert(
        t('scan:cameraPermissionRequired'),
        t('scan:cameraPermissionMessage'),
        [
          {text: t('common:cancel'), style: 'cancel'},
          {text: t('scan:openSettings'), onPress: () => Linking.openSettings()},
        ],
      );
    }
  }, [requestPermission]);

  if (!hasPermission) {
    return (
      <View style={styles.container} testID="barcode-scanner-permission">
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle} testID="permission-title">{t('scan:cameraPermissionRequired')}</Text>
          <Text style={styles.permissionText}>
            {t('scan:cameraPermissionMessage')}
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={handleRequestPermission}
            testID="permission-allow-button">
            <Text style={styles.permissionButtonText}>{t('scan:allowPermission')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            testID="permission-close-button"
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t('scan:closeScannerLabel')}
            accessibilityHint={t('scan:closeScannerHint')}>
            <Text style={styles.closeButtonText}>{t('scan:closeScanner')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container} testID="barcode-scanner-nodevice">
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {t('scan:cameraDeviceNotFound')}
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose} testID="nodevice-close-button">
            <Text style={styles.closeButtonText}>{t('scan:closeScanner')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 初期化が完了するまでカメラを開始しない
  if (!isInitialized || !device) {
    return (
      <View style={styles.container} testID="barcode-scanner-loading">
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('scan:preparingCamera')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="barcode-scanner">
      {enabled && isInitialized && (
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isActive && enabled && isInitialized}
          codeScanner={codeScanner}
        />
      )}

      {/* オーバーレイUI */}
      <View style={styles.overlay}>
        {/* 上部：閉じるボタン */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.closeIconButton}
            onPress={onClose}
            testID="scanner-close-button"
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t('scan:closeScannerLabel')}
            accessibilityHint={t('scan:closeScannerHint')}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* 中央：スキャンエリア */}
        <View style={styles.scanArea}>
          <View style={styles.scanFrame} testID="scanner-frame" />
          <Text style={styles.instruction} testID="scanner-instruction">
            {t('scan:placeBarcodeInFrame')}
          </Text>
        </View>

        {/* スキャン状態フィードバック */}
        {detectedBarcode && barcodeType === 'non-isbn' && (
          <View style={styles.feedbackContainer}>
            <View style={styles.feedbackBox}>
              <Text style={styles.feedbackText}>
                📦 {detectedBarcode.substring(0, 13)}...
              </Text>
              <Text style={styles.feedbackHint}>
                {t('scan:searchingIsbn')}
              </Text>
            </View>
          </View>
        )}

        {detectedBarcode && barcodeType === 'isbn' && (
          <View style={styles.feedbackContainer}>
            <View style={[styles.feedbackBox, styles.feedbackBoxSuccess]}>
              <Text style={styles.feedbackTextSuccess}>
                ✅ {t('scan:isbnDetected')}
              </Text>
            </View>
          </View>
        )}

        {/* 下部：余白 */}
        <View style={styles.bottomBar} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.text,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    height: 100,
  },
  closeIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 24,
    color: colors.white,
  },
  scanArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  scanFrame: {
    width: 280,
    height: 280,
    borderWidth: 2,
    borderColor: colors.white,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  instruction: {
    marginTop: spacing.lg,
    fontSize: typography.fontSize.md,
    color: colors.white,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  bottomBar: {
    height: 100,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  permissionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  permissionButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
  closeButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  closeButtonText: {
    color: colors.primary,
    fontSize: typography.fontSize.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  feedbackContainer: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackBox: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  feedbackBoxSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    borderColor: 'rgba(255,255,255,0.5)',
  },
  feedbackText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  feedbackHint: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: typography.fontSize.xs,
    marginTop: 4,
    textAlign: 'center',
  },
  feedbackTextSuccess: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: '700',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
});
