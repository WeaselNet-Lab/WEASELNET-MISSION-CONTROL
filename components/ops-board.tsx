"use client";

import Link from "next/link";
import { Flag, Pin } from "lucide-react";

import { ProjectCard } from "@/components/project-card";
import { useOperator } from "@/components/operator-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { attentionQueue, boardStats, constellations, formatUpdated } from "@/lib/catalog";
import { departments } from "@/lib/departments";
import { getProject, projects } from "@/lib/projects";
import { projectsByDepartment } from "@/lib/projects";

export function OpsBoard() {
  const operator = useOperator();
  const stats = boardStats(operator);
  const queue = attentionQueue(operator).slice(0, 4);
  const checkpoint = operator.checkpoint
    ? getProject(operator.checkpoint.slug)
    : undefined;
  const pinned = projects.filter((project) => operator.pinned.includes(project.slug));

  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
        <div className="space-y-4">
          <p className="font-mono text-[11px] tracking-[0.24em] text-primary uppercase">
            WeaselNet · Ops board
          </p>
          <h1 className="font-heading max-w-3xl text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
            The side quests were never the problem. The map was.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Mission Control is the living catalog for Josh&apos;s labs — VR with daughters,
            local AI, walking dragons, a clean sim rig, and the documentation habit that
            usually loses the fight. One board. Next actions. A publish bar that does not
            negotiate.
          </p>
        </div>
        <Card className="bg-card/80">
          <CardHeader>
            <p className="font-mono text-[10px] tracking-[0.2em] text-primary uppercase">
              Last flag
            </p>
            <CardTitle className="font-heading text-xl">Checkpoint</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {checkpoint && operator.checkpoint ? (
              <>
                <p className="text-sm text-muted-foreground">
                  You planted a flag on{" "}
                  <Link
                    href={`/projects/${checkpoint.slug}`}
                    className="text-primary hover:underline"
                  >
                    {checkpoint.name}
                  </Link>
                  .
                </p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {new Intl.DateTimeFormat("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(operator.checkpoint.at))}
                </p>
                <div className="flex gap-2">
                  <Button render={<Link href={`/projects/${checkpoint.slug}`} />}>
                    Resume
                  </Button>
                  <Button variant="outline" onClick={operator.clearCheckpoint}>
                    Clear
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  No flag in the ground. Open a dossier and plant one before the next
                  meeting evaporates.
                </p>
                <Button variant="outline" render={<Link href="/projects" />}>
                  <Flag className="size-3.5" />
                  Pick a lab
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Live / alpha", value: stats.live, hint: "Currently allowed to steal evenings" },
          { label: "Unpublished", value: stats.unpublished, hint: "Built-ish. Not proven." },
          { label: "On the board", value: stats.total, hint: `${stats.shipped} already shipped` },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl bg-card/80 px-4 py-4 ring-1 ring-foreground/10"
          >
            <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
              {stat.label}
            </p>
            <p className="font-heading mt-1 text-3xl text-primary">{stat.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{stat.hint}</p>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-primary uppercase">
              Attention
            </p>
            <h2 className="font-heading text-2xl">What still owes the board a demo</h2>
          </div>
          <Link
            href="/publish"
            className="font-mono text-[11px] tracking-[0.16em] text-primary uppercase hover:underline"
          >
            Full queue
          </Link>
        </div>
        {queue.length === 0 ? (
          <p className="rounded-xl bg-card px-4 py-6 text-sm text-muted-foreground ring-1 ring-foreground/10">
            Either everything is published, or you have discovered a new way to hide work.
            I am choosing to be proud of you.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {queue.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        )}
      </section>

      {pinned.length > 0 ? (
        <section className="space-y-3">
          <p className="flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-primary uppercase">
            <Pin className="size-3" />
            Pinned
          </p>
          <div className="flex flex-wrap gap-2">
            {pinned.map((project) => (
              <Link
                key={project.slug}
                href={`/projects/${project.slug}`}
                className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-[11px] tracking-[0.14em] text-primary uppercase"
              >
                {project.callsign}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] text-primary uppercase">
            Departments
          </p>
          <h2 className="font-heading text-2xl">Eight labs. One universe.</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {departments.map((department) => {
            const count = projectsByDepartment(department.slug).length;
            return (
              <Link
                key={department.slug}
                href={`/departments/${department.slug}`}
                className="group rounded-xl bg-card/80 p-4 ring-1 ring-foreground/10 transition-colors hover:bg-card hover:ring-primary/30"
              >
                <p className="font-mono text-[10px] tracking-[0.2em] text-primary uppercase">
                  {department.callsign}
                </p>
                <p className="font-heading mt-1 text-lg group-hover:text-primary">
                  {department.name}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {department.summary}
                </p>
                <p className="mt-3 font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
                  {count} dossier{count === 1 ? "" : "s"}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] text-primary uppercase">
            Constellations
          </p>
          <h2 className="font-heading text-2xl">These are systems, not souvenirs</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {constellations.map((group) => (
            <Card key={group.name} className="bg-card/80">
              <CardHeader>
                <CardTitle className="font-heading text-xl">{group.name}</CardTitle>
                <p className="text-sm leading-6 text-muted-foreground">{group.detail}</p>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {group.slugs.map((slug) => {
                  const project = getProject(slug);
                  if (!project) return null;
                  return (
                    <Link
                      key={slug}
                      href={`/projects/${slug}`}
                      className="rounded-md border border-border bg-background/40 px-2.5 py-1 font-mono text-[11px] tracking-[0.12em] uppercase hover:border-primary/50 hover:text-primary"
                    >
                      {project.callsign}
                    </Link>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
        Catalog timestamps are last known movement, not last time it sounded exciting.{" "}
        Latest seed: {formatUpdated("2026-09-04")}.
      </p>
    </div>
  );
}
