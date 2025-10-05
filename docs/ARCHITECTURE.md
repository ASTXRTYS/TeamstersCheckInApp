# Architecture Overview

This repository houses the **Teamsters Check-in Toolkit**, a Vite + React single-page application styled with Tailwind CSS and DaisyUI. The suite currently exposes three experiences:

- `worker` – mobile companion with shift timer, geofence awareness, and manifest
- `dashboard` – union rep drill-down for metrics and alerts
- `history` – searchable, paginated check-in ledger

## Project Layout

```
├── src
│   ├── App.tsx              # App shell + routing between feature surfaces
│   ├── data/mockApi.ts      # Seed data + async simulators for dashboards/history
│   ├── hooks/useGeofenceDistance.ts
│   ├── pages/
│   │   ├── WorkerMobilePage.tsx
│   │   ├── UnionDashboardPage.tsx
│   │   └── CheckinHistoryPage.tsx
│   ├── styles/tailwind.css
│   └── utils/format.ts
├── public/                  # Favicon and static assets
├── docs/                    # Product and engineering documentation
├── index.html               # Vite entry
└── tailwind.config.cjs      # Tailwind + DaisyUI theme definition
```

### Technology Stack

- **Vite** for fast dev build & HMR.
- **React Router** for client-side navigation across screens.
- **Tailwind CSS + DaisyUI** for theming, components, and the custom “nightshift” palette.
- **TypeScript** throughout (strict mode), composing data contracts and component props.

### Data Layer

All screens read from `src/data/mockApi.ts`, which mimics asynchronous API calls with seeded data and light mutation. Functions return typed objects (`ShiftManifest`, `DashboardSnapshot`, `CheckinRecord`). When a real backend exists, replace these fetch functions with network requests while retaining the API surface.

### State and Hooks

- **WorkerMobilePage** holds local state for the shift timer and time-of-day palette.
- **useGeofenceDistance** abstracts geolocation, providing distance and inside/outside status with simulated fallback.
- **React Query** is not yet in use; simple `useEffect` + `useState` patterns suffice for the current mock data.

### Styling and Theming

`tailwind.config.cjs` defines the `nightshift` DaisyUI theme. A custom palette rotates based on time-of-day to drive the worker widgets. Global element tweaks live in `src/styles/tailwind.css`.

### Build & Tooling

- `npm run dev` – boot Vite dev server (defaults to `localhost:5173`).
- `npm run build` – type-check via `tsc -b` and output production assets into `dist/`.
- `npm run preview` – preview the built app.

### Future Enhancements

- Replace mock API with live HTTP (introduce SDK or React Query).
- Implement unit tests around geofence hook and timer state machine.
- Provide environment-controlled feature flags (e.g., disable simulation in prod).
- Introduce CI for lint/test/build pipeline.
