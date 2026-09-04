# WeaselNet Mission Control

The ops board for Josh's labs. Not a portfolio. Not JARVIS. A map so Anky Island, Alfred, the Fury Twins, and the clean sim rig stop living as disconnected side quests.

The house publish rule is still the small one: **README + 5 screenshots + a 60-second demo**. If a project cannot clear that bar, it is camping.

## What this slice does

- **Ops board** — attention queue, department grid, system constellations, and a checkpoint flag for the "I forgot what I was handing off" problem
- **Project dossiers** — real briefs, next actions, success criteria, linked systems
- **Publish queue** — the three-item gate, persisted in the browser
- **Hardware bay** — last-known inventory plus the isolation policy (Alfred loud, SIM clean)
- **Operator notes / pins** — local only, on this browser, until Alfred gets the job

No login. No database. On purpose.

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43147](http://127.0.0.1:43147).

```bash
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
