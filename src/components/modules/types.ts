import type { JourneyState, Module, Profile } from "@/lib/types";

export interface ModuleViewProps {
  module: Module;
  profile: Profile;
  alreadyCompleted: boolean;
  prevSlug: string | null;
  nextSlug: string | null;
  stepLabel: string;
}

export interface CertificateViewProps extends ModuleViewProps {
  journey: JourneyState;
}
