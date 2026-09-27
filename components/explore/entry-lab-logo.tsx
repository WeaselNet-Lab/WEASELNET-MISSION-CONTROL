"use client";

import Image from "next/image";
import { useState } from "react";

import {
  entryLabAssets,
  entryLabPlacements,
  type EntryLabPlacementId,
} from "@/lib/brand/entry-lab-brand";

export function EntryLabLogo({ placement: placementId }: { placement: EntryLabPlacementId }) {
  const placement = entryLabPlacements[placementId];
  const asset = entryLabAssets[placement.assetId];
  const [failed, setFailed] = useState(false);
  const src = failed ? null : asset.src;
  const allowMark = placementId === "boot";

  if (!placement.enabled) return null;
  if (!src && !allowMark) return null;

  const eager = placementId === "boot" || placementId === "header";

  return (
    <span
      className={`entry-lab-slot entry-lab-slot-${placementId}`}
      data-align={placement.align}
      style={{ ["--slot-max-width" as string]: `${placement.maxWidth}px` }}
    >
      {src ? (
        <Image
          src={src}
          alt={placement.decorative ? "" : asset.alt}
          width={asset.width}
          height={asset.height}
          priority={eager}
          className="entry-lab-logo"
          data-treatment={asset.monochrome ? "mono" : "color"}
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="entry-lab-fallback" role="img" aria-label={asset.alt}>
          <span aria-hidden="true">W</span>
        </span>
      )}
    </span>
  );
}
