import type {
  WorkspaceConfig,
  WorkspaceId,
  WorkspaceModuleId,
  WorkspaceNavItem,
} from "@/lib/workspaces/types";
import {
  OPERATOR_MODULE_IDS,
  STUDENT_MODULE_IDS,
} from "@/lib/workspaces/types";

/**
 * Fictional fixtures only. No real names, school recordings, or credentials.
 */
export const workspaceConfigs: Record<WorkspaceId, WorkspaceConfig> = {
  "operator-josh": {
    id: "operator-josh",
    displayName: "Operator Josh",
    ownerId: "owner-operator-josh",
    role: "operator",
    tagline: "Existing Mission Control ops board — preserved as the operator home.",
    homePath: "/",
    enabledModules: [...OPERATOR_MODULE_IDS],
    subjects: [],
    recordings: [],
  },
  "student-alpha": {
    id: "student-alpha",
    displayName: "Student Alpha",
    ownerId: "owner-student-alpha",
    role: "student",
    tagline: "Shared student dashboard preview — recordings, subjects, Ask Alfred.",
    homePath: "/dev/workspaces/student-alpha",
    enabledModules: [...STUDENT_MODULE_IDS],
    subjects: [
      {
        id: "subject-alpha-orbit",
        title: "Orbit Lab (preview)",
        summary: "Fictional subject slot for dashboard layout checks.",
      },
      {
        id: "subject-alpha-signals",
        title: "Signal Notes (preview)",
        summary: "Empty of real coursework. Configuration differencing only.",
      },
    ],
    recordings: [
      {
        id: "rec-alfred-ingest-test-01",
        ownerId: "owner-student-alpha",
        filename: "alfred-ingest-test-01.mkv",
        status: "received",
        createdAt: "2026-09-06T12:00:00.000Z",
        durationSeconds: 20,
        note: "Mock metadata only. Not a video artifact and not ingest proof.",
        artifactPresent: false,
      },
    ],
  },
  "student-bravo": {
    id: "student-bravo",
    displayName: "Student Bravo",
    ownerId: "owner-student-bravo",
    role: "student",
    tagline: "Same student components, distinct configuration and empty recordings.",
    homePath: "/dev/workspaces/student-bravo",
    enabledModules: [...STUDENT_MODULE_IDS],
    subjects: [
      {
        id: "subject-bravo-workshop",
        title: "Workshop Bench (preview)",
        summary: "Fictional subject used to prove config isolation in the UI.",
      },
    ],
    recordings: [],
  },
};

export const workspaceIds = Object.keys(workspaceConfigs) as WorkspaceId[];

export function getWorkspaceConfig(id: string): WorkspaceConfig | undefined {
  if (id in workspaceConfigs) {
    return workspaceConfigs[id as WorkspaceId];
  }
  return undefined;
}

export function isModuleEnabled(
  config: WorkspaceConfig,
  moduleId: WorkspaceModuleId,
): boolean {
  return config.enabledModules.includes(moduleId);
}

const operatorNav: WorkspaceNavItem[] = [
  { moduleId: "ops", label: "Ops", href: "/" },
  { moduleId: "projects", label: "Projects", href: "/projects" },
  { moduleId: "drop", label: "Drop", href: "/drop" },
  { moduleId: "labs", label: "Labs", href: "/departments" },
  { moduleId: "publish", label: "Publish", href: "/publish" },
  { moduleId: "bay", label: "Bay", href: "/hardware" },
  { moduleId: "tools", label: "Tools", href: "/tools" },
  { moduleId: "exfil", label: "Exfil", href: "/exfil" },
];

export function getWorkspaceNav(config: WorkspaceConfig): WorkspaceNavItem[] {
  if (config.role === "operator") {
    return operatorNav.filter((item) => isModuleEnabled(config, item.moduleId));
  }

  const studentNav: WorkspaceNavItem[] = [
    {
      moduleId: "recordings",
      label: "Recordings",
      href: `${config.homePath}#recordings`,
    },
    {
      moduleId: "subjects",
      label: "Subjects",
      href: `${config.homePath}#subjects`,
    },
    {
      moduleId: "ask-alfred",
      label: "Ask Alfred",
      href: `${config.homePath}#ask-alfred`,
    },
  ];

  return studentNav.filter((item) => isModuleEnabled(config, item.moduleId));
}

export function listPreviewWorkspaces(): WorkspaceConfig[] {
  return workspaceIds.map((id) => workspaceConfigs[id]);
}
