import { cookies, headers } from "next/headers";

import { CSRF_COOKIE, readSession, SESSION_COOKIE } from "@/lib/auth/session";
import { departments } from "@/lib/departments";
import { hardwareAssets, hardwareKinds } from "@/lib/hardware";
import { loopbackAllowed } from "@/lib/http/boundary";
import { listOwnerProjects } from "@/lib/db/projects";
import { loadOperatorState } from "@/lib/db/operator-store";
import { ensureReady } from "@/lib/db/ready";
import { missionLinks } from "@/lib/mission-links";
import { constellations } from "@/lib/owner-content";
import type { OwnerCatalog } from "@/lib/owner/types";

export async function loadOwnerBundle(): Promise<{
  csrfToken: string;
  catalog: OwnerCatalog;
  operator: ReturnType<typeof loadOperatorState>["state"];
  operatorRevision: number;
} | null> {
  const headerStore = await headers();
  if (!loopbackAllowed(headerStore.get("host"))) return null;
  ensureReady();
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!readSession(token)) return null;
  const operator = loadOperatorState();
  const catalog: OwnerCatalog = {
    projects: listOwnerProjects(),
    departments,
    hardware: hardwareAssets,
    hardwareKinds,
    missionLinks,
    constellations,
  };
  return {
    csrfToken: cookieStore.get(CSRF_COOKIE)?.value ?? "",
    catalog,
    operator: operator.state,
    operatorRevision: operator.revision,
  };
}
