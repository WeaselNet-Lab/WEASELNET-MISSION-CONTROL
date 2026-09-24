import fs from "node:fs";
import path from "node:path";
import { backup, DatabaseSync } from "node:sqlite";

import { audit, closeDatabase, databasePath, getDatabase } from "@/lib/db/connection";
import { ValidationError } from "@/lib/db/validate";

export function backupDirectory(): string {
  return path.join(path.dirname(databasePath()), "backups");
}

export function createBackup(): string {
  const directory = backupDirectory();
  fs.mkdirSync(directory, { recursive: true });
  const stamp = new Date().toISOString().replaceAll(":", "").replaceAll(".", "");
  const destination = path.join(directory, `weaselnet-${stamp}.sqlite`);
  const db = getDatabase();
  backup(db as unknown as DatabaseSync, destination);
  audit(db, "backup.create", "backup", path.basename(destination), "ok");
  return destination;
}

export function restoreBackup(fileName: string): void {
  const directory = backupDirectory();
  const resolved = path.resolve(directory, fileName);
  const root = path.resolve(directory);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new ValidationError("Backup path is outside the backup directory.");
  }
  if (!fs.existsSync(resolved)) throw new ValidationError("Backup file was not found.");
  const live = getDatabase();
  live.exec("PRAGMA wal_checkpoint(TRUNCATE)");
  live.exec("PRAGMA journal_mode = DELETE");
  closeDatabase();
  const target = databasePath();
  fs.copyFileSync(resolved, target);
  for (const suffix of ["-wal", "-shm"]) {
    const sidecar = `${target}${suffix}`;
    if (!fs.existsSync(/* turbopackIgnore: true */ sidecar)) continue;
    try {
      fs.rmSync(sidecar);
    } catch {
      throw new ValidationError("The database file is still in use. Close other connections and retry the restore.");
    }
  }
  const db = getDatabase();
  audit(db, "backup.restore", "backup", path.basename(resolved), "ok");
}
