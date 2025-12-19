/**
 * 設定画面
 * Notion統合設定、パッケージ管理
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Switch,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import {Button, Input, Card} from '@/presentation/components/common';
import {spacing, typography} from '@/config/theme';
import {useTheme} from '@/presentation/hooks/useTheme';
import {useThemeStore} from '@/presentation/stores/useThemeStore';
import {useAuthStore} from '@/presentation/stores/useAuthStore';
import {useConfigStore} from '@/presentation/stores/useConfigStore';
import {useLanguageStore, Language} from '@/presentation/stores/useLanguageStore';
import {authViewModel, simplifiedConfigRepository} from '@/presentation/providers/ViewModelProvider';
import {maskSensitiveData} from '@/utils/logMasking';
import {changeLanguage} from '@/config/i18n';
import {useTranslation} from '@/presentation/hooks/useTranslation';
import i18n from 'i18next';

interface SettingsScreenProps {
  navigation?: any;
}

// テスト用にエクスポート
export const openSafeUrl = async (url: string) => {
  try {
    if (!url.startsWith('https://')) {
      Alert.alert(i18n.t('alerts:error'), i18n.t('alerts:invalidUrl'));
      return;
    }
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert(i18n.t('alerts:error'), i18n.t('alerts:cannotOpenUrl'));
      return;
    }
    await Linking.openURL(url);
  } catch (e) {
    Alert.alert(i18n.t('alerts:error'), i18n.t('alerts:linkOpenError'));
  }
};

// テスト用にエクスポート
export const maskToken = (t?: string | null) => {
  if (!t) return '';
  if (t.length <= 10) return t.replace(/.(?=.{4})/g, '*');
  const head = t.slice(0, 6);
  const tail = t.slice(-4);
  return `${head}${'*'.repeat(Math.max(0, t.length - 10))}${tail}`;
};

export const SettingsScreen: React.FC<SettingsScreenProps> = () => {
  const {colors} = useTheme();
  const {t} = useTranslation();
  const {mode, toggleMode} = useThemeStore();
  const {language, setLanguage} = useLanguageStore();
  const {isAuthenticated, notionToken} = useAuthStore();
  const {updateDatabaseId, config, setConfig} = useConfigStore();
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [databases, setDatabases] = useState<Array<{id: string; name: string}>>([]);
  const [loadingDatabases, setLoadingDatabases] = useState(false);
  const [selectedDatabaseId, setSelectedDatabaseId] = useState<string>(config.databaseId || '');

  // Load config from MMKV on mount
  useEffect(() => {
    const loadPersistedConfig = async () => {
      try {
        const persistedConfig = await simplifiedConfigRepository.loadConfig();
        if (persistedConfig) {
          console.log('[SettingsScreen] Loaded persisted config:', {
            hasToken: !!persistedConfig.notionToken,
            hasDatabaseId: !!persistedConfig.databaseId,
          });

          // Sync to ConfigStore
          useConfigStore.getState().setConfig(persistedConfig);

          // Sync notionToken to AuthStore
          if (persistedConfig.notionToken) {
            useAuthStore.getState().setNotionToken(persistedConfig.notionToken);
          }

          // Update local state
          if (persistedConfig.databaseId) {
            setSelectedDatabaseId(persistedConfig.databaseId);
          }
        } else {
          console.log('[SettingsScreen] No persisted config found');
        }
      } catch (err) {
        console.error('[SettingsScreen] Failed to load persisted config:', err);
      }
    };

    loadPersistedConfig();
  }, []);

  // トークン保存後にデータベース一覧を取得
  useEffect(() => {
    if (isAuthenticated) {
      loadDatabases();
    }
  }, [isAuthenticated]);

  const loadDatabases = async () => {
    console.log('[SettingsScreen] Starting to load databases...');
    setLoadingDatabases(true);
    try {
      const result = await authViewModel.getDatabases();
      console.log('[SettingsScreen] getDatabases result:', {
        success: result.success,
        databasesCount: result.databases?.length,
        databases: result.databases,
        error: result.error,
      });

      if (result.success && result.databases) {
        setDatabases(result.databases);
        console.log('[SettingsScreen] Databases set successfully:', result.databases.length);
      } else {
        console.error('[SettingsScreen] Failed to load databases:', result.error);
        Alert.alert(t('alerts:error'), result.error || t('alerts:databaseListFetchFailed'));
      }
    } catch (err) {
      console.error('Unexpected error during load databases:', err);
      Alert.alert(t('alerts:error'), t('alerts:databaseListFetchError'));
    } finally {
      setLoadingDatabases(false);
    }
  };

  const handleSaveToken = async () => {
    if (!token.trim()) {
      Alert.alert(t('alerts:error'), t('alerts:tokenRequired'));
      return;
    }

    setIsLoading(true);
    try {
      // AuthViewModelを使ってトークンを保存
      const result = await authViewModel.saveToken(token);

      if (result.success) {
        // SimplifiedConfigを構築してMMKVに保存
        const fullConfig = {
          notionToken: token.trim(),
          databaseId: config.databaseId,
          propertyMapping: config.propertyMapping,
        };
        // 機密情報をマスクしてログ出力
        console.log('[SettingsScreen] Saving token, full config:', maskSensitiveData(fullConfig));
        await simplifiedConfigRepository.saveConfig(fullConfig);
        setConfig(fullConfig);
        console.log('[SettingsScreen] Token and config saved successfully');

        Alert.alert(t('alerts:success'), t('alerts:tokenSaved'));
        setToken('');
        // トークン保存後にデータベース一覧を取得
        await loadDatabases();
      } else {
        Alert.alert(t('alerts:error'), result.error || t('alerts:tokenSaveFailed'));
      }
    } catch (err) {
      console.error('Unexpected error during save token:', err);
      Alert.alert(t('alerts:error'), t('alerts:tokenSaveError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDatabase = async (databaseId: string) => {
    try {
      console.log('[SettingsScreen] Selecting database:', databaseId);

      // Get current notionToken from AuthStore
      const currentToken = notionToken || '';

      // Update in-memory store
      setSelectedDatabaseId(databaseId);
      updateDatabaseId(databaseId);

      // Build complete SimplifiedConfig and save to MMKV
      const fullConfig = {
        notionToken: currentToken,
        databaseId,
        propertyMapping: config.propertyMapping,
      };
      console.log('[SettingsScreen] Saving full config to MMKV:', {
        hasToken: !!currentToken,
        databaseId,
        propertyMapping: fullConfig.propertyMapping,
      });
      await simplifiedConfigRepository.saveConfig(fullConfig);
      setConfig(fullConfig);
      console.log('[SettingsScreen] Config saved successfully');

      Alert.alert(t('alerts:success'), t('alerts:databaseSet'));
    } catch (err) {
      console.error('[SettingsScreen] Failed to save database selection:', err);
      Alert.alert(t('alerts:error'), t('alerts:databaseSaveFailed'));
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      t('settings:logout'),
      t('settings:logoutConfirm'),
      [
        {text: t('common:cancel'), style: 'cancel'},
        {
          text: t('settings:logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              // AuthViewModelを使ってログアウト
              await authViewModel.logout();
              Alert.alert(t('alerts:complete'), t('alerts:logoutComplete'));
            } catch (err) {
              console.error('Unexpected error during logout:', err);
              Alert.alert(t('alerts:error'), t('alerts:logoutError'));
            }
          },
        },
      ],
    );
  };

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    changeLanguage(newLanguage);
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]} testID="settings-screen">
      <ScrollView style={{backgroundColor: colors.background}} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: colors.textPrimary}]} testID="settings-notion-title">{t('settings:notionIntegrationTitle')}</Text>
          <Card enableBlur={true} blurType="ultraThinMaterial" blurAmount={75}>
            {isAuthenticated ? (
              <View>
                <Text style={styles.connectedText} testID="settings-connected">
                  ✓ {t('settings:connectedToNotion')}
                </Text>
                <Text style={styles.tokenText} testID="settings-token">
                  Token: {maskToken(notionToken)}
                </Text>
                <Button
                  title={t('settings:logout')}
                  onPress={handleLogout}
                  variant="danger"
                  style={styles.logoutButton}
                  testID="logout-button"
                />
              </View>
            ) : (
              <View>
                <Text style={styles.description}>
                  {t('settings:notionIntegrationSubtitle')}
                </Text>
                <Input
                  label="Integration Token"
                  value={token}
                  onChangeText={setToken}
                  placeholder="secret_..."
                  secureTextEntry
                  testID="token-input"
                />
                <Button
                  title={t('settings:save')}
                  onPress={handleSaveToken}
                  loading={isLoading}
                  testID="save-token-button"
                />
              </View>
            )}
          </Card>
        </View>

        {/* データベース選択セクション */}
        {isAuthenticated && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, {color: colors.textPrimary}]} testID="settings-database-title">
              {t('settings:databaseSelection')}
            </Text>
            <Card enableBlur={true} blurType="ultraThinMaterial" blurAmount={75}>
              {loadingDatabases ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.loadingText, {color: colors.textSecondary}]}>
                    {t('settings:loadingDatabases')}
                  </Text>
                </View>
              ) : databases.length === 0 ? (
                <View>
                  <Text style={[styles.emptyText, {color: colors.textSecondary}]}>
                    {t('settings:noDatabasesAvailable')}
                  </Text>
                  <Button
                    title={t('settings:reload')}
                    onPress={loadDatabases}
                    variant="secondary"
                    style={styles.reloadButton}
                    testID="reload-databases-button"
                  />
                </View>
              ) : (
                <View>
                  <Text style={[styles.databaseListLabel, {color: colors.textSecondary}]}>
                    {t('settings:selectDatabaseToSave')}
                  </Text>
                  {databases.map((db) => (
                    <TouchableOpacity
                      key={db.id}
                      style={[
                        styles.databaseItem,
                        {borderBottomColor: colors.border},
                        selectedDatabaseId === db.id && [styles.selectedDatabase, {backgroundColor: colors.primary + '20'}],
                      ]}
                      onPress={() => handleSelectDatabase(db.id)}
                      testID={`database-item-${db.id}`}>
                      <View style={styles.databaseInfo}>
                        <Text style={[styles.databaseName, {color: colors.textPrimary}]}>
                          {db.name}
                        </Text>
                        <Text style={[styles.databaseId, {color: colors.textTertiary}]} numberOfLines={1}>
                          ID: {db.id}
                        </Text>
                      </View>
                      {selectedDatabaseId === db.id && (
                        <Text style={[styles.checkmark, {color: colors.primary}]}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </Card>
          </View>
        )}

        {/* 外観設定セクション */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: colors.textPrimary}]} testID="settings-appearance-title">{t('settings:title')}</Text>
          <Card enableBlur={true} blurType="ultraThinMaterial" blurAmount={75}>
            <View style={styles.settingRow}>
              <View>
                <Text style={[styles.settingLabel, {color: colors.textPrimary}]}>{t('settings:darkMode')}</Text>
                <Text style={[styles.settingDescription, {color: colors.textSecondary}]}>
                  {mode === 'dark' ? t('settings:enabled') : t('settings:disabled')}
                </Text>
              </View>
              <Switch
                value={mode === 'dark'}
                onValueChange={toggleMode}
                trackColor={{false: colors.border, true: colors.primary}}
                thumbColor={colors.white}
                testID="dark-mode-switch"
              />
            </View>
          </Card>
        </View>

        {/* 言語設定セクション */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: colors.textPrimary}]} testID="settings-language-title">{t('settings:languageSettings')}</Text>
          <Card enableBlur={true} blurType="ultraThinMaterial" blurAmount={75}>
            <TouchableOpacity
              style={[styles.languageOption, {borderBottomColor: colors.border}]}
              onPress={() => handleLanguageChange('ja')}
              testID="language-ja-button">
              <Text style={[styles.languageLabel, {color: colors.textPrimary}]}>
                {t('settings:languageJapanese')}
              </Text>
              {language === 'ja' && (
                <Text style={[styles.checkmark, {color: colors.primary}]}>✓</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.languageOption}
              onPress={() => handleLanguageChange('en')}
              testID="language-en-button">
              <Text style={[styles.languageLabel, {color: colors.textPrimary}]}>
                {t('settings:languageEnglish')}
              </Text>
              {language === 'en' && (
                <Text style={[styles.checkmark, {color: colors.primary}]}>✓</Text>
              )}
            </TouchableOpacity>
          </Card>
        </View>

        {/* 法的情報セクション */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: colors.textPrimary}]} testID="settings-legal-title">{t('settings:legalInfo')}</Text>
          <Card enableBlur={true} blurType="ultraThinMaterial" blurAmount={75}>
            <TouchableOpacity
              style={[styles.linkItem, {borderBottomColor: colors.border}]}
              onPress={() => {
                const privacyPolicyUrl = language === 'ja'
                  ? 'https://clevique.app/ja/products/barnor/privacy-policy'
                  : 'https://clevique.app/en/products/barnor/privacy-policy';
                openSafeUrl(privacyPolicyUrl);
              }}
              testID="privacy-policy-link">
              <Text style={[styles.linkText, {color: colors.textPrimary}]}>{t('settings:privacyPolicy')}</Text>
              <Text style={[styles.linkIcon, {color: colors.textSecondary}]}>→</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.linkItemLast}
              onPress={() => {
                const termsUrl = language === 'ja'
                  ? 'https://clevique.app/ja/products/barnor/terms-of-service'
                  : 'https://clevique.app/en/products/barnor/terms-of-service';
                openSafeUrl(termsUrl);
              }}
              testID="terms-of-service-link">
              <Text style={[styles.linkText, {color: colors.textPrimary}]}>{t('settings:termsOfService')}</Text>
              <Text style={[styles.linkIcon, {color: colors.textSecondary}]}>→</Text>
            </TouchableOpacity>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: colors.textPrimary}]} testID="settings-app-title">{t('settings:appInfo')}</Text>
          <Card enableBlur={true} blurType="ultraThinMaterial" blurAmount={75}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('settings:version')}</Text>
              <Text style={styles.infoValue}>0.0.1</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('settings:buildNumber')}</Text>
              <Text style={styles.infoValue}>1</Text>
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  description: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.md,
  },
  connectedText: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  tokenText: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.md,
  },
  logoutButton: {
    marginTop: spacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  settingLabel: {
    fontSize: typography.fontSize.md,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  settingDescription: {
    fontSize: typography.fontSize.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: typography.fontSize.md,
  },
  infoValue: {
    fontSize: typography.fontSize.md,
  },
  linkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  linkItemLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  linkText: {
    fontSize: typography.fontSize.md,
    fontWeight: '500',
  },
  linkIcon: {
    fontSize: typography.fontSize.lg,
    fontWeight: '300',
  },
  scrollContent: {
    paddingBottom: 100, // フローティングタブバー分の余白
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  loadingText: {
    marginLeft: spacing.md,
    fontSize: typography.fontSize.md,
  },
  emptyText: {
    fontSize: typography.fontSize.md,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  reloadButton: {
    marginTop: spacing.sm,
  },
  databaseListLabel: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.md,
  },
  databaseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  selectedDatabase: {
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
  },
  databaseInfo: {
    flex: 1,
  },
  databaseName: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  databaseId: {
    fontSize: typography.fontSize.sm,
  },
  checkmark: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    marginLeft: spacing.sm,
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  languageLabel: {
    fontSize: typography.fontSize.md,
    fontWeight: '500',
  },
});
