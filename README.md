# DrySmart – IoT‑Based Smart Hostel Clothes Drying and Energy Management System

## Overview

DrySmart is a fully‑simulated web application that demonstrates how an IoT‑enabled hostel can monitor and control clothes‑drying cycles, fans, lights, and energy consumption. All logic runs in the browser – no real hardware is required.

## Features
- **Student Dashboard** – select your room, start/pause/resume/stop/reset a drying cycle, control fan and light (auto/manual modes).
- **Warden Dashboard** – overview of all rooms, summary cards, searchable/sortable table, actions to view details or stop a fan, real‑time alerts.
- **Rooms Page** – list of every room with current state and search.
- **Energy Analytics** – bar chart of estimated energy per room (Chart.js).
- **Alerts** – generated automatically for wasteful operation, with acknowledgement.
- **Settings** – adjust power assumptions, automatic behaviours, and reset the whole simulation.
- **About** – explanation of the problem, solution, and demo limitations.
- **Responsive design** – works on desktop and mobile (sidebar collapses).
- **State persistence** – data saved in `localStorage` and restored on reload.

## Project Structure
```
DrySmart/
│   index.html          # Main HTML skeleton and navigation
│   styles.css          # Modern, responsive CSS (Inter font, colour palette)
│   app.js              # Shared simulation state, UI rendering, persistence
│   README.md           # This file
```

## How to Run Locally
1. Open the project folder in a file explorer.
2. Double‑click `index.html` (or open it via a `file://` URL in the browser).
3. The application loads immediately. The URL hash (`#student`, `#warden`, etc.) reflects the current page, so you can bookmark or share direct links.
4. No server is required – everything runs in the browser using `localStorage` for persistence.

## Simulation Assumptions
- **Power**: Fan uses `fanPowerPerSpeed` watts per speed level (default 50 W). Light uses up to `lightPowerBase` watts at 100 % brightness (default 10 W).
- **Energy** is calculated as `Energy (kWh) = Power (W) × Runtime (hours) / 1000`.
- **Drying**: Moisture drops linearly at 0.2 % per second. When moisture ≤ 10 % the fan may auto‑turn‑off.
- All values displayed are **estimated**, not measured.

## Testing Checklist (All Passed)
- ✅ All eight navigation pages open correctly.
- ✅ Student room selection works.
- ✅ Drying start, pause, resume, stop, and reset work.
- ✅ Fan ON/OFF, speed, and modes work.
- ✅ Light ON/OFF, brightness, and modes work.
- ✅ Warden dashboard displays correctly and actions update state.
- ✅ At least eight rooms display with realistic occupancy.
- ✅ Summary cards reflect current data.
- ✅ Search, filter, and sorting work on the Warden and Rooms pages.
- ✅ "View Details" navigates to the Student Dashboard for that room.
- ✅ "Stop Fan" updates only the selected room.
- ✅ Refresh button preserves simulation state.
- ✅ Alerts appear for dry clothes with fan running, fans in vacant rooms, and overdue cycles; they can be acknowledged.
- ✅ Energy analytics chart updates from live data.
- ✅ Settings affect simulation and can be reset.
- ✅ Reset restores the original demo state.
- ✅ Data persists via `localStorage`; corrupted data falls back to defaults.
- ✅ No duplicate timers or event listeners (single `setInterval` loop).
- ✅ Every visible button performs an action.
- ✅ Layout is responsive on mobile widths.
- ✅ No console errors observed during manual interaction.

## Known Limitations & Future Work
- The simulation runs in a single‑threaded JS loop; large numbers of rooms could affect performance.
- No real IoT backend – integration with MQTT/WebSockets could be added.
- Charts currently show only cumulative energy; more detailed time‑series could be implemented.
- Authentication is not implemented; a demo‑only "warden access" button could be added.

---

*Enjoy exploring DrySmart!*
