/**
 * iOS風Liquid Glassエフェクトを実現するBlurViewコンポーネント
 * @react-native-community/blurを使用
 */

import React from 'react';
import {StyleSheet, ViewStyle, StyleProp, Platform} from 'react-native';
import {BlurView as RNBlurView} from '@react-native-community/blur';

export type BlurType =
  | 'light'
  | 'dark'
  | 'xlight'
  | 'regular'
  | 'prominent'
  | 'chromeMaterial'
  | 'material'
  | 'thickMaterial'
  | 'thinMaterial'
  | 'ultraThinMaterial'
  | 'chromeMaterialDark'
  | 'materialDark'
  | 'thickMaterialDark'
  | 'thinMaterialDark'
  | 'ultraThinMaterialDark'
  | 'chromeMaterialLight'
  | 'materialLight'
  | 'thickMaterialLight'
  | 'thinMaterialLight'
  | 'ultraThinMaterialLight';

interface BlurViewProps {
  children?: React.ReactNode;
  blurType?: BlurType;
  blurAmount?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const BlurView: React.FC<BlurViewProps> = ({
  children,
  blurType = 'light',
  blurAmount = 80,
  style,
  testID,
}) => {
  // Androidではblur効果が制限的なため、フォールバック
  if (Platform.OS === 'android') {
    return (
      <RNBlurView
        style={[styles.container, style]}
        blurType={blurType}
        blurAmount={blurAmount}
        reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.9)"
        testID={testID}>
        {children}
      </RNBlurView>
    );
  }

  // iOSでは完全なblur効果を使用
  return (
    <RNBlurView
      style={[styles.container, style]}
      blurType={blurType}
      blurAmount={blurAmount}
      testID={testID}>
      {children}
    </RNBlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
