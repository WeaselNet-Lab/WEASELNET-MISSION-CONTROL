# Entry lab branding

Graphite and orange for the public lab. This pass reuses the Option B palette already defined for `[data-theme="b"]`.

## Routes

Both stages are the public route `/explore`. There is no second public entry route.

| Stage | What it is |
| --- | --- |
| Entrance | `LabEntry` in `components/explore/lab-entry.tsx`. “Enter the Lab”, then the boot sequence. |
| Lab | `ExploreExperience` in `components/explore/explore-experience.tsx`. Header, projects, Rabbit Holes, builder. |

The entrance overlay always uses the Option B tokens below. The lab page defaults to Option B. The design-study control can still switch that page to theme A. Operator routes, including `/`, are outside this theme.

A stored `weaselnet-explore-theme` value of `a` still opens the lab page in theme A.

## Files

| Job | File |
| --- | --- |
| Drop new originals | `design-assets/weaselnet/incoming/` |
| Selected web files | `public/brand/weaselnet/` |
| Asset registry and placement map | `lib/brand/entry-lab-brand.ts` |
| Logo component | `components/explore/entry-lab-logo.tsx` |
| Theme tokens, boot W size, and gap | `app/explore/explore.css` (`html:has(.explore-root)` block) |

Originals stay in the incoming folder. Copy only the chosen file into `public/brand/weaselnet/`.

## Logos in this pass

No artwork had been dropped in `design-assets/weaselnet/incoming/`, so nothing was copied into `public/brand/weaselnet/`. Every `src` is `null`. The boot slot shows a silver text W. The header keeps the HTML label `WEASELNET LABS`. Optional badges stay hidden until a `src` is set.

| Slot | Asset id | Where it shows | Enabled |
| --- | --- | --- | --- |
| `boot` | `w` | Above `.lab-boot-ring`, outside the ring | yes |
| `header` | `w` | Small mark beside the header text | yes |
| `alfred` | `alfred` | Alfred project artwork area | yes |
| `vr` | `vrLab` | Here² project artwork area (glyph `space`) | yes |
| `engineering` | `engineering` | Builder section, under the eyebrow | yes |
| `rabbitHoles` | `explorer` | Rabbit Holes introduction | no |

Not slotted: a Mission Control badge, and horizontal department labels. The public lab does not have a department link row. Project titles, teasers, and buttons stay HTML.

## Adjust a slot

Edit `lib/brand/entry-lab-brand.ts`.

- Swap art: set that asset’s `src` to the public path, and set `width` and `height` to the file’s pixel size.
- Hide a slot: set `enabled: false`.
- Resize a card or section mark: change that placement’s `maxWidth`.
- Resize the boot W, the gap above the ring, or the header mark: change `--boot-w-width`, `--boot-w-gap`, or `--header-mark-height` in `app/explore/explore.css`. Narrow screens use 96px and 28px inside the `max-width: 760px` block.
- Dark gray W on graphite: leave `monochrome: true` on asset `w`. That filter is only for the monochrome mark. A light or silver file should set `monochrome: false`. Colored badges stay `monochrome: false`.
- Add art to an existing slot: point the placement’s `assetId` at a registry entry. Rabbit Holes is the off switch for the explorer badge.

Missing optional files render nothing. A broken boot image falls back to the text W. The header text stays if the header image is missing.

## Tokens

| Token | Value | Role |
| --- | --- | --- |
| `--lab-bg` | `#202020` | Canvas |
| `--lab-surface` | `#292929` | Cards and panels |
| `--lab-raised` | `#35312a` | Selected study chip |
| `--lab-room` | `#242424` | Feature stage |
| `--lab-border` | `#444440` | Separators |
| `--lab-text` | `#f0efeb` | Primary text |
| `--lab-muted` | `#b6b5b1` | Supporting text |
| `--lab-accent` | `#ffae58` | Focus, progress, active accent |
| `--lab-accent-hover` | `#ffb45f` | Hover |
| `--lab-accent-soft` | `#f0d16a` | Softer gold already used in theme B |
| `--lab-on-accent` | `#202020` | Text on a solid accent |
| `--boot-w-width` | `132px` (`96px` narrow) | Boot mark width |
| `--boot-w-gap` | `24px` | Space between the W and the ring |
| `--boot-w-silver` | `#d7dbe0` | Text W on graphite |
| `--header-mark-height` | `34px` (`28px` narrow) | Header mark height |
