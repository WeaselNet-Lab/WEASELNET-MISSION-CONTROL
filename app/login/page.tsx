import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { loadOwnerBundle } from "@/lib/owner/load";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const bundle = await loadOwnerBundle();
  if (bundle) redirect("/");
  return <LoginForm />;
}
