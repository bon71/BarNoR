/**
 * 設定ストア（SimplifiedConfig用）
 * MVP最小化のため、パッケージ管理を廃止し、固定設定のみ管理
 */

import {create} from 'zustand';
import {SimplifiedConfig, DEFAULT_CONFIG} from '@/domain/entities/SimplifiedConfig';

interface ConfigState {
  config: SimplifiedConfig;
  isConfigured: boolean;
  setConfig: (config: SimplifiedConfig) => void;
  updateToken: (token: string) => void;
  updateDatabaseId: (databaseId: string) => void;
  updatePropertyMapping: (mapping: Partial<SimplifiedConfig['propertyMapping']>) => void;
  resetConfig: () => void;
  checkIfConfigured: () => boolean;
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  config: DEFAULT_CONFIG,
  isConfigured: false,

  setConfig: (config: SimplifiedConfig) =>
    set({
      config,
      isConfigured: !!(
        config.notionToken &&
        config.databaseId &&
        config.propertyMapping.isbn &&
        config.propertyMapping.title &&
        config.propertyMapping.author &&
        config.propertyMapping.imageUrl
      ),
    }),

  updateToken: (token: string) =>
    set((state) => {
      const newConfig = {...state.config, notionToken: token};
      return {
        config: newConfig,
        isConfigured: get().checkIfConfigured(),
      };
    }),

  updateDatabaseId: (databaseId: string) =>
    set((state) => {
      const newConfig = {...state.config, databaseId};
      return {
        config: newConfig,
        isConfigured: get().checkIfConfigured(),
      };
    }),

  updatePropertyMapping: (mapping: Partial<SimplifiedConfig['propertyMapping']>) =>
    set((state) => {
      const newConfig = {
        ...state.config,
        propertyMapping: {...state.config.propertyMapping, ...mapping},
      };
      return {
        config: newConfig,
        isConfigured: get().checkIfConfigured(),
      };
    }),

  resetConfig: () =>
    set({
      config: DEFAULT_CONFIG,
      isConfigured: false,
    }),

  checkIfConfigured: () => {
    const {config} = get();
    return !!(
      config.notionToken &&
      config.databaseId &&
      config.propertyMapping.isbn &&
      config.propertyMapping.title &&
      config.propertyMapping.author &&
      config.propertyMapping.imageUrl
    );
  },
}));

