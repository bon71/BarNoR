/**
 * Input コンポーネント テスト
 */

import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {Input} from '@/presentation/components/common/Input';
import {useTheme} from '@/presentation/hooks/useTheme';

// useThemeのモック
jest.mock('@/presentation/hooks/useTheme');

const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;

describe('Input', () => {
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
      const {getByTestId} = render(<Input testID="test-input" />);

      expect(getByTestId('test-input')).toBeTruthy();
    });

    it('プレースホルダーが表示される', () => {
      const {getByPlaceholderText} = render(
        <Input placeholder="Enter text" />
      );

      expect(getByPlaceholderText('Enter text')).toBeTruthy();
    });

    it('valueが反映される', () => {
      const {getByDisplayValue} = render(<Input value="Test Value" />);

      expect(getByDisplayValue('Test Value')).toBeTruthy();
    });
  });

  describe('ラベル', () => {
    it('ラベルが表示される', () => {
      const {getByText} = render(<Input label="Name" />);

      expect(getByText('Name')).toBeTruthy();
    });

    it('ラベルなしでもレンダリングされる', () => {
      const {getByTestId} = render(<Input testID="test-input" />);

      expect(getByTestId('test-input')).toBeTruthy();
    });

    it('ラベルにテーマのtextPrimary色が適用される', () => {
      const {getByText} = render(<Input label="Username" />);

      const label = getByText('Username');
      const styles = label.props.style;
      const flatStyles = Array.isArray(styles) ? Object.assign({}, ...styles) : styles;

      expect(flatStyles.color).toBe('#37352F');
    });
  });

  describe('エラーメッセージ', () => {
    it('エラーメッセージが表示される', () => {
      const {getByText} = render(<Input error="This field is required" />);

      expect(getByText('This field is required')).toBeTruthy();
    });

    it('エラーがない場合、エラーメッセージは表示されない', () => {
      const {queryByText} = render(<Input label="Email" />);

      expect(queryByText('This field is required')).toBeNull();
    });

    it('エラーメッセージにエラー色が適用される', () => {
      const {getByText} = render(<Input error="Invalid input" />);

      const errorText = getByText('Invalid input');
      const styles = errorText.props.style;
      const flatStyles = Array.isArray(styles) ? Object.assign({}, ...styles) : styles;

      expect(flatStyles.color).toBe('#E03E3E');
    });

    it('エラー時、ボーダー色がエラー色になる', () => {
      const {getByTestId} = render(
        <Input testID="test-input" error="Error message" />
      );

      const input = getByTestId('test-input');
      const styles = input.props.style;
      const flatStyles = Array.isArray(styles) ? Object.assign({}, ...styles) : styles;

      expect(flatStyles.borderColor).toBe('#E03E3E');
    });

    it('エラーがない場合、通常のボーダー色が適用される', () => {
      const {getByTestId} = render(<Input testID="test-input" />);

      const input = getByTestId('test-input');
      const styles = input.props.style;
      const flatStyles = Array.isArray(styles) ? Object.assign({}, ...styles) : styles;

      expect(flatStyles.borderColor).toBe('#E3E2E0');
    });
  });

  describe('イベントハンドリング', () => {
    it('onChangeTextが呼ばれる', () => {
      const handleChange = jest.fn();
      const {getByTestId} = render(
        <Input testID="test-input" onChangeText={handleChange} />
      );

      const input = getByTestId('test-input');
      fireEvent.changeText(input, 'new text');

      expect(handleChange).toHaveBeenCalledWith('new text');
    });

    it('onBlurが呼ばれる', () => {
      const handleBlur = jest.fn();
      const {getByTestId} = render(
        <Input testID="test-input" onBlur={handleBlur} />
      );

      const input = getByTestId('test-input');
      fireEvent(input, 'blur');

      expect(handleBlur).toHaveBeenCalled();
    });

    it('onFocusが呼ばれる', () => {
      const handleFocus = jest.fn();
      const {getByTestId} = render(
        <Input testID="test-input" onFocus={handleFocus} />
      );

      const input = getByTestId('test-input');
      fireEvent(input, 'focus');

      expect(handleFocus).toHaveBeenCalled();
    });
  });

  describe('multiline', () => {
    it('multiline propsが適用される', () => {
      const {getByTestId} = render(
        <Input testID="test-input" multiline={true} />
      );

      const input = getByTestId('test-input');
      expect(input.props.multiline).toBe(true);
    });

    it('multiline時、異なるスタイルが適用される', () => {
      const {getByTestId} = render(
        <Input testID="test-input" multiline={true} />
      );

      const input = getByTestId('test-input');
      const styles = input.props.style;
      const flatStyles = Array.isArray(styles) ? Object.assign({}, ...styles) : styles;

      expect(flatStyles.minHeight).toBe(100);
      expect(flatStyles.textAlignVertical).toBe('top');
    });

    it('multiline=false時、通常のスタイルが適用される', () => {
      const {getByTestId} = render(
        <Input testID="test-input" multiline={false} />
      );

      const input = getByTestId('test-input');
      const styles = input.props.style;
      const flatStyles = Array.isArray(styles) ? Object.assign({}, ...styles) : styles;

      expect(flatStyles.minHeight).toBe(44);
    });
  });

  describe('TextInputProps継承', () => {
    it('secureTextEntryが適用される', () => {
      const {getByTestId} = render(
        <Input testID="test-input" secureTextEntry={true} />
      );

      const input = getByTestId('test-input');
      expect(input.props.secureTextEntry).toBe(true);
    });

    it('keyboardTypeが適用される', () => {
      const {getByTestId} = render(
        <Input testID="test-input" keyboardType="email-address" />
      );

      const input = getByTestId('test-input');
      expect(input.props.keyboardType).toBe('email-address');
    });

    it('autoCapitalizeが適用される', () => {
      const {getByTestId} = render(
        <Input testID="test-input" autoCapitalize="none" />
      );

      const input = getByTestId('test-input');
      expect(input.props.autoCapitalize).toBe('none');
    });

    it('editableが適用される', () => {
      const {getByTestId} = render(
        <Input testID="test-input" editable={false} />
      );

      const input = getByTestId('test-input');
      expect(input.props.editable).toBe(false);
    });

    it('maxLengthが適用される', () => {
      const {getByTestId} = render(
        <Input testID="test-input" maxLength={100} />
      );

      const input = getByTestId('test-input');
      expect(input.props.maxLength).toBe(100);
    });
  });

  describe('スタイル', () => {
    it('containerStyleが適用される', () => {
      const containerStyle = {marginTop: 20};
      const {getByTestId} = render(
        <Input testID="test-input" containerStyle={containerStyle} />
      );

      // containerはInputの親要素なので、直接取得できない
      // ここではエラーが起きないことを確認
      expect(getByTestId('test-input')).toBeTruthy();
    });

    it('テーマのbackground色がInputに適用される', () => {
      const {getByTestId} = render(<Input testID="test-input" />);

      const input = getByTestId('test-input');
      const styles = input.props.style;
      const flatStyles = Array.isArray(styles) ? Object.assign({}, ...styles) : styles;

      expect(flatStyles.backgroundColor).toBe('#FFFFFF');
    });

    it('テーマのtextPrimary色がInputに適用される', () => {
      const {getByTestId} = render(<Input testID="test-input" />);

      const input = getByTestId('test-input');
      const styles = input.props.style;
      const flatStyles = Array.isArray(styles) ? Object.assign({}, ...styles) : styles;

      expect(flatStyles.color).toBe('#37352F');
    });

    it('placeholderTextColorがtextSecondary色になる', () => {
      const {getByTestId} = render(<Input testID="test-input" />);

      const input = getByTestId('test-input');
      expect(input.props.placeholderTextColor).toBe('#787774');
    });
  });

  describe('エッジケース', () => {
    it('すべてのpropsなしでもレンダリングされる', () => {
      const {getByTestId} = render(<Input testID="test-input" />);

      expect(getByTestId('test-input')).toBeTruthy();
    });

    it('空文字列のlabelでもレンダリングされる', () => {
      const {getByTestId} = render(<Input testID="test-input" label="" />);

      expect(getByTestId('test-input')).toBeTruthy();
    });

    it('空文字列のerrorでもレンダリングされる', () => {
      const {getByTestId} = render(<Input testID="test-input" error="" />);

      expect(getByTestId('test-input')).toBeTruthy();
    });

    it('labelとerrorの両方が表示される', () => {
      const {getByText} = render(
        <Input label="Email" error="Invalid email" />
      );

      expect(getByText('Email')).toBeTruthy();
      expect(getByText('Invalid email')).toBeTruthy();
    });
  });
});
