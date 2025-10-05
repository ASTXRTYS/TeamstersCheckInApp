# UX Guide

This guide captures the intent behind the current user experience so future changes stay aligned with the product vision.

## Worker Mobile Experience

### Time-of-Day Palette

The worker homepage uses a dynamic palette that rotates through four dayparts using `resolveTimePalette` in `WorkerMobilePage.tsx`:

| Daypart | Window (hour) | Palette Keywords | Intent |
|---------|----------------|------------------|--------|
| Dawn    | 04:00 – 08:59  | Warm amber → coral | Soft wake-up, calm ramp into shift |
| Zenith  | 09:00 – 16:59  | Citrus → ember | High-energy midday push |
| Dusk    | 17:00 – 20:59  | Magenta → violet | Golden hour / afterglow |
| Midnight| 21:00 – 03:59  | Indigo → starfield | Nocturnal lo-fi |

The palette affects:
- Gradient background (`backgroundImage`)
- Text + muted text colors
- Badge / button overlays
- Box-shadow intensity

### Shift Timer & Geofence

- Timer only runs when the worker is within the geofence radius.
- Leaving the zone triggers an automatic pause with explicit outside distance label (e.g., “Outside by 34 m”).
- Modal exposes manual controls (start/pause/break/end) but respects geofence constraints.
- Manual check-in is available for cases where GPS is unavailable (simulates start).

### Quick Actions

The four quick action tiles are intentionally minimal. Icons anchor the action; optional badges (e.g., “Updates – 3 new”) call attention to asynchronous tasks.

- **My Schedule** now opens a modal planner with Simple (7-hour shift presets) and Detailed (timeline) views. Detailed mode lets workers slide fixed 7-hour blocks anywhere between Monday 12 AM and Friday 8 PM, showing overnight wraps and remaining hours at a glance.
- Simple view presents a five-day checklist: tap to cycle presets, mark days off, or jump into Detailed. Weekend coverage is optional and clearly annotated.

### Accessibility & Feedback

- Button labels describe action (“Start Shift”, “Pause Shift”) and icon conveys state.
- Alerts (warning/info) tell the user what to do next (“Head back inside perimeter”) or why certain actions are disabled.
- Layout maintains consistent vertical rhythm with 16–20px spacing to avoid overlap.

## Dashboard & History

- Dashboard stats use DaisyUI stat cards. Hover animations are subtle (translateY).
- Recent alerts animate in (`slide-in`) to focus attention.
- History table includes filter inputs, zebra striping, hover states, and CSV export.

## Resource Library

See `docs/RESOURCES.md` for links to dark-mode, gradient, and geofence UX references.
