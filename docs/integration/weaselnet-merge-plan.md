# WeaselNet merge plan

Branch: `feat/weaselnet-secure-merge`. Isolated from `main`. Not merged, not pushed, not deployed.

## Data flow

Owner browser → authenticated route → loopback check, session, same-origin check, and CSRF on writes → server repository → `data/weaselnet.sqlite`.

Visitor browser → `/explore` and `GET /api/explore` → approved editorial snapshot only. Draft fields, mission briefs, operator notes, captures, hardware overrides, and paths such as `/home/` are not in that response.

The theme choice (`a` or `b`) is a local display preference under `weaselnet-explore-theme`. It is not a second catalog and it is not authentication.

## Schema

SQLite, WAL, foreign keys on. Migration `MIGRATION_V1` in `lib/db/schema.ts`.

| Table | Role |
| --- | --- |
| `schema_migrations` | Applied migration ids |
| `owner_account` | Single owner. scrypt hash. No default password |
| `sessions` | SHA-256 of the session token and of the CSRF token. Absolute expiry |
| `projects` | Mission-file fields, archive state, revision |
| `showcase_entries` | Visitor card draft plus `approved_snapshot_json` |
| `notes`, `note_links`, `note_projects` | Field notes and rabbit-hole targets |
| `relationships` | Related projects and free-text waiting/blocked/unlocks |
| `review_flags` | Conflicts left for the owner. CoSpace Photon Fusion is flagged, not rewritten |
| `operator_*`, `captures`, `activity`, `evidence`, `hardware_overrides` | Ops-board state |
| `import_batches`, `import_holds` | EXFIL file hash, repeat detection, unknown slugs |
| `audit_log` | Mutation and import results. No note bodies, tokens, or secrets |

Optimistic updates require the current `revision`. A stale write returns 409 and does not overwrite.

Seed runs once per empty database and is repeat-safe. Later startups do not overwrite GUI edits. Source dates stay separate from migration time. Imported age is not treated as verification.

## Identity map

| Editorial name | Slug |
| --- | --- |
| Alfred / Al. | `alfred` |
| Here be dragons / Life_ | `fury-twins` |
| Here² / Co-Space | `cospace` (display name stays separate from the slug) |
| BATDECK / `>_` | `batdeck`, status `concept`. Not finished hardware |

## Routes

`/` stays the ops board and requires a session. `/explore` does not mount the operator shell, Quick Capture, Command Deck, private notes, or the operator header.

| Path | Who |
| --- | --- |
| `/login` | Public form. No registration |
| `/`, `/projects`, `/projects/new`, `/projects/[slug]`, `/projects/[slug]/edit`, `/departments`, `/drop`, `/publish`, `/hardware`, `/tools`, `/exfil` | Owner |
| `/explore`, `GET /api/explore` | Visitor snapshot |
| `/api/auth/login`, `/api/auth/logout`, `/api/auth/session` | Session |
| `/api/operator`, `/api/projects`, `/api/import/*`, `/api/backup`, `/api/backup/restore` | Owner writes, CSRF required |
| `/dev/workspaces` | Development loopback fixtures only. Still not sign-in. Production denial is unchanged |

## Source guide

- `lib/db/` repository, seed, validation
- `lib/auth/` password, session, access decision
- `lib/http/` loopback, same-origin, owner guard
- `lib/visitor/snapshot.ts` allowlist
- `lib/explore/trail.ts` bounded history and broken-target hiding
- `lib/import/exfil.ts` preview and transactional commit
- `lib/backup/backup.ts` files under `data/backups/`
- `app/(operator)/` existing Mission Control URLs
- `app/explore/` both visual options and field notes
- `components/project-editor.tsx` owner GUI
- `weaselnet-reference/` supplied design input, left in place

## Local setup

```powershell
npm install
$env:WEASELNET_OWNER_USERNAME="your-name"
$env:WEASELNET_OWNER_PASSWORD="a long password you choose"
npm run owner:provision
npm run dev
```

Dev and start bind to `127.0.0.1:43147`. There is no default password. `WEASELNET_ALLOW_NON_LOOPBACK` is unset. Do not open the database port. `data/` is gitignored.

## Backup and restore

Database backups are SQLite copies in `data/backups/`, beside the database and outside `public/`. Keep that folder on an encrypted volume you already trust. This app does not invent its own encryption and does not store a key in the repo.

EXFIL JSON is a labeled, unencrypted transfer. It is not a secure backup. Restore asks for the typed word `RESTORE`, checks the path stays inside `data/backups/`, and replaces the live database file. Recovery was tested with synthetic records before any real owner import.

## Owner walkthrough

1. Sign in.
2. Open **Projects → New project**.
3. Fill the mission file, the showcase card, and a rabbit-hole line such as `alfred | See the home system`.
4. **Preview draft**. The preview says it is not on the visitor site.
5. **Save draft**. The slug locks. Explore does not change.
6. **Approve visitor snapshot** only when the card text is the public version. The private brief stays off Explore.
7. **Archive** removes the card from Explore without deleting the row. **Restore** brings it back.

A synthetic Bench Lamp was created this way on the local database, approved, followed through to Alfred, then archived so Explore again shows Alfred, dragons, Co-Space, and BATDECK.
