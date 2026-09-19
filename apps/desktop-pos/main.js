import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    backgroundColor: '#0f172a',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0f172a',
      symbolColor: '#10b981',
      height: 32
    },
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  ipcMain.handle('get-printers', async () => {
    try {
      if (!mainWindow) return [];
      return await mainWindow.webContents.getPrintersAsync();
    } catch (e) {
      console.error('Error getting printers', e);
      return [];
    }
  });

  ipcMain.on('print-ticket', (event, { htmlContent, deviceName }) => {
    const printWindow = new BrowserWindow({
      show: false,
      webPreferences: { nodeIntegration: true, contextIsolation: false }
    });

    const htmlStr = `
      <html>
        <head>
          <style>
            body { font-family: monospace; font-size: 12px; margin: 0; padding: 10px; color: black; background: white; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
            th, td { text-align: left; padding: 2px 0; }
            .right { text-align: right; }
          </style>
        </head>
        <body>${htmlContent}</body>
      </html>
    `;
    
    printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlStr)}`);
    
    printWindow.webContents.on('did-finish-load', () => {
      printWindow.webContents.print({
        silent: !!deviceName,
        deviceName: deviceName || undefined,
        margins: { marginType: 'none' }
      }, (success, errorType) => {
        if (!success) console.error('Error printing:', errorType);
        printWindow.close();
      });
    });
  });
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
