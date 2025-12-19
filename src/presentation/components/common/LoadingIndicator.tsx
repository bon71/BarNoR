/**
 * ローディングインジケーターコンポーネント
 */

import React from 'react';
import {View, ActivityIndicator, Text, StyleSheet} from 'react-native';
import {colors, spacing, typography} from '@/config/theme';

interface LoadingIndicatorProps {
  message?: string;
  size?: 'small' | 'large';
  testID?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  message,
  size = 'large',
  testID,
}) => {
  return (
    <View style={styles.container} testID={testID}>
      <ActivityIndicator size={size} color={colors.primary} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  message: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
