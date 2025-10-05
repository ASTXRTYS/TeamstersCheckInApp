# Placeholder & Stub Matrix

Use this checklist when replacing mocked behaviors with production integrations.

| Area | Location | Current Behavior | Needs Replacement |
|------|----------|------------------|-------------------|
| Mock APIs | `src/data/mockApi.ts` | Returns seeded data with jitter. | Connect to backend services for manifests, dashboard metrics, and history. Keep interface compatibility or update UI contracts. |
| Geofence Simulation | `useGeofenceDistance` (simulation branch) | Oscillates a synthetic distance when location not available. | Once device permissions and backend validation exist, disable simulation in production via config flag. |
| Manual Check-In | `handleManualCheckIn` in `WorkerMobilePage.tsx` | Starts timer locally without persistence. | Replace with real check-in mutation + backend session tracking. |
| Quick Action Buttons | `quickActions` map in `WorkerMobilePage.tsx` | My Schedule opens local planner; others console log only. | Wire remaining quick actions to schedule copy/export, issue reporting, updates, and solidarity wall services. |
| Schedule Planner API | `SchedulePlanner` + `mockApi.ts` schedule helpers | Persists 7-hour shift placements (Mon–Fri timeline) in memory via mock API. | Replace with real `/api/schedule` endpoints (submit, fetch week, copy last week) and mirror client rules: 35-hour weekly target, 7-hour blocks, Friday 8 PM cutoff. |
| Worker Count | Hard-coded `47` in `WorkerMobilePage.tsx` | Static number. | Pull live count from manifest or real-time feed. |
| Dashboard Metrics | `mutateDashboard` in `mockApi.ts` | Applies random jitter. | Replace with live analytics pipeline; remove randomization. |
| History Export | `exportToCSV` in `CheckinHistoryPage.tsx` | Generates CSV client-side from mock data. | Coordinate with backend export API (or keep client CSV but fetch real data). |
| Environment Flags | `docs/CONFIG.md` references | No .env yet. | Introduce `.env.example` and actual Vite env usage when wiring to services. |
| Testing | `docs/TESTING.md` | Manual QA only. | Add automated unit/integration tests once real dependencies land. |

## Migration Tips

1. Keep TypeScript interfaces in sync when swapping mock APIs for HTTP clients.
2. Feature-flag risky integrations (e.g., `VITE_ENABLE_GEOFENCE_ENFORCEMENT`).
3. Update relevant docs when a placeholder is removed.
4. Add regression tests as dependencies become real to avoid breaking existing flows.
