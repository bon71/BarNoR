# Cursor実装指示 - Phase B: 設定画面実装

**Phase**: B（設定画面実装）
**所要時間**: 2-3時間
**目的**: Notion連携と固定DB設定を行うシンプルな設定画面を作成

---

## 📋 タスク概要

MVP最小化のため、以下を実装します：

- SimplifiedConfig型定義
- SimplifiedConfigRepository（保存・読み込み）
- SettingsScreenSimple（設定画面UI）
- useConfigStore（設定状態管理）

---

## 🎯 実装手順

### ステップ1: SimplifiedConfig型定義

**新規作成**: `src/domain/entities/SimplifiedConfig.ts`

```typescript
/**
 * 簡素化された設定（MVP版）
 * パッケージ管理を廃止し、固定の図書館DB設定のみ
 */
export interface SimplifiedConfig {
  /**
   * Notion Integration Token
   */
  notionToken: string;

  /**
   * 図書館データベースID（Notion Database UUID）
   */
  databaseId: string;

  /**
   * プロパティマッピング（ISBNバーコード → Notionプロパティ）
   */
  propertyMapping: PropertyMapping;
}

/**
 * プロパティマッピング
 */
export interface PropertyMapping {
  /**
   * ISBN → Notionプロパティ名
   * 例: "ISBN"
   */
  isbn: string;

  /**
   * タイトル → Notionプロパティ名
   * 例: "タイトル"
   */
  title: string;

  /**
   * 著者 → Notionプロパティ名
   * 例: "著者名"
   */
  author: string;

  /**
   * 書影URL → Notionプロパティ名
   * 例: "書影"
   */
  imageUrl: string;
}

/**
 * 設定の初期値
 */
export const DEFAULT_CONFIG: SimplifiedConfig = {
  notionToken: '',
  databaseId: '',
  propertyMapping: {
    isbn: 'ISBN',
    title: 'タイトル',
    author: '著者名',
    imageUrl: '書影',
  },
};
```

---

### ステップ2: SimplifiedConfigRepository実装

**新規作成**: `src/data/repositories/SimplifiedConfigRepository.ts`

```typescript
import {SimplifiedConfig} from '@/domain/entities/SimplifiedConfig';
import {MMKVStorage} from '@/data/datasources/MMKVStorage';

const STORAGE_KEY = 'simplified_config';

/**
 * 簡素化された設定のリポジトリ
 */
export class SimplifiedConfigRepository {
  constructor(private readonly storage: MMKVStorage) {}

  /**
   * 設定を保存
   */
  async saveConfig(config: SimplifiedConfig): Promise<void> {
    this.storage.setObject(STORAGE_KEY, config);
  }

  /**
   * 設定を読み込み
   */
  async loadConfig(): Promise<SimplifiedConfig | null> {
    const config = this.storage.getObject<SimplifiedConfig>(STORAGE_KEY);
    return config || null;
  }

  /**
   * 設定を削除
   */
  async deleteConfig(): Promise<void> {
    this.storage.delete(STORAGE_KEY);
  }

  /**
   * 設定の完全性を検証
   */
  validateConfig(config: SimplifiedConfig): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Token検証
    if (!config.notionToken || config.notionToken.trim() === '') {
      errors.push('Notion Tokenが入力されていません');
    }

    // DatabaseID検証（UUID形式）
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!config.databaseId || config.databaseId.trim() === '') {
      errors.push('データベースIDが入力されていません');
    } else if (!uuidPattern.test(config.databaseId.replace(/-/g, ''))) {
      errors.push('データベースIDの形式が正しくありません（UUID形式）');
    }

    // PropertyMapping検証
    if (!config.propertyMapping.isbn || config.propertyMapping.isbn.trim() === '') {
      errors.push('ISBNプロパティ名が入力されていません');
    }
    if (!config.propertyMapping.title || config.propertyMapping.title.trim() === '') {
      errors.push('タイトルプロパティ名が入力されていません');
    }
    if (!config.propertyMapping.author || config.propertyMapping.author.trim() === '') {
      errors.push('著者プロパティ名が入力されていません');
    }
    if (!config.propertyMapping.imageUrl || config.propertyMapping.imageUrl.trim() === '') {
      errors.push('書影プロパティ名が入力されていません');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
```

---

### ステップ3: useConfigStore実装

**新規作成**: `src/presentation/stores/useConfigStore.ts`

```typescript
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
```

---

### ステップ4: SettingsScreenSimple実装

**新規作成**: `src/presentation/screens/SettingsScreenSimple.tsx`

```typescript
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {Button, Input, Card} from '@/presentation/components/common';
import {spacing, typography} from '@/config/theme';
import {useTheme} from '@/presentation/hooks/useTheme';
import {useConfigStore} from '@/presentation/stores/useConfigStore';
import {SimplifiedConfigRepository} from '@/data/repositories/SimplifiedConfigRepository';
import {MMKVStorage} from '@/data/datasources/MMKVStorage';
import {NotionAPI} from '@/data/datasources/NotionAPI';
import {showSuccessToast, showErrorToast} from '@/presentation/stores/useToastStore';

const configRepository = new SimplifiedConfigRepository(new MMKVStorage());
const notionAPI = new NotionAPI();

export const SettingsScreenSimple: React.FC = () => {
  const {colors} = useTheme();
  const {config, setConfig} = useConfigStore();

  const [notionToken, setNotionToken] = useState(config.notionToken);
  const [databaseId, setDatabaseId] = useState(config.databaseId);
  const [isbnProperty, setIsbnProperty] = useState(config.propertyMapping.isbn);
  const [titleProperty, setTitleProperty] = useState(config.propertyMapping.title);
  const [authorProperty, setAuthorProperty] = useState(config.propertyMapping.author);
  const [imageUrlProperty, setImageUrlProperty] = useState(config.propertyMapping.imageUrl);

  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // 初期読み込み
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const savedConfig = await configRepository.loadConfig();
      if (savedConfig) {
        setConfig(savedConfig);
        setNotionToken(savedConfig.notionToken);
        setDatabaseId(savedConfig.databaseId);
        setIsbnProperty(savedConfig.propertyMapping.isbn);
        setTitleProperty(savedConfig.propertyMapping.title);
        setAuthorProperty(savedConfig.propertyMapping.author);
        setImageUrlProperty(savedConfig.propertyMapping.imageUrl);
      }
    } catch (error) {
      console.error('[SettingsScreenSimple] 設定読み込みエラー:', error);
    }
  };

  const handleSave = async () => {
    const newConfig = {
      notionToken,
      databaseId,
      propertyMapping: {
        isbn: isbnProperty,
        title: titleProperty,
        author: authorProperty,
        imageUrl: imageUrlProperty,
      },
    };

    // バリデーション
    const validation = configRepository.validateConfig(newConfig);
    if (!validation.isValid) {
      Alert.alert('入力エラー', validation.errors.join('\n'));
      return;
    }

    // 保存
    setIsLoading(true);
    try {
      await configRepository.saveConfig(newConfig);
      setConfig(newConfig);
      showSuccessToast('設定を保存しました');
    } catch (error) {
      console.error('[SettingsScreenSimple] 保存エラー:', error);
      showErrorToast('保存に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!notionToken) {
      Alert.alert('エラー', 'Notion Tokenを入力してください');
      return;
    }

    setIsTesting(true);
    try {
      // Notion API接続テスト（searchDatabases呼び出し）
      const result = await notionAPI.searchDatabases(notionToken);

      if (result && result.length >= 0) {
        Alert.alert(
          '接続成功',
          `Notionに正常に接続できました。\n${result.length}件のデータベースが見つかりました。`
        );
      } else {
        Alert.alert('接続失敗', 'データベース一覧の取得に失敗しました');
      }
    } catch (error) {
      console.error('[SettingsScreenSimple] 接続テストエラー:', error);
      Alert.alert(
        '接続失敗',
        'Notionへの接続に失敗しました。\nTokenが正しいか確認してください。\n\n' +
          (error instanceof Error ? error.message : String(error))
      );
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, {color: colors.textPrimary}]}>
          図書館バーコードリーダー設定
        </Text>
        <Text style={[styles.subtitle, {color: colors.textSecondary}]}>
          Notion連携と図書館データベースの設定を行います
        </Text>

        {/* Notion Integration Token */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: colors.textPrimary}]}>
            1. Notion Integration Token
          </Text>
          <Card>
            <Input
              label="Notion Token"
              value={notionToken}
              onChangeText={setNotionToken}
              placeholder="secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              secureTextEntry={true}
              testID="notion-token-input"
            />
            <Text style={[styles.hint, {color: colors.textSecondary}]}>
              Notionの Integration Token を入力してください。{'\n'}
              取得方法: https://www.notion.so/my-integrations
            </Text>
            <Button
              title="接続テスト"
              onPress={handleTestConnection}
              loading={isTesting}
              disabled={!notionToken}
              variant="secondary"
              style={styles.testButton}
              testID="test-connection-button"
            />
          </Card>
        </View>

        {/* データベースID */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: colors.textPrimary}]}>
            2. 図書館データベースID
          </Text>
          <Card>
            <Input
              label="データベースID"
              value={databaseId}
              onChangeText={setDatabaseId}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              testID="database-id-input"
            />
            <Text style={[styles.hint, {color: colors.textSecondary}]}>
              NotionデータベースのIDを入力してください。{'\n'}
              データベースURLの最後の32文字（ハイフン含む）がIDです。{'\n'}
              例: https://notion.so/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
            </Text>
          </Card>
        </View>

        {/* プロパティマッピング */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: colors.textPrimary}]}>
            3. プロパティマッピング
          </Text>
          <Card>
            <Text style={[styles.mappingDescription, {color: colors.textSecondary}]}>
              Notionデータベースのプロパティ名を入力してください
            </Text>

            <Input
              label="ISBN → Notionプロパティ名"
              value={isbnProperty}
              onChangeText={setIsbnProperty}
              placeholder="ISBN"
              testID="isbn-property-input"
            />

            <Input
              label="タイトル → Notionプロパティ名"
              value={titleProperty}
              onChangeText={setTitleProperty}
              placeholder="タイトル"
              testID="title-property-input"
            />

            <Input
              label="著者 → Notionプロパティ名"
              value={authorProperty}
              onChangeText={setAuthorProperty}
              placeholder="著者名"
              testID="author-property-input"
            />

            <Input
              label="書影URL → Notionプロパティ名"
              value={imageUrlProperty}
              onChangeText={setImageUrlProperty}
              placeholder="書影"
              testID="imageurl-property-input"
            />
          </Card>
        </View>

        {/* 保存ボタン */}
        <Button
          title="設定を保存"
          onPress={handleSave}
          loading={isLoading}
          style={styles.saveButton}
          testID="save-config-button"
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  hint: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  testButton: {
    marginTop: spacing.md,
  },
  mappingDescription: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.md,
  },
  saveButton: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
});
```

---

### ステップ5: BottomTabNavigatorの更新

**ファイル**: `src/presentation/navigation/BottomTabNavigator.tsx`

Phase Aで作成した`SettingsScreen`を`SettingsScreenSimple`に置き換えてください：

```typescript
import {SettingsScreenSimple} from '@/presentation/screens/SettingsScreenSimple';

// ...

<Tab.Screen
  name="Settings"
  component={SettingsScreenSimple}
  options={{
    tabBarLabel: '設定',
    tabBarIcon: ({color}) => <Icon name="settings" color={color} />,
  }}
/>
```

---

## ✅ 完了確認チェックリスト

Phase B完了後、以下を確認してください：

### 1. ファイル作成確認

```bash
# 作成されていることを確認
ls src/domain/entities/SimplifiedConfig.ts && echo "✅ 作成済み"
ls src/data/repositories/SimplifiedConfigRepository.ts && echo "✅ 作成済み"
ls src/presentation/stores/useConfigStore.ts && echo "✅ 作成済み"
ls src/presentation/screens/SettingsScreenSimple.tsx && echo "✅ 作成済み"
```

### 2. TypeScriptエラー確認

```bash
npx tsc --noEmit
```

**期待される結果**: エラー0件

### 3. ビルド確認

```bash
npm run ios
```

**期待される結果**: ビルド成功

### 4. 設定画面動作確認

アプリを起動し、以下を確認：

- [ ] 設定タブをタップで設定画面が表示される
- [ ] 3つのセクションが表示される（Token、DatabaseID、PropertyMapping）
- [ ] すべての入力フィールドが動作する
- [ ] 「接続テスト」ボタンが動作する
- [ ] 「設定を保存」ボタンが動作する
- [ ] 保存後、アプリ再起動で設定が復元される

### 5. バリデーション確認

- [ ] Token未入力時、保存エラーが表示される
- [ ] DatabaseID未入力時、保存エラーが表示される
- [ ] PropertyMapping未入力時、保存エラーが表示される

---

## 🚨 注意事項

### MMKVStorageのインポート

MMKVStorageが既存の場合はそのまま使用してください。

### NotionAPIの使用

`src/data/datasources/NotionAPI.ts` が既存の場合、そのまま使用してください。

### エラーハンドリング

- すべての非同期処理に try-catch を実装
- ユーザーフレンドリーなエラーメッセージを表示
- console.errorでログ出力

---

## 📞 Phase B完了報告

Phase B完了後、以下を確認してClaudeCodeに報告してください：

1. **作成完了確認**
   - すべての新規ファイルが作成された
   - TypeScriptエラー確認済み

2. **動作確認**
   - 設定画面が正しく表示される
   - 入力・保存が動作する
   - バリデーションが動作する

3. **コミット**
   ```bash
   git add .
   git commit -m "feat: Phase B - SimplifiedConfig設定画面実装

   追加内容:
   - SimplifiedConfig型定義
   - SimplifiedConfigRepository実装
   - useConfigStore実装
   - SettingsScreenSimple実装

   機能:
   - Notion Token設定
   - 図書館DatabaseID設定
   - プロパティマッピング設定（4項目）
   - 接続テスト機能
   - バリデーション機能

   🤖 Generated with Claude Code

   Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

---

**Phase B完了後、Phase Cの実装指示を受け取ってください。**
