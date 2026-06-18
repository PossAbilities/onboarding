import {
  BADGES,
  BENEFITS,
  DEMO_STARTERS,
  DIRECTORS,
  EMAIL_TEMPLATES,
  IDEAS,
  INTEGRATIONS,
  LOCATIONS,
  MANAGERS,
  MODULES,
  PETS,
  SIGN_DOCUMENTS,
  VALUES,
} from "./seed";
import type {
  ApiKey,
  Badge,
  Benefit,
  CompanyValue,
  Director,
  DocumentSignature,
  EmailTemplate,
  Idea,
  InboundEvent,
  Integration,
  IntegrationDelivery,
  Invite,
  Location,
  Manager,
  Module,
  ModuleProgress,
  Pet,
  Profile,
  SignDocument,
  UserBadge,
} from "./types";

/**
 * In-memory store used in DEMO MODE (no Supabase configured). Persists for the
 * life of the server process — perfect for local development and a clickable
 * live preview. Real persistence is handled by Supabase once configured.
 *
 * Stored on globalThis so it survives Next.js dev hot-reloads.
 */
interface DemoState {
  progress: Record<string, ModuleProgress>; // keyed by moduleId, for the demo employee
  earnedBadges: UserBadge[];
  ideas: Idea[];
  invites: Invite[];
  starters: Profile[];
  easterEggs: string[];
  journeyPoints: number;
  // Full mutable working copy of the mission catalogue. The admin editor reads
  // and writes this directly, so missions are completely customisable in demo.
  modules: Module[];
  // Mutable content collections — fully editable from the admin Content Library.
  directors: Director[];
  benefits: Benefit[];
  pets: Pet[];
  locations: Location[];
  badges: Badge[];
  values: CompanyValue[];
  managers: Manager[];
  emailTemplates: EmailTemplate[];
  // Demo employee's uploaded profile photo (overrides the seed avatar).
  employeeAvatarUrl: string | null;
  // Demo employee's profile metadata (badge details, etc.).
  employeeMeta: Record<string, unknown>;
  documents: SignDocument[];
  signatures: DocumentSignature[]; // the demo employee's signatures
  integrations: Integration[];
  deliveries: IntegrationDelivery[];
  apiKeys: ApiKey[];
  inboundEvents: InboundEvent[];
}

function seedState(): DemoState {
  return {
    // Demo employee starts partway through: welcome done, culture in progress.
    progress: {
      "m-welcome": {
        moduleId: "m-welcome",
        status: "completed",
        completedAt: "2026-06-12T10:00:00Z",
        score: null,
      },
      "m-directors": {
        moduleId: "m-directors",
        status: "completed",
        completedAt: "2026-06-12T11:00:00Z",
        score: null,
      },
      "m-culture": {
        moduleId: "m-culture",
        status: "in_progress",
        completedAt: null,
        score: null,
      },
    },
    earnedBadges: [
      { badgeId: "first-contact", unlockedAt: "2026-06-12T10:00:00Z" },
    ],
    ideas: [...IDEAS],
    invites: [],
    starters: [...DEMO_STARTERS],
    easterEggs: [],
    journeyPoints: 850,
    // Deep clone so edits never mutate the seed constants.
    modules: MODULES.map((m) => ({
      ...m,
      content: m.content.map((b) => ({ ...b, items: b.items ? [...b.items] : undefined })),
    })),
    directors: DIRECTORS.map((d) => ({ ...d })),
    benefits: BENEFITS.map((b) => ({ ...b })),
    pets: PETS.map((p) => ({ ...p })),
    locations: LOCATIONS.map((l) => ({ ...l, services: [...l.services] })),
    badges: BADGES.map((b) => ({ ...b })),
    values: VALUES.map((v) => ({ ...v })),
    managers: MANAGERS.map((m) => ({ ...m })),
    emailTemplates: EMAIL_TEMPLATES.map((e) => ({ ...e })),
    employeeAvatarUrl: null,
    documents: SIGN_DOCUMENTS.map((d) => ({ ...d })),
    signatures: [],
    employeeMeta: {},
    integrations: INTEGRATIONS.map((i) => ({
      ...i,
      headers: i.headers.map((h) => ({ ...h })),
    })),
    deliveries: [],
    apiKeys: [],
    inboundEvents: [],
  };
}

const globalForDemo = globalThis as unknown as { __possDemo?: DemoState };

export function demoState(): DemoState {
  if (!globalForDemo.__possDemo) {
    globalForDemo.__possDemo = seedState();
  }
  return globalForDemo.__possDemo;
}

export function resetDemoState() {
  globalForDemo.__possDemo = seedState();
}
