const { app, BrowserWindow, dialog, ipcMain, globalShortcut  } = require('electron');
const path = require('path');
const fs = require('fs');
const { Console } = require('console');
require("electron-reload")(__dirname)

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 200,
    height: 200,
    minWidth: 100,
    minHeight: 100,
    autoHideMenuBar: true,
    titleBarStyle: 'hiddenInset',
    focusable: true,
    focus: true,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    transparent: true,
    alwaysOnTop: true
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);
  mainWindow.on('closed', () => (mainWindow = null));
      const shortcut = 'CommandOrControl+Alt+X';
      globalShortcut.register(shortcut, () => {
        if (chatLogPath) {
          fs.unlink(chatLogPath, (err) => {
            if (err) {
              console.error('Error deleting file:', err);
            } else {
              console.log('File deleted successfully.');
              let damageOut = 0;
              let dps = 0;
              let heals = 0;
              mainWindow.webContents.send('update-values', { damageOut, heals, dps });
            }
          });
        } else {
          dialog.showErrorBox('Error', 'No file selected to delete.');
        }
      });

}

function readChatLog() {
  const logContent = fs.readFileSync(chatLogPath, 'utf8');

  const lines = logContent.split('\n');

  let damageOut = 0;
  let dpsTimeStart = 0;
  let dpsTimeEnd= 0;
  let healTimeStart = 0;
  let healTimeEnd;
  let heals = 0;
  const damageRegex = /\[(\d{2}:\d{2}:\d{2})\] You hit (.+) for (\d+).+?damage/;
  const healRegex = /\[(\d{2}:\d{2}:\d{2})\] You heal (.+) for (\d+) hit points./;

  lines.forEach((line) => {
    const damageMatch = line.match(damageRegex);
    const healMatchh = line.match(healRegex);
    if (damageMatch) {
      const [, lineTimestamp, target, val] = damageMatch;
      if (dpsTimeStart == 0) {
        dpsTimeStart = lineTimestamp;
      }
      dpsTimeEnd = lineTimestamp;
      damageOut += parseInt(val, 10);
    } else if (healMatchh) {
      const [, lineTimestamp, target, val] = healMatchh;
      if (healTimeStart == 0) {
        healTimeStart = lineTimestamp;
      }
      healTimeEnd = lineTimestamp;
      heals += parseInt(val, 10);
    }
  });
  let currentTime = new Date(`1970-01-01T${dpsTimeStart}`);
  let lastTime = new Date(`1970-01-01T${dpsTimeEnd}`);
  let elapsedTime = (lastTime - currentTime) / 1000; // Convert to seconds
  let dps = parseFloat((elapsedTime > 0 ? damageOut / elapsedTime : 0).toFixed(2));

  currentTime = new Date(`1970-01-01T${healTimeStart}`);
  lastTime = new Date(`1970-01-01T${healTimeEnd}`);
  elapsedTime = (lastTime - currentTime) > 0 ? (lastTime - currentTime) / 1000 : 0; // Convert to seconds
  console.log(heals);
  let hps = parseFloat((elapsedTime > 0 ? heals / elapsedTime : heals).toFixed(2));



  mainWindow.webContents.send('update-values', { damageOut, heals, dps, hps });
}

app.on('ready', createWindow);

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.on('select-file', () => {
  const result = dialog.showOpenDialogSync(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Log Files', extensions: ['log'] }],
  });

  if (result && result.length > 0) {
    chatLogPath = result[0];
    startTime = Date.now();
    readChatLog();
    fs.watch(chatLogPath, (event, filename) => {
      if (event === 'change' && filename === path.basename(chatLogPath)) {
        readChatLog();
      }
    });
  }
});