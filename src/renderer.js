// renderer.js
const { ipcRenderer } = window.electron;

ipcRenderer.on('update-values', (event, values) => {
  document.getElementById('damageOut').textContent = `Damage: ${values.damageOut}`;
  document.getElementById('heals').textContent = `Heals: ${values.heals}`;
  document.getElementById('dps').textContent = `DPS: ${values.dps}`;
  document.getElementById('hps').textContent = `HPS: ${values.hps}`;
});

// Add event listener for the 'Select Chat Log' button
document.getElementById('selectFile').addEventListener('click', () => {
    ipcRenderer.send('select-file');
  });