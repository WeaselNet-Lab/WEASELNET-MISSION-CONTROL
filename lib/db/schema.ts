export const MIGRATION_V1 = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS owner_account (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  csrf_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  callsign TEXT NOT NULL,
  department TEXT NOT NULL,
  status TEXT NOT NULL,
  summary TEXT NOT NULL,
  brief TEXT NOT NULL,
  next_action TEXT NOT NULL,
  success_criteria TEXT,
  stack_json TEXT NOT NULL,
  publish_json TEXT NOT NULL,
  archive_state TEXT NOT NULL DEFAULT 'active',
  source_updated TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS showcase_entries (
  project_id TEXT PRIMARY KEY REFERENCES projects(id),
  visitor_title TEXT NOT NULL,
  motif TEXT NOT NULL,
  teaser TEXT NOT NULL,
  category TEXT NOT NULL,
  number_label TEXT NOT NULL,
  glyph TEXT NOT NULL,
  explore_label TEXT NOT NULL,
  note_slug TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'draft',
  approved_snapshot_json TEXT,
  approved_revision INTEGER,
  revision INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  lead TEXT NOT NULL,
  blocks_json TEXT NOT NULL,
  aside TEXT NOT NULL,
  surface TEXT NOT NULL,
  discovery INTEGER NOT NULL DEFAULT 0,
  display_order INTEGER NOT NULL,
  thread_tags TEXT,
  thread_title TEXT,
  thread_detail TEXT,
  thread_num TEXT,
  visibility TEXT NOT NULL DEFAULT 'draft',
  approved_snapshot_json TEXT,
  revision INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS note_links (
  note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  target_slug TEXT NOT NULL,
  label TEXT NOT NULL,
  PRIMARY KEY (note_id, position)
);

CREATE TABLE IF NOT EXISTS note_projects (
  note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES projects(id),
  PRIMARY KEY (note_id, project_id)
);

CREATE TABLE IF NOT EXISTS relationships (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES projects(id),
  target_id TEXT REFERENCES projects(id),
  kind TEXT NOT NULL,
  description TEXT,
  UNIQUE (source_id, target_id, kind, description)
);

CREATE TABLE IF NOT EXISTS review_flags (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  message TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS operator_meta (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  revision INTEGER NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS operator_notes (
  project_slug TEXT PRIMARY KEY,
  body TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS operator_publish (
  project_slug TEXT PRIMARY KEY,
  readme INTEGER NOT NULL,
  screenshots INTEGER NOT NULL,
  demo INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS operator_pins (
  project_slug TEXT PRIMARY KEY,
  position INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS operator_checkpoint (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  project_slug TEXT NOT NULL,
  at TEXT NOT NULL,
  doing TEXT,
  next_action TEXT,
  blocker TEXT,
  resume_link TEXT
);

CREATE TABLE IF NOT EXISTS captures (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  source TEXT,
  project_slug TEXT,
  created_at TEXT NOT NULL,
  status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS activity (
  id TEXT PRIMARY KEY,
  project_slug TEXT NOT NULL,
  kind TEXT NOT NULL,
  text TEXT NOT NULL,
  at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS evidence (
  id TEXT PRIMARY KEY,
  project_slug TEXT NOT NULL,
  kind TEXT NOT NULL,
  label TEXT NOT NULL,
  href TEXT,
  note TEXT,
  audience TEXT NOT NULL DEFAULT 'owner',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS hardware_overrides (
  asset_id TEXT PRIMARY KEY,
  patch_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS import_batches (
  id TEXT PRIMARY KEY,
  source_hash TEXT NOT NULL UNIQUE,
  schema_name TEXT NOT NULL,
  imported_at TEXT NOT NULL,
  result TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS import_holds (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL,
  record_type TEXT NOT NULL,
  record_json TEXT NOT NULL,
  reason TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  at TEXT NOT NULL,
  action TEXT NOT NULL,
  subject_type TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  result TEXT NOT NULL
);
`;
