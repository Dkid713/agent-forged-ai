const fs = require('fs');
const path = require('path');
const { app, BrowserWindow, ipcMain } = require('electron');

app.setName('CruxAGI Desktop');
const base = path.join(process.env.LOCALAPPDATA || app.getPath('userData'), 'CruxAGIDesktop');
const userDataPath = path.join(base, 'User Data');
const cachePath = path.join(base, 'Cache');
fs.mkdirSync(userDataPath, { recursive: true });
fs.mkdirSync(cachePath, { recursive: true });
app.setPath('userData', userDataPath);
app.setPath('cache', cachePath);
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');

const createWindow = () => {
  const ico = path.join(__dirname, 'assets', 'icon.ico');
  const png = path.join(__dirname, 'assets', 'icon.png');
  const winOpts = {
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  };

  if (fs.existsSync(ico)) winOpts.icon = ico; else if (fs.existsSync(png)) winOpts.icon = png;
  const win = new BrowserWindow(winOpts);
  win.loadFile(path.join(__dirname, 'index.html'));
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
ipcMain.handle('ollama:call', async (_event, { path: reqPath, body }) => {
  const response = await fetch(`http://127.0.0.1:11434${reqPath}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Ollama ${response.status}: ${text}`);
  return JSON.parse(text);
});
