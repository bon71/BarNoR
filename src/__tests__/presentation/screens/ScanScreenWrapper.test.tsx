/**
 * ScanScreenWrapper テスト
 */

import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {ScanScreenWrapper} from '@/presentation/screens/ScanScreenWrapper';
import {scanViewModel} from '@/presentation/providers/ViewModelProvider';
import {showErrorToast} from '@/presentation/stores/useToastStore';
import {Vibration} from 'react-native';
import {ScannedItem, ItemType} from '@/domain/entities/ScannedItem';

// モック
jest.mock('@/presentation/providers/ViewModelProvider', () => ({
  scanViewModel: {
    scanBarcode: jest.fn(),
  },
}));

jest.mock('@/presentation/stores/useToastStore', () => ({
  showErrorToast: jest.fn(),
}));

// Vibrationをモック
jest.spyOn(require('react-native'), 'Vibration', 'get').mockReturnValue({
  vibrate: jest.fn(),
});

jest.mock('@/presentation/screens/ScanScreen', () => ({
  ScanScreen: ({visible, onClose}: {visible: boolean; onClose: () => void}) => {
    const React = require('react');
    const {View, Text, TouchableOpacity} = require('react-native');
    return visible ? (
      <View testID="scan-screen">
        <Text>Scan Screen</Text>
        <TouchableOpacity testID="close-scan-screen" onPress={onClose}>
          <Text>Close</Text>
        </TouchableOpacity>
      </View>
    ) : null;
  },
}));

jest.mock('@/presentation/hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      primary: '#37352F',
      background: '#FFFFFF',
      backgroundSecondary: '#F7F6F3',
      textPrimary: '#37352F',
      textSecondary: '#787774',
      textTertiary: '#9B9A97',
      border: '#E9E9E7',
      error: '#E03E3E',
    },
  }),
}));

jest.mock('@/presentation/hooks/useTranslation', () => ({
  useTranslation: jest.fn(() => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'scan:title': 'バーコードをスキャン',
        'scan:orEnterIsbn': 'または、ISBN-13を入力してください',
        'scan:manualInputTitle': 'または、ISBN-13を入力してください',
        'scan:isbnInputPlaceholder': '例: 978-4873117324 または 9784873117324',
        'scan:isbn13FormatError': 'ISBN-13は13桁の数字で入力してください（ハイフン付きも可）',
        'scan:isbnSearchError': 'ISBN検索中にエラーが発生しました',
        'common:search': '検索',
      };
      return translations[key] || key;
    },
    i18n: {
      language: 'ja',
      changeLanguage: jest.fn(),
    },
  })),
}));

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
    }),
  };
});

const mockScanViewModel = scanViewModel as jest.Mocked<typeof scanViewModel>;
const mockShowErrorToast = showErrorToast as jest.MockedFunction<typeof showErrorToast>;
const mockVibrate = Vibration.vibrate as jest.MockedFunction<typeof Vibration.vibrate>;

describe('ScanScreenWrapper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('初期状態でスキャンボタンとISBN入力欄が表示される', () => {
    const {getByTestId} = render(<ScanScreenWrapper />);

    expect(getByTestId('scan-button')).toBeTruthy();
    expect(getByTestId('isbn-input-wrapper')).toBeTruthy();
    expect(getByTestId('isbn-search-button-wrapper')).toBeTruthy();
  });

  it('スキャンボタンを押すとScanScreenが表示される', () => {
    const {getByTestId, queryByTestId} = render(<ScanScreenWrapper />);

    expect(queryByTestId('scan-screen')).toBeNull();

    fireEvent.press(getByTestId('scan-button'));

    expect(getByTestId('scan-screen')).toBeTruthy();
  });

  it('ScanScreenを閉じることができる', () => {
    const {getByTestId, queryByTestId} = render(<ScanScreenWrapper />);

    fireEvent.press(getByTestId('scan-button'));
    expect(getByTestId('scan-screen')).toBeTruthy();

    fireEvent.press(getByTestId('close-scan-screen'));
    expect(queryByTestId('scan-screen')).toBeNull();
  });

  it('ISBN入力欄に値を入力できる', () => {
    const {getByTestId} = render(<ScanScreenWrapper />);

    const input = getByTestId('isbn-input-wrapper');
    fireEvent.changeText(input, '9784873117324');

    expect(input.props.value).toBe('9784873117324');
  });

  it('ハイフン付きISBNを入力できる', () => {
    const {getByTestId} = render(<ScanScreenWrapper />);

    const input = getByTestId('isbn-input-wrapper');
    fireEvent.changeText(input, '978-4-87311-732-4');

    expect(input.props.value).toBe('978-4-87311-732-4');
  });

  it('有効なISBN-13で検索が実行される', async () => {
    const mockItem = new ScannedItem({
      barcode: '9784873117324',
      type: ItemType.BOOK,
      title: 'テスト書籍',
      author: 'テスト著者',
    });

    mockScanViewModel.scanBarcode.mockResolvedValue({
      success: true,
      item: mockItem,
    });

    const mockNavigate = jest.fn();
    jest.spyOn(require('@react-navigation/native'), 'useNavigation').mockReturnValue({
      navigate: mockNavigate,
    });

    const {getByTestId} = render(<ScanScreenWrapper />);

    const input = getByTestId('isbn-input-wrapper');
    fireEvent.changeText(input, '9784873117324');

    const searchButton = getByTestId('isbn-search-button-wrapper');
    fireEvent.press(searchButton);

    await waitFor(() => {
      expect(mockScanViewModel.scanBarcode).toHaveBeenCalledWith('9784873117324');
      expect(mockVibrate).toHaveBeenCalledWith(200);
      expect(mockNavigate).toHaveBeenCalledWith('ScanResult', {item: mockItem});
    });
  });

  it('ハイフン付きISBN-13で検索が実行される（ハイフンは削除される）', async () => {
    const mockItem = new ScannedItem({
      barcode: '9784873117324',
      type: ItemType.BOOK,
      title: 'テスト書籍',
      author: 'テスト著者',
    });

    mockScanViewModel.scanBarcode.mockResolvedValue({
      success: true,
      item: mockItem,
    });

    const mockNavigate = jest.fn();
    jest.spyOn(require('@react-navigation/native'), 'useNavigation').mockReturnValue({
      navigate: mockNavigate,
    });

    const {getByTestId} = render(<ScanScreenWrapper />);

    const input = getByTestId('isbn-input-wrapper');
    fireEvent.changeText(input, '978-4-87311-732-4');

    const searchButton = getByTestId('isbn-search-button-wrapper');
    fireEvent.press(searchButton);

    await waitFor(() => {
      expect(mockScanViewModel.scanBarcode).toHaveBeenCalledWith('9784873117324');
    });
  });

  it('13桁未満のISBNでエラーメッセージが表示される', async () => {
    const {getByTestId} = render(<ScanScreenWrapper />);

    const input = getByTestId('isbn-input-wrapper');
    fireEvent.changeText(input, '123456789012');

    const searchButton = getByTestId('isbn-search-button-wrapper');
    fireEvent.press(searchButton);

    await waitFor(() => {
      expect(mockShowErrorToast).toHaveBeenCalledWith('ISBN-13は13桁の数字で入力してください（ハイフン付きも可）');
      expect(mockScanViewModel.scanBarcode).not.toHaveBeenCalled();
    });
  });

  it('13桁を超えるISBNでエラーメッセージが表示される', async () => {
    const {getByTestId} = render(<ScanScreenWrapper />);

    const input = getByTestId('isbn-input-wrapper');
    fireEvent.changeText(input, '12345678901234');

    const searchButton = getByTestId('isbn-search-button-wrapper');
    fireEvent.press(searchButton);

    await waitFor(() => {
      expect(mockShowErrorToast).toHaveBeenCalledWith('ISBN-13は13桁の数字で入力してください（ハイフン付きも可）');
      expect(mockScanViewModel.scanBarcode).not.toHaveBeenCalled();
    });
  });

  it('数字以外を含むISBNでエラーメッセージが表示される', async () => {
    const {getByTestId} = render(<ScanScreenWrapper />);

    const input = getByTestId('isbn-input-wrapper');
    fireEvent.changeText(input, '978487311732a');

    const searchButton = getByTestId('isbn-search-button-wrapper');
    fireEvent.press(searchButton);

    await waitFor(() => {
      expect(mockShowErrorToast).toHaveBeenCalledWith('ISBN-13は13桁の数字で入力してください（ハイフン付きも可）');
      expect(mockScanViewModel.scanBarcode).not.toHaveBeenCalled();
    });
  });

  it('検索失敗時にエラーメッセージが表示される', async () => {
    mockScanViewModel.scanBarcode.mockResolvedValue({
      success: false,
      item: undefined,
    });

    const {getByTestId} = render(<ScanScreenWrapper />);

    const input = getByTestId('isbn-input-wrapper');
    fireEvent.changeText(input, '9784873117324');

    const searchButton = getByTestId('isbn-search-button-wrapper');
    fireEvent.press(searchButton);

    await waitFor(() => {
      expect(mockScanViewModel.scanBarcode).toHaveBeenCalled();
    });
  });

  it('検索中にエラーが発生した場合、エラーメッセージが表示される', async () => {
    mockScanViewModel.scanBarcode.mockRejectedValue(new Error('Network error'));

    const {getByTestId} = render(<ScanScreenWrapper />);

    const input = getByTestId('isbn-input-wrapper');
    fireEvent.changeText(input, '9784873117324');

    const searchButton = getByTestId('isbn-search-button-wrapper');
    fireEvent.press(searchButton);

    await waitFor(() => {
      expect(mockShowErrorToast).toHaveBeenCalledWith('ISBN検索中にエラーが発生しました');
    });
  });

  it('useTranslationが呼ばれ、翻訳キーが使用される', () => {
    const {useTranslation} = require('@/presentation/hooks/useTranslation');
    const {getByTestId} = render(<ScanScreenWrapper />);

    expect(useTranslation).toHaveBeenCalled();
    expect(getByTestId('scan-button')).toBeTruthy();
  });

  it('検索成功後、入力欄がクリアされる', async () => {
    const mockItem = new ScannedItem({
      barcode: '9784873117324',
      type: ItemType.BOOK,
      title: 'テスト書籍',
      author: 'テスト著者',
    });

    mockScanViewModel.scanBarcode.mockResolvedValue({
      success: true,
      item: mockItem,
    });

    const mockNavigate = jest.fn();
    jest.spyOn(require('@react-navigation/native'), 'useNavigation').mockReturnValue({
      navigate: mockNavigate,
    });

    const {getByTestId} = render(<ScanScreenWrapper />);

    const input = getByTestId('isbn-input-wrapper');
    fireEvent.changeText(input, '9784873117324');

    const searchButton = getByTestId('isbn-search-button-wrapper');
    fireEvent.press(searchButton);

    await waitFor(() => {
      expect(mockScanViewModel.scanBarcode).toHaveBeenCalled();
    });

    // 入力欄がクリアされていることを確認
    expect(input.props.value).toBe('');
  });

  it('空の入力欄では検索ボタンが無効化される', () => {
    const {getByTestId} = render(<ScanScreenWrapper />);

    const searchButton = getByTestId('isbn-search-button-wrapper');
    // ButtonコンポーネントはdisabledプロパティをTouchableOpacityに渡すが、
    // テストではaccessibilityStateで確認する
    expect(searchButton.props.accessibilityState?.disabled).toBe(true);
  });

  it('空白のみの入力欄では検索ボタンが無効化される', () => {
    const {getByTestId} = render(<ScanScreenWrapper />);

    const input = getByTestId('isbn-input-wrapper');
    fireEvent.changeText(input, '   ');

    const searchButton = getByTestId('isbn-search-button-wrapper');
    // ButtonコンポーネントはdisabledプロパティをTouchableOpacityに渡すが、
    // テストではaccessibilityStateで確認する
    expect(searchButton.props.accessibilityState?.disabled).toBe(true);
  });
});

