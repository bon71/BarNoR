/**
 * 設定画面（SimplifiedConfig版）
 * ステップ形式のSPAライクなUI
 */

import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Linking,
  TouchableOpacity,
  Animated,
} from 'react-native';
import {Button, Input, Card} from '@/presentation/components/common';
import {spacing, typography} from '@/config/theme';
import {useTheme} from '@/presentation/hooks/useTheme';
import {useTranslation} from '@/presentation/hooks/useTranslation';
import {useConfigStore} from '@/presentation/stores/useConfigStore';
import {useLanguageStore} from '@/presentation/stores/useLanguageStore';
import {changeLanguage} from '@/config/i18n';
import {NotionRepository} from '@/data/repositories/NotionRepository';
import {NotionAPI} from '@/data/datasources/NotionAPI';
import {showSuccessToast, showErrorToast} from '@/presentation/stores/useToastStore';
import {NotionDatabase, NotionProperty} from '@/domain/repositories/INotionRepository';
import {simplifiedConfigRepository, storageRepository} from '@/presentation/providers/ViewModelProvider';

// NotionRepositoryはAPI呼び出しのみでステート保持しないため、ローカルインスタンスでOK
const notionRepository = new NotionRepository(new NotionAPI());
// SimplifiedConfigRepositoryはシングルトンを使用（MMKVストレージの一貫性のため）
const configRepository = simplifiedConfigRepository;

type SetupStep = 'token' | 'database' | 'mapping' | 'completed';

export const SettingsScreenSimple: React.FC = () => {
  const {colors} = useTheme();
  const {t} = useTranslation();
  const {setConfig, resetConfig} = useConfigStore();
  const {language, setLanguage} = useLanguageStore();

  // ステップ管理
  const [currentStep, setCurrentStep] = useState<SetupStep>('token');

  // データ
  const [notionToken, setNotionToken] = useState('');
  const [databases, setDatabases] = useState<NotionDatabase[]>([]);
  const [selectedDatabaseId, setSelectedDatabaseId] = useState('');
  const [databaseProperties, setDatabaseProperties] = useState<NotionProperty[]>([]);
  const [isbnProperty, setIsbnProperty] = useState('ISBN');
  const [titleProperty, setTitleProperty] = useState('タイトル');
  const [authorProperty, setAuthorProperty] = useState('著者名');
  const [imageUrlProperty, setImageUrlProperty] = useState('書影');

  // ローディング状態
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProperties, setIsLoadingProperties] = useState(false);

  // アニメーション
  const [fadeAnim] = useState(new Animated.Value(1));

  const loadConfig = useCallback(async () => {
    try {
      console.log('[SettingsScreenSimple] Loading saved config...');
      const savedConfig = await configRepository.loadConfig();
      console.log('[SettingsScreenSimple] Loaded config:', {
        found: !!savedConfig,
        hasToken: !!savedConfig?.notionToken,
        databaseId: savedConfig?.databaseId,
      });

      if (savedConfig) {
        setConfig(savedConfig);
        setNotionToken(savedConfig.notionToken);
        setSelectedDatabaseId(savedConfig.databaseId);
        setIsbnProperty(savedConfig.propertyMapping.isbn);
        setTitleProperty(savedConfig.propertyMapping.title);
        setAuthorProperty(savedConfig.propertyMapping.author);
        setImageUrlProperty(savedConfig.propertyMapping.imageUrl);

        // 保存済み設定がある場合は完了画面から開始
        // データベース情報の取得は非同期で実行（UIの表示を優先）
        if (savedConfig.notionToken && savedConfig.databaseId) {
          console.log('[SettingsScreenSimple] Config found, showing completed screen');
          setCurrentStep('completed');
          // データベース情報とプロパティをバックグラウンドで再取得
          setTimeout(() => {
            loadDatabaseInfoForCompleted(savedConfig.notionToken, savedConfig.databaseId).catch(
              error => {
                console.error('[SettingsScreenSimple] Failed to load database info:', error);
              }
            );
          }, 500); // 500ms遅延してUIの表示を優先
        } else {
          console.log('[SettingsScreenSimple] Incomplete config, showing token screen');
        }
      } else {
        console.log('[SettingsScreenSimple] No saved config found, showing token screen');
      }
    } catch (error) {
      console.error('[SettingsScreenSimple] 設定読み込みエラー:', error);
    }
  }, [setConfig]);

  useEffect(() => {
    // 設定の読み込みを遅延実行（UIの表示を優先）
    const timer = setTimeout(() => {
      loadConfig();
    }, 100); // 100ms遅延してメインスレッドをブロックしない

    return () => clearTimeout(timer);
  }, [loadConfig]);

  /**
   * 完了画面表示時にデータベース情報とプロパティを再取得
   */
  const loadDatabaseInfoForCompleted = async (token: string, databaseId: string) => {
    try {
      // データベース情報を取得
      const fetchedDatabases = await notionRepository.listDatabases(token);
      if (fetchedDatabases && fetchedDatabases.length > 0) {
        setDatabases(fetchedDatabases);
        console.log('[SettingsScreenSimple] Loaded databases for completed screen:', fetchedDatabases);
      }

      // プロパティ情報を取得
      const properties = await notionRepository.getDatabaseProperties(token, databaseId);
      if (properties && properties.length > 0) {
        setDatabaseProperties(properties);
        console.log('[SettingsScreenSimple] Loaded properties for completed screen:', properties);
      }
    } catch (error) {
      console.error('[SettingsScreenSimple] データベース情報の再取得エラー:', error);
      // エラーが発生しても完了画面は表示する（データベース名が取得できない場合はIDのみ表示）
    }
  };

  /**
   * ステップ遷移アニメーション
   */
  const transitionToStep = (newStep: SetupStep) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      setCurrentStep(newStep);
    }, 150);
  };

  /**
   * Step 1: Token接続テスト
   */
  const handleConnectNotion = async () => {
    if (!notionToken || notionToken.trim().length === 0) {
      Alert.alert(t('alerts:error'), t('alerts:notionTokenRequired'));
      return;
    }

    setIsTesting(true);
    try {
      const fetchedDatabases = await notionRepository.listDatabases(notionToken);
      console.log('[SettingsScreenSimple] Fetched databases:', fetchedDatabases);

      if (fetchedDatabases && fetchedDatabases.length >= 0) {
        setDatabases(fetchedDatabases);
        showSuccessToast(t('alerts:databasesFound', {count: fetchedDatabases.length}));
        transitionToStep('database');
      } else {
        Alert.alert(t('alerts:connectionFailed'), t('alerts:databaseListFetchFailed'));
      }
    } catch (error) {
      console.error('[SettingsScreenSimple] 接続テストエラー:', error);
      Alert.alert(
        t('alerts:connectionFailed'),
        t('alerts:notionConnectionFailed') + '\n\n' +
          (error instanceof Error ? error.message : String(error))
      );
    } finally {
      setIsTesting(false);
    }
  };

  /**
   * Token リセット
   */
  const handleResetToken = () => {
    Alert.alert(
      t('settings:resetToken'),
      t('settings:resetTokenConfirm'),
      [
        {text: t('common:cancel'), style: 'cancel'},
        {
          text: t('settings:reset'),
          style: 'destructive',
          onPress: () => {
            setNotionToken('');
            setDatabases([]);
            setSelectedDatabaseId('');
            transitionToStep('token');
          },
        },
      ]
    );
  };

  /**
   * 全データ削除
   */
  const handleDeleteAllData = () => {
    Alert.alert(
      t('settings:deleteAllData'),
      t('settings:deleteAllDataConfirm'),
      [
        {text: t('common:cancel'), style: 'cancel'},
        {
          text: t('settings:delete'),
          style: 'destructive',
          onPress: async () => {
            setIsSaving(true);
            try {
              await configRepository.deleteConfig();
              await storageRepository.clearScanHistory();
              await storageRepository.deleteNotionToken();

              resetConfig();
              setNotionToken('');
              setDatabases([]);
              setSelectedDatabaseId('');
              showSuccessToast(t('alerts:allDataDeleted'));
              transitionToStep('token');
            } catch (error) {
              console.error('[SettingsScreenSimple] 全データ削除エラー:', error);
              showErrorToast(t('alerts:deleteFailed'));
            } finally {
              setIsSaving(false);
            }
          },
        },
      ]
    );
  };

  /**
   * データベースのプロパティを取得
   */
  const fetchDatabaseProperties = async (dbId: string) => {
    setIsLoadingProperties(true);
    try {
      const properties = await notionRepository.getDatabaseProperties(notionToken, dbId);
      console.log('[SettingsScreenSimple] Fetched properties:', properties);
      setDatabaseProperties(properties);
      return true;
    } catch (error) {
      console.error('[SettingsScreenSimple] プロパティ取得エラー:', error);
      showErrorToast(t('alerts:propertiesFetchFailed'));
      return false;
    } finally {
      setIsLoadingProperties(false);
    }
  };

  /**
   * Step 2: データベース選択
   */
  const handleSelectDatabase = async (dbId: string) => {
    setSelectedDatabaseId(dbId);
    // プロパティを取得
    const success = await fetchDatabaseProperties(dbId);
    if (success) {
      transitionToStep('mapping');
    }
  };

  /**
   * Step 3: 設定保存
   */
  const handleSave = async () => {
    const newConfig = {
      notionToken,
      databaseId: selectedDatabaseId,
      propertyMapping: {
        isbn: isbnProperty,
        title: titleProperty,
        author: authorProperty,
        imageUrl: imageUrlProperty,
      },
    };

    console.log('[SettingsScreenSimple] Attempting to save config:', {
      hasToken: !!newConfig.notionToken,
      tokenLength: newConfig.notionToken?.length,
      databaseId: newConfig.databaseId,
      propertyMapping: newConfig.propertyMapping,
    });

    // バリデーション
    const validation = configRepository.validateConfig(newConfig);
    if (!validation.isValid) {
      console.warn('[SettingsScreenSimple] Validation failed:', validation.errors);
      Alert.alert(t('alerts:inputError'), validation.errors.join('\n'));
      return;
    }

    console.log('[SettingsScreenSimple] Validation passed, saving to repository...');
    setIsSaving(true);
    try {
      await configRepository.saveConfig(newConfig);
      setConfig(newConfig);
      console.log('[SettingsScreenSimple] Config saved successfully');
      showSuccessToast(t('alerts:settingsSaved'));
      // 完了画面に遷移
      transitionToStep('completed');
    } catch (error) {
      console.error('[SettingsScreenSimple] 保存エラー:', error);
      showErrorToast(t('alerts:saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Step 1: Token入力画面
   */
  const renderTokenStep = () => (
    <Animated.View style={{opacity: fadeAnim}}>
      <Text style={[styles.stepTitle, {color: colors.textPrimary}]}>
        {t('settings:notionIntegration')}
      </Text>
      <Text style={[styles.stepSubtitle, {color: colors.textSecondary}]}>
        {t('settings:notionIntegrationSubtitle')}
      </Text>

      <Card>
        <Input
          label={t('settings:notionToken')}
          value={notionToken}
          onChangeText={setNotionToken}
          placeholder={t('settings:notionTokenPlaceholder')}
          secureTextEntry={true}
          testID="notion-token-input"
        />
        <Text style={[styles.hint, {color: colors.textSecondary}]}>
          {t('settings:notionTokenHint')}
        </Text>
        <TouchableOpacity
          onPress={() => Linking.openURL('https://www.notion.com/ja/help/create-integrations-with-the-notion-api')}
          style={styles.helpLink}>
          <Text style={[styles.helpLinkText, {color: colors.primary}]}>
            {t('settings:viewIntegrationGuide')}
          </Text>
        </TouchableOpacity>
      </Card>

      <Button
        title={t('settings:connectNotion')}
        onPress={handleConnectNotion}
        loading={isTesting}
        disabled={!notionToken}
        style={styles.actionButton}
        testID="connect-notion-button"
      />
    </Animated.View>
  );

  /**
   * Step 2: データベース選択画面
   */
  const renderDatabaseStep = () => (
    <Animated.View style={{opacity: fadeAnim}}>
      <Text style={[styles.stepTitle, {color: colors.textPrimary}]}>
        {t('settings:databaseSelection')}
      </Text>
      <Text style={[styles.stepSubtitle, {color: colors.textSecondary}]}>
        {t('settings:databaseSelectionSubtitle')}
      </Text>

      <Card>
        <View style={styles.radioContainer}>
          {databases.map((db) => (
            <TouchableOpacity
              key={db.id}
              style={[styles.radioOption, {
                borderColor: colors.border,
                backgroundColor: selectedDatabaseId === db.id ? colors.primary + '20' : colors.backgroundSecondary,
              }]}
              onPress={() => handleSelectDatabase(db.id)}
              testID={`database-radio-${db.id}`}>
              <View style={[styles.radioCircle, {borderColor: colors.border}]}>
                {selectedDatabaseId === db.id && (
                  <View style={[styles.radioCircleSelected, {backgroundColor: colors.primary}]} />
                )}
              </View>
              <View style={styles.radioTextContainer}>
                <Text style={[styles.radioTitle, {color: colors.textPrimary}]}>
                  {db.title || 'Untitled'}
                </Text>
                <Text style={[styles.radioId, {color: colors.textSecondary}]}>
                  ID: {db.id}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      <View style={styles.stepActions}>
        <Button
          title={`← ${t('common:back')}`}
          onPress={handleResetToken}
          variant="secondary"
          style={styles.backButton}
          testID="back-to-token-button"
        />
      </View>
    </Animated.View>
  );

  /**
   * プロパティを型でフィルタリング
   */
  const getPropertiesByType = (types: string[]) => {
    return databaseProperties.filter(prop => types.includes(prop.type));
  };

  /**
   * プロパティ選択用セレクター（ラジオボタンスタイル）
   */
  const renderPropertySelector = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    types: string[],
    testID: string
  ) => {
    const filteredProperties = getPropertiesByType(types);

    return (
      <View style={styles.propertySelectorContainer}>
        <Text style={[styles.propertyLabel, {color: colors.textPrimary}]}>{label}</Text>
        <View style={styles.propertyOptions}>
          {filteredProperties.length === 0 ? (
            <View style={[styles.emptyPropertyMessage, {backgroundColor: colors.backgroundSecondary}]}>
              <Text style={[styles.emptyPropertyText, {color: colors.textSecondary}]}>
                {t('settings:noMatchingProperty')}
              </Text>
            </View>
          ) : (
            filteredProperties.map((prop) => (
              <TouchableOpacity
                key={prop.id}
                style={[styles.propertyOption, {
                  borderColor: colors.border,
                  backgroundColor: value === prop.name ? colors.primary + '15' : colors.backgroundSecondary,
                }]}
                onPress={() => onChange(prop.name)}
                testID={`${testID}-${prop.id}`}>
                <View style={[styles.propertyRadio, {borderColor: colors.border}]}>
                  {value === prop.name && (
                    <View style={[styles.propertyRadioSelected, {backgroundColor: colors.primary}]} />
                  )}
                </View>
                <View style={styles.propertyTextContainer}>
                  <Text style={[styles.propertyName, {color: colors.textPrimary}]}>
                    {prop.name}
                  </Text>
                  <Text style={[styles.propertyType, {color: colors.textSecondary}]}>
                    {t('settings:propertyType')}: {prop.type}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </View>
    );
  };

  /**
   * Step 3: プロパティマッピング画面
   */
  const renderMappingStep = () => (
    <Animated.View style={{opacity: fadeAnim}}>
      <Text style={[styles.stepTitle, {color: colors.textPrimary}]}>
        {t('settings:propertyMapping')}
      </Text>
      <Text style={[styles.stepSubtitle, {color: colors.textSecondary}]}>
        {t('settings:propertyMappingSubtitle')}
      </Text>

      <Card>
        {renderPropertySelector(
          t('settings:isbnProperty'),
          isbnProperty,
          setIsbnProperty,
          ['rich_text', 'title'],
          'isbn-property-selector'
        )}

        {renderPropertySelector(
          t('settings:titleProperty'),
          titleProperty,
          setTitleProperty,
          ['title', 'rich_text'],
          'title-property-selector'
        )}

        {renderPropertySelector(
          t('settings:authorProperty'),
          authorProperty,
          setAuthorProperty,
          ['rich_text', 'title'],
          'author-property-selector'
        )}

        {renderPropertySelector(
          t('settings:imageUrlProperty'),
          imageUrlProperty,
          setImageUrlProperty,
          ['url', 'rich_text', 'files'],
          'imageurl-property-selector'
        )}

        <Button
          title={t('settings:refreshProperties')}
          onPress={() => fetchDatabaseProperties(selectedDatabaseId)}
          loading={isLoadingProperties}
          variant="secondary"
          style={styles.refreshButton}
          testID="refresh-properties-button"
        />
      </Card>

      <View style={styles.stepActions}>
        <Button
          title={`← ${t('settings:changeDatabase')}`}
          onPress={() => transitionToStep('database')}
          variant="secondary"
          style={styles.backButton}
          testID="back-to-database-button"
        />
        <Button
          title={t('settings:saveSettings')}
          onPress={handleSave}
          loading={isSaving}
          style={styles.saveButton}
          testID="save-config-button"
        />
      </View>

      <TouchableOpacity
        onPress={handleResetToken}
        style={styles.resetLink}>
        <Text style={[styles.resetLinkText, {color: colors.error}]}>
          {t('settings:resetToken')}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  /**
   * Step 4: 設定完了画面
   */
  const renderCompletedStep = () => {
    const selectedDatabase = databases.find(db => db.id === selectedDatabaseId);

    return (
      <Animated.View style={{opacity: fadeAnim}}>
        <View style={[styles.successBadge, {backgroundColor: colors.primary + '15'}]}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={[styles.successTitle, {color: colors.primary}]}>
            {t('settings:completed')}
          </Text>
        </View>

        <Text style={[styles.completedSubtitle, {color: colors.textSecondary}]}>
          {t('settings:completedSubtitle')}
        </Text>

        <Card>
          <View style={styles.configSection}>
            <Text style={[styles.configLabel, {color: colors.textSecondary}]}>
              {t('settings:notionTokenLabel')}
            </Text>
            <Text style={[styles.configValue, {color: colors.textPrimary}]}>
              {notionToken.substring(0, 15)}...（{t('settings:configured')}）
            </Text>
          </View>

          <View style={[styles.configDivider, {backgroundColor: colors.border}]} />

          <View style={styles.configSection}>
            <Text style={[styles.configLabel, {color: colors.textSecondary}]}>
              {t('settings:databaseLabel')}
            </Text>
            <Text style={[styles.configValue, {color: colors.textPrimary}]}>
              {selectedDatabase?.title || 'Untitled'}
            </Text>
            <Text style={[styles.configValueSub, {color: colors.textSecondary}]}>
              ID: {selectedDatabaseId}
            </Text>
          </View>

          <View style={[styles.configDivider, {backgroundColor: colors.border}]} />

          <View style={styles.configSection}>
            <Text style={[styles.configLabel, {color: colors.textSecondary}]}>
              {t('settings:propertyMappingLabel')}
            </Text>
            <View style={styles.mappingList}>
              <Text style={[styles.mappingItem, {color: colors.textPrimary}]}>
                • ISBN → {isbnProperty}
              </Text>
              <Text style={[styles.mappingItem, {color: colors.textPrimary}]}>
                • {t('settings:titleProperty').split(' → ')[0]} → {titleProperty}
              </Text>
              <Text style={[styles.mappingItem, {color: colors.textPrimary}]}>
                • {t('settings:authorProperty').split(' → ')[0]} → {authorProperty}
              </Text>
              <Text style={[styles.mappingItem, {color: colors.textPrimary}]}>
                • {t('settings:imageUrlProperty').split(' → ')[0]} → {imageUrlProperty}
              </Text>
            </View>
          </View>
        </Card>

        <View style={styles.completedActions}>
          <Button
            title={t('settings:changeSettings')}
            onPress={() => transitionToStep('mapping')}
            variant="secondary"
            style={styles.editButton}
            testID="edit-config-button"
          />
        </View>

        <TouchableOpacity
          onPress={handleResetToken}
          style={styles.resetLink}>
          <Text style={[styles.resetLinkText, {color: colors.error}]}>
            {t('settings:resetToken')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDeleteAllData}
          style={[styles.resetLink, {marginTop: spacing.md}]}>
          <Text style={[styles.resetLinkText, {color: colors.error}]}>
            {t('settings:deleteAllData')}
          </Text>
        </TouchableOpacity>

        <View style={{marginTop: spacing.lg}}>
          <Text style={[styles.configLabel, {color: colors.textSecondary}]}>
            {t('settings:languageSettings')}
          </Text>
          <View style={styles.languageOptions}>
            <TouchableOpacity
              style={[styles.languageOption, {
                borderColor: language === 'ja' ? colors.primary : colors.border,
                backgroundColor: language === 'ja' ? colors.primary + '15' : colors.backgroundSecondary,
              }]}
              onPress={() => {
                setLanguage('ja');
                changeLanguage('ja');
              }}>
              <Text style={[styles.languageOptionText, {
                color: language === 'ja' ? colors.primary : colors.textPrimary,
              }]}>
                {t('settings:languageJapanese')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.languageOption, {
                borderColor: language === 'en' ? colors.primary : colors.border,
                backgroundColor: language === 'en' ? colors.primary + '15' : colors.backgroundSecondary,
              }]}
              onPress={() => {
                setLanguage('en');
                changeLanguage('en');
              }}>
              <Text style={[styles.languageOptionText, {
                color: language === 'en' ? colors.primary : colors.textPrimary,
              }]}>
                {t('settings:languageEnglish')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ステップインジケーター */}
        {currentStep !== 'completed' && (
          <View style={styles.stepIndicator}>
            <View style={styles.stepDots}>
              <View style={[styles.stepDot, {
                backgroundColor: currentStep === 'token' ? colors.primary : colors.border,
              }]} />
              <View style={[styles.stepDot, {
                backgroundColor: currentStep === 'database' ? colors.primary : colors.border,
              }]} />
              <View style={[styles.stepDot, {
                backgroundColor: currentStep === 'mapping' ? colors.primary : colors.border,
              }]} />
            </View>
          </View>
        )}

        {/* ステップコンテンツ */}
        {currentStep === 'token' && renderTokenStep()}
        {currentStep === 'database' && renderDatabaseStep()}
        {currentStep === 'mapping' && renderMappingStep()}
        {currentStep === 'completed' && renderCompletedStep()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  stepIndicator: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  stepDots: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  stepSubtitle: {
    fontSize: typography.fontSize.md,
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  hint: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  helpLink: {
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
  },
  helpLinkText: {
    fontSize: typography.fontSize.sm,
    textDecorationLine: 'underline',
  },
  actionButton: {
    marginTop: spacing.lg,
  },
  radioContainer: {
    gap: spacing.sm,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderWidth: 1,
    borderRadius: 8,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  radioCircleSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  radioTextContainer: {
    flex: 1,
  },
  radioTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  radioId: {
    fontSize: typography.fontSize.sm,
  },
  stepActions: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  backButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  resetLink: {
    marginTop: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  resetLinkText: {
    fontSize: typography.fontSize.sm,
    textDecorationLine: 'underline',
  },
  propertySelectorContainer: {
    marginBottom: spacing.lg,
  },
  propertyLabel: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  propertyOptions: {
    gap: spacing.sm,
  },
  propertyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderWidth: 1,
    borderRadius: 8,
  },
  propertyRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  propertyRadioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  propertyTextContainer: {
    flex: 1,
  },
  propertyName: {
    fontSize: typography.fontSize.md,
    fontWeight: '500',
    marginBottom: 2,
  },
  propertyType: {
    fontSize: typography.fontSize.sm,
  },
  emptyPropertyMessage: {
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  emptyPropertyText: {
    fontSize: typography.fontSize.sm,
  },
  refreshButton: {
    marginTop: spacing.md,
  },
  successBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  successIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  successTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
  },
  completedSubtitle: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  configSection: {
    marginBottom: spacing.md,
  },
  configLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  configValue: {
    fontSize: typography.fontSize.md,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  configValueSub: {
    fontSize: typography.fontSize.sm,
  },
  configDivider: {
    height: 1,
    marginVertical: spacing.md,
  },
  mappingList: {
    marginTop: spacing.xs,
  },
  mappingItem: {
    fontSize: typography.fontSize.md,
    marginBottom: spacing.xs,
    lineHeight: 22,
  },
  completedActions: {
    marginTop: spacing.lg,
  },
  editButton: {
    width: '100%',
  },
  languageOptions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  languageOption: {
    flex: 1,
    padding: spacing.md,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  languageOptionText: {
    fontSize: typography.fontSize.md,
    fontWeight: '500',
  },
});
