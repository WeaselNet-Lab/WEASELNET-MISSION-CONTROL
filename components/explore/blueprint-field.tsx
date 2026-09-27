"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Dormant engineering drawing behind the lab interface. The drawing stays
 * still until a rabbit hole is chosen; the selection pulse then travels the
 * measured trunk line below, so the energy follows the blueprint.
 */

/** Gap between the thread column and the trunk line that feeds it. */
export const TRUNK_GAP = 22;
/** How far the trunk extends past the first and last thread rows. */
const TRUNK_RISE = 28;
/** Below this the margin is too thin for a trunk; the pulse hugs the row. */
const MIN_TRUNK_X = 12;

/** Selection pulse timing: one deliberate trace, a beat on arrival, then the fade. */
export const PULSE = { travel: 470, hold: 130, fade: 240 } as const;

type Trunk = { x: number; top: number; bottom: number; rows: number[] };
type Band = { top: number; bottom: number; left: number; right: number };
type Field = { w: number; h: number; trunk: Trunk | null; hero: Band | null; showcase: Band | null; builder: Band | null };

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function measureField(root: HTMLElement): Field {
  const box = root.getBoundingClientRect();
  const w = Math.round(box.width);
  const h = Math.round(box.height);
  const band = (selector: string): Band | null => {
    const el = root.querySelector<HTMLElement>(selector);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      top: round1(r.top - box.top),
      bottom: round1(r.bottom - box.top),
      left: round1(r.left - box.left),
      right: round1(r.right - box.left),
    };
  };
  // Anchor decorations to the intro and the outer showcase section. Both are
  // in normal document flow, so the drawing cannot drift from pinned content.
  const hero = band(".intro");
  const showcase = band(".project-showcase");
  const builder = band("#builder");
  const rows = Array.from(root.querySelectorAll<HTMLElement>(".thread"));
  if (rows.length === 0) return { w, h, trunk: null, hero, showcase, builder };
  const mids = rows.map((row) => {
    const r = row.getBoundingClientRect();
    return round1(r.top - box.top + r.height / 2);
  });
  const first = rows[0].getBoundingClientRect();
  const x = Math.round(first.left - box.left - TRUNK_GAP);
  if (x < MIN_TRUNK_X) return { w, h, trunk: null, hero, showcase, builder };
  return {
    w,
    h,
    hero,
    showcase,
    builder,
    trunk: {
      x,
      top: Math.round(mids[0] - TRUNK_RISE),
      bottom: Math.round(mids[mids.length - 1] + TRUNK_RISE),
      rows: mids,
    },
  };
}

/**
 * Pulse route for a chosen thread: down the drawn trunk, then branch right
 * into the row's edge. On narrow screens without a trunk, along the row's
 * own bottom border instead. Coordinates are root-relative and measured at
 * click time so the energy follows the visible blueprint line.
 */
export function threadPulseRoute(
  root: HTMLElement,
  thread: HTMLElement,
): { d: string; w: number; h: number } | null {
  const box = root.getBoundingClientRect();
  const w = Math.round(box.width);
  const h = Math.round(box.height);
  const tb = thread.getBoundingClientRect();
  const left = round1(tb.left - box.left);
  const mid = round1(tb.top - box.top + tb.height / 2);
  const rows = Array.from(root.querySelectorAll<HTMLElement>(".thread"));
  if (rows.length > 0) {
    const first = rows[0].getBoundingClientRect();
    const x = Math.round(first.left - box.left - TRUNK_GAP);
    if (x >= MIN_TRUNK_X) {
      const top = Math.round(first.top - box.top + first.height / 2 - TRUNK_RISE);
      return { d: `M ${x} ${top} L ${x} ${mid} L ${round1(left + 4)} ${mid}`, w, h };
    }
  }
  const y = round1(tb.bottom - box.top);
  const right = round1(tb.right - box.left);
  return { d: `M ${left} ${y} L ${right} ${y}`, w, h };
}

export function BlueprintField({ rootRef }: { rootRef: RefObject<HTMLDivElement | null> }) {
  const [field, setField] = useState<Field | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const update = () => setField(measureField(root));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(root);
    // Webfonts shift the thread rows after first paint.
    document.fonts?.ready.then(update).catch(() => undefined);
    return () => observer.disconnect();
  }, [rootRef]);

  if (!field || field.w === 0 || field.h === 0) return null;

  const { w, h, trunk, hero, showcase, builder } = field;
  const wide = w >= 1150;
  // Margin decorations need clear space beside the content column; below this
  // they would sit under text.
  const margin = hero ? hero.left : 0;
  const room = wide && margin >= 130;
  const heroMid = hero ? round1((hero.top + hero.bottom) / 2) : 0;
  const showMid = showcase ? round1((showcase.top + showcase.bottom) / 2) : 0;
  const builderMid = builder ? round1((builder.top + builder.bottom) / 2) : 0;
  // X anchors hug the content edges, clamped so the drawing stays on-canvas.
  const alx = hero ? Math.max(76, Math.round(hero.left - 104)) : 0;
  const arx = hero ? Math.min(w - 76, Math.round(hero.right + 104)) : 0;
  const blx = hero ? Math.max(60, Math.round(hero.left - 88)) : 0;
  const brx = hero ? Math.min(w - 60, Math.round(hero.right + 88)) : 0;
  const busStubs = [-120, -40, 40, 120];

  return (
    <svg
      className="blueprint-field"
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      focusable="false"
    >
      {room && hero ? (
        <g className="bp-decor" fill="none" stroke="currentColor" strokeWidth="1">
          {/* Mechanical assembly, left margin beside the intro. */}
          <g>
            <circle cx={alx} cy={heroMid - 36} r="46" />
            <circle cx={alx} cy={heroMid - 36} r="30" strokeDasharray="3 4" />
            <circle cx={alx} cy={heroMid - 36} r="7" />
            <path d={`M ${alx - 58} ${heroMid - 36} H ${alx + 58} M ${alx} ${heroMid - 94} V ${heroMid + 22}`} opacity="0.7" />
            <path d={`M ${alx - 46} ${heroMid + 28} H ${alx + 46} M ${alx - 46} ${heroMid + 23} V ${heroMid + 33} M ${alx + 46} ${heroMid + 23} V ${heroMid + 33}`} />
            <text x={alx} y={heroMid + 46} textAnchor="middle">Ø 92</text>
            <text x={alx - 46} y={heroMid - 102}>ASSY-01</text>
          </g>
          {/* Detail callout below the assembly. */}
          <g>
            <circle cx={alx} cy={heroMid + 128} r="15" />
            <circle cx={alx} cy={heroMid + 128} r="23" strokeDasharray="2 4" />
            <path d={`M ${alx - 30} ${heroMid + 128} H ${alx + 30} M ${alx} ${heroMid + 98} V ${heroMid + 158}`} opacity="0.7" />
            <text x={alx} y={heroMid + 176} textAnchor="middle">DET-A</text>
          </g>
          {/* Elevation dimension spanning the intro, hard against the edge. */}
          <g>
            <path d={`M 40 ${hero.top + 4} V ${hero.bottom - 4}`} />
            <path d={`M 35 ${hero.top + 4} H 45 M 35 ${hero.bottom - 4} H 45`} />
            <text x="32" y={heroMid} textAnchor="middle" transform={`rotate(-90 32 ${heroMid})`}>
              ELEV {Math.round(hero.bottom - hero.top)}
            </text>
          </g>
          {/* Circuit run and chip, right margin beside the intro. */}
          <g>
            <path d={`M ${arx} ${hero.top + 24} V ${heroMid - 70} H ${arx - 36} V ${heroMid - 34}`} />
            <circle cx={arx} cy={hero.top + 64} r="3" />
            <circle cx={arx - 36} cy={heroMid - 34} r="3" />
            <path d={`M ${arx} ${heroMid + 10} V ${heroMid + 84} H ${arx + 28}`} />
            <circle cx={arx + 28} cy={heroMid + 84} r="3" />
            <text x={arx - 58} y={hero.top + 18}>SIG-A</text>
            <text x={arx - 58} y={heroMid + 22}>CLK</text>
          </g>
          <g>
            <rect x={arx - 24} y={heroMid + 118} width="48" height="48" />
            <path d={`M ${arx - 32} ${heroMid + 130} H ${arx - 24} M ${arx - 32} ${heroMid + 142} H ${arx - 24} M ${arx - 32} ${heroMid + 154} H ${arx - 24} M ${arx + 24} ${heroMid + 130} H ${arx + 32} M ${arx + 24} ${heroMid + 142} H ${arx + 32} M ${arx + 24} ${heroMid + 154} H ${arx + 32}`} />
            <text x={arx} y={heroMid + 184} textAnchor="middle">U1</text>
          </g>
        </g>
      ) : null}

      {room && showcase ? (
        <g className="bp-decor" fill="none" stroke="currentColor" strokeWidth="1">
          {/* Feeder bus, left margin beside the project cards on arrival.
              Anchored to the band top: the pinned room scrolls on, the drawing stays. */}
          <g>
            <path d={`M ${blx} ${showcase.top + 170} V ${showcase.top + 510}`} />
            <rect x={blx - 2.5} y={showcase.top + 167.5} width="5" height="5" />
            <rect x={blx - 2.5} y={showcase.top + 507.5} width="5" height="5" />
            {busStubs.map((off) => (
              <g key={off}>
                <circle cx={blx} cy={showcase.top + 340 + off} r="2.5" />
                <path d={`M ${blx} ${showcase.top + 340 + off} H ${blx + 10}`} />
              </g>
            ))}
            <text x={blx} y={showcase.top + 158} textAnchor="middle">BUS-04</text>
          </g>
          {/* Span dimension for the bus, hard against the edge. */}
          <g>
            <path d={`M 40 ${showcase.top + 170} V ${showcase.top + 510}`} />
            <path d={`M 35 ${showcase.top + 170} H 45 M 35 ${showcase.top + 510} H 45`} />
            <text x="32" y={showcase.top + 340} textAnchor="middle" transform={`rotate(-90 32 ${showcase.top + 340})`}>
              SPAN 340
            </text>
          </g>
          {/* Detail callout and aux trace, right margin beside the cards. */}
          <g>
            <circle cx={brx} cy={showcase.top + 260} r="26" />
            <circle cx={brx} cy={showcase.top + 260} r="36" strokeDasharray="3 5" />
            <path d={`M ${brx - 44} ${showcase.top + 260} H ${brx + 44} M ${brx} ${showcase.top + 216} V ${showcase.top + 304}`} opacity="0.7" />
            <text x={brx} y={showcase.top + 208} textAnchor="middle">DET-B</text>
          </g>
          <g>
            <path d={`M ${brx} ${showcase.top + 350} V ${showcase.top + 450} H ${brx - 26} V ${showcase.top + 480}`} />
            <circle cx={brx} cy={showcase.top + 390} r="3" />
            <circle cx={brx - 26} cy={showcase.top + 480} r="3" />
            <text x={brx - 52} y={showcase.top + 362}>AUX</text>
          </g>
          {/* A second callout midway through the pin journey, right margin. */}
          <g>
            <circle cx={brx} cy={showMid} r="18" />
            <circle cx={brx} cy={showMid} r="27" strokeDasharray="2 4" />
            <path d={`M ${brx - 34} ${showMid} H ${brx + 34} M ${brx} ${showMid - 34} V ${showMid + 34}`} opacity="0.7" />
            <text x={brx} y={showMid - 40} textAnchor="middle">DET-C</text>
          </g>
        </g>
      ) : null}

      {room && builder ? (
        <g className="bp-decor" fill="none" stroke="currentColor" strokeWidth="1">
          {/* Section dimension, left margin beside the builder. */}
          <g>
            <path d={`M 40 ${builder.top + 4} V ${builder.bottom - 4}`} />
            <path d={`M 35 ${builder.top + 4} H 45 M 35 ${builder.bottom - 4} H 45`} />
            <text x="32" y={builderMid} textAnchor="middle" transform={`rotate(-90 32 ${builderMid})`}>
              SEC-03 · HUMAN IN THE LOOP
            </text>
          </g>
          {/* Operator feed, right margin beside the builder. */}
          <g>
            <path d={`M ${brx} ${builder.top + 30} V ${builderMid - 10} H ${brx - 30} V ${builderMid + 30}`} />
            <circle cx={brx} cy={builder.top + 70} r="3" />
            <circle cx={brx - 30} cy={builderMid + 30} r="3" />
            <path d={`M ${brx} ${builderMid + 70} V ${builder.bottom - 30} H ${brx + 24}`} />
            <circle cx={brx + 24} cy={builder.bottom - 30} r="3" />
            <text x={brx - 56} y={builder.top + 24}>OPS</text>
          </g>
        </g>
      ) : null}

      {builder ? (
        <g className="bp-decor" fill="none" stroke="currentColor" strokeWidth="1">
          {/* Width dimension in the gap below the builder; reads at any viewport. */}
          <path d={`M ${builder.left} ${builder.bottom + 34} H ${builder.right}`} />
          <path d={`M ${builder.left} ${builder.bottom + 29} V ${builder.bottom + 39} M ${builder.right} ${builder.bottom + 29} V ${builder.bottom + 39}`} />
          <text x={builder.right} y={builder.bottom + 26} textAnchor="end">SEC 03 · W {Math.round(builder.right - builder.left)}</text>
        </g>
      ) : null}

      {wide ? (
        <g className="bp-decor" fill="none" stroke="currentColor" strokeWidth="1">
          {/* Dimension line, left margin mid-page. */}
          <g>
            <path d={`M 44 ${Math.round(h * 0.48)} V ${Math.round(h * 0.48) + 180}`} />
            <path d={`M 39 ${Math.round(h * 0.48)} H 49 M 39 ${Math.round(h * 0.48) + 180} H 49`} />
            <text
              x="36"
              y={Math.round(h * 0.48) + 90}
              textAnchor="middle"
              transform={`rotate(-90 36 ${Math.round(h * 0.48) + 90})`}
            >
              TRAVEL 180
            </text>
          </g>
          {/* Registration marks. */}
          <path d={`M 40 ${h - 66} h 12 M 46 ${h - 72} v 12`} />
          <path d={`M ${w - 52} 58 h 12 M ${w - 46} 52 v 12`} />
        </g>
      ) : null}

      {/* Trunk line feeding the rabbit holes. The pulse reuses this geometry. */}
      {trunk ? (
        <g className="bp-trunk" fill="none" stroke="currentColor" strokeWidth="1">
          <path d={`M ${trunk.x} ${trunk.top} V ${trunk.bottom}`} />
          <rect x={trunk.x - 2.5} y={trunk.top - 2.5} width="5" height="5" />
          <rect x={trunk.x - 2.5} y={trunk.bottom - 2.5} width="5" height="5" />
          {trunk.rows.map((y) => (
            <g key={y}>
              <circle cx={trunk.x} cy={y} r="2.5" />
              <path d={`M ${trunk.x} ${y} H ${trunk.x + 8}`} />
            </g>
          ))}
          <text x={trunk.x} y={trunk.top - 10} textAnchor="middle">NET-02</text>
        </g>
      ) : null}

      {/* Title block, bottom right. */}
      <g className="bp-decor" fill="none" stroke="currentColor" strokeWidth="1">
        <rect x={w - 236} y={h - 88} width="200" height="48" />
        <path d={`M ${w - 236} ${h - 64} H ${w - 36}`} />
        <text x={w - 226} y={h - 71}>WEASELNET LABS</text>
        <text x={w - 226} y={h - 47}>SHEET 01 · SCALE 1:1</text>
        <text x={w - 46} y={h - 47} textAnchor="end">REV B</text>
      </g>
    </svg>
  );
}
