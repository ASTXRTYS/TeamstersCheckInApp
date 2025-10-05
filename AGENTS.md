# Agent Quickstart

This file is for automation agents and copilots working in this repo. Stay aligned with human workflows by following the guardrails below.

1. **Start with the README**
   - Treat [`README.md`](README.md) as your primary map: it links to every deep-dive doc and outlines the branch/test workflow.
2. **Obey the Docs Hierarchy**
   - Architecture questions → [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
   - Worker timer/geofence logic → [`docs/worker/SHIFT_TIMER.md`](docs/worker/SHIFT_TIMER.md)
   - UX decisions & resources → [`docs/UX-GUIDE.md`](docs/UX-GUIDE.md) and [`docs/RESOURCES.md`](docs/RESOURCES.md)
3. **No Silent API or Config Changes**
   - If you touch `mockApi.ts`, geofence constants, or planned env flags, update [`docs/CONFIG.md`](docs/CONFIG.md) and mention it in your output.
   - Adding a new placeholder or external dependency? Extend [`docs/PLACEHOLDERS.md`](docs/PLACEHOLDERS.md) so humans know what still needs wiring.
4. **Always Validate**
   - Run `npm run build` after code edits. If the command fails, stop and report the failure; do not guess at the result.
5. **Document Intent**
   - When editing logic, note the scenario in your final response (e.g., “auto-pause outside geofence”). Reference relevant docs you updated.
6. **Protect User Data**
   - Never commit or log secrets. If you require new env vars, add them to `.env.example` (future) and document in `docs/CONFIG.md`.
7. **Stay Within Scope**
   - Do not remove or refactor user-provided prototypes in `docs/*.html` without explicit instruction.

When in doubt, surface questions to maintainers rather than improvising. Short, transparent updates keep human collaborators confident in agent contributions.
