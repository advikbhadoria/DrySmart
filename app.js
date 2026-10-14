// app.js
// Added hash‑based routing for static‑host environments
// Shared simulation state and UI rendering for DrySmart IoT Dashboard

// ---------- Utility Functions ----------
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function saveState() {
  try {
    localStorage.setItem('drysmart_state', JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state', e);
  }
}

function loadState() {
  try {
    const saved = localStorage.getItem('drysmart_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Basic validation
      if (parsed && parsed.rooms && Array.isArray(parsed.rooms)) {
        // Upgrade legacy state if alerts are empty or all energies are zero
        if (!parsed.alerts || parsed.alerts.length === 0 || parsed.rooms.every(r => !r.energy || r.energy === 0)) {
          const fresh = generateInitialState();
          parsed.alerts = fresh.alerts;
          parsed.rooms = fresh.rooms;
        }
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Invalid saved state, resetting.', e);
  }
  return null;
}

function generateInitialState() {
  const now = Date.now();
  const rooms = [
    {
      id: 1,
      number: 'Room 1',
      occupied: true,
      drying: true,
      moisture: 42.5,
      fanOn: true,
      fanSpeed: 2,
      fanMode: 'auto',
      lightOn: true,
      brightness: 80,
      lightMode: 'auto',
      startTimestamp: now - 145000,
      elapsed: 145,
      estimatedTotal: 300,
      energy: 1.845,
    },
    {
      id: 2,
      number: 'Room 2',
      occupied: true,
      drying: false,
      moisture: 0,
      fanOn: false,
      fanSpeed: 1,
      fanMode: 'auto',
      lightOn: false,
      brightness: 50,
      lightMode: 'auto',
      startTimestamp: null,
      elapsed: 0,
      estimatedTotal: 300,
      energy: 0.620,
    },
    {
      id: 3,
      number: 'Room 3',
      occupied: true,
      drying: true,
      moisture: 8.5,
      fanOn: true,
      fanSpeed: 3,
      fanMode: 'manual',
      lightOn: true,
      brightness: 100,
      lightMode: 'manual',
      startTimestamp: now - 280000,
      elapsed: 280,
      estimatedTotal: 300,
      energy: 2.910,
    },
    {
      id: 4,
      number: 'Room 4',
      occupied: false,
      drying: false,
      moisture: 100,
      fanOn: true,
      fanSpeed: 1,
      fanMode: 'manual',
      lightOn: false,
      brightness: 0,
      lightMode: 'auto',
      startTimestamp: null,
      elapsed: 0,
      estimatedTotal: 300,
      energy: 1.150,
    },
    {
      id: 5,
      number: 'Room 5',
      occupied: true,
      drying: true,
      moisture: 68.0,
      fanOn: true,
      fanSpeed: 2,
      fanMode: 'auto',
      lightOn: true,
      brightness: 75,
      lightMode: 'auto',
      startTimestamp: now - 480000,
      elapsed: 480,
      estimatedTotal: 300,
      energy: 3.420,
    },
    {
      id: 6,
      number: 'Room 6',
      occupied: false,
      drying: false,
      moisture: 0,
      fanOn: false,
      fanSpeed: 1,
      fanMode: 'auto',
      lightOn: false,
      brightness: 0,
      lightMode: 'auto',
      startTimestamp: null,
      elapsed: 0,
      estimatedTotal: 300,
      energy: 0.280,
    },
    {
      id: 7,
      number: 'Room 7',
      occupied: true,
      drying: true,
      moisture: 18.0,
      fanOn: true,
      fanSpeed: 1,
      fanMode: 'auto',
      lightOn: true,
      brightness: 60,
      lightMode: 'auto',
      startTimestamp: now - 210000,
      elapsed: 210,
      estimatedTotal: 300,
      energy: 1.475,
    },
    {
      id: 8,
      number: 'Room 8',
      occupied: true,
      drying: false,
      moisture: 95.0,
      fanOn: false,
      fanSpeed: 1,
      fanMode: 'auto',
      lightOn: false,
      brightness: 100,
      lightMode: 'auto',
      startTimestamp: null,
      elapsed: 0,
      estimatedTotal: 300,
      energy: 0.890,
    },
  ];

  const alerts = [
    {
      id: 1,
      roomId: 3,
      message: 'Fan running with dry clothes (moisture 8.5%)',
      severity: 'warning',
      timestamp: new Date(now - 12 * 60 * 1000).toISOString(),
      acknowledged: false,
    },
    {
      id: 2,
      roomId: 5,
      message: 'Drying cycle overdue (elapsed > 1.5x estimate)',
      severity: 'danger',
      timestamp: new Date(now - 25 * 60 * 1000).toISOString(),
      acknowledged: false,
    },
    {
      id: 3,
      roomId: 4,
      message: 'Fan running in vacant room (manual mode)',
      severity: 'warning',
      timestamp: new Date(now - 42 * 60 * 1000).toISOString(),
      acknowledged: false,
    },
    {
      id: 4,
      roomId: 2,
      message: 'Light left ON in vacant room (auto shut-off executed)',
      severity: 'info',
      timestamp: new Date(now - 75 * 60 * 1000).toISOString(),
      acknowledged: true,
    },
    {
      id: 5,
      roomId: 6,
      message: 'Cycle completed: 100% dry (duration: 4m 52s)',
      severity: 'info',
      timestamp: new Date(now - 120 * 60 * 1000).toISOString(),
      acknowledged: true,
    },
    {
      id: 6,
      roomId: 8,
      message: 'Rapid humidity spike detected (sensor check recommended)',
      severity: 'warning',
      timestamp: new Date(now - 180 * 60 * 1000).toISOString(),
      acknowledged: true,
    },
  ];

  return {
    rooms,
    alerts,
    settings: {
      fanPowerPerSpeed: 50, // watts per speed level
      lightPowerBase: 10, // max watts at 100% brightness
      autoFanWhenDry: true,
      autoLightWhenVacant: true,
    },
    lastTick: now,
  };
}

let state = loadState() || generateInitialState();

// ---------- Simulation Loop ----------
function tick() {
  const now = Date.now();
  const deltaSec = (now - state.lastTick) / 1000;
  state.lastTick = now;

  state.rooms.forEach((room) => {
    if (room.drying) {
      // Update elapsed time
      room.elapsed += deltaSec;
      // Simple linear drying based on moisture decreasing
      const moistureDropRate = 0.2; // % per second
      room.moisture = Math.max(0, room.moisture - moistureDropRate * deltaSec);

      // Auto fan off when dry enough
      if (room.fanMode === 'auto' && room.moisture <= 10) {
        room.fanOn = false;
      }

      // Auto light off when room vacant
      if (room.lightMode === 'auto' && !room.occupied) {
        room.lightOn = false;
      }
    }

    // Energy calculation (watts to kWh)
    const fanPower = room.fanOn ? state.settings.fanPowerPerSpeed * room.fanSpeed : 0;
    const lightPower = room.lightOn ? (state.settings.lightPowerBase * room.brightness) / 100 : 0;
    const totalPowerW = fanPower + lightPower;
    const energyThisTick = (totalPowerW * deltaSec) / 3600; // kWh
    room.energy = +(room.energy + energyThisTick).toFixed(6);
  });

  // Alert generation
  generateAlerts();
  saveState();
  refreshUI(); // lightweight UI update
}

setInterval(tick, 1000);

// ---------- Alerts ----------
let alertIdCounter = state.alerts.reduce((max, a) => Math.max(max, a.id), 6);
function generateAlerts() {
  state.rooms.forEach((room) => {
    // Dry clothes with fan still running
    if (room.drying && room.moisture <= 10 && room.fanOn) {
      addAlert(room.id, 'Fan running with dry clothes', 'warning');
    }
    // Fan running in vacant rooms
    if (!room.occupied && room.fanOn) {
      addAlert(room.id, 'Fan running in vacant room', 'warning');
    }
    // Overdue drying (elapsed > estimatedTotal * 1.5)
    if (room.drying && room.elapsed > room.estimatedTotal * 1.5) {
      addAlert(room.id, 'Drying cycle overdue', 'danger');
    }
  });
}

function addAlert(roomId, message, severity) {
  const existing = state.alerts.find((a) => a.roomId === roomId && a.message === message && !a.acknowledged);
  if (existing) return; // avoid duplicates
  state.alerts.push({
    id: ++alertIdCounter,
    roomId,
    message,
    severity, // 'info', 'warning', 'danger'
    timestamp: new Date().toISOString(),
    acknowledged: false,
  });
}

function acknowledgeAlert(id) {
  const alert = state.alerts.find((a) => a.id === id);
  if (alert) alert.acknowledged = true;
  saveState();
  renderCurrentPage();
}

// ---------- Navigation ----------
function initNavigation() {
  $$(".nav-link").forEach((link) => {
    // Ensure the link's href reflects the page for bookmarkability
    link.href = `#${link.dataset.page}`;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.dataset.page;
      // Update URL hash without scrolling
      if (window.location.hash !== `#${page}`) {
        history.pushState(null, '', `#${page}`);
      }
      setActivePage(page);
    });
  });
}

function setActivePage(page) {
  // Update active link styling
  $$(".nav-link").forEach((l) => l.classList.toggle('active', l.dataset.page === page));
  // Render page
  renderPage(page);
  // Store current page for refreshes
  state.currentPage = page;
  saveState();
  // Keep URL hash in sync (fallback for direct calls without initNavigation)
  if (window.location.hash !== `#${page}`) {
    history.replaceState(null, '', `#${page}`);
  }
}

function renderCurrentPage() {
  // On first load try to restore page from URL hash
  const hashPage = window.location.hash ? window.location.hash.substring(1) : null;
  const page = hashPage || state.currentPage || 'student';
  setActivePage(page);
}

// ---------- Page Renderers ----------
function renderPage(page) {
  const content = $('#content');
  switch (page) {
    case 'overview':
      content.innerHTML = renderOverview();
      break;
    case 'student':
      content.innerHTML = renderStudentDashboard();
      attachStudentEvents();
      break;
    case 'warden':
      content.innerHTML = renderWardenDashboard();
      attachWardenEvents();
      break;
    case 'rooms':
      content.innerHTML = renderRoomsPage();
      attachRoomsEvents();
      break;
    case 'analytics':
      content.innerHTML = renderAnalyticsPage();
      drawAnalyticsCharts();
      break;
    case 'alerts':
      content.innerHTML = renderAlertsPage();
      attachAlertsEvents();
      break;
    case 'settings':
      content.innerHTML = renderSettingsPage();
      attachSettingsEvents();
      break;
    case 'about':
      content.innerHTML = renderAboutPage();
      break;
    default:
      content.innerHTML = `<h2>Page not found</h2>`;
  }
}

// ---------- Overview ----------
function renderOverview() {
  const totalRooms = state.rooms.length;
  const occupied = state.rooms.filter((r) => r.occupied).length;
  const activeDrying = state.rooms.filter((r) => r.drying).length;
  const fansRunning = state.rooms.filter((r) => r.fanOn).length;
  const totalEnergy = state.rooms.reduce((sum, r) => sum + r.energy, 0).toFixed(3);

  return `
    <section class="active">
      <h2>Dashboard Overview</h2>
      <div class="cards">
        ${card('Total Rooms', totalRooms)}
        ${card('Occupied Rooms', occupied)}
        ${card('Active Drying Cycles', activeDrying)}
        ${card('Fans Running', fansRunning)}
        ${card('Estimated Energy (kWh)', totalEnergy)}
        ${card('Active Alerts', state.alerts.filter(a=>!a.acknowledged).length)}
      </div>
    </section>
  `;
}

function card(title, value) {
  return `<div class="card"><h3>${title}</h3><p>${value}</p></div>`;
}

// ---------- Student Dashboard ----------
function renderStudentDashboard() {
  const occupiedRooms = state.rooms.filter(r => r.occupied);
  const options = occupiedRooms.map(r => `<option value="${r.id}">${r.number}</option>`).join('');
  return `
    <section class="active">
      <h2>Student Dashboard</h2>
      <div class="card">
        <label for="student-room-select">Select Your Room:</label>
        <select id="student-room-select" class="select">${options}</select>
      </div>
      <div id="student-room-view"></div>
    </section>
  `;
}

function attachStudentEvents() {
  const select = $('#student-room-select');
  if (!select) return;
  select.addEventListener('change', () => renderStudentRoom(select.value));
  // Auto‑render first room if exists
  if (select.options.length) renderStudentRoom(select.value);
}

function renderStudentRoom(roomId) {
  const room = state.rooms.find(r => r.id == roomId);
  if (!room) return;
  const container = $('#student-room-view');
  if (!container) return;
  container.innerHTML = `
    <div class="card">
      <h3>${room.number}</h3>
      <p>Occupancy: ${room.occupied ? 'Occupied' : 'Vacant'}</p>
      <p>Moisture: ${room.moisture.toFixed(1)}%</p>
      <p>Drying: ${room.drying ? 'In progress' : 'Stopped'}</p>
      <p>Elapsed: ${Math.floor(room.elapsed)}s / ${room.estimatedTotal}s</p>
      <p>Estimated Energy: ${room.energy.toFixed(3)} kWh</p>
      <div>
        <button class="btn" id="start-btn">Start</button>
        <button class="btn secondary" id="pause-btn">Pause</button>
        <button class="btn secondary" id="resume-btn">Resume</button>
        <button class="btn secondary" id="stop-btn">Stop</button>
        <button class="btn secondary" id="reset-btn">Reset</button>
      </div>
      <hr/>
      <div>
        <h4>Fan Control</h4>
        <label><input type="checkbox" id="fan-toggle" ${room.fanOn ? 'checked' : ''}> Fan ON/OFF</label>
        <label>Speed:
          <select id="fan-speed" class="select">
            <option value="1" ${room.fanSpeed===1?'selected':''}>Low</option>
            <option value="2" ${room.fanSpeed===2?'selected':''}>Medium</option>
            <option value="3" ${room.fanSpeed===3?'selected':''}>High</option>
          </select>
        </label>
        <label>Mode:
          <select id="fan-mode" class="select">
            <option value="auto" ${room.fanMode==='auto'?'selected':''}>Auto</option>
            <option value="manual" ${room.fanMode==='manual'?'selected':''}>Manual</option>
          </select>
        </label>
      </div>
      <hr/>
      <div>
        <h4>Light Control</h4>
        <label><input type="checkbox" id="light-toggle" ${room.lightOn ? 'checked' : ''}> Light ON/OFF</label>
        <label>Brightness:
          <input type="range" id="light-brightness" min="0" max="100" value="${room.brightness}">
        </label>
        <label>Mode:
          <select id="light-mode" class="select">
            <option value="auto" ${room.lightMode==='auto'?'selected':''}>Auto</option>
            <option value="manual" ${room.lightMode==='manual'?'selected':''}>Manual</option>
          </select>
        </label>
      </div>
    </div>
  `;
  // Attach controls
  $('#start-btn').onclick = () => { room.drying = true; room.startTimestamp = Date.now(); saveState(); renderStudentRoom(room.id); };
  $('#pause-btn').onclick = () => { room.drying = false; saveState(); renderStudentRoom(room.id); };
  $('#resume-btn').onclick = () => { room.drying = true; saveState(); renderStudentRoom(room.id); };
  $('#stop-btn').onclick = () => { room.drying = false; room.moisture = 0; saveState(); renderStudentRoom(room.id); };
  $('#reset-btn').onclick = () => { room.drying = false; room.moisture = 100; room.elapsed = 0; room.energy = 0; room.fanOn = false; room.lightOn = false; saveState(); renderStudentRoom(room.id); };

  $('#fan-toggle').onchange = (e) => { room.fanOn = e.target.checked; saveState(); };
  $('#fan-speed').onchange = (e) => { room.fanSpeed = Number(e.target.value); saveState(); };
  $('#fan-mode').onchange = (e) => { room.fanMode = e.target.value; saveState(); };

  $('#light-toggle').onchange = (e) => { room.lightOn = e.target.checked; saveState(); };
  $('#light-brightness').oninput = (e) => { room.brightness = Number(e.target.value); saveState(); };
  $('#light-mode').onchange = (e) => { room.lightMode = e.target.value; saveState(); };
}

// ---------- Warden Dashboard ----------
function renderWardenDashboard() {
  const totalRooms = state.rooms.length;
  const occupied = state.rooms.filter(r=>r.occupied).length;
  const activeDrying = state.rooms.filter(r=>r.drying).length;
  const fansRunning = state.rooms.filter(r=>r.fanOn).length;
  const totalEnergy = state.rooms.reduce((s,r)=>s+r.energy,0).toFixed(3);
  const activeAlerts = state.alerts.filter(a=>!a.acknowledged).length;

  const rows = state.rooms.map(r => `
    <tr data-id="${r.id}">
      <td>${r.number}</td>
      <td>${r.occupied ? 'Occupied' : 'Vacant'}</td>
      <td>${r.moisture.toFixed(1)}%</td>
      <td>${r.fanOn ? 'ON' : 'OFF'}</td>
      <td>${r.lightOn ? 'ON' : 'OFF'}</td>
      <td>${r.energy.toFixed(3)} kWh</td>
      <td>${state.alerts.filter(a=>a.roomId===r.id && !a.acknowledged).map(a=>`<span class="alert-${a.severity}">${a.message}</span>`).join(', ')}</td>
      <td>
        <button class="btn secondary view-details" data-id="${r.id}">View</button>
        <button class="btn secondary stop-fan" data-id="${r.id}">Stop Fan</button>
      </td>
    </tr>
  `).join('');

  return `
    <section class="active">
      <h2>Warden Dashboard</h2>
      <div class="cards">
        ${card('Total Rooms', totalRooms)}
        ${card('Occupied Rooms', occupied)}
        ${card('Active Drying', activeDrying)}
        ${card('Fans Running', fansRunning)}
        ${card('Total Energy (kWh)', totalEnergy)}
        ${card('Active Alerts', activeAlerts)}
      </div>
      <div class="card">
        <h3>Rooms Overview</h3>
        <input type="text" id="warden-search" placeholder="Search rooms..." class="input"/>
        <table class="table" id="warden-table">
          <thead>
            <tr>
              <th data-sort="number">Room</th>
              <th>Occupancy</th>
              <th>Moisture</th>
              <th>Fan</th>
              <th>Light</th>
              <th>Energy</th>
              <th>Alerts</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        <button class="btn" id="warden-refresh">Refresh Dashboard</button>
      </div>
    </section>
  `;
}

function attachWardenEvents() {
  // Search filter
  $('#warden-search').addEventListener('input', (e) => {
    const filter = e.target.value.toLowerCase();
    $$('#warden-table tbody tr').forEach(tr => {
      const txt = tr.textContent.toLowerCase();
      tr.style.display = txt.includes(filter) ? '' : 'none';
    });
  });

  // Refresh button preserving state
  $('#warden-refresh').onclick = () => { renderWardenDashboard(); attachWardenEvents(); };

  // Stop fan action
  $$(".stop-fan").forEach(btn => {
    btn.onclick = () => {
      const id = Number(btn.dataset.id);
      const room = state.rooms.find(r=>r.id===id);
      if (room) { room.fanOn = false; saveState(); renderWardenDashboard(); attachWardenEvents(); }
    };
  });

  // View details – for demo we reuse student view
  $$(".view-details").forEach(btn => {
    btn.onclick = () => {
      const id = Number(btn.dataset.id);
      // Switch to student page with that room pre‑selected
      setActivePage('student');
      const select = $('#student-room-select');
      if (select) { select.value = id; renderStudentRoom(id); }
    };
  });

  // Sorting functionality
  const sortState = {};
  $$('#warden-table th[data-sort]').forEach(th => {
    th.style.cursor = 'pointer';
    th.onclick = () => {
      const key = th.dataset.sort;
      const asc = !(sortState[key] && sortState[key].asc);
      sortState[key] = { asc };
      state.rooms.sort((a, b) => {
        let av = a[key];
        let bv = b[key];
        // Special handling for number (room number string like "Room 1")
        if (key === 'number') {
          av = Number(av.replace(/[^0-9]/g, ''));
          bv = Number(bv.replace(/[^0-9]/g, ''));
        }
        // Convert booleans to numbers for sorting
        if (typeof av === 'boolean') av = av ? 1 : 0;
        if (typeof bv === 'boolean') bv = bv ? 1 : 0;
        if (av < bv) return asc ? -1 : 1;
        if (av > bv) return asc ? 1 : -1;
        return 0;
      });
      renderWardenDashboard();
      attachWardenEvents();
    };
  });

  // Re‑attach listeners after any dynamic re‑render (stop‑fan, view‑details) are already handled above
}
// Duplicate attachWardenEvents block removed

// ---------- Rooms Page ----------
function renderRoomsPage() {
  const rows = state.rooms.map(r => `
    <tr>
      <td>${r.number}</td>
      <td>${r.occupied ? 'Occupied' : 'Vacant'}</td>
      <td>${r.moisture.toFixed(1)}%</td>
      <td>${r.fanOn ? 'ON' : 'OFF'}</td>
      <td>${r.lightOn ? 'ON' : 'OFF'}</td>
      <td>${r.energy.toFixed(3)} kWh</td>
    </tr>
  `).join('');
  return `
    <section class="active">
      <h2>All Rooms</h2>
      <input type="text" id="rooms-search" placeholder="Search..." class="input"/>
      <table class="table" id="rooms-table">
        <thead>
          <tr><th>Room</th><th>Occupancy</th><th>Moisture</th><th>Fan</th><th>Light</th><th>Energy (kWh)</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </section>
  `;
}

function attachRoomsEvents() {
  $('#rooms-search').addEventListener('input', e => {
    const filter = e.target.value.toLowerCase();
    $$('#rooms-table tbody tr').forEach(tr => {
      tr.style.display = tr.textContent.toLowerCase().includes(filter) ? '' : 'none';
    });
  });
}

// ---------- Analytics ----------
function renderAnalyticsPage() {
  const totalEnergy = state.rooms.reduce((s, r) => s + r.energy, 0);
  const totalEnergyStr = totalEnergy.toFixed(2);
  const highestRoom = state.rooms.reduce((prev, curr) => (curr.energy > prev.energy ? curr : prev), state.rooms[0]);
  const estimatedCost = (totalEnergy * 7.5).toFixed(2); // estimated ₹7.5 / kWh
  const energySaved = (totalEnergy * 0.32).toFixed(2); // 32% automated energy reduction

  return `
    <section class="active">
      <h2>Energy Analytics & Consumption</h2>

      <div class="cards">
        <div class="card">
          <h3>Total Energy Consumed</h3>
          <p id="stat-total-energy">${totalEnergyStr} <span style="font-size: 0.9rem; font-weight: 500; color: #6c757d;">kWh</span></p>
        </div>
        <div class="card">
          <h3>Estimated Cost</h3>
          <p id="stat-cost">₹${estimatedCost}</p>
        </div>
        <div class="card">
          <h3>Automated Savings</h3>
          <p id="stat-saved" style="color: #28a745;">${energySaved} <span style="font-size: 0.9rem; font-weight: 500;">kWh (32%)</span></p>
        </div>
        <div class="card">
          <h3>Peak Consumer</h3>
          <p style="color: #003566;">${highestRoom ? highestRoom.number : 'None'}</p>
        </div>
      </div>

      <div class="analytics-grid">
        <div class="card">
          <h3>Real-time Room Energy (kWh)</h3>
          <div class="chart-container">
            <canvas id="energyChart"></canvas>
          </div>
        </div>

        <div>
          <div class="card">
            <h3>Subsystem Load Distribution</h3>
            <div style="margin-bottom: 1.2rem;">
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.3rem;">
                <strong>Exhaust & Drying Fans (78%)</strong>
                <span id="stat-fan-load">${(totalEnergy * 0.78).toFixed(2)} kWh</span>
              </div>
              <div class="progress-bar-container">
                <div class="progress-bar-fill" style="width: 78%; background: #0062cc;"></div>
              </div>
            </div>
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.3rem;">
                <strong>Smart Lighting (22%)</strong>
                <span id="stat-light-load">${(totalEnergy * 0.22).toFixed(2)} kWh</span>
              </div>
              <div class="progress-bar-container">
                <div class="progress-bar-fill" style="width: 22%; background: #17a2b8;"></div>
              </div>
            </div>
          </div>

          <div class="card">
            <h3>Hostel Eco-Efficiency Score</h3>
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.8rem;">
              <span style="font-size: 2.4rem; font-weight: 800; color: #28a745; line-height: 1;">A</span>
              <div>
                <strong style="color: #212529;">High Energy Efficiency</strong>
                <p style="font-size: 0.82rem; color: #6c757d; margin: 0;">Automated sensors prevented 3.8 hrs of unnecessary fan usage today.</p>
              </div>
            </div>
            <hr style="margin: 0.8rem 0; border: none; border-top: 1px solid #e9ecef;" />
            <p style="font-size: 0.82rem; color: #495057; line-height: 1.4;">
              <strong>Smart Recommendation:</strong> Room 3 & Room 4 have manual overrides active. Switching back to Auto mode can save an additional ~1.4 kWh daily.
            </p>
          </div>
        </div>
      </div>
    </section>
  `;
}

let energyChart = null;
function drawAnalyticsCharts() {
  const canvas = $('#energyChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  if (energyChart) {
    energyChart.destroy();
    energyChart = null;
  }

  const labels = state.rooms.map(r => r.number);
  const dataVals = state.rooms.map(r => Number(r.energy.toFixed(3)));

  energyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Estimated Energy (kWh)',
        data: dataVals,
        backgroundColor: 'rgba(0, 98, 204, 0.6)',
        borderColor: 'rgba(0, 98, 204, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          suggestedMax: 5,
          title: {
            display: true,
            text: 'Energy (kWh)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Rooms'
          }
        }
      }
    }
  });
}

// ---------- Alerts Page ----------
function renderAlertsPage() {
  const activeAlerts = state.alerts.filter(a => !a.acknowledged);
  const dangerCount = state.alerts.filter(a => a.severity === 'danger' && !a.acknowledged).length;
  const warningCount = state.alerts.filter(a => a.severity === 'warning' && !a.acknowledged).length;
  const resolvedCount = state.alerts.filter(a => a.acknowledged).length;

  const rows = state.alerts.map(a => `
    <tr class="${a.acknowledged ? 'ack' : ''}">
      <td>#${a.id}</td>
      <td><strong>${a.roomId ? 'Room ' + a.roomId : '-'}</strong></td>
      <td><span class="badge alert-${a.severity}">${a.severity}</span></td>
      <td>${a.message}</td>
      <td>${new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
      <td>${a.acknowledged ? '<span style="color: #28a745; font-weight: 600;">✓ Resolved</span>' : `<button class="btn secondary ack-btn" data-id="${a.id}">Acknowledge</button>`}</td>
    </tr>
  `).join('');

  return `
    <section class="active">
      <h2>System Alerts & Activity</h2>
      
      <div class="cards">
        <div class="card">
          <h3>Active Alerts</h3>
          <p style="color: ${activeAlerts.length ? '#d9534f' : '#28a745'}">${activeAlerts.length}</p>
        </div>
        <div class="card">
          <h3>Critical (Danger)</h3>
          <p style="color: #d9534f">${dangerCount}</p>
        </div>
        <div class="card">
          <h3>Warnings</h3>
          <p style="color: #f0ad4e">${warningCount}</p>
        </div>
        <div class="card">
          <h3>Resolved Today</h3>
          <p style="color: #28a745">${resolvedCount}</p>
        </div>
      </div>

      <div class="card">
        <h3>Live Alert Feed</h3>
        <table class="table" id="alerts-table">
          <thead><tr><th>ID</th><th>Room</th><th>Severity</th><th>Message</th><th>Time</th><th>Action</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>
  `;
}

function attachAlertsEvents() {
  $$(".ack-btn").forEach(btn => {
    btn.onclick = () => {
      const id = Number(btn.dataset.id);
      acknowledgeAlert(id);
    };
  });
}

// ---------- Settings ----------
function renderSettingsPage() {
  const s = state.settings;
  return `
    <section class="active">
      <h2>Settings</h2>
      <div class="card">
        <h4>Power Assumptions</h4>
        <label>Fan power per speed (W): <input type="number" id="setting-fan-power" value="${s.fanPowerPerSpeed}" class="input"/></label>
        <label>Light max power (W): <input type="number" id="setting-light-power" value="${s.lightPowerBase}" class="input"/></label>
      </div>
      <div class="card">
        <h4>Automation</h4>
        <label><input type="checkbox" id="setting-auto-fan" ${s.autoFanWhenDry ? 'checked' : ''}> Auto‑turn fan off when dry</label>
        <label><input type="checkbox" id="setting-auto-light" ${s.autoLightWhenVacant ? 'checked' : ''}> Auto‑turn light off when vacancy</label>
      </div>
      <button class="btn" id="reset-settings">Reset to Default</button>
    </section>
  `;
}

function attachSettingsEvents() {
  $('#setting-fan-power').onchange = (e) => { state.settings.fanPowerPerSpeed = Number(e.target.value); saveState(); };
  $('#setting-light-power').onchange = (e) => { state.settings.lightPowerBase = Number(e.target.value); saveState(); };
  $('#setting-auto-fan').onchange = (e) => { state.settings.autoFanWhenDry = e.target.checked; saveState(); };
  $('#setting-auto-light').onchange = (e) => { state.settings.autoLightWhenVacant = e.target.checked; saveState(); };
  $('#reset-settings').onclick = () => {
    if (confirm('Reset all settings and simulation data to defaults?')) {
      state = generateInitialState();
      saveState();
      initNavigation();
      renderCurrentPage();
    }
  };
}

// ---------- About ----------
function renderAboutPage() {
  return `
    <section class="active">
      <h2>About DrySmart</h2>
      <p>Many hostel rooms waste energy by running fans and lights while clothes are already dry or rooms are vacant. DrySmart provides a simulated IoT platform that monitors drying cycles, automatically controls fans and lights, and gives wardens an overview of energy consumption.</p>
      <p>This demo runs entirely in the browser – no real hardware is connected. It showcases how a real‑world system could visualise data, trigger alerts, and allow both students and wardens to interact with the environment.</p>
      <h3>Features</h3>
      <ul>
        <li>Room‑by‑room drying simulation</li>
        <li>Automatic fan and light control (demo only)</li>
        <li>Energy consumption estimation</li>
        <li>Alerts for wasteful operation</li>
        <li>Responsive UI with charts</li>
      </ul>
    </section>
  `;
}

// ---------- Initialization ----------
function initApp() {
  initNavigation();
  renderCurrentPage(); // initial load uses full render
}

document.addEventListener('DOMContentLoaded', initApp);

// ---------- UI Refresh ----------
function refreshUI() {
  const page = state.currentPage || 'overview';
  if (page === 'overview') {
    // Only update overview cards
    const content = $('#content');
    if (content) content.innerHTML = renderOverview();
  } else if (page === 'student') {
    const select = $('#student-room-select');
    if (select && select.value) {
      renderStudentRoom(select.value);
    }
  } else if (page === 'warden') {
    // Update summary cards and alerts count without full table re‑render
    const content = $('#content');
    if (content) {
      // Re‑render the whole warden page is acceptable as it is less frequent than every second
      renderWardenDashboard();
      attachWardenEvents();
    }
  } else if (page === 'analytics') {
    if (energyChart && $('#energyChart')) {
      energyChart.data.datasets[0].data = state.rooms.map(r => Number(r.energy.toFixed(3)));
      energyChart.update('none'); // Update data in-place without triggering animations/resizes
    }
    const totalEnergy = state.rooms.reduce((s, r) => s + r.energy, 0);
    const totalEl = $('#stat-total-energy');
    if (totalEl) totalEl.innerHTML = `${totalEnergy.toFixed(2)} <span style="font-size: 0.9rem; font-weight: 500; color: #6c757d;">kWh</span>`;
    const costEl = $('#stat-cost');
    if (costEl) costEl.textContent = `₹${(totalEnergy * 7.5).toFixed(2)}`;
    const savedEl = $('#stat-saved');
    if (savedEl) savedEl.innerHTML = `${(totalEnergy * 0.32).toFixed(2)} <span style="font-size: 0.9rem; font-weight: 500;">kWh (32%)</span>`;
    const fanEl = $('#stat-fan-load');
    if (fanEl) fanEl.textContent = `${(totalEnergy * 0.78).toFixed(2)} kWh`;
    const lightEl = $('#stat-light-load');
    if (lightEl) lightEl.textContent = `${(totalEnergy * 0.22).toFixed(2)} kWh`;
  }
}


// End of app.js
