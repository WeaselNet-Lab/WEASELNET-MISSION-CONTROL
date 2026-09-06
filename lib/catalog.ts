import { departmentName } from "@/lib/departments";
import { projects } from "@/lib/projects";
import type { OperatorState, Project, ProjectStatus, PublishGate } from "@/lib/types";

export const statusOrder: ProjectStatus[] = [
  "active",
  "alpha",
  "concept",
  "parked",
  "shipped",
];

export function mergePublish(
  project: Project,
  overrides: OperatorState["publish"],
): PublishGate {
  return {
    ...project.publish,
    ...overrides[project.slug],
  };
}

export function publishScore(gate: PublishGate): number {
  return Number(gate.readme) + Number(gate.screenshots) + Number(gate.demo);
}

export function isPublishClear(gate: PublishGate): boolean {
  return publishScore(gate) === 3;
}

export function formatUpdated(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function searchProjects(query: string, list: Project[] = projects): Project[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return list;
  return list.filter((project) => {
    const haystack = [
      project.name,
      project.callsign,
      project.summary,
      project.brief,
      project.department,
      departmentName(project.department),
      ...project.stack,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });
}

export function attentionQueue(
  state: Pick<OperatorState, "publish" | "pinned">,
  list: Project[] = projects,
): Project[] {
  return [...list]
    .map((project) => {
      const gate = mergePublish(project, state.publish);
      const missing = 3 - publishScore(gate);
      const live = project.status === "active" || project.status === "alpha";
      const pinned = state.pinned.includes(project.slug) ? 8 : 0;
      const weight =
        pinned +
        missing * 4 +
        (live ? 3 : 0) +
        (project.status === "shipped" && missing > 0 ? 5 : 0) -
        (project.status === "parked" ? 2 : 0);
      return { project, weight, missing };
    })
    .filter((item) => item.missing > 0 || item.project.status === "active")
    .sort((a, b) => b.weight - a.weight)
    .map((item) => item.project);
}

export function boardStats(state: Pick<OperatorState, "publish">) {
  const gates = projects.map((project) => mergePublish(project, state.publish));
  return {
    total: projects.length,
    live: projects.filter((project) => project.status === "active" || project.status === "alpha")
      .length,
    unpublished: gates.filter((gate) => !isPublishClear(gate)).length,
    shipped: projects.filter((project) => project.status === "shipped").length,
  };
}

export const constellations = [
  {
    name: "Daughter games",
    detail: "CoSpace is the spine. Anky Island is the laugh test. Meshy keeps the island from becoming a graybox forever.",
    slugs: ["cospace", "anky-island", "meshy-pipeline"],
  },
  {
    name: "Command circuit",
    detail: "Alfred thinks. Mission Control remembers. Preflight tells you if the night is even allowed to start.",
    slugs: ["alfred", "mission-control", "preflight"],
  },
  {
    name: "Clean flight path",
    detail: "The sim rig, the measured 5 GHz hop, and the lab that refuses vibes-as-telemetry.",
    slugs: ["vr-flight-lab", "hardware-bay", "bats"],
  },
  {
    name: "Walking studio",
    detail: "One honest leg, then a chassis, then a mind. Alfred speaks names. Teensy keeps the joints polite.",
    slugs: ["fury-twins", "alfred", "autonomous-drone"],
  },
];
