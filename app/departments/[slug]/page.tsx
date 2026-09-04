import { notFound } from "next/navigation";
import Link from "next/link";

import { ProjectCard } from "@/components/project-card";
import { departments, getDepartment } from "@/lib/departments";
import { projectsByDepartment } from "@/lib/projects";

export function generateStaticParams() {
  return departments.map((department) => ({ slug: department.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const department = getDepartment(slug);
  if (!department) return { title: "Unknown lab" };
  return {
    title: `${department.callsign} · ${department.name}`,
    description: department.summary,
  };
}

export default async function DepartmentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const department = getDepartment(slug);
  if (!department) notFound();
  const list = projectsByDepartment(department.slug);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/departments"
        className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase hover:text-primary"
      >
        ← All labs
      </Link>
      <section className="space-y-3">
        <p className="font-mono text-[11px] tracking-[0.24em] text-primary uppercase">
          {department.callsign}
        </p>
        <h1 className="font-heading text-4xl font-semibold tracking-tight">
          {department.name}
        </h1>
        <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
          {department.summary}
        </p>
        <p className="max-w-2xl text-base leading-7">{department.mandate}</p>
      </section>
      {list.length === 0 ? (
        <div className="rounded-xl bg-card px-4 py-10 text-center ring-1 ring-foreground/10">
          <p className="font-heading text-lg">This lab is staffed by future work.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            A department with no dossiers is a costume. File something or fold it.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
