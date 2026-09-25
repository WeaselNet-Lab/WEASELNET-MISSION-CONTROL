import type { DatabaseSync } from "node:sqlite";

import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { audit, getDatabase, nowIso } from "@/lib/db/connection";
import { ValidationError } from "@/lib/db/validate";

export function ownerExists(): boolean {
  const row = getDatabase().prepare("SELECT id FROM owner_account WHERE id = 1").get();
  return Boolean(row);
}

export function ownerUsername(): string | null {
  const row = getDatabase().prepare("SELECT username FROM owner_account WHERE id = 1").get() as
    | { username: string }
    | undefined;
  return row?.username ?? null;
}

export function provisionOwner(username: string, password: string, rotate = false): void {
  const normalized = username.trim();
  if (!/^[A-Za-z0-9._-]{1,64}$/.test(normalized)) {
    throw new ValidationError("Username must be 1-64 letters, numbers, dots, underscores, or hyphens.");
  }
  const db = getDatabase();
  const existing = db.prepare("SELECT id FROM owner_account WHERE id = 1").get();
  if (existing && !rotate) {
    throw new ValidationError("An owner account already exists. Refusing to replace it.");
  }
  const passwordHash = hashPassword(password);
  if (existing && rotate) {
    db.prepare("UPDATE owner_account SET username = ?, password_hash = ? WHERE id = 1").run(
      normalized,
      passwordHash,
    );
    db.prepare("DELETE FROM sessions").run();
    audit(db, "owner.rotate", "owner", "1", "ok");
    return;
  }
  db.prepare(
    "INSERT INTO owner_account (id, username, password_hash, created_at) VALUES (1, ?, ?, ?)",
  ).run(normalized, passwordHash, nowIso());
  audit(db, "owner.provision", "owner", "1", "ok");
}

export function authenticateOwner(username: string, password: string): boolean {
  const db = getDatabase();
  const row = db.prepare("SELECT username, password_hash FROM owner_account WHERE id = 1").get() as
    | { username: string; password_hash: string }
    | undefined;
  if (!row) {
    hashPasswordSafe(password);
    return false;
  }
  const passwordOk = verifyPassword(password, row.password_hash);
  return passwordOk && row.username === username.trim();
}

function hashPasswordSafe(password: string): void {
  const probe = password.length >= 12 ? password : `${password}____________`;
  try {
    hashPassword(probe.slice(0, 1024));
  } catch {
    hashPassword("placeholder-password");
  }
}

export function countSessions(db: DatabaseSync = getDatabase()): number {
  const row = db.prepare("SELECT COUNT(*) AS count FROM sessions").get() as { count: number };
  return row.count;
}
