/**
 * カードコンポーネント
 * iOS風Liquid Glassエフェクト対応
 */

import React from 'react';
import {View, StyleSheet, ViewStyle, StyleProp} from 'react-native';
import {spacing, shadows} from '@/config/theme';
import {useTheme} from '@/presentation/hooks/useTheme';
import {BlurView, BlurType} from './BlurView';

interface CardProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  /** Liquid Glassエフェクトを有効にする */
  enableBlur?: boolean;
  /** ブラーのタイプ（デフォルト: 'light'） */
  blurType?: BlurType;
  /** ブラーの強度 0-100（デフォルト: 80） */
  blurAmount?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  testID,
  enableBlur = false,
  blurType = 'light',
  blurAmount = 80,
}) => {
  const {colors} = useTheme();

  if (enableBlur) {
    return (
      <BlurView
        blurType={blurType}
        blurAmount={blurAmount}
        style={[
          styles.card,
          styles.blurCard,
          style,
        ]}
        testID={testID}>
        {children}
      </BlurView>
    );
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.backgroundSecondary,
          borderColor: colors.border,
        },
        style,
      ]}
      testID={testID}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    padding: spacing.md,
    borderWidth: 1,
    ...shadows.small,
  },
  blurCard: {
    // iOS風のガラスエフェクトに適したスタイル
    overflow: 'hidden',
    backgroundColor: 'transparent',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...shadows.md,
  },
});
