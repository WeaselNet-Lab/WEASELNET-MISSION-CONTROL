import type { DatabaseSync } from "node:sqlite";

import { getDatabase } from "@/lib/db/connection";
import { visibleLinks } from "@/lib/explore/trail";

export type VisitorBlock = { heading: string; body: string };
export type VisitorLink = { targetSlug: string; label: string };

export type VisitorNote = {
  slug: string;
  label: string;
  category: string;
  titleLines: string[];
  lead: string;
  blocks: VisitorBlock[];
  aside: string;
  links: VisitorLink[];
  surface: string;
  discovery: boolean;
  threadTags: string | null;
  threadTitle: string | null;
  threadDetail: string | null;
  threadNum: string | null;
  displayOrder: number;
};

export type VisitorCard = {
  slug: string;
  visitorTitle: string;
  motif: string;
  teaser: string;
  category: string;
  number: string;
  glyph: string;
  exploreLabel: string;
  noteSlug: string;
};

export type VisitorSnapshot = {
  cards: VisitorCard[];
  notes: VisitorNote[];
  threads: VisitorNote[];
  discovery: string[];
};

const PRIVATE_MARKERS = ["brief", "nextAction", "successCriteria", "captures", "hardware", "weseals", "/home/"];

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function allowNote(slug: string, raw: unknown): VisitorNote | null {
  const value = asObject(raw);
  if (!value) return null;
  const blocksIn = Array.isArray(value.blocks) ? value.blocks : [];
  const linksIn = Array.isArray(value.links) ? value.links : [];
  return {
    slug,
    label: text(value.label),
    category: text(value.category),
    titleLines: Array.isArray(value.titleLines) ? value.titleLines.filter((item): item is string => typeof item === "string") : [],
    lead: text(value.lead),
    blocks: blocksIn
      .map((block) => asObject(block))
      .filter((block): block is Record<string, unknown> => Boolean(block))
      .map((block) => ({ heading: text(block.heading), body: text(block.body) })),
    aside: text(value.aside),
    links: linksIn
      .map((link) => asObject(link))
      .filter((link): link is Record<string, unknown> => Boolean(link))
      .map((link) => ({ targetSlug: text(link.targetSlug), label: text(link.label) }))
      .filter((link) => link.targetSlug && link.label),
    surface: text(value.surface),
    discovery: value.discovery === true,
    threadTags: typeof value.threadTags === "string" ? value.threadTags : null,
    threadTitle: typeof value.threadTitle === "string" ? value.threadTitle : null,
    threadDetail: typeof value.threadDetail === "string" ? value.threadDetail : null,
    threadNum: typeof value.threadNum === "string" ? value.threadNum : null,
    displayOrder: typeof value.displayOrder === "number" ? value.displayOrder : 0,
  };
}

function allowCard(raw: unknown): VisitorCard | null {
  const value = asObject(raw);
  if (!value) return null;
  const slug = text(value.slug);
  const noteSlug = text(value.noteSlug);
  if (!slug || !noteSlug) return null;
  return {
    slug,
    visitorTitle: text(value.visitorTitle),
    motif: text(value.motif),
    teaser: text(value.teaser),
    category: text(value.category),
    number: text(value.number),
    glyph: text(value.glyph),
    exploreLabel: text(value.exploreLabel),
    noteSlug,
  };
}

export function readVisitorSnapshot(db: DatabaseSync = getDatabase()): VisitorSnapshot {
  const cardRows = db
    .prepare(
      `SELECT s.approved_snapshot_json AS snapshot
       FROM showcase_entries s
       JOIN projects p ON p.id = s.project_id
       WHERE s.visibility = 'approved'
         AND s.approved_snapshot_json IS NOT NULL
         AND p.archive_state = 'active'`,
    )
    .all() as { snapshot: string }[];
  const noteRows = db
    .prepare(
      `SELECT slug, approved_snapshot_json AS snapshot
       FROM notes
       WHERE visibility = 'approved' AND approved_snapshot_json IS NOT NULL`,
    )
    .all() as { slug: string; snapshot: string }[];
  const notes = noteRows
    .map((row) => allowNote(row.slug, JSON.parse(row.snapshot) as unknown))
    .filter((note): note is VisitorNote => Boolean(note))
    .sort((a, b) => a.displayOrder - b.displayOrder);
  const available = new Set(notes.map((note) => note.slug));
  for (const note of notes) note.links = visibleLinks(note.links, available);
  const cards = cardRows
    .map((row) => allowCard(JSON.parse(row.snapshot) as unknown))
    .filter((card): card is VisitorCard => Boolean(card))
    .filter((card) => available.has(card.noteSlug))
    .sort((a, b) => a.number.localeCompare(b.number));
  const threads = notes.filter((note) => note.surface === "thread");
  return {
    cards,
    notes,
    threads,
    discovery: notes.filter((note) => note.discovery).map((note) => note.slug),
  };
}

export function snapshotLeaksPrivate(snapshot: VisitorSnapshot): string | null {
  const blob = JSON.stringify(snapshot);
  for (const marker of PRIVATE_MARKERS) {
    if (blob.includes(marker)) return marker;
  }
  return null;
}
