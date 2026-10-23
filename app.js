// app.js
// DrySmart IoT Intelligent Clothes Drying & Energy Automation
// Shared simulation state, real-time telemetry, dynamic animations, and rich UI rendering

// ---------- Utility Functions ----------
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function showToast(message, type = 'info') {
  const container = $('#toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

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
      if (parsed && parsed.rooms && Array.isArray(parsed.rooms)) {
        if (!parsed.alerts || parsed.alerts.length === 0 || parsed.rooms.every((r) => !r.energy || r.energy === 0)) {
          const fresh = generateInitialState();
          parsed.alerts = fresh.alerts;
          parsed.rooms = fresh.rooms;
        }
        if (parsed.currentPage === 'overview') {
          parsed.currentPage = 'student';
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
      energy: 0.62,
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
      energy: 2.91,
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
      energy: 1.15,
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
      energy: 3.42,
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
      energy: 0.28,
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
      energy: 0.89,
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
      fanPowerPerSpeed: 50,
      lightPowerBase: 10,
      autoFanWhenDry: true,
      autoLightWhenVacant: true,
    },
    lastTick: now,
    wardenViewMode: 'grid', // 'grid' or 'table'
    selectedAlertFilter: 'all',
    selectedRoomsFilter: 'all',
  };
}

let state = loadState() || generateInitialState();

// ---------- Live Header Clock ----------
function initHeaderClock() {
  const clockEl = $('#live-clock');
  function updateClock() {
    if (clockEl) {
      const d = new Date();
      clockEl.textContent = d.toLocaleTimeString([], { hour12: false });
    }
  }
  setInterval(updateClock, 1000);
  updateClock();

  // Enforce white and blue glass theme
  document.documentElement.setAttribute('data-theme', 'white-blue');
}

// ---------- Simulation Loop ----------
function tick() {
  const now = Date.now();
  const deltaSec = (now - state.lastTick) / 1000;
  state.lastTick = now;

  state.rooms.forEach((room) => {
    if (room.drying) {
      room.elapsed += deltaSec;
      const moistureDropRate = 0.25; // % per second
      room.moisture = Math.max(0, room.moisture - moistureDropRate * deltaSec);

      // Auto fan off when dry enough
      if (room.fanMode === 'auto' && room.moisture <= 10) {
        room.fanOn = false;
        room.drying = false;
        addAlert(room.id, 'Cycle completed: 100% dry (Auto Fan Off)', 'info');
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
    const energyThisTick = (totalPowerW * deltaSec) / 3600;
    room.energy = +(room.energy + energyThisTick).toFixed(6);
  });

  // Alert generation
  generateAlerts();
  saveState();
  updateAlertPill();
  refreshUI();
}

setInterval(tick, 1000);

// ---------- Alerts ----------
let alertIdCounter = state.alerts.reduce((max, a) => Math.max(max, a.id), 6);
function generateAlerts() {
  state.rooms.forEach((room) => {
    if (room.drying && room.moisture <= 10 && room.fanOn) {
      addAlert(room.id, 'Fan running with dry clothes', 'warning');
    }
    if (!room.occupied && room.fanOn) {
      addAlert(room.id, 'Fan running in vacant room', 'warning');
    }
    if (room.drying && room.elapsed > room.estimatedTotal * 1.5) {
      addAlert(room.id, 'Drying cycle overdue', 'danger');
    }
  });
}

function addAlert(roomId, message, severity) {
  const existing = state.alerts.find((a) => a.roomId === roomId && a.message === message && !a.acknowledged);
  if (existing) return;
  state.alerts.unshift({
    id: ++alertIdCounter,
    roomId,
    message,
    severity,
    timestamp: new Date().toISOString(),
    acknowledged: false,
  });
  updateAlertPill();
}

function acknowledgeAlert(id) {
  const alert = state.alerts.find((a) => a.id === id);
  if (alert) {
    alert.acknowledged = true;
    showToast(`Alert #${id} marked as resolved`, 'info');
  }
  saveState();
  updateAlertPill();
  renderCurrentPage();
}

function updateAlertPill() {
  const count = state.alerts.filter((a) => !a.acknowledged).length;
  const pill = $('#sidebar-alert-pill');
  if (pill) {
    pill.textContent = count;
    pill.style.display = count > 0 ? 'inline-block' : 'none';
  }
}

// ---------- Navigation ----------
function initNavigation() {
  $$('.nav-link').forEach((link) => {
    link.href = `#${link.dataset.page}`;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.dataset.page;
      if (window.location.hash !== `#${page}`) {
        history.pushState(null, '', `#${page}`);
      }
      setActivePage(page);
    });
  });
}

function setActivePage(page) {
  $$('.nav-link').forEach((l) => l.classList.toggle('active', l.dataset.page === page));
  renderPage(page);
  state.currentPage = page;
  saveState();
  if (window.location.hash !== `#${page}`) {
    history.replaceState(null, '', `#${page}`);
  }
}

function renderCurrentPage() {
  const hashPage = window.location.hash ? window.location.hash.substring(1) : null;
  const page = (hashPage && hashPage !== 'overview') ? hashPage : (state.currentPage && state.currentPage !== 'overview' ? state.currentPage : 'student');
  setActivePage(page);
}

// ---------- Page Renderers ----------
function renderPage(page) {
  const content = $('#content');
  switch (page) {
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

// ---------- Helper Metric Card Component ----------
function statCard(title, value, unit = '', iconType = 'cyan', trendText = 'Real-time telemetry', trendClass = 'positive') {
  let iconSvg = '';
  if (iconType === 'cyan') {
    iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>`;
  } else if (iconType === 'emerald') {
    iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
  } else if (iconType === 'purple') {
    iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`;
  } else if (iconType === 'amber') {
    iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
  } else if (iconType === 'rose') {
    iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
  }

  return `
    <div class="card">
      <div class="stat-card-header">
        <h3>${title}</h3>
        <div class="stat-icon-wrapper ${iconType}">${iconSvg}</div>
      </div>
      <p>${value} ${unit ? `<span class="stat-unit">${unit}</span>` : ''}</p>
      <div class="stat-trend ${trendClass}">
        <span class="live-dot"></span>
        <span>${trendText}</span>
      </div>
    </div>
  `;
}

// Mini Room Card for Warden Grid
function renderMiniRoomCard(r) {
  const hasAlert = state.alerts.some((a) => a.roomId === r.id && !a.acknowledged);
  const isSpinning = r.fanOn;
  const fanSpeedClass = r.fanSpeed === 3 ? 'speed-3' : r.fanSpeed === 2 ? 'speed-2' : 'speed-1';

  return `
    <div class="room-card" data-room-id="${r.id}">
      <div class="room-card-header">
        <div class="room-number-group">
          <span class="live-dot ${r.occupied ? 'pulse' : ''}" style="background: ${r.occupied ? 'var(--cyan-glow)' : 'var(--text-dim)'}"></span>
          <span class="room-number">${r.number}</span>
        </div>
        <span class="occupancy-badge ${r.occupied ? 'occupied' : 'vacant'}">
          ${r.occupied ? 'Occupied' : 'Vacant'}
        </span>
      </div>

      <div class="room-live-metrics">
        <div class="metric-item">
          <span class="metric-item-label">Moisture</span>
          <span class="metric-item-val" style="color: ${r.moisture > 60 ? 'var(--cyan-primary)' : r.moisture > 15 ? 'var(--amber-glow)' : 'var(--emerald-glow)'}">
            ${r.moisture.toFixed(1)}%
          </span>
        </div>
        <div class="metric-item">
          <span class="metric-item-label">Exhaust Fan</span>
          <span class="metric-item-val">
            <svg class="mini-fan-icon ${isSpinning ? 'spin ' + fanSpeedClass : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
            ${r.fanOn ? `L${r.fanSpeed}` : 'OFF'}
          </span>
        </div>
        <div class="metric-item">
          <span class="metric-item-label">Smart Light</span>
          <span class="metric-item-val" style="color: ${r.lightOn ? '#fde047' : 'var(--text-dim)'}">
            ${r.lightOn ? `${r.brightness}%` : 'OFF'}
          </span>
        </div>
        <div class="metric-item">
          <span class="metric-item-label">Energy Consumed</span>
          <span class="metric-item-val">
            ${r.energy.toFixed(3)} <span style="font-size: 0.75rem; color: var(--text-dim); font-weight: 500;">kWh</span>
          </span>
        </div>
      </div>

      <div class="progress-bar-container">
        <div class="progress-bar-fill" style="width: ${Math.min(100, Math.max(0, r.moisture))}%; background: ${r.moisture > 60 ? 'var(--gradient-cyan)' : r.moisture > 15 ? 'var(--gradient-amber)' : 'var(--gradient-emerald)'};"></div>
      </div>

      ${hasAlert ? `<div class="badge alert-warning pulse-warning" style="align-self: flex-start;">⚠️ Active Alert</div>` : ''}

      <div class="room-card-actions">
        <button class="btn secondary view-chamber-btn" data-id="${r.id}">Open Chamber</button>
        <button class="btn secondary quick-fan-toggle" data-id="${r.id}">${r.fanOn ? 'Stop Fan' : 'Start Fan'}</button>
      </div>
    </div>
  `;
}

// ---------- Student Dashboard & Interactive Chamber ----------
function renderStudentDashboard() {
  const occupiedRooms = state.rooms.filter((r) => r.occupied);
  const options = occupiedRooms.map((r) => `<option value="${r.id}">${r.number} (${r.drying ? 'Drying' : 'Idle'})</option>`).join('');

  return `
    <section class="active">
      <div class="page-header">
        <div class="page-title-group">
          <h2>Student Clothes Drying Chamber</h2>
          <p class="page-subtitle">Real-time IoT smart drying chamber controls, fan ventilation, and moisture gauge</p>
        </div>

        <div style="display: flex; align-items: center; gap: 0.8rem;">
          <label for="student-room-select" style="font-weight: 600; font-size: 0.88rem; color: var(--text-muted);">Select Chamber:</label>
          <select id="student-room-select" class="select">${options}</select>
        </div>
      </div>

      <div id="student-room-view">
        <!-- Rendered by renderStudentRoom -->
      </div>
    </section>
  `;
}

function attachStudentEvents() {
  const select = $('#student-room-select');
  if (!select) return;
  select.addEventListener('change', () => renderStudentRoom(select.value));
  if (select.options.length) renderStudentRoom(select.value);
}

function renderStudentRoom(roomId) {
  const room = state.rooms.find((r) => r.id == roomId);
  if (!room) return;
  const container = $('#student-room-view');
  if (!container) return;

  const isSpinning = room.fanOn;
  const fanSpeedClass = room.fanSpeed === 3 ? 'speed-3' : room.fanSpeed === 2 ? 'speed-2' : 'speed-1';

  // Circular gauge SVG calculations (Circumference: 2 * PI * 23 = ~144.5)
  const maxCircumference = 144.5;
  const strokeOffset = maxCircumference - (Math.min(100, Math.max(0, room.moisture)) / 100) * maxCircumference;
  const gaugeColor = room.moisture > 60 ? 'var(--cyan-glow)' : room.moisture > 20 ? 'var(--amber-glow)' : 'var(--emerald-glow)';

  // Estimated remaining time in seconds
  const remainingSec = Math.max(0, Math.round(room.moisture / 0.25));

  container.innerHTML = `
    <div class="student-grid">
      <!-- Left Column: Interactive Chamber Graphic -->
      <div class="chamber-visualizer">
        <div class="chamber-status-bar">
          <div class="chamber-title-badge">
            <span class="live-dot pulse"></span>
            <span>CHAMBER ${room.id} • ${room.drying ? 'ACTIVE DRYING' : 'IDLE ECO MODE'}</span>
          </div>
          <span class="badge ${room.drying ? 'alert-info' : 'alert-success'}">
            ${room.drying ? 'Drying in Progress' : 'Optimal Dry'}
          </span>
        </div>

        <!-- 3D Simulated Drying Box -->
        <div class="chamber-view-box">
          <!-- Ambient Light Glow Beam -->
          <div class="chamber-light-glow ${room.lightOn ? 'active' : ''}" style="--light-intensity: ${room.brightness / 100};"></div>

          <!-- Turbine Fan Assembly -->
          <div class="chamber-fan-assembly">
            <div class="fan-housing">
              <svg class="fan-blades-svg ${isSpinning ? 'fan-spinning ' + fanSpeedClass : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
            </div>
          </div>

          <!-- Airflow Wind Stream Lines -->
          <div class="wind-streams ${isSpinning ? 'active' : ''}">
            <div class="wind-line"></div>
            <div class="wind-line"></div>
            <div class="wind-line"></div>
            <div class="wind-line"></div>
          </div>

          <!-- Hanging Clothes Simulation -->
          <div class="clothes-rack">
            <div class="rack-bar"></div>
            <!-- T-Shirt SVG -->
            <svg class="garment-item" width="80" height="95" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 2 3 6v4h3v12h12V10h3V6l-3-4H6Z" fill="rgba(59, 130, 246, 0.25)"/>
              <path d="M10 2a2 2 0 0 0 4 0"/>
            </svg>
            <!-- Towel/Jeans SVG -->
            <svg class="garment-item" width="60" height="110" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 2h16v18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2z" fill="rgba(167, 139, 250, 0.2)"/>
              <line x1="4" y1="8" x2="20" y2="8"/>
              <line x1="4" y1="14" x2="20" y2="14"/>
            </svg>
          </div>

          <!-- Rising Steam / Vapor Wisps -->
          <div class="steam-emitter ${room.drying ? 'active' : ''}">
            <div class="steam-particle"></div>
            <div class="steam-particle"></div>
            <div class="steam-particle"></div>
            <div class="steam-particle"></div>
          </div>

          <!-- Radial Moisture Dial HUD -->
          <div class="chamber-moisture-dial">
            <svg class="radial-gauge-svg" viewBox="0 0 52 52">
              <circle class="gauge-track" cx="26" cy="26" r="23" />
              <circle class="gauge-fill" id="radial-gauge-circle" cx="26" cy="26" r="23" stroke-dasharray="${maxCircumference}" stroke-dashoffset="${strokeOffset}" style="stroke: ${gaugeColor};" />
            </svg>
            <div class="gauge-text-group">
              <span class="gauge-val" id="chamber-moisture-val">${room.moisture.toFixed(1)}%</span>
              <span class="gauge-label">DHT22 Humidity</span>
            </div>
          </div>
        </div>

        <!-- Telemetry Footer Pills -->
        <div class="chamber-telemetry-footer">
          <div class="tele-pill">
            <div class="tele-pill-label">Elapsed Time</div>
            <div class="tele-pill-val" id="chamber-elapsed-val">${Math.floor(room.elapsed)}s / ${room.estimatedTotal}s</div>
          </div>
          <div class="tele-pill">
            <div class="tele-pill-label">Est. Time Remaining</div>
            <div class="tele-pill-val" id="chamber-remaining-val" style="color: var(--cyan-primary);">${remainingSec}s</div>
          </div>
          <div class="tele-pill">
            <div class="tele-pill-label">Chamber Energy</div>
            <div class="tele-pill-val" id="chamber-energy-val">${room.energy.toFixed(3)} kWh</div>
          </div>
        </div>
      </div>

      <!-- Right Column: Interactive Controls -->
      <div class="student-controls-panel">
        <div class="card">
          <div class="control-header-row">
            <div>
              <h3>Drying Cycle Master Control</h3>
              <p class="page-subtitle" style="margin-top: -0.8rem;">Automated moisture sensing with safety shut-off</p>
            </div>
            <span class="badge ${room.drying ? 'alert-info' : 'alert-success'}">
              ${room.drying ? 'Ventilating & Heating' : 'Idle'}
            </span>
          </div>

          <div class="action-buttons-group">
            <button class="btn btn-emerald" id="start-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Start Cycle
            </button>
            <button class="btn secondary" id="pause-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              Pause
            </button>
            <button class="btn secondary" id="resume-btn">Resume</button>
            <button class="btn secondary" id="turbo-btn" style="border-color: var(--cyan-primary); color: var(--cyan-primary);">
              ⚡ Turbo Dry
            </button>
            <button class="btn secondary" id="stop-btn">Stop & Dry</button>
            <button class="btn secondary" id="reset-btn">Reset Wet (100%)</button>
          </div>
        </div>

        <!-- Fan Subsystem Card -->
        <div class="card">
          <div class="control-header-row">
            <div class="control-title">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--cyan-primary)" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
              Exhaust Fan Control
            </div>
            <label class="switch-label">
              <span style="font-size: 0.85rem; font-weight: 600;">Power</span>
              <div class="toggle-switch">
                <input type="checkbox" id="fan-toggle" ${room.fanOn ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </div>
            </label>
          </div>

          <div style="margin-bottom: 1rem;">
            <label style="font-size: 0.82rem; font-weight: 600; color: var(--text-dim); text-transform: uppercase;">Speed Selection</label>
            <div class="segmented-control" style="margin-top: 0.4rem;">
              <div class="segmented-option ${room.fanSpeed === 1 ? 'active' : ''}" data-speed="1">1 (Low • 50W)</div>
              <div class="segmented-option ${room.fanSpeed === 2 ? 'active' : ''}" data-speed="2">2 (Med • 100W)</div>
              <div class="segmented-option ${room.fanSpeed === 3 ? 'active' : ''}" data-speed="3">3 (Turbo • 150W)</div>
            </div>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 0.85rem; font-weight: 500; color: var(--text-muted);">Automation Mode:</span>
            <select id="fan-mode" class="select" style="padding: 0.35rem 0.8rem; font-size: 0.85rem;">
              <option value="auto" ${room.fanMode === 'auto' ? 'selected' : ''}>Auto (Shuts off at ≤10% moisture)</option>
              <option value="manual" ${room.fanMode === 'manual' ? 'selected' : ''}>Manual Override</option>
            </select>
          </div>
        </div>

        <!-- Light Subsystem Card -->
        <div class="card">
          <div class="control-header-row">
            <div class="control-title">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fde047" stroke-width="2"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
              Smart Interior Chamber Light
            </div>
            <label class="switch-label">
              <span style="font-size: 0.85rem; font-weight: 600;">Light</span>
              <div class="toggle-switch">
                <input type="checkbox" id="light-toggle" ${room.lightOn ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </div>
            </label>
          </div>

          <div style="margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; font-size: 0.82rem; font-weight: 600; color: var(--text-dim); text-transform: uppercase;">
              <span>Brightness Level</span>
              <span class="slider-val-badge" id="brightness-val-badge">${room.brightness}%</span>
            </div>
            <div class="slider-container">
              <input type="range" id="light-brightness" class="range-slider" min="0" max="100" value="${room.brightness}">
            </div>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 0.85rem; font-weight: 500; color: var(--text-muted);">Automation Mode:</span>
            <select id="light-mode" class="select" style="padding: 0.35rem 0.8rem; font-size: 0.85rem;">
              <option value="auto" ${room.lightMode === 'auto' ? 'selected' : ''}>Auto (Off when room vacant)</option>
              <option value="manual" ${room.lightMode === 'manual' ? 'selected' : ''}>Manual Override</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach controls & actions
  $('#start-btn').onclick = () => {
    room.drying = true;
    room.fanOn = true;
    room.startTimestamp = Date.now();
    saveState();
    showToast(`Drying cycle started for ${room.number}`, 'info');
    renderStudentRoom(room.id);
  };

  $('#pause-btn').onclick = () => {
    room.drying = false;
    saveState();
    showToast(`Cycle paused for ${room.number}`, 'info');
    renderStudentRoom(room.id);
  };

  $('#resume-btn').onclick = () => {
    room.drying = true;
    room.fanOn = true;
    saveState();
    showToast(`Cycle resumed for ${room.number}`, 'info');
    renderStudentRoom(room.id);
  };

  $('#turbo-btn').onclick = () => {
    room.drying = true;
    room.fanOn = true;
    room.fanSpeed = 3;
    saveState();
    showToast(`⚡ Turbo 150W Ventilation activated for ${room.number}`, 'info');
    renderStudentRoom(room.id);
  };

  $('#stop-btn').onclick = () => {
    room.drying = false;
    room.moisture = 0;
    room.fanOn = false;
    saveState();
    showToast(`Cycle finished: 100% dry for ${room.number}`, 'info');
    renderStudentRoom(room.id);
  };

  $('#reset-btn').onclick = () => {
    room.drying = false;
    room.moisture = 100;
    room.elapsed = 0;
    room.energy = 0;
    room.fanOn = false;
    room.lightOn = false;
    saveState();
    showToast(`Reset ${room.number} to wet load (100% moisture)`, 'info');
    renderStudentRoom(room.id);
  };

  $('#fan-toggle').onchange = (e) => {
    room.fanOn = e.target.checked;
    saveState();
    renderStudentRoom(room.id);
  };

  $$('.segmented-option').forEach((opt) => {
    opt.onclick = () => {
      const speed = Number(opt.dataset.speed);
      room.fanSpeed = speed;
      saveState();
      renderStudentRoom(room.id);
    };
  });

  $('#fan-mode').onchange = (e) => {
    room.fanMode = e.target.value;
    saveState();
  };

  $('#light-toggle').onchange = (e) => {
    room.lightOn = e.target.checked;
    saveState();
    renderStudentRoom(room.id);
  };

  $('#light-brightness').oninput = (e) => {
    const val = Number(e.target.value);
    room.brightness = val;
    const badge = $('#brightness-val-badge');
    if (badge) badge.textContent = `${val}%`;
    const glow = $('.chamber-light-glow');
    if (glow) glow.style.setProperty('--light-intensity', val / 100);
    saveState();
  };

  $('#light-mode').onchange = (e) => {
    room.lightMode = e.target.value;
    saveState();
  };
}

// ---------- Warden Dashboard ----------
function renderWardenDashboard() {
  const totalRooms = state.rooms.length;
  const occupied = state.rooms.filter((r) => r.occupied).length;
  const activeDrying = state.rooms.filter((r) => r.drying).length;
  const fansRunning = state.rooms.filter((r) => r.fanOn).length;
  const totalEnergy = state.rooms.reduce((s, r) => s + r.energy, 0).toFixed(3);
  const activeAlerts = state.alerts.filter((a) => !a.acknowledged).length;

  const rows = state.rooms.map((r) => {
    const isSpinning = r.fanOn;
    const fanSpeedClass = r.fanSpeed === 3 ? 'speed-3' : r.fanSpeed === 2 ? 'speed-2' : 'speed-1';
    return `
      <tr data-id="${r.id}">
        <td><strong>${r.number}</strong></td>
        <td>
          <span class="occupancy-badge ${r.occupied ? 'occupied' : 'vacant'}">
            ${r.occupied ? 'Occupied' : 'Vacant'}
          </span>
        </td>
        <td>
          <span style="font-weight: 700; color: ${r.moisture > 60 ? 'var(--cyan-primary)' : r.moisture > 15 ? 'var(--amber-glow)' : 'var(--emerald-glow)'}">
            ${r.moisture.toFixed(1)}%
          </span>
        </td>
        <td>
          <span style="display: flex; align-items: center; gap: 0.4rem;">
            <svg class="mini-fan-icon ${isSpinning ? 'spin ' + fanSpeedClass : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
            ${r.fanOn ? `Speed ${r.fanSpeed}` : 'OFF'}
          </span>
        </td>
        <td>
          <span style="color: ${r.lightOn ? '#fde047' : 'var(--text-dim)'}">
            ${r.lightOn ? `ON (${r.brightness}%)` : 'OFF'}
          </span>
        </td>
        <td><strong>${r.energy.toFixed(3)}</strong> kWh</td>
        <td>
          ${state.alerts
            .filter((a) => a.roomId === r.id && !a.acknowledged)
            .map((a) => `<span class="badge alert-${a.severity} ${a.severity === 'danger' ? 'pulse-danger' : 'pulse-warning'}">${a.message}</span>`)
            .join(' ')}
        </td>
        <td>
          <div style="display: flex; gap: 0.4rem;">
            <button class="btn secondary view-details" data-id="${r.id}" style="padding: 0.35rem 0.6rem; font-size: 0.78rem;">Chamber</button>
            <button class="btn secondary stop-fan" data-id="${r.id}" style="padding: 0.35rem 0.6rem; font-size: 0.78rem;">${r.fanOn ? 'Stop Fan' : 'Start Fan'}</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  return `
    <section class="active">
      <div class="page-header">
        <div class="page-title-group">
          <h2>Hostel Warden Supervisory Console</h2>
          <p class="page-subtitle">Centralized hostel IoT telemetry, real-time energy conservation, and remote actuator overrides</p>
        </div>

        <!-- View mode toggle -->
        <div class="warden-view-toggle">
          <button class="view-btn ${state.wardenViewMode === 'grid' ? 'active' : ''}" id="view-mode-grid">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            Room Cards Grid
          </button>
          <button class="view-btn ${state.wardenViewMode === 'table' ? 'active' : ''}" id="view-mode-table">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            Telemetry Table
          </button>
        </div>
      </div>

      <div class="cards">
        ${statCard('Total Rooms', totalRooms, 'Chambers', 'cyan', '100% Online')}
        ${statCard('Occupancy', occupied, 'Residents', 'purple', `${Math.round((occupied / totalRooms) * 100)}% Occupancy`)}
        ${statCard('Drying In Progress', activeDrying, 'Rooms', 'amber', `${activeDrying} Cycles Active`)}
        ${statCard('Exhaust Fans Active', fansRunning, 'Fans', 'emerald', `${fansRunning} Consuming Power`)}
        ${statCard('Total Power', totalEnergy, 'kWh', 'cyan', `Est. ₹${(totalEnergy * 7.5).toFixed(2)} Cost`)}
        ${statCard('Active Alerts', activeAlerts, 'Warnings', activeAlerts > 0 ? 'rose' : 'emerald', activeAlerts > 0 ? `${activeAlerts} Need Review` : 'Safe State', activeAlerts > 0 ? 'warning' : 'positive')}
      </div>

      <!-- Master Batch Action Bar -->
      <div class="master-actions-bar">
        <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-dim); text-transform: uppercase;">Batch Master Actions:</span>
        <button class="btn secondary" id="master-stop-vacant-fans">
          🍃 Shut Off Fans in Vacant Rooms
        </button>
        <button class="btn secondary" id="master-auto-all">
          ⚡ Reset All Rooms to Eco-Auto Mode
        </button>
        <button class="btn secondary" id="warden-refresh" style="margin-left: auto;">
          🔄 Refresh Dashboard
        </button>
      </div>

      <!-- Content Views: Grid vs Table -->
      <div class="card" id="warden-view-container">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem; flex-wrap: wrap; gap: 0.8rem;">
          <input type="text" id="warden-search" placeholder="Search by room number, occupancy, or status..." class="input" style="min-width: 280px;"/>
          <span style="font-size: 0.85rem; color: var(--text-dim);">Live ESP32 Mesh Telemetry (1s Refresh)</span>
        </div>

        ${state.wardenViewMode === 'grid' ? `
          <div class="rooms-grid" id="warden-grid-list">
            ${state.rooms.map((r) => renderMiniRoomCard(r)).join('')}
          </div>
        ` : `
          <div class="table-wrapper">
            <table class="table" id="warden-table">
              <thead>
                <tr>
                  <th data-sort="number">Room ⇅</th>
                  <th>Occupancy</th>
                  <th>Moisture</th>
                  <th>Fan Status</th>
                  <th>Light Status</th>
                  <th>Energy Consumed</th>
                  <th>Active Alerts</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
          </div>
        `}
      </div>
    </section>
  `;
}

function attachWardenEvents() {
  // Mode toggling
  const gridBtn = $('#view-mode-grid');
  const tableBtn = $('#view-mode-table');
  if (gridBtn && tableBtn) {
    gridBtn.onclick = () => {
      state.wardenViewMode = 'grid';
      renderWardenDashboard();
      attachWardenEvents();
    };
    tableBtn.onclick = () => {
      state.wardenViewMode = 'table';
      renderWardenDashboard();
      attachWardenEvents();
    };
  }

  // Master Actions
  const stopVacantBtn = $('#master-stop-vacant-fans');
  if (stopVacantBtn) {
    stopVacantBtn.onclick = () => {
      let stopped = 0;
      state.rooms.forEach((r) => {
        if (!r.occupied && r.fanOn) {
          r.fanOn = false;
          stopped++;
        }
      });
      saveState();
      showToast(`Shut off exhaust fans in ${stopped} vacant rooms to save power!`, 'info');
      renderWardenDashboard();
      attachWardenEvents();
    };
  }

  const autoAllBtn = $('#master-auto-all');
  if (autoAllBtn) {
    autoAllBtn.onclick = () => {
      state.rooms.forEach((r) => {
        r.fanMode = 'auto';
        r.lightMode = 'auto';
      });
      saveState();
      showToast('All 8 rooms restored to Intelligent Eco-Auto Mode', 'info');
      renderWardenDashboard();
      attachWardenEvents();
    };
  }

  // Search filter
  const searchInput = $('#warden-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const filter = e.target.value.toLowerCase();
      if (state.wardenViewMode === 'table') {
        $$('#warden-table tbody tr').forEach((tr) => {
          tr.style.display = tr.textContent.toLowerCase().includes(filter) ? '' : 'none';
        });
      } else {
        $$('#warden-grid-list .room-card').forEach((card) => {
          card.style.display = card.textContent.toLowerCase().includes(filter) ? '' : 'none';
        });
      }
    });
  }

  // Refresh
  const refreshBtn = $('#warden-refresh');
  if (refreshBtn) {
    refreshBtn.onclick = () => {
      renderWardenDashboard();
      attachWardenEvents();
      showToast('Dashboard telemetry refreshed', 'info');
    };
  }

  // Stop / start fan action
  $$('.stop-fan, .quick-fan-toggle').forEach((btn) => {
    btn.onclick = () => {
      const id = Number(btn.dataset.id);
      const room = state.rooms.find((r) => r.id === id);
      if (room) {
        room.fanOn = !room.fanOn;
        saveState();
        showToast(`${room.number} fan turned ${room.fanOn ? 'ON' : 'OFF'}`, 'info');
        renderWardenDashboard();
        attachWardenEvents();
      }
    };
  });

  // View details
  $$('.view-details, .view-chamber-btn').forEach((btn) => {
    btn.onclick = () => {
      const id = Number(btn.dataset.id);
      setActivePage('student');
      const select = $('#student-room-select');
      if (select) {
        select.value = id;
        renderStudentRoom(id);
      }
    };
  });
}

// ---------- Rooms Telemetry Page ----------
function renderRoomsPage() {
  const occupiedCount = state.rooms.filter((r) => r.occupied).length;
  const dryingCount = state.rooms.filter((r) => r.drying).length;

  const rows = state.rooms.map((r) => {
    const isSpinning = r.fanOn;
    const fanSpeedClass = r.fanSpeed === 3 ? 'speed-3' : r.fanSpeed === 2 ? 'speed-2' : 'speed-1';
    return `
      <tr>
        <td><strong>${r.number}</strong></td>
        <td><span class="occupancy-badge ${r.occupied ? 'occupied' : 'vacant'}">${r.occupied ? 'Occupied' : 'Vacant'}</span></td>
        <td>
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <div class="progress-bar-container" style="width: 80px; margin: 0;">
              <div class="progress-bar-fill" style="width: ${r.moisture}%; background: ${r.moisture > 60 ? 'var(--gradient-cyan)' : 'var(--gradient-emerald)'};"></div>
            </div>
            <strong>${r.moisture.toFixed(1)}%</strong>
          </div>
        </td>
        <td>
          <span style="display: flex; align-items: center; gap: 0.4rem;">
            <svg class="mini-fan-icon ${isSpinning ? 'spin ' + fanSpeedClass : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
            ${r.fanOn ? `Speed ${r.fanSpeed} (${r.fanMode})` : 'OFF'}
          </span>
        </td>
        <td>${r.lightOn ? `ON (${r.brightness}%)` : 'OFF'}</td>
        <td><strong>${r.energy.toFixed(3)}</strong> kWh</td>
      </tr>
    `;
  }).join('');

  return `
    <section class="active">
      <div class="page-header">
        <div class="page-title-group">
          <h2>Hostel Rooms & Environmental Telemetry</h2>
          <p class="page-subtitle">Real-time status metrics from every student drying compartment</p>
        </div>
      </div>

      <div class="cards">
        ${statCard('Total Smart Nodes', state.rooms.length, 'Rooms', 'cyan', '8 of 8 Connected')}
        ${statCard('Currently Occupied', occupiedCount, 'Rooms', 'purple', `${Math.round((occupiedCount / 8) * 100)}% Hostel Capacity`)}
        ${statCard('Drying Loads', dryingCount, 'Chambers', 'amber', `${dryingCount} Active Venting`)}
      </div>

      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem; flex-wrap: wrap; gap: 0.8rem;">
          <input type="text" id="rooms-search" placeholder="Filter room number, status, fan speed..." class="input" style="min-width: 280px;"/>
          <span style="font-size: 0.85rem; color: var(--text-dim);">Live Sensor Bus: Modbus RTU / ESP32</span>
        </div>

        <div class="table-wrapper">
          <table class="table" id="rooms-table">
            <thead>
              <tr>
                <th>Room</th>
                <th>Occupancy Status</th>
                <th>Moisture Level</th>
                <th>Fan State</th>
                <th>Light State</th>
                <th>Accumulated Energy</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `;
}

function attachRoomsEvents() {
  const search = $('#rooms-search');
  if (search) {
    search.addEventListener('input', (e) => {
      const filter = e.target.value.toLowerCase();
      $$('#rooms-table tbody tr').forEach((tr) => {
        tr.style.display = tr.textContent.toLowerCase().includes(filter) ? '' : 'none';
      });
    });
  }
}

// ---------- Energy Analytics ----------
function renderAnalyticsPage() {
  const totalEnergy = state.rooms.reduce((s, r) => s + r.energy, 0);
  const totalEnergyStr = totalEnergy.toFixed(2);
  const highestRoom = state.rooms.reduce((prev, curr) => (curr.energy > prev.energy ? curr : prev), state.rooms[0]);
  const estimatedCost = (totalEnergy * 7.5).toFixed(2);
  const energySaved = (totalEnergy * 0.32).toFixed(2);

  return `
    <section class="active">
      <div class="page-header">
        <div class="page-title-group">
          <h2>Hostel Energy Consumption Analytics</h2>
          <p class="page-subtitle">Real-time smart grid telemetry, load distribution, and automated kWh reduction metrics</p>
        </div>
      </div>

      <div class="cards">
        <div class="card">
          <div class="stat-card-header">
            <h3>Total Consumed</h3>
            <div class="stat-icon-wrapper cyan">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </div>
          </div>
          <p id="stat-total-energy">${totalEnergyStr} <span class="stat-unit">kWh</span></p>
          <div class="stat-trend positive">
            <span class="live-dot"></span>
            <span>Live Hostel Telemetry</span>
          </div>
        </div>

        <div class="card">
          <div class="stat-card-header">
            <h3>Calculated Cost</h3>
            <div class="stat-icon-wrapper amber">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
          </div>
          <p id="stat-cost">₹${estimatedCost}</p>
          <div class="stat-trend positive">
            <span>Grid Tariff: ₹7.50 / kWh</span>
          </div>
        </div>

        <div class="card">
          <div class="stat-card-header">
            <h3>Automated Savings</h3>
            <div class="stat-icon-wrapper emerald">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
          </div>
          <p id="stat-saved" style="color: var(--emerald-glow);">${energySaved} <span class="stat-unit" style="color: var(--emerald-glow);">kWh (32%)</span></p>
          <div class="stat-trend positive">
            <span>Sensors Saved ₹${(Number(energySaved) * 7.5).toFixed(2)} Today</span>
          </div>
        </div>

        <div class="card">
          <div class="stat-card-header">
            <h3>Peak Consumer</h3>
            <div class="stat-icon-wrapper rose">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </div>
          </div>
          <p style="color: var(--cyan-primary);">${highestRoom ? highestRoom.number : 'None'}</p>
          <div class="stat-trend warning">
            <span>Highest active drying time</span>
          </div>
        </div>
      </div>

      <div class="analytics-grid">
        <div class="card">
          <h3>Real-time Room Energy Consumption (kWh)</h3>
          <div class="chart-container">
            <canvas id="energyChart"></canvas>
          </div>
        </div>

        <div>
          <div class="card" style="margin-bottom: 1.4rem;">
            <h3>Subsystem Load Distribution</h3>
            <div style="margin-bottom: 1.4rem;">
              <div style="display: flex; justify-content: space-between; font-size: 0.88rem; margin-bottom: 0.4rem;">
                <strong>Exhaust Fans Subsystem (78%)</strong>
                <span id="stat-fan-load" style="font-weight: 700; color: var(--cyan-primary);">${(totalEnergy * 0.78).toFixed(2)} kWh</span>
              </div>
              <div class="progress-bar-container">
                <div class="progress-bar-fill" style="width: 78%; background: var(--gradient-brand);"></div>
              </div>
            </div>
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 0.88rem; margin-bottom: 0.4rem;">
                <strong>Smart Chamber LED Lighting (22%)</strong>
                <span id="stat-light-load" style="font-weight: 700; color: #fde047;">${(totalEnergy * 0.22).toFixed(2)} kWh</span>
              </div>
              <div class="progress-bar-container">
                <div class="progress-bar-fill" style="width: 22%; background: linear-gradient(90deg, #f59e0b, #fde047);"></div>
              </div>
            </div>
          </div>

          <div class="card">
            <h3>Hostel Eco-Efficiency Rating</h3>
            <div style="display: flex; align-items: center; gap: 1.2rem; margin-bottom: 1rem;">
              <div class="eco-grade-circle">A+</div>
              <div>
                <strong style="font-size: 1.1rem; color: var(--text-main);">94% Hostel Efficiency</strong>
                <p style="font-size: 0.82rem; color: var(--text-muted); margin-top: 0.2rem;">Automated moisture detection prevented 4.2 hours of vacant fan operation today.</p>
              </div>
            </div>
            <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.85rem; font-size: 0.82rem; line-height: 1.4; color: var(--text-muted);">
              <strong style="color: var(--cyan-primary);">AI Recommendation:</strong> Room 3 & Room 4 have manual overrides active. Toggling them back to Auto mode will reduce wasted power by an additional ~1.2 kWh daily.
            </div>
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

  const textColor = '#3b5a7a';
  const gridColor = 'rgba(2, 132, 199, 0.08)';

  // Create vertical gradient in rich azure and sky blues
  const gradient = ctx.createLinearGradient(0, 0, 0, 350);
  gradient.addColorStop(0, 'rgba(2, 132, 199, 0.85)');
  gradient.addColorStop(0.5, 'rgba(14, 165, 233, 0.6)');
  gradient.addColorStop(1, 'rgba(186, 230, 253, 0.25)');

  const labels = state.rooms.map((r) => r.number);
  const dataVals = state.rooms.map((r) => Number(r.energy.toFixed(3)));

  energyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Energy Consumed (kWh)',
          data: dataVals,
          backgroundColor: gradient,
          borderColor: 'rgba(2, 132, 199, 1)',
          borderWidth: 2,
          borderRadius: 8,
          hoverBackgroundColor: 'rgba(14, 165, 233, 0.95)',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          labels: {
            color: '#034674',
            font: { family: "'Plus Jakarta Sans', sans-serif", weight: '700' },
          },
        },
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          titleColor: '#034674',
          bodyColor: '#0c2340',
          titleFont: { family: "'Outfit', sans-serif", size: 14, weight: '700' },
          bodyFont: { family: "'Plus Jakarta Sans', sans-serif", size: 12, weight: '600' },
          borderColor: 'rgba(14, 165, 233, 0.4)',
          borderWidth: 1.5,
          padding: 12,
          boxPadding: 4,
          callbacks: {
            label: (ctx) => `Energy: ${ctx.parsed.y} kWh (₹${(ctx.parsed.y * 7.5).toFixed(2)})`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          suggestedMax: 4.5,
          grid: { color: gridColor },
          ticks: { color: textColor, font: { weight: '600' } },
          title: { display: true, text: 'Energy (kWh)', color: '#034674', font: { weight: '700' } },
        },
        x: {
          grid: { display: false },
          ticks: { color: textColor, font: { weight: '600' } },
          title: { display: true, text: 'Hostel Rooms', color: '#034674', font: { weight: '700' } },
        },
      },
    },
  });
}

// ---------- Alerts & Activity Hub ----------
function renderAlertsPage() {
  const activeAlerts = state.alerts.filter((a) => !a.acknowledged);
  const dangerCount = state.alerts.filter((a) => a.severity === 'danger' && !a.acknowledged).length;
  const warningCount = state.alerts.filter((a) => a.severity === 'warning' && !a.acknowledged).length;
  const resolvedCount = state.alerts.filter((a) => a.acknowledged).length;

  const rows = state.alerts.map((a) => `
    <tr class="${a.acknowledged ? 'ack' : ''}">
      <td><strong>#${a.id}</strong></td>
      <td><strong>${a.roomId ? 'Chamber ' + a.roomId : 'System'}</strong></td>
      <td>
        <span class="badge alert-${a.severity} ${!a.acknowledged && a.severity === 'danger' ? 'pulse-danger' : !a.acknowledged && a.severity === 'warning' ? 'pulse-warning' : ''}">
          ${a.severity}
        </span>
      </td>
      <td>${a.message}</td>
      <td>${new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
      <td>
        ${
          a.acknowledged
            ? '<span style="color: var(--emerald-glow); font-weight: 700;">✓ Resolved</span>'
            : `<button class="btn secondary ack-btn" data-id="${a.id}" style="padding: 0.35rem 0.8rem; font-size: 0.8rem;">Acknowledge</button>`
        }
      </td>
    </tr>
  `).join('');

  return `
    <section class="active">
      <div class="page-header">
        <div class="page-title-group">
          <h2>Hostel Safety & Energy Alerts Hub</h2>
          <p class="page-subtitle">Real-time anomaly monitoring for excessive fan operation, moisture spikes, and vacancy waste</p>
        </div>

        <button class="btn secondary" id="ack-all-btn">
          ✓ Acknowledge All Active Alerts
        </button>
      </div>

      <div class="cards">
        ${statCard('Active Anomaly Alerts', activeAlerts.length, 'Alerts', activeAlerts.length > 0 ? 'rose' : 'emerald', activeAlerts.length > 0 ? 'Action Needed' : 'Normal', activeAlerts.length > 0 ? 'warning' : 'positive')}
        ${statCard('Critical (Overdue Cycles)', dangerCount, 'Alerts', 'rose', 'Danger Threshold', 'warning')}
        ${statCard('Vacant Fan Warnings', warningCount, 'Alerts', 'amber', 'Power Conservation', 'warning')}
        ${statCard('Resolved Today', resolvedCount, 'Events', 'emerald', 'Handled by Warden', 'positive')}
      </div>

      <div class="card">
        <h3>Live Event & Anomaly Log Feed</h3>
        <div class="table-wrapper">
          <table class="table" id="alerts-table">
            <thead>
              <tr>
                <th>Alert ID</th>
                <th>Source</th>
                <th>Severity</th>
                <th>Diagnosis & Sensor Trigger</th>
                <th>Timestamp</th>
                <th>Resolution Status</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `;
}

function attachAlertsEvents() {
  $$('.ack-btn').forEach((btn) => {
    btn.onclick = () => {
      const id = Number(btn.dataset.id);
      acknowledgeAlert(id);
    };
  });

  const ackAll = $('#ack-all-btn');
  if (ackAll) {
    ackAll.onclick = () => {
      let count = 0;
      state.alerts.forEach((a) => {
        if (!a.acknowledged) {
          a.acknowledged = true;
          count++;
        }
      });
      saveState();
      showToast(`Acknowledged and resolved ${count} alerts`, 'info');
      updateAlertPill();
      renderCurrentPage();
    };
  }
}

// ---------- Automation Settings Page ----------
function renderSettingsPage() {
  const s = state.settings;
  return `
    <section class="active">
      <div class="page-header">
        <div class="page-title-group">
          <h2>IoT System & Automation Parameters</h2>
          <p class="page-subtitle">Hardware rating thresholds, sensor hysteresis, and automatic shut-off triggers</p>
        </div>
      </div>

      <div class="cards" style="grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));">
        <div class="card">
          <h3>Hardware Electrical Assumptions</h3>
          <div style="margin-bottom: 1.2rem;">
            <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-dim); margin-bottom: 0.4rem;">
              Fan Power per Speed Step (Watts):
            </label>
            <input type="number" id="setting-fan-power" value="${s.fanPowerPerSpeed}" class="input" style="width: 100%;"/>
            <span style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-top: 0.3rem;">Default: 50W (Low=50W, Med=100W, High=150W)</span>
          </div>

          <div style="margin-bottom: 1.2rem;">
            <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-dim); margin-bottom: 0.4rem;">
              Light Max Power at 100% (Watts):
            </label>
            <input type="number" id="setting-light-power" value="${s.lightPowerBase}" class="input" style="width: 100%;"/>
            <span style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-top: 0.3rem;">Default: 10W LED strip per drying chamber</span>
          </div>
        </div>

        <div class="card">
          <h3>Smart Climate Automation Triggers</h3>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.4rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-subtle);">
            <div>
              <strong style="display: block; font-size: 0.95rem; color: var(--text-main);">Auto-Shutoff Fan When Dry</strong>
              <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.2rem;">Turns off fan when moisture drops to ≤10%</p>
            </div>
            <label class="switch-label">
              <div class="toggle-switch">
                <input type="checkbox" id="setting-auto-fan" ${s.autoFanWhenDry ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </div>
            </label>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
            <div>
              <strong style="display: block; font-size: 0.95rem; color: var(--text-main);">Auto-Shutoff Light When Vacant</strong>
              <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.2rem;">Turns off interior illumination when room is vacant</p>
            </div>
            <label class="switch-label">
              <div class="toggle-switch">
                <input type="checkbox" id="setting-auto-light" ${s.autoLightWhenVacant ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div style="display: flex; gap: 1rem; margin-top: 1rem;">
        <button class="btn btn-emerald" id="save-settings-btn">Save Parameters</button>
        <button class="btn secondary" id="reset-settings">Reset All Simulation Data to Defaults</button>
      </div>
    </section>
  `;
}

function attachSettingsEvents() {
  $('#setting-fan-power').onchange = (e) => {
    state.settings.fanPowerPerSpeed = Number(e.target.value);
    saveState();
  };
  $('#setting-light-power').onchange = (e) => {
    state.settings.lightPowerBase = Number(e.target.value);
    saveState();
  };
  $('#setting-auto-fan').onchange = (e) => {
    state.settings.autoFanWhenDry = e.target.checked;
    saveState();
  };
  $('#setting-auto-light').onchange = (e) => {
    state.settings.autoLightWhenVacant = e.target.checked;
    saveState();
  };
  $('#save-settings-btn').onclick = () => {
    saveState();
    showToast('Automation settings saved successfully', 'info');
  };
  $('#reset-settings').onclick = () => {
    if (confirm('Reset all settings and simulation data to fresh initial state?')) {
      state = generateInitialState();
      saveState();
      initNavigation();
      renderCurrentPage();
      showToast('Simulation state reset to factory defaults', 'info');
    }
  };
}

// ---------- About Page with Generated Hero Artwork ----------
function renderAboutPage() {
  return `
    <section class="active">
      <div class="page-header">
        <div class="page-title-group">
          <h2>About DrySmart IoT Ecosystem</h2>
          <p class="page-subtitle">Pioneering sustainable clothes drying and intelligent energy conservation for institutional hostels</p>
        </div>
      </div>

      <!-- Hero Visual Card with Generated 3D Render -->
      <div class="about-hero-card">
        <img src="assets/hero.jpg" alt="DrySmart Smart Drying Chamber 3D Render" class="about-hero-img" onerror="this.style.display='none'" />
        <div class="about-hero-overlay">
          <h3>DrySmart: Next-Gen Hostel Drying Chamber</h3>
          <p style="color: #cbd5e1; max-width: 680px; font-size: 0.95rem; line-height: 1.5;">
            An IoT-driven closed-loop drying system designed to eliminate wasted hostel power from exhaust fans and lights left running continuously on damp clothes.
          </p>
        </div>
      </div>

      <div class="about-features-grid">
        <div class="feature-box">
          <div class="feature-icon-box">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
          </div>
          <h4 style="font-family: var(--font-heading); font-size: 1.1rem; color: var(--text-main); margin-bottom: 0.4rem;">Closed-Loop Fan Control</h4>
          <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5;">
            DHT22 digital relative humidity sensors detect when clothes reach the safe &lt;10% threshold, immediately triggering relay cut-off.
          </p>
        </div>

        <div class="feature-box">
          <div class="feature-icon-box">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <h4 style="font-family: var(--font-heading); font-size: 1.1rem; color: var(--text-main); margin-bottom: 0.4rem;">Warden Energy Auditing</h4>
          <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5;">
            Comprehensive hostel grid overview with instant detection of manual overrides in vacant rooms and single-click energy conservation.
          </p>
        </div>

        <div class="feature-box">
          <div class="feature-icon-box">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <h4 style="font-family: var(--font-heading); font-size: 1.1rem; color: var(--text-main); margin-bottom: 0.4rem;">Fault & Hazard Detection</h4>
          <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5;">
            Automated alerts identify stalled cycles, humidity spikes, or fan failures, protecting garments from mildew and electrical overload.
          </p>
        </div>
      </div>
    </section>
  `;
}

// ---------- UI Refresh (Lightweight In-place updates) ----------
function refreshUI() {
  const page = state.currentPage || 'student';

  if (page === 'student') {
    const select = $('#student-room-select');
    if (select && select.value) {
      const room = state.rooms.find((r) => r.id == select.value);
      if (room) {
        // Update moisture HUD
        const moistureVal = $('#chamber-moisture-val');
        if (moistureVal) moistureVal.textContent = `${room.moisture.toFixed(1)}%`;

        const maxCircumference = 144.5;
        const strokeOffset = maxCircumference - (Math.min(100, Math.max(0, room.moisture)) / 100) * maxCircumference;
        const circle = $('#radial-gauge-circle');
        if (circle) {
          circle.setAttribute('stroke-dashoffset', strokeOffset);
          circle.style.stroke = room.moisture > 60 ? 'var(--cyan-glow)' : room.moisture > 20 ? 'var(--amber-glow)' : 'var(--emerald-glow)';
        }

        // Update elapsed & remaining
        const elapsedVal = $('#chamber-elapsed-val');
        if (elapsedVal) elapsedVal.textContent = `${Math.floor(room.elapsed)}s / ${room.estimatedTotal}s`;

        const remainingVal = $('#chamber-remaining-val');
        if (remainingVal) remainingVal.textContent = `${Math.max(0, Math.round(room.moisture / 0.25))}s`;

        const energyVal = $('#chamber-energy-val');
        if (energyVal) energyVal.textContent = `${room.energy.toFixed(3)} kWh`;

        // Update steam emitter
        const steam = $('.steam-emitter');
        if (steam) steam.classList.toggle('active', room.drying);

        // Update fan spinning
        const fanSvg = $('.fan-blades-svg');
        if (fanSvg) {
          fanSvg.className = `fan-blades-svg ${room.fanOn ? 'fan-spinning ' + (room.fanSpeed === 3 ? 'speed-3' : room.fanSpeed === 2 ? 'speed-2' : 'speed-1') : ''}`;
        }
      }
    }
  } else if (page === 'analytics') {
    if (energyChart && $('#energyChart')) {
      energyChart.data.datasets[0].data = state.rooms.map((r) => Number(r.energy.toFixed(3)));
      energyChart.update('none');
    }
    const totalEnergy = state.rooms.reduce((s, r) => s + r.energy, 0);
    const totalEl = $('#stat-total-energy');
    if (totalEl) totalEl.innerHTML = `${totalEnergy.toFixed(2)} <span class="stat-unit">kWh</span>`;
    const costEl = $('#stat-cost');
    if (costEl) costEl.textContent = `₹${(totalEnergy * 7.5).toFixed(2)}`;
    const savedEl = $('#stat-saved');
    if (savedEl) savedEl.innerHTML = `${(totalEnergy * 0.32).toFixed(2)} <span class="stat-unit" style="color: var(--emerald-glow);">kWh (32%)</span>`;
    const fanEl = $('#stat-fan-load');
    if (fanEl) fanEl.textContent = `${(totalEnergy * 0.78).toFixed(2)} kWh`;
    const lightEl = $('#stat-light-load');
    if (lightEl) lightEl.textContent = `${(totalEnergy * 0.22).toFixed(2)} kWh`;
  }
}

// ---------- Initialization ----------
function initApp() {
  initHeaderClock();
  initNavigation();
  updateAlertPill();
  renderCurrentPage();
}

document.addEventListener('DOMContentLoaded', initApp);
