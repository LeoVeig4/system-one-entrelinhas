import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const root = fileURLToPath(new URL('../', import.meta.url));

export function runPython(args) {
  const executable = path.join(root, '.venv', process.platform === 'win32' ? 'Scripts' : 'bin', process.platform === 'win32' ? 'python.exe' : 'python');
  if (!existsSync(executable)) {
    console.error('Ambiente Python ausente. Execute uv sync na raiz e tente novamente.');
    process.exitCode = 1;
    return;
  }
  const pythonPath = [path.join(root, 'backend'), process.env.PYTHONPATH].filter(Boolean).join(path.delimiter);
  const child = spawn(executable, ['-X', 'utf8', ...args], {
    cwd: root,
    env: { ...process.env, PYTHONPATH: pythonPath },
    stdio: 'inherit',
  });
  child.on('error', error => { console.error(error.message); process.exitCode = 1; });
  child.on('exit', code => { process.exitCode = code ?? 0; });
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => { if (child.exitCode === null) child.kill(signal); });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runPython(process.argv.slice(2));
}
