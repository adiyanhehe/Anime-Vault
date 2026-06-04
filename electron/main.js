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
let updateCheckInterval;
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

  // Configure updater for all platforms
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowPrerelease = false;
  autoUpdater.logger = console;
  autoUpdater.requestHeaders = {
    'User-Agent': 'AnimeVault/AutoUpdater',
  };
  
  // Platform-specific configuration
  if (process.platform === 'win32') {
    autoUpdater.allowDowngrade = false;
  } else if (process.platform === 'darwin') {
    autoUpdater.allowDowngrade = false;
  } else if (process.platform === 'linux') {
    autoUpdater.allowDowngrade = false;
  }

  autoUpdater.on('checking-for-update', () => {
    console.log('[AutoUpdater] Checking for updates...');
    sendUpdateStatus({
      status: 'checking',
      message: 'Checking GitHub Releases for a fresh AnimeVault build...',
      progress: 0,
    });
  });

  autoUpdater.on('update-available', (info) => {
    console.log('[AutoUpdater] Update available:', info.version);
    const platform = process.platform;
    console.log('[AutoUpdater] Platform:', platform, 'Version:', info.version);
    sendUpdateStatus({
      status: 'available',
      message: `Version ${info.version} is available. Downloading in the background...`,
      version: info.version,
      progress: 0,
    });
  });

  autoUpdater.on('update-not-available', () => {
    console.log('[AutoUpdater] Already on latest version');
    sendUpdateStatus({
      status: 'current',
      message: 'You are running the newest AnimeVault release.',
      progress: 100,
    });
  });

  autoUpdater.on('download-progress', (progressInfo) => {
    console.log('[AutoUpdater] Download progress:', Math.round(progressInfo.percent) + '%');
    sendUpdateStatus({
      status: 'downloading',
      message: `Downloading update at ${Math.round(progressInfo.percent)}%...`,
      progress: Math.round(progressInfo.percent),
      bytesPerSecond: progressInfo.bytesPerSecond,
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('[AutoUpdater] Update downloaded, ready to install:', info.version);
    sendUpdateStatus({
      status: 'ready',
      message: `Version ${info.version} is ready. Restart AnimeVault to install instantly.`,
      version: info.version,
      progress: 100,
    });
  });

  autoUpdater.on('error', (error) => {
    console.error('[AutoUpdater] Error:', error);
    const errorMsg = error?.message || error?.toString() || 'AnimeVault could not reach the release server.';
    
    // ✅ IMPROVED ERROR HANDLING FOR 404 AND NETWORK ISSUES
    if (errorMsg.includes('404') || errorMsg.includes('Not Found')) {
      console.warn('[AutoUpdater] 404 Error - Build not available for this platform');
      sendUpdateStatus({
        status: 'error',
        message: `⚠️ Build unavailable for ${process.platform}. This is normal for pre-release versions. Check releases: https://github.com/adiyanhehe/Anime-Vault/releases`,
        progress: 0,
      });
    } else if (errorMsg.includes('ENOTFOUND') || errorMsg.includes('ECONNREFUSED') || errorMsg.includes('Network')) {
      console.warn('[AutoUpdater] Network error - No internet connection or DNS failure');
      sendUpdateStatus({
        status: 'error',
        message: '🌐 Network error: Cannot reach GitHub. Check your internet connection.',
        progress: 0,
      });
    } else if (errorMsg.includes('ETIMEDOUT')) {
      console.warn('[AutoUpdater] Connection timeout');
      sendUpdateStatus({
        status: 'error',
        message: '⏱️ Connection timeout: GitHub took too long to respond. Try again later.',
        progress: 0,
      });
    } else {
      sendUpdateStatus({
        status: 'error',
        message: `Update check failed: ${errorMsg.substring(0, 100)}`,
        progress: 0,
      });
    }
  });
}

function checkForUpdates() {
  if (!autoUpdater) return updateStatus;

  console.log('[AutoUpdater] User triggered manual check');
  autoUpdater.checkForUpdates().catch((error) => {
    console.error('[AutoUpdater] Manual check failed:', error);
    const errorMsg = error?.message || error?.toString() || 'Manual update check failed.';
    
    // Same error handling as above
    if (errorMsg.includes('404')) {
      sendUpdateStatus({
        status: 'error',
        message: '⚠️ Build not available for your platform yet.',
        progress: 0,
      });
    } else {
      sendUpdateStatus({
        status: 'error',
        message: errorMsg.substring(0, 150),
        progress: 0,
      });
    }
  });

  return updateStatus;
}

function installUpdateNow() {
  if (!autoUpdater) return false;
  console.log('[AutoUpdater] User clicked "Install Now", installing and quitting...');
  autoUpdater.quitAndInstall(false, true);
  return true;
}

function setupPeriodicUpdateCheck() {
  // Check for updates every 1 hour (3600000ms)
  // Only in packaged app mode
  if (!app.isPackaged || !autoUpdater) return;

  console.log('[AutoUpdater] Setting up periodic check (every 1 hour)');
  updateCheckInterval = setInterval(() => {
    console.log('[AutoUpdater] Periodic check triggered');
    autoUpdater.checkForUpdates().catch((error) => {
      console.warn('[AutoUpdater] Periodic check failed silently:', error.message);
      // Don't spam user with errors on periodic checks - only log
    });
  }, 3600000); // 1 hour
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
    console.log('[Electron] Window loaded, sending current update status');
    sendUpdateStatus(updateStatus);
    
    // Check for updates immediately when app launches
    if (app.isPackaged) {
      console.log('[Electron] App is packaged, checking for updates...');
      checkForUpdates();
    }
  });
}

let currentAnimeActivity = null;

ipcMain.handle('set-anime-activity', async (_, activity) => {
  if (!rpc) return;
  const { title, episode, coverUrl, url } = activity;
  
  currentAnimeActivity = {
    details: `Watching ${title}`,
    state: episode ? `Episode ${episode}` : 'Movie',
    largeImageKey: coverUrl || 'anime_vault',
    largeImageText: title,
    buttons: url ? [{ label: 'View Details', url }] : [],
    startTimestamp: Date.now(),
  };

  try {
    await rpc.setActivity(currentAnimeActivity);
  } catch (err) {
    console.error('Discord RPC setActivity error:', err);
  }
});

ipcMain.handle('update-anime-activity-time', async (_, { currentTime, duration }) => {
  if (!rpc || !currentAnimeActivity || !duration) return;
  
  try {
    const startTimestamp = Date.now() - (currentTime * 1000);
    const endTimestamp = startTimestamp + (duration * 1000);
    
    await rpc.setActivity({
      ...currentAnimeActivity,
      startTimestamp,
      endTimestamp,
    });
  } catch (err) {
    console.error('Discord RPC update time error:', err);
  }
});

ipcMain.handle('clear-anime-activity', () => {
  if (rpc) rpc.clearActivity();
});

ipcMain.handle('updates:get-status', () => updateStatus);
ipcMain.handle('updates:check', () => checkForUpdates());
ipcMain.handle('updates:install', () => installUpdateNow());

app.whenReady().then(() => {
  console.log('[Electron] App ready, initializing...');
  initDiscord();
  initAutoUpdater();
  setupPeriodicUpdateCheck();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  mainWindow = null;
  if (updateCheckInterval) clearInterval(updateCheckInterval);
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
