import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import RPC from 'discord-rpc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

let rpc;
let mainWindow;
let autoUpdater;
let updateStatus = {
  status: 'idle',
  message: 'Updater is waiting to check for releases.',
  progress: 0,
};

function sendUpdateStatus(nextStatus) {
  updateStatus = { ...updateStatus, ...nextStatus };
  const windows = BrowserWindow.getAllWindows();
  for (const window of windows) {
    window.webContents.send('update-status', updateStatus);
  }
}

function initDiscord() {
  try {
    const clientId = '1510920317143613470';
    rpc = new RPC.Client({ transport: 'ipc' });
    rpc.login({ clientId }).catch((err) => {
      console.warn('Discord RPC login failed:', err.message);
    });
  } catch (e) {
    console.warn('Discord RPC unavailable:', e.message);
  }
}

function initAutoUpdater() {
  if (!app.isPackaged) {
    sendUpdateStatus({
      status: 'disabled',
      message: 'Auto updates are enabled in packaged release builds.',
      progress: 0,
    });
    return;
  }

  try {
    ({ autoUpdater } = require('electron-updater'));
  } catch (error) {
    console.warn('electron-updater is not installed:', error.message);
    sendUpdateStatus({
      status: 'error',
      message: 'Auto updater dependency is missing. Run npm install before packaging.',
      progress: 0,
    });
    return;
  }

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowPrerelease = false;
  autoUpdater.logger = console;

  autoUpdater.on('checking-for-update', () => {
    sendUpdateStatus({
      status: 'checking',
      message: 'Checking GitHub Releases for a fresh AnimeVault build...',
      progress: 0,
    });
  });

  autoUpdater.on('update-available', (info) => {
    sendUpdateStatus({
      status: 'available',
      message: `Version ${info.version} is available. Downloading it in the background...`,
      version: info.version,
      progress: 0,
    });
  });

  autoUpdater.on('update-not-available', () => {
    sendUpdateStatus({
      status: 'current',
      message: 'You are running the newest AnimeVault release.',
      progress: 100,
    });
  });

  autoUpdater.on('download-progress', (progress) => {
    sendUpdateStatus({
      status: 'downloading',
      message: `Downloading update at ${Math.round(progress.percent)}%...`,
      progress: Math.round(progress.percent),
      bytesPerSecond: progress.bytesPerSecond,
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    sendUpdateStatus({
      status: 'ready',
      message: `Version ${info.version} is ready. Restart AnimeVault to switch over instantly.`,
      version: info.version,
      progress: 100,
    });
  });

  autoUpdater.on('error', (error) => {
    console.error('Auto updater error:', error);
    sendUpdateStatus({
      status: 'error',
      message: error?.message || 'AnimeVault could not reach the release server.',
      progress: 0,
    });
  });
}

function checkForUpdates() {
  if (!autoUpdater) return updateStatus;

  autoUpdater.checkForUpdates().catch((error) => {
    console.error('Manual update check failed:', error);
    sendUpdateStatus({
      status: 'error',
      message: error?.message || 'Manual update check failed.',
      progress: 0,
    });
  });

  return updateStatus;
}

function installUpdateNow() {
  if (!autoUpdater) return false;
  autoUpdater.quitAndInstall(false, true);
  return true;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow = win;

  if (app.isPackaged) {
    // ── Production (packaged .exe / .dmg) ──
    // electron-builder puts our files at <app>/resources/app/
    // so dist/ is at <app>/resources/app/dist/index.html
    // which is the same as path.join(__dirname, '..', 'dist', 'index.html')
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
    console.log('[Electron] Loading production UI from:', indexPath);
    win.loadFile(indexPath);
  } else {
    // ── Development ──
    const devUrl = 'http://localhost:5173/';
    console.log('[Electron] Loading dev server:', devUrl);
    win.loadURL(devUrl);
    win.webContents.openDevTools();
  }

  win.webContents.once('did-finish-load', () => {
    sendUpdateStatus(updateStatus);
    if (app.isPackaged) checkForUpdates();
  });
}

ipcMain.handle('set-anime-activity', async (_, activity) => {
  if (!rpc) return;
  const { title, episode, coverUrl, url } = activity;
  try {
    await rpc.setActivity({
      details: `Watching ${title}`,
      state: episode ? `Episode ${episode}` : 'Movie',
      largeImageKey: coverUrl || 'anime_vault',
      largeImageText: title,
      startTimestamp: Date.now(),
      buttons: url ? [{ label: 'View Details', url }] : [],
    });
  } catch (err) {
    console.error('Discord RPC setActivity error:', err);
  }
});

ipcMain.handle('clear-anime-activity', () => {
  if (rpc) rpc.clearActivity();
});

ipcMain.handle('updates:get-status', () => updateStatus);
ipcMain.handle('updates:check', () => checkForUpdates());
ipcMain.handle('updates:install', () => installUpdateNow());

app.whenReady().then(() => {
  initDiscord();
  initAutoUpdater();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  mainWindow = null;
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
