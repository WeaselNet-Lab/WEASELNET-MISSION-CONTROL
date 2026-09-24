import { createHash } from "node:crypto";

import { audit, getDatabase, nowIso, transaction } from "@/lib/db/connection";
import { normalizeOperatorState, replaceOperatorRows, loadOperatorState } from "@/lib/db/operator-store";
import { ValidationError } from "@/lib/db/validate";
import type { OperatorState } from "@/lib/types";

export type ImportPreview = {
  schema: string;
  counts: Record<string, number>;
  unknownSlugs: string[];
  conflicts: { id: string; type: string }[];
  duplicateFile: boolean;
};

export type ImportCommitResult = {
  inserted: number;
  skipped: number;
  held: number;
  conflicts: number;
  duplicateFile: boolean;
};

type Resolutions = {
  take?: string[];
  checkpoint?: "keep" | "take-import";
};

function countsOf(state: OperatorState): Record<string, number> {
  return {
    notes: Object.keys(state.notes).length,
    captures: state.captures.length,
    activity: state.activity.length,
    evidence: state.evidence.length,
    pins: state.pinned.length,
    checkpoint: state.checkpoint ? 1 : 0,
  };
}

export function parseExfil(raw: string): { schema: string; state: OperatorState } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ValidationError("The file is not valid JSON.");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new ValidationError("The file is not an operator export.");
  }
  const record = parsed as { schema?: unknown; data?: unknown };
  if (typeof record.schema === "string" && record.schema !== "weaselnet-operator-v2") {
    throw new ValidationError("Unsupported export schema.");
  }
  const schema = record.schema === "weaselnet-operator-v2" ? "weaselnet-operator-v2" : "legacy-operator-state";
  const payload = record.schema === "weaselnet-operator-v2" ? record.data : parsed;
  return { schema, state: normalizeOperatorState(payload) };
}

function knownSlugs(): Set<string> {
  const rows = getDatabase().prepare("SELECT slug FROM projects").all() as { slug: string }[];
  return new Set(rows.map((row) => row.slug));
}

function unknownIn(state: OperatorState, known: Set<string>): string[] {
  const found = new Set<string>();
  for (const slug of Object.keys(state.notes)) if (!known.has(slug)) found.add(slug);
  for (const slug of state.pinned) if (!known.has(slug)) found.add(slug);
  if (state.checkpoint && !known.has(state.checkpoint.slug)) found.add(state.checkpoint.slug);
  for (const item of state.captures) if (item.projectSlug && !known.has(item.projectSlug)) found.add(item.projectSlug);
  for (const item of state.activity) if (!known.has(item.projectSlug)) found.add(item.projectSlug);
  for (const item of state.evidence) if (!known.has(item.projectSlug)) found.add(item.projectSlug);
  return [...found];
}

export function previewExfil(raw: string): ImportPreview {
  const { schema, state } = parseExfil(raw);
  const hash = createHash("sha256").update(raw).digest("hex");
  const duplicate = getDatabase().prepare("SELECT id FROM import_batches WHERE source_hash = ?").get(hash);
  const current = loadOperatorState().state;
  const conflicts: { id: string; type: string }[] = [];
  const currentCaptures = new Map(current.captures.map((item) => [item.id, item]));
  for (const item of state.captures) {
    const existing = currentCaptures.get(item.id);
    if (existing && JSON.stringify(existing) !== JSON.stringify(item)) conflicts.push({ id: item.id, type: "capture" });
  }
  return {
    schema,
    counts: countsOf(state),
    unknownSlugs: unknownIn(state, knownSlugs()),
    conflicts,
    duplicateFile: Boolean(duplicate),
  };
}

export function commitExfil(raw: string, resolutions: Resolutions = {}, options?: { failAfter?: number }): ImportCommitResult {
  const { schema, state } = parseExfil(raw);
  const hash = createHash("sha256").update(raw).digest("hex");
  const take = new Set(resolutions.take ?? []);
  return transaction((db) => {
    const duplicate = db.prepare("SELECT id FROM import_batches WHERE source_hash = ?").get(hash);
    if (duplicate) {
      return { inserted: 0, skipped: 0, held: 0, conflicts: 0, duplicateFile: true };
    }
    const known = new Set((db.prepare("SELECT slug FROM projects").all() as { slug: string }[]).map((row) => row.slug));
    const current = loadOperatorState(db).state;
    const next: OperatorState = {
      notes: { ...current.notes },
      publish: { ...current.publish },
      pinned: [...current.pinned],
      checkpoint: current.checkpoint,
      captures: [...current.captures],
      activity: [...current.activity],
      evidence: [...current.evidence],
      hardware: { ...current.hardware },
    };
    let inserted = 0;
    let skipped = 0;
    let held = 0;
    let conflicts = 0;
    let writes = 0;
    const batchId = crypto.randomUUID();
    const hold = (type: string, record: unknown, reason: string) => {
      held += 1;
      db.prepare("INSERT INTO import_holds (id, batch_id, record_type, record_json, reason) VALUES (?, ?, ?, ?, ?)").run(
        crypto.randomUUID(),
        batchId,
        type,
        JSON.stringify(record),
        reason,
      );
    };
    const bump = () => {
      writes += 1;
      if (options?.failAfter !== undefined && writes >= options.failAfter) {
        throw new Error("forced import rollback");
      }
    };

    for (const [slug, body] of Object.entries(state.notes)) {
      if (!known.has(slug)) {
        hold("note", { slug }, "unknown-project");
        continue;
      }
      if (next.notes[slug] && next.notes[slug] !== body && !take.has(`note:${slug}`)) {
        conflicts += 1;
        skipped += 1;
        continue;
      }
      if (!next.notes[slug]) inserted += 1;
      next.notes[slug] = body;
      bump();
    }
    for (const item of state.captures) {
      if (item.projectSlug && !known.has(item.projectSlug)) {
        hold("capture", { id: item.id }, "unknown-project");
        continue;
      }
      const existing = next.captures.find((capture) => capture.id === item.id);
      if (existing && JSON.stringify(existing) !== JSON.stringify(item)) {
        conflicts += 1;
        if (!take.has(item.id)) {
          skipped += 1;
          continue;
        }
        next.captures = next.captures.map((capture) => (capture.id === item.id ? item : capture));
        bump();
        continue;
      }
      if (!existing) {
        next.captures.push(item);
        inserted += 1;
        bump();
      } else skipped += 1;
    }
    for (const item of state.activity) {
      if (!known.has(item.projectSlug)) {
        hold("activity", { id: item.id }, "unknown-project");
        continue;
      }
      if (!next.activity.some((entry) => entry.id === item.id)) {
        next.activity.push(item);
        inserted += 1;
        bump();
      } else skipped += 1;
    }
    for (const item of state.evidence) {
      if (!known.has(item.projectSlug)) {
        hold("evidence", { id: item.id }, "unknown-project");
        continue;
      }
      if (!next.evidence.some((entry) => entry.id === item.id)) {
        next.evidence.push(item);
        inserted += 1;
        bump();
      } else skipped += 1;
    }
    for (const slug of state.pinned) {
      if (!known.has(slug)) {
        hold("pin", { slug }, "unknown-project");
        continue;
      }
      if (!next.pinned.includes(slug)) {
        next.pinned.push(slug);
        inserted += 1;
        bump();
      }
    }
    if (state.checkpoint) {
      if (!known.has(state.checkpoint.slug)) hold("checkpoint", { slug: state.checkpoint.slug }, "unknown-project");
      else if (!next.checkpoint) {
        next.checkpoint = state.checkpoint;
        inserted += 1;
        bump();
      } else if (JSON.stringify(next.checkpoint) !== JSON.stringify(state.checkpoint)) {
        conflicts += 1;
        if (resolutions.checkpoint === "take-import") {
          next.checkpoint = state.checkpoint;
          bump();
        } else skipped += 1;
      }
    }
    for (const [id, patch] of Object.entries(state.hardware)) {
      next.hardware[id] = { ...next.hardware[id], ...patch };
      bump();
    }
    for (const [slug, gate] of Object.entries(state.publish)) {
      if (!known.has(slug)) {
        hold("publish", { slug }, "unknown-project");
        continue;
      }
      next.publish[slug] = { ...next.publish[slug], ...gate };
      bump();
    }

    const meta = db.prepare("SELECT revision FROM operator_meta WHERE id = 1").get() as { revision: number };
    db.prepare("UPDATE operator_meta SET revision = revision + 1, updated_at = ? WHERE id = 1").run(nowIso());
    replaceOperatorRows(db, next);
    db.prepare("INSERT INTO import_batches (id, source_hash, schema_name, imported_at, result) VALUES (?, ?, ?, ?, ?)").run(
      batchId,
      hash,
      schema,
      nowIso(),
      `inserted=${inserted} skipped=${skipped} held=${held} conflicts=${conflicts}`,
    );
    audit(db, "import.commit", "import", batchId, `inserted=${inserted} skipped=${skipped} held=${held}`);
    void meta;
    return { inserted, skipped, held, conflicts, duplicateFile: false };
  });
}
