"use client";

import { Textarea } from "@/components/ui/textarea";
import { useOperator } from "@/components/operator-provider";

export function OperatorNotes({ slug }: { slug: string }) {
  const operator = useOperator();
  const value = operator.notes[slug] ?? "";

  return (
    <section className="rounded-xl bg-card ring-1 ring-foreground/10">
      <header className="border-b border-border/70 px-4 py-3">
        <p className="font-mono text-[10px] tracking-[0.22em] text-primary uppercase">
          Operator log
        </p>
        <h2 className="font-heading text-lg">Notes that survive a forgotten upload</h2>
      </header>
      <div className="p-4">
        <Textarea
          value={value}
          onChange={(event) => operator.setNote(slug, event.target.value)}
          placeholder="What moved. What broke. What the next human (you) should not have to reconstruct."
          className="min-h-32 bg-background/50"
        />
        <p className="mt-2 font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
          Stored on this browser. Not on Alfred. Yet.
        </p>
      </div>
    </section>
  );
}
