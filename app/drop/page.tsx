"use client";

import { Archive, Inbox } from "lucide-react";
import { useOperator } from "@/components/operator-provider";
import { QuickCapture } from "@/components/quick-capture";
import { Button } from "@/components/ui/button";
import { projects } from "@/lib/projects";

export default function DropPage() {
  const operator = useOperator();
  const inbox = operator.captures.filter((item) => item.status === "inbox");
  return <div className="flex flex-col gap-6">
    <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="eyebrow">Intake bay</p><h1 className="font-heading text-4xl font-semibold">The Drop</h1><p className="mt-2 max-w-2xl text-base text-muted-foreground">Catch first. Classify when your hands and brain are back in the same room.</p></div>
      <QuickCapture />
    </section>
    {inbox.length === 0 ? <div className="panel-empty"><Inbox className="mx-auto mb-3 size-8 text-primary" /><p className="font-heading text-xl">Drop is clear.</p><p className="mt-1 text-sm text-muted-foreground">Suspiciously organized. Enjoy it briefly.</p></div> :
      <div className="grid gap-3">{inbox.map((item) => <article key={item.id} className="rounded-xl bg-card/85 p-4 ring-1 ring-foreground/10">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div className="min-w-0"><p className="eyebrow">{item.kind} · {new Date(item.createdAt).toLocaleString()}</p><h2 className="font-heading mt-1 text-xl">{item.title}</h2>{item.body ? <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{item.body}</p> : null}{item.source ? <p className="mt-2 break-all font-mono text-xs text-primary">{item.source}</p> : null}</div>
        <div className="flex shrink-0 flex-wrap gap-2"><select defaultValue={item.projectSlug || ""} onChange={(e) => e.target.value && operator.fileCapture(item.id, e.target.value)} className="h-9 rounded-md border bg-background px-3 text-sm"><option value="">File to…</option>{projects.map((project) => <option key={project.slug} value={project.slug}>{project.name}</option>)}</select><Button variant="outline" size="sm" onClick={() => operator.archiveCapture(item.id)}><Archive className="size-4" />Archive</Button></div></div>
      </article>)}</div>}
  </div>;
}
