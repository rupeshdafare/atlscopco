const { contextBridge, ipcRenderer } = require('electron');

// Expose safe, isolated desktop API to the Angular renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  getVersion: () => ipcRenderer.invoke('app:get-version'),
  getPlatformInfo: () => ipcRenderer.invoke('app:get-platform-info')
});
