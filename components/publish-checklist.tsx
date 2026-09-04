"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { mergePublish, publishScore } from "@/lib/catalog";
import { useOperator } from "@/components/operator-provider";
import type { Project, PublishGate } from "@/lib/types";
import { cn } from "@/lib/utils";

const items: { key: keyof PublishGate; label: string; hint: string }[] = [
  {
    key: "readme",
    label: "README",
    hint: "One honest page. What it is, how to run it, what 'done' looked like.",
  },
  {
    key: "screenshots",
    label: "5 screenshots",
    hint: "Proof it existed in the world, not just in a commit message.",
  },
  {
    key: "demo",
    label: "60-second demo",
    hint: "If it takes a meeting to explain, it is not a demo yet.",
  },
];

export function PublishChecklist({ project }: { project: Project }) {
  const operator = useOperator();
  const gate = mergePublish(project, operator.publish);
  const score = publishScore(gate);

  return (
    <section className="rounded-xl bg-card ring-1 ring-foreground/10">
      <header className="flex items-center justify-between border-b border-border/70 px-4 py-3">
        <div>
          <p className="font-mono text-[10px] tracking-[0.22em] text-primary uppercase">
            Publish gate
          </p>
          <h2 className="font-heading text-lg">README + shots + sixty seconds</h2>
        </div>
        <p className={cn("font-mono text-sm", score === 3 ? "text-signal" : "text-primary")}>
          {score}/3
        </p>
      </header>
      <ul className="divide-y divide-border/70">
        {items.map((item) => (
          <li key={item.key} className="flex items-start gap-3 px-4 py-3">
            <Checkbox
              checked={gate[item.key]}
              onCheckedChange={(value) =>
                operator.setPublishItem(project.slug, item.key, value === true)
              }
              aria-label={item.label}
              className="mt-0.5"
            />
            <div>
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-sm text-muted-foreground">{item.hint}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
