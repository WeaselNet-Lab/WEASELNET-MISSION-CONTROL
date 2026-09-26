/** Scroll distance, in viewport heights, while the exhibit window stays pinned. */
export const EXHIBIT_STEPS = {
  overview: 0.3,
  open: 0.75,
  hold: 0.38,
  swap: 0.6,
} as const;

export type ExhibitLayer = {
  opacity: number;
  /** 0 is settled. Positive waits below; negative leaves upward. */
  shift: number;
};

export type ExhibitFrame = {
  overview: number;
  features: ExhibitLayer[];
  /** -1 while the four-card overview leads. */
  activeIndex: number;
};

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function smooth(value: number): number {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

/** The outgoing layout leaves before the next one is readable. */
const HANDOFF = { out: 0.42, in: 0.32 } as const;

export function handoff(progress: number): { outgoing: number; incoming: number } {
  const t = clamp01(progress);
  return {
    outgoing: 1 - smooth(clamp01(t / HANDOFF.out)),
    incoming: smooth(clamp01((t - HANDOFF.in) / (1 - HANDOFF.in))),
  };
}

export function exhibitTravelUnits(count: number): number {
  if (count <= 0) return 0;
  const swaps = Math.max(0, count - 1);
  return EXHIBIT_STEPS.overview + EXHIBIT_STEPS.open + count * EXHIBIT_STEPS.hold + swaps * EXHIBIT_STEPS.swap;
}

function emptyLayers(count: number): ExhibitLayer[] {
  return Array.from({ length: count }, () => ({ opacity: 0, shift: 1 }));
}

/**
 * Map pinned scroll progress to one window.
 * Overview, then each project in order, then back through the same steps.
 */
export function exhibitFrame(progress: number, count: number): ExhibitFrame {
  const features = emptyLayers(count);
  if (count <= 0) return { overview: 1, features, activeIndex: -1 };

  const total = exhibitTravelUnits(count);
  let cursor = clamp01(progress) * total;
  if (cursor <= EXHIBIT_STEPS.overview) {
    return { overview: 1, features, activeIndex: -1 };
  }
  cursor -= EXHIBIT_STEPS.overview;

  const show = (index: number, opacity: number, shift: number) => {
    const layer = features[index];
    if (!layer) return;
    layer.opacity = opacity;
    layer.shift = shift;
  };

  if (cursor <= EXHIBIT_STEPS.open) {
    const { outgoing, incoming } = handoff(cursor / EXHIBIT_STEPS.open);
    show(0, incoming, 1 - incoming);
    return { overview: outgoing, features, activeIndex: incoming >= outgoing ? 0 : -1 };
  }
  cursor -= EXHIBIT_STEPS.open;

  for (let index = 0; index < count - 1; index += 1) {
    if (cursor <= EXHIBIT_STEPS.hold) {
      show(index, 1, 0);
      return { overview: 0, features, activeIndex: index };
    }
    cursor -= EXHIBIT_STEPS.hold;
    if (cursor <= EXHIBIT_STEPS.swap) {
      const { outgoing, incoming } = handoff(cursor / EXHIBIT_STEPS.swap);
      show(index, outgoing, -(1 - outgoing));
      show(index + 1, incoming, 1 - incoming);
      return { overview: 0, features, activeIndex: incoming >= outgoing ? index + 1 : index };
    }
    cursor -= EXHIBIT_STEPS.swap;
  }

  show(count - 1, 1, 0);
  return { overview: 0, features, activeIndex: count - 1 };
}
