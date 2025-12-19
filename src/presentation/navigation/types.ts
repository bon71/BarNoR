/**
 * ナビゲーション型定義
 */

import {ScannedItem} from '@/domain/entities/ScannedItem';

export type RootStackParamList = {
  Main: undefined;
  ScanResult: {item?: ScannedItem};
};

export type BottomTabParamList = {
  Scan: undefined;
  Settings: undefined;
};
