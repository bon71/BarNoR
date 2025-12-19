/**
 * インプットコンポーネント
 */

import React from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import {spacing, typography} from '@/config/theme';
import {useTheme} from '@/presentation/hooks/useTheme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  testID?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  testID,
  ...textInputProps
}) => {
  const {colors} = useTheme();

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, {color: colors.textPrimary}]}>
          {label}
        </Text>
      )}
      <TextInput
        style={[
          styles.input,
          {
            borderColor: error ? colors.error : colors.border,
            color: colors.textPrimary,
            backgroundColor: colors.background,
          },
          textInputProps.multiline && styles.input_multiline,
        ]}
        placeholderTextColor={colors.textSecondary}
        testID={testID}
        {...textInputProps}
      />
      {error && (
        <Text style={[styles.errorText, {color: colors.error}]}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.md,
    minHeight: 44,
  },
  input_multiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
  },
});
