import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { audit, getDatabase, nowIso } from "@/lib/db/connection";

export const SESSION_COOKIE = "wn_session";
export const CSRF_COOKIE = "wn_csrf";
export const SESSION_TTL_SECONDS = 60 * 60 * 12;

export type SessionRecord = {
  id: string;
  expiresAt: string;
};

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function tokensMatch(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function createSession(): { token: string; csrf: string; expiresAt: string } {
  const db = getDatabase();
  const token = randomBytes(32).toString("base64url");
  const csrf = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  const id = crypto.randomUUID();
  db.prepare(
    "INSERT INTO sessions (id, token_hash, csrf_hash, created_at, expires_at) VALUES (?, ?, ?, ?, ?)",
  ).run(id, hashToken(token), hashToken(csrf), nowIso(), expires.toISOString());
  return { token, csrf, expiresAt: expires.toISOString() };
}

export function readSession(token: string | null | undefined): SessionRecord | null {
  if (!token) return null;
  const db = getDatabase();
  const row = db
    .prepare("SELECT id, expires_at FROM sessions WHERE token_hash = ?")
    .get(hashToken(token)) as { id: string; expires_at: string } | undefined;
  if (!row) return null;
  if (Date.parse(row.expires_at) <= Date.now()) {
    db.prepare("DELETE FROM sessions WHERE id = ?").run(row.id);
    audit(db, "session.expire", "session", row.id, "expired");
    return null;
  }
  return { id: row.id, expiresAt: row.expires_at };
}

export function sessionAcceptsCsrf(token: string, csrf: string): boolean {
  const db = getDatabase();
  const row = db
    .prepare("SELECT csrf_hash, expires_at FROM sessions WHERE token_hash = ?")
    .get(hashToken(token)) as { csrf_hash: string; expires_at: string } | undefined;
  if (!row) return false;
  if (Date.parse(row.expires_at) <= Date.now()) return false;
  return tokensMatch(row.csrf_hash, hashToken(csrf));
}

export function destroySession(token: string | null | undefined): void {
  if (!token) return;
  const db = getDatabase();
  const row = db.prepare("SELECT id FROM sessions WHERE token_hash = ?").get(hashToken(token)) as
    | { id: string }
    | undefined;
  if (!row) return;
  db.prepare("DELETE FROM sessions WHERE id = ?").run(row.id);
  audit(db, "session.logout", "session", row.id, "ok");
}

export function purgeExpiredSessions(now = Date.now()): number {
  const db = getDatabase();
  const rows = db.prepare("SELECT id, expires_at FROM sessions").all() as {
    id: string;
    expires_at: string;
  }[];
  let removed = 0;
  for (const row of rows) {
    if (Date.parse(row.expires_at) <= now) {
      db.prepare("DELETE FROM sessions WHERE id = ?").run(row.id);
      removed += 1;
    }
  }
  return removed;
}
