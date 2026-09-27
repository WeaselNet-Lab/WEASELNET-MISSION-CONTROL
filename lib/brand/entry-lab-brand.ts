/**
 * Entry-lab artwork registry.
 *
 * Drop originals in `design-assets/weaselnet/incoming/`.
 * Copy the chosen file into `public/brand/weaselnet/`, then set `src`
 * and the file's pixel `width` / `height` here.
 * A null `src` omits optional art. The boot slot falls back to a text W.
 */

export const entryLabAssetIds = [
  "w",
  "alfred",
  "vrLab",
  "engineering",
  "explorer",
] as const;

export type EntryLabAssetId = (typeof entryLabAssetIds)[number];

export type EntryLabAsset = {
  id: EntryLabAssetId;
  src: string | null;
  alt: string;
  width: number;
  height: number;
  /** Lift a dark monochrome mark on graphite. Leave false for colored artwork. */
  monochrome: boolean;
};

export const entryLabAssets: Record<EntryLabAssetId, EntryLabAsset> = {
  w: {
    id: "w",
    src: null,
    alt: "WeaselNet",
    width: 512,
    height: 512,
    monochrome: true,
  },
  alfred: {
    id: "alfred",
    src: null,
    alt: "Alfred AI",
    width: 512,
    height: 512,
    monochrome: false,
  },
  vrLab: {
    id: "vrLab",
    src: null,
    alt: "VR Lab",
    width: 512,
    height: 512,
    monochrome: false,
  },
  engineering: {
    id: "engineering",
    src: null,
    alt: "Engineering",
    width: 512,
    height: 512,
    monochrome: false,
  },
  explorer: {
    id: "explorer",
    src: null,
    alt: "Explorer",
    width: 512,
    height: 512,
    monochrome: false,
  },
};

export const entryLabPlacementIds = [
  "boot",
  "header",
  "alfred",
  "vr",
  "engineering",
  "rabbitHoles",
] as const;

export type EntryLabPlacementId = (typeof entryLabPlacementIds)[number];

export type EntryLabPlacement = {
  assetId: EntryLabAssetId;
  enabled: boolean;
  maxWidth: number;
  align: "center" | "start";
  /** Header mark sits inside a link that already has an accessible name. */
  decorative: boolean;
};

export const entryLabPlacements: Record<EntryLabPlacementId, EntryLabPlacement> = {
  boot: { assetId: "w", enabled: true, maxWidth: 132, align: "center", decorative: false },
  header: { assetId: "w", enabled: true, maxWidth: 48, align: "start", decorative: true },
  alfred: { assetId: "alfred", enabled: true, maxWidth: 168, align: "center", decorative: true },
  vr: { assetId: "vrLab", enabled: true, maxWidth: 156, align: "center", decorative: true },
  engineering: { assetId: "engineering", enabled: true, maxWidth: 120, align: "start", decorative: true },
  rabbitHoles: { assetId: "explorer", enabled: false, maxWidth: 96, align: "start", decorative: true },
};

const glyphPlacements: Record<string, EntryLabPlacementId> = {
  alfred: "alfred",
  space: "vr",
};

export function placementForGlyph(glyph: string): EntryLabPlacementId | null {
  return glyphPlacements[glyph] ?? null;
}

/** Resolved artwork for a slot, or null when the slot is off or the file is not set. */
export function brandArt(placementId: EntryLabPlacementId): { asset: EntryLabAsset; placement: EntryLabPlacement } | null {
  const placement = entryLabPlacements[placementId];
  if (!placement.enabled) return null;
  const asset = entryLabAssets[placement.assetId];
  if (!asset.src) return null;
  return { asset, placement };
}
