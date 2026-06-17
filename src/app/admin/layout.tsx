import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/layout/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await requireAdmin();
  return <AdminShell profile={profile}>{children}</AdminShell>;
}
