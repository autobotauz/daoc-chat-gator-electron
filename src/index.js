const { app, BrowserWindow, dialog, ipcMain, globalShortcut  } = require('electron');
const path = require('path');
const fs = require('fs');
const { Console } = require('console');
const readline = require('readline');
const chokidar = require('chokidar');

require("electron-reload")(__dirname)

let mainWindow;
let dpsTimeStart = 0;
let dpsTimeEnd= 0;
let damageOut = 0;
let healTimeStart = 0;
let healTimeEnd;
let heals = 0;
let lastLine = '';

let damageMap = new Map();
let healMap = new Map();
let combinedMap = new Map();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 300,
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
              dpsTimeStart = 0;
              dpsTimeEnd= 0;
              damageOut = 0;
              healTimeStart = 0;
              healTimeEnd;
              heals = 0;
              mainWindow.webContents.send('update-values', { damageOut, heals, dps });
            }
          });
        } else {
          dialog.showErrorBox('Error', 'No file selected to delete.');
        }
      });

}



function damageLine(regexMatch) {
  const [, lineTimestamp, target, val] = regexMatch;
  if (dpsTimeStart == 0) {
    dpsTimeStart = lineTimestamp;
  }
  dpsTimeEnd = lineTimestamp;
  if (damageMap.has(lineTimestamp)) {
    const currentValue = parseInt(damageMap.get(lineTimestamp), 10);
    const newValue = currentValue + parseInt(val, 10);
    damageMap.set(lineTimestamp, newValue);
  } else {
    damageMap.set(lineTimestamp, val);
  }
  combinedMap.set(lineTimestamp, 0)
  damageOut += parseInt(val, 10);
}

function dotNPetLine(regexMatch) {
  const [, lineTimestamp, spell, target, val] = regexMatch;
  if (dpsTimeStart == 0) {
    dpsTimeStart = lineTimestamp;
  }
  dpsTimeEnd = lineTimestamp;
  if (damageMap.has(lineTimestamp)) {
    const currentValue = parseInt(damageMap.get(lineTimestamp), 10);
    const newValue = currentValue + parseInt(val, 10);
    damageMap.set(lineTimestamp, newValue);
  } else {
    damageMap.set(lineTimestamp, val);
  }
  combinedMap.set(lineTimestamp, 0)
  damageOut += parseInt(val, 10);
}

function critLine(regexMatch) {
  const [, lineTimestamp, val] = regexMatch;
  if (dpsTimeStart == 0) {
    dpsTimeStart = lineTimestamp;
  }
  dpsTimeEnd = lineTimestamp;
  if (damageMap.has(lineTimestamp)) {
    const currentValue = parseInt(damageMap.get(lineTimestamp), 10);
    const newValue = currentValue + parseInt(val, 10);
    damageMap.set(lineTimestamp, newValue);
  } else {
    damageMap.set(lineTimestamp, val);
  }
  combinedMap.set(lineTimestamp, 0)
  damageOut += parseInt(val, 10);
}

function healLine(regexMatch) {
  const [, lineTimestamp, target, val] = regexMatch;
  if (healTimeStart == 0) {
    healTimeStart = lineTimestamp;
  }

  if (healMap.has(lineTimestamp)) {
    const currentValue = parseInt(healMap.get(lineTimestamp), 10);
    const newValue = currentValue + parseInt(val, 10);
    healMap.set(lineTimestamp, newValue);
  } else {
    healMap.set(lineTimestamp, val);
  }
  combinedMap.set(lineTimestamp, 0)
  healTimeEnd = lineTimestamp;
  heals += parseInt(val, 10);
}

function updateDamage(timestamp, damageValue) {
  updateMap('damage', timestamp, damageValue);
}

function updateHeals(timestamp, healsValue) {
  updateMap('heals', timestamp, healsValue);
}

function updateMap(type, timestamp, value) {
  if (!combinedMap.has(timestamp)) {
    combinedMap.set(timestamp, { damage: 0, heals: 0 });
  }

  const entry = combinedMap.get(timestamp);
  entry[type] += value;

  // Now combinedMap contains the updated values for both damage and heals
}


function readChatLog() {
  dpsTimeStart = 0;
  dpsTimeEnd= 0;
  damageOut = 0;
  healTimeStart = 0;
  healTimeEnd;
  heals = 0;
  damageMap = new Map();
  healMap = new Map();
  combinedMap = new Map();

  const logContent = fs.readFileSync(chatLogPath, 'utf8');
  const lines = logContent.split('\n');

  const damageRegex = /\[(\d{2}:\d{2}:\d{2})\] You hit (.+) for (\d+).+?damage/; // time, target, value
  const dotNPetRegex = /\[(\d{2}:\d{2}:\d{2})\] Your (.+) hits (.+) for (\d+).+?damage!/; // time, spell, target, value

  const critRegex = /\[(\d{2}:\d{2}:\d{2})\] You critically hit for an additional (\d+).+?damage! (Crit Chance: 49%)/ // timestamp, val
  
  const healRegex = /\[(\d{2}:\d{2}:\d{2})\] You heal (.+) for (\d+) hit points./; // time, target, value

  const startCastPattern = /\[(\d{2}:\d{2}:\d{2})\] You begin casting a (.+?) spell!/; // 1: time 2: spellName
  const spellPattern = /\[(\d{2}:\d{2}:\d{2})\] You cast a (.+?) spell!/; // 1: time 2: spellName
  const shotPattern = /\[(\d{2}:\d{2}:\d{2})\] You fire a (.+?)!/;

  const critAttackPattern = /\[(\d{2}:\d{2}:\d{2})\] You critically hit .+? for an additional (\d+) damage!/;
  const critHealPattern = /\[(\d{2}:\d{2}:\d{2})\] Your heal criticals for an extra (\d+) amount of hit points!/;
  const dotCritPattern = /\[(\d{2}:\d{2}:\d{2})\] Your (.+?) critically hits .+? for an additional (\d+) damage!/; // 1:spellName, 2:damageValue

  const dotDamagePattern = /\[(\d{2}:\d{2}:\d{2})\] Your (.+?) attacks .+? and hits for (\d+).+?damage!/; // 1:spellName, 2:damageValue
  const styleGrowthPattern = /\[(\d{2}:\d{2}:\d{2})\] You perform your (.+?) perfectly!.+?(\d+),/; // 1:styleName, 2:growthValue
  const attackPattern = /\[(\d{2}:\d{2}:\d{2})\] You attack .+? with your (.+?) and hit for (\d+).+?damage!/; // 1:weaponName, 2:damage

  const killPattern = /\[(\d{2}:\d{2}:\d{2})\] You just killed (.+?)!/;
  const bodyDamagePattern = /\[(\d{2}:\d{2}:\d{2})\] .+? hits your (.+?) for (\\d+).+?damage!/;
  const resistPattern = /\[(\d{2}:\d{2}:\d{2})\] .+?resists the effect!.+?/;
  const interruptedPattern = /\[(\d{2}:\d{2}:\d{2})\] (interrupt your spellcast)|(spell is interrupted)|(interrupt your focus)/;
  const overHealedPattern = /\[(\d{2}:\d{2}:\d{2})\] fully healed/;
 

  lines.forEach((line) => {
      const damageMatch = line.match(damageRegex);
      const dotNPetMatch = line.match(dotNPetRegex);
      const critMatch = line.match(critRegex);
      const healMatchh = line.match(healRegex);
      if (damageMatch) {
        damageLine(damageMatch);
      } else if (healMatchh) {
        healLine(healMatchh);
      } else if (dotNPetMatch) {
        dotNPetLine(dotNPetMatch);
      } else if (critMatch) {
        critLine(critMatch);
      }


  });
  let currentTime = new Date(`1970-01-01T${dpsTimeStart}`);
  let lastTime = new Date(`1970-01-01T${dpsTimeEnd}`);
  let elapsedTime = (lastTime - currentTime) / 1000; // Convert to seconds
  let dps = parseFloat((elapsedTime > 0 ? damageOut / elapsedTime : 0).toFixed(2));

  currentTime = new Date(`1970-01-01T${healTimeStart}`);
  lastTime = new Date(`1970-01-01T${healTimeEnd}`);
  elapsedTime = (lastTime - currentTime) > 0 ? (lastTime - currentTime) / 1000 : 0; // Convert to seconds
  let hps = parseFloat((elapsedTime > 0 ? heals / elapsedTime : heals).toFixed(2));


  mainWindow.webContents.send('update-values', { damageOut, heals, dps, hps });
  mainWindow.webContents.send('update-chart-map', damageMap, healMap, combinedMap);
  // mainWindow.webContents.send('update-heal-map', healMap);



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


  
  if (result && result.length > 0 ) {
    chatLogPath = result[0];
    const watcher = chokidar.watch(chatLogPath, {
      ignoreInitial: true,
    });
  
    readChatLog();
    watcher.on('change', (path) => {
      readChatLog();
    });
  }
});