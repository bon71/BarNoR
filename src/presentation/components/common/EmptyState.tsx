/**
 * 空状態コンポーネント
 * 履歴なし、パッケージなしなどの空状態を表示
 */

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {spacing, typography} from '@/config/theme';
import {useTheme} from '@/presentation/hooks/useTheme';
import {Button} from './Button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📭',
  title,
  description,
  actionLabel,
  onAction,
  testID,
}) => {
  const {colors} = useTheme();

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.title, {color: colors.textPrimary}]} testID={`${testID}-title`}>
        {title}
      </Text>
      {description && (
        <Text style={[styles.description, {color: colors.textSecondary}]} testID={`${testID}-description`}>
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          style={styles.actionButton}
          testID={`${testID}-action`}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
  },
  icon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: typography.fontSize.md,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 24,
  },
  actionButton: {
    marginTop: spacing.md,
  },
});


