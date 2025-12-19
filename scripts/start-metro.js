#!/usr/bin/env node
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const getPort = require('get-port');

async function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const portFile = path.join(projectRoot, '.metro.port');
  const preferred = process.env.METRO_PREFERRED_PORT
    ? Number(process.env.METRO_PREFERRED_PORT)
    : 8081;

  const candidates = [preferred, ...Array.from({ length: 1000 }, (_, i) => preferred + i + 1)];
  const port = await getPort({ port: candidates });

  try {
    fs.writeFileSync(portFile, String(port), { encoding: 'utf8' });
  } catch (e) {
    // noop: 失敗しても起動に支障はない
  }

  const extraArgs = process.argv.slice(2).join(' ');
  const cmd = `npx react-native start --port ${port} ${extraArgs}`.trim();

  console.log(`[metro] starting on port ${port} (preferred ${preferred})`);
  console.log(`[metro] command: ${cmd}`);

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


