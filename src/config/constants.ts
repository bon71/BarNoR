/**
 * アプリケーション定数
 */

export const APP_CONFIG = {
  NAME: 'Notion Barcode Reader',
  VERSION: '0.0.1',
  BUILD: 1,
} as const;

export const API_CONFIG = {
  OPENBD_BASE_URL: 'https://api.openbd.jp/v1',
  RAKUTEN_BASE_URL: 'https://app.rakuten.co.jp/services/api',
  NOTION_API_VERSION: '2022-06-28',
  REQUEST_TIMEOUT: 10000, // 10秒
} as const;

export const STORAGE_KEYS = {
  NOTION_TOKEN: 'notion_integration_token',
  PACKAGES: 'packages',
  SCAN_HISTORY: 'scan_history',
  SUBSCRIPTION_STATUS: 'subscription_status',
} as const;

export const LIMITS = {
  FREE_PACKAGE_LIMIT: 2,
  PREMIUM_PACKAGE_LIMIT: 10,
  SCAN_HISTORY_MAX: 20,
} as const;

export const SUBSCRIPTION = {
  PRODUCT_ID: 'com.notionbarcodereader.premium',
  MONTHLY_PRICE: '$1.99',
} as const;
