import type { Department, DepartmentId, HardwareAsset, Project } from "@/lib/types";

export type OwnerCatalog = {
  projects: Project[];
  departments: Department[];
  hardware: HardwareAsset[];
  hardwareKinds: { id: HardwareAsset["kind"]; label: string }[];
  missionLinks: Record<string, { blockedBy?: string[]; waitingFor?: string[]; unlocks?: string[] }>;
  constellations: { name: string; detail: string; slugs: string[] }[];
};

export type DepartmentSlug = DepartmentId;
