"use client";

import { useMemo, useState } from "react";

import { ProjectCard } from "@/components/project-card";
import { Input } from "@/components/ui/input";
import { departments } from "@/lib/departments";
import { searchProjects, statusOrder } from "@/lib/catalog";
import { projects } from "@/lib/projects";
import type { DepartmentId, ProjectStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useOperator } from "@/components/operator-provider";

const statuses: Array<ProjectStatus | "all"> = ["all", ...statusOrder];

export function ProjectCatalog() {
  const operator = useOperator();
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState<DepartmentId | "all">("all");
  const [status, setStatus] = useState<ProjectStatus | "all">("all");
  const [onlyPinned, setOnlyPinned] = useState(false);

  const filtered = useMemo(() => {
    return searchProjects(query).filter((project) => {
      if (department !== "all" && project.department !== department) return false;
      if (status !== "all" && project.status !== status) return false;
      if (onlyPinned && !operator.pinned.includes(project.slug)) return false;
      return true;
    });
  }, [query, department, status, onlyPinned, operator.pinned]);

  return (
    <div className="flex flex-col gap-6">
      <section className="space-y-3">
        <p className="font-mono text-[11px] tracking-[0.24em] text-primary uppercase">
          Project catalog
        </p>
        <h1 className="font-heading text-4xl font-semibold tracking-tight">
          Every lab, still on frequency
        </h1>
        <p className="max-w-2xl text-base leading-7 text-muted-foreground">
          Filter like an operator, not like a portfolio. If it is here, it is part of the
          universe. If it cannot clear a README, it is not finished — it is camping.
        </p>
      </section>

      <div className="flex flex-col gap-3">
        <Input
          value={query}
          onValueChange={setQuery}
          placeholder="Search callsigns, stacks, daughters, dragons…"
          aria-label="Search projects"
          className="h-10 bg-card"
        />
        <div className="flex flex-col gap-2">
          <ChipRow
            label="Lab"
            options={[
              { id: "all", label: "All" },
              ...departments.map((item) => ({ id: item.slug, label: item.callsign })),
            ]}
            value={department}
            onChange={(value) => setDepartment(value as DepartmentId | "all")}
          />
          <ChipRow
            label="Status"
            options={statuses.map((item) => ({
              id: item,
              label: item === "all" ? "All" : item,
            }))}
            value={status}
            onChange={(value) => setStatus(value as ProjectStatus | "all")}
          />
          <div className="flex items-center gap-2">
            <span className="w-14 font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
              Flags
            </span>
            <button
              type="button"
              onClick={() => setOnlyPinned((value) => !value)}
              className={cn(
                "rounded-full border px-3 py-1 font-mono text-[11px] tracking-[0.14em] uppercase",
                onlyPinned
                  ? "border-primary/40 bg-primary/15 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              Pinned only
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl bg-card px-4 py-10 text-center ring-1 ring-foreground/10">
          <p className="font-heading text-lg">Nothing on that frequency.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Try a callsign, or admit the project is still in your head and file a concept
            dossier later.
          </p>
          {query || department !== "all" || status !== "all" || onlyPinned ? (
            <button
              type="button"
              className="mt-4 font-mono text-[11px] tracking-[0.16em] text-primary uppercase hover:underline"
              onClick={() => {
                setQuery("");
                setDepartment("all");
                setStatus("all");
                setOnlyPinned(false);
              }}
            >
              Clear search and filters
            </button>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      )}
      <p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
        Showing {filtered.length} of {projects.length}
      </p>
    </div>
  );
}

function ChipRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-14 font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
        {label}
      </span>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={cn(
            "rounded-full border px-3 py-1 font-mono text-[11px] tracking-[0.14em] uppercase",
            value === option.id
              ? "border-primary/40 bg-primary/15 text-primary"
              : "border-border text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
