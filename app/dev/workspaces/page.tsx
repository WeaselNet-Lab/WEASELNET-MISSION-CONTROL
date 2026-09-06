import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  developmentPreviewDenialReason,
  isDevelopmentPreviewAllowed,
  listPreviewWorkspaces,
} from "@/lib/workspaces";

export const metadata = {
  title: "Workspace previews",
};

export default async function WorkspacePreviewIndexPage() {
  const headerStore = await headers();
  const access = {
    nodeEnv: process.env.NODE_ENV,
    host: headerStore.get("host"),
    forwardedHost: headerStore.get("x-forwarded-host"),
  };

  if (!isDevelopmentPreviewAllowed(access)) {
    notFound();
  }

  const workspaces = listPreviewWorkspaces();
  const denial = developmentPreviewDenialReason({
    nodeEnv: "production",
    host: "localhost",
  });

  return (
    <div className="flex flex-col gap-8">
      <section className="space-y-3">
        <p className="eyebrow">Development previews</p>
        <h1 className="font-heading text-4xl font-semibold tracking-tight">
          Personal workspace fixtures
        </h1>
        <p className="max-w-2xl text-base leading-7 text-muted-foreground">
          Profile switching here is for layout review only. It is not sign-in,
          not authorization, and not available when{" "}
          <span className="font-mono text-foreground">NODE_ENV=production</span>.
        </p>
        <p className="text-sm text-muted-foreground">
          Production denial copy check: {denial}
        </p>
      </section>

      <ul className="grid gap-4 md:grid-cols-3">
        {workspaces.map((workspace) => (
          <li key={workspace.id} className="mission-panel flex flex-col">
            <header className="mission-panel-header">
              <div>
                <p className="eyebrow">{workspace.role}</p>
                <h2 className="font-heading text-xl">{workspace.displayName}</h2>
              </div>
              <Badge variant="outline">{workspace.enabledModules.length} modules</Badge>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4">
              <p className="text-sm leading-6 text-muted-foreground">
                {workspace.tagline}
              </p>
              <p className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                {workspace.enabledModules.join(" · ")}
              </p>
              <Button
                render={
                  <Link
                    href={
                      workspace.role === "operator"
                        ? workspace.homePath
                        : `/dev/workspaces/${workspace.id}`
                    }
                  />
                }
              >
                {workspace.role === "operator" ? "Open Ops board" : "Open preview"}
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <p className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
        Josh Mission Control routes remain the real operator surface.
      </p>
    </div>
  );
}
