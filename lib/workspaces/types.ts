/**
 * Shared workspace contracts (Phase 0 freeze).
 * WorkspaceConfig is UI configuration only — not a security policy.
 */

export type WorkspaceId = "operator-josh" | "student-alpha" | "student-bravo";

export type WorkspaceRole = "operator" | "student";

/** Modules that a workspace UI may enable. Operator modules map to existing Josh routes. */
export type WorkspaceModuleId =
  | "ops"
  | "projects"
  | "drop"
  | "labs"
  | "publish"
  | "bay"
  | "tools"
  | "exfil"
  | "recordings"
  | "subjects"
  | "ask-alfred";

export type RecordingStatus =
  | "received"
  | "queued"
  | "processing"
  | "ready"
  | "failed";

export type WorkspaceSubject = {
  id: string;
  title: string;
  summary: string;
};

/**
 * Owner-scoped recording metadata. Never treat this as proof of a real file or ingest.
 */
export type Recording = {
  id: string;
  ownerId: string;
  filename: string;
  status: RecordingStatus;
  createdAt: string;
  durationSeconds?: number;
  note?: string;
  /** Always false in Phase 1 fixtures — metadata only. */
  artifactPresent: false;
};

export type WorkspaceNavItem = {
  moduleId: WorkspaceModuleId;
  label: string;
  href: string;
};

export type WorkspaceConfig = {
  id: WorkspaceId;
  /** Fictional display label for fixtures / previews. */
  displayName: string;
  /** Stable fictional owner key; later bound only to server identity. */
  ownerId: string;
  role: WorkspaceRole;
  tagline: string;
  homePath: string;
  enabledModules: WorkspaceModuleId[];
  subjects: WorkspaceSubject[];
  recordings: Recording[];
};

/**
 * Authorized workspace view once real auth exists.
 * Phase 1 development previews never set mode to "authenticated".
 */
export type WorkspaceContext = {
  workspaceId: WorkspaceId;
  ownerId: string;
  role: WorkspaceRole;
  mode: "development-preview" | "authenticated";
  /** Server-derived authorization. Always false until Phase 2 auth. */
  authorized: boolean;
};

export const STUDENT_MODULE_IDS: WorkspaceModuleId[] = [
  "recordings",
  "subjects",
  "ask-alfred",
];

export const OPERATOR_MODULE_IDS: WorkspaceModuleId[] = [
  "ops",
  "projects",
  "drop",
  "labs",
  "publish",
  "bay",
  "tools",
  "exfil",
];
