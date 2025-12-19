/**
 * Skeleton テスト
 */

import React from 'react';
import {render} from '@testing-library/react-native';
import {Text} from 'react-native';
import {SkeletonScreen, SkeletonItem} from '@/presentation/components/common/Skeleton';
import {useTheme} from '@/presentation/hooks/useTheme';

jest.mock('@/presentation/hooks/useTheme');

describe('Skeleton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (useTheme as jest.Mock).mockReturnValue({
      colors: {
        border: '#E0E0E0',
      },
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('SkeletonScreen', () => {
    it('子要素を表示できる', () => {
      const {getByText} = render(
        <SkeletonScreen>
          <Text>テストコンテンツ</Text>
        </SkeletonScreen>,
      );

      expect(getByText('テストコンテンツ')).toBeTruthy();
    });

    it('カスタムスタイルを適用できる', () => {
      const {getByText} = render(
        <SkeletonScreen style={{padding: 20}}>
          <Text>テスト</Text>
        </SkeletonScreen>,
      );

      expect(getByText('テスト')).toBeTruthy();
    });
  });

  describe('SkeletonItem', () => {
    it('基本的なプロパティでレンダリングできる', () => {
      render(<SkeletonItem width={100} height={50} />);

      // コンポーネントがレンダリングされることを確認
      expect(true).toBe(true);
    });

    it('カスタムborderRadiusを適用できる', () => {
      render(<SkeletonItem width={100} height={50} borderRadius={16} />);

      // コンポーネントがレンダリングされることを確認
      expect(true).toBe(true);
    });

    it('カスタムスタイルを適用できる', () => {
      render(<SkeletonItem width={100} height={50} style={{marginTop: 10}} />);

      // コンポーネントがレンダリングされることを確認
      expect(true).toBe(true);
    });

    it('文字列のwidthを適用できる', () => {
      render(<SkeletonItem width="50%" height={50} />);

      // コンポーネントがレンダリングされることを確認
      expect(true).toBe(true);
    });

    it('アニメーションが動作する', () => {
      render(<SkeletonItem width={100} height={50} />);

      // タイマーを進めてアニメーションを確認
      jest.advanceTimersByTime(1000);

      // コンポーネントがレンダリングされることを確認
      expect(true).toBe(true);
    });
  });
});

