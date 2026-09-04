"use client";

import Link from "next/link";
import { Flag, Pin } from "lucide-react";

import { OperatorNotes } from "@/components/operator-notes";
import { PublishChecklist } from "@/components/publish-checklist";
import { StatusBadge } from "@/components/status-badge";
import { useOperator } from "@/components/operator-provider";
import { Button } from "@/components/ui/button";
import { departmentName } from "@/lib/departments";
import { formatUpdated } from "@/lib/catalog";
import { relatedProjects } from "@/lib/projects";
import type { Project } from "@/lib/types";

export function ProjectDossier({ project }: { project: Project }) {
  const operator = useOperator();
  const related = relatedProjects(project);
  const pinned = operator.pinned.includes(project.slug);
  const flagged = operator.checkpoint?.slug === project.slug;

  return (
    <article className="flex flex-col gap-6">
      <div className="space-y-4">
        <Link
          href="/projects"
          className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase hover:text-primary"
        >
          ← Catalog
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={project.status} />
          <span className="font-mono text-[11px] tracking-[0.18em] text-primary uppercase">
            {project.callsign} · {departmentName(project.department)}
          </span>
        </div>
        <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
          {project.name}
        </h1>
        <p className="max-w-3xl text-lg leading-8 text-muted-foreground">{project.summary}</p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={pinned ? "default" : "outline"}
            onClick={() => operator.togglePin(project.slug)}
          >
            <Pin className="size-3.5" />
            {pinned ? "Pinned" : "Pin"}
          </Button>
          <Button
            variant={flagged ? "default" : "outline"}
            onClick={() =>
              flagged
                ? operator.clearCheckpoint()
                : operator.plantCheckpoint(project.slug)
            }
          >
            <Flag className="size-3.5" />
            {flagged ? "Flag planted" : "Plant checkpoint"}
          </Button>
        </div>
      </div>

      <section className="rounded-xl border-l-2 border-primary bg-card/80 px-5 py-4 ring-1 ring-foreground/10">
        <p className="font-mono text-[10px] tracking-[0.2em] text-primary uppercase">
          Next action
        </p>
        <p className="mt-2 text-base leading-7">{project.nextAction}</p>
      </section>

      {project.successCriteria ? (
        <section className="space-y-2">
          <p className="font-mono text-[10px] tracking-[0.2em] text-primary uppercase">
            Success looks like
          </p>
          <p className="text-base leading-7 italic">{project.successCriteria}</p>
        </section>
      ) : null}

      <section className="space-y-2">
        <p className="font-mono text-[10px] tracking-[0.2em] text-primary uppercase">
          Mission brief
        </p>
        <p className="max-w-3xl text-base leading-7 text-foreground/90">{project.brief}</p>
      </section>

      <section className="flex flex-wrap gap-2">
        {project.stack.map((item) => (
          <span
            key={item}
            className="rounded-md border border-border bg-muted/40 px-2 py-1 font-mono text-[11px] tracking-[0.12em] uppercase"
          >
            {item}
          </span>
        ))}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <PublishChecklist project={project} />
        <OperatorNotes slug={project.slug} />
      </div>

      <section className="space-y-3">
        <p className="font-mono text-[10px] tracking-[0.2em] text-primary uppercase">
          Linked systems
        </p>
        {related.length === 0 ? (
          <p className="text-sm text-muted-foreground">Flying solo. Suspicious, but allowed.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {related.map((item) => (
              <Link
                key={item.slug}
                href={`/projects/${item.slug}`}
                className="rounded-md border border-border bg-card px-3 py-2 hover:border-primary/40"
              >
                <span className="block font-mono text-[10px] tracking-[0.16em] text-primary uppercase">
                  {item.callsign}
                </span>
                <span className="font-heading text-sm">{item.name}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
        Last known movement {formatUpdated(project.updated)}
      </p>
    </article>
  );
}
