"use client";

import { useState } from "react";

import { useOperator } from "@/components/operator-provider";

export function ExfilPanel({ csrf }: { csrf: string }) {
  const operator = useOperator();
  const [raw, setRaw] = useState("");
  const [preview, setPreview] = useState("");
  const [message, setMessage] = useState("");
  const [take, setTake] = useState("");
  const [backupName, setBackupName] = useState("");
  const [confirm, setConfirm] = useState("");

  function download() {
    const payload = {
      schema: "weaselnet-operator-v2",
      exportedAt: new Date().toISOString(),
      warning: "Sensitive and unencrypted. This is not a secure backup.",
      data: {
        notes: operator.notes,
        publish: operator.publish,
        pinned: operator.pinned,
        checkpoint: operator.checkpoint,
        captures: operator.captures,
        activity: operator.activity,
        evidence: operator.evidence,
        hardware: operator.hardware,
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = `weaselnet-exfil-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(href);
    setMessage("Cache extracted. It is sensitive and unencrypted. Keep it off the public web.");
  }

  async function readFile(file?: File) {
    if (!file) return;
    setRaw(await file.text());
    setPreview("");
    setMessage("File loaded. Nothing has been written.");
  }

  async function runPreview() {
    const response = await fetch("/api/import/preview", {
      method: "POST",
      headers: { "content-type": "application/json", "x-csrf-token": csrf },
      body: JSON.stringify({ raw }),
    });
    const body = await response.json();
    setPreview(JSON.stringify(body, null, 2));
    if (!response.ok) setMessage(body.error || "Preview rejected. Nothing was written.");
  }

  async function commit() {
    const response = await fetch("/api/import/commit", {
      method: "POST",
      headers: { "content-type": "application/json", "x-csrf-token": csrf },
      body: JSON.stringify({ raw, take: take.split(",").map((item) => item.trim()).filter(Boolean), checkpoint: "keep" }),
    });
    const body = await response.json();
    setMessage(response.ok ? `Import finished. Inserted ${body.inserted}, held ${body.held}, conflicts kept ${body.conflicts}.` : body.error || "Import failed and was not applied.");
    if (response.ok) window.location.reload();
  }

  async function backup() {
    const response = await fetch("/api/backup", { method: "POST", headers: { "x-csrf-token": csrf } });
    const body = await response.json();
    setMessage(body.warning || body.error || "Backup failed.");
    if (body.fileName) setBackupName(body.fileName);
  }

  async function restore() {
    const response = await fetch("/api/backup/restore", {
      method: "POST",
      headers: { "content-type": "application/json", "x-csrf-token": csrf },
      body: JSON.stringify({ fileName: backupName, confirm }),
    });
    const body = await response.json();
    setMessage(response.ok ? "Database restored from the backup file." : body.error || "Restore failed.");
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <p className="eyebrow">Portable recovery</p>
        <h1 className="font-heading text-4xl font-semibold">EXFIL CACHE</h1>
        <p className="mt-2 max-w-2xl text-base leading-7 text-muted-foreground">
          A JSON export is sensitive and unencrypted. It is not a secure backup. Database backups live in the data directory, outside the public site, and should sit on an encrypted volume.
        </p>
      </section>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground" onClick={download}>Extract JSON</button>
        <label className="rounded-lg border px-4 py-2 text-sm">Load file<input className="sr-only" type="file" accept="application/json,.json" onChange={(event) => void readFile(event.target.files?.[0])} /></label>
        <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={() => void runPreview()}>Preview import</button>
        <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={() => void commit()}>Import into database</button>
        <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={() => void backup()}>Back up database</button>
      </div>
      <label className="field-label">Conflict ids to take from the file, comma separated<input className="field-select" value={take} onChange={(event) => setTake(event.target.value)} placeholder="leave blank to keep the database" /></label>
      <label className="field-label">Backup file name<input className="field-select" value={backupName} onChange={(event) => setBackupName(event.target.value)} /></label>
      <label className="field-label">Type RESTORE to replace the database<input className="field-select" value={confirm} onChange={(event) => setConfirm(event.target.value)} /></label>
      <button type="button" className="w-fit rounded-lg border px-4 py-2 text-sm" onClick={() => void restore()}>Restore backup</button>
      {message ? <p className="rounded-lg border border-primary/30 p-3 text-sm">{message}</p> : null}
      {preview ? <pre className="overflow-auto rounded-lg bg-card p-4 text-xs">{preview}</pre> : null}
    </div>
  );
}
