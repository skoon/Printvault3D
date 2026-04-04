import { spawn } from 'child_process';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

function waitForPort(port, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      const req = http.get(`http://localhost:${port}`, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          setTimeout(check, 500);
        }
      });
      req.on('error', () => {
        if (Date.now() - start > timeout) {
          reject(new Error(`Timed out waiting for port ${port}`));
        } else {
          setTimeout(check, 500);
        }
      });
      req.end();
    };
    check();
  });
}

async function main() {
  console.log('Starting Vite dev server...');
  const viteEntry = path.join(rootDir, 'node_modules', 'vite', 'bin', 'vite.js');
  
  const vite = spawn('node', [viteEntry, '--port', '3000'], {
    stdio: 'inherit',
    cwd: rootDir,
  });

  vite.on('error', (err) => {
    console.error('Failed to start Vite:', err);
    process.exit(1);
  });

  try {
    await waitForPort(3000);
    console.log('Vite dev server ready, starting Electron...');

    const electronBin = path.join(rootDir, 'node_modules', 'electron', 'dist', 'electron.exe');

    const electron = spawn(electronBin, ['.'], {
      stdio: 'inherit',
      cwd: rootDir,
    });

    electron.on('error', (err) => {
      console.error('Failed to start Electron:', err);
      process.exit(1);
    });

    electron.on('exit', (code) => {
      vite.kill();
      process.exit(code ?? 0);
    });

    vite.on('exit', (code) => {
      electron.kill();
      process.exit(code ?? 0);
    });
  } catch (err) {
    console.error(err.message);
    vite.kill();
    process.exit(1);
  }
}

main();
