# Mock Data Layer

All screens currently read from `src/data/mockApi.ts`. This file simulates API responses and minimal real-time drift, allowing us to develop against realistic payloads without a backend.

## Structure

```ts
export interface ShiftManifest {
  siteName: string;
  shiftLabel: string;
  scheduledCount: number;
  workers: ManifestEntry[];
}

export interface DashboardSnapshot {
  metrics: DashboardMetrics;
  workers: DashboardWorker[];
  recentAlerts: DashboardAlert[];
}

export interface CheckinRecord {
  id: string;
  workerName: string;
  site: string;
  checkinTime: string; // ISO 8601
  checkoutTime?: string; // ISO 8601
  hoursWorked?: number;
  status: "Completed" | "In Progress";
}
```

Functions exported:

- `fetchShiftManifest()` – resolves a `ShiftManifest` with seeded workers.
- `fetchDashboardSnapshot()` – nudges metrics each call to simulate live data.
- `fetchCheckinHistory()` – returns check-in records.
- `addMockCheckin(record)` – prepends a new record (used for future form submissions).
- `resetMockData()` – resets state to initial seeds.

## Mutation Strategy

`fetchDashboardSnapshot()` calls `mutateDashboard`, which applies small random jitter to metrics and prepends occasional alerts.

`clone` uses JSON serialization to avoid leaking references between calls.

## Replacing with Live API

When connecting to a backend:

1. Replace the fetch functions with real HTTP requests (e.g., via `fetch` or an `axios` wrapper).
2. Keep the TypeScript contracts for consistency between UI and service.
3. Optionally retain these mock functions under a `mock/` namespace to support local/offline development.

## Testing

Unit tests (future) can import the pure helper functions (`mutateDashboard`, `formatDurationFromNow`, etc.) to validate behaviors without hitting network.

## Configuration Hooks

Expose environment variables for:

- Base API URL (`VITE_API_BASE_URL`)
- Feature toggles (e.g., `VITE_USE_MOCK_API=true` to force mock usage)

Document these in `docs/CONFIG.md` and `.env.example` when real endpoints arrive.
