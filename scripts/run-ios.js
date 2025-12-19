#!/usr/bin/env node
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const getPort = require('get-port');

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

  // 8081 が空いていればそのまま、埋まっていれば自動で別ポート
  const candidates = [preferred, ...Array.from({ length: 1000 }, (_, i) => preferred + i + 1)];
  const port = await getPort({ port: candidates });
  try { fs.writeFileSync(portFile, String(port), 'utf8'); } catch {}
  return port;
}

async function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const extraArgs = process.argv.slice(2).join(' ');
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


