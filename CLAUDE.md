# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server on http://localhost:5173
npm run build        # TypeScript check + production build
npm run preview      # Preview production build
```

Always run `npm run build` after code changes to verify TypeScript compilation.

## Architecture Overview

**Tech Stack**: React 18 + Vite + TypeScript + React Router + Tailwind CSS + DaisyUI

**Three-Role Application Structure**:
- `/worker` — Worker mobile companion with time-aware theming and shift tracking
- `/dashboard` — Union rep real-time metrics and active worker monitoring
- `/history` — Check-in history table with filtering/export capabilities

Navigation lives in `App.tsx` with a persistent top bar allowing role-switching.

**Data Flow**:
- All data comes from `src/data/mockApi.ts` which simulates network calls with delays (180-260ms)
- Mock API maintains stateful data that mutates on each fetch (dashboard metrics jitter, alerts can appear)
- Three main fetch functions: `fetchShiftManifest()`, `fetchDashboardSnapshot()`, `fetchCheckinHistory()`
- Pages auto-refresh every 30 seconds via `setInterval` in `useEffect`

**Styling System**:
- Custom DaisyUI theme called `nightshift` in `tailwind.config.cjs`
- Global styles in `src/styles/tailwind.css`
- Dark theme optimized for outdoor/industrial settings

**Time-Aware Theming** (Worker Page):
- Four gradient palettes in `WorkerMobilePage.tsx`: dawn, zenith (high noon), dusk, midnight
- Palette switches based on hour of day (4-9am, 9am-5pm, 5pm-9pm, 9pm-4am)
- Updates every 60 seconds via dedicated `useEffect`
- Affects shift timer widget, status card, and button colors dynamically

**TypeScript**:
- Strict mode enabled
- All types exported from `mockApi.ts` alongside data
- Main interfaces: `ShiftManifest`, `DashboardSnapshot`, `CheckinRecord`, `ManifestEntry`

## Key Files

- `src/App.tsx` — Router configuration and top-level layout
- `src/data/mockApi.ts` — All data types and mock data source
- `src/pages/WorkerMobilePage.tsx` — Contains time palette logic and shift timer
- `src/pages/UnionDashboardPage.tsx` — Metrics cards and worker table
- `src/pages/CheckinHistoryPage.tsx` — History table with export
- `src/utils/format.ts` — Date/time formatting utilities
- `tailwind.config.cjs` — DaisyUI theme customization
- `docs/` — Original HTML prototypes preserved for traceability

## Important Constraints

**From AGENTS.md**:
- Never modify `docs/*.html` files without explicit permission
- Changes to `mockApi.ts` or config must be documented in `docs/CONFIG.md` (if it exists)
- Never commit secrets; use `.env.example` (when created) and document in `docs/CONFIG.md`
- Run `npm run build` after edits — report failures immediately, don't guess
- Stay aligned with docs hierarchy: `README.md` → `ARCHITECTURE.md`, `SHIFT_TIMER.md`, `UX-GUIDE.md`, `RESOURCES.md`

**Design Philosophy**:
- Mock data variability simulates real-world conditions
- Outdoor-optimized UI with high contrast and clear status indicators
- Time-aware palettes enhance context awareness during different shifts
- DaisyUI provides accessible component foundation

## Development Tips

- Components use inline styles for time palette colors (not Tailwind classes) because palettes change dynamically
- Manifest workers have status badges: Active (green), On Break (yellow), Late (red), Checked Out (outline)
- The geofence/shift timer in WorkerMobilePage is currently a static prototype — see planned features in docs
- All timestamps use ISO 8601 format; `formatDurationFromNow()` converts to "2h 15m" style display
