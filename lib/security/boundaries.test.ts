import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";

import { provisionOwner, authenticateOwner, countSessions } from "@/lib/auth/account";
import { decideOwnerAccess, decideVisitorAccess } from "@/lib/auth/access-decision";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession, readSession, sessionAcceptsCsrf } from "@/lib/auth/session";
import { createBackup, restoreBackup } from "@/lib/backup/backup";
import { closeDatabase } from "@/lib/db/connection";
import { archiveProject, getOwnerProjectBySlug, restoreProject, updateProject } from "@/lib/db/projects";
import { ensureReady } from "@/lib/db/ready";
import { seedDatabase } from "@/lib/db/seed";
import { RevisionConflictError, ValidationError } from "@/lib/db/validate";
import { sameOrigin } from "@/lib/http/boundary";
import { pickDiscovery, pushTrail, trailBack, visibleLinks } from "@/lib/explore/trail";
import { commitExfil, parseExfil, previewExfil } from "@/lib/import/exfil";
import { loadOperatorState } from "@/lib/db/operator-store";
import { readVisitorSnapshot } from "@/lib/visitor/snapshot";
import { getDatabase } from "@/lib/db/connection";

const directory = fs.mkdtempSync(path.join(os.tmpdir(), "wn-security-"));
process.env.WEASELNET_DB_PATH = path.join(directory, "weaselnet.sqlite");

describe("secure data boundaries", () => {
  before(() => {
    closeDatabase();
    ensureReady();
    provisionOwner("owner-test", "synthetic-password");
  });

  after(() => {
    closeDatabase();
    try {
      fs.rmSync(directory, { recursive: true, force: true });
    } catch {
      // Windows can keep the SQLite handle briefly after close.
    }
  });

  it("rejects non-loopback and unauthenticated access, and requires CSRF on writes", () => {
    assert.equal(decideVisitorAccess("192.168.1.20").ok, false);
    assert.equal(decideOwnerAccess({
      host: "127.0.0.1:43147",
      method: "GET",
      origin: null,
      protocol: "http:",
      requestHost: "127.0.0.1:43147",
      hasSession: false,
      csrfOk: false,
    }).ok, false);
    const csrf = decideOwnerAccess({
      host: "127.0.0.1",
      method: "POST",
      origin: "http://127.0.0.1",
      protocol: "http:",
      requestHost: "127.0.0.1",
      hasSession: true,
      csrfOk: false,
    });
    assert.equal(csrf.ok, false);
    if (!csrf.ok) assert.equal(csrf.status, 403);
    const cross = decideOwnerAccess({
      host: "127.0.0.1",
      method: "POST",
      origin: "http://evil.example",
      protocol: "http:",
      requestHost: "127.0.0.1",
      hasSession: true,
      csrfOk: true,
    });
    assert.equal(cross.ok, false);
    assert.equal(decideOwnerAccess({
      host: "127.0.0.1",
      method: "POST",
      origin: "http://127.0.0.1",
      protocol: "http:",
      requestHost: "127.0.0.1",
      hasSession: true,
      csrfOk: true,
    }).ok, true);
    assert.equal(sameOrigin({
      origin: "http://127.0.0.1:43147",
      protocol: "http:",
      host: "127.0.0.1:43147",
    }), true);
    assert.equal(sameOrigin({
      origin: "http://127.0.0.1:43147",
      protocol: "http:",
      host: "localhost:43147",
    }), false);
    assert.equal(sameOrigin({
      origin: null,
      protocol: "http:",
      host: "127.0.0.1:43147",
    }), false);
  });

  it("hashes passwords, expires sessions, and rejects a bad CSRF token", () => {
    const stored = hashPassword("synthetic-password");
    assert.equal(verifyPassword("synthetic-password", stored), true);
    assert.equal(verifyPassword("wrong-password-value", stored), false);
    assert.equal(authenticateOwner("owner-test", "synthetic-password"), true);
    assert.equal(authenticateOwner("owner-test", "not-the-password"), false);
    assert.equal(authenticateOwner("someone-else", "synthetic-password"), false);
    const session = createSession();
    assert.ok(readSession(session.token));
    assert.equal(sessionAcceptsCsrf(session.token, session.csrf), true);
    assert.equal(sessionAcceptsCsrf(session.token, "not-the-csrf-token-value"), false);
    destroySession(session.token);
    assert.equal(readSession(session.token), null);
    const expired = createSession();
    getDatabase().prepare("UPDATE sessions SET expires_at = ?").run("2000-01-01T00:00:00.000Z");
    assert.equal(readSession(expired.token), null);
    assert.equal(sessionAcceptsCsrf(expired.token, expired.csrf), false);
    createSession();
    assert.ok(countSessions() >= 1);
    assert.throws(() => provisionOwner("owner-test", "another-password-value"), ValidationError);
    assert.throws(() => provisionOwner("owner-test", "short", true), /12 and 1024/);
    provisionOwner("owner-test", "rotated-password-value", true);
    assert.equal(authenticateOwner("owner-test", "synthetic-password"), false);
    assert.equal(authenticateOwner("owner-test", "rotated-password-value"), true);
    assert.equal(countSessions(), 0);
  });

  it("keeps private operator fields out of the visitor snapshot", () => {
    const alfred = getOwnerProjectBySlug("alfred");
    assert.ok(alfred);
    assert.match(alfred.brief, /weseals-01/);
    const snapshot = readVisitorSnapshot();
    const blob = JSON.stringify(snapshot);
    assert.equal(blob.includes("weseals"), false);
    assert.equal(blob.includes("/home/"), false);
    assert.equal(blob.includes(alfred.brief), false);
    assert.equal(snapshot.cards.length, 4);
    assert.deepEqual(
      snapshot.cards.map((card) => card.motif),
      ["Al.", "Life_", "Here²", ">_"],
    );
    assert.ok(snapshot.notes.some((note) => note.slug === "underneath"));
    assert.ok(snapshot.discovery.includes("oracle"));
    assert.equal(snapshotLeaks(snapshot.notes, "nextAction"), false);
  });

  it("does not let a repeated seed erase an owner edit", () => {
    const before = getOwnerProjectBySlug("alfred");
    assert.ok(before);
    updateProject("alfred", before.revision, projectInput(before, { name: "Alfred renamed" }));
    seedDatabase(getDatabase());
    const after = getOwnerProjectBySlug("alfred");
    assert.equal(after?.name, "Alfred renamed");
    assert.notEqual(after?.revision, before.revision);
  });

  it("rejects a stale revision and archives without deleting", () => {
    const current = getOwnerProjectBySlug("batdeck");
    assert.ok(current);
    assert.throws(
      () => updateProject("batdeck", current.revision - 1 || 99, projectInput(current, { summary: "nope" })),
      RevisionConflictError,
    );
    archiveProject("batdeck");
    const archived = getOwnerProjectBySlug("batdeck");
    assert.equal(archived?.archiveState, "archived");
    assert.equal(readVisitorSnapshot().cards.some((card) => card.slug === "batdeck"), false);
    restoreProject("batdeck");
    assert.equal(readVisitorSnapshot().cards.some((card) => card.slug === "batdeck"), true);
  });

  it("imports fixtures once, holds unknown slugs, preserves conflicts, and rolls back", () => {
    const raw = JSON.stringify({
      schema: "weaselnet-operator-v2",
      data: {
        notes: { alfred: "synthetic note" },
        publish: {},
        pinned: [],
        checkpoint: null,
        captures: [
          {
            id: "cap-1",
            kind: "note",
            title: "Synthetic",
            body: "Fixture only",
            projectSlug: "alfred",
            createdAt: "2026-01-01T00:00:00.000Z",
            status: "filed",
          },
          {
            id: "cap-unknown",
            kind: "note",
            title: "Hold me",
            body: "Unknown target",
            projectSlug: "not-a-project",
            createdAt: "2026-01-01T00:00:00.000Z",
            status: "inbox",
          },
        ],
        activity: [],
        evidence: [],
        hardware: {},
      },
    });
    const preview = previewExfil(raw);
    assert.equal(preview.unknownSlugs.includes("not-a-project"), true);
    const first = commitExfil(raw);
    assert.equal(first.duplicateFile, false);
    assert.equal(first.inserted > 0, true);
    const second = commitExfil(raw);
    assert.equal(second.duplicateFile, true);
    const changed = raw.replace("Synthetic", "Changed");
    const conflict = previewExfil(changed);
    assert.equal(conflict.conflicts.some((item) => item.id === "cap-1"), true);
    commitExfil(changed);
    const kept = loadOperatorState().state.captures.find((item) => item.id === "cap-1");
    assert.equal(kept?.title, "Synthetic");
    assert.equal(loadOperatorState().state.captures.some((item) => item.id === "cap-unknown"), false);
    assert.throws(() => parseExfil(JSON.stringify({ schema: "other", data: {} })));
    const before = loadOperatorState().state.captures.length;
    const extra = JSON.stringify({
      schema: "weaselnet-operator-v2",
      data: {
        notes: {},
        publish: {},
        pinned: ["alfred"],
        checkpoint: null,
        captures: [],
        activity: [],
        evidence: [],
        hardware: {},
      },
    });
    assert.throws(() => commitExfil(extra, {}, { failAfter: 1 }));
    assert.equal(loadOperatorState().state.captures.length, before);
    assert.equal(loadOperatorState().state.pinned.includes("alfred"), false);
  });

  it("restores a backup over a later synthetic change", () => {
    const file = createBackup();
    const alfred = getOwnerProjectBySlug("alfred");
    assert.ok(alfred);
    updateProject("alfred", alfred.revision, projectInput(alfred, { summary: "changed after backup" }));
    restoreBackup(path.basename(file));
    ensureReady();
    assert.equal(getOwnerProjectBySlug("alfred")?.summary.includes("changed after backup"), false);
    assert.throws(() => restoreBackup("../outside.sqlite"));
  });
});

describe("rabbit hole trail", () => {
  it("bounds history, returns by breadcrumb, and hides broken targets", () => {
    let history: string[] = [];
    for (let index = 0; index < 30; index += 1) history = pushTrail(history, `n${index}`);
    assert.equal(history.length, 24);
    history = trailBack(history, 2);
    assert.equal(history.length, 3);
    const links = visibleLinks(
      [
        { targetSlug: "oracle", label: "Oracle" },
        { targetSlug: "missing", label: "Missing" },
      ],
      new Set(["oracle"]),
    );
    assert.deepEqual(links.map((link) => link.targetSlug), ["oracle"]);
    assert.equal(pickDiscovery(["oracle"], "oracle"), "oracle");
    assert.notEqual(pickDiscovery(["oracle", "presence"], "oracle", () => 0), undefined);
  });
});

function snapshotLeaks(notes: { lead: string }[], marker: string) {
  return JSON.stringify(notes).includes(marker);
}

function projectInput(
  project: NonNullable<ReturnType<typeof getOwnerProjectBySlug>>,
  patch: Partial<{ name: string; summary: string }>,
) {
  if (!project.showcase || !project.note) throw new Error("expected showcase");
  return {
    name: patch.name ?? project.name,
    slug: project.slug,
    callsign: project.callsign,
    department: project.department,
    status: project.status,
    summary: patch.summary ?? project.summary,
    brief: project.brief,
    nextAction: project.nextAction,
    successCriteria: project.successCriteria ?? null,
    stack: project.stack,
    related: project.related,
    waitingFor: project.waitingFor,
    blockedBy: project.blockedBy,
    unlocks: project.unlocks,
    showcase: project.showcase,
    note: project.note,
  };
}
