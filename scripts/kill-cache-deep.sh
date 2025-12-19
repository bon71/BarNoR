#!/bin/bash

# Complete cache clearing script for NotionBarcodeReader project
# This script performs deep cache cleaning including Metro, watchman, iOS build cache

set -e

echo "🧹 Starting complete cache clear..."

# Get project root directory (parent of scripts directory)
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

# 1. Kill Metro bundler processes
echo "📱 Killing Metro bundler processes..."
pkill -f "react-native/cli" || true
pkill -f "metro" || true

# 2. Clear watchman cache
echo "👁️  Clearing watchman cache..."
watchman watch-del-all 2>/dev/null || echo "⚠️  watchman not available (skipping)"

# 3. Clear Metro temporary files
echo "🗑️  Clearing Metro temporary files..."
rm -rf $TMPDIR/metro-* 2>/dev/null || true
rm -rf $TMPDIR/haste-* 2>/dev/null || true
rm -rf $TMPDIR/react-* 2>/dev/null || true

# 4. Clear node_modules cache (optional, only if needed)
# Uncomment the following lines if you want to reinstall node_modules
# echo "📦 Clearing node_modules..."
# rm -rf node_modules
# npm install --legacy-peer-deps

# 5. Clear iOS build cache
echo "🍎 Clearing iOS build cache..."
rm -rf ios/build

# 6. Reinstall CocoaPods
echo "💎 Reinstalling CocoaPods..."
cd ios
bundle exec pod install --repo-update
cd ..

echo ""
echo "✅ Complete cache clear finished!"
echo ""
echo "Next steps:"
echo "  1. Run: npm start -- --reset-cache"
echo "  2. In another terminal: npm run ios"
echo ""
