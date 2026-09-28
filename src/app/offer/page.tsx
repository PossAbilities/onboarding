import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import {
  getCandidateRecord,
  getRecruitmentSettings,
} from "@/lib/recruitment-data";
import { emptyRecord, renderOfferLetter } from "@/lib/recruitment";
import { DEMO_CANDIDATE_RECORDS } from "@/lib/seed";
import { isSupabaseConfigured } from "@/lib/config";
import { GateShell } from "@/components/recruitment/GateShell";
import { OfferSigner } from "@/components/recruitment/OfferSigner";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = { title: "Your conditional offer" };

export default async function OfferPage() {
  const profile = await requireProfile();
  const [record, settings] = await Promise.all([
    getCandidateRecord(profile.id),
    getRecruitmentSettings(),
  ]);
  const preview = profile.isAdmin && !record;
  if (!preview && !record) redirect("/home");
  if (!preview && !record!.welcomeWatchedAt) redirect("/welcome");

  // Admins preview the letter with sample details.
  const rec =
    record ??
    (isSupabaseConfigured
      ? {
          ...emptyRecord(profile.id),
          salary: "£24,500 per annum",
          contractHours: "37.5 hours per week",
        }
      : DEMO_CANDIDATE_RECORDS[0]);
  const html = renderOfferLetter(settings.offerLetterHtml, {
    fullName: profile.fullName,
    department: profile.department,
    roleTag: profile.roleTag,
    record: rec,
  });
  const signed = rec.offerSignature;

  return (
    <GateShell step={signed ? 3 : 2}>
      {preview && (
        <p className="mb-6 rounded-xl bg-primary-fixed/40 px-4 py-3 text-sm font-bold text-on-primary-fixed-variant">
          Admin preview — shown with sample details. Edit the wording in Admin →
          Recruitment Setup.
        </p>
      )}
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-secondary">
          {signed ? "Signed & accepted" : "Congratulations!"}
        </p>
        <h1 className="mt-2 text-3xl font-black text-on-surface md:text-4xl">
          Your conditional offer letter
        </h1>
        {!signed && (
          <p className="mx-auto mt-2 max-w-xl text-on-surface-variant">
            Please read your offer carefully, then sign at the bottom to accept.
          </p>
        )}
      </div>

      <article className="mt-8 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-6 journey-card-shadow md:p-10">
        <div
          className="letter text-on-surface"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <hr className="my-6 border-outline-variant/60" />
        <OfferSigner
          defaultName={profile.fullName}
          signature={signed}
          preview={preview}
        />
      </article>

      {signed && (
        <div className="mt-6 text-center">
          <ButtonLink href="/home">
            Go to my home page <Icon name="arrow_forward" size={18} />
          </ButtonLink>
        </div>
      )}
    </GateShell>
  );
}
