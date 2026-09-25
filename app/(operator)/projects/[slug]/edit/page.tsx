import { notFound, redirect } from "next/navigation";

import { ProjectEditor } from "@/components/project-editor";
import { getDatabase } from "@/lib/db/connection";
import { getOwnerProjectBySlug } from "@/lib/db/projects";
import { loadOwnerBundle } from "@/lib/owner/load";

export const dynamic = "force-dynamic";

export default async function EditProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const bundle = await loadOwnerBundle();
  if (!bundle) redirect("/login");
  const { slug } = await params;
  const project = getOwnerProjectBySlug(slug);
  if (!project) notFound();
  const noteChoices = (
    getDatabase().prepare("SELECT slug, label FROM notes ORDER BY display_order").all() as {
      slug: string;
      label: string;
    }[]
  ).map((row) => ({ slug: row.slug, label: row.label }));
  return (
    <ProjectEditor
      csrf={bundle.csrfToken}
      project={project}
      noteChoices={noteChoices}
      projectSlugs={bundle.catalog.projects.map((item) => item.slug)}
    />
  );
}
