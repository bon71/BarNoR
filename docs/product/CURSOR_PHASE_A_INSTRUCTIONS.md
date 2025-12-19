# Cursor実装指示 - Phase A: 不要機能削除

**Phase**: A（不要機能削除）
**所要時間**: 2-3時間
**目的**: アプリを最小構成（スキャン/設定の2画面のみ）に簡素化する

---

## 📋 タスク概要

MVP最小化のため、以下の機能を削除・簡素化します：

- BottomTabNavigator（4タブ → 2タブ）
- パッケージ管理関連画面（4画面削除）
- パッケージ管理ViewModel
- パッケージ管理Store
- 関連するテストファイル

---

## 🎯 実装手順

### ステップ1: BottomTabNavigator の簡素化

**ファイル**: `src/presentation/navigation/BottomTabNavigator.tsx`

**変更内容**:

#### 1.1 タブを4つから2つに削減

**削除するタブ**:
- ホームタブ（Home）
- 履歴タブ（History）
- パッケージタブ（Packages）

**残すタブ**:
- スキャンタブ（Scan）
- 設定タブ（Settings）

#### 1.2 実装例

```typescript
import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {ScanScreen} from '@/presentation/screens/ScanScreen';
import {SettingsScreen} from '@/presentation/screens/SettingsScreen';
import {BottomTabParamList} from './types';

const Tab = createBottomTabNavigator<BottomTabParamList>();

export const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#9CA3AF',
      }}>
      <Tab.Screen
        name="Scan"
        component={ScanScreen}
        options={{
          tabBarLabel: 'スキャン',
          tabBarIcon: ({color}) => <Icon name="barcode" color={color} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: '設定',
          tabBarIcon: ({color}) => <Icon name="settings" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};
```

#### 1.3 types.ts の更新

**ファイル**: `src/presentation/navigation/types.ts`

```typescript
// BottomTabParamList を簡素化
export type BottomTabParamList = {
  Scan: undefined;
  Settings: undefined;
};

// 削除: Home, History, Packages
```

---

### ステップ2: 不要な画面コンポーネントの削除

以下のファイルを**完全削除**してください：

```bash
# 削除対象ファイル
src/presentation/screens/HomeScreen.tsx
src/presentation/screens/HistoryScreen.tsx
src/presentation/screens/PackageManagementScreen.tsx
src/presentation/screens/PackageFormScreen.tsx
src/presentation/screens/PropertyMappingScreen.tsx
src/presentation/screens/PackageListScreen.tsx
src/presentation/screens/DatabaseSettingsScreen.tsx
```

**削除方法**:

```bash
rm src/presentation/screens/HomeScreen.tsx
rm src/presentation/screens/HistoryScreen.tsx
rm src/presentation/screens/PackageManagementScreen.tsx
rm src/presentation/screens/PackageFormScreen.tsx
rm src/presentation/screens/PropertyMappingScreen.tsx
rm src/presentation/screens/PackageListScreen.tsx
rm src/presentation/screens/DatabaseSettingsScreen.tsx
```

---

### ステップ3: ScanScreen の簡素化

**ファイル**: `src/presentation/screens/ScanScreen.tsx`

**削除内容**:

1. **パッケージ選択モーダル関連コード削除**
   - `showPackageSelector` state削除
   - パッケージ選択モーダルのUI削除
   - `setActivePackage` 呼び出し削除

2. **usePackageStore 参照削除**
   - `import {usePackageStore}` 削除
   - `const {packages, activePackage, setActivePackage} = usePackageStore()` 削除

3. **パッケージ選択ボタン削除**
   - 「📦 パッケージを選択」ボタンとそのUI削除

**変更前**:

```typescript
const {packages, activePackage, setActivePackage} = usePackageStore();
const [showPackageSelector, setShowPackageSelector] = useState(false);

// ... パッケージ選択モーダル
<Modal visible={showPackageSelector}>
  {/* ... */}
</Modal>
```

**変更後**:

```typescript
// usePackageStore参照削除
// showPackageSelector削除
// パッケージ選択モーダル削除
```

**注意**: スキャン機能本体（BarcodeScanner, handleBarcodeScanned等）は**削除しないでください**

---

### ステップ4: PackageViewModel の削除

**ファイル**: `src/presentation/viewmodels/PackageViewModel.ts`

このファイルを**完全削除**してください：

```bash
rm src/presentation/viewmodels/PackageViewModel.ts
```

**影響範囲**:

- `ViewModelProvider.ts` から PackageViewModel の export削除
- 他のファイルで PackageViewModel を import している箇所を削除

---

### ステップ5: usePackageStore の簡素化

**ファイル**: `src/presentation/stores/usePackageStore.ts`

**削除内容**:

1. **packages 配列削除**
2. **activePackage 削除**
3. **setPackages, setActivePackage 等のメソッド削除**

**変更前**:

```typescript
interface PackageState {
  packages: Package[];
  activePackage: Package | null;
  setPackages: (packages: Package[]) => void;
  setActivePackage: (pkg: Package) => void;
  // ...
}
```

**変更後**:

```typescript
// このファイル自体を削除するか、空の状態にする
// Phase Bで SimplifiedConfig用のストアに置き換え予定
```

**推奨**: このファイルを一旦削除し、Phase Bで新しい `useConfigStore.ts` を作成

```bash
rm src/presentation/stores/usePackageStore.ts
```

---

### ステップ6: 関連テストファイルの削除

以下のテストファイルを**完全削除**してください：

```bash
# 削除対象テストファイル
src/__tests__/presentation/screens/HomeScreen.test.tsx
src/__tests__/presentation/screens/HistoryScreen.test.tsx
src/__tests__/presentation/screens/PackageManagementScreen.test.tsx
src/__tests__/presentation/screens/PackageFormScreen.test.tsx
src/__tests__/presentation/screens/PropertyMappingScreen.test.tsx
src/__tests__/presentation/screens/PackageListScreen.test.tsx
src/__tests__/presentation/screens/DatabaseSettingsScreen.test.tsx
src/__tests__/presentation/viewmodels/PackageViewModel.test.ts

# E2Eテスト削除
e2e/app.test.ts
```

**削除方法**:

```bash
rm src/__tests__/presentation/screens/HomeScreen.test.tsx
rm src/__tests__/presentation/screens/HistoryScreen.test.tsx
rm src/__tests__/presentation/screens/PackageManagementScreen.test.tsx
rm src/__tests__/presentation/screens/PackageFormScreen.test.tsx
rm src/__tests__/presentation/screens/PropertyMappingScreen.test.tsx
rm src/__tests__/presentation/screens/PackageListScreen.test.tsx
rm src/__tests__/presentation/screens/DatabaseSettingsScreen.test.tsx
rm src/__tests__/presentation/viewmodels/PackageViewModel.test.ts
rm e2e/app.test.ts
```

---

### ステップ7: ViewModelProvider の更新

**ファイル**: `src/presentation/providers/ViewModelProvider.ts`

**削除内容**:

```typescript
// 削除
import {PackageViewModel} from '@/presentation/viewmodels/PackageViewModel';
export const packageViewModel = new PackageViewModel(...);
```

**残すViewModel**:

- ScanViewModel（必須）
- その他必要なViewModel

---

### ステップ8: importの整理

以下のファイルで、削除したコンポーネント・ViewModelへのimportを削除してください：

**確認対象ファイル**:

```bash
src/presentation/navigation/RootNavigator.tsx
src/presentation/navigation/types.ts
src/presentation/components/common/index.ts
src/App.tsx
```

**削除するimport例**:

```typescript
// 削除
import {PackageFormScreen} from '@/presentation/screens/PackageFormScreen';
import {PackageManagementScreen} from '@/presentation/screens/PackageManagementScreen';
import {HistoryScreen} from '@/presentation/screens/HistoryScreen';
import {packageViewModel} from '@/presentation/providers/ViewModelProvider';
import {usePackageStore} from '@/presentation/stores/usePackageStore';
```

---

## ✅ 完了確認チェックリスト

Phase A完了後、以下を確認してください：

### 1. ファイル削除確認

```bash
# 削除されていることを確認
ls src/presentation/screens/PackageFormScreen.tsx 2>/dev/null && echo "❌ 削除されていません" || echo "✅ 削除済み"
ls src/presentation/screens/PackageManagementScreen.tsx 2>/dev/null && echo "❌ 削除されていません" || echo "✅ 削除済み"
ls src/presentation/viewmodels/PackageViewModel.ts 2>/dev/null && echo "❌ 削除されていません" || echo "✅ 削除済み"
ls src/presentation/stores/usePackageStore.ts 2>/dev/null && echo "❌ 削除されていません" || echo "✅ 削除済み"
```

### 2. TypeScriptエラー確認

```bash
npx tsc --noEmit
# エラーが出る場合、importの整理が必要
```

**期待される結果**: エラー0件（または削除に伴う一時的なエラーのみ）

### 3. ビルド確認

```bash
npm run ios
# ビルドが通ることを確認
```

**期待される結果**: ビルド成功

### 4. タブ数確認

アプリを起動し、以下を確認：

- [ ] BottomTabNavigatorに2つのタブのみ表示される（スキャン、設定）
- [ ] ホーム、履歴、パッケージタブが表示されない

### 5. 削除されたファイル一覧

以下のファイルがすべて削除されていることを確認：

- [ ] HomeScreen.tsx
- [ ] HistoryScreen.tsx
- [ ] PackageManagementScreen.tsx
- [ ] PackageFormScreen.tsx
- [ ] PropertyMappingScreen.tsx
- [ ] PackageListScreen.tsx
- [ ] DatabaseSettingsScreen.tsx
- [ ] PackageViewModel.ts
- [ ] usePackageStore.ts
- [ ] 関連テストファイル（8ファイル）

---

## 🚨 注意事項

### 削除してはいけないファイル

以下のファイルは**削除しないでください**（Phase B, Cで使用）：

- `ScanScreen.tsx`
- `ScanResultScreen.tsx`
- `SettingsScreen.tsx`
- `ScanViewModel.ts`
- `NotionRepository.ts`
- `OpenBDAPI.ts`
- `StorageRepository.ts`

### エラーが出た場合

1. **import エラー**:
   - 削除したファイルへのimportが残っている
   - 該当ファイルを開き、importを削除

2. **型エラー**:
   - `BottomTabParamList` の更新が必要
   - `types.ts` を確認

3. **ビルドエラー**:
   - Metro bundlerのキャッシュクリア
   ```bash
   npm start -- --reset-cache
   ```

---

## 📞 Phase A完了報告

Phase A完了後、以下を確認してClaudeCodeに報告してください：

1. **削除完了確認**
   - すべての対象ファイルが削除された
   - TypeScriptエラー確認済み

2. **ビルド確認**
   - iOS ビルドが成功した
   - 2タブのみ表示されることを確認した

3. **コミット**
   ```bash
   git add .
   git commit -m "refactor: Phase A - MVP最小化のため不要機能削除

   削除内容:
   - BottomTabNavigator簡素化（4タブ→2タブ）
   - パッケージ管理画面削除（7画面）
   - PackageViewModel削除
   - usePackageStore削除
   - 関連テスト削除（8ファイル）

   MVP価値:
   - スキャン/設定の2画面のみに絞り込み
   - 固定設定ベースのシンプルな構成

   🤖 Generated with Claude Code

   Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

**Phase A完了後、Phase Bの実装指示を受け取ってください。**
