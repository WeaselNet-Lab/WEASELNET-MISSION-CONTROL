# WeaselNet merge progress

Date: 2026-09-24. Branch: `feat/weaselnet-secure-merge`. A local checkpoint commit records this work. Nothing was merged, pushed, or deployed.

## Phase status

| Phase | Status | Notes |
| --- | --- | --- |
| 0 Baseline | Complete | Isolated branch. Existing workspace tests stayed green. Next.js App Router layouts, route groups, `cookies()`, and route handlers were used as documented for 16.3.4. |
| 1 + 5 Data and access | Complete locally | SQLite repository, scrypt owner, hashed sessions, CSRF, visitor allowlist. Loopback only. Remote hosting is not enabled. |
| 2 Project editor | Complete | Create, edit, preview, approve, archive, and restore exercised in the browser. |
| 3 Explore | Complete | Both themes, four motifs, workshop image, threads, random discovery, underneath, breadcrumbs, Escape, focus return, reduced motion. |
| 4 Migration and backup | Partial | Importer and backup/restore pass on synthetic fixtures. No real EXFIL file was imported. |
| 6 Verification | Complete for local review | Lint, 26 tests, and production build passed. Browser pass recorded below. |

## Verification

Commands, from `C:\Dev\WEASELNET-MISSION-CONTROL`:

- `npm test` — 26 passed, 0 failed. Includes workspace isolation, dev-preview proxy, security boundaries, seed idempotence, revision conflicts, EXFIL rollback, backup restore, trail limits, session expiry, logout, owner rotation, and Host origin mismatch.
- `npm run lint` — exit 0.
- `npx tsc --noEmit` — exit 0.
- `npm run build` — Next.js 16.3.4, compiled successfully. The earlier filesystem-trace warning on backup sidecars is gone.

Browser, `http://127.0.0.1:43147`:

- `/` without a session redirects to `/login`. A wrong password stays on the form with a generic failure.
- Sign-in reached the ops board: Explore, Ops, Projects, Drop, Labs, Publish, Bay, Tools, Exfil, Quick capture, Command, Sign out.
- `/explore` has no operator chrome. Private brief text and `/home/` were absent. Motifs Al., Life_, Here², and `>_` were present.
- Theme B is graphite with orange emphasis. Theme A is the original cyan treatment. The choice persists in `weaselnet-explore-theme`.
- Field notes open on Alfred, focus the title, follow a connection, return by breadcrumb, and close on Escape with focus restored.
- Random thread and underneath both open. `prefers-reduced-motion: reduce` sets animation to none and scroll behavior to auto.
- At 390px the reference mobile rules apply, including hiding the first and last header links.
- New project Bench Lamp saved, previewed as a draft, approved onto Explore, linked to Alfred, then archived. After archive, Explore again shows the four seeded cards.
- `/dev/workspaces` still loads the fictional student fixtures in development and still says the preview is not authentication.

## Fixes found while verifying

- Same-origin checks now use the request `Host` header. Next reported `localhost` on `request.url` while the browser used `127.0.0.1`, so sign-in returned 403 before the password was checked.
- Note choices from SQLite are copied into plain objects before they cross into the client editor.
- Creating a project rejects a field-note slug that already exists.

## Left for the owner

- Replace the local verification account. `data/` contains a throwaway owner created only for this browser pass. Run `npm run owner:provision` with your own username and password. Set `WEASELNET_OWNER_ROTATE=yes` if that username already exists. The password is not stored in the repo.
- Import a real EXFIL only when you choose to. Unknown slugs stay in `import_holds`. Conflicts keep the database unless you explicitly take the file value.
- CoSpace catalog stack still says Photon Fusion. Review flag `flag-cospace-photon` records the later disagreement. It was not silently changed.
- Private remote hosting is blocked until you choose a private network, HTTPS, and an explicit non-loopback decision. Do not publish this branch over the existing site.

## Navigation links, 2026-09-23

Base UI warned because `Button` with `nativeButton` true was rendering a Next.js `Link` instead of a `<button>`. `components/ui/button.tsx` was left unchanged. Navigation links now use `<Link className={buttonVariants(...)}>`. Pin, checkpoint, Clear, Quick Capture, and the mobile nav trigger stay native buttons.

Replaced link renders in:

- `components/mission-file.tsx` — Edit project
- `components/ops-board.tsx` — Resume, Pick a lab
- `components/app-shell.tsx` — Previews
- `app/dev/workspaces/page.tsx` — Open Ops board, Open preview
- `app/dev/workspaces/[workspaceId]/page.tsx` — Open Ops board, Back to previews, All previews

Dialog and sheet close controls still render a `Button`, which is a native `<button>`.

Checks after the change:

- `npx tsc --noEmit` — exit 0
- `npm run lint` — exit 0
- `npm run build` — Next.js 16.3.4 compiled successfully
- Browser on `http://127.0.0.1:43147`: Pick a lab opened `/projects`. Edit project opened `/projects/alfred/edit`. Pin and Plant checkpoint remained buttons. Student Alpha opened from Open preview; All previews returned to the index. Operator Josh preview showed Open Ops board and Back to previews as links, and Back to previews returned to `/dev/workspaces`. The dev server log had no `nativeButton` warning on those pages.
- Tab moved focus onto the Previews anchor. Those links are real `<a>` elements and include the same `focus-visible` ring classes as `Button`.
- `/explore` still shows themes A and B, the four project cards, the three threads, and underneath. Theme B was current. Explore files were not edited.
- The Next.js issues overlay on `/` and `/projects/alfred` was a hydration mismatch on `data-cursor-ref`, which the browser tool injects. It was not a Base UI warning.

## Authentication review, 2026-09-24

Node `scrypt` is the password hash, not the whole sign-in system. Sessions are server rows. The cookie holds a random token; only its SHA-256 is stored. Absolute lifetime is 12 hours (`SESSION_TTL_SECONDS`). `readSession` deletes an expired row and returns null, and an expired token also fails the CSRF check. Logout deletes that row and sets both cookies to `Max-Age=0`. The session cookie is HttpOnly, SameSite=Lax, and Secure only when the request protocol is HTTPS. The CSRF cookie is readable by the page so the write header can match it.

Owner rotation is the provision command with `WEASELNET_OWNER_ROTATE=yes`. It refuses to replace an existing owner otherwise, requires a 12–1024 character password, writes a new scrypt hash, and deletes every session. There is no default password and no registration route.

Same-origin writes compare the browser `Origin` with the request `Host` header, including the port, plus the request protocol. A missing Origin fails. `http://127.0.0.1:43147` does not match `Host: localhost:43147`. Loopback allowance still uses the Host hostname only, and the server binds to `127.0.0.1`. `WEASELNET_ALLOW_NON_LOOPBACK` is unset.

`data/weaselnet.sqlite` and its WAL sidecars exist locally and are ignored. No `.env` file is present. `.env*` and `*.pem` were already ignored. `credentials.json` and loose `*.sqlite` files are now ignored as well. `git ls-files` shows none of those paths tracked.

## Next action

Review `feat/weaselnet-secure-merge`. Provision your owner, then decide whether to import the real EXFIL. Do not deploy from this branch until that review is done.
