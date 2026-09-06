"use client";

import { useState } from "react";
import { Inbox, Plus } from "lucide-react";

import { useOperator } from "@/components/operator-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { projects } from "@/lib/projects";
import type { CaptureKind } from "@/lib/types";

export function QuickCapture({ compact = false }: { compact?: boolean }) {
  const operator = useOperator();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<CaptureKind>("note");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [source, setSource] = useState("");
  const [projectSlug, setProjectSlug] = useState("");

  function submit() {
    if (!title.trim() && !body.trim()) return;
    operator.addCapture({ kind, title: title.trim() || "Untitled field capture", body: body.trim(), source: source.trim() || undefined, projectSlug: projectSlug || undefined });
    setTitle(""); setBody(""); setSource(""); setProjectSlug(""); setKind("note"); setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size={compact ? "icon-sm" : "sm"} aria-label="Quick capture" />}>
        <Plus className="size-4" />{compact ? null : "Capture"}
      </DialogTrigger>
      <DialogContent className="max-w-xl bg-background">
        <DialogHeader><DialogTitle className="font-heading text-2xl">Quick capture</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm"><span className="text-muted-foreground">Type</span>
              <select value={kind} onChange={(e) => setKind(e.target.value as CaptureKind)} className="h-9 w-full rounded-md border bg-background px-3">
                {(["note","idea","decision","test","link","file"] as CaptureKind[]).map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="space-y-1 text-sm"><span className="text-muted-foreground">Mission file</span>
              <select value={projectSlug} onChange={(e) => setProjectSlug(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3">
                <option value="">The Drop — sort later</option>
                {projects.map((project) => <option key={project.slug} value={project.slug}>{project.name}</option>)}
              </select>
            </label>
          </div>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What did you catch?" autoFocus />
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="What moved, broke, appeared, or needs remembering?" className="min-h-32" />
          <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Optional file path or URL" />
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><Inbox className="size-4" />Unassigned captures wait in The Drop.</p>
            <Button onClick={submit}>Secure capture</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
