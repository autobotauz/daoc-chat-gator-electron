const { app, BrowserWindow, dialog, ipcMain, globalShortcut  } = require('electron');
const path = require('path');
const fs = require('fs');
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
let iheals = 0;

let damageMap = new Map();
let spellDamageMap = new Map();
let damageIncMap = new Map();
let healMap = new Map();
let ihealMap = new Map();
let healTargetMap = new Map();
let meleeDamageMap = new Map();
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
              dialog.showErrorBox('Error', "Can't delete the file. Please check if logging is disabled");
            } else {
              console.log('File deleted successfully.');
              resetValues();
              let dps = 0;
              let hps = 0;
              let ihps = 0;
              let idps = 0;
              mainWindow.webContents.send('update-values', { damageOut, heals, iheals, damageInc, dps, hps, idps });
              mainWindow.webContents.send('update-chart-map', damageMap, healMap, ihealMap, damageIncMap, combinedMap);
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

  updateSpellMap(spellName, val);

  combinedMap.set(lineTimestamp, 0)
  damageOut += parseInt(val, 10);
}

function updateSpellMap(spell, val) {
  if (spellDamageMap.has(spell)) {
    const stats = spellDamageMap.get(spell);
    if (stats instanceof Map) {
      let currentValue = parseInt(stats.get("output"), 10);
      let newValue = currentValue + parseInt(val, 10);
      stats.set("output", newValue)

      currentValue = parseInt(stats.get("hits"), 10);
      newValue = currentValue + 1;
      stats.set("hits", newValue)

      spellDamageMap.set(spell, stats);
    }
  } else {
    if (spell != ""){
      const spellStats = new Map();
      spellStats.set("output", parseInt(val, 10))
      spellStats.set("hits", 1)
      spellDamageMap.set(spell, spellStats);
    }
  }
}

function updateMeleeMap(spell, val) {
  if (meleeDamageMap.has(spell)) {
    const stats = meleeDamageMap.get(spell);
    if (stats instanceof Map) {
      let currentValue = parseInt(stats.get("output"), 10);
      let newValue = currentValue + parseInt(val, 10);
      stats.set("output", newValue)

      currentValue = parseInt(stats.get("hits"), 10);
      newValue = currentValue + 1;
      stats.set("hits", newValue)

      meleeDamageMap.set(spell, stats);
    }
  } else {
    if (spell != ""){
      const spellStats = new Map();
      spellStats.set("output", parseInt(val, 10))
      spellStats.set("hits", 1)
      meleeDamageMap.set(spell, spellStats);
    }
  }
}

function updateHealMap(target, val) {
  if (healTargetMap.has(target)) {
    const stats = healTargetMap.get(target);
    if (stats instanceof Map) {
      let currentValue = parseInt(stats.get("output"), 10);
      let newValue = currentValue + parseInt(val, 10);
      stats.set("output", newValue)

      currentValue = parseInt(stats.get("hits"), 10);
      newValue = currentValue + 1;
      stats.set("hits", newValue)

      healTargetMap.set(target, stats);
    }
  } else {
    if (target != ""){
      const spellStats = new Map();
      spellStats.set("output", parseInt(val, 10))
      spellStats.set("hits", 1)
      healTargetMap.set(target, spellStats);
    }
  }
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

  if (spellName == "") {
    updateMeleeMap(weapon, val);
  } else {
    updateMeleeMap(spellName, val);
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


  updateSpellMap(spell, val);

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


  updateSpellMap(spellName, val);

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

  // updateSpellMap(spellName, val);
  updateHealMap("Out: "+target, val)

  combinedMap.set(lineTimestamp, 0)
  healTimeEnd = lineTimestamp;
  heals += parseInt(val, 10);
}

function healByLine(regexMatch) {
  const [, lineTimestamp, target, val] = regexMatch;
  if (healTimeStart == 0) {
    healTimeStart = lineTimestamp;
  }

  if (ihealMap.has(lineTimestamp)) {
    const currentValue = parseInt(ihealMap.get(lineTimestamp), 10);
    const newValue = currentValue + parseInt(val, 10);
    ihealMap.set(lineTimestamp, newValue);
  } else {
    ihealMap.set(lineTimestamp, parseInt(val, 10));
  }

  updateHealMap("In: "+target, val)

  combinedMap.set(lineTimestamp, 0)
  healTimeEnd = lineTimestamp;
  iheals += parseInt(val, 10);
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

  
  updateHealMap("Out: "+target, val)
  // updateSpellMap(spellName, val);

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
let spellName = "";

function resetValues() {
  dpsTimeStart = 0;
  dpsTimeEnd= 0;
  damageOut = 0;
  healTimeStart = 0;
  healTimeEnd;
  heals = 0;
  iheals = 0;
  damageInc = 0;
  damageMap = new Map();
  healMap = new Map();
  ihealMap = new Map();
  combinedMap = new Map();
  damageIncMap = new Map();
  spellDamageMap = new Map();
  healTargetMap = new Map();
  meleeDamageMap = new Map();
}

function readChatLog() {
  resetValues();

  const logContent = fs.readFileSync(gatorLog, 'utf8');
  const lines = logContent.split('\n');

  const damageRegex = /\[(\d{2}:\d{2}:\d{2})\] You hit (.+) for (\d+).+?damage/; // time, target, value
  const dotNPetRegex = /\[(\d{2}:\d{2}:\d{2})\] Your (.+) hits (.+) for (\d+).+?damage!/; // time, spell, target, value
  const critRegex = /\[(\d{2}:\d{2}:\d{2})\] You critically hit for an additional (\d+).+?damage!/ // timestamp, val
  const healRegex = /\[(\d{2}:\d{2}:\d{2})\] You heal (.+) for (\d+) hit points./; // time, target, value
  const healByRegex = /\[(\d{2}:\d{2}:\d{2})\] You are healed by (.+) for (\d+) hit points./; // time, target, value
  const critAttackPattern = /\[(\d{2}:\d{2}:\d{2})\] You critically hit .+? for an additional (\d+) damage!/;
  const dotCritPattern = /\[(\d{2}:\d{2}:\d{2})\] Your (.+?) critically hits (.+?) for an additional (\d+) damage!/; // 1:spellName, 2:damageValue
  const critHealPattern = /\[(\d{2}:\d{2}:\d{2})\] Your heal criticals for an extra (\d+) amount of hit points!/;
  const dotDamagePattern = /\[(\d{2}:\d{2}:\d{2})\] Your (.+?) attacks (.+?) and hits for (\d+).+?damage!/; // 1:spellName, 2:damageValue
  const attackPattern = /\[(\d{2}:\d{2}:\d{2})\] You attack (.+?) with your (.+?) and hit for (\d+).+?damage!/; // 1:weaponName, 2:damage

  const startCastPattern = /\[(\d{2}:\d{2}:\d{2})\] You begin casting a (.+?) spell!/; // 1: time 2: spellName
  const spellPattern = /\[(\d{2}:\d{2}:\d{2})\] You cast a (.+?) spell!/; // 1: time 2: spellName
  const shotPattern = /\[(\d{2}:\d{2}:\d{2})\] You fire a (.+?)!/; // 1: time 2: spellName

  const styleGrowthPattern = /\[(\d{2}:\d{2}:\d{2})\] You perform your (.+?) perfectly!/;
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
      const healByMatchh = line.match(healByRegex);

      const critAttackMatch = line.match(critAttackPattern);
      const dotCritMatch = line.match(dotCritPattern);
      const critHealMatch = line.match(critHealPattern);
      const dotDamageMatch = line.match(dotDamagePattern);
      const attackMatch = line.match(attackPattern);

      const incDamageMatch = line.match(incDamagePattern);
      const bodyDamageMatch = line.match(bodyDamagePattern);

      const logOpenedMatch = line.match(logOpenedPattern);
      const logClosedMatch = line.match(logClosedPattern);

      const startCastMatch = line.match(startCastPattern);
      const spellMatch = line.match(spellPattern);
      const shotMatch = line.match(shotPattern);
      const styleGrowthMatch = line.match(styleGrowthPattern);

      const resistMatch = line.match(resistPattern);
      const interruptedMatch = line.match(interruptedPattern);
      if (damageMatch) {
        damageLine(damageMatch);
        

      } else if (healMatchh) {
        healLine(healMatchh);

      } else if (healByMatchh) {
        healByLine(healByMatchh);

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

      else if (resistMatch) {
        spellName = "";
      } else if (interruptedMatch) {
        spellName = "";
      } 

      else if (startCastMatch) {
        const [, lineTimestamp, val] = startCastMatch;
        spellName = val;
      } else if (spellMatch) {
        const [, lineTimestamp, val] = spellMatch;
        spellName = val;
      }  else if (shotMatch) {
        const [, lineTimestamp, val] = shotMatch;
        spellName = val;
      } 
      else if (styleGrowthMatch) {
        const [, lineTimestamp, val, growth] = styleGrowthMatch;
        spellName = val;
      }

  });


  let currentTime = new Date(`1970-01-01T${dpsTimeStart}`);
  let lastTime = new Date(`1970-01-01T${dpsTimeEnd}`);
  let elapsedTime = (lastTime - currentTime) / 1000;
  let dps = parseFloat((elapsedTime > 0 ? damageOut / elapsedTime : 0).toFixed(2));

  currentTime = new Date(`1970-01-01T${healTimeStart}`);
  lastTime = new Date(`1970-01-01T${healTimeEnd}`);
  elapsedTime = (lastTime - currentTime) > 0 ? (lastTime - currentTime) / 1000 : 0;
  let hps = parseFloat((elapsedTime > 0 ? heals / elapsedTime : heals).toFixed(2));

  let ihps = parseFloat((elapsedTime > 0 ? iheals / elapsedTime : iheals).toFixed(2));

  currentTime = new Date(`1970-01-01T${damageIncTimeStart}`);
  lastTime = new Date(`1970-01-01T${damageIncTimeEnd}`);
  elapsedTime = (lastTime - currentTime) > 0 ? (lastTime - currentTime) / 1000 : 0;
  let idps = parseFloat((elapsedTime > 0 ? damageInc / elapsedTime : damageInc).toFixed(2));
  mainWindow.webContents.send('update-header',  loggingEnabled );
  mainWindow.webContents.send('update-values', { damageOut, heals, iheals, damageInc, dps, hps, idps, ihps });
  mainWindow.webContents.send('update-chart-map', damageMap, healMap, ihealMap, damageIncMap, combinedMap);
  updateTableData(spellDamageMap, healTargetMap, meleeDamageMap);
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

    gatorLog = path.join(path.dirname(chatLogPath), 'chatgator_log');
    setInterval(checkFileChanges, pollingInterval);
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
    const fileContent = fs.readFileSync(sourcePath);
    fs.writeFileSync(destinationPath, fileContent);
    console.log('File copied successfully!');
  } catch (error) {
    console.error('Error copying file:', error.message);
  }
}

const pollingInterval = 500;
let previousSize = 0;
let previousMtime = 0;

function checkFileChanges() {
  fs.stat(chatLogPath, (err, stats) => {
    if (err) {
      console.error('Error getting file stats:', err.message);
      return;
    }
    if (stats.size !== previousSize || stats.mtime.getTime() !== previousMtime) {
      console.log('File has changed!');
      previousSize = stats.size;
      previousMtime = stats.mtime.getTime();
    }
  });
}


let tableWindow;

let tableWindowHeals;

let tableWindowMelee;




ipcMain.on('open-table-window', (event) => {
  if (!tableWindow || tableWindow.isDestroyed()) {
    tableWindow = new BrowserWindow({
      width: 600,
      height: 300,
      minWidth: 100,
      minHeight: 100,
      autoHideMenuBar: true,
      titleBarStyle: 'hiddenInset',
      focusable: true,
      focus: true,
      frame: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
      },
      resizable: true,
      alwaysOnTop: true
    });

    tableWindow.setAlwaysOnTop(true, 'screen-saver', 1);
    
    tableWindow.loadFile(path.join(__dirname, 'table.html'));
    tableWindow.webContents.on('did-finish-load', () => {
      tableWindow.webContents.send('load-table-data', spellDamageMap);
    });

    tableWindow.on('closed', () => {
      tableWindow = null;
    });
  }
});

ipcMain.on('open-table-window-melee', (event) => {
  if (!tableWindowMelee || tableWindowMelee.isDestroyed()) {
    tableWindowMelee = new BrowserWindow({
      width: 600,
      height: 300,
      minWidth: 100,
      minHeight: 100,
      autoHideMenuBar: true,
      titleBarStyle: 'hiddenInset',
      focusable: true,
      focus: true,
      frame: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
      },
      resizable: true,
      alwaysOnTop: true
    });

    tableWindowMelee.setAlwaysOnTop(true, 'screen-saver', 1);
    
    tableWindowMelee.loadFile(path.join(__dirname, 'melee.html'));
    tableWindowMelee.webContents.on('did-finish-load', () => {
      tableWindowMelee.webContents.send('load-table-data-melee', meleeDamageMap);
    });

    tableWindowMelee.on('closed', () => {
      tableWindowMelee = null;
    });
  }
});


ipcMain.on('open-table-window-heals', (event) => {
  if (!tableWindowHeals || tableWindowHeals.isDestroyed()) {
    tableWindowHeals = new BrowserWindow({
      width: 600,
      height: 300,
      minWidth: 100,
      minHeight: 100,
      autoHideMenuBar: true,
      titleBarStyle: 'hiddenInset',
      focusable: true,
      focus: true,
      frame: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
      },
      resizable: true,
      alwaysOnTop: true
    });

    tableWindowHeals.setAlwaysOnTop(true, 'screen-saver', 1);
    
    tableWindowHeals.loadFile(path.join(__dirname, 'heals.html'));
    tableWindowHeals.webContents.on('did-finish-load', () => {
      tableWindowHeals.webContents.send('load-table-data-heals', healTargetMap);
    });

    tableWindowHeals.on('closed', () => {
      tableWindowHeals = null;
    });
  }
});

function updateTableData(updatedSpellData, updatedHealsData, updatedHealsData) {
  if (tableWindow && !tableWindow.isDestroyed()) {
    tableWindow.webContents.send('update-table-data', updatedSpellData);
  }

  if (tableWindowHeals && !tableWindowHeals.isDestroyed()) {
    tableWindowHeals.webContents.send('update-table-data-heals', updatedHealsData);
  }

  if (tableWindowMelee && !tableWindowMelee.isDestroyed()) {
    tableWindowMelee.webContents.send('update-table-data-melee', updatedMeleeData);
  }
}
