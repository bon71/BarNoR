/**
 * ルートナビゲーター
 */

import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {BottomTabNavigator} from './BottomTabNavigator';
import {RootStackParamList} from './types';
import {ScanResultScreen} from '@/presentation/screens/ScanResultScreen';
import {useTheme} from '@/presentation/hooks/useTheme';
import {useTranslation} from '@/presentation/hooks/useTranslation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const {colors} = useTheme();
  const {t} = useTranslation();

  React.useEffect(() => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('[RootNavigator] Initializing navigation...');
    }
  }, []);

  return (
    <NavigationContainer
      onReady={() => {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.log('[RootNavigator] Navigation container ready');
        }
      }}
      onStateChange={(state) => {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.log('[RootNavigator] Navigation state changed:', state?.routes?.[state.index]?.name);
        }
      }}>
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
        }}
        initialRouteName="Main">
        <Stack.Screen
          name="Main"
          component={BottomTabNavigator}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="ScanResult"
          component={ScanResultScreen}
          options={{
            title: t('scanResult:title'),
            headerBackTitle: t('common:back'),
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.textPrimary,
            headerTitleStyle: {
              color: colors.textPrimary,
            },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
