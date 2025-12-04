const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ollama', {
  call: (p, b) => ipcRenderer.invoke('ollama:call', { path: p, body: b }),
});
