import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import { MIGRATION_V1 } from "@/lib/db/schema";

let current: DatabaseSync | null = null;
let currentPath: string | null = null;

export function databasePath(): string {
  if (process.env.WEASELNET_DB_PATH) return process.env.WEASELNET_DB_PATH;
  return path.join(process.cwd(), "data", "weaselnet.sqlite");
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function closeDatabase(): void {
  current?.close();
  current = null;
  currentPath = null;
}

function migrate(db: DatabaseSync): void {
  db.exec("PRAGMA foreign_keys = ON");
  const existing = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'schema_migrations'")
    .get() as { name: string } | undefined;
  if (!existing) {
    db.exec(MIGRATION_V1);
    db.prepare("INSERT INTO schema_migrations (version, applied_at) VALUES (1, ?)").run(nowIso());
    return;
  }
  const row = db.prepare("SELECT version FROM schema_migrations WHERE version = 1").get() as
    | { version: number }
    | undefined;
  if (!row) {
    db.exec("BEGIN IMMEDIATE");
    try {
      db.exec(MIGRATION_V1);
      db.prepare("INSERT INTO schema_migrations (version, applied_at) VALUES (1, ?)").run(nowIso());
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
}

export function getDatabase(): DatabaseSync {
  const target = databasePath();
  if (current && currentPath === target) return current;
  closeDatabase();
  if (target !== ":memory:") {
    fs.mkdirSync(path.dirname(target), { recursive: true });
  }
  const db = new DatabaseSync(target);
  db.exec("PRAGMA foreign_keys = ON");
  if (target !== ":memory:") db.exec("PRAGMA journal_mode = WAL");
  migrate(db);
  current = db;
  currentPath = target;
  return db;
}

export function transaction<T>(work: (db: DatabaseSync) => T): T {
  const db = getDatabase();
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = work(db);
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function audit(
  db: DatabaseSync,
  action: string,
  subjectType: string,
  subjectId: string,
  result: string,
): void {
  db.prepare(
    "INSERT INTO audit_log (id, at, action, subject_type, subject_id, result) VALUES (?, ?, ?, ?, ?, ?)",
  ).run(crypto.randomUUID(), nowIso(), action, subjectType, subjectId, result.slice(0, 180));
}
