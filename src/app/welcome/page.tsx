import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import {
  getCandidateRecord,
  getRecruitmentSettings,
} from "@/lib/recruitment-data";
import { SAMPLE_VIDEO } from "@/lib/seed";
import { GateShell } from "@/components/recruitment/GateShell";
import { WelcomeExperience } from "@/components/recruitment/WelcomeExperience";

export const metadata: Metadata = { title: "Welcome to PossAbilities" };

export default async function WelcomePage() {
  const profile = await requireProfile();
  const [record, settings] = await Promise.all([
    getCandidateRecord(profile.id),
    getRecruitmentSettings(),
  ]);
  const preview = profile.isAdmin;
  // Starters who were never set up as candidates skip the recruitment flow.
  if (!preview && !record) redirect("/home");
  if (!preview && record?.offerSignature) redirect("/home");

  return (
    <GateShell step={1}>
      {preview && (
        <p className="mb-6 rounded-xl bg-primary-fixed/40 px-4 py-3 text-sm font-bold text-on-primary-fixed-variant">
          Admin preview — this is what a new candidate sees when they first log
          in.
        </p>
      )}
      <WelcomeExperience
        firstName={profile.fullName.split(" ")[0] ?? ""}
        title={settings.welcomeTitle}
        message={settings.welcomeMessage}
        videoUrl={
          settings.welcomeVideoUrl ??
          (isSupabaseConfigured ? null : SAMPLE_VIDEO)
        }
        videoLabel={settings.welcomeVideoLabel || "A welcome from Rachel"}
        alreadyWatched={!!record?.welcomeWatchedAt}
        preview={preview}
      />
    </GateShell>
  );
}
