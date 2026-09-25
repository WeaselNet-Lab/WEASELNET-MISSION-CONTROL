"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import type { OwnerProjectRecord } from "@/lib/db/projects";
import type { ProjectInput } from "@/lib/db/projects";

type NoteChoice = { slug: string; label: string };

const empty = (): ProjectInput => ({
  name: "",
  slug: "",
  callsign: "",
  department: "experimental",
  status: "concept",
  summary: "",
  brief: "",
  nextAction: "",
  successCriteria: "",
  stack: [],
  related: [],
  waitingFor: [],
  blockedBy: [],
  unlocks: [],
  showcase: {
    visitorTitle: "",
    motif: "",
    teaser: "",
    category: "EXPERIMENT",
    number: "00",
    glyph: "deck",
    exploreLabel: "OPEN THE NOTES",
    noteSlug: "",
    visibility: "draft",
  },
  note: {
    slug: "",
    label: "",
    category: "FIELD NOTE",
    title: "",
    lead: "",
    blocks: [{ heading: "The idea", body: "" }],
    aside: "",
    links: [],
    surface: "project",
    visibility: "draft",
    threadTags: null,
    threadTitle: null,
    threadDetail: null,
    threadNum: null,
  },
});

function fromProject(project: OwnerProjectRecord): ProjectInput {
  return {
    name: project.name,
    slug: project.slug,
    callsign: project.callsign,
    department: project.department,
    status: project.status,
    summary: project.summary,
    brief: project.brief,
    nextAction: project.nextAction,
    successCriteria: project.successCriteria ?? "",
    stack: project.stack,
    related: project.related,
    waitingFor: project.waitingFor,
    blockedBy: project.blockedBy,
    unlocks: project.unlocks,
    showcase: project.showcase ?? empty().showcase,
    note: project.note
      ? {
          slug: project.note.slug,
          label: project.note.label,
          category: project.note.category,
          title: project.note.title,
          lead: project.note.lead,
          blocks: project.note.blocks.length ? project.note.blocks : [{ heading: "The idea", body: "" }],
          aside: project.note.aside,
          links: project.note.links,
          surface: project.note.surface,
          visibility: project.note.visibility,
          threadTags: project.note.threadTags,
          threadTitle: project.note.threadTitle,
          threadDetail: project.note.threadDetail,
          threadNum: project.note.threadNum,
        }
      : { ...empty().note, slug: project.slug, label: project.name },
  };
}

export function ProjectEditor({
  csrf,
  project,
  noteChoices,
  projectSlugs,
}: {
  csrf: string;
  project: OwnerProjectRecord | null;
  noteChoices: NoteChoice[];
  projectSlugs: string[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<ProjectInput>(() => (project ? fromProject(project) : empty()));
  const [revision, setRevision] = useState(project?.revision ?? 1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [preview, setPreview] = useState(false);
  const saved = useMemo(() => JSON.stringify(project ? fromProject(project) : empty()), [project]);
  const dirty = JSON.stringify(form) !== saved;

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function update<K extends keyof ProjectInput>(key: K, value: ProjectInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function send(body: unknown, creating: boolean) {
    setPending(true);
    setError("");
    setMessage("");
    const response = await fetch(creating ? "/api/projects" : `/api/projects/${project?.slug}`, {
      method: creating ? "POST" : "PATCH",
      headers: { "content-type": "application/json", "x-csrf-token": csrf },
      body: JSON.stringify(body),
    });
    const payload = (await response.json().catch(() => ({}))) as { error?: string; slug?: string; revision?: number };
    setPending(false);
    if (!response.ok) {
      setError(payload.error || "Save failed. The form is still here.");
      return null;
    }
    return payload;
  }

  async function save() {
    const creating = !project;
    const ready = {
      ...form,
      showcase: { ...form.showcase, noteSlug: form.showcase.noteSlug || form.slug },
      note: { ...form.note, slug: form.note.slug || form.slug, label: form.note.label || form.name },
    };
    const payload = await send(creating ? ready : { revision, project: ready }, creating);
    if (!payload) return;
    setMessage(creating ? "Draft created." : "Draft saved. The visitor snapshot did not change.");
    if (creating && payload.slug) {
      router.push(`/projects/${payload.slug}/edit`);
      router.refresh();
    }
    if (!creating && typeof payload.revision === "number") setRevision(payload.revision);
  }

  async function act(action: "archive" | "restore" | "approve") {
    const payload = await send({ action }, false);
    if (!payload) return;
    setMessage(action === "approve" ? "This preview is now eligible for Explore. Nothing was deployed." : "Archive state updated.");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={project ? `/projects/${project.slug}` : "/projects"} className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">← Back</Link>
        <h1 className="font-heading mt-2 text-4xl">{project ? `Edit ${project.name}` : "New project"}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{dirty ? "Unsaved edits." : "Saved."} Visibility starts as a draft. Approving a preview does not publish the site.</p>
        {project?.flags.map((flag) => <p key={flag} className="mt-3 rounded-lg border border-primary/40 p-3 text-sm">{flag}</p>)}
      </div>
      <section className="space-y-3">
        <h2 className="font-heading text-2xl">Basics</h2>
        <label className="field-label">Name<input className="field-select" value={form.name} onChange={(event) => update("name", event.target.value)} /></label>
        <label className="field-label">Slug<input className="field-select" value={form.slug} disabled={Boolean(project)} onChange={(event) => update("slug", event.target.value)} /></label>
        <label className="field-label">Callsign<input className="field-select" value={form.callsign} onChange={(event) => update("callsign", event.target.value)} /></label>
        <label className="field-label">Department<select className="field-select" value={form.department} onChange={(event) => update("department", event.target.value)}>{["command","vr-lab","flight-systems","robotics","benchmark-lab","hardware","living-art","experimental"].map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="field-label">Status<select className="field-select" value={form.status} onChange={(event) => update("status", event.target.value)}>{["active","alpha","parked","concept","shipped"].map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="field-label">Tags / stack<textarea className="field-select" value={form.stack.join("\n")} onChange={(event) => update("stack", event.target.value.split("\n").map((item) => item.trim()).filter(Boolean))} /></label>
        <label className="field-label">Short description<textarea className="field-select" value={form.summary} onChange={(event) => update("summary", event.target.value)} /></label>
      </section>
      <section className="space-y-3">
        <h2 className="font-heading text-2xl">Working notes</h2>
        <label className="field-label">Mission brief<textarea className="field-select" value={form.brief} onChange={(event) => update("brief", event.target.value)} /></label>
        <label className="field-label">Next action<textarea className="field-select" value={form.nextAction} onChange={(event) => update("nextAction", event.target.value)} /></label>
        <label className="field-label">Success criteria<textarea className="field-select" value={form.successCriteria ?? ""} onChange={(event) => update("successCriteria", event.target.value)} /></label>
      </section>
      <section className="space-y-3">
        <h2 className="font-heading text-2xl">Showcase</h2>
        <label className="field-label">Card title<input className="field-select" value={form.showcase.visitorTitle} onChange={(event) => update("showcase", { ...form.showcase, visitorTitle: event.target.value })} /></label>
        <label className="field-label">Motif<input className="field-select" value={form.showcase.motif} onChange={(event) => update("showcase", { ...form.showcase, motif: event.target.value })} /></label>
        <label className="field-label">Teaser<textarea className="field-select" value={form.showcase.teaser} onChange={(event) => update("showcase", { ...form.showcase, teaser: event.target.value })} /></label>
        <label className="field-label">Field note title<textarea className="field-select" value={form.note.title} onChange={(event) => update("note", { ...form.note, title: event.target.value })} /></label>
        <label className="field-label">Lead<textarea className="field-select" value={form.note.lead} onChange={(event) => update("note", { ...form.note, lead: event.target.value })} /></label>
        <label className="field-label">Story<textarea className="field-select" value={form.note.blocks.map((block) => `${block.heading}\n${block.body}`).join("\n\n")} onChange={(event) => update("note", { ...form.note, blocks: event.target.value.split("\n\n").filter(Boolean).map((chunk) => { const [heading, ...rest] = chunk.split("\n"); return { heading: heading || "Note", body: rest.join("\n") }; }) })} /></label>
        <label className="field-label">Aside<textarea className="field-select" value={form.note.aside} onChange={(event) => update("note", { ...form.note, aside: event.target.value })} /></label>
        <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={() => setPreview(true)}>Preview draft</button>
      </section>
      <section className="space-y-3">
        <h2 className="font-heading text-2xl">Connections</h2>
        <label className="field-label">Related project slugs<textarea className="field-select" value={form.related.join("\n")} onChange={(event) => update("related", event.target.value.split("\n").map((item) => item.trim()).filter(Boolean))} /></label>
        <p className="text-xs text-muted-foreground">Known projects: {projectSlugs.join(", ")}</p>
        <label className="field-label">Waiting for<textarea className="field-select" value={form.waitingFor.join("\n")} onChange={(event) => update("waitingFor", event.target.value.split("\n").filter(Boolean))} /></label>
        <label className="field-label">Blocked by<textarea className="field-select" value={form.blockedBy.join("\n")} onChange={(event) => update("blockedBy", event.target.value.split("\n").filter(Boolean))} /></label>
        <label className="field-label">Unlocks<textarea className="field-select" value={form.unlocks.join("\n")} onChange={(event) => update("unlocks", event.target.value.split("\n").filter(Boolean))} /></label>
        <label className="field-label">Rabbit-hole links (slug | label)
          <textarea className="field-select" value={form.note.links.map((link) => `${link.targetSlug} | ${link.label}`).join("\n")} onChange={(event) => update("note", { ...form.note, links: event.target.value.split("\n").filter(Boolean).map((line) => { const [targetSlug, label] = line.split("|"); return { targetSlug: (targetSlug || "").trim(), label: (label || "").trim() }; }).filter((link) => link.targetSlug && link.label) })} />
        </label>
        <p className="text-xs text-muted-foreground">Notes you can link: {noteChoices.map((note) => note.slug).join(", ")}</p>
      </section>
      {error ? <p className="rounded-lg border border-destructive/40 p-3 text-sm text-destructive">{error}</p> : null}
      {message ? <p className="rounded-lg border border-primary/40 p-3 text-sm">{message}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={pending} className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground" onClick={() => void save()}>{pending ? "Saving…" : "Save draft"}</button>
        {project ? <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={() => void act("approve")}>Approve visitor snapshot</button> : null}
        {project?.archiveState === "archived" ? <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={() => void act("restore")}>Restore</button> : project ? <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={() => void act("archive")}>Archive</button> : null}
      </div>
      {preview ? (
        <section className="rounded-xl border p-4">
          <p className="font-mono text-xs uppercase">Draft preview — not on the visitor site</p>
          <h2 className="font-heading mt-2 text-3xl">{form.showcase.visitorTitle || "Untitled"} <span>{form.showcase.motif}</span></h2>
          <p className="mt-2 whitespace-pre-wrap">{form.showcase.teaser}</p>
          <h3 className="mt-4 text-xl whitespace-pre-wrap">{form.note.title}</h3>
          <p>{form.note.lead}</p>
          {form.note.blocks.map((block) => <div key={block.heading} className="mt-3"><h4>{block.heading}</h4><p>{block.body}</p></div>)}
          <button type="button" className="mt-3 text-sm underline" onClick={() => setPreview(false)}>Close preview</button>
        </section>
      ) : null}
    </div>
  );
}
