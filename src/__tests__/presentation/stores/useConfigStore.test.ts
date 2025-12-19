/**
 * useConfigStore テスト
 */

import {renderHook, act} from '@testing-library/react-native';
import {useConfigStore} from '@/presentation/stores/useConfigStore';
import {SimplifiedConfig} from '@/domain/entities/SimplifiedConfig';

describe('useConfigStore', () => {
  beforeEach(() => {
    // ストアをリセット
    const {result} = renderHook(() => useConfigStore());
    act(() => {
      result.current.resetConfig();
    });
  });

  it('初期状態ではconfigがDEFAULT_CONFIG', () => {
    const {result} = renderHook(() => useConfigStore());

    expect(result.current.config).toEqual({
      notionToken: '',
      databaseId: '',
      propertyMapping: {
        isbn: 'ISBN',
        title: 'タイトル',
        author: '著者名',
        imageUrl: '書影',
      },
    });
    expect(result.current.isConfigured).toBe(false);
  });

  it('setConfigで設定を保存できる', () => {
    const {result} = renderHook(() => useConfigStore());

    const config: SimplifiedConfig = {
      notionToken: 'secret_test123',
      databaseId: '12345678-1234-1234-1234-123456789012',
      propertyMapping: {
        title: 'タイトル',
        author: '著者名',
        isbn: 'ISBN',
        imageUrl: '書影',
      },
    };

    act(() => {
      result.current.setConfig(config);
    });

    expect(result.current.config).toEqual(config);
    expect(result.current.isConfigured).toBe(true);
  });

  it('resetConfigで設定をクリアできる', () => {
    const {result} = renderHook(() => useConfigStore());

    const config: SimplifiedConfig = {
      notionToken: 'secret_test123',
      databaseId: '12345678-1234-1234-1234-123456789012',
      propertyMapping: {
        title: 'タイトル',
        author: '著者名',
        isbn: 'ISBN',
        imageUrl: '書影',
      },
    };

    act(() => {
      result.current.setConfig(config);
    });

    expect(result.current.config).toEqual(config);
    expect(result.current.isConfigured).toBe(true);

    act(() => {
      result.current.resetConfig();
    });

    expect(result.current.config).toEqual({
      notionToken: '',
      databaseId: '',
      propertyMapping: {
        isbn: 'ISBN',
        title: 'タイトル',
        author: '著者名',
        imageUrl: '書影',
      },
    });
    expect(result.current.isConfigured).toBe(false);
  });

  it('updateTokenでトークンを更新できる', () => {
    const {result} = renderHook(() => useConfigStore());

    act(() => {
      result.current.updateToken('new_token');
    });

    expect(result.current.config.notionToken).toBe('new_token');
  });

  it('updateDatabaseIdでデータベースIDを更新できる', () => {
    const {result} = renderHook(() => useConfigStore());

    act(() => {
      result.current.updateDatabaseId('12345678-1234-1234-1234-123456789012');
    });

    expect(result.current.config.databaseId).toBe('12345678-1234-1234-1234-123456789012');
  });

  it('updatePropertyMappingでプロパティマッピングを更新できる', () => {
    const {result} = renderHook(() => useConfigStore());

    act(() => {
      result.current.updatePropertyMapping({title: '新しいタイトル'});
    });

    expect(result.current.config.propertyMapping.title).toBe('新しいタイトル');
  });

  it('checkIfConfiguredで設定完了状態を確認できる', () => {
    const {result} = renderHook(() => useConfigStore());

    expect(result.current.checkIfConfigured()).toBe(false);

    act(() => {
      result.current.setConfig({
        notionToken: 'secret_test123',
        databaseId: '12345678-1234-1234-1234-123456789012',
        propertyMapping: {
          title: 'タイトル',
          author: '著者名',
          isbn: 'ISBN',
          imageUrl: '書影',
        },
      });
    });

    expect(result.current.checkIfConfigured()).toBe(true);
  });
});

