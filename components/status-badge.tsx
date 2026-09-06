import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@/lib/types";

const statusStyles: Record<ProjectStatus, { label: string; className: string; led: string }> = {
  active: {
    label: "Active",
    className: "border-signal/40 bg-signal/10 text-signal",
    led: "bg-signal shadow-[0_0_8px_var(--signal)]",
  },
  alpha: {
    label: "Alpha",
    className: "border-primary/40 bg-primary/10 text-primary",
    led: "bg-primary shadow-[0_0_8px_var(--primary)]",
  },
  concept: {
    label: "Concept",
    className: "border-border bg-muted/60 text-muted-foreground",
    led: "bg-muted-foreground/70",
  },
  parked: {
    label: "Parked",
    className: "border-border bg-muted/40 text-muted-foreground",
    led: "bg-muted-foreground/40",
  },
  shipped: {
    label: "Shipped",
    className: "border-chart-2/40 bg-chart-2/10 text-chart-2",
    led: "bg-chart-2",
  },
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const style = statusStyles[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] font-medium tracking-[0.16em] uppercase",
        style.className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", style.led)} />
      {style.label}
    </span>
  );
}

export function LiveDot({ className }: { className?: string }) {
  return (
    <span className={cn("relative flex size-2.5", className)}>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal/60" />
      <span className="relative inline-flex size-2.5 rounded-full bg-signal" />
    </span>
  );
}
