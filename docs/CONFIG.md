# Configuration

The project currently uses mock data and default coordinates. This document tracks configuration knobs and future environment variables.

## Environment Variables

No environment variables are required yet. The following are planned:

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_API_BASE_URL` | Switch to real backend | `https://api.teamsters-app.com` |
| `VITE_ENABLE_MOCKS` | Force mock data even in prod builds | `true` |
| `VITE_GEOFENCE_RADIUS_METERS` | Override default radius | `150` |
| `VITE_GEOFENCE_LAT`, `VITE_GEOFENCE_LNG` | Override geofence center | `37.78081`, `-122.40524` |

Add a `.env.example` with the keys above when backend integration starts.

## Application Constants

Current defaults live in code:

- **Geofence target**: `GEOFENCE_TARGET` in `WorkerMobilePage.tsx`
- **Geofence radius**: `GEOFENCE_RADIUS_METERS`
- **Time-of-day palette**: `TIME_PALETTES` in `WorkerMobilePage.tsx`
- **Schedule planner defaults**: `CONFIG` in `src/components/SchedulePlanner.tsx` (7-hour blocks, 35-hour weekly target, Friday cutoff 8 PM)

Consider extracting these into a central config module if multiple components will use them.

## Worker Schedule Planner

The worker "My Schedule" modal uses the configuration object in `src/components/SchedulePlanner.tsx`:

- Workers place fixed 7-hour blocks on a Monday–Friday timeline (`SHIFT_LENGTH_HOURS`).
- Weekly goal is 35 hours / five shifts, surfaced via `WEEKLY_TARGET_HOURS`.
- Friday shifts must end by 8 PM (`MAX_FRIDAY_END_HOUR`), enforced client-side and to be mirrored on the API.
- Simple presets map to starting hours (`morning`, `afternoon`, `night`) and can be pushed into the detailed timeline.
- Feature toggles like `copyLastWeek` continue to gate enhancements; update this doc when enabling/disabling them.

## DaisyUI Themes

`tailwind.config.cjs` defines the `nightshift` theme. Update this file to tweak colors or introduce additional themes. If theming becomes user-selectable, expose a persisted preference (local storage or backend) and document it here.

## Feature Flags (Future)

Potential flags to document once implemented:

- `VITE_ENABLE_GEOFENCE_ENFORCEMENT`
- `VITE_ENABLE_TIMER_SIMULATION`
- `VITE_DASHBOARD_AUTO_REFRESH_MS`

Document each flag’s default, supported values, and safe rollout strategy.
