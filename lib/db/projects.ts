import type { DatabaseSync } from "node:sqlite";

import { audit, getDatabase, nowIso, transaction } from "@/lib/db/connection";
import {
  assertRevision,
  optionalText,
  requireDepartment,
  requireSlug,
  requireStatus,
  requireStringList,
  requireText,
  RevisionConflictError,
  ValidationError,
} from "@/lib/db/validate";
import type { Project, ProjectStatus, PublishGate } from "@/lib/types";

export type ShowcaseDraft = {
  visitorTitle: string;
  motif: string;
  teaser: string;
  category: string;
  number: string;
  glyph: string;
  exploreLabel: string;
  noteSlug: string;
  visibility: "draft" | "approved" | "hidden";
  revision: number;
};

export type NoteDraft = {
  id: string;
  slug: string;
  label: string;
  category: string;
  title: string;
  lead: string;
  blocks: { heading: string; body: string }[];
  aside: string;
  surface: string;
  discovery: boolean;
  displayOrder: number;
  threadTags: string | null;
  threadTitle: string | null;
  threadDetail: string | null;
  threadNum: string | null;
  visibility: "draft" | "approved" | "hidden";
  links: { targetSlug: string; label: string }[];
  projectSlugs: string[];
  revision: number;
};

export type OwnerProjectRecord = Project & {
  id: string;
  revision: number;
  archiveState: "active" | "archived";
  sourceUpdated: string | null;
  editedAt: string;
  showcase: ShowcaseDraft | null;
  note: NoteDraft | null;
  waitingFor: string[];
  blockedBy: string[];
  unlocks: string[];
  flags: string[];
};

type ProjectRow = {
  id: string;
  slug: string;
  name: string;
  callsign: string;
  department: string;
  status: string;
  summary: string;
  brief: string;
  next_action: string;
  success_criteria: string | null;
  stack_json: string;
  publish_json: string;
  archive_state: string;
  source_updated: string | null;
  created_at: string;
  updated_at: string;
  revision: number;
};

function parsePublish(raw: string): PublishGate {
  const value = JSON.parse(raw) as Partial<PublishGate>;
  return {
    readme: Boolean(value.readme),
    screenshots: Boolean(value.screenshots),
    demo: Boolean(value.demo),
  };
}

function relatedSlugs(db: DatabaseSync, projectId: string): string[] {
  const rows = db
    .prepare(
      `SELECT target.slug AS slug
       FROM relationships rel
       JOIN projects target ON target.id = rel.target_id
       WHERE rel.source_id = ? AND rel.kind = 'related'
       ORDER BY target.slug`,
    )
    .all(projectId) as { slug: string }[];
  return rows.map((row) => row.slug);
}

function textRelations(db: DatabaseSync, projectId: string, kind: string): string[] {
  const rows = db
    .prepare(
      "SELECT description FROM relationships WHERE source_id = ? AND kind = ? AND target_id IS NULL ORDER BY description",
    )
    .all(projectId, kind) as { description: string | null }[];
  return rows.map((row) => row.description ?? "").filter(Boolean);
}

function readNote(db: DatabaseSync, slug: string): NoteDraft | null {
  const row = db.prepare("SELECT * FROM notes WHERE slug = ?").get(slug) as
    | Record<string, unknown>
    | undefined;
  if (!row) return null;
  const links = db
    .prepare("SELECT target_slug, label FROM note_links WHERE note_id = ? ORDER BY position")
    .all(String(row.id)) as { target_slug: string; label: string }[];
  const projects = db
    .prepare(
      `SELECT p.slug AS slug FROM note_projects np
       JOIN projects p ON p.id = np.project_id
       WHERE np.note_id = ? ORDER BY p.slug`,
    )
    .all(String(row.id)) as { slug: string }[];
  const blocks = JSON.parse(String(row.blocks_json)) as { heading: string; body: string }[];
  return {
    id: String(row.id),
    slug: String(row.slug),
    label: String(row.label),
    category: String(row.category),
    title: String(row.title),
    lead: String(row.lead),
    blocks,
    aside: String(row.aside),
    surface: String(row.surface),
    discovery: Number(row.discovery) === 1,
    displayOrder: Number(row.display_order),
    threadTags: row.thread_tags ? String(row.thread_tags) : null,
    threadTitle: row.thread_title ? String(row.thread_title) : null,
    threadDetail: row.thread_detail ? String(row.thread_detail) : null,
    threadNum: row.thread_num ? String(row.thread_num) : null,
    visibility: String(row.visibility) as NoteDraft["visibility"],
    links: links.map((link) => ({ targetSlug: link.target_slug, label: link.label })),
    projectSlugs: projects.map((item) => item.slug),
    revision: Number(row.revision),
  };
}

function readShowcase(db: DatabaseSync, projectId: string): ShowcaseDraft | null {
  const row = db.prepare("SELECT * FROM showcase_entries WHERE project_id = ?").get(projectId) as
    | Record<string, unknown>
    | undefined;
  if (!row) return null;
  return {
    visitorTitle: String(row.visitor_title),
    motif: String(row.motif),
    teaser: String(row.teaser),
    category: String(row.category),
    number: String(row.number_label),
    glyph: String(row.glyph),
    exploreLabel: String(row.explore_label),
    noteSlug: String(row.note_slug),
    visibility: String(row.visibility) as ShowcaseDraft["visibility"],
    revision: Number(row.revision),
  };
}

export function mapProject(db: DatabaseSync, row: ProjectRow): OwnerProjectRecord {
  const flags = db
    .prepare("SELECT message FROM review_flags WHERE project_id = ? ORDER BY id")
    .all(row.id) as { message: string }[];
  const showcase = readShowcase(db, row.id);
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    callsign: row.callsign,
    department: row.department as Project["department"],
    status: row.status as ProjectStatus,
    summary: row.summary,
    brief: row.brief,
    nextAction: row.next_action,
    successCriteria: row.success_criteria ?? undefined,
    stack: JSON.parse(row.stack_json) as string[],
    related: relatedSlugs(db, row.id),
    updated: (row.source_updated ?? row.updated_at).slice(0, 10),
    publish: parsePublish(row.publish_json),
    revision: row.revision,
    archiveState: row.archive_state === "archived" ? "archived" : "active",
    sourceUpdated: row.source_updated,
    editedAt: row.updated_at,
    showcase,
    note: showcase ? readNote(db, showcase.noteSlug) : null,
    waitingFor: textRelations(db, row.id, "waiting_for"),
    blockedBy: textRelations(db, row.id, "blocked_by"),
    unlocks: textRelations(db, row.id, "unlocks"),
    flags: flags.map((flag) => flag.message),
  };
}

export function listOwnerProjects(db: DatabaseSync = getDatabase()): OwnerProjectRecord[] {
  const rows = db.prepare("SELECT * FROM projects ORDER BY name").all() as ProjectRow[];
  return rows.map((row) => mapProject(db, row));
}

export function getOwnerProjectBySlug(slug: string, db: DatabaseSync = getDatabase()): OwnerProjectRecord | null {
  const row = db.prepare("SELECT * FROM projects WHERE slug = ?").get(slug) as ProjectRow | undefined;
  return row ? mapProject(db, row) : null;
}

export type ProjectInput = {
  name: string;
  slug: string;
  callsign: string;
  department: string;
  status: string;
  summary: string;
  brief: string;
  nextAction: string;
  successCriteria?: string | null;
  stack: string[];
  related: string[];
  waitingFor: string[];
  blockedBy: string[];
  unlocks: string[];
  showcase: Omit<ShowcaseDraft, "revision" | "visibility"> & { visibility?: ShowcaseDraft["visibility"] };
  note: Omit<NoteDraft, "id" | "revision" | "projectSlugs" | "discovery" | "displayOrder" | "surface"> & {
    surface?: string;
    discovery?: boolean;
    projectSlugs?: string[];
  };
};

function cleanInput(input: ProjectInput): ProjectInput {
  return {
    name: requireText(input.name, "Name", 120),
    slug: requireSlug(input.slug),
    callsign: requireText(input.callsign, "Callsign", 32),
    department: requireDepartment(input.department),
    status: requireStatus(input.status),
    summary: requireText(input.summary, "Summary", 400),
    brief: requireText(input.brief, "Mission brief", 8000),
    nextAction: requireText(input.nextAction, "Next action", 800),
    successCriteria: optionalText(input.successCriteria, "Success criteria", 800),
    stack: requireStringList(input.stack ?? [], "Stack", 24, 80),
    related: requireStringList(input.related ?? [], "Related projects", 24, 64).map((slug) =>
      requireSlug(slug, "Related project"),
    ),
    waitingFor: requireStringList(input.waitingFor ?? [], "Waiting for", 12, 240),
    blockedBy: requireStringList(input.blockedBy ?? [], "Blocked by", 12, 240),
    unlocks: requireStringList(input.unlocks ?? [], "Unlocks", 12, 240),
    showcase: {
      visitorTitle: requireText(input.showcase.visitorTitle, "Card title", 80),
      motif: requireText(input.showcase.motif, "Motif", 16),
      teaser: requireText(input.showcase.teaser, "Teaser", 400),
      category: requireText(input.showcase.category, "Card category", 80),
      number: requireText(input.showcase.number, "Card number", 8),
      glyph: requireText(input.showcase.glyph, "Glyph", 24),
      exploreLabel: requireText(input.showcase.exploreLabel, "Explore label", 40),
      noteSlug: requireSlug(input.showcase.noteSlug, "Field note"),
      visibility: input.showcase.visibility ?? "draft",
    },
    note: {
      slug: requireSlug(input.note.slug, "Field note"),
      label: requireText(input.note.label, "Note label", 80),
      category: requireText(input.note.category, "Note category", 80),
      title: requireText(input.note.title, "Note title", 200),
      lead: requireText(input.note.lead, "Note lead", 600),
      blocks: (input.note.blocks ?? []).slice(0, 12).map((block, index) => ({
        heading: requireText(block.heading, `Block ${index + 1} heading`, 120),
        body: requireText(block.body, `Block ${index + 1} body`, 2000),
      })),
      aside: requireText(input.note.aside ?? "", "Aside", 400, 0) || "",
      links: (input.note.links ?? []).slice(0, 12).map((link, index) => ({
        targetSlug: requireSlug(link.targetSlug, `Link ${index + 1}`),
        label: requireText(link.label, `Link ${index + 1} label`, 120),
      })),
      surface: input.note.surface ?? "project",
      discovery: Boolean(input.note.discovery),
      projectSlugs: (input.note.projectSlugs ?? [input.slug]).map((slug) => requireSlug(slug)),
      threadTags: input.note.threadTags ?? null,
      threadTitle: input.note.threadTitle ?? null,
      threadDetail: input.note.threadDetail ?? null,
      threadNum: input.note.threadNum ?? null,
      visibility: input.note.visibility ?? "draft",
    },
  };
}

function replaceTextRelations(db: DatabaseSync, projectId: string, kind: string, values: string[]) {
  db.prepare("DELETE FROM relationships WHERE source_id = ? AND kind = ? AND target_id IS NULL").run(
    projectId,
    kind,
  );
  for (const description of values) {
    db.prepare(
      "INSERT INTO relationships (id, source_id, target_id, kind, description) VALUES (?, ?, NULL, ?, ?)",
    ).run(crypto.randomUUID(), projectId, kind, description);
  }
}

function replaceRelated(db: DatabaseSync, projectId: string, slugs: string[]) {
  db.prepare("DELETE FROM relationships WHERE source_id = ? AND kind = 'related'").run(projectId);
  for (const slug of slugs) {
    const target = db.prepare("SELECT id FROM projects WHERE slug = ?").get(slug) as { id: string } | undefined;
    if (!target) throw new ValidationError(`Related project ${slug} does not exist.`);
    if (target.id === projectId) continue;
    db.prepare(
      "INSERT INTO relationships (id, source_id, target_id, kind, description) VALUES (?, ?, ?, 'related', NULL)",
    ).run(crypto.randomUUID(), projectId, target.id);
  }
}

function writeNote(db: DatabaseSync, projectId: string, note: ProjectInput["note"], revision?: number) {
  const existing = db.prepare("SELECT id, revision FROM notes WHERE slug = ?").get(note.slug) as
    | { id: string; revision: number }
    | undefined;
  const blocks = JSON.stringify(note.blocks);
  const stamp = nowIso();
  let noteId = existing?.id ?? `note_${note.slug}`;
  if (!existing) {
    db.prepare(
      `INSERT INTO notes (
        id, slug, label, category, title, lead, blocks_json, aside, surface, discovery, display_order,
        thread_tags, thread_title, thread_detail, thread_num, visibility, approved_snapshot_json, revision, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', NULL, 1, ?)`,
    ).run(
      noteId,
      note.slug,
      note.label,
      note.category,
      note.title,
      note.lead,
      blocks,
      note.aside,
      note.surface ?? "project",
      note.discovery ? 1 : 0,
      100,
      note.threadTags ?? null,
      note.threadTitle ?? null,
      note.threadDetail ?? null,
      note.threadNum ?? null,
      stamp,
    );
  } else {
    if (revision !== undefined) {
      const updated = db
        .prepare(
          `UPDATE notes SET label=?, category=?, title=?, lead=?, blocks_json=?, aside=?, revision=revision+1, updated_at=?
           WHERE id=? AND revision=?`,
        )
        .run(note.label, note.category, note.title, note.lead, blocks, note.aside, stamp, existing.id, revision);
      if (updated.changes !== 1) throw new RevisionConflictError();
    }
    noteId = existing.id;
  }
  db.prepare("DELETE FROM note_links WHERE note_id = ?").run(noteId);
  note.links.forEach((link, index) => {
    const target = db.prepare("SELECT slug FROM notes WHERE slug = ?").get(link.targetSlug);
    if (!target) throw new ValidationError(`Field note ${link.targetSlug} does not exist yet.`);
    db.prepare("INSERT INTO note_links (note_id, position, target_slug, label) VALUES (?, ?, ?, ?)").run(
      noteId,
      index,
      link.targetSlug,
      link.label,
    );
  });
  db.prepare("DELETE FROM note_projects WHERE note_id = ?").run(noteId);
  for (const slug of note.projectSlugs ?? []) {
    const project = db.prepare("SELECT id FROM projects WHERE slug = ?").get(slug) as { id: string } | undefined;
    if (!project) throw new ValidationError(`Note project ${slug} does not exist.`);
    db.prepare("INSERT INTO note_projects (note_id, project_id) VALUES (?, ?)").run(noteId, project.id);
  }
  if (!(note.projectSlugs ?? []).includes(projectId) ) {
    const self = db.prepare("SELECT slug FROM projects WHERE id = ?").get(projectId) as { slug: string };
    if (!(note.projectSlugs ?? []).length) {
      db.prepare("INSERT OR IGNORE INTO note_projects (note_id, project_id) VALUES (?, ?)").run(noteId, projectId);
      void self;
    }
  }
  return noteId;
}

export function createProject(input: ProjectInput): OwnerProjectRecord {
  const clean = cleanInput(input);
  return transaction((db) => {
    if (db.prepare("SELECT id FROM projects WHERE slug = ?").get(clean.slug)) {
      throw new ValidationError("That slug is already in use.");
    }
    if (db.prepare("SELECT id FROM notes WHERE slug = ?").get(clean.showcase.noteSlug)) {
      throw new ValidationError("That field-note slug is already in use.");
    }
    const id = `proj_${crypto.randomUUID()}`;
    const stamp = nowIso();
    db.prepare(
      `INSERT INTO projects (
        id, slug, name, callsign, department, status, summary, brief, next_action, success_criteria,
        stack_json, publish_json, archive_state, source_updated, created_at, updated_at, revision
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NULL, ?, ?, 1)`,
    ).run(
      id,
      clean.slug,
      clean.name,
      clean.callsign,
      clean.department,
      clean.status,
      clean.summary,
      clean.brief,
      clean.nextAction,
      clean.successCriteria,
      JSON.stringify(clean.stack),
      JSON.stringify({ readme: false, screenshots: false, demo: false }),
      stamp,
      stamp,
    );
    writeNote(db, id, { ...clean.note, slug: clean.showcase.noteSlug });
    db.prepare(
      `INSERT INTO showcase_entries (
        project_id, visitor_title, motif, teaser, category, number_label, glyph, explore_label, note_slug,
        visibility, approved_snapshot_json, approved_revision, revision, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', NULL, NULL, 1, ?)`,
    ).run(
      id,
      clean.showcase.visitorTitle,
      clean.showcase.motif,
      clean.showcase.teaser,
      clean.showcase.category,
      clean.showcase.number,
      clean.showcase.glyph,
      clean.showcase.exploreLabel,
      clean.showcase.noteSlug,
      stamp,
    );
    replaceRelated(db, id, clean.related);
    replaceTextRelations(db, id, "waiting_for", clean.waitingFor);
    replaceTextRelations(db, id, "blocked_by", clean.blockedBy);
    replaceTextRelations(db, id, "unlocks", clean.unlocks);
    audit(db, "project.create", "project", clean.slug, "ok");
    return mapProject(db, db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as ProjectRow);
  });
}

export function updateProject(slug: string, revision: number, input: ProjectInput): OwnerProjectRecord {
  const clean = cleanInput({ ...input, slug });
  const expected = assertRevision(revision);
  return transaction((db) => {
    const current = db.prepare("SELECT * FROM projects WHERE slug = ?").get(slug) as ProjectRow | undefined;
    if (!current) throw new ValidationError("Project was not found.");
    if (clean.slug !== slug) throw new ValidationError("Slug changes are disabled after creation.");
    const stamp = nowIso();
    const updated = db
      .prepare(
        `UPDATE projects SET name=?, callsign=?, department=?, status=?, summary=?, brief=?, next_action=?,
         success_criteria=?, stack_json=?, updated_at=?, revision=revision+1
         WHERE id=? AND revision=?`,
      )
      .run(
        clean.name,
        clean.callsign,
        clean.department,
        clean.status,
        clean.summary,
        clean.brief,
        clean.nextAction,
        clean.successCriteria,
        JSON.stringify(clean.stack),
        stamp,
        current.id,
        expected,
      );
    if (updated.changes !== 1) throw new RevisionConflictError();
    const showcase = db.prepare("SELECT revision, note_slug FROM showcase_entries WHERE project_id = ?").get(current.id) as
      | { revision: number; note_slug: string }
      | undefined;
    const noteRow = db.prepare("SELECT revision FROM notes WHERE slug = ?").get(clean.note.slug) as
      | { revision: number }
      | undefined;
    writeNote(db, current.id, clean.note, noteRow?.revision);
    if (showcase) {
      db.prepare(
        `UPDATE showcase_entries SET visitor_title=?, motif=?, teaser=?, category=?, number_label=?, glyph=?,
         explore_label=?, note_slug=?, revision=revision+1, updated_at=? WHERE project_id=?`,
      ).run(
        clean.showcase.visitorTitle,
        clean.showcase.motif,
        clean.showcase.teaser,
        clean.showcase.category,
        clean.showcase.number,
        clean.showcase.glyph,
        clean.showcase.exploreLabel,
        clean.showcase.noteSlug,
        stamp,
        current.id,
      );
    }
    replaceRelated(db, current.id, clean.related);
    replaceTextRelations(db, current.id, "waiting_for", clean.waitingFor);
    replaceTextRelations(db, current.id, "blocked_by", clean.blockedBy);
    replaceTextRelations(db, current.id, "unlocks", clean.unlocks);
    audit(db, "project.update", "project", slug, `revision=${expected + 1}`);
    return mapProject(db, db.prepare("SELECT * FROM projects WHERE id = ?").get(current.id) as ProjectRow);
  });
}

function setArchive(slug: string, state: "active" | "archived") {
  return transaction((db) => {
    const current = db.prepare("SELECT id, revision FROM projects WHERE slug = ?").get(slug) as
      | { id: string; revision: number }
      | undefined;
    if (!current) throw new ValidationError("Project was not found.");
    db.prepare("UPDATE projects SET archive_state=?, updated_at=?, revision=revision+1 WHERE id=?").run(
      state,
      nowIso(),
      current.id,
    );
    audit(db, state === "archived" ? "project.archive" : "project.restore", "project", slug, "ok");
    return mapProject(db, db.prepare("SELECT * FROM projects WHERE id = ?").get(current.id) as ProjectRow);
  });
}

export function archiveProject(slug: string) {
  return setArchive(slug, "archived");
}

export function restoreProject(slug: string) {
  return setArchive(slug, "active");
}

export function approveShowcase(slug: string): OwnerProjectRecord {
  return transaction((db) => {
    const project = db.prepare("SELECT id FROM projects WHERE slug = ?").get(slug) as { id: string } | undefined;
    if (!project) throw new ValidationError("Project was not found.");
    const showcase = db.prepare("SELECT * FROM showcase_entries WHERE project_id = ?").get(project.id) as
      | Record<string, unknown>
      | undefined;
    if (!showcase) throw new ValidationError("This project has no showcase entry.");
    const note = readNote(db, String(showcase.note_slug));
    if (!note) throw new ValidationError("The field note for this card is missing.");
    const known = new Set(
      (db.prepare("SELECT slug FROM notes").all() as { slug: string }[]).map((row) => row.slug),
    );
    const missing = note.links.filter((link) => !known.has(link.targetSlug));
    if (missing.length) {
      throw new ValidationError("A field-note link points at a missing note. Fix it before approval.");
    }
    const cardSnapshot = {
      slug,
      visitorTitle: showcase.visitor_title,
      motif: showcase.motif,
      teaser: showcase.teaser,
      category: showcase.category,
      number: showcase.number_label,
      glyph: showcase.glyph,
      exploreLabel: showcase.explore_label,
      noteSlug: showcase.note_slug,
    };
    const noteSnapshot = {
      slug: note.slug,
      label: note.label,
      category: note.category,
      titleLines: note.title.split("\n"),
      lead: note.lead,
      blocks: note.blocks,
      aside: note.aside,
      links: note.links,
      surface: note.surface,
      discovery: note.discovery,
      threadTags: note.threadTags,
      threadTitle: note.threadTitle,
      threadDetail: note.threadDetail,
      threadNum: note.threadNum,
      displayOrder: note.displayOrder,
    };
    const stamp = nowIso();
    db.prepare(
      `UPDATE showcase_entries SET visibility='approved', approved_snapshot_json=?, approved_revision=revision, updated_at=?
       WHERE project_id=?`,
    ).run(JSON.stringify(cardSnapshot), stamp, project.id);
    db.prepare(
      "UPDATE notes SET visibility='approved', approved_snapshot_json=?, updated_at=? WHERE id=?",
    ).run(JSON.stringify(noteSnapshot), stamp, note.id);
    audit(db, "showcase.approve", "project", slug, "snapshot");
    return mapProject(db, db.prepare("SELECT * FROM projects WHERE id = ?").get(project.id) as ProjectRow);
  });
}
