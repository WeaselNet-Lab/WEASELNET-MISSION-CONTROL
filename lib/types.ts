export type DepartmentId =
  | "command"
  | "vr-lab"
  | "flight-systems"
  | "robotics"
  | "benchmark-lab"
  | "hardware"
  | "living-art"
  | "experimental";

export type ProjectStatus =
  | "active"
  | "alpha"
  | "parked"
  | "concept"
  | "shipped";

export type PublishGate = {
  readme: boolean;
  screenshots: boolean;
  demo: boolean;
};

export type Project = {
  slug: string;
  name: string;
  callsign: string;
  department: DepartmentId;
  status: ProjectStatus;
  summary: string;
  brief: string;
  nextAction: string;
  successCriteria?: string;
  stack: string[];
  related: string[];
  updated: string;
  publish: PublishGate;
};

export type Department = {
  slug: DepartmentId;
  name: string;
  callsign: string;
  summary: string;
  mandate: string;
};

export type HardwareKind =
  | "workstation"
  | "gpu"
  | "network"
  | "hmd"
  | "policy";

export type HardwareAsset = {
  id: string;
  name: string;
  kind: HardwareKind;
  role: string;
  notes: string;
  count?: number;
  location?: string;
  assignment?: string;
  condition?: "installed" | "bench" | "spare" | "repair" | "unknown";
  confidence?: "confirmed" | "remembered";
  lastTested?: string;
};

export type Checkpoint = {
  slug: string;
  at: string;
  doing?: string;
  next?: string;
  blocker?: string;
  resumeLink?: string;
};

export type CaptureKind = "note" | "idea" | "decision" | "test" | "link" | "file";

export type CaptureItem = {
  id: string;
  kind: CaptureKind;
  title: string;
  body: string;
  source?: string;
  projectSlug?: string;
  createdAt: string;
  status: "inbox" | "filed" | "archived";
};

export type ActivityKind = "checkpoint" | "decision" | "test" | "discovery" | "failure" | "milestone" | "hardware" | "note";

export type ActivityEntry = {
  id: string;
  projectSlug: string;
  kind: ActivityKind;
  text: string;
  at: string;
};

export type EvidenceKind = "repository" | "readme" | "image" | "demo" | "test" | "diagram" | "document" | "command";

export type EvidenceItem = {
  id: string;
  projectSlug: string;
  kind: EvidenceKind;
  label: string;
  href?: string;
  note?: string;
  createdAt: string;
};

export type HardwareOverride = Partial<Pick<HardwareAsset, "location" | "assignment" | "condition" | "confidence" | "lastTested" | "notes">>;

export type OperatorState = {
  notes: Record<string, string>;
  publish: Record<string, Partial<PublishGate>>;
  pinned: string[];
  checkpoint: Checkpoint | null;
  captures: CaptureItem[];
  activity: ActivityEntry[];
  evidence: EvidenceItem[];
  hardware: Record<string, HardwareOverride>;
};
