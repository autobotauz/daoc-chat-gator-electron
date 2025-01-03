// renderer.js
const { ipcRenderer } = window.electron;

ipcRenderer.on('load-table-data', (event, spellData) => {
  loadTableData(spellDataToArray(spellData));
});
ipcRenderer.on('update-table-data', (event, updatedSpellData) => {
  loadTableData(spellDataToArray(updatedSpellData));
});

ipcRenderer.on('load-table-data-heals', (event, spellData) => {
  loadTableDataHeal(spellDataToArray(spellData));
});
ipcRenderer.on('update-table-data-heals', (event, updatedSpellData) => {
  loadTableDataHeal(spellDataToArray(updatedSpellData));
});


ipcRenderer.on('load-table-data-melee', (event, spellData) => {
  loadTableDataMelee(spellDataToArray(spellData));
});
ipcRenderer.on('update-table-data-melee', (event, updatedSpellData) => {
  loadTableDataMelee(spellDataToArray(updatedSpellData));
});


function spellDataToArray(spellData) {
  return Array.from(spellData.entries()).map(([spellName, statsMap]) => ({
    spellName,
    count: statsMap.get('hits'),
    output: statsMap.get('output'),
    average: parseFloat((statsMap.get('output') > 0 ? statsMap.get('output') / statsMap.get('hits') : statsMap.get('output')).toFixed(2)),
  }));
}

let dataTable;
function loadTableData(spellDataArray) {
  if (!dataTable) {
    // If DataTable doesn't exist, initialize it
    $(document).ready(function () {
      dataTable = $('#spellTable').DataTable({
        data: spellDataArray,
        columns: [
          { data: 'spellName' },
          { data: 'count' },
          { data: 'output' },
          { data: 'average' },
          // More columns like cast speed, resist, miss, etc -> break out to spell and melee?
        ],
      });
    });
  } else {
    dataTable.clear().rows.add(spellDataArray).draw();
  }
}

let dataTableHeal;
function loadTableDataHeal(spellDataArray) {
  if (!dataTableHeal) {
    // If DataTable doesn't exist, initialize it
    $(document).ready(function () {
      dataTableHeal = $('#healTable').DataTable({
        data: spellDataArray,
        columns: [
          { data: 'spellName' },
          { data: 'count' },
          { data: 'output' },
          { data: 'average' },
          // More columns like cast speed, resist, miss, etc -> break out to spell and melee?
        ],
      });
    });
  } else {
    dataTableHeal.clear().rows.add(spellDataArray).draw();
  }
}

let dataTableMelee;
function loadTableDataMelee(spellDataArray) {
  if (!dataTableMelee) {
    // If DataTable doesn't exist, initialize it
    $(document).ready(function () {
      dataTableMelee = $('#meleeTable').DataTable({
        data: spellDataArray,
        columns: [
          { data: 'spellName' },
          { data: 'count' },
          { data: 'output' },
          { data: 'average' },
          // More columns like cast speed, resist, miss, etc -> break out to spell and melee?
        ],
      });
    });
  } else {
    dataTableMelee.clear().rows.add(spellDataArray).draw();
  }
}

function createCombinedMap(damageMap, healMap, ihealMap, damageIncMap) {
  // Step 1: Get all unique keys from all maps
  const allKeys = new Set([
    ...damageMap.keys(),
    ...healMap.keys(),
    ...ihealMap.keys(),
    ...damageIncMap.keys(),
  ]);

  // Step 2: Initialize the combined map
  const combinedMap = new Map();

  // Step 3: Populate the combined map
  allKeys.forEach(key => {
    combinedMap.set(key, {
      damage: damageMap.get(key) || 0,      // Default to 0 if key is missing
      heals: healMap.get(key) || 0,
      iheals: ihealMap.get(key) || 0,
      damageInc: damageIncMap.get(key) || 0,
    });
  });

  return combinedMap;
}

document.getElementById('openTableButtonSpells').addEventListener('click', () => {
  ipcRenderer.send('open-table-window');
});

document.getElementById('openTableButtonMelee').addEventListener('click', () => {
  ipcRenderer.send('open-table-window-melee');
});

document.getElementById('openTableButtonHeals').addEventListener('click', () => {
  ipcRenderer.send('open-table-window-heals');
});

ipcRenderer.on('update-values', (event, values) => {
  document.getElementById('damageOut').textContent = `Out Damage: ${values.damageOut}`;
  document.getElementById('heals').textContent = `Out Heals: ${values.heals}`;
  document.getElementById('dps').textContent = `DPS: ${values.dps}`;
  document.getElementById('hps').textContent = `HPS: ${values.hps}`;

  document.getElementById('damageInc').textContent = `In Damage: ${values.damageInc}`;
  document.getElementById('idps').textContent = `DPS: ${values.idps}`;

  document.getElementById('iheals').textContent = `In Heals: ${values.iheals}`;
  document.getElementById('ihps').textContent = `HPS: ${values.ihps}`;
});

document.getElementById('selectFile').addEventListener('click', () => {
    ipcRenderer.send('select-file');
  });

  let damageMap = new Map();
  let healMap = new Map();
  let ihealMap = new Map();
  let combinedMap = new Map();
  let damageIncMap = new Map();
  let chart;

  ipcRenderer.on('update-damage-map', (_, updatedDamageMap) => {
    damageMap = new Map(updatedDamageMap);
    updateChart("damage");
  });

  ipcRenderer.on('update-chart-map', (_, updatedDamageMap, updatedHealsMap, updatediHealsMap, updatedDamageIncMap, updatedCombinedMap) => {
    damageMap = new Map(updatedDamageMap);
    healMap = new Map(updatedHealsMap);
    ihealMap = new Map(updatediHealsMap);
    damageIncMap = new Map(updatedDamageIncMap)
    combinedMap = createCombinedMap(damageMap, healMap, ihealMap, damageIncMap);
    
    updateChart();
  });

  ipcRenderer.on('update-header', (_, loggingEnabled) => {
    changeHeaderColor(loggingEnabled);
  });

  function changeHeaderColor(logLine) {
    const headerElement = document.getElementById('header');
    if (!logLine) {
      headerElement.style.backgroundColor = 'red';
    } else {
      headerElement.style.backgroundColor = '#0ab475';
    }
  }

  function toggleChart() {
    const chartContainer = document.getElementById('damageChart');
      chartContainer.style.display = chartContainer.style.display === 'none' ? 'block' : 'none';
      if (chartContainer.style.display === 'block') {
      updateChart();
    }
  }
  document.getElementById('toggleChartButton').addEventListener('click', toggleChart);

  function updateChart(labelName) {
    const canvas = document.getElementById('damageChart');
    const ctx = canvas.getContext('2d');
  
    if (!chart) {
      chart = new Chart(ctx, {
        type: 'line',
        data: {
          datasets: [{
            label: "out damage",
            data: [],
            borderColor: 'rgba(0,255,0, 1)',
            borderWidth: 2,
            fill: false,
          },
          {
            label: "inc damage",
            data: [], 
            borderColor: 'rgba(255,0,0, 1)',
            borderWidth: 2,
            fill: false,
          },
          {
            label: "out heals",
            data: [],
            borderColor: 'rgba(0,0,255, 1)',
            borderWidth: 2,
            fill: false,
          },
          {
            label: "in heals",
            data: [],
            borderColor: 'rgb(255, 255, 255)',
            borderWidth: 2,
            fill: false,
          }],
        },
        options: {
          scales: {
            x: [{
              type: 'time',
              time: {
                parser: 'yyyy:MM:dd HH:mm:ss',
                unit: 'second',
                displayFormats: {
                  second: 'yyyy:MM:dd HH:mm:ss',
                },
              },
              scaleLabel: {
                display: true,
                labelString: 'Time',
              },
            }],
            y: {
              beginAtZero: true, // Ensure the scale starts at zero
              scaleLabel: {
                display: true,
                labelString: 'Value',
              },
            },
          },
        },
      });
    }

    let combineLabels = new Map();
    let dataDamage = new Map();
    let dataDamageInc = new Map();
    let dataHeals = new Map();
    let dataiHeals = new Map();
    
    combineLabels = aggregateData(combinedMap, 1);
    if (combineLabels.size >= 300 && combineLabels.size < 600) {
      combineLabels = aggregateData(combinedMap, 5);
      dataHeals = aggregateData(healMap, 5);
      dataiHeals = aggregateData(ihealMap, 5);
      dataDamage = aggregateData(damageMap, 5);
      dataDamageInc = aggregateData(damageIncMap, 5);
    } else if (combineLabels.size >= 600 && combineLabels.size < 900) {
      combineLabels = aggregateData(combineLabels, 10);
      dataHeals = aggregateData(healMap, 10);
      dataiHeals = aggregateData(ihealMap, 10);
      dataDamage = aggregateData(damageMap, 10);
      dataDamageInc = aggregateData(damageIncMap, 10);
    } else if (combineLabels.size >= 900) {
      combineLabels = aggregateData(combineLabels, 60);
      dataHeals = aggregateData(healMap, 60);
      dataiHeals = aggregateData(ihealMap, 60);
      dataDamage = aggregateData(damageMap, 60);
      dataDamageInc = aggregateData(damageIncMap, 60);
    } else {
      combineLabels = aggregateData(combineLabels, 1);
      dataHeals = aggregateData(healMap, 1);
      dataiHeals = aggregateData(ihealMap, 1);
      dataDamage = aggregateData(damageMap, 1);
      dataDamageInc = aggregateData(damageIncMap, 1);
    }

    console.log(dataDamageInc);

   const labels = Array.from(combineLabels.keys());
    const damageData = labels.map(timestamp => ({
      x: timestamp,
      y: dataDamage.get(timestamp),
    }));
    const healsData = labels.map(timestamp => ({
      x: timestamp,
      y: dataHeals.get(timestamp),
    }));
    const ihealsData = labels.map(timestamp => ({
      x: timestamp,
      y: dataiHeals.get(timestamp),
    }));
    const damageIncData = labels.map(timestamp => ({
      x: timestamp,
      y: dataDamageInc.get(timestamp),
    }));
    console.log(damageIncData);
    const sortedLabels = labels
    .map(timestamp => {
      const [datePart, timePart] = timestamp.split(' '); // Split into date and time parts
      const [year, month, day] = datePart.split(':').map(Number); // Extract year, month, day
      const [hours, minutes, seconds] = timePart.split(':').map(Number); // Extract hours, minutes, seconds
      return new Date(year, month - 1, day, hours, minutes, seconds).getTime(); // Construct Date object and get time in milliseconds
    })
    .sort((a, b) => a - b)
    .map(milliseconds => {
      const date = new Date(milliseconds);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const hh = String(date.getHours()).padStart(2, '0');
      const mi = String(date.getMinutes()).padStart(2, '0');
      const ss = String(date.getSeconds()).padStart(2, '0');
      return `${yyyy}:${mm}:${dd} ${hh}:${mi}:${ss}`; // Return formatted timestamp
    });
    chart.data.labels = sortedLabels;
    chart.data.datasets[0].data = damageData;
    chart.data.datasets[1].data = damageIncData;
    chart.data.datasets[2].data = healsData;
    chart.data.datasets[3].data = ihealsData;
    
    chart.update();
    const chartHeight = document.getElementById('damageChart').offsetHeight;

    const { width } = win.getContentBounds();
    win.setSize(width, chartHeight, true);
  }


  function aggregateData(data, interval) {
    const aggregatedData = new Map();
  
    for (const [timestamp, value] of data) {
      const roundedTimestamp = roundToInterval(timestamp, interval);
      aggregatedData.set(roundedTimestamp, (aggregatedData.get(roundedTimestamp) || 0) + value);
    }
  
    return aggregatedData;
  }
  
  function roundToInterval(timestamp, interval) {
    const [datePart, timePart] = timestamp.split(' '); // Split into date and time parts
    const [year, month, day] = datePart.split(':').map(Number); // Extract year, month, day
    const [hours, minutes, seconds] = timePart.split(':').map(Number); // Extract hours, minutes, seconds
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    const roundedSeconds = Math.floor(totalSeconds / interval) * interval;
    const newHours = Math.floor(roundedSeconds / 3600);
    const newMinutes = Math.floor((roundedSeconds % 3600) / 60);
    const newSeconds = roundedSeconds % 60;
    return `${pad(year)}:${pad(month)}:${pad(day)} ${pad(newHours)}:${pad(newMinutes)}:${pad(newSeconds)}`;
  }
  
  function pad(number) {
    return number.toString().padStart(2, '0');
  }