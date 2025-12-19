/**
 * デザインシステム - カラーパレット、スペーシング、タイポグラフィ
 * Notionライクなモノトーン配色
 */

// ライトモードカラーパレット（Notionライク）
export const lightColors = {
  // プライマリボタン - Notionの黒に近いグレー
  primary: '#37352F',
  primaryText: '#FFFFFF',

  // セカンダリ - グレー系
  secondary: '#E3E2E0',
  secondaryText: '#37352F',

  // ステータスカラー
  success: '#0F7B6C',
  error: '#E03E3E',
  warning: '#FFA344',
  info: '#0B6E99',

  // 背景
  white: '#FFFFFF',
  background: '#FFFFFF',
  backgroundSecondary: '#F7F6F3',
  backgroundTertiary: '#EDECE9',

  // テキスト
  text: '#37352F',
  textPrimary: '#37352F',
  textSecondary: '#787774',
  textTertiary: '#9B9A97',

  // ボーダー
  border: '#E3E2E0',
  borderLight: '#EDECE9',

  // ホバー・アクティブ
  hover: '#F1F0EE',
  active: '#E8E7E4',
} as const;

// ダークモードカラーパレット（Notionライク）
export const darkColors = {
  // プライマリボタン - ダークモードでは少し明るめの白
  primary: '#FFFFFF',
  primaryText: '#37352F',

  // セカンダリ
  secondary: '#3E3E3E',
  secondaryText: '#EBEBEB',

  // ステータスカラー
  success: '#0F7B6C',
  error: '#E03E3E',
  warning: '#FFA344',
  info: '#529CCA',

  // 背景
  white: '#FFFFFF',
  background: '#191919',
  backgroundSecondary: '#202020',
  backgroundTertiary: '#2A2A2A',

  // テキスト
  text: '#EBEBEB',
  textPrimary: '#EBEBEB',
  textSecondary: '#9B9A97',
  textTertiary: '#6C6C6C',

  // ボーダー
  border: '#3E3E3E',
  borderLight: '#2F2F2F',

  // ホバー・アクティブ
  hover: '#2A2A2A',
  active: '#3E3E3E',
} as const;

// デフォルトはライトモード
export const colors = lightColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
} as const;

export const typography = {
  fontFamily: {
    regular: 'SF Pro Text',
    display: 'SF Pro Display',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
} as const;

export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 6,
  },
} as const;

export const theme = {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} as const;

export type Theme = typeof theme;
