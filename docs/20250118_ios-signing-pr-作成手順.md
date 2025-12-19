# iOSコード署名設定修正のPR作成手順

## 概要
iOSシミュレーター向けコード署名設定の修正をGitHubにプッシュし、PRを作成します。

## 実施手順

### 1. ブランチの作成と切り替え
```bash
cd /Users/bon/dev/clevique/react-native-projects/notion-barcode-reader
git checkout -b fix/ios-signing-configuration
```

### 2. 変更内容の確認
```bash
git status
git diff ios/NotionBarcodeReader.xcodeproj/project.pbxproj
```

### 3. 変更をステージング
```bash
git add ios/NotionBarcodeReader.xcodeproj/project.pbxproj
```

### 4. コミット
```bash
git commit -m "fix: iOSシミュレーター向けコード署名設定の修正

- Debug設定にCODE_SIGN_STYLE = Automaticを追加
- Bundle IDのハイフンを削除（com.bon71.barno- → com.bon71.barno）
- Release設定でシミュレーター用に自動署名を追加
- Release設定のDEVELOPMENT_TEAMを空からV9LK8PKJ37に変更

シミュレーターでのビルドエラーを解消するため、コード署名設定を修正しました。

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 5. リモートにプッシュ
```bash
git push -u origin fix/ios-signing-configuration
```

### 6. PRの作成
GitHubのWebインターフェースでPRを作成するか、以下のコマンドでPRを作成：

```bash
gh pr create --title "fix: iOSシミュレーター向けコード署名設定の修正" --body "## 概要
iOSシミュレーターでのビルドエラーを解消するため、コード署名設定を修正しました。

## 変更内容
- Debug設定に\`CODE_SIGN_STYLE = Automatic\`を追加
- Bundle IDのハイフンを削除（\`com.bon71.barno-\` → \`com.bon71.barno\`）
- Release設定でシミュレーター用に自動署名を追加
- Release設定の\`DEVELOPMENT_TEAM\`を空から\`V9LK8PKJ37\`に変更

## 期待される動作
- シミュレーター（Debug）: 自動署名でビルド可能
- 実機配布（Release）: シミュレーターは自動署名、実機は手動署名を維持

## 関連
- 計画書: \`ios-signing-fix.plan.md\`" --base main
```

## 確認事項
- [ ] ブランチが正しく作成されたか
- [ ] 変更が正しくコミットされたか
- [ ] リモートにプッシュされたか
- [ ] PRが作成されたか
