const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  setAnimeActivity: (activity) => ipcRenderer.invoke('set-anime-activity', activity),
  updateAnimeActivityTime: (progress) => ipcRenderer.invoke('update-anime-activity-time', progress),
  clearAnimeActivity: () => ipcRenderer.invoke('clear-anime-activity'),
  updates: {
    getStatus: () => ipcRenderer.invoke('updates:get-status'),
    check: () => ipcRenderer.invoke('updates:check'),
    install: () => ipcRenderer.invoke('updates:install'),
    onStatus: (callback) => {
      const listener = (_event, status) => callback(status);
      ipcRenderer.on('update-status', listener);
      return () => ipcRenderer.removeListener('update-status', listener);
    },
  },
});
