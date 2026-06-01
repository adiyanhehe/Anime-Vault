const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  setAnimeActivity: (activity) => ipcRenderer.invoke('set-anime-activity', activity),
  clearAnimeActivity: () => ipcRenderer.invoke('clear-anime-activity'),
});
