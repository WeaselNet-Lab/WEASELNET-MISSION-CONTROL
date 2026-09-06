"use client";

import Link from "next/link";
import { CheckCircle2, CircleHelp } from "lucide-react";
import { useOperator } from "@/components/operator-provider";
import { Input } from "@/components/ui/input";
import { hardwareAssets, hardwareKinds } from "@/lib/hardware";
import type { HardwareAsset } from "@/lib/types";

export function HardwareBay() {
  return <div className="flex flex-col gap-6"><section className="space-y-3"><p className="eyebrow">Hardware bay</p><h1 className="font-heading text-4xl font-semibold tracking-tight">Know the room. Then give every box a job.</h1><p className="max-w-2xl text-base leading-7 text-muted-foreground">Record what is confirmed, where it sits, and what owns it. Remembered hardware is useful; verified hardware gets to drive decisions.</p><Link href="/projects/hardware-bay" className="inline-flex font-mono text-xs tracking-wider text-primary uppercase hover:underline">Open the bay Mission File →</Link></section>
    {hardwareKinds.map((kind) => <section key={kind.id} className="space-y-3"><h2 className="font-heading text-2xl">{kind.label}</h2><div className="grid gap-3 lg:grid-cols-2">{hardwareAssets.filter((asset) => asset.kind === kind.id).map((asset) => <AssetCard key={asset.id} asset={asset} />)}</div></section>)}
  </div>;
}

function AssetCard({ asset }: { asset: HardwareAsset }) {
  const operator = useOperator(); const override = operator.hardware[asset.id] || {}; const merged = { ...asset, ...override };
  return <article className="rounded-xl bg-card/85 p-4 ring-1 ring-foreground/10"><div className="flex items-start justify-between gap-3"><div><p className="font-heading text-xl">{asset.name}</p><p className="eyebrow mt-1">{asset.role}</p></div>{asset.count ? <span className="rounded-full border border-primary/30 px-2 py-0.5 font-mono text-xs text-primary">×{asset.count}</span> : null}</div><p className="mt-3 text-sm leading-6 text-muted-foreground">{merged.notes}</p>
    <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="field-label">Assignment<Input value={merged.assignment || ""} onChange={(e) => operator.setHardware(asset.id, { assignment: e.target.value })} placeholder="Project or machine" /></label><label className="field-label">Location<Input value={merged.location || ""} onChange={(e) => operator.setHardware(asset.id, { location: e.target.value })} placeholder="Rack, bench, room…" /></label><label className="field-label">Condition<select value={merged.condition || "unknown"} onChange={(e) => operator.setHardware(asset.id, { condition: e.target.value as HardwareAsset["condition"] })} className="field-select">{["installed","bench","spare","repair","unknown"].map((item) => <option key={item}>{item}</option>)}</select></label><label className="field-label">Confidence<select value={merged.confidence || "remembered"} onChange={(e) => operator.setHardware(asset.id, { confidence: e.target.value as HardwareAsset["confidence"] })} className="field-select"><option value="remembered">Remembered</option><option value="confirmed">Confirmed</option></select></label><label className="field-label sm:col-span-2">Last tested<Input type="date" value={merged.lastTested || ""} onChange={(e) => operator.setHardware(asset.id, { lastTested: e.target.value })} /></label></div><p className={`mt-3 flex items-center gap-2 text-xs ${merged.confidence === "confirmed" ? "text-signal" : "text-muted-foreground"}`}>{merged.confidence === "confirmed" ? <CheckCircle2 className="size-4" /> : <CircleHelp className="size-4" />}{merged.confidence === "confirmed" ? "Confirmed inventory" : "Remembered — verify before designing around it"}</p>
  </article>;
}
