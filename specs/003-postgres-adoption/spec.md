---
id: "003-postgres-adoption"
title: "Control plane on CoreLedger-over-Postgres"
status: approved
created: "2026-07-14"
implementation: pending
depends_on:
  - "002-app-shell"
establishes:
  - "docker/compose.postgres.yml"
summary: >
  The control plane runs CoreLedger on the Postgres driver while stamped
  customer apps stay on libSQL/Turso: same decorator API, different
  driver, selected by URL scheme. The driver itself is enrahitu spec 011
  and lives in the chassis (core/ledger/postgres.ts); this spec is the
  consuming side: local Postgres for dev, config wiring, the migration
  posture for control-plane tables, and proof that the whole chassis
  test suite passes on both drivers inside this repo.
---

# 003: Postgres adoption

## 1. Cross-repo dependency (read first)

The Postgres driver is implemented in the template repo under enrahitu
spec 011. If the chassis imported by spec 002 does not yet contain
`core/ledger/postgres.ts`, this spec is blocked: stop and report
"blocked on enrahitu 011", do not fork the driver here. When the driver
exists upstream, refresh the chassis files it touches (core/ledger/*)
via a recorded manual re-import (same mode as spec 002 §2), then
proceed.

## 2. Territory

- `docker/compose.postgres.yml`: a dev Postgres 16 service (single
  container, named volume, port 5433 to avoid host collisions) plus a
  documented `npm run dev:db` script in the root package.json.
- Config wiring edits land in files owned by 002 (env plumbing) and are
  amended there if behavior moves.

## 3. Behavior

- Driver selection is config only: `STAGECRAFT_LEDGER_URL` (the chassis
  env name pattern with this app's prefix; check what spec 002's import
  actually produced, the chassis convention is <APPNAME>_LEDGER_URL)
  set to `postgres://...` selects the Postgres driver; `file:` keeps
  libSQL for quick local hacking. Document both in .env.example.
- Control-plane tables (tenants, installations, attestations, etc.)
  arrive with their owning service specs; this spec proves the
  substrate, not the schema.
- Migration posture: forward-only, additive-first, versioned, as
  enrahitu spec 011 §3 defines; destructive changes require a manual,
  reviewed migration. The control plane never auto-drops.
- FIPS rule: any checksum or auth SQL uses sha256, never md5 (the
  production Postgres targets reject md5; this burned the platform
  once).

## 4. Acceptance

- `docker compose -f docker/compose.postgres.yml up -d`, then
  `STAGECRAFT_LEDGER_URL=postgres://... npm test`: the chassis ledger
  and auth suites pass on Postgres.
- The same suite still passes with the default file: URL (libSQL).
- `npm run dev` against Postgres boots and `/health`'s decorator canary
  goes green.
- Spine gates green.

## 5. Out of scope

- Managed/production Postgres provisioning (fleet/infra concern).
- Any control-plane domain schema (owned by service specs 004+).
- Turso sync (stamped-app concern; the control plane does not sync).
