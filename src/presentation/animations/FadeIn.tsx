import {useEffect, useRef} from 'react';
import {Animated} from 'react-native';

/**
 * フェードイン用のアニメーションフック
 * コンポーネントマウント時に0→1へ不透明度をアニメーション
 */
export const useFadeIn = (duration = 300): Animated.Value => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      useNativeDriver: true,
    }).start();
  }, [duration, opacity]);

  return opacity;
};


