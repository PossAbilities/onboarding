import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { getCandidateRecord } from "@/lib/recruitment-data";
import { EmployeeShell } from "@/components/layout/EmployeeShell";

export default async function EmployeeLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await requireProfile();
  // Candidates must watch the welcome video and sign their offer letter
  // before reaching the rest of the site.
  const record = profile.isAdmin ? null : await getCandidateRecord(profile.id);
  if (record && !record.welcomeWatchedAt) redirect("/welcome");
  if (record && !record.offerSignature) redirect("/offer");
  return <EmployeeShell profile={profile}>{children}</EmployeeShell>;
}
