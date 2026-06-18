import type { ReactNode } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Chip } from "@/components/ui/Chip";
import { ButtonLink } from "@/components/ui/Button";
import { CompleteModuleButton } from "./CompleteModuleButton";
import { ContentBlocks } from "./ContentBlocks";
import { getBadges } from "@/lib/data";
import type { Module } from "@/lib/types";

export function ModuleScaffold({
  module,
  alreadyCompleted,
  prevSlug,
  nextSlug,
  stepLabel,
  hero,
  children,
}: {
  module: Module;
  alreadyCompleted: boolean;
  prevSlug: string | null;
  nextSlug: string | null;
  stepLabel: string;
  hero?: ReactNode;
  children: ReactNode;
}) {
  const badgeName = module.badgeId
    ? getBadges().find((b) => b.id === module.badgeId)?.name
    : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-8">
      <Link
        href="/journey"
        className="inline-flex items-center gap-1.5 text-sm font-bold text-on-surface-variant hover:text-secondary"
      >
        <Icon name="arrow_back" size={18} /> Back to Mission Path
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Chip tone="pink">{stepLabel}</Chip>
        {module.required && <Chip tone="neutral">Required</Chip>}
        <span className="flex items-center gap-1 text-xs font-bold text-on-surface-variant">
          <Icon name="schedule" size={16} /> {module.estMinutes} mins
        </span>
      </div>

      <h1 className="mt-3 text-3xl font-black text-on-surface md:text-4xl">
        {module.title}
      </h1>
      <p className="mt-2 max-w-2xl text-on-surface-variant">
        {module.description}
      </p>

      {hero && <div className="mt-6">{hero}</div>}

      {module.content?.length > 0 && (
        <div className="mt-8">
          <ContentBlocks blocks={module.content} />
        </div>
      )}

      <div className="mt-8">{children}</div>

      {/* Footer navigation */}
      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-outline-variant/50 pt-6">
        {prevSlug ? (
          <ButtonLink href={`/modules/${prevSlug}`} variant="outline" size="md">
            <Icon name="arrow_back" size={18} /> Previous
          </ButtonLink>
        ) : (
          <ButtonLink href="/journey" variant="ghost" size="md">
            <Icon name="map" size={18} /> Mission Path
          </ButtonLink>
        )}

        <CompleteModuleButton
          moduleId={module.id}
          rewardXp={module.rewardXp}
          badgeName={badgeName}
          nextSlug={nextSlug}
          alreadyCompleted={alreadyCompleted}
          label={`Complete & continue`}
        />
      </div>
    </div>
  );
}
