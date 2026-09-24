import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { AppShell } from "@/components/app-shell";
import { CatalogProvider } from "@/components/catalog-provider";
import { loopbackAllowed } from "@/lib/http/boundary";
import { loadOwnerBundle } from "@/lib/owner/load";

export const dynamic = "force-dynamic";

export default async function OperatorLayout({ children }: { children: React.ReactNode }) {
  const headerStore = await headers();
  if (!loopbackAllowed(headerStore.get("host"))) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16">
        <h1 className="font-heading text-3xl">Local only</h1>
        <p className="mt-3 text-muted-foreground">
          Mission Control stays on this machine until a private network and HTTPS are set up on purpose.
        </p>
      </main>
    );
  }
  const bundle = await loadOwnerBundle();
  if (!bundle) redirect("/login");
  return (
    <CatalogProvider catalog={bundle.catalog}>
      <AppShell initialState={bundle.operator} revision={bundle.operatorRevision} csrf={bundle.csrfToken}>
        {children}
      </AppShell>
    </CatalogProvider>
  );
}
