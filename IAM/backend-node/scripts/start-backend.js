const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

require('../config/module-paths');
require('dotenv').config();

function log(message) {
  console.log(`[start-backend] ${message}`);
}

function getTargetPort() {
  const raw = process.env.PORT;
  const parsed = parseInt(raw, 10);
  if (Number.isInteger(parsed) && parsed > 0) return parsed;
  return 8082;
}

function extractLocalPort(localAddress) {
  if (!localAddress) return null;
  const idx = localAddress.lastIndexOf(':');
  if (idx === -1) return null;
  const value = parseInt(localAddress.slice(idx + 1), 10);
  return Number.isInteger(value) ? value : null;
}

function getWindowsPidsByPort(port) {
  let output = '';
  try {
    output = execSync('netstat -ano -p tcp', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    });
  } catch (error) {
    log(`Port inspection skipped: ${error && error.message ? error.message : error}`);
    return [];
  }

  const pids = new Set();
  const lines = output.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || !trimmed.startsWith('TCP')) continue;

    const parts = trimmed.split(/\s+/);
    if (parts.length < 5) continue;

    const localAddress = parts[1];
    const pidRaw = parts[4];
    const localPort = extractLocalPort(localAddress);
    if (localPort !== port) continue;

    const pid = parseInt(pidRaw, 10);
    if (Number.isInteger(pid) && pid > 0 && pid !== process.pid) {
      pids.add(pid);
    }
  }

  return Array.from(pids);
}

function killWindowsPid(pid) {
  try {
    log(`Killing PID ${pid} on target port`);
    execSync(`taskkill /PID ${pid} /F /T`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
    return true;
  } catch (error) {
    log(`PID ${pid} kill failed or already exited`);
    return false;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitUntilPortFree(port, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const pids = getWindowsPidsByPort(port);
    if (pids.length === 0) {
      return true;
    }
    log(`Waiting for port ${port} release. Still occupied by PID(s): ${pids.join(', ')}`);
    await sleep(500);
  }
  return false;
}

function resolveNodemonCommand(projectRoot) {
  const isWin = process.platform === 'win32';
  const runtimeRoot = path.join(projectRoot, '.runtime-packages');
  const useNodemon = process.env.USE_NODEMON === '1';

  if (!useNodemon) {
    return {
      command: 'node',
      args: ['server.js'],
      shell: false
    };
  }

  const runtimeNodemon = isWin
    ? path.join(runtimeRoot, 'node_modules', '.bin', 'nodemon.cmd')
    : path.join(runtimeRoot, 'node_modules', '.bin', 'nodemon');

  if (fs.existsSync(runtimeNodemon)) {
    return {
      command: runtimeNodemon,
      args: ['server.js'],
      shell: false
    };
  }

  if (isWin) {
    const localNodemon = path.join(projectRoot, 'node_modules', '.bin', 'nodemon.cmd');
    if (fs.existsSync(localNodemon)) {
      return { command: localNodemon, args: ['server.js'], shell: false };
    }

    return {
      command: 'node',
      args: ['server.js'],
      shell: false
    };
  }

  const cmd = isWin
    ? path.join(projectRoot, 'node_modules', '.bin', 'nodemon.cmd')
    : path.join(projectRoot, 'node_modules', '.bin', 'nodemon');

  if (fs.existsSync(cmd)) {
    return { command: cmd, args: ['server.js'], shell: false };
  }

  return {
    command: 'node',
    args: ['server.js'],
    shell: false
  };
}

function startNodemon(projectRoot) {
  const runner = resolveNodemonCommand(projectRoot);
  log(`Starting nodemon (${runner.command})`);

  const child = spawn(runner.command, runner.args, {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: runner.shell,
    env: process.env
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code || 0);
  });

  process.on('SIGINT', () => {
    if (!child.killed) child.kill('SIGINT');
  });
  process.on('SIGTERM', () => {
    if (!child.killed) child.kill('SIGTERM');
  });
}

async function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const port = getTargetPort();

  log(`Checking port ${port}`);

  if (process.platform !== 'win32') {
    log('Non-Windows platform detected. Skipping Windows port cleanup logic.');
    startNodemon(projectRoot);
    return;
  }

  const pids = getWindowsPidsByPort(port);
  if (pids.length === 0) {
    log(`No process is currently using port ${port}`);
  } else {
    log(`Port ${port} is in use by PID(s): ${pids.join(', ')}`);
    for (const pid of pids) {
      killWindowsPid(pid);
    }

    const released = await waitUntilPortFree(port, 15000);
    if (!released) {
      const remaining = getWindowsPidsByPort(port);
      log(`Port ${port} is still occupied after timeout. PID(s): ${remaining.join(', ') || 'unknown'}`);
      process.exit(1);
      return;
    }
  }

  log(`Port ${port} is free. Starting backend...`);
  startNodemon(projectRoot);
}

main().catch((error) => {
  log(`Launcher failed: ${error && error.message ? error.message : error}`);
  process.exit(1);
});
