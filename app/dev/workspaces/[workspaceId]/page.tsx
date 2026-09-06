import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { StudentDashboard } from "@/components/student-dashboard";
import { Button } from "@/components/ui/button";
import {
  getWorkspaceConfig,
  isDevelopmentPreviewAllowed,
  workspaceIds,
} from "@/lib/workspaces";

type PageProps = {
  params: Promise<{ workspaceId: string }>;
};

export function generateStaticParams() {
  return workspaceIds.map((workspaceId) => ({ workspaceId }));
}

export async function generateMetadata({ params }: PageProps) {
  const headerStore = await headers();
  if (
    !isDevelopmentPreviewAllowed({
      nodeEnv: process.env.NODE_ENV,
      host: headerStore.get("host"),
      forwardedHost: headerStore.get("x-forwarded-host"),
    })
  ) {
    return { title: "Workspace preview" };
  }

  const { workspaceId } = await params;
  const config = getWorkspaceConfig(workspaceId);
  return {
    title: config ? `${config.displayName} preview` : "Workspace preview",
  };
}

export default async function WorkspacePreviewPage({ params }: PageProps) {
  const headerStore = await headers();
  if (
    !isDevelopmentPreviewAllowed({
      nodeEnv: process.env.NODE_ENV,
      host: headerStore.get("host"),
      forwardedHost: headerStore.get("x-forwarded-host"),
    })
  ) {
    notFound();
  }

  const { workspaceId } = await params;
  const config = getWorkspaceConfig(workspaceId);
  if (!config) notFound();

  if (config.role === "operator") {
    return (
      <div className="flex flex-col gap-6">
        <section className="space-y-3">
          <p className="eyebrow">Operator workspace</p>
          <h1 className="font-heading text-4xl font-semibold tracking-tight">
            {config.displayName}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground">
            {config.tagline} The live operator surface stays on the existing
            Mission Control routes — this preview does not duplicate the Ops board.
          </p>
        </section>
        <div className="flex flex-wrap gap-3">
          <Button render={<Link href="/" />}>Open Ops board</Button>
          <Button variant="outline" render={<Link href="/dev/workspaces" />}>
            Back to previews
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button variant="outline" size="sm" render={<Link href="/dev/workspaces" />}>
          All previews
        </Button>
      </div>
      <StudentDashboard config={config} />
    </div>
  );
}
