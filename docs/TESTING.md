# Testing Guide

Currently the suite relies on manual and build-time verification. This guide outlines the existing checks and planned coverage.

## Build & Type Checking

- `npm run build` – runs `tsc -b` (type check) followed by `vite build`.
- `npm run preview` – serves the built assets for end-to-end smoke testing.

CI (future) should include at minimum: `npm install`, `npm run build`, and automated tests (see below).

## Manual QA Checklist

1. **Worker App**
   - Ensure timer starts/resumes only inside geofence.
   - Leaving the radius auto-pauses and displays distance outside.
   - Color palettes rotate across dayparts (mock by adjusting system clock).
   - Quick actions respond (currently console stub).
2. **Union Dashboard**
   - Metrics load and jitter between refresh intervals.
   - Recent alerts animate in.
   - Active workers table scrolls on narrow viewports.
3. **Check-in History**
   - Search, site filter, and date filter operate together.
   - Pagination updates summary text.
   - CSV export downloads filtered subset.

## Planned Automated Tests

- Unit tests for `format` utils.
- Jest/Vitest tests for `useGeofenceDistance` with mocked geolocation.
- Component tests for Worker timer state machine (React Testing Library).

## Guidelines for Contributors

Until automated tests exist:

- Always run `npm run build` before pushing.
- Document manual test results in PR descriptions.
- If you adjust geofence/timer logic, note scenario coverage (inside/outside, permission denied, manual resume).

When test harness is added, update this doc with commands and coverage expectations.
