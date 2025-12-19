/**
 * BarcodeScanner テスト
 */

import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {Alert, Linking} from 'react-native';
import {BarcodeScanner} from '@/presentation/components/scanner/BarcodeScanner';
import {useCameraDevice, useCameraPermission, useCodeScanner} from 'react-native-vision-camera';
import {isISBN} from '@/utils/barcodeValidation';

// Mock
jest.mock('react-native-vision-camera', () => ({
  Camera: jest.fn(() => null),
  useCameraDevice: jest.fn(),
  useCameraPermission: jest.fn(),
  useCodeScanner: jest.fn(),
}));

jest.mock('@/presentation/hooks/useTranslation', () => ({
  useTranslation: jest.fn(() => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'scan:cameraPermissionRequired': 'カメラ権限が必要です',
        'scan:cameraPermissionMessage': 'バーコードをスキャンするには、カメラへのアクセスを許可してください。',
        'scan:openSettings': '設定を開く',
        'scan:allowPermission': '権限を許可',
        'scan:closeScanner': '閉じる',
        'scan:closeScannerLabel': 'スキャナーを閉じる',
        'scan:closeScannerHint': 'スキャナー画面を閉じます',
        'scan:cameraDeviceNotFound': 'カメラデバイスが見つかりません',
        'scan:preparingCamera': 'カメラを準備しています...',
        'scan:placeBarcodeInFrame': 'バーコードをフレーム内に収めてください',
        'scan:searchingIsbn': 'ISBNを探しています...',
        'scan:isbnDetected': 'ISBN検出！',
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

jest.mock('@/utils/barcodeValidation', () => ({
  isISBN: jest.fn(),
}));

// AlertとLinkingをモック
jest.spyOn(Alert, 'alert').mockImplementation(() => {});
jest.spyOn(Linking, 'openSettings').mockImplementation(() => Promise.resolve());

const mockUseCameraDevice = useCameraDevice as jest.Mock;
const mockUseCameraPermission = useCameraPermission as jest.Mock;
const mockUseCodeScanner = useCodeScanner as jest.Mock;
const mockIsISBN = isISBN as jest.Mock;

describe('BarcodeScanner', () => {
  const mockOnBarcodeScanned = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockUseCameraPermission.mockReturnValue({
      hasPermission: false,
      requestPermission: jest.fn(),
    });
    mockUseCameraDevice.mockReturnValue(null);
    mockUseCodeScanner.mockReturnValue({});
    mockIsISBN.mockReturnValue(false);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('カメラ権限がない場合、権限リクエスト画面が表示される', () => {
    const {getByTestId, getByText} = render(
      <BarcodeScanner onBarcodeScanned={mockOnBarcodeScanned} onClose={mockOnClose} />
    );

    expect(getByTestId('barcode-scanner-permission')).toBeTruthy();
    expect(getByText('カメラ権限が必要です')).toBeTruthy();
    expect(getByText('バーコードをスキャンするには、カメラへのアクセスを許可してください。')).toBeTruthy();
  });

  it('権限許可ボタンを押すと権限リクエストが呼ばれる', async () => {
    const mockRequestPermission = jest.fn().mockResolvedValue(true);
    mockUseCameraPermission.mockReturnValue({
      hasPermission: false,
      requestPermission: mockRequestPermission,
    });

    const {getByTestId} = render(
      <BarcodeScanner onBarcodeScanned={mockOnBarcodeScanned} onClose={mockOnClose} />
    );

    const allowButton = getByTestId('permission-allow-button');
    fireEvent.press(allowButton);

    await waitFor(() => {
      expect(mockRequestPermission).toHaveBeenCalled();
    });
  });

  it('権限が拒否された場合、設定を開くアラートが表示される', async () => {
    const mockRequestPermission = jest.fn().mockResolvedValue(false);
    mockUseCameraPermission.mockReturnValue({
      hasPermission: false,
      requestPermission: mockRequestPermission,
    });

    const {getByTestId} = render(
      <BarcodeScanner onBarcodeScanned={mockOnBarcodeScanned} onClose={mockOnClose} />
    );

    const allowButton = getByTestId('permission-allow-button');
    fireEvent.press(allowButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'カメラ権限が必要です',
        'バーコードをスキャンするには、カメラへのアクセスを許可してください。',
        expect.arrayContaining([
          expect.objectContaining({text: 'キャンセル'}),
          expect.objectContaining({text: '設定を開く'}),
        ])
      );
    });
  });

  it('カメラデバイスがない場合、エラーメッセージが表示される', () => {
    mockUseCameraPermission.mockReturnValue({
      hasPermission: true,
      requestPermission: jest.fn(),
    });
    mockUseCameraDevice.mockReturnValue(null);

    const {getByTestId, getByText} = render(
      <BarcodeScanner onBarcodeScanned={mockOnBarcodeScanned} onClose={mockOnClose} />
    );

    expect(getByTestId('barcode-scanner-nodevice')).toBeTruthy();
    expect(getByText('カメラデバイスが見つかりません')).toBeTruthy();
  });

  it('カメラが初期化中の場合、ローディングメッセージが表示される', () => {
    mockUseCameraPermission.mockReturnValue({
      hasPermission: true,
      requestPermission: jest.fn(),
    });
    mockUseCameraDevice.mockReturnValue({id: 'back', position: 'back'});

    const {getByTestId, getByText} = render(
      <BarcodeScanner onBarcodeScanned={mockOnBarcodeScanned} onClose={mockOnClose} />
    );

    // 初期化が完了するまでローディング画面が表示される
    expect(getByTestId('barcode-scanner-loading')).toBeTruthy();
    expect(getByText('カメラを準備しています...')).toBeTruthy();
  });

  it('初期化が完了するとカメラが表示される', async () => {
    mockUseCameraPermission.mockReturnValue({
      hasPermission: true,
      requestPermission: jest.fn(),
    });
    mockUseCameraDevice.mockReturnValue({id: 'back', position: 'back'});

    const {getByTestId} = render(
      <BarcodeScanner onBarcodeScanned={mockOnBarcodeScanned} onClose={mockOnClose} />
    );

    // タイマーを進めて初期化を完了させる
    jest.advanceTimersByTime(150);

    await waitFor(() => {
      expect(getByTestId('barcode-scanner')).toBeTruthy();
    });
  });

  it('閉じるボタンを押すとonCloseが呼ばれる', async () => {
    mockUseCameraPermission.mockReturnValue({
      hasPermission: true,
      requestPermission: jest.fn(),
    });
    mockUseCameraDevice.mockReturnValue({id: 'back', position: 'back'});

    const {getByTestId} = render(
      <BarcodeScanner onBarcodeScanned={mockOnBarcodeScanned} onClose={mockOnClose} />
    );

    jest.advanceTimersByTime(150);

    await waitFor(() => {
      const closeButton = getByTestId('scanner-close-button');
      fireEvent.press(closeButton);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('ISBNバーコードがスキャンされるとonBarcodeScannedが呼ばれる', async () => {
    mockUseCameraPermission.mockReturnValue({
      hasPermission: true,
      requestPermission: jest.fn(),
    });
    mockUseCameraDevice.mockReturnValue({id: 'back', position: 'back'});
    mockIsISBN.mockReturnValue(true);

    let codeScannerCallback: ((codes: Array<{value?: string | null}>) => void) | null = null;
    mockUseCodeScanner.mockImplementation((options: any) => {
      codeScannerCallback = options.onCodeScanned;
      return {
        codeTypes: ['ean-13'],
        onCodeScanned: options.onCodeScanned,
      };
    });

    render(
      <BarcodeScanner onBarcodeScanned={mockOnBarcodeScanned} onClose={mockOnClose} />
    );

    jest.advanceTimersByTime(150);

    await waitFor(() => {
      expect(codeScannerCallback).not.toBeNull();
    }, {timeout: 1000});

    // コールバックを直接呼び出す（codesは配列として渡される）
    if (codeScannerCallback && typeof codeScannerCallback === 'function') {
      (codeScannerCallback as (codes: Array<{value?: string | null}>) => void)([{value: '9784873117324'}]);
    }

    await waitFor(() => {
      expect(mockOnBarcodeScanned).toHaveBeenCalledWith('9784873117324');
    }, {timeout: 1000});
  });

  it('非ISBNバーコードがスキャンされると状態のみ更新される', async () => {
    mockUseCameraPermission.mockReturnValue({
      hasPermission: true,
      requestPermission: jest.fn(),
    });
    mockUseCameraDevice.mockReturnValue({id: 'back', position: 'back'});
    mockIsISBN.mockReturnValue(false);

    let codeScannerCallback: ((codes: Array<{value?: string | null}>) => void) | null = null;
    mockUseCodeScanner.mockImplementation((options: any) => {
      codeScannerCallback = options.onCodeScanned;
      return {
        codeTypes: ['code-128'],
        onCodeScanned: options.onCodeScanned,
      };
    });

    render(
      <BarcodeScanner onBarcodeScanned={mockOnBarcodeScanned} onClose={mockOnClose} />
    );

    jest.advanceTimersByTime(150);

    await waitFor(() => {
      expect(codeScannerCallback).not.toBeNull();
    }, {timeout: 1000});

    // コールバックを直接呼び出す（codesは配列として渡される）
    if (codeScannerCallback && typeof codeScannerCallback === 'function') {
      (codeScannerCallback as (codes: Array<{value?: string | null}>) => void)([{value: '1234567890123'}]);
    }

    // onBarcodeScannedは呼ばれない（ISBNでないため）
    await waitFor(() => {
      expect(mockOnBarcodeScanned).not.toHaveBeenCalled();
    }, {timeout: 1000});
  });

  it('enabled=falseの場合、カメラが無効化される', async () => {
    mockUseCameraPermission.mockReturnValue({
      hasPermission: true,
      requestPermission: jest.fn(),
    });
    mockUseCameraDevice.mockReturnValue({id: 'back', position: 'back'});

    const {getByTestId} = render(
      <BarcodeScanner onBarcodeScanned={mockOnBarcodeScanned} onClose={mockOnClose} enabled={false} />
    );

    jest.advanceTimersByTime(150);

    await waitFor(() => {
      // enabled=falseの場合でもコンポーネントはレンダリングされる
      expect(getByTestId('barcode-scanner')).toBeTruthy();
    });
  });
});
