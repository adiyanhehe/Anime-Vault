import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import RPC from 'discord-rpc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let rpc;

function initDiscord() {
  const clientId = '1510920317143613470';
  rpc = new RPC.Client({ transport: 'ipc' });
  rpc.login({ clientId }).catch(console.error);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load:', validatedURL, errorDescription, errorCode);
    win.loadURL('data:text/html;charset=utf-8,<h2 style="color:red;">Failed to load UI. Please reinstall.</h2>');
  });

  const isPackaged = app.isPackaged;
  if (isPackaged) {
    win.loadFile(path.join(process.resourcesPath, 'app', 'dist', 'index.html'));
  } else {
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      win.loadURL('http://localhost:5173/');
      win.webContents.openDevTools();
    } else {
      win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
    }
  }
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

app.whenReady().then(() => {
  initDiscord();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
