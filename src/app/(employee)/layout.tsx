import type { ReactNode } from "react";
import { requireProfile } from "@/lib/auth";
import { EmployeeShell } from "@/components/layout/EmployeeShell";

export default async function EmployeeLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await requireProfile();
  return <EmployeeShell profile={profile}>{children}</EmployeeShell>;
}
