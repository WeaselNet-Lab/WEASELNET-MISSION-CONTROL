import Link from "next/link";
import { redirect } from "next/navigation";

import { loadOwnerBundle } from "@/lib/owner/load";

export const dynamic = "force-dynamic";

export default async function DepartmentsPage() {
  const bundle = await loadOwnerBundle();
  if (!bundle) redirect("/login");
  return (
    <div className="flex flex-col gap-6">
      <section className="space-y-3">
        <p className="font-mono text-[11px] tracking-[0.24em] text-primary uppercase">Departments</p>
        <h1 className="font-heading text-4xl font-semibold tracking-tight">Pick a lab. Leave the rest on watch.</h1>
        <p className="max-w-2xl text-base leading-7 text-muted-foreground">
          WeaselNet is an umbrella on purpose. The point of departments is not org-chart theater — it is so a dragon, a dinosaur, and a DCS night stop competing for the same identity.
        </p>
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        {bundle.catalog.departments.map((department) => {
          const count = bundle.catalog.projects.filter((project) => project.department === department.slug).length;
          return (
            <Link key={department.slug} href={`/departments/${department.slug}`} className="rounded-xl bg-card/80 p-5 ring-1 ring-foreground/10 transition-colors hover:ring-primary/35">
              <p className="font-mono text-[10px] tracking-[0.22em] text-primary uppercase">{department.callsign}</p>
              <h2 className="font-heading mt-1 text-2xl">{department.name}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{department.mandate}</p>
              <p className="mt-4 font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">{count} on deck</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
