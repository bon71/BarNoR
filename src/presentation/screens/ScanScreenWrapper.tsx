/**
 * スキャン画面ラッパー
 * タブナビゲーション用にScanScreenをラップ
 */

import React, {useState} from 'react';
import {View, StyleSheet, Text, TextInput, Vibration} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ScanScreen} from './ScanScreen';
import {Button, Card} from '@/presentation/components/common';
import {useTheme} from '@/presentation/hooks/useTheme';
import {useTranslation} from '@/presentation/hooks/useTranslation';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '@/presentation/navigation/types';
import {scanViewModel} from '@/presentation/providers/ViewModelProvider';
import {showErrorToast} from '@/presentation/stores/useToastStore';
import {spacing, typography} from '@/config/theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ScanScreenWrapper: React.FC = () => {
  const {colors} = useTheme();
  const {t} = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const [showScanScreen, setShowScanScreen] = useState(false);
  const [isbnInput, setIsbnInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleISBNSearch = async () => {
    // ハイフンを削除して数字のみにする
    const isbnCleaned = isbnInput.trim().replace(/-/g, '');

    if (!/^\d{13}$/.test(isbnCleaned)) {
      showErrorToast(t('scan:isbn13FormatError'));
      return;
    }

    setIsSearching(true);
    try {
      const result = await scanViewModel.scanBarcode(isbnCleaned);

      if (result.success && result.item) {
        Vibration.vibrate(200);
        navigation.navigate('ScanResult', {item: result.item});
        setIsbnInput('');
      }
    } catch (err) {
      console.error('Unexpected error during ISBN search:', err);
      showErrorToast(t('scan:isbnSearchError'));
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      <View style={styles.content}>
        <Button
          title={t('scan:title')}
          onPress={() => setShowScanScreen(true)}
          size="large"
          testID="scan-button"
        />

        <View style={styles.manualInputContainer}>
          <Card>
            <Text style={[styles.inputLabel, {color: colors.textPrimary}]}>
              {t('scan:orEnterIsbn')}
            </Text>
            <TextInput
              style={[styles.isbnInput, {
                color: colors.textPrimary,
                borderColor: colors.border,
                backgroundColor: colors.backgroundSecondary,
              }]}
              placeholder={t('scan:isbnInputPlaceholder')}
              placeholderTextColor={colors.textTertiary}
              keyboardType="default"
              maxLength={17}
              value={isbnInput}
              onChangeText={setIsbnInput}
              testID="isbn-input-wrapper"
            />
            <Button
              title={t('common:search')}
              onPress={handleISBNSearch}
              disabled={!isbnInput.trim()}
              loading={isSearching}
              style={styles.searchButton}
              testID="isbn-search-button-wrapper"
            />
          </Card>
        </View>
      </View>
      <ScanScreen
        visible={showScanScreen}
        onClose={() => setShowScanScreen(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  manualInputContainer: {
    marginTop: spacing.lg,
    width: '100%',
  },
  inputLabel: {
    fontSize: typography.fontSize.md,
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  isbnInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: typography.fontSize.md,
    marginBottom: spacing.md,
  },
  searchButton: {
    marginTop: spacing.sm,
  },
});

