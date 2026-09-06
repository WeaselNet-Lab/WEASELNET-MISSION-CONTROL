"use client";

import Link from "next/link";

import { useOperator } from "@/components/operator-provider";
import { StatusBadge } from "@/components/status-badge";
import { isPublishClear, mergePublish, publishScore } from "@/lib/catalog";
import { projects } from "@/lib/projects";
import { cn } from "@/lib/utils";

const gates = [
  { key: "readme" as const, label: "README" },
  { key: "screenshots" as const, label: "Shots" },
  { key: "demo" as const, label: "Demo" },
];

export function PublishQueue() {
  const operator = useOperator();
  const rows = [...projects]
    .map((project) => {
      const gate = mergePublish(project, operator.publish);
      return { project, gate, score: publishScore(gate) };
    })
    .sort((a, b) => a.score - b.score || a.project.name.localeCompare(b.project.name));

  const remaining = rows.filter((row) => !isPublishClear(row.gate));
  const cleared = rows.filter((row) => isPublishClear(row.gate));

  return (
    <div className="flex flex-col gap-6">
      <section className="space-y-3">
        <p className="font-mono text-[11px] tracking-[0.24em] text-primary uppercase">
          Publish queue
        </p>
        <h1 className="font-heading text-4xl font-semibold tracking-tight">
          Built it. Prove it. Then you can brag.
        </h1>
        <p className="max-w-2xl text-base leading-7 text-muted-foreground">
          The house rule is small on purpose: README, five screenshots, sixty-second demo.
          {remaining.length === 0
            ? " Look at you — the folklore is becoming a lab notebook."
            : ` ${remaining.length} still owe the board evidence. Classic move. Recoverable.`}
        </p>
      </section>

      {remaining.length === 0 ? (
        <div className="rounded-xl bg-card px-4 py-10 text-center ring-1 ring-foreground/10">
          <p className="font-heading text-xl">Queue clear.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Go build the next daughter game before this feeling goes to your head.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
          {remaining.map(({ project, gate, score }) => (
            <li key={project.slug}>
              <Link
                href={`/projects/${project.slug}`}
                className="flex flex-col gap-3 px-4 py-4 hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] tracking-[0.18em] text-primary uppercase">
                      {project.callsign}
                    </span>
                    <StatusBadge status={project.status} />
                  </div>
                  <p className="font-heading text-lg">{project.name}</p>
                </div>
                <div className="flex items-center gap-3">
                  {gates.map((item) => (
                    <span
                      key={item.key}
                      className={cn(
                        "rounded-full border px-2 py-0.5 font-mono text-[10px] tracking-[0.14em] uppercase",
                        gate[item.key]
                          ? "border-signal/40 text-signal"
                          : "border-border text-muted-foreground",
                      )}
                    >
                      {item.label}
                    </span>
                  ))}
                  <span className="font-mono text-xs text-primary">{score}/3</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {cleared.length > 0 ? (
        <section className="space-y-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
            Cleared
          </p>
          <div className="flex flex-wrap gap-2">
            {cleared.map(({ project }) => (
              <Link
                key={project.slug}
                href={`/projects/${project.slug}`}
                className="rounded-full border border-signal/30 bg-signal/10 px-3 py-1 font-mono text-[11px] tracking-[0.14em] text-signal uppercase"
              >
                {project.callsign}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
