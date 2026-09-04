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
};

export type Checkpoint = {
  slug: string;
  at: string;
};

export type OperatorState = {
  notes: Record<string, string>;
  publish: Record<string, Partial<PublishGate>>;
  pinned: string[];
  checkpoint: Checkpoint | null;
};
