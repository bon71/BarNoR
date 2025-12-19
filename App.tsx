/**
 * Notion Barcode Reader App
 * @format
 */

import React, {useEffect, useState} from 'react';
import {StatusBar, Alert} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {RootNavigator} from '@/presentation/navigation/RootNavigator';
import {ErrorBoundary} from '@/presentation/components/common/ErrorBoundary';
import {useThemeStore} from '@/presentation/stores/useThemeStore';
import {useConfigStore} from '@/presentation/stores/useConfigStore';
import {useLanguageStore} from '@/presentation/stores/useLanguageStore';
import {simplifiedConfigRepository} from '@/presentation/providers/ViewModelProvider';
import {changeLanguage} from '@/config/i18n';
import {useTranslation} from '@/presentation/hooks/useTranslation';

function App() {
  const {mode, initializeMode} = useThemeStore();
  const {setConfig, isConfigured} = useConfigStore();
  const {initializeLanguage} = useLanguageStore();
  const {t} = useTranslation();
  // UIを即座に表示するため、初期状態をtrueにする（最重要）
  const [isInitialized] = useState(true);

  // 言語設定の初期化と適用（i18nはindex.jsで初期化済み）
  useEffect(() => {
    initializeLanguage().then(() => {
      const currentLanguage = useLanguageStore.getState().language;
      changeLanguage(currentLanguage);
    });
  }, [initializeLanguage]);

  // 初期化処理（非同期で実行し、UIの表示をブロックしない）
  useEffect(() => {
    // UIを即座に表示するため、初期化を非同期で実行
    const initialize = async () => {
      try {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.log('[App] Starting initialization...');
        }

        // テーマモードの初期化と設定の読み込みを並列実行
        // これらは軽量な操作なので、UIの表示をブロックしない
        const [_, config] = await Promise.all([
          initializeMode().catch(err => {
            console.error('[App] Theme initialization failed:', err);
            throw err;
          }),
          simplifiedConfigRepository.loadConfig().catch(err => {
            console.error('[App] Config loading failed:', err);
            // 設定の読み込み失敗は致命的ではないので、nullを返す
            return null;
          }),
        ]);

        if (config) {
          setConfig(config);
          if (typeof __DEV__ !== 'undefined' && __DEV__) {
            console.log('[App] Config loaded successfully');
          }
        } else {
          if (typeof __DEV__ !== 'undefined' && __DEV__) {
            console.log('[App] No config found, using defaults');
          }
        }

        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.log('[App] Initialization completed');
        }
      } catch (error) {
        console.error('[App] Initialization error:', error);
        // エラーが発生してもUIは表示される
      }
    };

    // 次のイベントループで実行（UIの表示を優先）
    setTimeout(initialize, 0);
  }, [initializeMode, setConfig]);

  // Notion未連携時のポップアップ表示
  useEffect(() => {
    if (!isInitialized || isConfigured) {
      return;
    }

    // 少し遅延させてからポップアップを表示
    const timer = setTimeout(() => {
      Alert.alert(
        t('alerts:notionIntegrationRequired'),
        t('alerts:notionIntegrationRequiredMessage'),
        [
          {
            text: t('common:ok'),
            onPress: () => {
              // BottomTabNavigatorで未連携時は設定タブから開始するため、
              // ここでは特に何もしない
            },
          },
        ],
        {cancelable: false}
      );
    }, 500);

    return () => clearTimeout(timer);
  }, [isInitialized, isConfigured, t]);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaProvider>
          <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />
          <RootNavigator />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = {
  container: {
    flex: 1,
  },
};

export default App;
