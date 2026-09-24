import { AppShell } from "@/components/app-shell";

export default function DevPreviewLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
