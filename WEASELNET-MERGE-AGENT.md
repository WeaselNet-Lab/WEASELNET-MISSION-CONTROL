# WeaselNet integration agent — Cursor implementation brief

Date: 2026-09-24
Owner: Josh / WeaselNet Labs
Target repository: WEASELNET-MISSION-CONTROL
Deliverable: an isolated, reviewable implementation of Explore the Lab + Mission Control + database-backed project editing.

## Invocation and authority

Place this file in the Mission Control repository root alongside the supplied `weaselnet-reference/` directory. In Cursor Agent, ask:

> Read WEASELNET-MERGE-AGENT.md and the repository instructions. Implement the phases in order on an isolated branch, preserving the existing application and both supplied visual options. Start with the baseline audit, then continue through the database, project editor, Explore experience, migration, and verification. Record completed work and blockers as you go. Do not deploy or change live services.

This is a task brief, not a replacement for AGENTS.md or CLAUDE.md. Read those and any scoped instructions first. The inspected AGENTS.md requires consulting the installed Next.js documentation before writing framework code. Preserve that requirement. Use the current checkout and installed documentation as implementation authority; the observations below describe an uploaded snapshot, not guaranteed current HEAD.

Work autonomously through reversible local implementation and verification. Do not pause for routine naming or layout choices. Stop only for missing essential inputs, destructive actions, credentials, or an unresolved deployment choice that materially changes persistence. Never invent working integrations or bypass existing protections. Do not launch separate agents unless the user or repository instructions explicitly authorize them.

## Outcome

One coherent WeaselNet Labs product with two experiences:

1. **Explore the Lab:** an inviting project showcase with curiosity-driven rabbit holes and field notes.
2. **Mission Control:** Josh's working application for projects, capture, checkpoints, logs, evidence, hardware, and publish readiness.
3. **Project editor:** an owner-facing GUI for adding and maintaining project data without editing TypeScript or SQL.

Use the existing Next.js application as the foundation. Port the supplied static design into maintainable components rather than replacing the application with static HTML or embedding the old site in an iframe. Keep actual project code in its own repositories.

## Preserve these decisions

- Rabbit holes are essential, including their editorial questions, connected notes, breadcrumbs, and optional random-thread discovery.
- Keep both design options available during review: A is the original cyan/graphite direction; B is graphite/grey with orange/yellow accents and sturdier typography. Josh leans toward B; A remains a valid option.
- Preserve the original typographic project motifs: **Al.**, **Here²**, **Life_**, and **>_**. Do not replace them with the uploaded logos.
- Preserve the four showcase subjects: Alfred, the dragons, Co-Space, BATDECK; and the builder introduction and workshop concept image.
- Preserve the subtle field-note flip entrance and reduced-motion fade in `weaselnet-reference/field-notes.css`.
- Eugene is a separate future character/3D experiment. Do not add sprite swaps, mascot placeholders, a 3D runtime, or logo replacements in this task.
- Preserve operational capabilities and existing development-only student preview protections. Do not ship a profile selector as authentication.
- Keep the prototype private. No public deployment, production changes, paid services, or live Alfred integration are authorized by this brief.
- Do not treat a publish-readiness checklist as approval to publish content or evidence.

## Inputs included in this handoff

`weaselnet-reference/` contains the exact current static showcase source and artwork exported from the separate Sites project. It is a design/content reference, not another app to deploy. It includes both variants, project stories, linked notes, responsive CSS, and field-note animation. The live reference was https://weaselnet-labs.poetic-olm-4101.chatgpt.site and may require the owner's sign-in; local source is sufficient.

The reference excludes Sites hosting identity, credentials, Git history, and the reverted Eugene/logo experiment. Do not recreate or import that experiment.

## Snapshot findings to verify

The uploaded repository specified Next.js 16.3.4, React 19.2.8, TypeScript, Tailwind, and existing Base UI/shadcn primitives. Preserve its package manager and lockfile; avoid unrelated upgrades.

Relevant files:

- `lib/projects.ts`, `lib/departments.ts`, `lib/hardware.ts`: catalog data.
- `lib/types.ts`: projects, publish gates, checkpoints, captures, activity, evidence, hardware overrides, operator state.
- `lib/mission-links.ts`: blocked-by, waiting-for, and unlocks descriptions.
- `components/operator-provider.tsx`: browser persistence under `weaselnet-operator-v1`.
- `components/mission-file.tsx`: brief, next action, checkpoints, notes, logs, evidence, linked systems.
- `components/app-shell.tsx`, `lib/workspaces/shell.ts`: global operator shell and preview separation.
- `app/exfil/page.tsx`: JSON export with schema `weaselnet-operator-v2`; import also accepts legacy raw state.
- `proxy.ts`, `lib/workspaces/access.ts`, `lib/workspaces/*.test.ts`: development-preview boundary.
- `lib/tools.ts`: integration registry. Alfred/Whisper/Tailscale/telemetry are planned, not implemented network integrations.

The ZIP contains code and seed catalog, not the user's saved browser state. No production auth/database was present in the inspected snapshot. The build has not been verified by this handoff author.

## Phase 0 — Baseline and preservation

1. Inspect git status, repository instructions, package scripts, dependency availability, current routes and existing tests. Preserve unrelated/uncommitted work.
2. Create an isolated feature branch or worktree. Record the original HEAD and a rollback reference without rewriting history.
3. Read installed framework docs as instructed. Establish the existing build/test baseline; distinguish pre-existing failures from introduced failures.
4. Record route/component/data mapping in `docs/integration/weaselnet-merge-plan.md` and progress in `docs/integration/weaselnet-merge-progress.md`.
5. Inspect both supplied visual options before porting. Record required visual/behavior invariants.

Acceptance: reproducible baseline, preserved original code, identified runtime and storage assumptions, no production changes.

## Security-first execution order — owner direction

Josh explicitly requested a more secure data path after commissioning this brief. Treat security as part of the implementation, not a later polish phase. After Phase 0, implement Phase 1 together with the access controls in Phase 5 before connecting the project editor or importing real data. Then complete Phases 2–4 and verification.

Required flow:

Owner browser → authenticated application endpoint → authorization + validated input → server-side repository layer → durable database.

Visitor browser → allowlisted approved editorial snapshot only.

Use server-managed sessions and a maintained authentication implementation appropriate to the runtime. Do not keep passwords, long-lived bearer tokens, database credentials, or canonical project data in localStorage. Session cookies must be HttpOnly, use an appropriate SameSite policy, and be Secure under HTTPS. Protect write requests against CSRF; enforce authorization in every privileged handler, not only navigation or middleware. Treat owner identity as a server decision, never an editable client field.

Make the prototype single-owner; do not expand into production daughter accounts or multi-tenant administration in this task. Owner provisioning must be explicit, with no open registration, default password, or development bypass in production. If credentials/configuration are unavailable, implement and test the boundary with synthetic fixtures, fail closed, and document the exact setup needed. Do not claim protected remote access is finished until it is exercised.

Private remote hosting should remain behind the intended private network/access layer, with HTTPS, and application authentication as a separate boundary. Do not expose the database port/file or open firewall ports. Deployment credentials, account creation, or network changes need owner involvement; complete the local implementation first.

Backups must include the database and any future uploaded assets, be stored outside the public web directory, and have a documented access/encryption policy. Prefer established encrypted volume/backup tooling over custom cryptography; do not place keys in the same export or source repository. A raw EXFIL JSON export is sensitive and unencrypted—label it accordingly and do not call it a secure backup. Test recovery with synthetic records before importing actual owner data.

Log administrative mutations and import results without copying private note bodies, session tokens, or secrets into logs. Validate and parameterize database queries; use optimistic revisions and transaction boundaries. No background publishing of private records.

Acceptance: unauthorized reads/writes fail, sessions expire/log out, CSRF checks work, approved visitor snapshots cannot leak draft/private fields, backups can be restored, and user data is not required to validate these boundaries.

## Phase 1 — Architecture and persistent data

Use one canonical project identity across operational and showcase views. Keep private operator data and visitor-safe editorial data distinct in the schema and server responses.

Default prototype assumption: one privately hosted Node server with a durable local volume and SQLite, suitable for a single owner. Record this as a provisional architecture decision; use existing suitable database tooling if already present. Do not choose an ORM merely to introduce one. Verify current runtime/driver support from primary documentation before implementation.

If the actual deployment target is a Worker, ephemeral/serverless host, or otherwise lacks durable local filesystem storage, do not write SQLite into its temporary filesystem. Document and select a compatible persistent backend before deployment. Keep persistence behind a small repository/service layer to avoid coupling UI forms to storage details. No hosted database account is required merely to develop the local prototype.

Minimum domain model (adapt names to existing code):

- Projects: stable ID, unique stable slug, name, callsign, department, status, summary, mission brief, next action, success criteria, stack/tags, archive state, timestamps and revision.
- Showcase entries: project ID, visitor title/motif, teaser/story, approved media references, visibility (`draft`/`approved`/`hidden`), approved revision/snapshot. Internal edits must not silently alter the approved visitor snapshot.
- Relationships: source and target IDs, typed meaning. Keep `related`, operational dependencies, and editorial curiosity links distinguishable. Preserve free-text waiting/blocker descriptions when no project target exists.
- Rabbit-hole notes: stable ID/slug, question/title, lead, body blocks, aside, linked note/project IDs, display order and editorial visibility. A note may connect several projects.
- Operator records: notes, pins, captures, activity, evidence, checkpoints, publish-readiness gates, hardware and overrides. Preserve existing semantics before adding scope.
- Evidence/media references: type, label, URL/reference, description and explicit audience. First version can use links and bundled assets; binary upload hosting is not required.
- Import batches and revisions: enough metadata for repeat-safe imports, conflict detection, and recovery.

Use foreign keys, server-side validation, transactions, uniqueness constraints, UTC timestamps, and optimistic revision checks on updates. Preserve slugs already referenced by operator data; map them to stable IDs. Archive rather than hard-delete projects with history. Never expose a database file, credentials, or private data through static assets.

Seed the existing catalog once with a repeat-safe migration. Never overwrite GUI edits on application startup or deployment. Preserve source-provided dates separately from timestamps of migration and editing. Do not claim old content was recently verified because it was imported today.

Project mapping:

| Showcase | Canonical existing slug | Handling |
| --- | --- | --- |
| Alfred / Al. | alfred | Preserve ID and existing operator associations |
| Here² / Co-Space | cospace | Keep showcase display name separate from slug |
| Here be dragons | fury-twins | Keep project identity and history |
| BATDECK / >_ | new batdeck | Add as concept; do not imply completed hardware |

Flag dated/conflicting catalog facts for owner review. Example: the uploaded CoSpace entry names Photon Fusion while newer discussions described a different stack. Do not silently resolve conflicts from assumptions. Seed data is a starting record, not verified current status.

Acceptance: edits survive restart, migrations are repeat-safe, foreign keys and revision conflicts are handled, seed reruns cannot erase owner changes.

## Phase 2 — Project editor GUI

Build a clear, owner-facing editor with **New project**, **Edit**, **Save draft**, **Preview**, and **Archive/Restore**. Make ordinary editing possible without code or SQL.

Recommended editor sections:

1. **Basics:** project name, stable slug, callsign, department, status, tags, short description.
2. **Working notes:** mission brief, next action, success criteria; preserve checkpoint, activity and evidence flows.
3. **Showcase:** card title and motif, teaser, visitor story, selected imagery, narrative field notes, A/B preview.
4. **Connections:** related projects and typed dependencies; separately manage rabbit-hole questions, notes, and links using searchable pickers. Support linked side notes without requiring a project for each.
5. **Evidence:** repository/README/demo/image/document references, captions, visibility and readiness checks.

Use existing UI primitives and established patterns. Provide helpful field labels, validation, dirty-state indication, explicit saved/error feedback, loading/empty states, and accessible keyboard/focus behavior. Preserve drafts after validation or save failure. Warn before leaving unsaved edits. Handle conflicting edits visibly rather than silent last-write-wins. Slug changes require an explicit alias/migration strategy; disabling slug changes after creation is acceptable for v1.

Visibility defaults to private/draft. A readiness checklist is not an authorization switch. Owner approval of an exact preview makes a visitor snapshot eligible for a future public surface; it does not deploy or change site sharing.

Acceptance: create, edit, reload, preview, archive and restore work through the GUI; operator-only fields never appear in visitor responses; meaningful errors do not discard edits.

## Phase 3 — Explore the Lab integration

Add the showcase as an independent shell within the existing application. Prefer `/explore` while retaining `/` as the existing Ops board to avoid breaking operator links. Use a lightweight experience navigation link. Both surfaces can share project IDs and selected components while retaining their distinct purpose.

The root layout currently mounts AppShell globally. Refactor using a documented layout boundary appropriate to the installed Next.js version so Explore does not mount OperatorProvider, Quick Capture, Command Deck, private notes, or the operator header/footer. Preserve development preview restrictions and existing navigation.

Port the current showcase structure/content and both design themes. Use a contained theme mechanism; do not fork two independent catalogs or maintain duplicate app logic. Theme selection is a harmless local preference.

Preserve:

- four initial cards and original typographic motifs;
- workshop illustration with its concept label;
- all existing rabbit-hole narratives and side notes;
- breadcrumb/back navigation without losing the visitor's place;
- random-thread discovery;
- card-flip opening, reduced motion, focus containment, Escape closing, and focus return;
- readable mobile layout and equivalent keyboard/touch access.

Model the editorial links as a graph that permits intentional cycles. Protect navigation history from unbounded growth; broken targets should be prevented at save time and handled gracefully at render time. Adding related projects must not automatically expose private content. Render rich content safely without allowing raw HTML/script injection.

Acceptance: A and B remain recognizable against the supplied source, field notes and rabbit holes work, no internal content/provider appears in Explore, no Eugene/logo regression.

## Phase 4 — Operator data migration and backup

Preserve every existing record category. Implement a migration screen with file selection, schema validation, record counts, duplicate/conflict preview, and a transaction-backed import.

Recognize valid existing EXFIL exports (`weaselnet-operator-v2`) and validated legacy raw state. The browser storage key is `weaselnet-operator-v1`; these names differ intentionally in the existing code and must not be confused.

Do not assume Cursor or the repo can read Josh's saved browser data. If no real EXFIL file is supplied, complete and test the importer with clearly labeled synthetic fixtures and report the real-data import as pending. Never delete or clear localStorage automatically. Retain the original export and take a database backup before a live import.

Requirements:

- explicit owner initiation, no silent migration or replacement;
- reject malformed/unsupported imports before writes;
- preserve original IDs and timestamps where valid;
- show unknown project slugs and allow mapping or holding records for resolution;
- conflict policy defaults to preserving current database data, with explicit reviewed merges;
- repeat importing the same file must not duplicate records;
- failed imports roll back completely;
- backups/exports include the new project/editor/rabbit-hole data as well as operator records, with schema versioning and a tested restore path;
- document localStorage origin changes: a new hostname/browser cannot see the old site's state automatically.

Acceptance: fixture round-trip, repeat import, invalid input, unknown targets, conflict handling, and rollback verified. Real user state remains untouched until supplied and intentionally imported.

## Phase 5 — Access boundaries and integration honesty

Keep a local-only prototype bound to loopback until real authentication/authorization exists. Private hosting of the showcase today does not supply authentication to the separate Mission Control application.

Before any shared or remote deployment, protect operational reads and mutations server-side, including direct API/server-action requests. An Explore/Operate toggle, hidden button, route name, development host check, or workspace picker is not authorization. Use a supported auth mechanism suited to the chosen deployment; do not invent custom password cryptography. Check CSRF/origin behavior for cookie-authenticated writes, validate URLs/media types, and keep secrets server-side.

Use an explicit allowlisted visitor projection. Never send full project/owner records to the browser and hide private fields with CSS. Approved snapshot responses exclude operator notes, home machine identifiers, private paths, captures, unapproved evidence, and family-workspace content. Keep student fixtures development-only and unconnected to real personal data.

Alfred, Whisper, GitHub automation, telemetry, OBS and recording transport stay marked planned/mock unless separately implemented and verified. This task adds the database/editor/experience merge, not those external systems.

Acceptance: tests show visitor routes cannot retrieve private records and unauthorized calls cannot change data. Authentication and authorization are required for completion of the secure data path. Missing deployment credentials may block remote setup, but do not justify an insecure fallback; keep remote deployment blocked and report the exact remaining setup.

## Phase 6 — Verification and handoff

Run meaningful tests for the changed data and access boundaries, plus existing workspace tests. Cover:

- repeat-safe seed and database migrations;
- persistence across restart and update conflicts;
- create/edit/archive/restore and relationships;
- import/export round-trip and transactional failures;
- private/approved snapshot separation;
- original development-preview protections;
- field-note opening/closing and keyboard focus;
- rabbit-hole navigation, broken targets, reduced motion;
- mobile and desktop layout, both themes, readable enlarged text.

Run repository lint, tests, and production build where supported. Record exact commands/results and honest blockers. Do not claim a build or browser check passed unless executed. Use local preview/screenshots for visual comparison without deploying.

Deliver:

1. Branch/worktree containing reviewable implementation changes; do not merge or push without authorization.
2. Architecture/data-flow decision, schema and migrations, local setup, and backup/restore instructions.
3. Route map and source-file guide.
4. Verification evidence, known limits, and remaining decisions.
5. A short owner walkthrough: add a project → save → add a rabbit-hole connection → preview → deliberately approve an editorial snapshot.
6. `docs/integration/weaselnet-merge-progress.md` showing each phase as complete/partial/blocked and the exact next action.

## Done means

Josh can maintain projects through a GUI; data survives restarts; Mission Control's existing tools still work; Explore retains both approved visual options and its rabbit holes; private data stays private; and the result is ready for review without replacing or publishing over either existing application.
