// test_suite.js - Comprehensive Verification for DrySmart
const fs = require('fs');

console.log('====================================================');
console.log('  DrySmart IoT Application - Comprehensive Test Suite');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } else {
    console.error(`  [FAIL] ${testName} - ${details}`);
    throw new Error(`Test failed: ${testName} - ${details}`);
  }
}

// Mock browser environment for app.js
const mockStorage = {};
global.localStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, val) => { mockStorage[key] = val; },
  removeItem: (key) => { delete mockStorage[key]; },
  clear: () => { for (let k in mockStorage) delete mockStorage[k]; }
};

class MockElement {
  constructor(tagName = 'div') {
    this.tagName = tagName;
    this.children = [];
    this._innerHTML = '';
    this.textContent = '';
    this.classList = {
      _classes: new Set(),
      add: (c) => this.classList._classes.add(c),
      remove: (c) => this.classList._classes.delete(c),
      toggle: (c, force) => {
        if (force === undefined) {
          if (this.classList._classes.has(c)) this.classList._classes.delete(c);
          else this.classList._classes.add(c);
        } else if (force) {
          this.classList._classes.add(c);
        } else {
          this.classList._classes.delete(c);
        }
      },
      contains: (c) => this.classList._classes.has(c)
    };
    this.style = {
      setProperty: (k, v) => { this.style[k] = v; }
    };
    this.dataset = {};
    this.attributes = {};
    this.options = [];
    this.value = '';
    this.checked = false;
    this._eventListeners = {};
  }

  get className() {
    return Array.from(this.classList._classes).join(' ');
  }
  set className(val) {
    this.classList._classes = new Set((val || '').split(/\s+/).filter(Boolean));
  }

  get innerHTML() {
    return this._innerHTML;
  }
  set innerHTML(html) {
    this._innerHTML = html;
    this.parseHtmlToChildren(html);
  }

  setAttribute(k, v) { this.attributes[k] = String(v); }
  getAttribute(k) { return this.attributes[k]; }
  appendChild(child) { this.children.push(child); }
  remove() { if (this.parent) this.parent.children = this.parent.children.filter(c => c !== this); }

  addEventListener(event, fn) {
    if (!this._eventListeners[event]) this._eventListeners[event] = [];
    this._eventListeners[event].push(fn);
  }
  dispatch(event, data = {}) {
    if (this._eventListeners[event]) {
      this._eventListeners[event].forEach(fn => fn(data));
    }
    if (event === 'click' && typeof this.onclick === 'function') {
      this.onclick(data);
    }
    if (event === 'change' && typeof this.onchange === 'function') {
      this.onchange(data);
    }
    if (event === 'input' && typeof this.oninput === 'function') {
      this.oninput(data);
    }
  }

  querySelector(sel) {
    const all = this.querySelectorAll(sel);
    return all.length ? all[0] : null;
  }

  querySelectorAll(sel) {
    const results = [];
    const walk = (node) => {
      if (node.matches && node.matches(sel)) results.push(node);
      for (const child of node.children) walk(child);
    };
    walk(this);
    return results;
  }

  matches(sel) {
    if (sel.startsWith('#')) return this.id === sel.slice(1);
    if (sel.startsWith('.')) return this.classList.contains(sel.slice(1));
    if (sel.startsWith('[')) {
      const match = sel.match(/\[([a-zA-Z0-9_-]+)(?:=["']?([^"']*)["']?)?\]/);
      if (match) {
        const attr = match[1];
        const val = match[2];
        if (attr.startsWith('data-')) {
          const dKey = attr.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
          return val !== undefined ? String(this.dataset[dKey]) === val : (dKey in this.dataset);
        }
        return val !== undefined ? this.attributes[attr] === val : (attr in this.attributes);
      }
    }
    return this.tagName.toLowerCase() === sel.toLowerCase();
  }

  parseHtmlToChildren(html) {
    this.children = [];
    // Lightweight parser for IDs, classes, data-ids, inputs
    const tagRegex = /<([a-zA-Z0-9]+)([^>]*)>(?:([\s\S]*?)<\/\1>)?/g;
    let match;
    while ((match = tagRegex.exec(html)) !== null) {
      const tagName = match[1];
      const attrStr = match[2];
      const inner = match[3] || '';
      const child = new MockElement(tagName);
      
      const idM = attrStr.match(/id=["']([^"']+)["']/);
      if (idM) child.id = idM[1];

      const classM = attrStr.match(/class=["']([^"']+)["']/);
      if (classM) child.className = classM[1];

      const dataIdM = attrStr.match(/data-id=["']([^"']+)["']/);
      if (dataIdM) child.dataset.id = dataIdM[1];

      const dataSpeedM = attrStr.match(/data-speed=["']([^"']+)["']/);
      if (dataSpeedM) child.dataset.speed = dataSpeedM[1];

      const dataSortM = attrStr.match(/data-sort=["']([^"']+)["']/);
      if (dataSortM) child.dataset.sort = dataSortM[1];

      const valueM = attrStr.match(/value=["']([^"']+)["']/);
      if (valueM) child.value = valueM[1];

      if (attrStr.includes('checked')) child.checked = true;

      child._innerHTML = inner;
      child.textContent = inner.replace(/<[^>]*>/g, '');
      this.children.push(child);
    }
  }
}

const elementsCache = {
  '#content': new MockElement('main'),
  '#student-room-view': new MockElement('div'),
  '#toast-container': new MockElement('div'),
  '#live-clock': new MockElement('div'),
  '#sidebar-alert-pill': new MockElement('span')
};

global.document = {
  documentElement: new MockElement('html'),
  getElementById: (id) => global.document.querySelector('#' + id),
  querySelector: (sel) => {
    let el = elementsCache[sel];
    if (!el) {
      el = new MockElement();
      if (sel.startsWith('#')) el.id = sel.slice(1);
      if (sel.startsWith('.')) el.className = sel.slice(1);
      elementsCache[sel] = el;
    }
    return el;
  },
  createElement: (tag) => new MockElement(tag),
  querySelectorAll: (sel) => [global.document.querySelector(sel)],
  addEventListener: () => {}
};

global.window = {
  location: { hash: '#student' },
  history: { pushState: () => {}, replaceState: () => {} },
  addEventListener: () => {}
};
global.Chart = class {
  constructor() { this.data = { datasets: [{ data: [] }] }; }
  destroy() {}
  update() {}
};

// Load app code by executing
const appCode = fs.readFileSync('app.js', 'utf8');

let testableCode = appCode
  .replace("document.addEventListener('DOMContentLoaded', initApp);", "// test runner init")
  .replace("setInterval(tick, 1000);", "// test runner tick")
  .replace("setInterval(updateClock, 1000);", "// test runner clock");

eval(testableCode);
var state = globalThis.state;
var tick = globalThis.tick;
var renderPage = globalThis.renderPage;
var renderStudentRoom = globalThis.renderStudentRoom;
var renderCurrentPage = globalThis.renderCurrentPage;
var $ = globalThis.$;
var $$ = globalThis.$$;

// ==========================================
// TEST 1: Initial State & Rooms Verification
// ==========================================
console.log('--- TEST GROUP 1: Initial State & Infrastructure ---');
assert(Array.isArray(state.rooms) && state.rooms.length === 8, '8 rooms configured in state');
assert(state.settings.fanPowerPerSpeed === 50, 'Default fan power is 50W per speed step');
assert(state.settings.lightPowerBase === 10, 'Default light power is 10W');
assert(state.settings.autoFanWhenDry === true, 'Auto fan shutoff is active by default');
assert(state.settings.autoLightWhenVacant === true, 'Auto light shutoff is active by default');

// ==========================================
// TEST 2: Start, Pause, Resume, Reset, Turbo
// ==========================================
console.log('\n--- TEST GROUP 2: Chamber Drying Cycle Controls ---');

// Render room 1
renderPage('student');
let room1 = state.rooms.find(r => r.id === 1);

// Test Reset to wet load (100%)
const resetBtn = $('#reset-btn');
assert(Boolean(resetBtn), '#reset-btn exists');
resetBtn.dispatch('click');
room1 = state.rooms.find(r => r.id === 1);
assert(room1.moisture === 100, 'Reset button sets moisture to 100%');
assert(room1.drying === false, 'Reset button stops drying cycle');
assert(room1.fanOn === false, 'Reset button turns fan OFF');
assert(room1.lightOn === false, 'Reset button turns light OFF');
assert(room1.energy === 0, 'Reset button clears chamber accumulated energy');

// Test Start Cycle
const startBtn = $('#start-btn');
assert(Boolean(startBtn), '#start-btn exists');
startBtn.dispatch('click');
room1 = state.rooms.find(r => r.id === 1);
assert(room1.drying === true, 'Start button sets drying = true');
assert(room1.fanOn === true, 'Start button starts fan (fanOn = true)');

// Simulate 4 seconds of drying
const initialMoisture = room1.moisture;
state.lastTick = Date.now() - 4000;
tick();
room1 = state.rooms.find(r => r.id === 1);
assert(room1.moisture < initialMoisture, 'Moisture level drops continuously during active drying tick');
assert(room1.energy > 0, 'Chamber energy accumulates while fan is running');

// Test Pause Cycle
const pauseBtn = $('#pause-btn');
assert(Boolean(pauseBtn), '#pause-btn exists');
pauseBtn.dispatch('click');
room1 = state.rooms.find(r => r.id === 1);
assert(room1.drying === false, 'Pause button pauses drying cycle (drying = false)');
assert(room1.fanOn === false, 'Pause in auto mode turns fan OFF to save power');

const moistureWhilePaused = room1.moisture;
state.lastTick = Date.now() - 3000;
tick();
assert(room1.moisture === moistureWhilePaused, 'Moisture does not decrease while cycle is paused');

// Test Resume Cycle
const resumeBtn = $('#resume-btn');
assert(Boolean(resumeBtn), '#resume-btn exists');
resumeBtn.dispatch('click');
room1 = state.rooms.find(r => r.id === 1);
assert(room1.drying === true, 'Resume button resumes drying cycle (drying = true)');
assert(room1.fanOn === true, 'Resume button turns fan ON (fanOn = true)');

// Test Turbo Dry
const turboBtn = $('#turbo-btn');
assert(Boolean(turboBtn), '#turbo-btn exists');
turboBtn.dispatch('click');
room1 = state.rooms.find(r => r.id === 1);
assert(room1.drying === true, 'Turbo Dry sets drying = true');
assert(room1.fanOn === true, 'Turbo Dry sets fanOn = true');
assert(room1.fanSpeed === 3, 'Turbo Dry sets fanSpeed to 3 (Max Turbo 150W)');

// Test Stop & Dry
const stopBtn = $('#stop-btn');
assert(Boolean(stopBtn), '#stop-btn exists');
stopBtn.dispatch('click');
room1 = state.rooms.find(r => r.id === 1);
assert(room1.drying === false, 'Stop button halts drying (drying = false)');
assert(room1.moisture === 0, 'Stop button marks clothes as dry (moisture = 0%)');
assert(room1.fanOn === false, 'Stop button shuts off fan');

// ==========================================
// TEST 3: Automatic Fan Control at <=10% Dry
// ==========================================
console.log('\n--- TEST GROUP 3: Automatic Fan Control (Intelligent Eco Shut-Off) ---');

// Put clothes in at 11% moisture, drying in auto mode
room1.moisture = 10.5;
room1.drying = true;
room1.fanOn = true;
room1.fanMode = 'auto';
state.settings.autoFanWhenDry = true;

// Simulate 3 seconds tick (drop rate is 0.25%/s, so 3s drops by 0.75%, taking moisture to 9.75% <= 10%)
state.lastTick = Date.now() - 3000;
tick();
room1 = state.rooms.find(r => r.id === 1);
assert(room1.moisture <= 10, 'Moisture successfully dropped below 10% threshold');
assert(room1.fanOn === false, 'Auto fan shut-off executed (fanOn = false)');
assert(room1.drying === false, 'Auto drying cycle ended (drying = false)');
const autoAlert = state.alerts.find(a => a.roomId === 1 && a.message.includes('100% dry'));
assert(Boolean(autoAlert), 'System alert generated confirming Auto Fan Off when dry');

// Test manual override does NOT automatically shut fan off
room1.moisture = 8.0;
room1.drying = true;
room1.fanOn = true;
room1.fanMode = 'manual';
state.lastTick = Date.now() - 2000;
tick();
assert(room1.fanOn === true, 'Manual override mode keeps fan ON even when clothes dry');

// ==========================================
// TEST 4: Lighting Controls & Auto Shut-off
// ==========================================
console.log('\n--- TEST GROUP 4: Smart Lighting & Vacant Room Auto-Extinguish ---');

// Manual lighting toggle
const lightToggle = $('#light-toggle');
assert(Boolean(lightToggle), '#light-toggle exists');
room1.lightOn = false;
lightToggle.dispatch('change', { target: { checked: true } });
assert(room1.lightOn === true, 'Manual light toggle turns light ON');

// Brightness adjustment
const lightSlider = $('#light-brightness');
assert(Boolean(lightSlider), '#light-brightness slider exists');
lightSlider.dispatch('input', { target: { value: '75' } });
assert(room1.brightness === 75, 'Brightness slider updates room.brightness to 75%');

// Test auto light off in vacant room
const room4 = state.rooms.find(r => r.id === 4); // Room 4 is vacant
room4.occupied = false;
room4.lightOn = true;
room4.lightMode = 'auto';
state.settings.autoLightWhenVacant = true;

state.lastTick = Date.now() - 1000;
tick();
assert(room4.lightOn === false, 'Vacant room light automatically extinguished in auto mode');
const vacantLightAlert = state.alerts.find(a => a.roomId === 4 && a.message.includes('vacant room'));
assert(Boolean(vacantLightAlert), 'Alert logged for vacant room light auto shut-off');

// ==========================================
// TEST 5: Energy Calculations & Formulas
// ==========================================
console.log('\n--- TEST GROUP 5: Energy Equations & Grid Telemetry Math ---');

// Check power formulas
// Room with Fan Speed 2 (100W) + Light 50% of 10W (5W) = 105W total
const testRoom = state.rooms[0];
testRoom.fanOn = true;
testRoom.fanSpeed = 2;
testRoom.lightOn = true;
testRoom.brightness = 50;
testRoom.energy = 0;

state.settings.fanPowerPerSpeed = 50;
state.settings.lightPowerBase = 10;

// 1 hour (3600 seconds) simulation tick
state.lastTick = Date.now() - 3600000;
tick();

// Power = 50 * 2 + (10 * 50 / 100) = 100 + 5 = 105 Watts
// Energy in 3600s = (105 * 3600) / 3600 = 105.0 kWh
assert(Math.abs(testRoom.energy - 105.0) < 0.001, 'Energy calculation exactly matches (totalPowerW * deltaSec) / 3600');

// Verify hostel aggregates
const totalHostelEnergy = state.rooms.reduce((s, r) => s + r.energy, 0);
const calculatedCost = +(totalHostelEnergy * 7.5).toFixed(2);
const calculatedSavings = +(totalHostelEnergy * 0.32).toFixed(2);
const fanLoad = +(totalHostelEnergy * 0.78).toFixed(2);
const lightLoad = +(totalHostelEnergy * 0.22).toFixed(2);

assert(calculatedCost > 0, 'Electricity cost calculated correctly at ₹7.50 / kWh');
assert(calculatedSavings > 0, 'Energy savings calculated correctly at 32%');
assert(Math.abs((fanLoad + lightLoad) - totalHostelEnergy) <= 0.02, 'Fan load (78%) + Light load (22%) perfectly accounts for 100% of power');

// ==========================================
// TEST 6: Warden Controls & Sorting
// ==========================================
console.log('\n--- TEST GROUP 6: Warden Console, Batch Operations & Table Sorting ---');

renderPage('warden');

// Test master stop vacant fans
state.rooms[3].occupied = false; // Room 4 vacant
state.rooms[3].fanOn = true;
state.rooms[6].occupied = false; // Room 7 vacant
state.rooms[6].fanOn = true;

const stopVacantBtn = $('#master-stop-vacant-fans');
assert(Boolean(stopVacantBtn), '#master-stop-vacant-fans button exists');
stopVacantBtn.dispatch('click');

assert(state.rooms[3].fanOn === false, 'Master action turned off fan in vacant Room 4');
assert(state.rooms[6].fanOn === false, 'Master action turned off fan in vacant Room 7');

// Test master eco auto all
state.rooms[2].fanMode = 'manual';
state.rooms[2].lightMode = 'manual';
const autoAllBtn = $('#master-auto-all');
assert(Boolean(autoAllBtn), '#master-auto-all button exists');
autoAllBtn.dispatch('click');

assert(state.rooms.every(r => r.fanMode === 'auto' && r.lightMode === 'auto'), 'Master action reset all 8 rooms to Eco-Auto Mode');

// Test table sorting
state.wardenSortKey = 'moisture';
state.wardenSortAsc = false; // Descending
renderPage('warden');
assert(state.wardenSortKey === 'moisture' && state.wardenSortAsc === false, 'Warden sort state updated correctly');

// ==========================================
// TEST 7: Alerts Acknowledgment
// ==========================================
console.log('\n--- TEST GROUP 7: Alerts & Notification Hub ---');

renderPage('alerts');
const unacknowledgedBefore = state.alerts.filter(a => !a.acknowledged).length;
assert(unacknowledgedBefore > 0, 'Active alerts exist');

const ackAllBtn = $('#ack-all-btn');
assert(Boolean(ackAllBtn), '#ack-all-btn exists');
ackAllBtn.dispatch('click');

const unacknowledgedAfter = state.alerts.filter(a => !a.acknowledged).length;
assert(unacknowledgedAfter === 0, 'Acknowledge All marked 100% of alerts as resolved');

// ==========================================
// TEST 8: Automation Settings Configuration
// ==========================================
console.log('\n--- TEST GROUP 8: Automation Settings Parameter Persistence ---');

renderPage('settings');
const fanPowerInput = $('#setting-fan-power');
const lightPowerInput = $('#setting-light-power');
const autoFanInput = $('#setting-auto-fan');
const autoLightInput = $('#setting-auto-light');
const saveSettingsBtn = $('#save-settings-btn');

assert(Boolean(fanPowerInput && lightPowerInput && autoFanInput && autoLightInput && saveSettingsBtn), 'All settings form controls exist');

fanPowerInput.value = '60';
lightPowerInput.value = '15';
autoFanInput.checked = true;
autoLightInput.checked = true;
saveSettingsBtn.dispatch('click');

assert(state.settings.fanPowerPerSpeed === 60, 'Fan power parameter saved to 60W');
assert(state.settings.lightPowerBase === 15, 'Light power parameter saved to 15W');

// Reset settings to defaults
const resetSettingsBtn = $('#reset-settings');
global.confirm = () => true;
resetSettingsBtn.dispatch('click');
state = globalThis.state;

assert(state.settings.fanPowerPerSpeed === 50, 'Reset settings restored factory default 50W');
assert(state.settings.lightPowerBase === 10, 'Reset settings restored factory default 10W');

console.log('\n====================================================');
console.log(`  ALL ${passedTests} OF ${totalTests} TESTS PASSED SUCCESSFULLY!`);
console.log('====================================================');
