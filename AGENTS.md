# AGENTS.md

Guidance for AI agents and contributors working in the PlayVille CRM UI.

This repository is currently the Angular frontend workspace for PlayVille CRM. If the project is later moved into a monorepo such as `playville-crm/frontend`, keep this file as the frontend-specific `AGENTS.md` and add a smaller global `AGENTS.md` at the monorepo root for cross-project rules.

## Project Overview

- Product: PlayVille Admin CRM for a kids play arena.
- App type: Staff-facing operational CRM, not a marketing site.
- Frontend: Angular 22 standalone components.
- Backend: Spring/API server expected at `http://localhost:8080`.
- Frontend dev server: Angular/Vite on `http://localhost:4200`.
- API base path from frontend: `/api/v1`.
- API proxy: `proxy.conf.json` maps `/api` to `http://localhost:8080`.
- Swagger contract: local `swagger.json`, and backend Swagger UI at `http://localhost:8080/api/v1/swagger-ui/index.html` when backend is running.

## Important Commands

Use PowerShell-friendly commands on Windows. Prefer `npm.cmd`/`npx.cmd` if script execution policy blocks `npm.ps1`.

```powershell
npm.cmd install
npm.cmd start
npm.cmd run build
npx.cmd tsc -p tsconfig.app.json --noEmit
```

Primary validation command:

```powershell
npx.cmd tsc -p tsconfig.app.json --noEmit
```

Known local note: `ng build --configuration development --progress=false` has previously exited with code `1` without useful diagnostics in this environment, while `tsc --noEmit` passed. Treat TypeScript validation as the baseline and investigate Angular CLI/build environment separately if build output is silent.

## Repo Shape

Key frontend files and areas:

- `src/app/app.routes.ts`: application routes.
- `src/app/auth.service.ts`: login, token storage, auth headers, branch lookup.
- `src/app/customer.service.ts`: customer and kid APIs.
- `src/app/admin/crm-api.service.ts`: packages, purchases, branches, staff, birthday bookings, school trips.
- `src/app/admin/checkin/checkin.service.ts`: check-in/check-out APIs.
- `src/app/admin/state/crm-store.facade.ts`: lightweight RxJS shared state/cache where useful.
- `src/app/theme.service.ts`: light/dark theme management.
- `src/styles.scss`: global theme tokens and shared UI styles.
- `src/app/shared/loading-spinner/`: common loading spinner.

## Auth And API Rules

- Login endpoint: `POST /api/v1/auth/login`.
- Token storage key: `playville_auth_token`.
- User storage key: `playville_auth_user`.
- Send authenticated calls with `Authorization: Bearer <token>`.
- Branch id is read from the stored auth user via `AuthService.getBranchId()`.
- Many backend responses are wrapped as `{ success, data, timestamp }`. Always normalize/unpack the `data` field before binding to templates.
- Some responses may be paginated or wrapped more than once. Prefer typed normalization helpers over ad hoc template assumptions.
- Do not hardcode backend host URLs in Angular services. Use `/api/v1/...` so the Angular proxy handles local development.

## Core Business Flows

Routes currently expected under `/admin`:

- `customers`: customer list with view, edit, purchase, and check-in actions.
- `customers/new`: onboard customer.
- `customers/:id`: customer detail.
- `customers/:id/edit`: edit customer.
- `kids`: kid management.
- `packages`: package create/edit/list.
- `purchases`: package purchase flow, optionally with `?customerId=`.
- `checkin`: check-in/check-out flow, optionally with `?customerId=`.
- `bookings`: birthday and school trip bookings.
- `branches`: branch management.
- `staff`: staff management.

Check-in expectations:

- Customer list check-in action navigates to `/admin/checkin?customerId=<id>`.
- Check-in page loads the selected customer from `/customers/{id}`.
- Customer can have multiple kids; UI must allow selecting one or more eligible kids in one check-in session.
- Active check-ins should load from `/checkins/active`.
- Check-out endpoint is `/checkins/{checkinId}/checkout`.
- Active check-ins are also cached locally with key `playville_active_checkins_cache` as a resilience fallback for demos.

Purchase expectations:

- Purchases can be started from a customer detail/action using `?customerId=`.
- Purchase payloads must match Swagger exactly. If the backend returns `400`, inspect the generated request body first, not just the UI state.

## UI And Theme Rules

The UI should feel playful and premium for PlayVille, while staying efficient for staff operations.

- Keep admin pages task-focused and fast to scan.
- Do not create marketing-style landing pages inside the CRM.
- Use global theme tokens from `src/styles.scss` instead of hardcoded colors.
- In dark theme, surfaces must remain dark and text must remain readable.
- In light theme, surfaces must remain light and text must remain dark.
- Avoid component-level hardcoded `#fff`, pale backgrounds, or fixed dark text that break dark mode.
- Prefer CSS variables such as:
  - `var(--app-bg)`
  - `var(--surface)`
  - `var(--surface-soft)`
  - `var(--text)`
  - `var(--text-muted)`
  - `var(--border)`
  - `var(--primary)`
  - `var(--danger)`
  - `var(--success)`
- Tables, forms, cards/panels, dropdowns, and buttons should inherit global theme styles wherever possible.
- Use the shared spinner component for loading states.
- Keep cards/panels restrained; operational screens should avoid nested cards and oversized decorative layouts.

## Rendering And Loading Rules

Several screens previously showed successful API responses in DevTools while the UI stayed stuck on loading. Be strict about these rules:

- Always set `loading = false` in both `next` and `error` paths for demo-critical screens.
- For affected screens, call `ChangeDetectorRef.detectChanges()` after updating arrays/forms/loading flags.
- Do not rely only on `finalize(() => loading = false)` where UI refresh has been flaky.
- Normalize API data before assigning it to UI arrays.
- Use safe defaults: empty arrays for lists, empty strings for optional text, and explicit booleans for flags.
- Avoid multiple redundant API calls from each dropdown. Reuse cached data from a facade/service when the same data is needed across screens.

## State Management

Do not reintroduce NgRx unless a version compatible with Angular 22 is available.

Context: `@ngrx/effects@21.1.1` has a peer dependency on Angular `^21.0.0`, while this project uses Angular `^22.0.0`, causing `ERESOLVE` dependency conflicts.

Preferred options:

- Use the existing RxJS facade/cache in `src/app/admin/state/crm-store.facade.ts` for shared lookup data.
- Use Angular signals for local component state where appropriate.
- Keep direct component subscriptions for screens where previous facade wiring caused stale loading states, but make sure normalization and `detectChanges()` are handled carefully.

## Coding Practices

- Use `rg` for searching files/text.
- Use `apply_patch` for manual edits.
- Keep changes scoped to the requested feature or bug.
- Do not revert user changes or run destructive git commands.
- Prefer existing component/service patterns over introducing new abstractions.
- Keep API types close to service boundaries and normalize raw backend responses there where possible.
- Do not use string parsing for structured data when TypeScript objects are available.
- Use succinct comments only where they clarify non-obvious behavior.

## Demo Smoke Checklist

Before calling CRM work complete, run through the high-value flows:

- Login succeeds and stores token/user.
- Customer list loads quickly after login.
- Customer search and customer actions render in both light and dark themes.
- Customer check-in navigates to `/admin/checkin?customerId=<id>` and shows parent plus kid dropdown/selection.
- Multi-kid check-in creates a session successfully.
- Active check-ins load on the check-in/check-out page.
- Check-out succeeds and removes/updates the active check-in row.
- Packages load and table text is readable in both themes.
- Purchases load customer/package dropdowns and submit a valid Swagger-compatible payload.
- Branches load and selected branch edit form renders.
- Staff list loads.
- Birthday bookings and school trip bookings load.
- No screen remains on a spinner after a successful API response.

## If This Becomes A Monorepo

Recommended structure:

```text
playville-crm/
  AGENTS.md          # Global cross-project rules
  backend/
    AGENTS.md        # Spring/backend-specific rules
    src/
  frontend/
    AGENTS.md        # Move this file here
    src/
  README.md
```

Global root rules should stay short: product context, branch/API contract, commit/test expectations, and coordination between backend and frontend. Keep Angular-specific guidance in the frontend `AGENTS.md`.
