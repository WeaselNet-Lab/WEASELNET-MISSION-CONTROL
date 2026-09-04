import Link from "next/link";

import { hardwareAssets, hardwareKinds } from "@/lib/hardware";

export const metadata = {
  title: "Hardware Bay",
  description: "Named silicon, isolation policy, and the Quest path that actually worked.",
};

export default function HardwarePage() {
  return (
    <div className="flex flex-col gap-6">
      <section className="space-y-3">
        <p className="font-mono text-[11px] tracking-[0.24em] text-primary uppercase">
          Hardware bay
        </p>
        <h1 className="font-heading text-4xl font-semibold tracking-tight">
          Know the room. Then pick a job for each box.
        </h1>
        <p className="max-w-2xl text-base leading-7 text-muted-foreground">
          Last planning inventory from June 2026, plus the architecture call that still
          matters: Alfred gets the AI load. The sim rig stays clean. A card without a
          chassis assignment is a rumor in a sleeve. Walk the room, then edit the
          dossier.
        </p>
        <Link
          href="/projects/hardware-bay"
          className="inline-flex font-mono text-[11px] tracking-[0.16em] text-primary uppercase hover:underline"
        >
          Open the bay dossier →
        </Link>
      </section>

      {hardwareKinds.map((kind) => {
        const items = hardwareAssets.filter((asset) => asset.kind === kind.id);
        return (
          <section key={kind.id} className="space-y-3">
            <h2 className="font-heading text-2xl">{kind.label}</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {items.map((asset) => (
                <article
                  key={asset.id}
                  className="rounded-xl bg-card/80 p-4 ring-1 ring-foreground/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-heading text-lg">{asset.name}</p>
                      <p className="mt-1 font-mono text-[10px] tracking-[0.16em] text-primary uppercase">
                        {asset.role}
                      </p>
                    </div>
                    {asset.count ? (
                      <span className="rounded-full border border-primary/30 px-2 py-0.5 font-mono text-xs text-primary">
                        ×{asset.count}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {asset.notes}
                  </p>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
