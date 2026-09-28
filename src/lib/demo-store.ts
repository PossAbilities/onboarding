import {
  BADGES,
  BENEFITS,
  DEMO_ADMIN,
  DEMO_STARTERS,
  DEMO_USER,
  DIRECTORS,
  EMAIL_TEMPLATES,
  IDEAS,
  INTEGRATIONS,
  LOCATIONS,
  DEPARTMENTS,
  MANAGERS,
  MODULES,
  OFFICES,
  PETS,
  ROLE_TAGS,
  SIGN_DOCUMENTS,
  TESTIMONIALS,
  VALUES,
  VIDEOS,
  DEMO_CANDIDATE_RECORDS,
  DEMO_REFERENCES,
} from "./seed";
import type {
  CandidateRecord,
  CandidateReference,
  RecruitmentSettings,
} from "./recruitment";
import type {
  ApiKey,
  AppNotification,
  Badge,
  Benefit,
  Credential,
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
  StaffVideo,
  Testimonial,
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
  admins: Profile[];
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
  offices: string[];
  roles: string[];
  departments: string[];
  notifications: AppNotification[]; // the demo employee's notifications
  credentials: Credential[]; // the demo employee's saved logins (plain in demo)
  videos: StaffVideo[];
  testimonials: Testimonial[];
  // Recruitment / pre-employment onboarding, keyed by user id.
  candidateRecords: Record<string, CandidateRecord>;
  references: CandidateReference[];
  recruitmentSettings: RecruitmentSettings | null; // null → defaults
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
    // The demo employee is listed too, so admins can follow their recruitment record.
    starters: [{ ...DEMO_USER }, ...DEMO_STARTERS],
    admins: [{ ...DEMO_ADMIN }],
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
    offices: [...OFFICES],
    roles: [...ROLE_TAGS],
    departments: [...DEPARTMENTS],
    notifications: [
      {
        id: "n-welcome",
        title: "Welcome to PossAbilities! 💜",
        body: "Your induction journey is ready. Start with Mission 01.",
        icon: "celebration",
        href: "/journey",
        read: false,
        createdAt: "2026-06-12T09:00:00Z",
      },
      {
        id: "n-firstbadge",
        title: "Badge unlocked: First Contact",
        body: "You watched the welcome video. +50 XP!",
        icon: "workspace_premium",
        href: "/badges",
        read: false,
        createdAt: "2026-06-12T10:00:00Z",
      },
    ],
    credentials: [],
    videos: VIDEOS.map((v) => ({ ...v })),
    testimonials: TESTIMONIALS.map((t) => ({ ...t })),
    candidateRecords: Object.fromEntries(
      DEMO_CANDIDATE_RECORDS.map((r) => [r.userId, structuredClone(r)]),
    ),
    references: DEMO_REFERENCES.map((r) => structuredClone(r)),
    recruitmentSettings: null,
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
