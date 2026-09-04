export default function Loading() {
  return (
    <div className="flex flex-col gap-4 py-10">
      <div className="h-3 w-40 animate-pulse rounded bg-muted" />
      <div className="h-10 w-2/3 animate-pulse rounded bg-muted" />
      <div className="h-24 w-full animate-pulse rounded-xl bg-muted/70" />
      <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
        Syncing the board…
      </p>
    </div>
  );
}
