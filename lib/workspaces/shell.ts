import type { WorkspaceNavItem } from "@/lib/workspaces/types";
import { getWorkspaceConfig, getWorkspaceNav } from "@/lib/workspaces/fixtures";

/** Next.js proxy matcher covering the development preview route tree. */
export const DEV_PREVIEW_PROXY_MATCHER = ["/dev/:path*"] as const;

export const OPERATOR_SHELL_NAV: { href: string; label: string }[] = [
  { href: "/", label: "Ops" },
  { href: "/projects", label: "Projects" },
  { href: "/drop", label: "Drop" },
  { href: "/departments", label: "Labs" },
  { href: "/publish", label: "Publish" },
  { href: "/hardware", label: "Bay" },
  { href: "/tools", label: "Tools" },
  { href: "/exfil", label: "Exfil" },
];

const PREVIEW_INDEX_NAV: { href: string; label: string }[] = [
  { href: "/dev/workspaces", label: "Previews" },
  { href: "/", label: "Ops" },
];

/** Ask Alfred preview controls: visible but inert. */
export const ASK_ALFRED_PREVIEW = {
  enabled: false,
  network: false,
  persistence: false,
  mutation: false,
} as const;

export function isWorkspacePreviewPath(pathname: string): boolean {
  return (
    pathname === "/dev/workspaces" || pathname.startsWith("/dev/workspaces/")
  );
}

export function previewWorkspaceId(pathname: string): string | null {
  if (!isWorkspacePreviewPath(pathname)) return null;
  const parts = pathname.split("/").filter(Boolean);
  return parts[2] ?? null;
}

/** Josh operator tools and OperatorProvider stay off all preview paths. */
export function shouldShowOperatorControls(pathname: string): boolean {
  return !isWorkspacePreviewPath(pathname);
}

export function shouldMountOperatorProvider(pathname: string): boolean {
  return !isWorkspacePreviewPath(pathname);
}

export function resolveShellNav(
  pathname: string,
): { href: string; label: string }[] {
  if (!isWorkspacePreviewPath(pathname)) {
    return OPERATOR_SHELL_NAV;
  }

  const id = previewWorkspaceId(pathname);
  const config = id ? getWorkspaceConfig(id) : undefined;
  if (config?.role === "student") {
    return getWorkspaceNav(config).map((item: WorkspaceNavItem) => ({
      href: item.href,
      label: item.label,
    }));
  }

  return PREVIEW_INDEX_NAV;
}

/** Pathnames the proxy matcher is intended to cover. */
export function isDevPreviewProxyPath(pathname: string): boolean {
  return pathname === "/dev" || pathname.startsWith("/dev/");
}

export function askAlfredPreviewAllowsAction(): boolean {
  return ASK_ALFRED_PREVIEW.enabled;
}

export function recordingArtifactLabel(artifactPresent: boolean): string {
  return artifactPresent
    ? "Artifact present: yes"
    : "Artifact present: no · not ingest proof";
}
