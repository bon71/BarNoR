/**
 * 認証状態管理ストア
 * Notion Integration Tokenの管理
 */

import {create} from 'zustand';

interface AuthState {
  // State
  notionToken: string | null;
  isAuthenticated: boolean;

  // Actions
  setNotionToken: (token: string) => void;
  clearNotionToken: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // Initial State
  notionToken: null,
  isAuthenticated: false,

  // Actions
  setNotionToken: (token: string) =>
    set({
      notionToken: token,
      isAuthenticated: true,
    }),

  clearNotionToken: () =>
    set({
      notionToken: null,
      isAuthenticated: false,
    }),
}));
