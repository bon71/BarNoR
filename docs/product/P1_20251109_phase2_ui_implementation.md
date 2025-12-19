# Phase 2: PackageFormScreen UI改善実装プロンプト

## 概要

PackageFormScreenに以下の改善を実装します：

1. ✅ ライブラリ選択UI追加（**完了済み**）
2. Notion DB一覧表示の改善（選択可能な状態に）
3. UI/UXの最適化

## 前提条件

### 完了済み

- ✅ LibraryType enum追加
- ✅ Package エンティティ拡張
- ✅ PackageViewModel の createPackage/updatePackage 更新
- ✅ StorageRepository の libraryType 対応
- ✅ packageSerialization の libraryType 対応
- ✅ defaultPackages の libraryType 追加
- ✅ ライブラリ選択UI追加（PackageFormScreen）
- ✅ パッケージ選択モーダル追加（ScanScreen）

### 現在の問題点

PackageFormScreenの「Notionデータベース」セクションで、以下の問題が発生しています：

1. **データベース一覧が表示されない**
   - `loadDatabases()` は実行されているが、結果が空
   - Notion APIからデータベースを正しく取得できていない可能性

2. **データベース選択UIが機能していない**
   - データベース一覧が表示されても、選択時の動作が不明確

## 実装タスク

### Task 2.1: Notion API接続の確認とデバッグ

**対象ファイル:** `src/presentation/screens/PackageFormScreen.tsx`

**問題の特定:**

1. `loadDatabases()` の結果を確認
2. Notion APIのエラーハンドリングを強化
3. デバッグログの追加

**実装内容:**

```typescript
// src/presentation/screens/PackageFormScreen.tsx

const loadDatabases = async () => {
  setIsLoadingDatabases(true);
  try {
    console.log('[PackageFormScreen] Loading databases...');
    const result = await packageViewModel.fetchNotionDatabases();

    console.log('[PackageFormScreen] Fetch result:', {
      success: result.success,
      databaseCount: result.databases?.length || 0,
      error: result.error,
    });

    if (result.success && result.databases) {
      console.log('[PackageFormScreen] Databases loaded:', result.databases);
      setDatabases(result.databases);

      // データベースが取得できたことをユーザーに通知（オプション）
      if (result.databases.length === 0) {
        Alert.alert(
          '情報',
          'アクセス可能なNotionデータベースが見つかりませんでした。\n\n' +
          'Notion Integration設定で、このアプリにデータベースへのアクセス権限を付与してください。'
        );
      }
    } else {
      console.error('[PackageFormScreen] Failed to load databases:', result.error);
      Alert.alert(
        'エラー',
        result.error || 'データベース一覧の取得に失敗しました。\n\n' +
        '以下を確認してください：\n' +
        '1. Notion Integration Tokenが正しいか\n' +
        '2. インターネット接続が有効か\n' +
        '3. Notionでデータベースへのアクセス権限が付与されているか'
      );
    }
  } catch (error) {
    console.error('[PackageFormScreen] Exception in loadDatabases:', error);
    Alert.alert(
      'エラー',
      'データベース一覧の取得中にエラーが発生しました。\n\n' +
      (error instanceof Error ? error.message : String(error))
    );
  } finally {
    setIsLoadingDatabases(false);
  }
};
```

### Task 2.2: データベース選択UIの明確化

**対象ファイル:** `src/presentation/screens/PackageFormScreen.tsx`

**現状の問題:**
- データベースアイテムがタップ可能かどうかが不明確
- 選択状態の視覚的フィードバックが弱い

**実装内容:**

```typescript
// データベースアイテムのレンダリング改善
const renderDatabaseItem = (database: NotionDatabase) => {
  const isSelected = selectedDatabaseId === database.id;

  return (
    <View key={database.id} style={styles.databaseItemContainer} testID={`database-item-${database.id}`}>
      <TouchableOpacity
        onPress={() => {
          setSelectedDatabaseId(database.id);
          console.log('[PackageFormScreen] Database selected:', {
            id: database.id,
            title: database.title,
          });
        }}
        style={[
          styles.databaseItem,
          isSelected && [styles.databaseItemSelected, {backgroundColor: colors.primary + '10', borderColor: colors.primary}],
        ]}
        testID={`database-item-select-${database.id}`}>
        <View style={styles.databaseItemContent}>
          <View style={[styles.radioButton, {borderColor: colors.primary}]}>
            {isSelected && <View style={[styles.radioButtonInner, {backgroundColor: colors.primary}]} />}
          </View>
          <View style={styles.databaseItemText}>
            <Text style={[styles.databaseItemTitle, {color: colors.textPrimary}]} testID={`database-item-title-${database.id}`}>
              {database.title}
            </Text>
            {database.description && (
              <Text style={[styles.databaseItemDescription, {color: colors.textSecondary}]} testID={`database-item-desc-${database.id}`}>
                {database.description}
              </Text>
            )}
            <Text style={[styles.databaseItemId, {color: colors.textSecondary}]} numberOfLines={1} testID={`database-item-id-${database.id}`}>
              ID: {database.id}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => handlePreviewDatabase(database)}
        style={[styles.previewButton, {backgroundColor: colors.primary}]}
        testID={`database-item-preview-${database.id}`}>
        <Text style={[styles.previewButtonText, {color: colors.primaryText}]}>プレビュー</Text>
      </TouchableOpacity>
    </View>
  );
};
```

**スタイル更新:**

```typescript
const styles = StyleSheet.create({
  // ... 既存スタイル

  databaseItemContainer: {
    marginBottom: spacing.md,
    borderRadius: 8,
    overflow: 'hidden',
  },
  databaseItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 8,
  },
  databaseItemSelected: {
    // backgroundColor と borderColor は動的に設定
  },
  databaseItemContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginRight: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2, // タイトルテキストと垂直方向を揃える
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  databaseItemText: {
    flex: 1,
  },
  databaseItemTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  databaseItemDescription: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.xs,
  },
  databaseItemId: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'monospace',
  },
  previewButton: {
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 6,
    elevation: 2, // Android用の影
    shadowColor: '#000', // iOS用の影
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  previewButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
});
```

### Task 2.3: エラーハンドリングとフィードバック改善

**対象ファイル:** `src/presentation/screens/PackageFormScreen.tsx`

**実装内容:**

```typescript
// データベース一覧セクションの改善
<View style={styles.section}>
  <Text style={[styles.sectionTitle, {color: colors.textPrimary}]} testID="package-form-database-title">
    Notionデータベース
  </Text>
  <Text style={[styles.sectionDescription, {color: colors.textSecondary}]}>
    保存先のNotionデータベースを選択してください
  </Text>
  {isLoadingDatabases ? (
    <Card>
      <LoadingIndicator message="データベースを読み込み中..." />
    </Card>
  ) : databases.length === 0 ? (
    <Card>
      <View style={styles.emptyDatabaseContainer}>
        <Text style={[styles.emptyText, {color: colors.textSecondary}]}>
          📚 データベースが見つかりませんでした
        </Text>
        <Text style={[styles.emptySubText, {color: colors.textSecondary}]}>
          Notion Integrationでこのアプリに{'\n'}
          データベースへのアクセス権限を{'\n'}
          付与してください
        </Text>
        <Button
          title="再読み込み"
          onPress={loadDatabases}
          variant="secondary"
          size="small"
          style={styles.reloadButton}
        />
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              'Notion Integration設定方法',
              '1. Notionアプリでデータベースを開く\n' +
              '2. 右上の「...」メニューをタップ\n' +
              '3. 「接続を追加」を選択\n' +
              '4. このアプリのIntegrationを選択\n' +
              '5. 「許可」をタップ\n\n' +
              '詳細はNotionのドキュメントを参照してください。'
            );
          }}
          style={styles.helpButton}
        >
          <Text style={[styles.helpButtonText, {color: colors.primary}]}>
            設定方法を見る
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  ) : (
    <Card testID="database-list">
      <Text style={[styles.databaseListHint, {color: colors.textSecondary}]}>
        {databases.length}件のデータベースが見つかりました
      </Text>
      {databases.map(db => renderDatabaseItem(db))}
    </Card>
  )}
</View>
```

**追加スタイル:**

```typescript
const styles = StyleSheet.create({
  // ... 既存スタイル

  sectionDescription: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.md,
    color: '#6B7280',
  },
  emptyDatabaseContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptySubText: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  reloadButton: {
    minWidth: 120,
    marginBottom: spacing.md,
  },
  helpButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  helpButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  databaseListHint: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
});
```

### Task 2.4: バリデーション強化

**対象ファイル:** `src/presentation/screens/PackageFormScreen.tsx`

**実装内容:**

```typescript
const handleSave = async () => {
  // バリデーション
  if (!name.trim()) {
    Alert.alert('エラー', 'パッケージ名を入力してください');
    return;
  }

  if (!selectedLibraryType) {
    Alert.alert('エラー', 'ライブラリを選択してください');
    return;
  }

  if (!selectedDatabaseId) {
    Alert.alert(
      'エラー',
      'Notionデータベースを選択してください\n\n' +
      'データベースが表示されない場合は、Notion Integrationでアクセス権限を付与してください。'
    );
    return;
  }

  if (Object.keys(propertyMapping).length === 0) {
    Alert.alert(
      'エラー',
      'プロパティマッピングを設定してください\n\n' +
      '「プロパティマッピングを設定」ボタンをタップして、フィールドの対応関係を設定してください。'
    );
    return;
  }

  // 保存処理
  setIsLoading(true);
  try {
    let result;
    if (mode === 'edit' && existingPackage) {
      console.log('[PackageFormScreen] Updating package:', {
        id: existingPackage.id,
        name,
        libraryType: selectedLibraryType,
        databaseId: selectedDatabaseId,
      });

      result = await packageViewModel.updatePackage(existingPackage.id, {
        name,
        description,
        libraryType: selectedLibraryType,
        databaseId: selectedDatabaseId,
        propertyMapping,
      });

      if (result.success) {
        showSuccessToast('パッケージを更新しました');
        navigation.goBack();
      } else {
        showErrorToast(result.error || '更新に失敗しました');
      }
    } else {
      console.log('[PackageFormScreen] Creating package:', {
        name,
        libraryType: selectedLibraryType,
        databaseId: selectedDatabaseId,
      });

      result = await packageViewModel.createPackage(
        name,
        description,
        selectedLibraryType,
        selectedDatabaseId,
        propertyMapping,
      );

      if (result.success) {
        showSuccessToast('パッケージを作成しました');
        navigation.goBack();
      } else {
        showErrorToast(result.error || '作成に失敗しました');
      }
    }
  } catch (error) {
    console.error('[PackageFormScreen] Save error:', error);
    showErrorToast('保存中にエラーが発生しました');
  } finally {
    setIsLoading(false);
  }
};
```

### Task 2.5: プロパティマッピング設定ボタンの改善

**対象ファイル:** `src/presentation/screens/PackageFormScreen.tsx`

**実装内容:**

```typescript
const handlePropertyMapping = () => {
  if (!selectedDatabaseId) {
    Alert.alert(
      'データベースを選択してください',
      'プロパティマッピングを設定する前に、Notionデータベースを選択してください。'
    );
    return;
  }

  console.log('[PackageFormScreen] Navigating to PropertyMapping:', {
    databaseId: selectedDatabaseId,
    currentMapping: propertyMapping,
  });

  navigation.navigate('PropertyMapping', {
    databaseId: selectedDatabaseId,
    currentMapping: propertyMapping,
    onSave: (mapping: Record<string, string>) => {
      console.log('[PackageFormScreen] Property mapping saved:', mapping);
      setPropertyMapping(mapping);
    },
  });
};
```

**UI更新:**

```typescript
<View style={styles.section}>
  <Text style={[styles.sectionTitle, {color: colors.textPrimary}]} testID="package-form-mapping-title">
    プロパティマッピング
  </Text>
  <Card>
    <Text style={[styles.mappingDescription, {color: colors.textSecondary}]}>
      スキャンしたアイテムのフィールドと、Notionデータベースのプロパティを対応付けます
    </Text>
    <View style={styles.mappingInfo}>
      <Text style={[styles.mappingInfoLabel, {color: colors.textSecondary}]}>
        設定済み:
      </Text>
      <Text style={[styles.mappingInfoValue, {color: colors.textPrimary}]}>
        {Object.keys(propertyMapping).length}件
      </Text>
    </View>
    {Object.keys(propertyMapping).length > 0 && (
      <View style={styles.mappingPreview}>
        {Object.entries(propertyMapping).slice(0, 3).map(([key, value]) => (
          <Text key={key} style={[styles.mappingPreviewItem, {color: colors.textSecondary}]}>
            • {key} → {value}
          </Text>
        ))}
        {Object.keys(propertyMapping).length > 3 && (
          <Text style={[styles.mappingPreviewMore, {color: colors.textSecondary}]}>
            ...他 {Object.keys(propertyMapping).length - 3}件
          </Text>
        )}
      </View>
    )}
    <Button
      title={Object.keys(propertyMapping).length > 0 ? 'プロパティマッピングを編集' : 'プロパティマッピングを設定'}
      onPress={handlePropertyMapping}
      variant="secondary"
      disabled={!selectedDatabaseId}
      testID="property-mapping-button"
    />
    {!selectedDatabaseId && (
      <Text style={[styles.disabledHint, {color: colors.error}]}>
        ※ データベースを選択してください
      </Text>
    )}
  </Card>
</View>
```

**追加スタイル:**

```typescript
const styles = StyleSheet.create({
  // ... 既存スタイル

  mappingPreview: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
  },
  mappingPreviewItem: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.xs,
  },
  mappingPreviewMore: {
    fontSize: typography.fontSize.sm,
    fontStyle: 'italic',
  },
  disabledHint: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
```

## テスト手順

### 1. データベース取得のテスト

1. PackageFormScreenを開く
2. コンソールログを確認
   - `[PackageFormScreen] Loading databases...`
   - `[PackageFormScreen] Fetch result:...`
3. データベース一覧が表示されることを確認
4. データベースが0件の場合、適切なエラーメッセージが表示されることを確認

### 2. データベース選択のテスト

1. データベース一覧からデータベースをタップ
2. 選択状態が視覚的に反映されることを確認（背景色・ラジオボタン）
3. コンソールログに選択されたデータベースIDが表示されることを確認

### 3. プレビュー機能のテスト

1. データベースの「プレビュー」ボタンをタップ
2. データベースプレビューモーダルが開くことを確認
3. エラーが発生しないことを確認

### 4. パッケージ作成フローのテスト

1. パッケージ名を入力
2. ライブラリを選択（OpenBD）
3. Notionデータベースを選択
4. プロパティマッピングを設定
5. 「作成」ボタンをタップ
6. パッケージが正常に作成されることを確認

### 5. バリデーションのテスト

1. 各必須項目を未入力のまま「作成」ボタンをタップ
2. 適切なエラーメッセージが表示されることを確認
   - パッケージ名未入力
   - ライブラリ未選択
   - データベース未選択
   - プロパティマッピング未設定

## 成功基準

- ✅ Notion APIからデータベース一覧が正しく取得される
- ✅ データベース一覧が画面に表示される
- ✅ データベースをタップして選択できる
- ✅ 選択状態が視覚的にわかりやすい
- ✅ プレビュー機能が動作する
- ✅ バリデーションが適切に機能する
- ✅ パッケージ作成/更新が正常に完了する

## トラブルシューティング

### データベース一覧が表示されない場合

1. Notion Integration Tokenが正しいか確認
2. Notionでデータベースへのアクセス権限が付与されているか確認
3. コンソールログでAPIエラーを確認
4. ネットワーク接続を確認

### データベースを選択できない場合

1. `selectedDatabaseId` stateが更新されているか確認
2. `renderDatabaseItem` の `onPress` ハンドラーが呼ばれているか確認
3. コンソールログで選択イベントを確認

## 関連ドキュメント

- `docs/product/P1_20251109_package-library-implementation.md`: 全体実装計画
- `docs/adr/20251109-adr-006-package-concept-redefinition.md`: パッケージ概念再定義
- `docs/adr/20251107-adr-005-notion-api-version-upgrade.md`: Notion API 2025-09-03対応
