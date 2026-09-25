import { getDatabase } from "@/lib/db/connection";
import { seedDatabase } from "@/lib/db/seed";

export function ensureReady() {
  const db = getDatabase();
  if (process.env.WEASELNET_SKIP_SEED !== "1") seedDatabase(db);
  return db;
}
