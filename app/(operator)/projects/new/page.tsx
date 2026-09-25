import { redirect } from "next/navigation";

import { ProjectEditor } from "@/components/project-editor";
import { getDatabase } from "@/lib/db/connection";
import { loadOwnerBundle } from "@/lib/owner/load";

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  const bundle = await loadOwnerBundle();
  if (!bundle) redirect("/login");
  const noteChoices = (
    getDatabase().prepare("SELECT slug, label FROM notes ORDER BY display_order").all() as {
      slug: string;
      label: string;
    }[]
  ).map((row) => ({ slug: row.slug, label: row.label }));
  return (
    <ProjectEditor
      csrf={bundle.csrfToken}
      project={null}
      noteChoices={noteChoices}
      projectSlugs={bundle.catalog.projects.map((item) => item.slug)}
    />
  );
}
