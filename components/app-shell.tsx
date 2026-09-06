"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import { Menu, Radio } from "lucide-react";

import { OperatorProvider } from "@/components/operator-provider";
import { LiveDot } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrandMark } from "@/components/brand-mark";
import { CommandDeck } from "@/components/command-deck";
import { QuickCapture } from "@/components/quick-capture";
import { WorkspacePreviewBanner } from "@/components/workspace-preview-banner";
import {
  getWorkspaceConfig,
  isWorkspacePreviewPath,
  previewWorkspaceId,
  resolveShellNav,
  shouldMountOperatorProvider,
  shouldShowOperatorControls,
} from "@/lib/workspaces";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href.includes("#")) {
    const [path] = href.split("#");
    return pathname === path || pathname.startsWith(`${path}/`);
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

let clockNow = 0;

function subscribeClock(onStoreChange: () => void) {
  clockNow = Date.now();
  const id = window.setInterval(() => {
    clockNow = Date.now();
    onStoreChange();
  }, 1000);
  queueMicrotask(onStoreChange);
  return () => window.clearInterval(id);
}

function getClock() {
  if (clockNow === 0) clockNow = Date.now();
  return clockNow;
}

function getServerClock() {
  return 0;
}

function Clock() {
  const now = useSyncExternalStore(subscribeClock, getClock, getServerClock);
  const label = now
    ? new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZoneName: "short",
      }).format(new Date(now))
    : "--:--:--";

  return <span className="font-mono text-xs tracking-wider text-muted-foreground">{label}</span>;
}

function NavLinks({
  items,
  onNavigate,
}: {
  items: { href: string; label: string }[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1 md:flex-row md:items-center md:gap-1">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          className={cn(
            "rounded-md px-3 py-2 font-mono text-xs tracking-[0.18em] uppercase transition-colors",
            isActive(pathname, item.href)
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

function ShellInner({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isPreview = isWorkspacePreviewPath(pathname);
  const previewId = previewWorkspaceId(pathname);
  const previewConfig = previewId ? getWorkspaceConfig(previewId) : undefined;
  const navItems = resolveShellNav(pathname);
  const showOperatorTools = shouldShowOperatorControls(pathname);

  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" />
      <div className="pointer-events-none absolute inset-0 bg-vignette" />
      {isPreview ? (
        <WorkspacePreviewBanner workspaceLabel={previewConfig?.displayName} />
      ) : null}
      <header className="sticky top-0 z-40 border-b border-primary/20 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <BrandMark className="size-10" />
            <span className="min-w-0">
              <span className="block font-heading text-base leading-none tracking-[0.18em] text-primary uppercase">
                WeaselNet
              </span>
              <span className="mt-1 block font-mono text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
                {previewConfig?.role === "student"
                  ? previewConfig.displayName
                  : "Mission Control"}
              </span>
            </span>
          </Link>
          <div className="ml-auto hidden md:block">
            <NavLinks items={navItems} />
          </div>
          <div className="ml-auto flex items-center gap-3 md:ml-4">
            {showOperatorTools ? (
              <>
                <CommandDeck />
                <QuickCapture compact />
              </>
            ) : (
              <Button
                size="sm"
                variant="outline"
                render={<Link href="/dev/workspaces" />}
              >
                Previews
              </Button>
            )}
            <div className="hidden items-center gap-2 sm:flex">
              <LiveDot />
              <span className="font-mono text-[10px] tracking-[0.18em] text-signal uppercase">
                {isPreview ? "Preview" : "Board live"}
              </span>
            </div>
            <Clock />
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger
                render={
                  <Button
                    size="icon"
                    variant="outline"
                    className="md:hidden"
                    aria-label="Open navigation"
                  />
                }
              >
                <Menu className="size-4" />
              </SheetTrigger>
              <SheetContent side="right" className="w-72 bg-background">
                <SheetHeader>
                  <SheetTitle className="font-heading tracking-[0.16em] uppercase">
                    Stations
                  </SheetTitle>
                </SheetHeader>
                <div className="px-2">
                  <NavLinks items={navItems} onNavigate={() => setOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
      <footer className="relative z-10 border-t border-border/80 bg-background/80">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-4 font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="flex items-center gap-2">
            <Radio className="size-3 text-primary" />
            Operator Josh · Southern New England
          </p>
          <p>Labs stay connected. Side quests still count. Folklore does not.</p>
        </div>
      </footer>
    </div>
  );
}

function OperatorBoundary({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (!shouldMountOperatorProvider(pathname)) {
    return <>{children}</>;
  }
  return <OperatorProvider>{children}</OperatorProvider>;
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <OperatorBoundary>
        <ShellInner>{children}</ShellInner>
      </OperatorBoundary>
    </TooltipProvider>
  );
}
