import type { Department, OperatorState, Project, ProjectStatus, PublishGate } from "@/lib/types";

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
  const date = new Date(`${iso.slice(0, 10)}T00:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function departmentLabel(departments: Department[], slug: string): string {
  return departments.find((department) => department.slug === slug)?.name ?? slug;
}

export function searchProjects(query: string, list: Project[], departments: Department[]): Project[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return list;
  return list.filter((project) => {
    const haystack = [
      project.name,
      project.callsign,
      project.summary,
      project.brief,
      project.department,
      departmentLabel(departments, project.department),
      ...project.stack,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });
}

export function attentionQueue(
  state: Pick<OperatorState, "publish" | "pinned">,
  list: Project[],
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

export function boardStats(state: Pick<OperatorState, "publish">, list: Project[]) {
  const gates = list.map((project) => mergePublish(project, state.publish));
  return {
    total: list.length,
    live: list.filter((project) => project.status === "active" || project.status === "alpha").length,
    unpublished: gates.filter((gate) => !isPublishClear(gate)).length,
    shipped: list.filter((project) => project.status === "shipped").length,
  };
}
