import { headers } from "next/headers";

import { ExploreExperience } from "@/components/explore/explore-experience";
import { ensureReady } from "@/lib/db/ready";
import { loopbackAllowed } from "@/lib/http/boundary";
import { readVisitorSnapshot } from "@/lib/visitor/snapshot";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "WeaselNet Labs — Follow your curiosity",
  description: "Inside Josh's workshop: local AI, animatronic creatures, shared virtual worlds, and the unexpected connections between them.",
};

export default async function ExplorePage() {
  const headerStore = await headers();
  if (!loopbackAllowed(headerStore.get("host"))) {
    return <main className="mx-auto max-w-xl px-6 py-16">Explore stays on this machine until private hosting is set up on purpose.</main>;
  }
  ensureReady();
  return <ExploreExperience snapshot={readVisitorSnapshot()} />;
}
