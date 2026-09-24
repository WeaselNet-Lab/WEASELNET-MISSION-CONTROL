import type { DatabaseSync } from "node:sqlite";

import { audit, getDatabase, nowIso, transaction } from "@/lib/db/connection";
import { RevisionConflictError, ValidationError } from "@/lib/db/validate";
import type {
  ActivityEntry,
  ActivityKind,
  CaptureItem,
  CaptureKind,
  EvidenceItem,
  EvidenceKind,
  HardwareOverride,
  OperatorState,
  PublishGate,
} from "@/lib/types";

const CAPTURE_KINDS = new Set<CaptureKind>(["note", "idea", "decision", "test", "link", "file"]);
const ACTIVITY_KINDS = new Set<ActivityKind>([
  "checkpoint",
  "decision",
  "test",
  "discovery",
  "failure",
  "milestone",
  "hardware",
  "note",
]);
const EVIDENCE_KINDS = new Set<EvidenceKind>([
  "repository",
  "readme",
  "image",
  "demo",
  "test",
  "diagram",
  "document",
  "command",
]);

export const emptyOperatorState = (): OperatorState => ({
  notes: {},
  publish: {},
  pinned: [],
  checkpoint: null,
  captures: [],
  activity: [],
  evidence: [],
  hardware: {},
});

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ValidationError(`${label} is not an object.`);
  }
  return value as Record<string, unknown>;
}

function text(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.slice(0, max);
}

export function normalizeOperatorState(input: unknown): OperatorState {
  const value = asRecord(input, "Operator state");
  const notesIn = asRecord(value.notes ?? {}, "Notes");
  const notes: Record<string, string> = {};
  for (const [slug, body] of Object.entries(notesIn)) {
    if (!/^[a-z0-9-]+$/.test(slug)) continue;
    notes[slug] = text(body, 8000);
  }
  const publishIn = asRecord(value.publish ?? {}, "Publish");
  const publish: Record<string, Partial<PublishGate>> = {};
  for (const [slug, gate] of Object.entries(publishIn)) {
    if (!gate || typeof gate !== "object") continue;
    const item = gate as Partial<PublishGate>;
    publish[slug] = {
      readme: Boolean(item.readme),
      screenshots: Boolean(item.screenshots),
      demo: Boolean(item.demo),
    };
  }
  const pinned = Array.isArray(value.pinned)
    ? value.pinned.filter((slug): slug is string => typeof slug === "string").slice(0, 100)
    : [];
  let checkpoint: OperatorState["checkpoint"] = null;
  if (value.checkpoint && typeof value.checkpoint === "object") {
    const item = value.checkpoint as OperatorState["checkpoint"];
    if (item && typeof item.slug === "string" && typeof item.at === "string") {
      checkpoint = {
        slug: item.slug,
        at: item.at,
        doing: text(item.doing, 800) || undefined,
        next: text(item.next, 800) || undefined,
        blocker: text(item.blocker, 800) || undefined,
        resumeLink: text(item.resumeLink, 400) || undefined,
      };
    }
  }
  const captures: CaptureItem[] = [];
  if (Array.isArray(value.captures)) {
    for (const raw of value.captures.slice(0, 500)) {
      const item = asRecord(raw, "Capture");
      const kind = item.kind;
      if (typeof kind !== "string" || !CAPTURE_KINDS.has(kind as CaptureKind)) {
        throw new ValidationError("A capture has an unsupported kind.");
      }
      if (typeof item.id !== "string" || typeof item.createdAt !== "string") {
        throw new ValidationError("A capture is missing its id or timestamp.");
      }
      captures.push({
        id: item.id.slice(0, 80),
        kind: kind as CaptureKind,
        title: text(item.title, 200),
        body: text(item.body, 8000),
        source: text(item.source, 400) || undefined,
        projectSlug: typeof item.projectSlug === "string" ? item.projectSlug : undefined,
        createdAt: item.createdAt,
        status: item.status === "filed" || item.status === "archived" ? item.status : "inbox",
      });
    }
  }
  const activity: ActivityEntry[] = [];
  if (Array.isArray(value.activity)) {
    for (const raw of value.activity.slice(0, 1000)) {
      const item = asRecord(raw, "Activity");
      if (typeof item.kind !== "string" || !ACTIVITY_KINDS.has(item.kind as ActivityKind)) {
        throw new ValidationError("An activity entry has an unsupported kind.");
      }
      if (typeof item.id !== "string" || typeof item.projectSlug !== "string" || typeof item.at !== "string") {
        throw new ValidationError("An activity entry is incomplete.");
      }
      activity.push({
        id: item.id.slice(0, 80),
        projectSlug: item.projectSlug,
        kind: item.kind as ActivityKind,
        text: text(item.text, 2000),
        at: item.at,
      });
    }
  }
  const evidence: EvidenceItem[] = [];
  if (Array.isArray(value.evidence)) {
    for (const raw of value.evidence.slice(0, 500)) {
      const item = asRecord(raw, "Evidence");
      if (typeof item.kind !== "string" || !EVIDENCE_KINDS.has(item.kind as EvidenceKind)) {
        throw new ValidationError("An evidence item has an unsupported kind.");
      }
      if (typeof item.id !== "string" || typeof item.projectSlug !== "string" || typeof item.createdAt !== "string") {
        throw new ValidationError("An evidence item is incomplete.");
      }
      evidence.push({
        id: item.id.slice(0, 80),
        projectSlug: item.projectSlug,
        kind: item.kind as EvidenceKind,
        label: text(item.label, 200),
        href: text(item.href, 400) || undefined,
        note: text(item.note, 800) || undefined,
        createdAt: item.createdAt,
      });
    }
  }
  const hardwareIn = asRecord(value.hardware ?? {}, "Hardware");
  const hardware: Record<string, HardwareOverride> = {};
  for (const [id, patch] of Object.entries(hardwareIn)) {
    if (!patch || typeof patch !== "object") continue;
    const item = patch as HardwareOverride;
    hardware[id.slice(0, 80)] = {
      location: text(item.location, 120) || undefined,
      assignment: text(item.assignment, 120) || undefined,
      condition: item.condition,
      confidence: item.confidence,
      lastTested: text(item.lastTested, 40) || undefined,
      notes: text(item.notes, 800) || undefined,
    };
  }
  return { notes, publish, pinned, checkpoint, captures, activity, evidence, hardware };
}

export function loadOperatorState(db: DatabaseSync = getDatabase()): { state: OperatorState; revision: number } {
  const meta = db.prepare("SELECT revision FROM operator_meta WHERE id = 1").get() as
    | { revision: number }
    | undefined;
  if (!meta) return { state: emptyOperatorState(), revision: 1 };
  const notes: Record<string, string> = {};
  for (const row of db.prepare("SELECT project_slug, body FROM operator_notes").all() as {
    project_slug: string;
    body: string;
  }[]) {
    notes[row.project_slug] = row.body;
  }
  const publish: OperatorState["publish"] = {};
  for (const row of db.prepare("SELECT * FROM operator_publish").all() as {
    project_slug: string;
    readme: number;
    screenshots: number;
    demo: number;
  }[]) {
    publish[row.project_slug] = {
      readme: Boolean(row.readme),
      screenshots: Boolean(row.screenshots),
      demo: Boolean(row.demo),
    };
  }
  const pinned = (
    db.prepare("SELECT project_slug FROM operator_pins ORDER BY position").all() as { project_slug: string }[]
  ).map((row) => row.project_slug);
  const checkpointRow = db.prepare("SELECT * FROM operator_checkpoint WHERE id = 1").get() as
    | {
        project_slug: string;
        at: string;
        doing: string | null;
        next_action: string | null;
        blocker: string | null;
        resume_link: string | null;
      }
    | undefined;
  const captures = db.prepare("SELECT * FROM captures ORDER BY created_at DESC").all() as {
    id: string;
    kind: CaptureKind;
    title: string;
    body: string;
    source: string | null;
    project_slug: string | null;
    created_at: string;
    status: CaptureItem["status"];
  }[];
  const activity = db.prepare("SELECT * FROM activity ORDER BY at DESC").all() as {
    id: string;
    project_slug: string;
    kind: ActivityKind;
    text: string;
    at: string;
  }[];
  const evidence = db.prepare("SELECT * FROM evidence ORDER BY created_at DESC").all() as {
    id: string;
    project_slug: string;
    kind: EvidenceKind;
    label: string;
    href: string | null;
    note: string | null;
    created_at: string;
  }[];
  const hardware: OperatorState["hardware"] = {};
  for (const row of db.prepare("SELECT asset_id, patch_json FROM hardware_overrides").all() as {
    asset_id: string;
    patch_json: string;
  }[]) {
    hardware[row.asset_id] = JSON.parse(row.patch_json) as HardwareOverride;
  }
  return {
    revision: meta.revision,
    state: {
      notes,
      publish,
      pinned,
      checkpoint: checkpointRow
        ? {
            slug: checkpointRow.project_slug,
            at: checkpointRow.at,
            doing: checkpointRow.doing ?? undefined,
            next: checkpointRow.next_action ?? undefined,
            blocker: checkpointRow.blocker ?? undefined,
            resumeLink: checkpointRow.resume_link ?? undefined,
          }
        : null,
      captures: captures.map((item) => ({
        id: item.id,
        kind: item.kind,
        title: item.title,
        body: item.body,
        source: item.source ?? undefined,
        projectSlug: item.project_slug ?? undefined,
        createdAt: item.created_at,
        status: item.status,
      })),
      activity: activity.map((item) => ({
        id: item.id,
        projectSlug: item.project_slug,
        kind: item.kind,
        text: item.text,
        at: item.at,
      })),
      evidence: evidence.map((item) => ({
        id: item.id,
        projectSlug: item.project_slug,
        kind: item.kind,
        label: item.label,
        href: item.href ?? undefined,
        note: item.note ?? undefined,
        createdAt: item.created_at,
      })),
      hardware,
    },
  };
}

export function saveOperatorState(stateInput: unknown, revision: number): { revision: number } {
  const state = normalizeOperatorState(stateInput);
  return transaction((db) => {
    const meta = db.prepare("SELECT revision FROM operator_meta WHERE id = 1").get() as
      | { revision: number }
      | undefined;
    if (!meta) throw new ValidationError("Operator storage is not ready.");
    const updated = db
      .prepare("UPDATE operator_meta SET revision = revision + 1, updated_at = ? WHERE id = 1 AND revision = ?")
      .run(nowIso(), revision);
    if (updated.changes !== 1) throw new RevisionConflictError();
    replaceOperatorRows(db, state);
    audit(db, "operator.save", "operator", "1", `revision=${revision + 1}`);
    return { revision: revision + 1 };
  });
}

export function replaceOperatorRows(db: DatabaseSync, state: OperatorState): void {
  db.exec(
    "DELETE FROM operator_notes; DELETE FROM operator_publish; DELETE FROM operator_pins; DELETE FROM operator_checkpoint; DELETE FROM captures; DELETE FROM activity; DELETE FROM evidence; DELETE FROM hardware_overrides;",
  );
  const stamp = nowIso();
  for (const [slug, body] of Object.entries(state.notes)) {
    db.prepare("INSERT INTO operator_notes (project_slug, body, updated_at) VALUES (?, ?, ?)").run(slug, body, stamp);
  }
  for (const [slug, gate] of Object.entries(state.publish)) {
    db.prepare(
      "INSERT INTO operator_publish (project_slug, readme, screenshots, demo) VALUES (?, ?, ?, ?)",
    ).run(slug, gate.readme ? 1 : 0, gate.screenshots ? 1 : 0, gate.demo ? 1 : 0);
  }
  state.pinned.forEach((slug, index) => {
    db.prepare("INSERT INTO operator_pins (project_slug, position) VALUES (?, ?)").run(slug, index);
  });
  if (state.checkpoint) {
    db.prepare(
      "INSERT INTO operator_checkpoint (id, project_slug, at, doing, next_action, blocker, resume_link) VALUES (1, ?, ?, ?, ?, ?, ?)",
    ).run(
      state.checkpoint.slug,
      state.checkpoint.at,
      state.checkpoint.doing ?? null,
      state.checkpoint.next ?? null,
      state.checkpoint.blocker ?? null,
      state.checkpoint.resumeLink ?? null,
    );
  }
  for (const item of state.captures) {
    db.prepare(
      "INSERT INTO captures (id, kind, title, body, source, project_slug, created_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    ).run(item.id, item.kind, item.title, item.body, item.source ?? null, item.projectSlug ?? null, item.createdAt, item.status);
  }
  for (const item of state.activity) {
    db.prepare("INSERT INTO activity (id, project_slug, kind, text, at) VALUES (?, ?, ?, ?, ?)").run(
      item.id,
      item.projectSlug,
      item.kind,
      item.text,
      item.at,
    );
  }
  for (const item of state.evidence) {
    db.prepare(
      "INSERT INTO evidence (id, project_slug, kind, label, href, note, audience, created_at) VALUES (?, ?, ?, ?, ?, ?, 'owner', ?)",
    ).run(item.id, item.projectSlug, item.kind, item.label, item.href ?? null, item.note ?? null, item.createdAt);
  }
  for (const [id, patch] of Object.entries(state.hardware)) {
    db.prepare("INSERT INTO hardware_overrides (asset_id, patch_json) VALUES (?, ?)").run(id, JSON.stringify(patch));
  }
}
