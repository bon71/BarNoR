/**
 * ScanResultScreen テスト
 */

import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {ScanResultScreen} from '@/presentation/screens/ScanResultScreen';
import {ScannedItem, ItemType} from '@/domain/entities/ScannedItem';
import * as useToastStore from '@/presentation/stores/useToastStore';
import {useConfigStore} from '@/presentation/stores/useConfigStore';
import {scanViewModel} from '@/presentation/providers/ViewModelProvider';

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

// Create mock route params outside jest.mock
const mockRouteParams = {
  item: null as ScannedItem | null,
};

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
  useRoute: () => ({
    params: mockRouteParams,
  }),
}));

// Mock toast
jest.mock('@/presentation/stores/useToastStore', () => ({
  showSuccessToast: jest.fn(),
  showErrorToast: jest.fn(),
  showWarningToast: jest.fn(),
  showInfoToast: jest.fn(),
}));

// Mock useConfigStore
jest.mock('@/presentation/stores/useConfigStore');
const mockUseConfigStore = useConfigStore as jest.MockedFunction<typeof useConfigStore>;

// Mock ViewModel
jest.mock('@/presentation/providers/ViewModelProvider', () => ({
  scanViewModel: {
    saveToNotion: jest.fn(),
  },
}));

// Mock useTranslation
jest.mock('@/presentation/hooks/useTranslation', () => ({
  useTranslation: jest.fn(() => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'scanResult:title': 'スキャン結果',
        'scanResult:titleLabel': 'タイトル',
        'scanResult:authorLabel': '著者',
        'scanResult:publisherLabel': '出版社',
        'scanResult:priceLabel': '価格',
        'scanResult:saveToNotion': 'Notionに保存',
        'scanResult:saveSuccess': 'Notionに保存しました',
        'scanResult:saveError': '保存に失敗しました',
        'scanResult:titleRequired': 'タイトルは必須です',
        'scanResult:priceValidationError': '価格は0以上の数値を入力してください',
        'scanResult:configNotFound': '設定が見つかりません。設定画面から必要な情報を入力してください。',
        'scanResult:goToSettings': '設定画面へ',
        'common:cancel': 'キャンセル',
      };
      return translations[key] || key;
    },
    i18n: {
      language: 'ja',
      changeLanguage: jest.fn(),
    },
  })),
}));

describe('ScanResultScreen', () => {
  const testItem = new ScannedItem({
    barcode: '9784798171234',
    type: ItemType.BOOK,
    title: 'テストブック',
    author: 'テスト著者',
    publisher: 'テスト出版社',
    price: 2000,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Set mock route params
    mockRouteParams.item = testItem;

    // Mock useConfigStore
    mockUseConfigStore.mockReturnValue({
      config: {
        notionToken: 'secret_test123',
        databaseId: '12345678-1234-1234-1234-123456789012',
        propertyMapping: {
          title: 'タイトル',
          author: '著者名',
          isbn: 'ISBN',
          imageUrl: '書影',
        },
      },
      isConfigured: true,
      setConfig: jest.fn(),
      updateToken: jest.fn(),
      updateDatabaseId: jest.fn(),
      updatePropertyMapping: jest.fn(),
      resetConfig: jest.fn(),
      checkIfConfigured: jest.fn(() => true),
    });
  });

  describe('表示テスト', () => {
    it('スキャン結果が正しく表示される', () => {
      const {getByTestId, getByDisplayValue} = render(
        <ScanResultScreen />,
      );

      expect(getByTestId('scan-result-screen')).toBeTruthy();
      expect(getByDisplayValue('テストブック')).toBeTruthy();
      expect(getByDisplayValue('テスト著者')).toBeTruthy();
      expect(getByDisplayValue('テスト出版社')).toBeTruthy();
      expect(getByDisplayValue('2000')).toBeTruthy();
    });

    it('バーコードが読み取り専用で表示される', () => {
      const {getByDisplayValue} = render(<ScanResultScreen />);

      const barcodeInput = getByDisplayValue('9784798171234');
      expect(barcodeInput.props.editable).toBe(false);
    });

    it('保存ボタンが表示される', () => {
      const {getByText} = render(<ScanResultScreen />);

      expect(getByText('Notionに保存')).toBeTruthy();
    });

    it('キャンセルボタンが表示される', () => {
      const {getByText} = render(<ScanResultScreen />);

      expect(getByText('キャンセル')).toBeTruthy();
    });
  });

  describe('編集テスト', () => {
    it('タイトルを編集できる', () => {
      const {getByDisplayValue} = render(<ScanResultScreen />);

      const titleInput = getByDisplayValue('テストブック');
      fireEvent.changeText(titleInput, '編集後タイトル');

      expect(getByDisplayValue('編集後タイトル')).toBeTruthy();
    });

    it('著者を編集できる', () => {
      const {getByDisplayValue} = render(<ScanResultScreen />);

      const authorInput = getByDisplayValue('テスト著者');
      fireEvent.changeText(authorInput, '編集後著者');

      expect(getByDisplayValue('編集後著者')).toBeTruthy();
    });

    it('出版社を編集できる', () => {
      const {getByDisplayValue} = render(<ScanResultScreen />);

      const publisherInput = getByDisplayValue('テスト出版社');
      fireEvent.changeText(publisherInput, '編集後出版社');

      expect(getByDisplayValue('編集後出版社')).toBeTruthy();
    });

    it('価格を編集できる', () => {
      const {getByDisplayValue} = render(<ScanResultScreen />);

      const priceInput = getByDisplayValue('2000');
      fireEvent.changeText(priceInput, '3000');

      expect(getByDisplayValue('3000')).toBeTruthy();
    });
  });

  describe('保存テスト', () => {
    it('保存ボタンを押すとNotionに保存される', async () => {
      (scanViewModel.saveToNotion as jest.Mock).mockResolvedValue({
        success: true,
      });

      const {getByText} = render(<ScanResultScreen />);

      const saveButton = getByText('Notionに保存');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(scanViewModel.saveToNotion).toHaveBeenCalledWith(
          expect.objectContaining({
            barcode: '9784798171234',
            title: 'テストブック',
          }),
        );
      });
    });

    it('保存成功時にトーストが表示される', async () => {
      (scanViewModel.saveToNotion as jest.Mock).mockResolvedValue({
        success: true,
      });

      const {getByText} = render(<ScanResultScreen />);

      const saveButton = getByText('Notionに保存');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(useToastStore.showSuccessToast).toHaveBeenCalledWith(
          'Notionに保存しました',
        );
      });
    });

    it('保存成功時に画面を閉じる', async () => {
      (scanViewModel.saveToNotion as jest.Mock).mockResolvedValue({
        success: true,
      });

      const {getByText} = render(<ScanResultScreen />);

      const saveButton = getByText('Notionに保存');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(mockGoBack).toHaveBeenCalled();
      });
    });

    it('保存失敗時にエラートーストが表示される', async () => {
      (scanViewModel.saveToNotion as jest.Mock).mockResolvedValue({
        success: false,
        error: '保存に失敗しました',
      });

      const {getByText} = render(<ScanResultScreen />);

      const saveButton = getByText('Notionに保存');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(useToastStore.showErrorToast).toHaveBeenCalledWith(
          '保存に失敗しました',
        );
      });
    });

    it('編集後のデータで保存される', async () => {
      (scanViewModel.saveToNotion as jest.Mock).mockResolvedValue({
        success: true,
      });

      const {getByDisplayValue, getByText} = render(<ScanResultScreen />);

      // タイトルを編集
      const titleInput = getByDisplayValue('テストブック');
      fireEvent.changeText(titleInput, '編集後タイトル');

      // 保存
      const saveButton = getByText('Notionに保存');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(scanViewModel.saveToNotion).toHaveBeenCalledWith(
          expect.objectContaining({
            title: '編集後タイトル',
          }),
        );
      });
    });
  });

  describe('バリデーションテスト', () => {
    it('タイトルが空の場合は保存できない', async () => {
      const {getByDisplayValue, getByText} = render(<ScanResultScreen />);

      // タイトルを空にする
      const titleInput = getByDisplayValue('テストブック');
      fireEvent.changeText(titleInput, '');

      // 保存を試行
      const saveButton = getByText('Notionに保存');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(useToastStore.showErrorToast).toHaveBeenCalledWith(
          'タイトルは必須です',
        );
        expect(scanViewModel.saveToNotion).not.toHaveBeenCalled();
      });
    });

    it('価格が負の数の場合は保存できない', async () => {
      const {getByDisplayValue, getByText} = render(<ScanResultScreen />);

      // 価格を負の数にする
      const priceInput = getByDisplayValue('2000');
      fireEvent.changeText(priceInput, '-100');

      // 保存を試行
      const saveButton = getByText('Notionに保存');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(useToastStore.showErrorToast).toHaveBeenCalled();
        expect(scanViewModel.saveToNotion).not.toHaveBeenCalled();
      });
      // エラーメッセージはvalidateNumberの実装に依存するため、具体的なメッセージではなく呼び出しを確認
      expect(useToastStore.showErrorToast).toHaveBeenCalledWith(
        expect.stringMatching(/負の値|0以上/),
      );
    });

    it('価格が数値でない場合は保存できない', async () => {
      const {getByDisplayValue, getByText} = render(<ScanResultScreen />);

      // 価格を文字列にする
      const priceInput = getByDisplayValue('2000');
      fireEvent.changeText(priceInput, 'abc');

      // 保存を試行
      const saveButton = getByText('Notionに保存');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(useToastStore.showErrorToast).toHaveBeenCalled();
        expect(scanViewModel.saveToNotion).not.toHaveBeenCalled();
      });
      // エラーメッセージはvalidateNumberの実装に依存するため、具体的なメッセージではなく呼び出しを確認
      expect(useToastStore.showErrorToast).toHaveBeenCalledWith(
        expect.stringMatching(/有効な数値|数値/),
      );
    });
  });

  describe('キャンセルテスト', () => {
    it('キャンセルボタンを押すと画面を閉じる', () => {
      const {getByText} = render(<ScanResultScreen />);

      const cancelButton = getByText('キャンセル');
      fireEvent.press(cancelButton);

      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  describe('設定チェック', () => {
    it('設定未完了時にエラーメッセージが表示される', () => {
      mockUseConfigStore.mockReturnValue({
        config: null,
        isConfigured: false,
        setConfig: jest.fn(),
        updateToken: jest.fn(),
        updateDatabaseId: jest.fn(),
        updatePropertyMapping: jest.fn(),
        resetConfig: jest.fn(),
        checkIfConfigured: jest.fn(() => false),
      });

      const {getByText} = render(<ScanResultScreen />);

      expect(getByText(/設定が見つかりません/)).toBeTruthy();
      expect(getByText('設定画面へ')).toBeTruthy();
    });

    it('設定完了時に結果が表示される', () => {
      mockUseConfigStore.mockReturnValue({
        config: {
          notionToken: 'secret_test123',
          databaseId: '12345678-1234-1234-1234-123456789012',
          propertyMapping: {
            title: 'タイトル',
            author: '著者名',
            isbn: 'ISBN',
            imageUrl: '書影',
          },
        },
        isConfigured: true,
        setConfig: jest.fn(),
        updateToken: jest.fn(),
        updateDatabaseId: jest.fn(),
        updatePropertyMapping: jest.fn(),
        resetConfig: jest.fn(),
        checkIfConfigured: jest.fn(() => true),
      });

      const {getByTestId, getByText} = render(<ScanResultScreen />);

      expect(getByTestId('scan-result-screen')).toBeTruthy();
      expect(getByText('Notionに保存')).toBeTruthy();
    });
  });
});
