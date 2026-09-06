# Personal workspaces — architecture freeze (Phase 0 / Phase 1)

Status: Phase 0 contracts frozen; Phase 1 development previews implemented. Stop before Phase 2 (real auth / isolated persistence).

## Actual current architecture (confirmed)

- **Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind 4, shadcn/ui (`@base-ui/react`).
- **Host model:** Local private console. No login. No database. Operator state in `localStorage` key `weaselnet-operator-v1`.
- **Route ownership:** `app/` routes + composition; `components/` interactive UI; `lib/` catalog + types.
- **Josh surface (preserve):** `/`, `/projects`, `/projects/[slug]`, `/drop`, `/departments`, `/publish`, `/hardware`, `/tools`, `/exfil`.
- **Shell:** `components/app-shell.tsx` wraps all pages via `app/layout.tsx`. On `/dev/workspaces*`, OperatorProvider and Josh operator tools are not mounted.
- **Alfred / Whisper / OBS / Tailscale:** catalogued as planned tools in `lib/tools.ts` only — no live adapters.
- **Tests (Phase 0 baseline):** none were present when Phase 0 was written.
- **Tests (Phase 1 current):** `lib/workspaces/*.test.ts` via `npm test` (access helpers, fixture isolation, shell/proxy contracts). No browser/RSC end-to-end harness yet.
- **Baseline checks (2026-09-06):** `npm run lint` exit 0; `npm run build` exit 0 after clearing a stale `.next/lock`.

## Proposed change (one codebase)

Keep Josh’s Mission Control as the default operator experience. Add modular, configuration-driven **student workspaces** behind a clearly labeled **development preview** path. Do not split into three apps or microservices.

```text
Browsers → Mission Control (existing AppShell)
  ├─ Josh routes (unchanged behavior; OperatorProvider + tools)
  └─ /dev/workspaces/* (Phase 1: 127.0.0.1 bind + non-production only)
       └─ shared StudentDashboard + WorkspaceConfig fixtures
```

Real authentication, owner-scoped APIs, and private deployment are Phase 2+.

## Route compatibility

| Surface | Path | Notes |
| --- | --- | --- |
| Josh Ops board | `/` | Unchanged; Josh “workspace home” |
| Existing Mission Control | `/projects`, `/drop`, … | Unchanged |
| Preview selector | `/dev/workspaces` | Dev-only; not auth |
| Student / Josh fixtures | `/dev/workspaces/[workspaceId]` | Shared student UI for student roles; Josh fixture links back to `/` |
| Production | any `/dev/*` | Denied via Next.js 16 `proxy.ts` rewrite to `/not-found`, plus page-level `notFound()` |

No renames of existing Josh routes in Phase 1.

## Identity and ownership model (contracts)

- **`WorkspaceConfig`:** UI configuration only (title, role, enabled module IDs, nav). Not a security policy.
- **`WorkspaceContext`:** intended authorized view once auth exists (`ownerId`, `workspaceId`, `mode`). Phase 1 preview sets `mode: "development-preview"` and never claims server authorization.
- **`ownerId`:** stable fictional fixture IDs for Phase 1. Later bound only to server-derived identity.
- **`Recording` metadata:** owner-scoped; statuses `received | queued | processing | ready | failed`. Mock entries are metadata only — not video artifacts and not ingest proof. UI labels derive from `artifactPresent`.
- **Deny by default:** resource access must eventually require server authorization. A URL, client `ownerId`, profile picker, or Tailscale membership alone is not authorization.

## Auth gap and preview gate (explicit)

Phase 1 has **no secure authentication**. Development profile previews:

- Bind the normal `npm run dev` server to **127.0.0.1** (loopback) so LAN peers cannot reach the process by default.
- Are unavailable when `NODE_ENV=production` (unconditional deny in helpers + `proxy.ts`).
- Use Host loopback checks as **defense-in-depth only**, not authentication and not a real security boundary. `X-Forwarded-Host` is ignored and never grants access.

Do not load real family/school data, connect Alfred intake, or claim privacy is proven by mocks.

Parental/admin access to student personal content is **unresolved** and must stay explicit — system controls do not silently grant content access.

## File ownership map (Phase 1)

| Path | Owner | Notes |
| --- | --- | --- |
| `docs/architecture/personal-workspaces.md` | Lead | This freeze |
| `lib/workspaces/**` | Lead | Shared contracts, fixtures, access/shell helpers, unit tests |
| `components/student-*.tsx`, `components/workspace-preview-banner.tsx` | UI (lead sequential) | Shared student modules |
| `app/dev/workspaces/**` | Lead | Preview routes |
| `proxy.ts` | Lead | Production/non-loopback rejection of `/dev` (Next.js 16 proxy) |
| `components/app-shell.tsx` | Lead | Minimal workspace-aware nav/banner; no operator tools on preview |
| `package.json` / lockfile | Lead only | Test runner script + `tsx`; `dev` binds 127.0.0.1 |
| Existing Josh routes/components/lib catalogs | Unchanged unless compatibility requires a touch | Preserve operator behavior |

## Rollback plan

1. Delete or revert `app/dev/`, `lib/workspaces/`, `components/student-*`, `components/workspace-preview-banner.tsx`, `proxy.ts`, and the small `app-shell` / `package.json` deltas.
2. Confirm Josh routes still build: `npm run lint && npm run build`.
3. Operator `localStorage` key and schema are untouched — no migration required for rollback.

## Phase 1 acceptance (preview only)

- Josh dashboard and links still work.
- Both student previews share one dashboard implementation with distinct configs.
- Mock recording `alfred-ingest-test-01.mkv` is metadata only (`artifactPresent: false`).
- Production rejects development profile bypass (proxy rewrite + page `notFound()`).
- No real records; auth/privacy remain open for Phase 2 review.
