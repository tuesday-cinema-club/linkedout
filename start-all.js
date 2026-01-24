/**
 * Cross-platform script to start both frontend and backend servers
 * Works on Windows, Mac, and Linux
 */

import { spawn } from 'child_process';
import { platform } from 'os';

const isWindows = platform() === 'win32';

console.log('Starting LinkedIn Cybersecurity Bot...\n');

// Start backend proxy server
console.log('🚀 Starting backend proxy server on port 4000...');
const proxyProcess = spawn('node', ['server.js'], {
  stdio: 'inherit',
  shell: isWindows
});

// Wait a moment for proxy to start, then start frontend
setTimeout(() => {
  console.log('🎨 Starting frontend on port 3000...\n');
  const frontendProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: isWindows
  });

  // Handle graceful shutdown
  const cleanup = () => {
    console.log('\n\nShutting down...');
    proxyProcess.kill();
    frontendProcess.kill();
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', cleanup);

  frontendProcess.on('error', (err) => {
    console.error('Frontend error:', err);
  });

  frontendProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Frontend exited with code ${code}`);
      cleanup();
    }
  });
}, 1000);

proxyProcess.on('error', (err) => {
  console.error('Proxy server error:', err);
  process.exit(1);
});

proxyProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`Proxy server exited with code ${code}`);
    process.exit(1);
  }
});

console.log('\n✅ Both servers starting...');
console.log('📱 Frontend will be available at: http://localhost:3000');
console.log('🔌 Backend API available at: http://localhost:4000');
console.log('\nPress Ctrl+C to stop both servers.\n');
