"use client";

import Link from "next/link";
import { Pin, PinOff } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { departmentName } from "@/lib/departments";
import { formatUpdated, mergePublish, publishScore } from "@/lib/catalog";
import { useOperator } from "@/components/operator-provider";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProjectCard({ project }: { project: Project }) {
  const operator = useOperator();
  const gate = mergePublish(project, operator.publish);
  const score = publishScore(gate);
  const pinned = operator.pinned.includes(project.slug);

  return (
    <Card className="h-full bg-card/80 backdrop-blur-sm transition-colors hover:bg-card">
      <CardHeader className="border-b border-border/60">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <p className="font-mono text-[10px] tracking-[0.22em] text-primary uppercase">
              {project.callsign} · {departmentName(project.department)}
            </p>
            <CardTitle className="font-heading text-xl tracking-tight">
              <Link href={`/projects/${project.slug}`} className="hover:text-primary">
                {project.name}
              </Link>
            </CardTitle>
          </div>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={pinned ? "Unpin project" : "Pin project"}
            onClick={() => operator.togglePin(project.slug)}
          >
            {pinned ? <Pin className="size-3.5 fill-primary text-primary" /> : <PinOff className="size-3.5" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 pt-4">
        <p className="text-sm leading-6 text-muted-foreground">{project.summary}</p>
        <p className="text-sm leading-6">
          <span className="font-mono text-[10px] tracking-[0.18em] text-primary uppercase">
            Next
          </span>
          <span className="mt-1 block text-foreground/90">{project.nextAction}</span>
        </p>
      </CardContent>
      <CardFooter className="justify-between gap-3">
        <StatusBadge status={project.status} />
        <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
          <span className={cn(score === 3 ? "text-signal" : "text-primary")}>
            Publish {score}/3
          </span>
          <span>{formatUpdated(project.updated)}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
