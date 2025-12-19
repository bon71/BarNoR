/**
 * FadeIn アニメーションフック テスト
 */

import {renderHook} from '@testing-library/react-native';
import {useFadeIn} from '@/presentation/animations/FadeIn';
import {Animated} from 'react-native';

describe('useFadeIn', () => {
  let mockStart: jest.Mock;
  let mockTiming: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStart = jest.fn();
    mockTiming = jest.spyOn(Animated, 'timing').mockReturnValue({
      start: mockStart,
    } as any);
  });

  afterEach(() => {
    mockTiming.mockRestore();
  });

  it('デフォルトのdurationでフェードインアニメーションを開始する', () => {
    const {result} = renderHook(() => useFadeIn());

    expect(result.current).toBeInstanceOf(Animated.Value);
    expect(mockTiming).toHaveBeenCalledWith(
      expect.any(Animated.Value),
      expect.objectContaining({
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    );
    expect(mockStart).toHaveBeenCalled();
  });

  it('カスタムdurationでフェードインアニメーションを開始する', () => {
    const customDuration = 500;
    const {result} = renderHook(() => useFadeIn(customDuration));

    expect(result.current).toBeInstanceOf(Animated.Value);
    expect(mockTiming).toHaveBeenCalledWith(
      expect.any(Animated.Value),
      expect.objectContaining({
        toValue: 1,
        duration: customDuration,
        useNativeDriver: true,
      })
    );
    expect(mockStart).toHaveBeenCalled();
  });

  it('アニメーションが開始される', () => {
    renderHook(() => useFadeIn());

    expect(mockStart).toHaveBeenCalled();
  });
});

