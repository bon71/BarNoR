/**
 * Card コンポーネント テスト
 */

import React from 'react';
import {Text} from 'react-native';
import {render} from '@testing-library/react-native';
import {Card} from '@/presentation/components/common/Card';
import {useTheme} from '@/presentation/hooks/useTheme';

// useThemeのモック
jest.mock('@/presentation/hooks/useTheme');

// BlurViewのモック
jest.mock('@/presentation/components/common/BlurView', () => {
  const React = require('react');
  const {View} = require('react-native');

  return {
    BlurView: ({children, testID, style, blurType, blurAmount}: any) =>
      React.createElement(
        View,
        {testID, style, 'data-blur-type': blurType, 'data-blur-amount': blurAmount},
        children
      ),
  };
});

const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;

describe('Card', () => {
  beforeEach(() => {
    mockUseTheme.mockReturnValue({
      colors: {
        primary: '#37352F',
        primaryText: '#FFFFFF',
        secondary: '#E3E2E0',
        secondaryText: '#37352F',
        success: '#0F7B6C',
        error: '#E03E3E',
        warning: '#FFA344',
        info: '#0B6E99',
        white: '#FFFFFF',
        background: '#FFFFFF',
        backgroundSecondary: '#F7F6F3',
        backgroundTertiary: '#EDECE9',
        text: '#37352F',
        textPrimary: '#37352F',
        textSecondary: '#787774',
        textTertiary: '#9B9A97',
        border: '#E3E2E0',
        borderLight: '#EDECE9',
        hover: '#F1F0EE',
        active: '#E8E7E4',
      },
      spacing: {xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48},
      borderRadius: {sm: 4, md: 8, lg: 12, xl: 16},
      typography: {
        fontFamily: {regular: 'SF Pro Text', display: 'SF Pro Display'},
        fontSize: {xs: 12, sm: 14, md: 16, lg: 20, xl: 24, xxl: 32},
        fontWeight: {regular: '400', medium: '500', semibold: '600', bold: '700'},
      },
      shadows: {
        small: {shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1},
        sm: {shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1},
        md: {shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3},
        lg: {shadowColor: '#000', shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.1, shadowRadius: 15, elevation: 6},
      },
      mode: 'light' as const,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('基本的なレンダリング', () => {
    it('正しくレンダリングされる', () => {
      const {getByTestId} = render(
        <Card testID="test-card">
          <Text>Card Content</Text>
        </Card>
      );

      expect(getByTestId('test-card')).toBeTruthy();
    });

    it('childrenが表示される', () => {
      const {getByText} = render(
        <Card>
          <Text>Test Content</Text>
        </Card>
      );

      expect(getByText('Test Content')).toBeTruthy();
    });

    it('複数のchildrenが表示される', () => {
      const {getByText} = render(
        <Card>
          <Text>First Child</Text>
          <Text>Second Child</Text>
        </Card>
      );

      expect(getByText('First Child')).toBeTruthy();
      expect(getByText('Second Child')).toBeTruthy();
    });
  });

  describe('通常モード（enableBlur=false）', () => {
    it('通常のViewとして表示される', () => {
      const {getByTestId} = render(
        <Card testID="test-card" enableBlur={false}>
          <Text>Content</Text>
        </Card>
      );

      const card = getByTestId('test-card');
      expect(card.type).toBe('View');
    });

    it('テーマの背景色が適用される', () => {
      const {getByTestId} = render(
        <Card testID="test-card">
          <Text>Content</Text>
        </Card>
      );

      const card = getByTestId('test-card');
      const styles = card.props.style;
      const flatStyles = Array.isArray(styles) ? Object.assign({}, ...styles) : styles;

      expect(flatStyles.backgroundColor).toBe('#F7F6F3');
    });

    it('テーマのボーダー色が適用される', () => {
      const {getByTestId} = render(
        <Card testID="test-card">
          <Text>Content</Text>
        </Card>
      );

      const card = getByTestId('test-card');
      const styles = card.props.style;
      const flatStyles = Array.isArray(styles) ? Object.assign({}, ...styles) : styles;

      expect(flatStyles.borderColor).toBe('#E3E2E0');
    });

    it('カスタムスタイルが適用される', () => {
      const customStyle = {marginTop: 20, padding: 10};

      const {getByTestId} = render(
        <Card testID="test-card" style={customStyle}>
          <Text>Content</Text>
        </Card>
      );

      const card = getByTestId('test-card');
      const styles = card.props.style;
      const flatStyles = Array.isArray(styles) ? Object.assign({}, ...styles) : styles;

      expect(flatStyles.marginTop).toBe(20);
      expect(flatStyles.padding).toBe(10);
    });
  });

  describe('Liquid Glassモード（enableBlur=true）', () => {
    it('BlurViewとして表示される', () => {
      const {getByTestId} = render(
        <Card testID="test-card" enableBlur={true}>
          <Text>Content</Text>
        </Card>
      );

      const card = getByTestId('test-card');
      // BlurViewのモックがViewを返すので、typeはViewになる
      expect(card).toBeTruthy();
    });

    it('デフォルトのblurTypeが適用される', () => {
      const {getByTestId} = render(
        <Card testID="test-card" enableBlur={true}>
          <Text>Content</Text>
        </Card>
      );

      const card = getByTestId('test-card');
      expect(card.props['data-blur-type']).toBe('light');
    });

    it('カスタムblurTypeが適用される', () => {
      const {getByTestId} = render(
        <Card testID="test-card" enableBlur={true} blurType="dark">
          <Text>Content</Text>
        </Card>
      );

      const card = getByTestId('test-card');
      expect(card.props['data-blur-type']).toBe('dark');
    });

    it('デフォルトのblurAmountが適用される', () => {
      const {getByTestId} = render(
        <Card testID="test-card" enableBlur={true}>
          <Text>Content</Text>
        </Card>
      );

      const card = getByTestId('test-card');
      expect(card.props['data-blur-amount']).toBe(80);
    });

    it('カスタムblurAmountが適用される', () => {
      const {getByTestId} = render(
        <Card testID="test-card" enableBlur={true} blurAmount={50}>
          <Text>Content</Text>
        </Card>
      );

      const card = getByTestId('test-card');
      expect(card.props['data-blur-amount']).toBe(50);
    });

    it('Liquid Glassモードでもchildrenが表示される', () => {
      const {getByText} = render(
        <Card enableBlur={true}>
          <Text>Blur Content</Text>
        </Card>
      );

      expect(getByText('Blur Content')).toBeTruthy();
    });

    it('Liquid Glassモードでもカスタムスタイルが適用される', () => {
      const customStyle = {marginBottom: 15};

      const {getByTestId} = render(
        <Card testID="test-card" enableBlur={true} style={customStyle}>
          <Text>Content</Text>
        </Card>
      );

      const card = getByTestId('test-card');
      const styles = card.props.style;
      const flatStyles = Array.isArray(styles) ? Object.assign({}, ...styles) : styles;

      expect(flatStyles.marginBottom).toBe(15);
    });
  });

  describe('エッジケース', () => {
    it('childrenなしでもレンダリングされる', () => {
      const {getByTestId} = render(<Card testID="test-card" />);

      expect(getByTestId('test-card')).toBeTruthy();
    });

    it('testIDなしでもレンダリングされる', () => {
      const {getByText} = render(
        <Card>
          <Text>Content</Text>
        </Card>
      );

      expect(getByText('Content')).toBeTruthy();
    });

    it('空のstyleでもレンダリングされる', () => {
      const {getByTestId} = render(
        <Card testID="test-card" style={{}}>
          <Text>Content</Text>
        </Card>
      );

      expect(getByTestId('test-card')).toBeTruthy();
    });
  });
});
