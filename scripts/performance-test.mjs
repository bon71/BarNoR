#!/usr/bin/env node

/**
 * パフォーマンステストスクリプト
 *
 * アプリケーションのパフォーマンスメトリクスを測定します：
 * - TypeScriptビルド時間
 * - テスト実行時間
 * - バンドルサイズ
 * - 依存関係の数
 */

import {execSync} from 'child_process';
import {readFileSync, statSync, readdirSync} from 'fs';
import {join, dirname} from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('📊 パフォーマンステスト開始\n');

// ===== 1. TypeScriptビルド時間測定 =====
console.log('⏱️  TypeScriptビルド時間を測定中...');
const tscStartTime = Date.now();
try {
  execSync('npx tsc --noEmit', {cwd: rootDir, stdio: 'pipe'});
  const tscDuration = Date.now() - tscStartTime;
  console.log(`✅ TypeScriptビルド: ${tscDuration}ms`);
} catch (error) {
  const tscDuration = Date.now() - tscStartTime;
  console.log(`⚠️  TypeScriptビルド (エラー有): ${tscDuration}ms`);
}

// ===== 2. テスト実行時間測定 =====
console.log('\n⏱️  テスト実行時間を測定中...');
const testStartTime = Date.now();
try {
  execSync('npm test -- --coverage --silent', {cwd: rootDir, stdio: 'pipe'});
  const testDuration = Date.now() - testStartTime;
  console.log(`✅ テスト実行: ${testDuration}ms`);
} catch (error) {
  const testDuration = Date.now() - testStartTime;
  console.log(`⚠️  テスト実行 (一部失敗): ${testDuration}ms`);
}

// ===== 3. バンドルサイズ推定 =====
console.log('\n📦 バンドルサイズを推定中...');

function getDirectorySize(dirPath) {
  let totalSize = 0;
  const files = readdirSync(dirPath, {withFileTypes: true});

  for (const file of files) {
    const fullPath = join(dirPath, file.name);
    if (file.isDirectory()) {
      totalSize += getDirectorySize(fullPath);
    } else {
      totalSize += statSync(fullPath).size;
    }
  }

  return totalSize;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}

const srcSize = getDirectorySize(join(rootDir, 'src'));
console.log(`📁 ソースコードサイズ: ${formatBytes(srcSize)}`);

// ===== 4. 依存関係分析 =====
console.log('\n📚 依存関係を分析中...');
const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf-8'));
const depsCount = Object.keys(packageJson.dependencies || {}).length;
const devDepsCount = Object.keys(packageJson.devDependencies || {}).length;
console.log(`📦 本番依存関係: ${depsCount}個`);
console.log(`🔧 開発依存関係: ${devDepsCount}個`);

// ===== 5. ファイル数カウント =====
console.log('\n📄 ファイル数をカウント中...');

function countFiles(dirPath, extensions = []) {
  let count = 0;
  const files = readdirSync(dirPath, {withFileTypes: true});

  for (const file of files) {
    const fullPath = join(dirPath, file.name);
    if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
      count += countFiles(fullPath, extensions);
    } else if (file.isFile()) {
      if (extensions.length === 0 || extensions.some(ext => file.name.endsWith(ext))) {
        count++;
      }
    }
  }

  return count;
}

const tsFiles = countFiles(join(rootDir, 'src'), ['.ts', '.tsx']);
const testFiles = countFiles(join(rootDir, 'src'), ['.test.ts', '.test.tsx']);
console.log(`📝 TypeScriptファイル数: ${tsFiles}個`);
console.log(`🧪 テストファイル数: ${testFiles}個`);

// ===== 6. テストカバレッジ読み込み =====
console.log('\n📊 テストカバレッジを確認中...');
try {
  const coverageData = JSON.parse(
    readFileSync(join(rootDir, 'coverage', 'coverage-summary.json'), 'utf-8')
  );
  const totalCoverage = coverageData.total;

  console.log(`📈 カバレッジ統計:`);
  console.log(`  - ステートメント: ${totalCoverage.statements.pct}%`);
  console.log(`  - ブランチ: ${totalCoverage.branches.pct}%`);
  console.log(`  - 関数: ${totalCoverage.functions.pct}%`);
  console.log(`  - 行: ${totalCoverage.lines.pct}%`);
} catch (error) {
  console.log('⚠️  カバレッジデータが見つかりません');
}

// ===== サマリー出力 =====
console.log('\n' + '='.repeat(60));
console.log('📊 パフォーマンステスト完了');
console.log('='.repeat(60));
