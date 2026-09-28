import type { Metadata } from "next";
import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import {
  getCandidateRecord,
  getRecruitmentSettings,
  getReferences,
} from "@/lib/recruitment-data";
import {
  ONBOARDING_TASKS,
  REFERENCE_KIND_LABEL,
  computeChecklist,
  emptyRecord,
  formatDate,
  isReferenceFilled,
  type ChecklistItem,
} from "@/lib/recruitment";
import { Icon } from "@/components/ui/Icon";
import { Chip } from "@/components/ui/Chip";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ButtonLink } from "@/components/ui/Button";
import { DbsConfirm } from "@/components/recruitment/DbsConfirm";

export const metadata: Metadata = { title: "Onboarding" };

export default async function OnboardingPage() {
  const profile = await requireProfile();
  const [record, references, settings] = await Promise.all([
    getCandidateRecord(profile.id),
    getReferences(profile.id),
    getRecruitmentSettings(),
  ]);
  const rec = record ?? emptyRecord(profile.id);
  const checklist = computeChecklist(rec, references);
  const item = (k: ChecklistItem["key"]) =>
    checklist.items.find((i) => i.key === k)!;
  const filledRefs = references.filter(isReferenceFilled);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-on-surface md:text-4xl">
            Onboarding
          </h1>
          <p className="mt-2 max-w-xl text-on-surface-variant">
            Everything we need before your first day. Each task explains
            what&rsquo;s needed and why — your checklist below ticks off as
            things are completed.
          </p>
        </div>
        <div className="rounded-xl bg-surface-container-lowest p-4 text-right journey-card-shadow">
          <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
            Checklist
          </p>
          <p className="text-2xl font-black text-primary-container">
            {checklist.done}/{checklist.total} complete
          </p>
          <ProgressBar value={checklist.percent} className="mt-1 w-48" />
        </div>
      </div>

      {/* ── Tasks ─────────────────────────────────────────── */}
      <h2 className="mt-10 text-xl font-black text-on-surface">Your tasks</h2>
      <ol className="mt-4 flex flex-col gap-4">
        {ONBOARDING_TASKS.map((task, i) => {
          const state = item(task.key);
          const notApplicable =
            task.key === "driving" && rec.drivesForBusiness === false;
          const id =
            task.key === "dbs_application"
              ? "dbs"
              : task.key === "health_questionnaire"
                ? "health"
                : undefined;
          return (
            <li
              key={task.key}
              id={id}
              className="scroll-mt-24 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-5 journey-card-shadow"
            >
              <div className="flex flex-wrap items-start gap-4">
                <span
                  className={
                    state.done
                      ? "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-accent text-tertiary"
                      : "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl gradient-purple-pink text-on-primary"
                  }
                >
                  <Icon
                    name={state.done ? "check" : task.icon}
                    size={26}
                    fill={state.done}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-bold text-on-surface-variant">
                      Task {i + 1}
                    </p>
                    {task.optional && <Chip tone="neutral">Optional</Chip>}
                    {state.done ? (
                      <Chip tone="success">Complete</Chip>
                    ) : notApplicable ? (
                      <Chip tone="locked">Not applicable</Chip>
                    ) : (
                      <Chip tone="pink">{state.status}</Chip>
                    )}
                  </div>
                  <h3 className="mt-1 text-lg font-extrabold text-on-surface">
                    {task.title}
                  </h3>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    <strong className="text-on-surface">
                      Task explained:{" "}
                    </strong>
                    {task.explained}
                  </p>

                  {task.key === "dbs_application" && (
                    <>
                      <details className="mt-3 rounded-lg bg-surface-container-low p-4 text-sm">
                        <summary className="cursor-pointer font-bold text-on-surface">
                          Accepted forms of ID (you&rsquo;ll need 3)
                        </summary>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-on-surface-variant">
                          {settings.dbsIdList.map((d) => (
                            <li key={d}>{d}</li>
                          ))}
                        </ul>
                      </details>
                      <DbsConfirm done={!!rec.dbsSubmittedAt} />
                      <p className="mt-2 text-xs text-on-surface-variant">
                        DBS certificate:{" "}
                        <strong>
                          {item("dbs_complete").done
                            ? "received ✅"
                            : "awaiting"}
                        </strong>
                      </p>
                    </>
                  )}

                  {task.key === "health_questionnaire" && (
                    <p className="mt-3 rounded-lg bg-tertiary-fixed/40 p-3 text-sm text-on-tertiary-fixed-variant">
                      <Icon name="mail" size={16} className="align-middle" />{" "}
                      Look out for an email from our Occupational Health
                      provider. We&rsquo;ll tick this off once they let us know
                      it&rsquo;s been completed.
                    </p>
                  )}
                </div>
                {task.href && !task.href.startsWith("/onboarding#") && (
                  <ButtonLink
                    href={task.href}
                    size="sm"
                    variant={state.done ? "outline" : "primary"}
                  >
                    {state.done ? "View" : "Start"}{" "}
                    <Icon name="arrow_forward" size={16} />
                  </ButtonLink>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {/* ── Checklist ─────────────────────────────────────── */}
      <h2 className="mt-12 text-xl font-black text-on-surface">Checklist</h2>
      <p className="mt-1 text-sm text-on-surface-variant">
        Some items are ticked by our HR team once they&rsquo;ve checked what you
        sent, or when we hear back from Ucheck and Occupational Health.
      </p>
      <div className="mt-4 overflow-hidden rounded-xl border border-outline-variant/60 bg-surface-container-lowest journey-card-shadow">
        <ul className="divide-y divide-outline-variant/40">
          {checklist.items.map((c) => (
            <li
              key={c.key}
              className={`flex flex-wrap items-center gap-3 px-5 py-3 ${c.applicable ? "" : "opacity-60"}`}
            >
              <span
                className={
                  c.done
                    ? "flex h-7 w-7 items-center justify-center rounded-md bg-success-green text-white"
                    : "flex h-7 w-7 items-center justify-center rounded-md border-2 border-outline-variant"
                }
                aria-label={c.done ? "Complete" : "Not complete"}
              >
                {c.done && <Icon name="check" size={18} />}
              </span>
              <span className="min-w-0 flex-1 font-bold text-on-surface">
                {c.label}
              </span>
              <span className="text-sm text-on-surface-variant">
                {c.done && c.doneAt
                  ? `Completed ${formatDate(c.doneAt)}`
                  : c.status}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* References breakdown */}
      {filledRefs.length > 0 && (
        <div className="mt-6 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-5 journey-card-shadow">
          <h3 className="font-extrabold text-on-surface">Your references</h3>
          <ul className="mt-3 flex flex-col gap-2">
            {filledRefs.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center gap-2 text-sm"
              >
                <Icon
                  name={
                    r.status === "received"
                      ? "mark_email_read"
                      : "schedule_send"
                  }
                  size={18}
                  className={
                    r.status === "received"
                      ? "text-[#1b7a44]"
                      : "text-secondary"
                  }
                />
                <span className="font-bold text-on-surface">
                  {r.refereeName}
                </span>
                <span className="text-on-surface-variant">
                  · {REFERENCE_KIND_LABEL[r.kind]}
                  {r.organisation ? ` · ${r.organisation}` : ""}
                </span>
                <Chip
                  tone={
                    r.status === "received"
                      ? "success"
                      : r.status === "requested"
                        ? "pink"
                        : "locked"
                  }
                  className="ml-auto"
                >
                  {r.status === "received"
                    ? "Returned"
                    : r.status === "requested"
                      ? "Outstanding"
                      : "Not sent yet"}
                </Chip>
              </li>
            ))}
          </ul>
          <Link
            href="/onboarding/references"
            className="mt-3 inline-block text-sm font-bold text-secondary"
          >
            Manage references →
          </Link>
        </div>
      )}
    </div>
  );
}
