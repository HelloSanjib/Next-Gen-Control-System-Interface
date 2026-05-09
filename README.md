# Next-Gen Control System Interface

> **AI-assisted industrial HMI prototype** — a real-time control room dashboard simulating plant monitoring, AI triage, and role-based visibility for industrial systems.

---

## Table of Contents

- [Overview](#overview)
- [Live Features](#live-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Components](#components)
- [API Routes](#api-routes)
- [Data Model & Types](#data-model--types)
- [Core Libraries](#core-libraries)
- [Design System](#design-system)
- [Role-Based Views](#role-based-views)
- [Simulated Failure Scenarios](#simulated-failure-scenarios)
- [Getting Started](#getting-started)
- [Scripts](#scripts)

---

## Overview

**Next-Gen Control System Interface** is a full-stack industrial HMI (Human-Machine Interface) prototype built with **Next.js 14**, **TypeScript**, and **Tailwind CSS**. It demonstrates how a modern AI-augmented control room dashboard can monitor, triage, and present live plant data across multiple industrial systems — with full role-based views for operators and engineers.

The application simulates an **ABB Accelerator demo cell** covering five major process domains:

| Domain       | Systems                             |
|--------------|-------------------------------------|
| Cooling      | Chiller Loop 2, Pump P-07           |
| Production   | Assembly Line A, Robot Cell R-04    |
| Utilities    | Compressor C-01, Buffer Tank T-03   |
| Thermal      | Boiler B-05                         |
| Electrical   | Power Feeder A                      |

Data is refreshed every **3.8 seconds** via an internal Next.js API. If the API is unavailable, the client automatically falls back to a local simulation engine.

---

## Live Features

### 🔴 Real-Time Plant Simulation
- All 8 industrial systems generate **live telemetry** (temperature, pressure, vibration, flow rate, power load, efficiency) updated every 3.8 s.
- A sinusoidal wave function adds natural noise to metrics, making them feel live.
- System statuses (`normal`, `warning`, `critical`, `maintenance`) are computed automatically from metric thresholds.

### 🧠 AI Triage Engine
- Raw alerts are **grouped by correlation key** and compressed into actionable **Triage Cards**.
- Each card includes: severity, confidence score, impact description, primary/secondary actions, evidence list, and ETA to impact.
- A narrative summary is generated on every refresh cycle.
- Alert suppression rate is displayed (normal systems are kept quiet).

### 🗺️ Adaptive System Map
- Interactive **plant topology canvas** with dependency edges drawn as SVG lines.
- Systems are positioned using X/Y coordinates on a percentage-based grid.
- Nodes pulse with CSS animation when in **critical** status.
- Dependency lane color changes based on the worst status of connected nodes.
- A sidebar shows the **top 4 priority systems** with AI summaries.

### 📊 Focused Telemetry Panel
- Clicking any system node opens a **detailed telemetry view** for that asset.
- Shows a 20-point live **Recharts line chart** (temperature, pressure, vibration, efficiency).
- Displays all 6 metric snapshots (temp, pressure, vibration, flow, load, efficiency) as individual KPI cards.
- Shows the system's ETA to impact and linked dependency IDs.

### 🔔 Intelligent Alarm Feed
- Displays **grouped triage cards** with animated enter/exit transitions (Framer Motion).
- Each card shows: severity dot + label, alert count, confidence %, impact, primary action, and ETA.
- **Engineer role** sees an additional evidence block with raw signal readings.
- Cards can be **acknowledged** per group — acknowledged cards dim and are marked as resolved.
- A "Focus" button jumps the map view to the affected system.

### 👥 Role-Based Panels
- **Operator View**: Next Best Actions list (top 3 primary actions), system count summary (normal / warning / critical), shift note from highest-priority card.
- **Engineer View**: Full raw alert log table with timestamp, severity, system, signal value vs. threshold, and root cause hint. Plus a selected asset detail panel.

### 📈 System Health Overview
- 4 KPI cards always visible at the top:
  - **Plant Risk Score** (0–100) with gradient progress bar
  - **AI Compression** — number of triage cards vs. raw alert count
  - **Critical Surface** — count of critical alerts, critical/warning system badges
  - **Live State** — plant load %, last refresh timestamp, mode indicator (backend/fallback sim)

### 🔄 Graceful Fallback Mode
- If the `/api/alerts` route fails, the **client-side fallback simulator** (`buildMockFrame`) runs locally.
- The triage engine also runs locally in fallback mode.
- A "Local fallback" badge appears in the header when degraded.

---

## Tech Stack

| Category         | Technology                          | Version     |
|------------------|-------------------------------------|-------------|
| Framework        | Next.js (App Router)                | ^14.2.25    |
| Language         | TypeScript                          | ^5.7.2      |
| UI Library       | React                               | ^18.3.1     |
| Styling          | Tailwind CSS                        | ^3.4.17     |
| Animation        | Framer Motion                       | ^11.18.2    |
| Charts           | Recharts                            | ^2.15.0     |
| Icons            | Lucide React                        | ^0.468.0    |
| CSS Utilities    | clsx                                | ^2.1.1      |
| Form Plugin      | @tailwindcss/forms                  | ^0.5.7      |
| Linting          | ESLint + eslint-config-next         | ^8.57.1     |
| Type Checking    | tsc (strict)                        | built-in    |

---

## Project Structure

```
next-gen-control-system-interface/
├── src/
│   ├── app/
│   │   ├── globals.css              # Global styles, design tokens, component layer
│   │   ├── layout.tsx               # Root layout with metadata
│   │   ├── page.tsx                 # Entry page (renders ControlRoomDashboard)
│   │   └── api/
│   │       ├── alerts/
│   │       │   └── route.ts         # GET /api/alerts — returns a MockFrame
│   │       └── triage/
│   │           └── route.ts         # POST /api/triage — returns TriageResponse
│   │
│   ├── components/
│   │   ├── ControlRoomDashboard.tsx # Root layout shell, header, footer
│   │   ├── SystemHealthOverview.tsx # 4 KPI cards row
│   │   ├── DynamicSystemLayout.tsx  # Interactive plant map + priority sidebar
│   │   ├── IntelligentAlarmFeed.tsx # Grouped triage card list
│   │   ├── TelemetryPanel.tsx       # Per-system metrics + trend chart
│   │   ├── RoleSpecificPanels.tsx   # Operator action queue / Engineer diagnostics
│   │   └── RoleSwitcher.tsx         # Operator / Engineer toggle
│   │
│   ├── context/
│   │   └── ControlRoomContext.tsx   # Global state provider (React Context + hooks)
│   │
│   ├── data/
│   │   └── industrialModel.ts       # Static blueprints for all 8 systems
│   │
│   ├── lib/
│   │   ├── alertSimulator.ts        # Generates MockFrame — metrics, alerts, scenarios
│   │   ├── triageEngine.ts          # Groups alerts into TriageCards
│   │   ├── severity.ts              # Severity rank, dot/label/tone helpers
│   │   ├── format.ts                # Number and time formatters
│   │   └── cn.ts                    # clsx utility wrapper
│   │
│   └── types/
│       └── industrial.ts            # All shared TypeScript interfaces and types
│
├── scripts/
│   ├── dev-server.cjs               # Sandbox-compatible dev server entrypoint
│   └── sandbox-node-shim.cjs        # Node shim for sandbox environments
│
├── tailwind.config.ts               # Custom color palette, shadows, animations
├── next.config.mjs                  # Next.js config
├── tsconfig.json                    # TypeScript config
└── package.json
```

---

## Architecture

```
Browser Client
     │
     │  polls every 3.8s
     ▼
ControlRoomContext (React Context)
     │
     ├──▶ GET /api/alerts?cursor=N
     │         │
     │         └──▶ alertSimulator.buildMockFrame(cursor)
     │                   ├── scenarioStates(tick)     — 5 rotating fault scenarios
     │                   ├── buildMetrics()           — sinusoidal + scenario adjustments
     │                   ├── classifySystem()         — status from thresholds
     │                   └── createAlerts()           — alert objects per active scenario
     │
     ├──▶ POST /api/triage { alerts, systems }
     │         │
     │         └──▶ triageEngine.triageAlerts()
     │                   ├── Groups by correlationKey
     │                   ├── Builds TriageCard per group
     │                   └── Scores confidence, sorts by severity
     │
     └── Distributes state to all components via useControlRoom() hook

Components:
  ControlRoomDashboard   ← header, hot alarm count, refresh button
  SystemHealthOverview   ← plant risk, AI compression, critical surface, live state
  DynamicSystemLayout    ← plant map canvas + priority sidebar
  IntelligentAlarmFeed   ← triage card list with acknowledgement
  TelemetryPanel         ← KPI metrics + Recharts trend chart
  RoleSpecificPanels     ← role-conditional operator or engineer panel
  RoleSwitcher           ← role toggle (operator | engineer)
```

---

## Components

### `ControlRoomDashboard`
The root shell component. Renders the page header (title, hot alarm counter, card count, role switcher, refresh button), orchestrates all child sections, and shows a footer with current role and build info.

### `SystemHealthOverview`
A 4-column KPI strip always visible at the top of the dashboard. Shows:
- **Plant Risk**: composite score (0–100) with animated gradient bar.
- **AI Compression**: `N cards from M alerts` with suppression rate.
- **Critical Surface**: critical alert count with system status badges.
- **Live State**: plant load % and last refresh timestamp with mode label.

### `DynamicSystemLayout`
An interactive plant topology panel:
- SVG overlay renders dependency edges between system nodes, colored by worst status.
- Each system is an absolute-positioned `motion.button` node using `x`/`y` % coordinates.
- Critical nodes animate with a subtle breathing pulse.
- A sidebar ranks the **top 4 systems by priority** with AI summaries.
- Clicking any node sets it as the selected system.

### `IntelligentAlarmFeed`
Renders triage cards with `AnimatePresence` for smooth layout transitions:
- Cards show severity, confidence, alert count, impact, primary action, ETA.
- Engineers additionally see a raw evidence block.
- Each card has a **Focus** (jump to system map) and **Acknowledge** button.
- Acknowledged cards fade and desaturate without disappearing.

### `TelemetryPanel`
Deep-dive panel for the currently selected system:
- 6 KPI metric tiles (temperature, pressure, vibration, flow rate, power load, efficiency).
- A 20-point Recharts `LineChart` showing the last 20 simulation ticks of temperature, pressure, vibration, and efficiency.
- ETA to impact badge and AI summary sentence.
- Dependency IDs listed as tags at the bottom.

### `RoleSpecificPanels`
Conditionally renders one of two panels based on active role:
- **Operator**: Next Best Actions (top 3 primary actions from triage cards), system status counts grid, shift note.
- **Engineer**: Raw alert log table (time, severity, system, signal=value, root cause hint) + selected asset detail card.

### `RoleSwitcher`
A compact toggle button group. Switches between `operator` and `engineer` context. The active role is highlighted with a cyan glow. Role switching triggers an animated transition on the main content area (Framer Motion `key` swap).

---

## API Routes

### `GET /api/alerts?cursor=N`
Returns a `MockFrame` JSON object.

| Field         | Type               | Description                              |
|---------------|--------------------|------------------------------------------|
| `cursor`      | `number`           | Incremented tick for next request        |
| `generatedAt` | `string` (ISO)     | Server timestamp                         |
| `plantLoad`   | `number`           | Average power load across all systems    |
| `riskScore`   | `number` (0–100)   | Composite plant risk score               |
| `systems`     | `IndustrialSystem[]` | All 8 systems with live metrics        |
| `alerts`      | `IndustrialAlert[]` | Active alerts sorted by severity        |

### `POST /api/triage`
Accepts `{ alerts, systems }` and returns a `TriageResponse`.

| Field                  | Type           | Description                              |
|------------------------|----------------|------------------------------------------|
| `cards`                | `TriageCard[]` | Grouped action cards, sorted by severity |
| `groupedAlertCount`    | `number`       | Total alerts across all cards            |
| `suppressedNormalCount`| `number`       | Number of normal systems suppressed      |
| `suppressionRate`      | `number`       | Percentage of noise suppressed           |
| `narrative`            | `string`       | Human-readable summary sentence          |

---

## Data Model & Types

All types are defined in `src/types/industrial.ts`.

### Core Types

```typescript
type Role        = "operator" | "engineer";
type Severity    = "critical" | "high" | "medium" | "low" | "normal";
type SystemStatus = "normal" | "warning" | "critical" | "maintenance";
type SystemKind  = "pump" | "chiller" | "compressor" | "boiler" | "line" | "power" | "tank" | "robot";
type AlertCategory =
  | "Pump Failure" | "Temperature Spike" | "Pressure Drop"
  | "Vibration"    | "Power Quality"     | "Flow Imbalance"
  | "Sensor Drift" | "Maintenance Window";
```

### Key Interfaces

**`IndustrialSystem`** — One plant asset:
- `id`, `name`, `area`, `kind`, `status`, `priority` (0–100)
- `owner`, `x`, `y` (position %), `dependencies` (array of system IDs)
- `etaToImpact`, `aiSummary`, `metrics: MetricSnapshot`, `trend: TrendPoint[]`

**`MetricSnapshot`** — 6 live sensor readings:
- `temperature` (°C), `pressure` (bar), `vibration` (mm/s)
- `flowRate` (%), `powerLoad` (%), `efficiency` (%)

**`IndustrialAlert`** — One raw alarm event:
- `severity`, `category`, `title`, `signal`, `value`, `unit`, `threshold`
- `description`, `rootCauseHint`, `recommendedAction`
- `correlationKey` (groups related alerts), `roleVisibility` (which roles see it)

**`TriageCard`** — Grouped action card:
- `severity`, `confidence` (%), `count`, `impact`, `primaryAction`, `secondaryAction`
- `evidence[]`, `etaToImpact`, `status` (`new | watching | acknowledged`)
- `affectedSystemIds`, `affectedSystemNames`, `alertIds`

---

## Core Libraries

### `alertSimulator.ts`
The **simulation engine**. Called by the `/api/alerts` route and by the client-side fallback.

- `buildMockFrame(cursor, now)` — main entry point. Returns a complete `MockFrame`.
- `scenarioStates(tick)` — determines which of the 5 fault scenarios are active and at what intensity, based on modular arithmetic on the tick counter.
- `getMetricAdjustments(systemId, scenarios)` — computes per-system metric deltas for active scenarios.
- `buildMetrics(index, tick, adjustments)` — adds sinusoidal natural variation on top of base values + scenario adjustments, then clamps to safe ranges.
- `buildTrend(index, tick, adjustments)` — generates 20 historical data points, ramping scenario effects up gradually for a realistic trend shape.
- `classifySystem(metrics, systemId)` — maps metric values to `SystemStatus` via threshold rules.
- `createAlerts(systems, tick, scenarios, now)` — builds alert objects for each active scenario and affected system.

### `triageEngine.ts`
Groups raw `IndustrialAlert[]` into `TriageCard[]`.

- Groups alerts by `correlationKey`.
- Looks up a `contextDictionary` for known scenario keys (title, impact, actions, ETA).
- Computes a `confidence` score (68 base + per-alert/system/severity bonuses, capped at 98).
- Generates a `summary` sentence with category list and severity label.
- Builds an `evidence[]` list of up to 4 `"system: signal=value vs threshold"` strings.
- Sorts cards by severity then by alert count.
- Returns `suppressionRate`, `groupedAlertCount`, and a `narrative` string.

### `severity.ts`
Utility functions for severity display:
- `severityRank` — numeric rank for sorting (`critical=4`, `high=3`, `medium=2`, `low=1`, `normal=0`).
- `highestSeverity(severities[])` — returns the most critical value in an array.
- `severityTone(severity)` — Tailwind class string for card border/background.
- `severityDot(severity)` — Tailwind class for the colored dot indicator.
- `severityLabel` — display name map.

### `format.ts`
- `formatNumber(value, decimals?)` — locale-aware number formatter.
- `compactPercent(value)` — renders `"72%"`.
- `formatTime(iso)` — renders `"HH:MM:SS"` from ISO string.
- `clamp(value, min, max)` — numeric clamp utility.

### `cn.ts`
Thin `clsx` wrapper for conditional className merging.

---

## Design System

Defined in `tailwind.config.ts` and `globals.css`.

### Color Palette

| Token                   | Hex        | Usage                          |
|-------------------------|------------|--------------------------------|
| `control-base`          | `#05070b`  | Page background                |
| `control-panel`         | `#0b1118`  | Panel background               |
| `control-panel2`        | `#101922`  | Nested panel / input BG        |
| `control-edge`          | `#203141`  | Section dividers               |
| `control-line`          | `#2d4153`  | Card borders                   |
| `control-text`          | `#e5eef5`  | Primary text                   |
| `control-muted`         | `#8394a5`  | Secondary / label text         |
| `alarm-critical`        | `#ff3b4f`  | Critical alert red             |
| `alarm-high`            | `#ff8a3d`  | High alert orange              |
| `alarm-medium`          | `#ffd24d`  | Medium alert amber             |
| `alarm-low`             | `#38bdf8`  | Low alert sky blue             |
| `alarm-normal`          | `#35d08f`  | Normal / OK green              |
| `process-cyan`          | `#31d6ff`  | Active state, links, accents   |
| `process-mint`          | `#35d08f`  | Positive indicators            |
| `process-amber`         | `#ffd24d`  | Warning indicators             |
| `process-coral`         | `#ff6b62`  | Temperature line in chart      |

### Custom Shadows
- `shadow-critical` — red glow ring for critical nodes.
- `shadow-high` — orange glow ring for warning nodes.
- `shadow-panel` — subtle deep shadow for panel depth.

### Custom Animations
- `animate-scan` — 3.8 s horizontal sweep signal line.
- `animate-breathe` — 2.4 s opacity pulse for connecting indicators.

### Component Classes (CSS Layer)
- `.control-panel` — shared panel shell with border, bg, backdrop blur, shadow.
- `.control-button` — standardized interactive button with cyan focus ring.
- `.metric-label` — tiny uppercase tracking label for KPI headers.
- `.signal-line` — cyan gradient for the animated scanner line on the plant map.

---

## Role-Based Views

The `RoleSwitcher` component toggles between two roles stored in `ControlRoomContext`.

| Feature                         | Operator | Engineer |
|---------------------------------|:--------:|:--------:|
| System Health KPI strip         | ✅       | ✅       |
| Adaptive Plant Map              | ✅       | ✅       |
| AI Triage Card Feed             | ✅       | ✅       |
| Evidence block in triage cards  | ❌       | ✅       |
| Low-severity alerts visible     | ❌       | ✅       |
| Focused Telemetry Panel         | ✅       | ✅       |
| Next Best Actions panel         | ✅       | ❌       |
| Raw alert log table             | ❌       | ✅       |
| Selected asset detail card      | ❌       | ✅       |

> Low-severity (`low`) alerts have `roleVisibility: ["engineer"]` and are filtered out for operators automatically.

---

## Simulated Failure Scenarios

The alert simulator rotates through 5 named fault scenarios driven by modular arithmetic on the tick cursor. Each scenario affects specific systems.

| Scenario Key                  | Affected Systems                        | Cycle (ticks) |
|-------------------------------|-----------------------------------------|---------------|
| `cooling-loop-instability`    | Chiller Loop 2, Pump P-07, Assembly Line A | Every 18   |
| `compressed-air-sag`          | Compressor C-01, Buffer Tank T-03, Assembly Line A | Every 21 |
| `thermal-pressure-excursion`  | Boiler B-05, Buffer Tank T-03           | Every 26      |
| `power-quality-harmonics`     | Power Feeder A, Robot Cell R-04, Boiler B-05 | Every 23 |
| `robot-cell-drift`            | Robot Cell R-04, Assembly Line A        | Every 16      |

Each scenario generates correlated alerts with matching `correlationKey` values so the triage engine can group them into a single action card. Scenario intensity ramps up and down within each cycle window to simulate realistic escalation curves.

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x

### Installation

```bash
git clone https://github.com/HelloSanjib/Next-Gen-Control-System-Interface.git
cd Next-Gen-Control-System-Interface
npm install
```

### Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The application will start polling `/api/alerts` every 3.8 seconds and `/api/triage` after each alert refresh. If any API call fails, the client falls back to its local simulation engine automatically.

### Production Build

```bash
npm run build
npm start
```

---

## Scripts

| Script              | Description                                              |
|---------------------|----------------------------------------------------------|
| `npm run dev`       | Start Next.js development server                         |
| `npm run build`     | Build production bundle                                  |
| `npm start`         | Start production server                                  |
| `npm run lint`      | Run ESLint across the `src/` directory                   |
| `npm run typecheck` | Run TypeScript type checker (`tsc --noEmit`)             |
| `npm run dev:sandbox` | Dev server via sandbox-compatible node shim            |
| `npm run lint:sandbox` | ESLint via sandbox-compatible node shim              |
| `npm run typecheck:sandbox` | TypeScript check via sandbox-compatible node shim |

---

## License

This project is a **hackathon demo prototype** (`72-hour build`). All plant data, system names, and alert scenarios are entirely simulated and do not represent any real industrial facility.

---

<div align="center">
  <sub>Built with Next.js · TypeScript · Tailwind CSS · Framer Motion · Recharts</sub>
</div>
