"use client";

import Link from "next/link";
import { Flag, Pin } from "lucide-react";
import { useState } from "react";

import { OperatorNotes } from "@/components/operator-notes";
import { PublishChecklist } from "@/components/publish-checklist";
import { StatusBadge } from "@/components/status-badge";
import { useOperator } from "@/components/operator-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ActivityLog, EvidenceLocker } from "@/components/mission-tools";
import { departmentName } from "@/lib/departments";
import { formatUpdated } from "@/lib/catalog";
import { relatedProjects } from "@/lib/projects";
import type { Project } from "@/lib/types";
import { missionLinks } from "@/lib/mission-links";

export function MissionFile({ project }: { project: Project }) {
  const operator = useOperator();
  const related = relatedProjects(project);
  const pinned = operator.pinned.includes(project.slug);
  const flagged = operator.checkpoint?.slug === project.slug;
  const topology = missionLinks[project.slug];
  const [checkpointOpen, setCheckpointOpen] = useState(false);
  const [doing, setDoing] = useState("");
  const [next, setNext] = useState(project.nextAction);
  const [blocker, setBlocker] = useState("");
  const [resumeLink, setResumeLink] = useState("");

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
            type="button"
            variant={pinned ? "default" : "outline"}
            onClick={() => operator.togglePin(project.slug)}
          >
            <Pin className="size-3.5" />
            {pinned ? "Pinned" : "Pin"}
          </Button>
          <Button
            type="button"
            variant={flagged ? "default" : "outline"}
            onClick={() =>
              flagged
                ? operator.clearCheckpoint()
                : setCheckpointOpen(true)
            }
          >
            <Flag className="size-3.5" />
            {flagged ? "Flag planted" : "Plant checkpoint"}
          </Button>
        </div>
      </div>

      <Dialog open={checkpointOpen} onOpenChange={setCheckpointOpen}><DialogContent className="max-w-xl bg-background"><DialogHeader><DialogTitle className="font-heading text-2xl">Plant a useful checkpoint</DialogTitle></DialogHeader><div className="space-y-3"><Textarea value={doing} onChange={(e) => setDoing(e.target.value)} placeholder="What were you doing?" /><Textarea value={next} onChange={(e) => setNext(e.target.value)} placeholder="Exact next action" /><Input value={blocker} onChange={(e) => setBlocker(e.target.value)} placeholder="Blocker or waiting-for item" /><Input value={resumeLink} onChange={(e) => setResumeLink(e.target.value)} placeholder="File path, URL, machine, or command" /><Button onClick={() => { operator.plantCheckpoint({ slug: project.slug, doing: doing.trim(), next: next.trim(), blocker: blocker.trim(), resumeLink: resumeLink.trim() }); setCheckpointOpen(false); }}>Plant checkpoint</Button></div></DialogContent></Dialog>

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

      {topology ? <section className="grid gap-4 md:grid-cols-3">
        {[{ label: "Blocked by", items: topology.blockedBy }, { label: "Waiting for", items: topology.waitingFor }, { label: "Unlocks", items: topology.unlocks }].map((group) => <div key={group.label} className="rounded-xl bg-card/70 p-4 ring-1 ring-foreground/10"><p className="eyebrow">{group.label}</p>{group.items?.length ? <ul className="mt-2 space-y-2 text-sm">{group.items.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">No declared signal.</p>}</div>)}
      </section> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <PublishChecklist project={project} />
        <OperatorNotes slug={project.slug} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ActivityLog slug={project.slug} />
        <EvidenceLocker slug={project.slug} />
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
