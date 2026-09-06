"use client";

import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { useOperator } from "@/components/operator-provider";
import type { OperatorState } from "@/lib/types";

export default function ExfilPage() {
  const operator = useOperator();
  const input = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  function download() {
    const payload: OperatorState = { notes: operator.notes, publish: operator.publish, pinned: operator.pinned, checkpoint: operator.checkpoint, captures: operator.captures, activity: operator.activity, evidence: operator.evidence, hardware: operator.hardware };
    const blob = new Blob([JSON.stringify({ schema: "weaselnet-operator-v2", exportedAt: new Date().toISOString(), data: payload }, null, 2)], { type: "application/json" });
    const href = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = href; anchor.download = `weaselnet-exfil-${new Date().toISOString().slice(0,10)}.json`; anchor.click(); URL.revokeObjectURL(href); setMessage("Cache extracted. Keep it somewhere boring and recoverable.");
  }
  async function restore(file?: File) {
    if (!file) return;
    try { const parsed = JSON.parse(await file.text()); const data = parsed.data ?? parsed; operator.replaceState({ notes: data.notes ?? {}, publish: data.publish ?? {}, pinned: data.pinned ?? [], checkpoint: data.checkpoint ?? null, captures: data.captures ?? [], activity: data.activity ?? [], evidence: data.evidence ?? [], hardware: data.hardware ?? {} } as OperatorState); setMessage("Cache restored. Mission Control remembers again."); }
    catch { setMessage("That cache could not be read. Nothing was changed."); }
  }
  return <div className="flex flex-col gap-6"><section><p className="eyebrow">Portable recovery</p><h1 className="font-heading text-4xl font-semibold">EXFIL CACHE</h1><p className="mt-2 max-w-2xl text-base leading-7 text-muted-foreground">Extract the board’s local operational state before changing machines, browsers, or fate.</p></section>
    <div className="grid gap-4 md:grid-cols-2"><button onClick={download} className="tool-tile"><Download className="size-7 text-primary" /><span className="font-heading text-2xl">Extract cache</span><span className="text-sm text-muted-foreground">Projects stay in source. This exports notes, captures, logs, evidence, hardware updates, pins, and checkpoints.</span></button><button onClick={() => input.current?.click()} className="tool-tile"><Upload className="size-7 text-primary" /><span className="font-heading text-2xl">Restore cache</span><span className="text-sm text-muted-foreground">Load a previous EXFIL JSON file into this browser.</span></button></div>
    <input ref={input} type="file" accept="application/json,.json" className="hidden" onChange={(e) => restore(e.target.files?.[0])} />{message ? <p className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-primary">{message}</p> : null}
  </div>;
}
