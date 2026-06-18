import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Chip } from "@/components/ui/Chip";
import { CompleteModuleButton } from "../CompleteModuleButton";
import { CertificateActions } from "../CertificateActions";
import { getBadges } from "@/lib/data";
import type { CertificateViewProps } from "../types";

const VALUES = ["Passion", "Person Centred", "Integrity", "Creativity", "Happiness"];

export async function CertificateModule(props: CertificateViewProps) {
  const { module, profile, journey, alreadyCompleted } = props;
  const finished = journey.percentComplete >= 100 || alreadyCompleted;
  const serial = `PA-${new Date().getFullYear()}-${profile.id
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 4)
    .toUpperCase()}`;
  const badges = module.badgeId ? await getBadges() : [];
  const badgeName = module.badgeId
    ? badges.find((b) => b.id === module.badgeId)?.name
    : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-8">
      <div className="no-print flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/journey"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-on-surface-variant hover:text-secondary"
        >
          <Icon name="arrow_back" size={18} /> Back to Mission Path
        </Link>
        <CertificateActions employeeName={profile.fullName} />
      </div>

      {!finished && (
        <div className="no-print mt-4 flex items-center gap-2 rounded-lg border border-tertiary-fixed bg-tertiary-fixed/40 p-4 text-sm text-on-tertiary-fixed-variant">
          <Icon name="info" size={20} />
          Finish the remaining required missions to officially unlock your
          certificate. Here&rsquo;s a preview of what&rsquo;s waiting for you!
        </div>
      )}

      {/* Certificate */}
      <div className="print-area mt-6 overflow-hidden rounded-2xl border-4 border-primary-container bg-surface-container-lowest p-8 text-center journey-card-shadow md:p-12">
        <div className="flex items-center justify-between">
          <span className="text-sm font-black">
            <span className="text-brand-pink">Poss</span>
            <span className="text-primary-container">Abilities</span> Journey
          </span>
          <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Official Induction Record
          </span>
        </div>
        <div className="mt-1 h-1 w-24 rounded-full gradient-progress" />

        <h1 className="mt-8 text-4xl font-black text-secondary md:text-5xl">
          Congratulations!
        </h1>
        <p className="mt-3 text-on-surface-variant">
          This certificate is proudly awarded to
        </p>
        <p className="mx-auto mt-3 max-w-md border-b-2 border-dashed border-outline-variant pb-2 text-3xl font-black text-on-surface">
          {profile.fullName}
        </p>

        <p className="mx-auto mt-6 max-w-xl text-on-surface-variant">
          For successfully completing the{" "}
          <strong className="text-on-surface">PossAbilities Induction Journey</strong>{" "}
          and demonstrating our core values through every step of the mission path.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {VALUES.map((v) => (
            <Chip key={v} tone="purple">
              {v}
            </Chip>
          ))}
        </div>

        <div className="mx-auto mt-8 flex h-20 w-20 items-center justify-center rounded-full gradient-purple-pink text-on-primary">
          <Icon name="workspace_premium" size={40} fill />
        </div>

        <div className="mt-6 flex items-center justify-between text-xs text-on-surface-variant">
          <span>Issued {new Date().toLocaleDateString("en-GB")}</span>
          <span className="font-bold">No. {serial}</span>
        </div>
      </div>

      {/* Summit action */}
      <div className="no-print mt-8 rounded-xl bg-surface-container-low p-6">
        <h2 className="flex items-center gap-2 text-xl font-black text-on-surface">
          <Icon name="emoji_events" className="text-secondary" fill /> You&rsquo;ve
          reached the summit!
        </h2>
        <p className="mt-1 text-on-surface-variant">
          Your journey data syncs with the HR portal. Mark this final mission
          complete to lock in your{" "}
          <strong className="text-secondary">{badgeName}</strong> badge and{" "}
          +{module.rewardXp} XP.
        </p>
        <div className="mt-4">
          <CompleteModuleButton
            moduleId={module.id}
            rewardXp={module.rewardXp}
            badgeName={badgeName}
            nextSlug={null}
            alreadyCompleted={alreadyCompleted}
            label="Finalise & sign induction"
          />
        </div>
      </div>
    </div>
  );
}
