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
import { RightToWorkForm } from "@/components/recruitment/RightToWorkForm";

export const metadata: Metadata = { title: "Right to Work" };

export default async function RightToWorkPage() {
  const profile = await requireProfile();
  const [record, references, settings] = await Promise.all([
    getCandidateRecord(profile.id),
    getReferences(profile.id),
    getRecruitmentSettings(),
  ]);
  const rec = record ?? emptyRecord(profile.id);
  const task = ONBOARDING_TASKS.find((t) => t.key === "right_to_work")!;
  const received = computeChecklist(rec, references).items.find(
    (i) => i.key === "right_to_work",
  )!.done;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-8">
      <TaskHeader
        title={task.title}
        icon={task.icon}
        explained={task.explained}
      />
      <div className="mt-8">
        <RightToWorkForm
          route={rec.rtwRoute}
          shareCode={rec.shareCode}
          british={settings.rtwBritish}
          restOfWorld={settings.rtwRestOfWorld}
          received={received}
        />
      </div>
    </div>
  );
}
