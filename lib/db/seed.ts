import type { DatabaseSync } from "node:sqlite";

import { nowIso } from "@/lib/db/connection";
import referenceNotes from "@/lib/db/reference-notes.json";
import { missionLinks } from "@/lib/mission-links";
import { projects } from "@/lib/projects";

type RawNote = {
  label: string;
  category: string;
  title: string;
  lead: string;
  blocks: [string, string][];
  aside: string;
  links: [string, string][];
};

const NOTES = referenceNotes as unknown as Record<string, RawNote>;

const DISCOVERY = new Set(["presence", "secondlife", "invitation", "oracle", "counterbalance"]);

const NOTE_PROJECTS: Record<string, string[]> = {
  alfred: ["alfred"],
  dragons: ["fury-twins"],
  cospace: ["cospace"],
  batdeck: ["batdeck"],
  presence: ["alfred", "fury-twins", "cospace"],
  secondlife: ["batdeck", "alfred"],
  invitation: ["cospace"],
  oracle: ["alfred", "batdeck"],
  counterbalance: ["fury-twins"],
  underneath: [],
};

const THREADS: Record<string, { tags: string; title: string; detail: string; num: string }> = {
  presence: {
    tags: "ALFRED · DRAGONS · CO-SPACE",
    title: "When does a machine feel present?",
    detail: "A voice, a glance, a shared point of view.",
    num: "01",
  },
  secondlife: {
    tags: "BATDECK · SALVAGE · ALFRED",
    title: "What if the parts get another story?",
    detail: "Follow a discarded object into a new purpose.",
    num: "02",
  },
  invitation: {
    tags: "CO-SPACE · THE LAB · CURIOSITY",
    title: "Can a workshop become a world?",
    detail: "The door might eventually open somewhere else.",
    num: "03",
  },
};

const CARDS = [
  {
    projectSlug: "alfred",
    noteSlug: "alfred",
    visitorTitle: "Alfred",
    motif: "Al.",
    teaser: "A personal AI with a place to call home.\nBuilt for continuity, curiosity, and family.",
    category: "LOCAL AI",
    number: "01",
    glyph: "alfred",
    exploreLabel: "EXPLORE THE SYSTEM",
  },
  {
    projectSlug: "fury-twins",
    noteSlug: "dragons",
    visitorTitle: "Here be dragons",
    motif: "Life_",
    teaser: "Building animatronic companions with my daughters. A creature, one joint at a time.",
    category: "ROBOTICS + IMAGINATION",
    number: "02",
    glyph: "dragon",
    exploreLabel: "MEET THE EXPERIMENT",
  },
  {
    projectSlug: "cospace",
    noteSlug: "cospace",
    visitorTitle: "Co-Space",
    motif: "Here²",
    teaser: "Two headsets. One shared sense of place.\nA world you can actually step into together.",
    category: "SHARED VIRTUAL WORLDS",
    number: "03",
    glyph: "space",
    exploreLabel: "STEP INTO THE IDEA",
  },
  {
    projectSlug: "batdeck",
    noteSlug: "batdeck",
    visitorTitle: "BATDECK",
    motif: ">_",
    teaser: "An Alfred field-terminal concept.\nBecause a second life should be interesting.",
    category: "HARDWARE REIMAGINED",
    number: "04",
    glyph: "deck",
    exploreLabel: "OPEN THE CONCEPT",
  },
];

function surfaceFor(slug: string): string {
  if (slug in THREADS) return "thread";
  if (slug === "underneath") return "hidden";
  if (["oracle", "counterbalance"].includes(slug)) return "side";
  return "project";
}

function insertProject(
  db: DatabaseSync,
  project: {
    slug: string;
    name: string;
    callsign: string;
    department: string;
    status: string;
    summary: string;
    brief: string;
    nextAction: string;
    successCriteria?: string;
    stack: string[];
    publish: { readme: boolean; screenshots: boolean; demo: boolean };
    updated?: string | null;
  },
) {
  const stamp = nowIso();
  db.prepare(
    `INSERT OR IGNORE INTO projects (
      id, slug, name, callsign, department, status, summary, brief, next_action, success_criteria,
      stack_json, publish_json, archive_state, source_updated, created_at, updated_at, revision
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, 1)`,
  ).run(
    project.slug,
    project.slug,
    project.name,
    project.callsign,
    project.department,
    project.status,
    project.summary,
    project.brief,
    project.nextAction,
    project.successCriteria ?? null,
    JSON.stringify(project.stack),
    JSON.stringify(project.publish),
    project.updated ?? null,
    stamp,
    stamp,
  );
}

export function seedDatabase(db: DatabaseSync): void {
  for (const project of projects) {
    insertProject(db, project);
  }
  insertProject(db, {
    slug: "batdeck",
    name: "BATDECK",
    callsign: "BATDECK",
    department: "hardware",
    status: "concept",
    summary: "A portable Alfred field-terminal concept. The donor hardware and enclosure are still open.",
    brief:
      "This is an early redesign concept. Nothing here should be read as finished hardware, a completed enclosure, or a working field terminal.",
    nextAction: "Inspect the donor device and record which parts can serve a portable Alfred terminal.",
    successCriteria: "The concept lists the donor, the parts that can stay, and the parts that cannot.",
    stack: ["concept", "salvage"],
    publish: { readme: false, screenshots: false, demo: false },
    updated: null,
  });

  const stamp = nowIso();
  const slugs = Object.keys(NOTES);
  slugs.forEach((slug, index) => {
    const note = NOTES[slug];
    const title = note.title.replaceAll("<br>", "\n");
    const thread = THREADS[slug];
    const blocks = note.blocks.map(([heading, body]) => ({ heading, body }));
    const snapshot = {
      slug,
      label: note.label,
      category: note.category,
      titleLines: title.split("\n"),
      lead: note.lead,
      blocks,
      aside: note.aside,
      links: note.links.map(([targetSlug, label]) => ({ targetSlug, label })),
      surface: surfaceFor(slug),
      discovery: DISCOVERY.has(slug),
      threadTags: thread?.tags ?? null,
      threadTitle: thread?.title ?? null,
      threadDetail: thread?.detail ?? null,
      threadNum: thread?.num ?? null,
      displayOrder: index,
    };
    const inserted = db
      .prepare(
        `INSERT OR IGNORE INTO notes (
          id, slug, label, category, title, lead, blocks_json, aside, surface, discovery, display_order,
          thread_tags, thread_title, thread_detail, thread_num, visibility, approved_snapshot_json, revision, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, 1, ?)`,
      )
      .run(
        `note_${slug}`,
        slug,
        note.label,
        note.category,
        title,
        note.lead,
        JSON.stringify(blocks),
        note.aside,
        surfaceFor(slug),
        DISCOVERY.has(slug) ? 1 : 0,
        index,
        thread?.tags ?? null,
        thread?.title ?? null,
        thread?.detail ?? null,
        thread?.num ?? null,
        JSON.stringify(snapshot),
        stamp,
      );
    if (inserted.changes !== 1) return;
    note.links.forEach(([targetSlug, label], position) => {
      db.prepare("INSERT INTO note_links (note_id, position, target_slug, label) VALUES (?, ?, ?, ?)").run(
        `note_${slug}`,
        position,
        targetSlug,
        label,
      );
    });
    for (const projectSlug of NOTE_PROJECTS[slug] ?? []) {
      const project = db.prepare("SELECT id FROM projects WHERE slug = ?").get(projectSlug) as { id: string } | undefined;
      if (!project) continue;
      db.prepare("INSERT OR IGNORE INTO note_projects (note_id, project_id) VALUES (?, ?)").run(`note_${slug}`, project.id);
    }
  });

  for (const card of CARDS) {
    const project = db.prepare("SELECT id FROM projects WHERE slug = ?").get(card.projectSlug) as { id: string } | undefined;
    if (!project) continue;
    const snapshot = {
      slug: card.projectSlug,
      visitorTitle: card.visitorTitle,
      motif: card.motif,
      teaser: card.teaser,
      category: card.category,
      number: card.number,
      glyph: card.glyph,
      exploreLabel: card.exploreLabel,
      noteSlug: card.noteSlug,
    };
    db.prepare(
      `INSERT OR IGNORE INTO showcase_entries (
        project_id, visitor_title, motif, teaser, category, number_label, glyph, explore_label, note_slug,
        visibility, approved_snapshot_json, approved_revision, revision, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, 1, 1, ?)`,
    ).run(
      project.id,
      card.visitorTitle,
      card.motif,
      card.teaser,
      card.category,
      card.number,
      card.glyph,
      card.exploreLabel,
      card.noteSlug,
      JSON.stringify(snapshot),
      stamp,
    );
  }

  for (const project of projects) {
    const source = db.prepare("SELECT id FROM projects WHERE slug = ?").get(project.slug) as { id: string } | undefined;
    if (!source) continue;
    for (const related of project.related) {
      const target = db.prepare("SELECT id FROM projects WHERE slug = ?").get(related) as { id: string } | undefined;
      if (!target) continue;
      db.prepare(
        "INSERT OR IGNORE INTO relationships (id, source_id, target_id, kind, description) VALUES (?, ?, ?, 'related', NULL)",
      ).run(`rel_${project.slug}_${related}`, source.id, target.id);
    }
  }
  const batdeck = db.prepare("SELECT id FROM projects WHERE slug = 'batdeck'").get() as { id: string } | undefined;
  const alfred = db.prepare("SELECT id FROM projects WHERE slug = 'alfred'").get() as { id: string } | undefined;
  if (batdeck && alfred) {
    db.prepare(
      "INSERT OR IGNORE INTO relationships (id, source_id, target_id, kind, description) VALUES ('rel_batdeck_alfred', ?, ?, 'related', NULL)",
    ).run(batdeck.id, alfred.id);
  }

  for (const [slug, links] of Object.entries(missionLinks)) {
    const source = db.prepare("SELECT id FROM projects WHERE slug = ?").get(slug) as { id: string } | undefined;
    if (!source) continue;
    for (const [kind, values] of [
      ["blocked_by", links.blockedBy ?? []],
      ["waiting_for", links.waitingFor ?? []],
      ["unlocks", links.unlocks ?? []],
    ] as const) {
      values.forEach((description, index) => {
        db.prepare(
          "INSERT OR IGNORE INTO relationships (id, source_id, target_id, kind, description) VALUES (?, ?, NULL, ?, ?)",
        ).run(`rel_${slug}_${kind}_${index}`, source.id, kind, description);
      });
    }
  }

  const cospace = db.prepare("SELECT id FROM projects WHERE slug = 'cospace'").get() as { id: string } | undefined;
  if (cospace) {
    db.prepare("INSERT OR IGNORE INTO review_flags (id, project_id, message, created_at) VALUES (?, ?, ?, ?)").run(
      "flag-cospace-photon",
      cospace.id,
      "Catalog stack lists Photon Fusion. Later discussions described a different stack. Seed left the catalog value unchanged for owner review.",
      stamp,
    );
  }

  db.prepare("INSERT OR IGNORE INTO operator_meta (id, revision, updated_at) VALUES (1, 1, ?)").run(stamp);
}
