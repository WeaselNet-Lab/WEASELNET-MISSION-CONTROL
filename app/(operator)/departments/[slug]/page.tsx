import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ProjectCard } from "@/components/project-card";
import { loadOwnerBundle } from "@/lib/owner/load";

export const dynamic = "force-dynamic";

export default async function DepartmentPage({ params }: { params: Promise<{ slug: string }> }) {
  const bundle = await loadOwnerBundle();
  if (!bundle) redirect("/login");
  const { slug } = await params;
  const department = bundle.catalog.departments.find((item) => item.slug === slug);
  if (!department) notFound();
  const list = bundle.catalog.projects.filter((project) => project.department === department.slug);
  return (
    <div className="flex flex-col gap-6">
      <Link href="/departments" className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase hover:text-primary">← Labs</Link>
      <section className="space-y-3">
        <p className="font-mono text-[11px] tracking-[0.24em] text-primary uppercase">{department.callsign}</p>
        <h1 className="font-heading text-4xl font-semibold tracking-tight">{department.name}</h1>
        <p className="max-w-2xl text-base leading-7 text-muted-foreground">{department.summary}</p>
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        {list.map((project) => <ProjectCard key={project.slug} project={project} />)}
      </div>
    </div>
  );
}
