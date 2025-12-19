#!/usr/bin/env node
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import getPort from 'get-port';

async function main() {
  const projectRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
  const portFile = path.join(projectRoot, '.metro.port');
  const preferred = process.env.METRO_PREFERRED_PORT
    ? Number(process.env.METRO_PREFERRED_PORT)
    : 8081;

  const candidates = [preferred, ...Array.from({ length: 1000 }, (_, i) => preferred + i + 1)];
  const port = await getPort({ port: candidates });

  try {
    fs.writeFileSync(portFile, String(port), { encoding: 'utf8' });
  } catch {}

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


