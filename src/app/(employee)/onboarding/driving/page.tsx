import type { Metadata } from "next";
import { requireProfile } from "@/lib/auth";
import {
  getCandidateRecord,
  getRecruitmentSettings,
  getReferences,
} from "@/lib/recruitment-data";
import {
  ONBOARDING_TASKS,
  computeChecklist,
  emptyRecord,
} from "@/lib/recruitment";
import { TaskHeader } from "@/components/recruitment/TaskHeader";
import { DrivingForm } from "@/components/recruitment/DrivingForm";

export const metadata: Metadata = { title: "Driving for business" };

export default async function DrivingPage() {
  const profile = await requireProfile();
  const [record, references, settings] = await Promise.all([
    getCandidateRecord(profile.id),
    getReferences(profile.id),
    getRecruitmentSettings(),
  ]);
  const rec = record ?? emptyRecord(profile.id);
  const task = ONBOARDING_TASKS.find((t) => t.key === "driving")!;
  const approved = computeChecklist(rec, references).items.find(
    (i) => i.key === "driving",
  )!.done;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-8">
      <TaskHeader
        title={task.title}
        icon={task.icon}
        explained={task.explained}
      />
      <div className="mt-8">
        <DrivingForm
          drives={rec.drivesForBusiness}
          details={rec.driving}
          vehicleChecklist={settings.vehicleChecklist}
          submittedAt={rec.drivingSubmittedAt}
          approved={approved}
        />
      </div>
    </div>
  );
}
