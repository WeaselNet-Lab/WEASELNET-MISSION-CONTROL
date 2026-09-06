import { Badge } from "@/components/ui/badge";

export function WorkspacePreviewBanner({
  workspaceLabel,
}: {
  workspaceLabel?: string;
}) {
  return (
    <div
      role="status"
      className="border-b border-amber-500/40 bg-amber-500/10"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="font-mono text-[11px] tracking-[0.14em] text-amber-100 uppercase">
          Development preview only · not authentication · fictional fixtures ·
          unavailable in production
        </p>
        <div className="flex items-center gap-2">
          {workspaceLabel ? (
            <Badge variant="outline" className="border-amber-400/50 text-amber-100">
              {workspaceLabel}
            </Badge>
          ) : null}
          <Badge variant="secondary">Localhost gate</Badge>
        </div>
      </div>
    </div>
  );
}
