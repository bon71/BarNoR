#!/bin/bash

# iOS App Transport Security設定スクリプト
# ビルド時に自動的にATS設定を切り替える
# Releaseビルド時はNSAllowsArbitraryLoadsをfalseに設定

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
INFO_PLIST="$PROJECT_ROOT/ios/NotionBarcodeReader/Info.plist"

# ビルド設定を確認（環境変数から取得、デフォルトはDebug）
BUILD_CONFIGURATION="${CONFIGURATION:-Debug}"

echo "🔒 Configuring App Transport Security for: $BUILD_CONFIGURATION"

if [ "$BUILD_CONFIGURATION" = "Release" ]; then
  echo "📦 Release build detected - Setting NSAllowsArbitraryLoads to false"

  # plutilを使用してNSAllowsArbitraryLoadsをfalseに設定
  # macOSにplutilがインストールされていることを前提とする
  if command -v plutil &> /dev/null; then
    plutil -replace NSAppTransportSecurity.NSAllowsArbitraryLoads -bool false "$INFO_PLIST"
    echo "✅ NSAllowsArbitraryLoads set to false"
  else
    echo "⚠️  plutil not found. Please install Xcode Command Line Tools."
    echo "   Run: xcode-select --install"
    exit 1
  fi
else
  echo "🔧 Debug build detected - Keeping NSAllowsArbitraryLoads as true"
  # DebugビルドではNSAllowsArbitraryLoadsをtrueのままにする
  if command -v plutil &> /dev/null; then
    plutil -replace NSAppTransportSecurity.NSAllowsArbitraryLoads -bool true "$INFO_PLIST"
    echo "✅ NSAllowsArbitraryLoads set to true"
  fi
fi

echo "✅ ATS configuration completed"

