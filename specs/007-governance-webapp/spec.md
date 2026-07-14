---
id: "007-governance-webapp"
title: "Governance UI: Vite + React Router v7 webapp"
status: approved
created: "2026-07-14"
implementation: pending
depends_on:
  - "004-tenants-github-app"
establishes:
  - { kind: directory, path: "webapp/" }
summary: >
  Replaces the chassis's placeholder Vue SPA with the control plane's
  real face: a Vite + React Router v7 single-page app served by the
  chassis web service from web/dist, same-origin with the API and the
  embedded rauthy IdP. v1 surface: login, tenant list/create, GitHub
  App install flow, stamp launcher + job progress, fleet table with
  operation buttons. The platform UI is deliberately NOT a template
  flavor: it owes nothing to template stack choices (thesis §3).
---

# 007: Governance webapp

## 1. Territory

`webapp/` is re-established by this spec (the Vue placeholder from the
chassis import, spec 002, is deleted). New package name
`@stagecraft/webapp`, spec-spine manifest key -> this spec. Keep the
build contract identical: `npm --prefix webapp run build` emits into
`web/dist`; the web static service (chassis) is untouched.

## 2. Behavior

- Stack: React 19, React Router v7 in SPA/data-router mode
  (createBrowserRouter; no SSR), Vite, TypeScript strict. Styling:
  keep it minimal and dependency-light (CSS modules or vanilla-extract;
  no component framework in v1).
- Auth: session cookie from the chassis auth service; login page offers
  rauthy (same-origin /auth/v1 flow) and, in dev, the mock driver.
  CSRF header on mutating fetches, matching the chassis lib contract.
  A root loader hits `GET /api/v1/auth/me`; unauthenticated users land
  on /login.
- Routes:
  - `/` dashboard: tenants overview.
  - `/tenants/new`, `/tenants/:id` (installations, repos via spec 004
    endpoints, install-App call-to-action when none).
  - `/tenants/:id/stamps/new` (appName, org picker from installations,
    frontend flavor select, REQUIRED explicit agentic posture select
    with no preselected value), `/stamps/:jobId` live progress
    (poll GET /stamps/:jobId; states from spec 005's machine).
  - `/tenants/:id/fleet` table (spec 006 endpoints; deploy form,
    update/backup/remove actions with the confirm-name guard surfaced
    honestly in the UI).
  - Degrade gracefully when factory/fleet services are not yet
    deployed (404s from missing services render as "not enabled yet",
    not crashes), so this spec is implementable right after 004.
- API access: plain fetch wrappers with typed response shapes copied
  from the service specs; no codegen dependency in v1.

## 3. Acceptance

- `npm --prefix webapp run build` emits web/dist; `npm run dev` serves
  the SPA; login (mock driver) -> create tenant -> tenant detail works
  against a locally running control plane.
- With spec 005 present: launching a stamp shows live job progression.
- vitest component tests for the auth loader redirect and one route
  module; the chassis suite stays green.
- Spine gates green (webapp package repointed in spec-spine.toml if
  the standalone list names change).

## 4. Out of scope

- Approvals inbox rendering (spec 008 adds the data; a follow-up spec
  adds the UI once the shape exists).
- Design-system investment, theming, mobile polish.
- Admin/ops views beyond the fleet table.
