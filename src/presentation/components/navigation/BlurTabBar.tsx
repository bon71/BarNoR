/**
 * iOS風フローティングタブバーコンポーネント
 * Liquid Glassエフェクトとフローティングデザインを適用
 */

import React, {useMemo, useCallback} from 'react';
import {View, TouchableOpacity, Text, StyleSheet} from 'react-native';
import {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {BlurView} from '@/presentation/components/common/BlurView';
import {useTheme} from '@/presentation/hooks/useTheme';
import {spacing} from '@/config/theme';

const BlurTabBarComponent: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const {colors, mode} = useTheme();

  const labels = useMemo(() => {
    return state.routes.map(route => {
      const {options} = descriptors[route.key];
      return (
        options.tabBarLabel !== undefined
          ? options.tabBarLabel
          : options.title !== undefined
          ? options.title
          : route.name
      ) as string;
    });
  }, [state.routes, descriptors]);

  const createOnPress = useCallback(
    (routeName: string, routeKey: string, isFocused: boolean) => () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: routeKey,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(routeName);
      }
    },
    [navigation],
  );

  const createOnLongPress = useCallback(
    (routeKey: string) => () => {
      navigation.emit({
        type: 'tabLongPress',
        target: routeKey,
      });
    },
    [navigation],
  );

  return (
    <View style={[styles.container, {paddingBottom: insets.bottom}]}>
      <BlurView
        blurType={mode === 'dark' ? 'dark' : 'light'}
        blurAmount={80}
        style={styles.tabBarContainer}>
        <View style={styles.tabBar}>
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const onPress = createOnPress(route.name, route.key, isFocused);
            const onLongPress = createOnLongPress(route.key);

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? {selected: true} : {}}
                accessibilityLabel={descriptors[route.key].options.tabBarAccessibilityLabel}
                testID={`tab-${route.name}`}
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.tab}>
                <View
                  style={[
                    styles.tabContent,
                    isFocused && {
                      backgroundColor: colors.primary + '15',
                    },
                  ]}>
                  <Text
                    style={[
                      styles.tabLabel,
                      isFocused ? styles.tabLabelFocused : styles.tabLabelUnfocused,
                      { color: isFocused ? colors.primary : colors.textSecondary },
                    ]}>
                    {labels[index]}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
};

export const BlurTabBar = React.memo(BlurTabBarComponent);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  tabBarContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    // iOS Shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    // Android Elevation
    elevation: 8,
  },
  tabBar: {
    flexDirection: 'row',
    height: 60,
    paddingHorizontal: spacing.sm,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
  },
  tabLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  tabLabelFocused: {
    fontWeight: '600',
  },
  tabLabelUnfocused: {
    fontWeight: '400',
  },
});
