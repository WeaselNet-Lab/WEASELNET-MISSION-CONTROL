"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { useOperator } from "@/components/operator-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { departments } from "@/lib/departments";
import { hardwareAssets } from "@/lib/hardware";
import { projects } from "@/lib/projects";

export function CommandDeck() {
  const router = useRouter();
  const operator = useOperator();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setOpen((value) => !value); }
    };
    window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects.slice(0, 6).map((item) => ({ label: item.name, detail: item.nextAction, href: `/projects/${item.slug}` }));
    return [
      ...projects.map((item) => ({ label: item.name, detail: `${item.callsign} · ${item.summary}`, href: `/projects/${item.slug}` })),
      ...departments.map((item) => ({ label: item.name, detail: item.mandate, href: `/departments/${item.slug}` })),
      ...hardwareAssets.map((item) => ({ label: item.name, detail: `${item.role} · ${operator.hardware[item.id]?.assignment || item.assignment || "unassigned"}`, href: "/hardware" })),
      ...Object.entries(operator.notes).map(([slug, note]) => ({ label: `Operator log · ${projects.find((item) => item.slug === slug)?.name || slug}`, detail: note, href: `/projects/${slug}` })),
      ...operator.activity.map((item) => ({ label: `${item.kind} · ${projects.find((project) => project.slug === item.projectSlug)?.name || item.projectSlug}`, detail: item.text, href: `/projects/${item.projectSlug}` })),
      ...operator.evidence.map((item) => ({ label: item.label, detail: `${item.kind} · ${item.note || item.href || "evidence"}`, href: `/projects/${item.projectSlug}` })),
      ...operator.captures.filter((item) => item.status === "inbox").map((item) => ({ label: item.title, detail: item.body || item.source || item.kind, href: "/drop" })),
    ].filter((item) => `${item.label} ${item.detail}`.toLowerCase().includes(q)).slice(0, 10);
  }, [query, operator]);

  function go(href: string) { setOpen(false); setQuery(""); router.push(href); }

  return <>
    <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="hidden gap-2 lg:flex"><Search className="size-4" />Command <kbd className="text-[11px] text-muted-foreground">Ctrl K</kbd></Button>
    <Button variant="outline" size="icon-sm" aria-label="Search Mission Control" onClick={() => setOpen(true)} className="lg:hidden"><Search className="size-4" /></Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-2xl bg-background">
      <DialogHeader><DialogTitle className="font-heading text-2xl">Command deck</DialogTitle></DialogHeader>
      <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects, labs, hardware, callsigns…" autoFocus />
      <div className="max-h-96 space-y-1 overflow-y-auto">
        {results.map((item, index) => <button key={`${item.href}-${index}`} onClick={() => go(item.href)} className="block w-full rounded-lg p-3 text-left hover:bg-muted">
          <span className="block font-medium">{item.label}</span><span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">{item.detail}</span>
        </button>)}
        {results.length === 0 ? <p className="p-6 text-center text-sm text-muted-foreground">No signal. Try a callsign, tool, or machine.</p> : null}
      </div>
    </DialogContent></Dialog>
  </>;
}
