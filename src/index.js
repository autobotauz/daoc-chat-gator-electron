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
let damageInc = 0;
let healTimeStart = 0;
let healTimeEnd;
let damageIncTimeStart = 0;
let damageIncTimeEnd;
let heals = 0;

let damageMap = new Map();
let damageIncMap = new Map();
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
              damageInc = 0;
              damageMap = new Map();
              healMap = new Map();
              combinedMap = new Map();
              damageIncMap = new Map();
              let dps = 0;
              let hps = 0;
              let idps = 0;
              mainWindow.webContents.send('update-values', { damageOut, heals, damageInc, dps, hps, idps });
              mainWindow.webContents.send('update-chart-map', damageMap, healMap, damageIncMap, combinedMap);
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
    damageMap.set(lineTimestamp, parseInt(val, 10));
  }
  combinedMap.set(lineTimestamp, 0)
  damageOut += parseInt(val, 10);
}

function damageWeapLine(regexMatch) {
  const [, lineTimestamp, target, weapon, val] = regexMatch;
  if (dpsTimeStart == 0) {
    dpsTimeStart = lineTimestamp;
  }
  dpsTimeEnd = lineTimestamp;
  if (damageMap.has(lineTimestamp)) {
    const currentValue = parseInt(damageMap.get(lineTimestamp), 10);
    const newValue = currentValue + parseInt(val, 10);
    damageMap.set(lineTimestamp, newValue);
  } else {
    damageMap.set(lineTimestamp, parseInt(val, 10));
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
    damageMap.set(lineTimestamp, parseInt(val, 10));
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
    damageMap.set(lineTimestamp, parseInt(val, 10));
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
    healMap.set(lineTimestamp, parseInt(val, 10));
  }
  combinedMap.set(lineTimestamp, 0)
  healTimeEnd = lineTimestamp;
  heals += parseInt(val, 10);
}

function healCritLine(regexMatch) {
  const [, lineTimestamp, val] = regexMatch;
  if (healTimeStart == 0) {
    healTimeStart = lineTimestamp;
  }

  if (healMap.has(lineTimestamp)) {
    const currentValue = parseInt(healMap.get(lineTimestamp), 10);
    const newValue = currentValue + parseInt(val, 10);
    healMap.set(lineTimestamp, newValue);
  } else {
    healMap.set(lineTimestamp, parseInt(val, 10));
  }
  combinedMap.set(lineTimestamp, 0)
  healTimeEnd = lineTimestamp;
  heals += parseInt(val, 10);
}


function damageIncLine(regexMatch) {
  const [, lineTimestamp, val] = regexMatch;
  if (damageIncTimeStart == 0) {
    damageIncTimeStart = lineTimestamp;
  }

  if (damageIncMap.has(lineTimestamp)) {
    const currentValue = parseInt(damageIncMap.get(lineTimestamp), 10);
    const newValue = currentValue + parseInt(val, 10);
    damageIncMap.set(lineTimestamp, newValue);
  } else {
    damageIncMap.set(lineTimestamp, parseInt(val, 10));
  }
  combinedMap.set(lineTimestamp, 0)
  damageIncTimeEnd = lineTimestamp;
  damageInc += parseInt(val, 10);
}

let loggingEnabled = false;

function readChatLog() {
  dpsTimeStart = 0;
  dpsTimeEnd= 0;
  damageOut = 0;
  healTimeStart = 0;
  healTimeEnd;
  heals = 0;
  damageInc = 0;
  damageMap = new Map();
  healMap = new Map();
  combinedMap = new Map();
  damageIncMap = new Map();

  const logContent = fs.readFileSync(gatorLog, 'utf8');
  const lines = logContent.split('\n');

  const damageRegex = /\[(\d{2}:\d{2}:\d{2})\] You hit (.+) for (\d+).+?damage/; // time, target, value
  const dotNPetRegex = /\[(\d{2}:\d{2}:\d{2})\] Your (.+) hits (.+) for (\d+).+?damage!/; // time, spell, target, value
  const critRegex = /\[(\d{2}:\d{2}:\d{2})\] You critically hit for an additional (\d+).+?damage!/ // timestamp, val
  const healRegex = /\[(\d{2}:\d{2}:\d{2})\] You heal (.+) for (\d+) hit points./; // time, target, value
  const critAttackPattern = /\[(\d{2}:\d{2}:\d{2})\] You critically hit .+? for an additional (\d+) damage!/;
  const dotCritPattern = /\[(\d{2}:\d{2}:\d{2})\] Your (.+?) critically hits .+? for an additional (\d+) damage!/; // 1:spellName, 2:damageValue
  const critHealPattern = /\[(\d{2}:\d{2}:\d{2})\] Your heal criticals for an extra (\d+) amount of hit points!/;
  const dotDamagePattern = /\[(\d{2}:\d{2}:\d{2})\] Your (.+?) attacks .+? and hits for (\d+).+?damage!/; // 1:spellName, 2:damageValue
  const attackPattern = /\[(\d{2}:\d{2}:\d{2})\] You attack (.+?) with your (.+?) and hit for (\d+).+?damage!/; // 1:weaponName, 2:damage

  const startCastPattern = /\[(\d{2}:\d{2}:\d{2})\] You begin casting a (.+?) spell!/; // 1: time 2: spellName
  const spellPattern = /\[(\d{2}:\d{2}:\d{2})\] You cast a (.+?) spell!/; // 1: time 2: spellName
  const shotPattern = /\[(\d{2}:\d{2}:\d{2})\] You fire a (.+?)!/;
  const styleGrowthPattern = /\[(\d{2}:\d{2}:\d{2})\] You perform your (.+?) perfectly!.+?(\d+),/; // 1:styleName, 2:growthValue
  const killPattern = /\[(\d{2}:\d{2}:\d{2})\] You just killed (.+?)!/;
  
  const bodyDamagePattern = /\[(\d{2}:\d{2}:\d{2})\] .+? hits your .+? for (\d+).*damage!/;
  const incDamagePattern = /\[(\d{2}:\d{2}:\d{2})\] .+? hits you for (\d+) .+?damage!/;

  const resistPattern = /\[(\d{2}:\d{2}:\d{2})\] .+?resists the effect!.+?/;
  const interruptedPattern = /\[(\d{2}:\d{2}:\d{2})\] (interrupt your spellcast)|(spell is interrupted)|(interrupt your focus)/;
  const overHealedPattern = /\[(\d{2}:\d{2}:\d{2})\] fully healed/;
 
  const logOpenedPattern = /Chat Log Opened:.+?\d{2}:\d{2}:\d{2} \d{4}/;
  const logClosedPattern = /Chat Log Closed:.+?\d{2}:\d{2}:\d{2} \d{4}/;


  lines.forEach((line) => {
      const damageMatch = line.match(damageRegex);
      const dotNPetMatch = line.match(dotNPetRegex);
      const critMatch = line.match(critRegex);
      const healMatchh = line.match(healRegex);

      const critAttackMatch = line.match(critAttackPattern);
      const dotCritMatch = line.match(dotCritPattern);
      const critHealMatch = line.match(critHealPattern);
      const dotDamageMatch = line.match(dotDamagePattern);
      const attackMatch = line.match(attackPattern);

      const incDamageMatch = line.match(incDamagePattern);
      const bodyDamageMatch = line.match(bodyDamagePattern);

      const logOpenedMatch = line.match(logOpenedPattern);
      const logClosedMatch = line.match(logClosedPattern);

      if (damageMatch) {
        damageLine(damageMatch);
      } else if (healMatchh) {
        healLine(healMatchh);
      } else if (dotNPetMatch) {
        dotNPetLine(dotNPetMatch);
      } else if (critMatch) {
        critLine(critMatch);
      } 
      else if (critAttackMatch) {
        critLine(critAttackMatch);
      } else if (dotCritMatch) {
        dotNPetLine(dotCritMatch);
      } else if (critHealMatch) {
        healCritLine(critHealMatch);
      } else if (dotDamageMatch) {
        dotNPetLine(dotDamageMatch);
      } else if (attackMatch) {
        damageWeapLine(attackMatch);
      }
      else if (incDamageMatch) {
        damageIncLine(incDamageMatch);
      } else if (bodyDamageMatch) {
        damageIncLine(bodyDamageMatch);
      } 
      else if (logOpenedMatch) {
        loggingEnabled = true;
      } else if (logClosedMatch) {
        loggingEnabled = false;
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

  currentTime = new Date(`1970-01-01T${damageIncTimeStart}`);
  lastTime = new Date(`1970-01-01T${damageIncTimeEnd}`);
  elapsedTime = (lastTime - currentTime) > 0 ? (lastTime - currentTime) / 1000 : 0; // Convert to seconds
  let idps = parseFloat((elapsedTime > 0 ? damageInc / elapsedTime : damageInc).toFixed(2));
  console.log(loggingEnabled);
  mainWindow.webContents.send('update-header',  loggingEnabled );
  mainWindow.webContents.send('update-values', { damageOut, heals, damageInc, dps, hps, idps });
  mainWindow.webContents.send('update-chart-map', damageMap, healMap, damageIncMap, combinedMap);
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

let gatorLog;

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

    // Specify the destination path for the copied file
    gatorLog = path.join(path.dirname(chatLogPath), 'chatgator_log');
    setInterval(checkFileChanges, pollingInterval);
    // Call the function to copy the file
    copyFile(chatLogPath, gatorLog);
    readChatLog();
    watcher.on('change', (path) => {
      copyFile(chatLogPath, gatorLog);
      readChatLog();
    });
  }
});

function copyFile(sourcePath, destinationPath) {
  try {
    // Read the contents of the source file
    const fileContent = fs.readFileSync(sourcePath);

    // Write the contents to the destination file
    fs.writeFileSync(destinationPath, fileContent);

    console.log('File copied successfully!');
  } catch (error) {
    console.error('Error copying file:', error.message);
  }
}

const pollingInterval = 500; // in milliseconds
let previousSize = 0;
let previousMtime = 0;

function checkFileChanges() {
  fs.stat(chatLogPath, (err, stats) => {
    if (err) {
      console.error('Error getting file stats:', err.message);
      return;
    }

    // Compare current stats with previous stats
    if (stats.size !== previousSize || stats.mtime.getTime() !== previousMtime) {
      console.log('File has changed!');
      // Trigger the necessary actions when the file changes

      // Update previous stats
      previousSize = stats.size;
      previousMtime = stats.mtime.getTime();
    }
  });
}


