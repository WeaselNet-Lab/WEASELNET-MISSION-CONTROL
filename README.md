
# WeaselNet Mission Control

The ops board for Josh's labs. Not a portfolio. Not JARVIS. A map so Anky Island, Alfred, the Fury Twins, and the clean sim rig stop living as disconnected side quests.

The house publish rule is still the small one: **README + 5 screenshots + a 60-second demo**. If a project cannot clear that bar, it is camping.

## What this slice does

- **Ops board** — attention queue, department grid, system constellations, and a checkpoint flag for the "I forgot what I was handing off" problem
- **Mission Files** — real briefs, next actions, success criteria, linked systems
- **Quick Capture + The Drop** — catch ideas, tests, links, files, and decisions before sorting
- **Field logs + Evidence Lockers** — append-only movement and direct proof links
- **Useful checkpoints** — current work, exact next move, blocker, and resume reference
- **Hardware Bay** — assignments, location, condition, confidence, and last-tested state
- **Command Deck** — Ctrl+K search across projects, labs, hardware, notes, captures, and evidence
- **Tool Bay** — the integration runway for GitHub, Alfred, Whisper, Tailscale, telemetry, and capture transport
- **EXFIL CACHE** — portable JSON backup and restore for operator state
- **Publish queue** — the three-item gate, persisted in the browser
- **Hardware bay** — last-known inventory plus the isolation policy (Alfred loud, SIM clean)
- **Operator notes / pins** — local only, on this browser, until Alfred gets the job

No login. No database. On purpose.

## Personal workspace previews (Phase 1)

Development-only fixtures for a future multi-workspace layout live at
[`/dev/workspaces`](http://127.0.0.1:43147/dev/workspaces). They use fictional
Student Alpha / Student Bravo configs, share one student dashboard component, and
are blocked in production. `npm run dev` binds to **127.0.0.1**. Host loopback
checks are defense-in-depth only — not authentication. A profile picker is
**not** sign-in. See `docs/architecture/personal-workspaces.md`.

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43147](http://127.0.0.1:43147).

```bash
npm run lint
npm test
npm run build
npm start
```

## Stack

Next.js (App Router), TypeScript, Tailwind, shadcn/ui.

Catalog data lives in `lib/projects.ts`, `lib/departments.ts`, and `lib/hardware.ts`. Operator state lives in `localStorage` under `weaselnet-operator-v1`.

## Next honest moves

1. Walk the hardware room and replace guesses with chassis assignments
2. Plant a checkpoint the next time a lab actually moves
3. Clear Anky Island or Alfred through the publish gate first — pick one, not both

# WEASELNET-MISSION-CONTROL
Mission Control for Alfred, Bats, VR systems, simulation research, automation tools, and experimental engineering
nano README.md
