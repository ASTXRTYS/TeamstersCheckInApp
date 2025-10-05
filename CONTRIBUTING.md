# Contributing Guide

Thanks for helping build the Teamsters Check-in Toolkit! This guide outlines expectations for contributors.

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Start dev server**
   ```bash
   npm run dev -- --host 127.0.0.1 --port 5173
   ```
3. **Run build before pushing**
   ```bash
   npm run build
   ```

## Branching Model

- Base branch: `main`
- Feature branches: `feature/<ticket-or-topic>`
- Commit messages: conventional (`feat:`, `fix:`, `chore:`) for history clarity.
- Keep dist/ and node_modules/ out of commits (already gitignored).

## Pull Request Checklist

- [ ] `npm run build`
- [ ] Update relevant docs (e.g., `docs/worker/SHIFT_TIMER.md` for timer changes).
- [ ] Include manual test notes or automated test results.
- [ ] Mention any config flags needed for reviewers.

## Coding Standards

- Use TypeScript for all new modules.
- Prefer functional React components and hooks.
- Keep styling within Tailwind + DaisyUI utilities; centralize theme updates in `tailwind.config.cjs`.
- Reuse helper functions in `src/utils/format.ts` when formatting times/distances.

## Testing Expectations

Until automated tests exist, run `npm run build` and document manual testing. See `docs/TESTING.md` for guidance. When test suites are added, run all relevant commands before merging.

## Working with Geofence Features

- If you modify geofence behavior, ensure simulator fallback still operates (permission denied scenario).
- Update `docs/worker/SHIFT_TIMER.md` when altering the state machine.
- Consider adding feature flags for risky changes.

## Communication

- Use PR descriptions to explain context, edge cases, and verification steps.
- Reference documentation updates in the PR body (e.g., “Updated `docs/UX-GUIDE.md` to match new gradient”).
- Tag maintainers for UX or product review when altering visual treatments.
