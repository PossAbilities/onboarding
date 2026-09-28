import type { Metadata } from "next";
import { requireProfile } from "@/lib/auth";
import { getCandidateRecord, getReferences } from "@/lib/recruitment-data";
import {
  ONBOARDING_TASKS,
  computeChecklist,
  emptyRecord,
} from "@/lib/recruitment";
import { TaskHeader } from "@/components/recruitment/TaskHeader";
import { EmploymentHistoryForm } from "@/components/recruitment/EmploymentHistoryForm";

export const metadata: Metadata = { title: "Employment History" };

export default async function EmploymentHistoryPage() {
  const profile = await requireProfile();
  const [record, references] = await Promise.all([
    getCandidateRecord(profile.id),
    getReferences(profile.id),
  ]);
  const rec = record ?? emptyRecord(profile.id);
  const task = ONBOARDING_TASKS.find((t) => t.key === "employment_history")!;
  const verified = computeChecklist(rec, references).items.find(
    (i) => i.key === "employment_history",
  )!.done;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-8">
      <TaskHeader
        title={task.title}
        icon={task.icon}
        explained={task.explained}
      />
      <div className="mt-8">
        <EmploymentHistoryForm
          initial={rec.employmentHistory}
          submittedAt={rec.employmentSubmittedAt}
          verified={verified}
        />
      </div>
    </div>
  );
}
