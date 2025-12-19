import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, View, ViewStyle} from 'react-native';
import {useTheme} from '@/presentation/hooks/useTheme';

export const SkeletonScreen: React.FC<{children: React.ReactNode; style?: ViewStyle}> = ({
  children,
  style,
}) => {
  return <View style={[styles.screen, style]}>{children}</View>;
};

interface SkeletonItemProps {
  width: number | string;
  height: number;
  style?: ViewStyle;
  borderRadius?: number;
}

export const SkeletonItem: React.FC<SkeletonItemProps> = ({
  width,
  height,
  style,
  borderRadius = 8,
}) => {
  const {colors} = useTheme();
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {toValue: 1, duration: 700, useNativeDriver: true}),
        Animated.timing(opacity, {toValue: 0.6, duration: 700, useNativeDriver: true}),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
    };
  }, [opacity]);

  const animatedStyle = {
    opacity,
  };

  const staticStyle = {
    width,
    height,
    borderRadius,
    backgroundColor: colors.border,
  };

  return (
    <Animated.View
      style={[
        styles.item,
        staticStyle as any, // Animated型との互換性のため
        style,
        animatedStyle,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  screen: {
    width: '100%',
    gap: 10,
  },
  item: {
    overflow: 'hidden',
  },
});


