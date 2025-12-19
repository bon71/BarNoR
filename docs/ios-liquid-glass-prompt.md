# iOS Liquid Glass Effect Implementation Prompt for Claude Code

## 概要
このプロンプトは、React Native（Expo）アプリにiOS風のLiquid Glass（磨りガラス/ブラー）エフェクトを実装するためのClaude Code向けガイドです。モダンなiOSデザインに準拠した視覚的に美しいUIを実現します。

---

## 実装要件

### 1. 使用ライブラリ
```bash
npx expo install expo-blur
```

### 2. 基本的なBlurViewコンポーネント
```typescript
import { BlurView } from 'expo-blur';

// 基本的な使い方
<BlurView
  intensity={80}        // ブラーの強度（0-100）
  tint="systemMaterial" // iOS風のマテリアル
  style={styles.blur}
>
  {/* コンテンツ */}
</BlurView>
```

### 3. Tintオプション（iOS風マテリアル）

| Tint | 用途 | 見た目 |
|------|------|--------|
| `systemMaterial` | デフォルト、汎用的 | 環境光に適応 |
| `light` | 明るい背景 | 薄い白色ブラー |
| `dark` | 暗い背景 | 薄い黒色ブラー |
| `regular` | 標準の透明度 | 中間の透明度 |
| `prominent` | 強調表示 | より不透明 |
| `systemChromeMaterial` | ナビゲーションバー | iOS標準のChrome |
| `systemUltraThinMaterial` | 極薄 | 最も透明 |
| `systemThinMaterial` | 薄め | 透明度高め |
| `systemThickMaterial` | 厚め | 不透明度高め |

---

## デザインパターン別実装

### Pattern 1: Card with Blur Background
```typescript
<View style={styles.container}>
  {/* 背景画像 */}
  <Image source={backgroundImage} style={styles.background} />
  
  {/* Blurred Card */}
  <BlurView
    intensity={80}
    tint="systemMaterial"
    style={styles.card}
  >
    <Text style={styles.cardTitle}>タイトル</Text>
    <Text style={styles.cardContent}>コンテンツ</Text>
  </BlurView>
</View>

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'cover',
  },
  card: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    overflow: 'hidden', // 重要: borderRadiusを有効にする
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)', // 縁を追加
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  cardContent: {
    fontSize: 14,
    color: '#333',
  },
});
```

### Pattern 2: Modal/Bottom Sheet with Blur
```typescript
import { Modal } from 'react-native';

<Modal
  animationType="slide"
  transparent={true}
  visible={isVisible}
>
  <View style={styles.modalOverlay}>
    <BlurView
      intensity={90}
      tint="dark"
      style={styles.modalContainer}
    >
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>モーダルタイトル</Text>
        {/* モーダルコンテンツ */}
      </View>
    </BlurView>
  </View>
</Modal>

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // 半透明オーバーレイ
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  modalContent: {
    padding: 24,
    paddingBottom: 40, // Safe Areaを考慮
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
});
```

### Pattern 3: Navigation Bar with Blur
```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function BlurredHeader() {
  const insets = useSafeAreaInsets();
  
  return (
    <BlurView
      intensity={95}
      tint="systemChromeMaterial"
      style={[styles.header, { paddingTop: insets.top }]}
    >
      <View style={styles.headerContent}>
        <TouchableOpacity>
          <Text style={styles.backButton}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>タイトル</Text>
        <View style={{ width: 60 }} /> {/* Spacer for centering */}
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerContent: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  backButton: {
    fontSize: 17,
    color: '#007AFF',
  },
});
```

### Pattern 4: Floating Button with Blur
```typescript
<BlurView
  intensity={70}
  tint="light"
  style={styles.floatingButton}
>
  <TouchableOpacity style={styles.buttonInner}>
    <Text style={styles.buttonText}>＋</Text>
  </TouchableOpacity>
</BlurView>

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    // Elevation for Android
    elevation: 8,
  },
  buttonInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 32,
    color: '#007AFF',
    fontWeight: '300',
  },
});
```

### Pattern 5: Tabbar with Blur
```typescript
<BlurView
  intensity={95}
  tint="systemChromeMaterial"
  style={styles.tabBar}
>
  <View style={styles.tabBarContent}>
    {tabs.map((tab) => (
      <TouchableOpacity key={tab.id} style={styles.tab}>
        <Text style={styles.tabIcon}>{tab.icon}</Text>
        <Text style={styles.tabLabel}>{tab.label}</Text>
      </TouchableOpacity>
    ))}
  </View>
</BlurView>

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  tabBarContent: {
    flexDirection: 'row',
    height: 49,
    paddingBottom: 0, // Safe Areaは別途対応
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 10,
    color: '#000',
  },
});
```

---

## ベストプラクティス

### 1. パフォーマンス最適化
```typescript
// ❌ 避けるべき: 深いネストでのBlur
<BlurView>
  <BlurView>
    <BlurView>
      {/* パフォーマンス低下 */}
    </BlurView>
  </BlurView>
</BlurView>

// ✅ 推奨: 単一のBlurView
<BlurView intensity={80} tint="systemMaterial">
  <View>
    <View>
      {/* コンテンツ */}
    </View>
  </View>
</BlurView>
```

### 2. Border Radiusの適用
```typescript
// overflow: 'hidden' を必ず含める
<BlurView
  style={{
    borderRadius: 16,
    overflow: 'hidden', // これがないと角が丸くならない
  }}
>
  {/* コンテンツ */}
</BlurView>
```

### 3. 縁取り（Border）の追加
```typescript
// iOS風のガラス効果には薄い縁が効果的
<BlurView
  style={{
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)', // 明るい縁
    // または
    borderColor: 'rgba(0, 0, 0, 0.1)',      // 暗い縁
  }}
>
  {/* コンテンツ */}
</BlurView>
```

### 4. Shadow効果との組み合わせ
```typescript
<BlurView
  style={{
    // iOS Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    // Android Elevation
    elevation: 8,
  }}
>
  {/* コンテンツ */}
</BlurView>
```

### 5. Safe Areaの考慮
```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function Component() {
  const insets = useSafeAreaInsets();
  
  return (
    <BlurView
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      {/* コンテンツ */}
    </BlurView>
  );
}
```

---

## Color Scheme対応（Dark Mode）

```typescript
import { useColorScheme } from 'react-native';

function AdaptiveBlurCard() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  return (
    <BlurView
      intensity={80}
      tint={isDark ? 'dark' : 'light'}
      style={styles.card}
    >
      <Text style={[styles.text, { color: isDark ? '#fff' : '#000' }]}>
        コンテンツ
      </Text>
    </BlurView>
  );
}
```

---

## Animated Blurの実装

```typescript
import { useState } from 'react';
import Animated, {
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

function AnimatedBlur() {
  const [intensity, setIntensity] = useState(0);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(intensity > 0 ? 1 : 0, { duration: 300 }),
  }));
  
  return (
    <AnimatedBlurView
      intensity={intensity}
      tint="systemMaterial"
      style={[styles.blur, animatedStyle]}
    >
      {/* コンテンツ */}
    </AnimatedBlurView>
  );
}
```

---

## トラブルシューティング

### 問題1: BlurViewが表示されない
**原因**: `overflow: 'hidden'` が欠けている
**解決策**:
```typescript
<BlurView style={{ overflow: 'hidden', borderRadius: 16 }}>
```

### 問題2: Border Radiusが効かない
**原因**: 同上
**解決策**: 必ず `overflow: 'hidden'` を設定

### 問題3: パフォーマンスが悪い
**原因**: 複数のBlurViewのネストや、大きすぎるintensity
**解決策**:
- BlurViewのネストを避ける
- intensityを下げる（60-80が推奨）
- `renderToHardwareTextureAndroid` を使用（Android）

### 問題4: Androidで見た目が違う
**原因**: Androidのブラー実装がiOSと異なる
**解決策**:
```typescript
import { Platform } from 'react-native';

<BlurView
  intensity={Platform.OS === 'ios' ? 80 : 60}
  tint="systemMaterial"
>
```

---

## 実装チェックリスト

実装時に以下を確認してください：

- [ ] `expo-blur` がインストールされている
- [ ] `overflow: 'hidden'` を設定（border radiusを使う場合）
- [ ] 適切な `tint` を選択（背景に応じて）
- [ ] `intensity` は60-90の範囲（パフォーマンスと見た目のバランス）
- [ ] Safe Areaを考慮（ヘッダー・タブバーの場合）
- [ ] Dark Mode対応（`useColorScheme` の使用）
- [ ] 縁取り（border）を追加して視認性向上
- [ ] Shadowを追加して深度感を表現
- [ ] Androidでの見た目を確認（実機推奨）

---

## 参考資料

- [expo-blur公式ドキュメント](https://docs.expo.dev/versions/latest/sdk/blur-view/)
- [iOS Human Interface Guidelines - Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)（アニメーション用）

---

## Claude Codeへの指示

このプロンプトを使用する際、以下の点に従ってください：

1. **既存コードの確認**: 既に `expo-blur` がインストールされているか確認
2. **段階的実装**: パターンを1つずつ実装し、動作確認
3. **レスポンシブ対応**: 様々な画面サイズでテスト
4. **パフォーマンステスト**: 実機でスクロール性能を確認
5. **アクセシビリティ**: `accessible={true}` など、必要に応じて設定

実装時は必ずこのガイドのベストプラクティスに従い、iOS風のモダンで美しいUIを実現してください。
