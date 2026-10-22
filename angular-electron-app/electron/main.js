const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const http = require('http');

let mainWindow;
let backendProcess = null;

// Determine java executable: prefer bundled JRE, fallback to system PATH
function getJavaExecutablePath() {
  const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';
  const baseDir = app.isPackaged
    ? process.resourcesPath
    : path.join(__dirname, '../extraResources');

  const bundledJava = path.join(baseDir, 'jre', 'bin', process.platform === 'win32' ? 'java.exe' : 'java');
  if (fs.existsSync(bundledJava)) {
    console.log(`[Backend] Using bundled Java runtime: ${bundledJava}`);
    return bundledJava;
  }

  console.log('[Backend] Bundled JRE not found; falling back to system "java"');
  return 'java';
}

// Locate server.jar
function getServerJarPath() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'server.jar')
    : path.join(__dirname, '../extraResources/server.jar');
}

// Poll backend API until it is healthy (not fixed setTimeout)
function waitForBackendReady(maxRetries = 60, intervalMs = 500) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const check = () => {
      attempts++;
      const req = http.get('http://127.0.0.1:8080/api/dashboard', (res) => {
        // Any 2xx or 3xx status means Spring Boot HTTP listener is active
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 400) {
          console.log(`[Backend] Ready after ${attempts} attempts! (status ${res.statusCode})`);
          res.resume();
          resolve(true);
        } else {
          res.resume();
          retry();
        }
      });

      req.on('error', () => {
        retry();
      });

      req.setTimeout(400, () => {
        req.destroy();
        retry();
      });
    };

    const retry = () => {
      if (attempts >= maxRetries) {
        console.warn('[Backend] Reached max polling attempts without ready response.');
        resolve(false); // resolve anyway so UI still loads
      } else {
        setTimeout(check, intervalMs);
      }
    };

    check();
  });
}

function startBackend() {
  const jarPath = getServerJarPath();

  if (!fs.existsSync(jarPath)) {
    console.warn(`[Backend] JAR not found at ${jarPath}. Skipping backend start.`);
    return Promise.resolve(false);
  }

  const javaBin = getJavaExecutablePath();
  console.log(`[Backend] Launching backend: "${javaBin}" -jar "${jarPath}"`);

  try {
    const logPath = path.join(app.getPath('userData'), 'desktop-backend.log');
    const outLog = fs.openSync(logPath, 'a');
    const errLog = fs.openSync(logPath, 'a');

    backendProcess = spawn(javaBin, ['-jar', jarPath], {
      detached: false,
      stdio: ['ignore', outLog, errLog]
    });

    backendProcess.on('error', (err) => {
      console.error('[Backend] Failed to spawn java process:', err);
    });

    backendProcess.on('exit', (code) => {
      console.log(`[Backend] Process exited with code ${code}`);
      backendProcess = null;
    });

    // Actively poll until Spring Boot is ready
    return waitForBackendReady();
  } catch (err) {
    console.error('[Backend] Exception while starting backend:', err);
    return Promise.resolve(false);
  }
}

function stopBackend() {
  if (backendProcess && backendProcess.pid) {
    console.log(`[Backend] Terminating Spring Boot process (PID: ${backendProcess.pid})...`);
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', backendProcess.pid.toString(), '/f', '/t']);
      } else {
        backendProcess.kill('SIGTERM');
      }
    } catch (e) {
      console.error('[Backend] Error terminating backend process:', e);
    }
    backendProcess = null;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 900,
    minHeight: 600,
    title: 'Atlas Copco Desktop Suite',
    show: false, // Show once ready-to-show to prevent visual flicker
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';

  if (isDev) {
    const devUrl = 'http://localhost:4200';
    console.log(`[Electron] Loading development URL: ${devUrl}`);
    mainWindow.loadURL(devUrl);
  } else {
    // Angular application builder outputs to dist/angular-electron-app/browser/index.html
    const prodPath = path.join(__dirname, '../dist/angular-electron-app/browser/index.html');
    console.log(`[Electron] Loading production file: ${prodPath}`);
    mainWindow.loadFile(prodPath);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(async () => {
  // Start Spring Boot and poll until ready BEFORE creating window
  await startBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('will-quit', () => {
  stopBackend();
});

app.on('window-all-closed', () => {
  stopBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers for safe desktop inter-process communication
ipcMain.handle('app:get-version', () => {
  return app.getVersion();
});

ipcMain.handle('app:get-platform-info', () => {
  return {
    platform: process.platform,
    arch: process.arch,
    version: app.getVersion()
  };
});
