# Teamsters Check-in App

Picket Tracker suite built with **React**, **Vite**, **Tailwind CSS**, and **DaisyUI**. It collects the three core experiences you supplied (worker mobile companion, union rep dashboard, and check-in history) into a single cohesive app with mocked data flows.

## Getting started

```bash
npm install
npm run dev
```

That starts Vite on http://localhost:5173. Build with `npm run build`.

> Dependencies are declared in `package.json`, but `node_modules` aren't committed. Run `npm install` before starting the dev server.

## App structure

- `/worker` &mdash; Worker mobile app view with collapsible shift manifest and CTA.
- `/dashboard` &mdash; Union rep dashboard summarising metrics, alerts, and active workers.
- `/history` &mdash; Check-in history table with filtering, pagination, and CSV export.

Navigation sits in the top bar so you can flip between roles. State for metrics and tables comes from `src/data/mockApi.ts`, which simulates network calls and light variability.

## Styling

Tailwind and DaisyUI supply the design system. Global tweaks live in `src/styles/tailwind.css`, which re-implements the hover/animation touches from your static snippets.

Original supplied markup is preserved under `docs/` for traceability.
