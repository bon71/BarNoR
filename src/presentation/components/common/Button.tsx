/**
 * ボタンコンポーネント
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import {spacing, typography} from '@/config/theme';
import {useTheme} from '@/presentation/hooks/useTheme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  testID,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const {colors} = useTheme();

  // Notionライクなボタンスタイル
  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.primary,
        };
      case 'secondary':
        return {
          backgroundColor: colors.secondary,
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'danger':
        return {
          backgroundColor: colors.error,
        };
      default:
        return {
          backgroundColor: colors.primary,
        };
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
        return colors.primaryText;
      case 'secondary':
        return colors.secondaryText;
      case 'danger':
        return colors.white;
      default:
        return colors.primaryText;
    }
  };

  const buttonStyle = [
    styles.button,
    getVariantStyle(),
    styles[`button_${size}`],
    disabled && styles.button_disabled,
    style,
  ];

  const textStyleCombined = [
    styles.text,
    {color: getTextColor()},
    styles[`text_${size}`],
    disabled && styles.text_disabled,
    textStyle,
  ];

  const loadingColor = variant === 'primary' ? colors.primaryText : colors.primary;

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{disabled: disabled || loading}}
      testID={testID}>
      {loading ? (
        <ActivityIndicator color={loadingColor} />
      ) : (
        <Text style={textStyleCombined}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  button_small: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minHeight: 32,
  },
  button_medium: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  button_large: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 56,
  },
  button_disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '600',
  },
  text_small: {
    fontSize: typography.fontSize.sm,
  },
  text_medium: {
    fontSize: typography.fontSize.md,
  },
  text_large: {
    fontSize: typography.fontSize.lg,
  },
  text_disabled: {
    opacity: 0.7,
  },
});
