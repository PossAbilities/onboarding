import type { Metadata } from "next";
import { requireProfile } from "@/lib/auth";
import {
  getCandidateRecord,
  getRecruitmentSettings,
  getReferences,
} from "@/lib/recruitment-data";
import { ONBOARDING_TASKS, emptyRecord } from "@/lib/recruitment";
import { Chip } from "@/components/ui/Chip";
import { TaskHeader } from "@/components/recruitment/TaskHeader";
import { PermissionSigner } from "@/components/recruitment/PermissionSigner";
import { ReferencesForm } from "@/components/recruitment/ReferencesForm";

export const metadata: Metadata = { title: "References" };

export default async function ReferencesPage() {
  const profile = await requireProfile();
  const [record, references, settings] = await Promise.all([
    getCandidateRecord(profile.id),
    getReferences(profile.id),
    getRecruitmentSettings(),
  ]);
  const rec = record ?? emptyRecord(profile.id);
  const task = ONBOARDING_TASKS.find((t) => t.key === "reference_details")!;
  const permission = ONBOARDING_TASKS.find(
    (t) => t.key === "reference_permission",
  )!;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-8">
      <TaskHeader
        title="References"
        icon={task.icon}
        explained={task.explained}
      />

      <section className="mt-8 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-5 journey-card-shadow">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-bold text-on-surface-variant">Step 1</p>
          <h2 className="text-lg font-black text-on-surface">
            {permission.title}
          </h2>
          {rec.referencePermission ? (
            <Chip tone="success">Signed</Chip>
          ) : (
            <Chip tone="pink">Required</Chip>
          )}
        </div>
        <p className="mt-1 text-sm text-on-surface-variant">
          {permission.explained}
        </p>
        <div
          className="letter mt-4 rounded-lg border border-outline-variant/50 bg-surface-container-low p-5 text-on-surface"
          dangerouslySetInnerHTML={{ __html: settings.referencePermissionHtml }}
        />
        <div className="mt-4">
          <PermissionSigner
            defaultName={profile.fullName}
            signature={rec.referencePermission}
          />
        </div>
      </section>

      <div className="mt-8">
        <p className="text-xs font-bold text-on-surface-variant">Step 2</p>
        <h2 className="text-lg font-black text-on-surface">Your referees</h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          When you submit, we&rsquo;ll email each referee a short reference form
          for you, and remind them every {settings.reminderDays} days until
          it&rsquo;s returned.
        </p>
        <div className="mt-4">
          <ReferencesForm
            references={references}
            permissionSigned={!!rec.referencePermission}
            submitted={!!rec.referencesSubmittedAt}
          />
        </div>
      </div>
    </div>
  );
}
