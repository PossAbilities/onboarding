import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { getJourneyState, getModuleBySlug, getModules } from "@/lib/data";
import { statusFor } from "@/lib/journey";
import { WelcomeModule } from "@/components/modules/views/WelcomeModule";
import { DirectorsModule } from "@/components/modules/views/DirectorsModule";
import { CultureModule } from "@/components/modules/views/CultureModule";
import { BenefitsModule } from "@/components/modules/views/BenefitsModule";
import { BigIdeaModule } from "@/components/modules/views/BigIdeaModule";
import { PetsModule } from "@/components/modules/views/PetsModule";
import { LocationsModule } from "@/components/modules/views/LocationsModule";
import { CertificateModule } from "@/components/modules/views/CertificateModule";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const mod = await getModuleBySlug(slug);
  return { title: mod?.shortTitle ?? "Module" };
}

export default async function ModulePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const mod = await getModuleBySlug(slug);
  if (!mod) notFound();

  const profile = await requireProfile();
  const journey = await getJourneyState(profile);
  const status = statusFor(mod.id, journey.progress);
  if (status === "locked") redirect("/journey");

  const ordered = await getModules();
  const idx = ordered.findIndex((m) => m.id === mod.id);
  const prevSlug = idx > 0 ? ordered[idx - 1].slug : null;
  const nextSlug = idx < ordered.length - 1 ? ordered[idx + 1].slug : null;
  const alreadyCompleted = status === "completed";
  const stepLabel = `Step ${idx + 1} of ${ordered.length}`;

  const common = {
    module: mod,
    profile,
    alreadyCompleted,
    prevSlug,
    nextSlug,
    stepLabel,
  };

  switch (mod.kind) {
    case "video":
      return <WelcomeModule {...common} />;
    case "directors":
      return <DirectorsModule {...common} />;
    case "culture":
      return <CultureModule {...common} />;
    case "benefits":
      return <BenefitsModule {...common} />;
    case "bigidea":
      return <BigIdeaModule {...common} />;
    case "pets":
      return <PetsModule {...common} />;
    case "locations":
      return <LocationsModule {...common} />;
    case "certificate":
      return <CertificateModule {...common} journey={journey} />;
    default:
      return <BenefitsModule {...common} />;
  }
}
