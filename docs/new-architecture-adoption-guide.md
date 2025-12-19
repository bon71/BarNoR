# React Native New Architecture 採用判断ガイド

本ガイドは、React Native 0.83.0でNew Architectureを採用しようとして得られた教訓をまとめたものです。

## 🚨 今回発生した主な問題

- **@react-navigation/bottom-tabs**: `setSheetExpandsWhenScrolledToEdge` unrecognized selector
- **react-native-safe-area-context**: SafeAreaProvider crashes
- **@react-native-community/blur**: Codegen errors
- **react-native-scanner**: TSTypeReference codegen incompatibility

## 📋 New Architecture採用前のチェックリスト

### 1. React Native公式の状況を確認

- [ ] React Native公式ブログでNew Architectureが「Stable」と明記されているか
- [ ] 公式ドキュメントで「Production Ready」と記載されているか
- [ ] リリースノートで既知の問題が少ないか

### 2. 依存ライブラリの対応状況を確認

- [ ] **React Navigation**: 公式でNew Architecture対応が完了しているか
- [ ] **react-native-safe-area-context**: New Architecture対応版がリリースされているか
- [ ] **その他の主要ライブラリ**: READMEやChangelogでFabric/TurboModules対応が明記されているか

### 3. コミュニティの状況を確認

- [ ] **GitHub Issues**: New Architecture関連のissueが減少傾向か
- [ ] **Stack Overflow/Reddit**: 成功事例の報告が増えているか
- [ ] **Discord/Twitter**: 大手企業やOSSプロジェクトが採用を発表しているか

## 🔍 監視すべき情報源

1. **React Native公式ブログ**: https://reactnative.dev/blog
2. **React Native New Architecture Working Group**: https://github.com/reactwg/react-native-new-architecture
3. **React Navigation Issues**: https://github.com/react-navigation/react-navigation/issues
4. **React Native Community Discord**

## ✅ 採用OK のサイン

- React Native 0.76以降で「New Architecture is now stable」と明記
- React Navigation 7.x が公式に「Fully compatible with New Architecture」と発表
- 主要ライブラリの80%以上がNew Architecture対応を完了
- 大手企業（Meta、Shopify、Microsoft等）がProduction採用を公表

## ❌ 採用NG のサイン

- React Navigationの最新版でNew Architecture関連のissueが多数open
- 主要ライブラリがまだ「Experimental」「Beta」ラベル
- Stack Overflowで「unrecognized selector」等のエラー報告が頻発
- React Native公式で「Not recommended for production」の記載

## 🎯 推奨される採用戦略

1. **Phase 1: 監視期（現在）** - React Native 0.77-0.80のリリースを待つ
2. **Phase 2: 検証期** - 別ブランチで小規模テスト（画面1-2個のみ）
3. **Phase 3: 段階導入** - 本番環境で一部機能のみNew Architectureを有効化
4. **Phase 4: 完全移行** - 全機能でNew Architectureを有効化

## ⏱️ 現実的な採用時期の見積もり

- **2025年後半～2026年初頭**: React Native 0.77-0.80でStable化の可能性
- **React Navigation 8.x**: New Architecture完全対応版のリリース
- **主要ライブラリの対応完了**: 2025年中に80%が対応完了予想

## 💡 結論

**2025年12月時点では、New Architectureはまだ本番採用すべきではない。React Native 0.77以降のリリースとReact Navigation 8.xのリリースを待つべき。**

---

## 参考リンク

- [React Native New Architecture Documentation](https://reactnative.dev/docs/new-architecture-intro)
- [React Navigation Compatibility](https://reactnavigation.org/docs/react-native-screens/)
- [Working Group Discussions](https://github.com/reactwg/react-native-new-architecture/discussions)
