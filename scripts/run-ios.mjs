#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import getPort from 'get-port';

async function readOrPickPort(projectRoot) {
  const portFile = path.join(projectRoot, '.metro.port');
  const preferred = process.env.METRO_PREFERRED_PORT
    ? Number(process.env.METRO_PREFERRED_PORT)
    : 8081;

  if (fs.existsSync(portFile)) {
    const content = fs.readFileSync(portFile, 'utf8').trim();
    const existing = Number(content);
    if (Number.isFinite(existing) && existing > 0) return existing;
  }

  const candidates = [preferred, ...Array.from({ length: 1000 }, (_, i) => preferred + i + 1)];
  const port = await getPort({ port: candidates });
  try { fs.writeFileSync(portFile, String(port), 'utf8'); } catch {}
  return port;
}

function checkAndInstallPods(projectRoot, forceInstall = false) {
  const iosDir = path.join(projectRoot, 'ios');
  const podsDir = path.join(iosDir, 'Pods');
  const podfileLock = path.join(iosDir, 'Podfile.lock');
  const buildDir = path.join(iosDir, 'build');

  // Check if Pods directory exists and Podfile.lock exists
  const podsExists = fs.existsSync(podsDir);
  const podfileLockExists = fs.existsSync(podfileLock);
  const buildExists = fs.existsSync(buildDir);

  // Run pod install if:
  // 1. Force install is requested (--clean flag)
  // 2. Pods directory doesn't exist
  // 3. Podfile.lock doesn't exist
  // 4. Build directory doesn't exist (indicates clean build)
  const shouldInstall = forceInstall || !podsExists || !podfileLockExists || !buildExists;

  if (shouldInstall) {
    const reason = forceInstall
      ? 'Force install requested (--clean flag)'
      : !podsExists
      ? 'Pods directory not found'
      : !podfileLockExists
      ? 'Podfile.lock not found'
      : 'Build directory not found (clean build detected)';

    console.log(`[ios] 💎 ${reason}, running pod install...`);

    const result = spawnSync('pod', ['install'], {
      cwd: iosDir,
      stdio: 'inherit',
      shell: true,
    });

    if (result.status !== 0) {
      console.error('[ios] ❌ pod install failed');
      process.exit(1);
    }
    console.log('[ios] ✅ pod install completed');
  } else {
    console.log('[ios] ✓ CocoaPods dependencies are up to date');
  }
}

async function main() {
  const projectRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

  // Parse arguments
  const args = process.argv.slice(2);
  const hasCleanFlag = args.includes('--clean');

  // Remove --clean from args to pass to react-native
  const filteredArgs = args.filter(arg => arg !== '--clean');

  // Check and install CocoaPods if needed before building
  // Force install if --clean flag is present
  checkAndInstallPods(projectRoot, hasCleanFlag);

  const extraArgs = filteredArgs.join(' ');
  const port = await readOrPickPort(projectRoot);

  const cmd = `npx react-native run-ios --port ${port} ${extraArgs}`.trim();
  console.log(`[ios] using Metro port ${port}`);
  console.log(`[ios] command: ${cmd}`);

  const child = spawn(cmd, {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, RCT_METRO_PORT: String(port) },
    cwd: projectRoot,
  });

  child.on('exit', (code) => process.exit(code ?? 0));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


