/**
 * BlurTabBar テスト
 */

import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {BlurTabBar} from '@/presentation/components/navigation/BlurTabBar';
import {useTheme} from '@/presentation/hooks/useTheme';

// Mock
jest.mock('@/presentation/hooks/useTheme', () => ({
  useTheme: jest.fn(() => ({
    colors: {
      primary: '#37352F',
      textSecondary: '#787774',
    },
    mode: 'light',
  })),
}));

jest.mock('@/presentation/components/common/BlurView', () => ({
  BlurView: ({children, style, testID}: any) => {
    const React = require('react');
    const {View} = require('react-native');
    return React.createElement(View, {style, testID}, children);
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({
    bottom: 0,
    top: 0,
    left: 0,
    right: 0,
  })),
}));

describe('BlurTabBar', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    emit: jest.fn(() => ({defaultPrevented: false})),
  };

  const createMockProps = (index: number = 0): any => ({
    state: {
      index,
      routes: [
        {key: 'route1', name: 'Screen1', params: undefined},
        {key: 'route2', name: 'Screen2', params: undefined},
      ],
      routeNames: ['Screen1', 'Screen2'],
      history: [],
      type: 'tab',
      key: 'tab',
      stale: false,
      preloadedRouteKeys: [],
    },
    descriptors: {
      route1: {
        options: {tabBarLabel: 'タブ1'},
        navigation: mockNavigation as any,
        route: {key: 'route1', name: 'Screen1', params: undefined},
        render: jest.fn(),
      },
      route2: {
        options: {tabBarLabel: 'タブ2'},
        navigation: mockNavigation as any,
        route: {key: 'route2', name: 'Screen2', params: undefined},
        render: jest.fn(),
      },
    },
    navigation: mockNavigation as any,
    insets: {bottom: 0, top: 0, left: 0, right: 0},
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('タブバーが正しくレンダリングされる', () => {
    const props = createMockProps();
    const {getByTestId, getByText} = render(<BlurTabBar {...props} />);

    expect(getByTestId('tab-Screen1')).toBeTruthy();
    expect(getByTestId('tab-Screen2')).toBeTruthy();
    expect(getByText('タブ1')).toBeTruthy();
    expect(getByText('タブ2')).toBeTruthy();
  });

  it('タブをタップするとナビゲーションが発生する', () => {
    const mockProps = createMockProps();
    const {getByTestId} = render(<BlurTabBar {...mockProps} />);

    const tab2 = getByTestId('tab-Screen2');
    fireEvent.press(tab2);

    expect(mockNavigation.emit).toHaveBeenCalledWith({
      type: 'tabPress',
      target: 'route2',
      canPreventDefault: true,
    });
  });

  it('フォーカスされたタブが正しく表示される', () => {
    const props = createMockProps(0);
    const {getByTestId} = render(<BlurTabBar {...props} />);

    const tab1 = getByTestId('tab-Screen1');
    expect(tab1.props.accessibilityState?.selected).toBe(true);

    const tab2 = getByTestId('tab-Screen2');
    // フォーカスされていないタブはselectedがfalseまたはundefined
    expect(tab2.props.accessibilityState?.selected).not.toBe(true);
  });

  it('tabBarLabelがない場合、titleが使用される', () => {
    const props = createMockProps();
    props.descriptors.route1.options = {title: 'タイトル1'};
    props.descriptors.route2.options = {title: 'タイトル2'};

    const {getByText} = render(<BlurTabBar {...props} />);

    expect(getByText('タイトル1')).toBeTruthy();
    expect(getByText('タイトル2')).toBeTruthy();
  });

  it('tabBarLabelもtitleもない場合、route.nameが使用される', () => {
    const props = createMockProps();
    props.descriptors.route1.options = {};
    props.descriptors.route2.options = {};

    const {getByText} = render(<BlurTabBar {...props} />);

    expect(getByText('Screen1')).toBeTruthy();
    expect(getByText('Screen2')).toBeTruthy();
  });

  it('ダークモードで正しくレンダリングされる', () => {
    (useTheme as jest.Mock).mockReturnValue({
      colors: {
        primary: '#FFFFFF',
        textSecondary: '#9B9A97',
      },
      mode: 'dark',
    });

    const props = createMockProps();
    const {getByTestId} = render(<BlurTabBar {...props} />);

    expect(getByTestId('tab-Screen1')).toBeTruthy();
  });

  it('ロングプレスでイベントが発火される', () => {
    const props = createMockProps();
    const {getByTestId} = render(<BlurTabBar {...props} />);

    const tab1 = getByTestId('tab-Screen1');
    fireEvent(tab1, 'onLongPress');

    expect(mockNavigation.emit).toHaveBeenCalledWith({
      type: 'tabLongPress',
      target: 'route1',
    });
  });
});

