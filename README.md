# Teamsters Check-in Toolkit

> A React/Vite suite powering worker check-ins, union dashboards, and historical reporting with dynamic dark-mode theming.

---

## 🚀 Quick Start

```bash
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

- `npm run build` — type-check + production bundle
- `npm run preview` — serve built assets for smoke testing

> Node 18+ recommended. Dependencies live in `package.json`; `node_modules/` is gitignored.

## 🧭 Documentation Index

| Topic | Description | Doc |
|-------|-------------|-----|
| Architecture | Stack, layout, data flow | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) |
| Worker UX | Daypart palettes, shift timer, geofence behavior | [`docs/UX-GUIDE.md`](docs/UX-GUIDE.md)<br>[`docs/worker/SHIFT_TIMER.md`](docs/worker/SHIFT_TIMER.md) |
| Data Layer | Mock API schemas & mutation strategy | [`docs/api/MOCK_DATA.md`](docs/api/MOCK_DATA.md) |
| Placeholders | Inventory of stubs needing real integrations | [`docs/PLACEHOLDERS.md`](docs/PLACEHOLDERS.md) |
| Configuration | Environment knobs & future flags | [`docs/CONFIG.md`](docs/CONFIG.md) |
| Testing | Manual QA + planned automation | [`docs/TESTING.md`](docs/TESTING.md) |
| Contributions | Branching, PR checklist, expectations | [`CONTRIBUTING.md`](CONTRIBUTING.md) |
| Inspiration | External UX + design references | [`docs/RESOURCES.md`](docs/RESOURCES.md) |

## 🧩 Feature Surfaces

- `/worker` — mobile companion with time-based theming and geofence-aware shift timer.
- `/dashboard` — metrics overview, recent alerts, active worker table.
- `/history` — filterable, paginated check-in ledger with CSV export.

Routing lives in `src/App.tsx`, screen components under `src/pages/`.

## 🧱 Technology Stack

- **React 18**, **React Router**, **TypeScript** (strict)
- **Vite** for dev/build pipeline
- **Tailwind CSS + DaisyUI** with custom `nightshift` theme defined in `tailwind.config.cjs`
- Mock data + simulators in `src/data/mockApi.ts`

Supporting modules:
- `src/hooks/useGeofenceDistance.ts` — distance + inside/outside tracking with simulated fallback
- `src/utils/format.ts` — shared time/distance formatters
- `src/styles/tailwind.css` — layered Tailwind styles and animations

## 🛠 Development Workflow

1. `git checkout -b feature/<topic>`
2. Make changes, update docs as needed.
3. `npm run build` to type-check and bundle.
4. Document manual QA (see `docs/TESTING.md`).
5. Open a PR following [`CONTRIBUTING.md`](CONTRIBUTING.md).

## 📦 Deployment Notes

- Build output lands in `dist/` (excluded from git).
- Configure hosting to serve `index.html` for SPA routing.
- When connecting to real APIs, surface environment variables per `docs/CONFIG.md`.

## 🧠 Onboarding Checklist

1. Read this README for orientation.
2. Skim [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and [`docs/UX-GUIDE.md`](docs/UX-GUIDE.md).
3. Review [`docs/worker/SHIFT_TIMER.md`](docs/worker/SHIFT_TIMER.md) if touching the worker experience.
4. Follow [`CONTRIBUTING.md`](CONTRIBUTING.md) before opening a PR.
5. Explore [`docs/RESOURCES.md`](docs/RESOURCES.md) for UX inspiration and best practices.

## 📚 Legacy Reference

Original HTML prototypes are preserved in `docs/`:

- `docs/Worker_Mobile_App_UI.html`
- `docs/Union_Rep_Dashboard.html`
- `docs/Checkin_History.html`

Use these to cross-check parity with the initial design snippets.
