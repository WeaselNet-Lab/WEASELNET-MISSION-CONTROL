export type {
  Recording,
  RecordingStatus,
  WorkspaceConfig,
  WorkspaceContext,
  WorkspaceId,
  WorkspaceModuleId,
  WorkspaceNavItem,
  WorkspaceRole,
  WorkspaceSubject,
} from "@/lib/workspaces/types";
export {
  OPERATOR_MODULE_IDS,
  STUDENT_MODULE_IDS,
} from "@/lib/workspaces/types";
export {
  getWorkspaceConfig,
  getWorkspaceNav,
  isModuleEnabled,
  listPreviewWorkspaces,
  workspaceConfigs,
  workspaceIds,
} from "@/lib/workspaces/fixtures";
export {
  developmentPreviewDenialReason,
  hostnameFromHost,
  isDevelopmentPreviewAllowed,
  type PreviewAccessInput,
} from "@/lib/workspaces/access";
export {
  ASK_ALFRED_PREVIEW,
  DEV_PREVIEW_PROXY_MATCHER,
  OPERATOR_SHELL_NAV,
  askAlfredPreviewAllowsAction,
  isDevPreviewProxyPath,
  isWorkspacePreviewPath,
  previewWorkspaceId,
  recordingArtifactLabel,
  resolveShellNav,
  shouldMountOperatorProvider,
  shouldShowOperatorControls,
} from "@/lib/workspaces/shell";
