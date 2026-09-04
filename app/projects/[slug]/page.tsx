import { notFound } from "next/navigation";

import { ProjectDossier } from "@/components/project-dossier";
import { getProject, projectSlugs } from "@/lib/projects";

export function generateStaticParams() {
  return projectSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) {
    return { title: "Unknown frequency" };
  }
  return {
    title: `${project.callsign} · ${project.name}`,
    description: project.summary,
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  return <ProjectDossier project={project} />;
}
