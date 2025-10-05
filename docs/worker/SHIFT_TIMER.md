# Worker Shift Timer & Geofence

This document explains the shift timer logic, geofence integration, and how states interact.

## Overview

The worker home screen renders two key pieces of instrumentation:

1. **Shift Timer Widget** – quick glance of elapsed time, geofence badge, and daypart label.
2. **Shift Actions Modal** – detailed timer state with controls to start/pause/break/end shifts.

The implementation lives in `src/pages/WorkerMobilePage.tsx`.

## State Machine

`ShiftState` is maintained locally:

```
interface ShiftState {
  mode: "idle" | "running" | "paused";
  startedAt: number | null;
  baseMs: number;
  lastStoppedReason?: "geofence" | "manual";
}
```

- `mode` toggles between `idle`, `running`, and `paused`.
- `baseMs` tracks accumulated time (ms) when not actively running.
- `startedAt` is set when entering `running` to calculate current elapsed time.
- `lastStoppedReason` differentiates manual vs geofence pauses.

`computeElapsedMs` derives the current elapsed milliseconds based on the state above.

### Auto Pause

When `useGeofenceDistance` reports `isInside === false`, the component transitions to `paused`, stamps `baseMs`, and records `lastStoppedReason = "geofence"`. Manual resume is disabled until the user re-enters the geofence.

### Manual Controls

- **Start/Resume** – allowed only when the worker is inside the geofence.
- **Pause** – preserves current elapsed time and flips to `paused` with `manual` reason.
- **Manual Check-In** – bypasses geofence check and starts the timer, used when location is unavailable.
- **Take Break** – a manual pause from the modal.
- **End Shift** – resets state to `idle` and zeroes `baseMs`.

## Geofence Integration

`useGeofenceDistance` wraps the Geolocation API:

- Provides `status`, `distanceMeters`, `isInside`, and `source` (`live` or `simulated`).
- Works with a fallback simulation if permissions are denied or unsupported.
- Uses the haversine formula to calculate precise distance from the configured target.

Defaults:

```
const GEOFENCE_TARGET = { lat: 37.78081, lng: -122.40524 };
const GEOFENCE_RADIUS_METERS = 120;
```

Refine these values per shift location or expose them through env/config.

## Formatting Helpers

`src/utils/format.ts` adds

- `formatDurationHms(ms)` – converts milliseconds to `H:MM:SS`.
- `formatDistance(meters)` – renders friendly labels (meters/kilometers or “at checkpoint”).

## Simulation Mode

When geolocation is unavailable (`unsupported`, `denied`, or `error`), a simulated path keeps the UI alive for demos:

- Distance oscillates inside/outside the radius to exercise timer behavior.
- Status badge calls out the simulated state so operators know it isn’t live.

Disable simulation by setting `simulateWhenUnavailable: false` when instantiating the hook.

## Future Enhancements

- Persist shift session to backend to survive reloads.
- Hook timer to actual check-in events instead of manual triggers.
- Visualize path vs geofence on a mini-map.
- Emit toast notifications when auto-paused/resumed.
