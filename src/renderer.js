// renderer.js
const { ipcRenderer } = window.electron;

ipcRenderer.on('load-table-data', (event, spellData) => {
    loadTableData(spellDataToArray(spellData));
});
ipcRenderer.on('update-table-data', (event, updatedSpellData) => {
  loadTableData(spellDataToArray(updatedSpellData));
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

document.getElementById('openTableButton').addEventListener('click', () => {
  ipcRenderer.send('open-table-window');
});

ipcRenderer.on('update-values', (event, values) => {
  document.getElementById('damageOut').textContent = `Damage: ${values.damageOut}`;
  document.getElementById('heals').textContent = `Heals: ${values.heals}`;
  document.getElementById('dps').textContent = `DPS: ${values.dps}`;
  document.getElementById('hps').textContent = `HPS: ${values.hps}`;

  document.getElementById('damageInc').textContent = `Inc Damage: ${values.damageInc}`;
  document.getElementById('idps').textContent = `IDPS: ${values.idps}`;
});

document.getElementById('selectFile').addEventListener('click', () => {
    ipcRenderer.send('select-file');
  });

  let damageMap = new Map();
  let healMap = new Map();
  let combinedMap = new Map();
  let damageIncMap = new Map();
  let chart;

  ipcRenderer.on('update-damage-map', (_, updatedDamageMap) => {
    console.log(updatedDamageMap);
    damageMap = new Map(updatedDamageMap);
    updateChart("damage");
  });

  ipcRenderer.on('update-chart-map', (_, updatedDamageMap, updatedHealsMap, updatedDamageIncMap, updatedCombinedMap) => {
    damageMap = new Map(updatedDamageMap);
    healMap = new Map(updatedHealsMap);
    combinedMap = new Map(updatedCombinedMap)
    damageIncMap = new Map(updatedDamageIncMap)
    updateChart();
  });

  ipcRenderer.on('update-header', (_, loggingEnabled) => {
    changeHeaderColor(loggingEnabled);
  });

  function changeHeaderColor(logLine) {
    console.log(logLine);
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
            label: "damage",
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
            label: "heals",
            data: [],
            borderColor: 'rgba(0,0,255, 1)',
            borderWidth: 2,
            fill: false,
          }],
        },
        options: {
          scales: {
            x: [{
              type: 'time',
              time: {
                parser: 'HH:mm:ss',
                unit: 'second',
                displayFormats: {
                  second: 'HH:mm:ss',
                },
              },
              scaleLabel: {
                display: true,
                labelString: 'Time',
              },
            }],
            // y: {
            //   scaleLabel: {
            //     display: true,
            //     labelString: "",
            //   },
            // },
          },
        },
      });
    }

    let combineLabels = new Map();
    let dataDamage = new Map();
    let dataDamageInc = new Map();
    let dataHeals = new Map();
    combineLabels = aggregateData(combinedMap, 1);

    if (combineLabels.size >= 300 && combineLabels.size < 600) {
      combineLabels = aggregateData(combinedMap, 5);
      dataHeals = aggregateData(healMap, 5);
      dataDamage = aggregateData(damageMap, 5);
      dataDamageInc = aggregateData(damageIncMap, 5);
    } else if (combineLabels.size >= 600 && combineLabels.size < 900) {
      combineLabels = aggregateData(combinedMap, 10);
      dataHeals = aggregateData(healMap, 10);
      dataDamage = aggregateData(damageMap, 10);
      dataDamageInc = aggregateData(damageIncMap, 10);
    } else if (combineLabels.size >= 900) {
      combineLabels = aggregateData(combinedMap, 60);
      dataHeals = aggregateData(healMap, 60);
      dataDamage = aggregateData(damageMap, 60);
      dataDamageInc = aggregateData(damageIncMap, 60);
    } else {
      combineLabels = aggregateData(combinedMap, 1);
      dataHeals = aggregateData(healMap, 1);
      dataDamage = aggregateData(damageMap, 1);
      dataDamageInc = aggregateData(damageIncMap, 1);
    }

   const labels = Array.from(combineLabels.keys());

    const damageData = labels.map(timestamp => ({
      x: timestamp,
      y: dataDamage.get(timestamp),
    }));
    const healsData = labels.map(timestamp => ({
      x: timestamp,
      y: dataHeals.get(timestamp),
    }));
    const damageIncData = labels.map(timestamp => ({
      x: timestamp,
      y: dataDamageInc.get(timestamp),
    }));

    const sortedLabels = labels
      .map(timestamp => {
        const [hours, minutes, seconds] = timestamp.split(':');
        return new Date(1970, 0, 1, hours, minutes, seconds).getTime();
      })
      .sort((a, b) => a - b)
      .map(milliseconds => {
        const date = new Date(milliseconds);
        const hh = String(date.getHours()).padStart(2, '0');
        const mm = String(date.getMinutes()).padStart(2, '0');
        const ss = String(date.getSeconds()).padStart(2, '0');
        return `${hh}:${mm}:${ss}`;
      });

    chart.data.labels = sortedLabels;
    chart.data.datasets[0].data = damageData;
    chart.data.datasets[1].data = damageIncData;
    chart.data.datasets[2].data = healsData;
    
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
    const [hours, minutes, seconds] = timestamp.split(':').map(Number);
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    const roundedSeconds = Math.floor(totalSeconds / interval) * interval;
    const newHours = Math.floor(roundedSeconds / 3600);
    const newMinutes = Math.floor((roundedSeconds % 3600) / 60);
    const newSeconds = roundedSeconds % 60;
    return `${pad(newHours)}:${pad(newMinutes)}:${pad(newSeconds)}`;
  }
  
  function pad(number) {
    return number.toString().padStart(2, '0');
  }