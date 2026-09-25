import { redirect } from "next/navigation";

import { ExfilPanel } from "@/components/exfil-panel";
import { loadOwnerBundle } from "@/lib/owner/load";

export const dynamic = "force-dynamic";

export default async function ExfilPage() {
  const bundle = await loadOwnerBundle();
  if (!bundle) redirect("/login");
  return <ExfilPanel csrf={bundle.csrfToken} />;
}
