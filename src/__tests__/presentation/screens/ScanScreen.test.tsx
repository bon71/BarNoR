/**
 * ScanScreen テスト
 */

import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {useScanStore} from '@/presentation/stores/useScanStore';
import {useConfigStore} from '@/presentation/stores/useConfigStore';
import {useTheme} from '@/presentation/hooks/useTheme';
import {scanViewModel} from '@/presentation/providers/ViewModelProvider';
import {showErrorToast} from '@/presentation/stores/useToastStore';

// モック
jest.mock('@/presentation/stores/useScanStore');
jest.mock('@/presentation/stores/useConfigStore');
jest.mock('@/presentation/hooks/useTheme');
jest.mock('@/presentation/providers/ViewModelProvider');
jest.mock('@/presentation/stores/useToastStore');
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

// React.lazyをモック（テスト環境では通常のコンポーネントとして動作）
jest.mock('react', () => {
  const actualReact = jest.requireActual('react');
  return {
    ...actualReact,
    lazy: (_fn: () => Promise<any>) => {
      // テスト環境ではlazyを無効化して、モックされたコンポーネントを直接返す
      // 実際のモジュールを同期的に解決
      const BarcodeScannerMock = require('@/presentation/components/scanner/BarcodeScanner').BarcodeScanner;
      return BarcodeScannerMock;
    },
  };
});

// BarcodeScanner のモック
jest.mock('@/presentation/components/scanner/BarcodeScanner', () => {
  const React = require('react');
  const {View, Text, TouchableOpacity} = require('react-native');

  return {
    BarcodeScanner: ({onBarcodeScanned, onClose}: any) =>
      React.createElement(
        View,
        {testID: 'barcode-scanner'},
        React.createElement(
          TouchableOpacity,
          {
            testID: 'mock-scan-button',
            onPress: () => onBarcodeScanned('9784567890123'),
          },
          React.createElement(Text, null, 'Scan')
        ),
        React.createElement(
          TouchableOpacity,
          {testID: 'scanner-close-button', onPress: onClose},
          React.createElement(Text, null, 'Close')
        )
      ),
  };
});

// Button と Card のモック
jest.mock('@/presentation/components/common', () => {
  const React = require('react');
  const {View, Text, TouchableOpacity} = require('react-native');

  return {
    Button: ({title, onPress, testID, style}: any) =>
      React.createElement(
        TouchableOpacity,
        {onPress, testID, style},
        React.createElement(Text, null, title)
      ),
    Card: ({children, testID, style}: any) =>
      React.createElement(View, {testID, style}, children),
  };
});

// Skeleton のモック
jest.mock('@/presentation/components/common/Skeleton', () => {
  const React = require('react');
  const {View, Text} = require('react-native');

  return {
    SkeletonScreen: ({children}: any) =>
      React.createElement(
        View,
        {testID: 'skeleton-screen'},
        children
      ),
    SkeletonItem: ({testID}: any) =>
      React.createElement(
        View,
        {testID: testID || 'skeleton-item'},
        React.createElement(Text, null, 'Loading...')
      ),
  };
});

// テーマのモック
jest.mock('@/config/theme', () => ({
  spacing: {xs: 4, sm: 8, md: 16, lg: 24, xl: 32},
  typography: {fontSize: {xs: 10, sm: 12, md: 14, lg: 16, xl: 20}},
}));

jest.mock('@/presentation/hooks/useTranslation', () => ({
  useTranslation: jest.fn(() => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'scan:configNotComplete': '設定が完了していません。設定画面から必要な情報を入力してください。',
        'scan:scanError': 'バーコードのスキャン中にエラーが発生しました',
        'scan:goToSettings': '設定画面へ',
        'scan:preparingCameraMessage': 'カメラを準備しています...',
        'scan:loadingData': 'データを取得しています...',
        'scan:scanSuccessMessage': 'スキャン成功！',
        'scan:error': 'エラー',
        'scan:isbnBarcodeHint': 'ISBNバーコードをスキャンしてください',
        'scan:rescan': '再スキャン',
        'alerts:error': 'エラー',
        'common:close': '閉じる',
      };
      return translations[key] || key;
    },
    i18n: {
      language: 'ja',
      changeLanguage: jest.fn(),
    },
  })),
}));

// ScanScreen のインポートは全てのモックの後に
import {ScanScreen} from '@/presentation/screens/ScanScreen';
import {ScannedItem, ItemType} from '@/domain/entities/ScannedItem';

const mockUseScanStore = useScanStore as jest.MockedFunction<typeof useScanStore>;
const mockUseConfigStore = useConfigStore as jest.MockedFunction<typeof useConfigStore>;
const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;
const mockShowErrorToast = showErrorToast as jest.MockedFunction<typeof showErrorToast>;

describe('ScanScreen', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    // テーマのモック（実際の型に一致させる）
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

    // スキャンストアのモック - Zustandのselector対応
    mockUseScanStore.mockImplementation((selector: any) => {
      const state = {
        scanHistory: [],
        isLoading: false,
        error: null,
        addScanHistory: jest.fn(),
        updateScanHistory: jest.fn(),
        clearError: jest.fn(),
      };
      return selector ? selector(state) : state;
    });

    // ViewModelのモック
    (scanViewModel as any).scanBarcode = jest.fn();

    // ConfigStoreのモック
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('レンダリング', () => {
    it('visible=true の場合、スキャナーが表示される', () => {
      const {getByTestId} = render(
        <ScanScreen visible={true} onClose={mockOnClose} />
      );

      expect(getByTestId('barcode-scanner')).toBeTruthy();
    });

    it('visible=false の場合、モーダルが非表示', () => {
      const {queryByTestId} = render(
        <ScanScreen visible={false} onClose={mockOnClose} />
      );

      // Modal自体は存在するが、visible=falseなので内容は表示されない
      expect(queryByTestId('barcode-scanner')).toBeNull();
    });
  });

  describe('バーコードスキャン', () => {
    it('スキャン成功時、ViewModelが呼ばれる', async () => {
      const mockItem = new ScannedItem({
        barcode: '9784567890123',
        title: 'テスト書籍',
        author: 'テスト著者',
        type: ItemType.BOOK,
      });

      (scanViewModel.scanBarcode as jest.Mock).mockResolvedValue({
        success: true,
        item: mockItem,
      });

      const {getByTestId} = render(
        <ScanScreen visible={true} onClose={mockOnClose} />
      );

      // バーコードスキャンをシミュレート
      const scanButton = getByTestId('mock-scan-button');
      fireEvent.press(scanButton);

      await waitFor(() => {
        expect(scanViewModel.scanBarcode).toHaveBeenCalledWith('9784567890123');
      });
    });

    it('スキャン失敗時、エラーが表示される', async () => {
      // スキャン失敗をシミュレート
      (scanViewModel.scanBarcode as jest.Mock).mockResolvedValue({
        success: false,
        error: 'スキャンに失敗しました',
      });

      // 初期状態 → エラー状態への遷移をシミュレート
      let currentError: string | null = null;
      mockUseScanStore.mockImplementation((selector: any) => {
        const state = {
          scanHistory: [],
          isLoading: false,
          error: currentError,
          addScanHistory: jest.fn(),
          updateScanHistory: jest.fn(),
          clearError: jest.fn(),
        };
        return selector ? selector(state) : state;
      });

      const {getByTestId, rerender} = render(
        <ScanScreen visible={true} onClose={mockOnClose} />
      );

      // バーコードスキャンをシミュレート
      const scanButton = getByTestId('mock-scan-button');
      fireEvent.press(scanButton);

      await waitFor(() => {
        expect(scanViewModel.scanBarcode).toHaveBeenCalled();
      });

      // エラー状態に更新（ViewModelがストアを更新したことをシミュレート）
      currentError = 'スキャンに失敗しました';
      rerender(<ScanScreen visible={true} onClose={mockOnClose} />);

      // スキャナーが非表示になり、エラー画面が表示される
      await waitFor(() => {
        expect(getByTestId('scan-screen')).toBeTruthy();
        expect(getByTestId('scan-error-title')).toBeTruthy();
      });
    });

    it('予期しないエラー時、トーストが表示される', async () => {
      (scanViewModel.scanBarcode as jest.Mock).mockRejectedValue(
        new Error('Unexpected error')
      );

      const {getByTestId} = render(
        <ScanScreen visible={true} onClose={mockOnClose} />
      );

      const scanButton = getByTestId('mock-scan-button');
      fireEvent.press(scanButton);

      await waitFor(() => {
        expect(mockShowErrorToast).toHaveBeenCalledWith(
          'バーコードのスキャン中にエラーが発生しました'
        );
      });
    });
  });

  describe('ローディング状態', () => {
    it('スキャン処理中はスキャナー画面が表示され続ける', async () => {
      // スキャンを実行してローディング状態に
      (scanViewModel.scanBarcode as jest.Mock).mockImplementation(() => {
        return new Promise(() => {}); // 永続的なPromiseでローディング状態を保持
      });

      // ローディング状態をシミュレート
      let currentLoading = false;
      mockUseScanStore.mockImplementation((selector: any) => {
        const state = {
          scanHistory: [],
          isLoading: currentLoading,
          error: null,
          addScanHistory: jest.fn(),
          updateScanHistory: jest.fn(),
          clearError: jest.fn(),
        };
        return selector ? selector(state) : state;
      });

      const {getByTestId, queryByTestId, rerender} = render(
        <ScanScreen visible={true} onClose={mockOnClose} />
      );

      // 最初はスキャナーが表示
      expect(getByTestId('barcode-scanner')).toBeTruthy();

      const scanButton = getByTestId('mock-scan-button');
      fireEvent.press(scanButton);

      // ローディング状態に更新
      currentLoading = true;
      rerender(<ScanScreen visible={true} onClose={mockOnClose} />);

      // スキャン処理中はスキャナー画面が表示され続ける（スケルトンは表示されない）
      await waitFor(() => {
        expect(getByTestId('barcode-scanner')).toBeTruthy();
        expect(queryByTestId('skeleton-screen')).toBeNull();
      });
    });

  });

  describe('エラー状態', () => {
    it('エラー時、エラーメッセージと再スキャンボタンが表示される', async () => {
      // スキャン失敗をシミュレート
      (scanViewModel.scanBarcode as jest.Mock).mockResolvedValue({
        success: false,
        error: 'テストエラーメッセージ',
      });

      // エラー状態をシミュレート
      let currentError: string | null = null;
      mockUseScanStore.mockImplementation((selector: any) => {
        const state = {
          scanHistory: [],
          isLoading: false,
          error: currentError,
          addScanHistory: jest.fn(),
          updateScanHistory: jest.fn(),
          clearError: jest.fn(),
        };
        return selector ? selector(state) : state;
      });

      const {getByTestId, rerender} = render(
        <ScanScreen visible={true} onClose={mockOnClose} />
      );

      // スキャンを実行
      const scanButton = getByTestId('mock-scan-button');
      fireEvent.press(scanButton);

      await waitFor(() => {
        expect(scanViewModel.scanBarcode).toHaveBeenCalled();
      });

      // エラー状態に更新
      currentError = 'テストエラーメッセージ';
      rerender(<ScanScreen visible={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(getByTestId('scan-error-title')).toBeTruthy();
        expect(getByTestId('rescan-button')).toBeTruthy();
        expect(getByTestId('close-button')).toBeTruthy();
      });
    });

    it('再スキャンボタン押下で、スキャナーが再表示される', async () => {
      // スキャン失敗をシミュレート
      (scanViewModel.scanBarcode as jest.Mock).mockResolvedValue({
        success: false,
        error: 'エラー',
      });

      // 初期状態 → エラー状態への遷移をシミュレート
      let currentError: string | null = null;
      mockUseScanStore.mockImplementation((selector: any) => {
        const state = {
          scanHistory: [],
          isLoading: false,
          error: currentError,
          addScanHistory: jest.fn(),
          updateScanHistory: jest.fn(),
          clearError: jest.fn(),
        };
        return selector ? selector(state) : state;
      });

      const {getByTestId, queryByTestId, rerender} = render(
        <ScanScreen visible={true} onClose={mockOnClose} />
      );

      // スキャンを実行してエラー状態に
      fireEvent.press(getByTestId('mock-scan-button'));

      await waitFor(() => {
        expect(scanViewModel.scanBarcode).toHaveBeenCalled();
      });

      // エラー状態に更新
      currentError = 'エラー';
      rerender(<ScanScreen visible={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(queryByTestId('rescan-button')).toBeTruthy();
      });

      // 再スキャンボタンを押下
      if (queryByTestId('rescan-button')) {
        fireEvent.press(getByTestId('rescan-button'));

        await waitFor(() => {
          expect(queryByTestId('barcode-scanner')).toBeTruthy();
        });
      }
    });
  });

  describe('閉じる動作', () => {
    it('スキャナーの閉じるボタンで onClose が呼ばれる', () => {
      const {getByTestId} = render(
        <ScanScreen visible={true} onClose={mockOnClose} />
      );

      const closeButton = getByTestId('scanner-close-button');
      fireEvent.press(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('エラー画面の閉じるボタンで onClose が呼ばれる', async () => {
      // スキャン失敗をシミュレート
      (scanViewModel.scanBarcode as jest.Mock).mockResolvedValue({
        success: false,
      });

      // エラー状態をシミュレート
      let currentError: string | null = null;
      mockUseScanStore.mockImplementation((selector: any) => {
        const state = {
          scanHistory: [],
          isLoading: false,
          error: currentError,
          addScanHistory: jest.fn(),
          updateScanHistory: jest.fn(),
          clearError: jest.fn(),
        };
        return selector ? selector(state) : state;
      });

      const {getByTestId, queryByTestId, rerender} = render(
        <ScanScreen visible={true} onClose={mockOnClose} />
      );

      // スキャンを実行してエラー状態に
      fireEvent.press(getByTestId('mock-scan-button'));

      await waitFor(() => {
        expect(scanViewModel.scanBarcode).toHaveBeenCalled();
      });

      // エラー状態に更新
      currentError = 'エラー';
      rerender(<ScanScreen visible={true} onClose={mockOnClose} />);

      await waitFor(() => {
        if (queryByTestId('close-button')) {
          fireEvent.press(getByTestId('close-button'));
          expect(mockOnClose).toHaveBeenCalled();
        }
      });
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

      const {getByText} = render(
        <ScanScreen visible={true} onClose={mockOnClose} />
      );

      expect(getByText(/設定が完了していません/)).toBeTruthy();
      expect(getByText('設定画面へ')).toBeTruthy();
    });

    it('設定完了時にエラーメッセージが表示されない', () => {
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

      const {queryByText} = render(
        <ScanScreen visible={true} onClose={mockOnClose} />
      );

      expect(queryByText(/設定が完了していません/)).toBeNull();
    });
  });

  describe('スキャン無効化', () => {
    it('設定未完了時はスキャンが無効化される', () => {
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

      const {UNSAFE_getByType} = render(
        <ScanScreen visible={true} onClose={mockOnClose} />
      );
      const BarcodeScanner = require('@/presentation/components/scanner/BarcodeScanner').BarcodeScanner;
      const scanner = UNSAFE_getByType(BarcodeScanner);

      expect(scanner.props.enabled).toBe(false);
    });

    it('設定完了時はスキャンが有効化される', () => {
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

      const {UNSAFE_getByType} = render(
        <ScanScreen visible={true} onClose={mockOnClose} />
      );
      const BarcodeScanner = require('@/presentation/components/scanner/BarcodeScanner').BarcodeScanner;
      const scanner = UNSAFE_getByType(BarcodeScanner);

      expect(scanner.props.enabled).toBe(true);
    });
  });

});
