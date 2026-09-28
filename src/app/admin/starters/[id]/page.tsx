import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { siteUrl } from "@/lib/config";
import {
  getCandidateRecord,
  getProfileById,
  getReferences,
} from "@/lib/recruitment-data";
import {
  computeChecklist,
  emptyRecord,
  findGaps,
  formatDate,
  formatMonth,
  type ChecklistKey,
} from "@/lib/recruitment";
import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  AdminChecklist,
  AdminReferences,
  CandidateDetailsForm,
  ResetOfferButton,
} from "./AdminCandidate";

export const metadata: Metadata = { title: "Admin · Candidate" };

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-5 journey-card-shadow">
      <h2 className="flex items-center gap-2 text-lg font-black text-on-surface">
        <Icon name={icon} className="text-secondary" size={22} /> {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 py-1.5 text-sm">
      <span className="text-on-surface-variant">{label}</span>
      <span className="font-bold text-on-surface">{value || "—"}</span>
    </div>
  );
}

export default async function CandidatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const profile = await getProfileById(id);
  if (!profile) notFound();
  const [record, references] = await Promise.all([
    getCandidateRecord(id),
    getReferences(id),
  ]);
  const rec = record ?? emptyRecord(id);
  const checklist = computeChecklist(rec, references);
  const history = rec.employmentHistory;
  const gaps = history ? findGaps(history.leftEducation, history.entries) : [];

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/admin/starters"
        className="inline-flex items-center gap-1 text-sm font-bold text-secondary"
      >
        <Icon name="arrow_back" size={18} /> All starters
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <Avatar src={profile.avatarUrl} name={profile.fullName} size={56} />
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-black text-on-surface">
            {profile.fullName}
          </h1>
          <p className="text-on-surface-variant">
            {profile.email} · {rec.jobTitle || profile.roleTag}
            {profile.department ? ` · ${profile.department}` : ""}
          </p>
        </div>
        <div className="w-64 rounded-xl bg-surface-container-lowest p-4 journey-card-shadow">
          <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
            Onboarding
          </p>
          <p className="text-2xl font-black text-primary-container">
            {checklist.done}/{checklist.total} · {checklist.percent}%
          </p>
          <ProgressBar value={checklist.percent} className="mt-1" />
        </div>
      </div>

      {!record && (
        <p className="mt-4 rounded-xl bg-tertiary-fixed/40 px-4 py-3 text-sm font-bold text-on-tertiary-fixed-variant">
          This starter was added before the digital recruitment process, so they
          skip the welcome video and offer letter. Saving details below starts a
          record for them — they&rsquo;ll then be asked to watch the welcome
          video and sign an offer letter when they next log in.
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="flex flex-col gap-6 lg:col-span-3">
          <Panel title="Checklist" icon="checklist">
            <AdminChecklist
              userId={id}
              items={checklist.items}
              overridden={Object.keys(rec.checks).filter(
                (k) => rec.checks[k as ChecklistKey],
              )}
            />
          </Panel>

          <Panel title="References" icon="contact_mail">
            <AdminReferences
              userId={id}
              references={references}
              linkBase={siteUrl}
            />
          </Panel>

          <Panel title="Employment history" icon="work_history">
            {!history ? (
              <p className="text-sm text-on-surface-variant">
                Not started yet.
              </p>
            ) : (
              <>
                <p className="text-sm text-on-surface-variant">
                  Left education / first job:{" "}
                  <strong>{formatMonth(history.leftEducation)}</strong>
                  {rec.employmentSubmittedAt
                    ? ` · Submitted ${formatDate(rec.employmentSubmittedAt)}`
                    : " · Draft (not submitted)"}
                </p>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                      <tr>
                        <th className="py-2 pr-3">Employer</th>
                        <th className="py-2 pr-3">Role</th>
                        <th className="py-2 pr-3">Dates</th>
                        <th className="py-2">Reason for leaving</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/40">
                      {[...history.entries]
                        .sort((a, b) =>
                          b.startMonth.localeCompare(a.startMonth),
                        )
                        .map((e) => (
                          <tr key={e.id}>
                            <td className="py-2 pr-3 font-bold text-on-surface">
                              {e.employer}
                              {e.careOrEducation && (
                                <Chip tone="teal" className="ml-2">
                                  Care / Ed
                                </Chip>
                              )}
                            </td>
                            <td className="py-2 pr-3">{e.jobTitle}</td>
                            <td className="py-2 pr-3 whitespace-nowrap">
                              {formatMonth(e.startMonth)} –{" "}
                              {e.endMonth ? formatMonth(e.endMonth) : "Present"}
                            </td>
                            <td className="py-2 text-on-surface-variant">
                              {e.reasonForLeaving || "—"}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                {gaps.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-bold text-on-surface">
                      Gaps explained
                    </p>
                    <ul className="mt-1 flex flex-col gap-1 text-sm">
                      {gaps.map((g) => (
                        <li key={`${g.from}_${g.to}`}>
                          <strong>
                            {formatMonth(g.from)}
                            {g.from !== g.to ? ` – ${formatMonth(g.to)}` : ""}:
                          </strong>{" "}
                          {history.gaps.find(
                            (x) => x.from === g.from && x.to === g.to,
                          )?.explanation || (
                            <span className="text-error">Not explained</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </Panel>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-2">
          <Panel title="Personal & offer details" icon="badge">
            <CandidateDetailsForm userId={id} record={rec} />
          </Panel>

          <Panel title="Recruitment steps" icon="flag">
            <Row
              label="Welcome video watched"
              value={formatDate(rec.welcomeWatchedAt)}
            />
            <Row
              label="Offer letter signed"
              value={
                rec.offerSignature ? (
                  <span className="flex flex-col items-end">
                    {rec.offerSignature.signedName},{" "}
                    {formatDate(rec.offerSignature.signedAt)}
                    <ResetOfferButton userId={id} />
                  </span>
                ) : null
              }
            />
            {rec.offerSignature?.signatureData && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={rec.offerSignature.signatureData}
                alt="Offer signature"
                className="ml-auto h-12 rounded bg-white px-2"
              />
            )}
            <Row
              label="Reference permission signed"
              value={
                rec.referencePermission
                  ? formatDate(rec.referencePermission.signedAt)
                  : null
              }
            />
            <Row
              label="DBS application (candidate)"
              value={formatDate(rec.dbsSubmittedAt)}
            />
          </Panel>

          <Panel title="Right to work" icon="public">
            <Row
              label="Nationality group"
              value={
                rec.rtwRoute === "british"
                  ? "British citizen"
                  : rec.rtwRoute === "rest_of_world"
                    ? "Rest of the world"
                    : null
              }
            />
            {rec.rtwRoute === "rest_of_world" && (
              <Row
                label="Share code"
                value={<span className="font-mono">{rec.shareCode}</span>}
              />
            )}
            <Row label="Details given" value={formatDate(rec.rtwSubmittedAt)} />
          </Panel>

          <Panel title="Driving for business" icon="directions_car">
            {rec.drivesForBusiness === null ? (
              <p className="text-sm text-on-surface-variant">
                Not answered yet.
              </p>
            ) : !rec.drivesForBusiness ? (
              <p className="text-sm text-on-surface-variant">
                Doesn&rsquo;t drive for work.
              </p>
            ) : (
              <>
                <Row label="Insurer" value={rec.driving?.insurer} />
                <Row label="Policy number" value={rec.driving?.policyNumber} />
                <Row
                  label="Insurance expiry"
                  value={formatDate(rec.driving?.insuranceExpiry)}
                />
                <Row
                  label="Business use cover"
                  value={rec.driving?.businessUseCover ? "Yes" : "No"}
                />
                <Row
                  label="Licence (last 8)"
                  value={
                    <span className="font-mono">
                      {rec.driving?.licenceLast8}
                    </span>
                  }
                />
                <Row
                  label="Check code (case sensitive)"
                  value={
                    <span className="font-mono">{rec.driving?.checkCode}</span>
                  }
                />
                <Row
                  label="Vehicle checklist"
                  value={`${rec.driving?.vehicleChecks.length ?? 0} items confirmed`}
                />
                <Row
                  label="Submitted"
                  value={formatDate(rec.drivingSubmittedAt)}
                />
                <a
                  href="https://www.gov.uk/check-driving-information"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-secondary"
                >
                  Check licence on gov.uk <Icon name="open_in_new" size={16} />
                </a>
              </>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
