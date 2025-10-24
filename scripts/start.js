#!/usr/bin/env node
/**
 * Unified startup script for OCR-harness
 * Starts frontend, backend, and vLLM server with one command
 */

const { spawn } = require('child_process');
const path = require('path');

const processes = [];
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(service, message, color = colors.reset) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${color}[${timestamp}] [${service}]${colors.reset} ${message}`);
}

function startService(name, command, args, cwd, color) {
  log(name, `Starting ${name}...`, colors.bright + color);

  const proc = spawn(command, args, {
    cwd: path.join(__dirname, '..', cwd),
    stdio: 'inherit',
    shell: true
  });

  proc.on('error', (err) => {
    log(name, `Error: ${err.message}`, colors.red);
  });

  proc.on('exit', (code, signal) => {
    if (code !== null && code !== 0) {
      log(name, `Exited with code ${code}`, colors.red);
    } else if (signal) {
      log(name, `Killed with signal ${signal}`, colors.yellow);
    } else {
      log(name, 'Stopped', colors.yellow);
    }
  });

  processes.push({ name, proc });
  return proc;
}

function cleanup() {
  console.log('\n' + colors.yellow + 'Shutting down all services...' + colors.reset);

  processes.forEach(({ name, proc }) => {
    try {
      log(name, 'Stopping...', colors.yellow);
      proc.kill('SIGTERM');
    } catch (err) {
      log(name, `Error stopping: ${err.message}`, colors.red);
    }
  });

  setTimeout(() => {
    processes.forEach(({ name, proc }) => {
      try {
        proc.kill('SIGKILL');
      } catch (err) {
        // Process might already be dead
      }
    });
    process.exit(0);
  }, 5000);
}

// Handle shutdown signals
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Main startup sequence
async function main() {
  console.log(colors.bright + colors.cyan + '='.repeat(60));
  console.log('  OCR-harness Startup');
  console.log('='.repeat(60) + colors.reset + '\n');

  // Check if vLLM should be started (it takes a while)
  const skipVLLM = process.argv.includes('--skip-vllm');

  if (!skipVLLM) {
    log('VLLM', 'Starting vLLM server (this may take a few minutes)...', colors.magenta);
    log('INFO', 'Tip: Use --skip-vllm flag to skip vLLM startup for development', colors.yellow);

    startService(
      'VLLM',
      'python',
      ['start_vllm.py'],
      'backend',
      colors.magenta
    );

    // Wait for vLLM to initialize
    log('INFO', 'Waiting 10 seconds for vLLM to initialize...', colors.yellow);
    await new Promise(resolve => setTimeout(resolve, 10000));
  }

  // Start backend
  startService(
    'Backend',
    'uvicorn',
    ['app.main:app', '--reload', '--port', '8000'],
    'backend',
    colors.green
  );

  // Wait a bit for backend to start
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Start frontend
  startService(
    'Frontend',
    'npm',
    ['run', 'dev'],
    'frontend',
    colors.blue
  );

  console.log('\n' + colors.bright + colors.green + '='.repeat(60));
  console.log('  All services started successfully!');
  console.log('='.repeat(60) + colors.reset);
  console.log('\n' + colors.cyan + 'Access points:');
  console.log('  Frontend:  http://localhost:3000');
  console.log('  Backend:   http://localhost:8000');
  console.log('  API Docs:  http://localhost:8000/docs');
  if (!skipVLLM) {
    console.log('  vLLM:      http://localhost:8001');
  }
  console.log('\nPress Ctrl+C to stop all services.' + colors.reset + '\n');
}

main().catch(err => {
  console.error(colors.red + 'Startup failed:', err.message + colors.reset);
  cleanup();
});
