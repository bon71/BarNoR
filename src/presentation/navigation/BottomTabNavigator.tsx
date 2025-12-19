/**
 * ボトムタブナビゲーター
 * MVP最小化: スキャン/設定の2タブのみ
 */

import React, {useCallback} from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {BottomTabParamList} from './types';
import {colors} from '@/config/theme';
import {BlurTabBar} from '@/presentation/components/navigation/BlurTabBar';
import {useConfigStore} from '@/presentation/stores/useConfigStore';
import {ScanScreenWrapper} from '@/presentation/screens/ScanScreenWrapper';
import {SettingsScreenSimple} from '@/presentation/screens/SettingsScreenSimple';
import {useTranslation} from '@/presentation/hooks/useTranslation';

const Tab = createBottomTabNavigator<BottomTabParamList>();

export const BottomTabNavigator: React.FC = () => {
  const {isConfigured} = useConfigStore();
  const {t} = useTranslation();

  React.useEffect(() => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('[BottomTabNavigator] Initializing with isConfigured:', isConfigured);
    }
  }, [isConfigured]);

  const renderTabBar = useCallback((props: any) => {
    return <BlurTabBar {...props} />;
  }, []);

  const initialRouteName = isConfigured ? 'Scan' : 'Settings';
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.log('[BottomTabNavigator] Initial route:', initialRouteName);
  }

  return (
    <Tab.Navigator
      tabBar={renderTabBar}
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerShown: false,
        lazy: true,
      }}
      initialRouteName={initialRouteName}>
      <Tab.Screen
        name="Scan"
        component={ScanScreenWrapper}
        options={{
          tabBarLabel: t('navigation:scan'),
          tabBarIcon: () => null, // TODO: アイコンを追加
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreenSimple}
        options={{
          tabBarLabel: t('navigation:settings'),
          tabBarIcon: () => null, // TODO: アイコンを追加
        }}
      />
    </Tab.Navigator>
  );
};
