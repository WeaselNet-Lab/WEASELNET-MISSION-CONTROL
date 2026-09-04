import Link from "next/link";

export function SignalLost() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-start gap-4 py-16">
      <p className="font-mono text-[11px] tracking-[0.24em] text-primary uppercase">
        Signal lost
      </p>
      <h1 className="font-heading text-4xl font-semibold tracking-tight">
        That frequency is empty.
      </h1>
      <p className="text-base leading-7 text-muted-foreground">
        Either the dossier never existed, or it went folklore before it made the board.
        Mission Control is still here. You can be too.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-primary px-3 py-2 font-mono text-xs tracking-[0.16em] text-primary-foreground uppercase"
      >
        Return to ops
      </Link>
    </div>
  );
}
