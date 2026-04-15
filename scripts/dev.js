import { spawn } from 'node:child_process';

const isWindows = process.platform === 'win32';
const npmCommand = 'npm';
const children = [];
let shuttingDown = false;

function runProcess(name, command, args, extraEnv = {}) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: isWindows,
    env: {
      ...process.env,
      ...extraEnv,
    },
  });

  child.on('exit', (code) => {
    if (!shuttingDown && code && code !== 0) {
      console.error(`[${name}] encerrado com código ${code}.`);
      shutdown(code);
    }
  });

  child.on('error', (error) => {
    console.error(`[${name}] falhou ao iniciar:`, error.message);
    shutdown(1);
  });

  children.push(child);
  return child;
}

function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of children) {
    if (child && !child.killed) {
      child.kill('SIGTERM');
    }
  }

  setTimeout(() => process.exit(exitCode), 300);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

runProcess('backend', npmCommand, ['run', 'dev:server']);
runProcess('frontend', npmCommand, ['run', 'dev:frontend']);
