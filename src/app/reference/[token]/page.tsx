import type { Metadata } from "next";
import { getReferenceByToken } from "@/lib/recruitment-data";
import { REFERENCE_KIND_LABEL } from "@/lib/recruitment";
import { Logo } from "@/components/ui/Logo";
import { Icon } from "@/components/ui/Icon";
import { RefereeForm } from "@/components/recruitment/RefereeForm";

export const metadata: Metadata = {
  title: "Reference request",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

/** Public page — referees complete a reference without an account. */
export default async function RefereePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const found = await getReferenceByToken(token);

  return (
    <div className="min-h-screen bg-background-soft">
      <header className="border-b border-outline-variant/50 bg-surface-container-lowest px-4 py-3 md:px-8">
        <Logo size="text-xl" href={null} />
      </header>
      <main className="mx-auto max-w-2xl px-4 py-8 md:py-12">
        {!found ? (
          <div className="rounded-xl bg-surface-container-lowest p-6 text-center journey-card-shadow">
            <Icon name="link_off" size={40} className="text-outline" />
            <p className="mt-2 text-lg font-black text-on-surface">
              This link isn&rsquo;t valid
            </p>
            <p className="mt-1 text-sm text-on-surface-variant">
              Please check you&rsquo;ve used the full link from your email, or
              reply to the email and we&rsquo;ll help.
            </p>
          </div>
        ) : found.reference.status === "received" ? (
          <div className="rounded-xl bg-success-green/10 p-6 text-center">
            <Icon name="task_alt" size={40} className="text-[#1b7a44]" />
            <p className="mt-2 text-lg font-black text-on-surface">
              Thank you — this reference has already been received.
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs font-bold uppercase tracking-widest text-secondary">
              {REFERENCE_KIND_LABEL[found.reference.kind]}
            </p>
            <h1 className="mt-1 text-3xl font-black text-on-surface">
              Reference for {found.candidateName}
            </h1>
            <p className="mt-2 text-on-surface-variant">
              {found.candidateName} has applied to work with PossAbilities CIC
              and has given permission for us to contact you. Thank you for
              taking a few minutes to help.
            </p>
            <div className="mt-8 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-5 journey-card-shadow md:p-8">
              <RefereeForm
                token={token}
                personal={found.reference.kind === "personal"}
                defaults={{
                  referee_name: found.reference.refereeName,
                  referee_position: found.reference.refereePosition,
                  organisation: found.reference.organisation,
                  phone: found.reference.refereePhone,
                  job_title: found.reference.candidateRole,
                  employed_from: found.reference.startMonth,
                  employed_to: found.reference.endMonth,
                }}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
